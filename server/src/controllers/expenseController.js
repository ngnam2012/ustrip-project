import { db } from '../config/db.js';
import { ApiError, asyncHandler, pick, unwrap } from '../utils/api.js';
import { notifyTripMembers } from '../services/notifications.js';

const fields = ['title', 'amount', 'category', 'payment_source', 'paid_by', 'related_activity_id', 'split_method', 'bill_image_url', 'note', 'expense_date'];

async function assertPersonalPayer(tripId, payerId) {
  const { data } = await db.from('trip_members').select('id').eq('trip_id', tripId).eq('user_id', payerId).single();
  if (!data) throw new ApiError(422, 'Personal expense payer must be a member of the trip');
}

async function normalizeParticipants(tripId, participants) {
  if (!Array.isArray(participants) || !participants.length) {
    throw new ApiError(422, 'Select at least one person this expense was paid for');
  }
  const uniqueIds = [...new Set(participants.filter(Boolean))];
  if (!uniqueIds.length) throw new ApiError(422, 'Select at least one person this expense was paid for');
  const members = unwrap(await db.from('trip_members').select('user_id').eq('trip_id', tripId).in('user_id', uniqueIds));
  if (members.length !== uniqueIds.length) throw new ApiError(422, 'Every selected person must be a member of the trip');
  return uniqueIds;
}

async function availableFundBalance(tripId, excludingExpenseId) {
  const [contributions, fundExpenses] = await Promise.all([
    db.from('fund_contributions').select('amount').eq('trip_id', tripId).eq('payment_status', 'success'),
    db.from('expenses').select('id,amount').eq('trip_id', tripId).eq('payment_source', 'shared_fund')
  ]);
  const collected = unwrap(contributions).reduce((sum, item) => sum + Number(item.amount), 0);
  const spent = unwrap(fundExpenses)
    .filter((item) => item.id !== excludingExpenseId)
    .reduce((sum, item) => sum + Number(item.amount), 0);
  return collected - spent;
}

async function normalizeExpensePayload(req, existing) {
  const payload = pick(req.body, fields);
  const paymentSource = payload.payment_source || existing?.payment_source || 'personal';
  const amount = Number(payload.amount ?? existing?.amount);
  if (paymentSource === 'shared_fund') {
    if (req.tripRole !== 'owner') throw new ApiError(403, 'Only the trip owner can record an expense paid from the shared fund');
    const balance = await availableFundBalance(existing?.trip_id || req.params.tripId, existing?.id);
    if (amount > balance) throw new ApiError(422, `Shared fund balance is only ${balance.toLocaleString('vi-VN')} VND`);
    return { ...payload, payment_source: 'shared_fund', paid_by: null };
  }
  const payerId = payload.paid_by || existing?.paid_by || req.user.id;
  await assertPersonalPayer(existing?.trip_id || req.params.tripId, payerId);
  return { ...payload, payment_source: 'personal', paid_by: payerId };
}

async function saveParticipants(expenseId, participants = []) {
  await db.from('expense_participants').delete().eq('expense_id', expenseId);
  if (participants.length) unwrap(await db.from('expense_participants').insert(participants.map((user_id) => ({ expense_id: expenseId, user_id }))));
}

export const listExpenses = asyncHandler(async (req, res) => {
  res.json(unwrap(await db.from('expenses').select('*,payer:profiles!paid_by(id,full_name,avatar_url),activity:itinerary_activities(id,title),participants:expense_participants(user_id)').eq('trip_id', req.params.tripId).order('expense_date', { ascending: false })));
});

