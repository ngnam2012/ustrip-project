import { db } from '../config/db.js';
import { asyncHandler, pick, unwrap } from '../utils/api.js';
import { refreshMemberContribution, refreshTripContributions } from '../services/fund.service.js';

export const getFund = asyncHandler(async (req, res) => {
  const fund = unwrap(await db.from('shared_funds').select('*').eq('trip_id', req.params.tripId).single());
  const contributions = unwrap(await db.from('fund_contributions').select('amount').eq('trip_id', req.params.tripId).eq('payment_status', 'success'));
  const expenses = unwrap(await db.from('expenses').select('amount').eq('trip_id', req.params.tripId).eq('payment_source', 'shared_fund'));
  const personalExpenses = unwrap(await db.from('expenses').select('amount').eq('trip_id', req.params.tripId).eq('payment_source', 'personal'));
  const total_collected = contributions.reduce((sum, item) => sum + Number(item.amount), 0);
  const fund_spent = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  const personal_spent = personalExpenses.reduce((sum, item) => sum + Number(item.amount), 0);
  res.json({
    ...fund, total_collected, fund_spent, personal_spent,
    total_trip_expenses: fund_spent + personal_spent,
    remaining_to_target: Math.max(0, Number(fund.target_amount) - total_collected),
    current_balance: total_collected - fund_spent
  });
});

export const updateFund = asyncHandler(async (req, res) => {
  const fund = unwrap(await db.from('shared_funds').update({ target_amount: req.body.target_amount }).eq('trip_id', req.params.tripId).select('*').single());
  await refreshTripContributions(req.params.tripId);
  res.json(fund);
});

export const listContributions = asyncHandler(async (req, res) => {
  res.json(unwrap(await db.from('fund_contributions').select('*,profile:profiles(id,full_name,email,avatar_url)').eq('trip_id', req.params.tripId).order('contributed_at', { ascending: false })));
});

export const addContribution = asyncHandler(async (req, res) => {
  const contribution = unwrap(await db.from('fund_contributions').insert({ ...pick(req.body, ['user_id', 'amount', 'payment_proof_url', 'note', 'contributed_at']), trip_id: req.params.tripId, payment_method: 'manual', payment_status: 'success', paid_at: new Date().toISOString() }).select('*').single());
  await refreshMemberContribution(req.params.tripId, contribution.user_id);
  res.status(201).json(contribution);
});

export const updateContribution = asyncHandler(async (req, res) => {
  const contribution = unwrap(await db.from('fund_contributions').update(pick(req.body, ['amount', 'payment_proof_url', 'note', 'contributed_at'])).eq('id', req.params.contributionId).select('*').single());
  await refreshMemberContribution(contribution.trip_id, contribution.user_id);
  res.json(contribution);
});