export const createExpense = asyncHandler(async (req, res) => {
  const payload = await normalizeExpensePayload(req);
  const participantIds = payload.payment_source === 'personal'
    ? await normalizeParticipants(req.params.tripId, req.body.participants)
    : [];
  const expense = unwrap(await db.from('expenses').insert({ ...payload, trip_id: req.params.tripId }).select('*').single());
  if (expense.payment_source === 'personal') await saveParticipants(expense.id, participantIds);
  await notifyTripMembers(req.params.tripId, req.user.id, 'new_expense', 'Chi tiêu mới', `${expense.title}: ${expense.amount} (${expense.payment_source === 'shared_fund' ? 'chi từ quỹ chung' : 'thành viên trả hộ'})`);
  res.status(201).json(expense);
});

export const getExpense = asyncHandler(async (req, res) => {
  res.json(unwrap(await db.from('expenses').select('*,payer:profiles!paid_by(id,full_name,avatar_url),activity:itinerary_activities(id,title),participants:expense_participants(user_id,profile:profiles(id,full_name,avatar_url)),splits:expense_splits(*,profile:profiles(id,full_name,avatar_url))').eq('id', req.params.expenseId).single()));
});

export const updateExpense = asyncHandler(async (req, res) => {
  const existing = unwrap(await db.from('expenses').select('*').eq('id', req.params.expenseId).single());
  const payload = await normalizeExpensePayload(req, existing);
  const participantIds = payload.payment_source === 'personal' && (req.body.participants || existing.payment_source !== 'personal')
    ? await normalizeParticipants(existing.trip_id, req.body.participants)
    : null;
  const expense = unwrap(await db.from('expenses').update(payload).eq('id', req.params.expenseId).select('*').single());
  if (expense.payment_source === 'shared_fund') {
    await Promise.all([
      db.from('expense_participants').delete().eq('expense_id', expense.id),
      db.from('expense_splits').delete().eq('expense_id', expense.id)
    ]);
  } else {
    if (participantIds) await saveParticipants(expense.id, participantIds);
    if (participantIds || payload.amount !== undefined) await db.from('expense_splits').delete().eq('expense_id', expense.id);
  }
  res.json(expense);
});

export const deleteExpense = asyncHandler(async (req, res) => {
  unwrap(await db.from('expenses').delete().eq('id', req.params.expenseId));
  res.status(204).end();
});

export const splitExpense = asyncHandler(async (req, res) => {
  const expense = unwrap(await db.from('expenses').select('amount,trip_id,payment_source,participants:expense_participants(user_id)').eq('id', req.params.expenseId).single());
  if (expense.payment_source === 'shared_fund') throw new ApiError(422, 'Expenses paid from the shared fund do not create personal debt');
  const participantIds = expense.participants.map((p) => p.user_id);
  if (!participantIds.length) throw new ApiError(422, 'At least one participant is required');
  const base = Math.floor(Number(expense.amount) * 100 / participantIds.length) / 100;
  const splits = participantIds.map((user_id, index) => ({
    expense_id: req.params.expenseId, user_id,
    amount_owed: index === participantIds.length - 1 ? Number(expense.amount) - base * (participantIds.length - 1) : base
  }));
  await db.from('expense_splits').delete().eq('expense_id', req.params.expenseId);
  res.status(201).json(unwrap(await db.from('expense_splits').insert(splits).select('*')));
});

export const settlements = asyncHandler(async (req, res) => {
  const expenses = unwrap(await db.from('expenses').select('id,title,amount,paid_by,payer:profiles!paid_by(id,full_name),splits:expense_splits(*,profile:profiles(id,full_name))').eq('trip_id', req.params.tripId).eq('payment_source', 'personal'));
  res.json(expenses.flatMap((expense) => expense.splits.filter((split) => split.user_id !== expense.paid_by).map((split) => ({
    ...split, expense_title: expense.title, owed_to: expense.payer
  }))));
});

export const settleSplit = asyncHandler(async (req, res) => {
  const settled = req.body.is_settled ?? true;
  res.json(unwrap(await db.from('expense_splits').update({ is_settled: settled, settled_at: settled ? new Date().toISOString() : null }).eq('id', req.params.splitId).select('*').single()));
});
