import { db } from '../config/db.js';
import { asyncHandler, unwrap } from '../utils/api.js';

export const financialSummary = asyncHandler(async (req, res) => {
  const [trip, fund, members, contributions, expenses] = await Promise.all([
    db.from('trips').select('estimated_budget').eq('id', req.params.tripId).single(),
    db.from('shared_funds').select('target_amount').eq('trip_id', req.params.tripId).single(),
    db.from('trip_members').select('*,profile:profiles(id,full_name,avatar_url)').eq('trip_id', req.params.tripId),
    db.from('fund_contributions').select('amount').eq('trip_id', req.params.tripId).eq('payment_status', 'success'),
    db.from('expenses').select('*,payer:profiles!paid_by(id,full_name)').eq('trip_id', req.params.tripId).order('expense_date', { ascending: false })
  ]);
  const expenseRows = unwrap(expenses);
  const total_collected = unwrap(contributions).reduce((sum, x) => sum + Number(x.amount), 0);
  const total_spent = expenseRows.reduce((sum, x) => sum + Number(x.amount), 0);
  const fund_spent = expenseRows.filter((x) => x.payment_source === 'shared_fund').reduce((sum, x) => sum + Number(x.amount), 0);
  const personal_spent = expenseRows.filter((x) => x.payment_source === 'personal').reduce((sum, x) => sum + Number(x.amount), 0);
  const by_category = expenseRows.reduce((result, x) => ({ ...result, [x.category]: (result[x.category] || 0) + Number(x.amount) }), {});
  const by_day = expenseRows.reduce((result, x) => ({ ...result, [x.expense_date]: (result[x.expense_date] || 0) + Number(x.amount) }), {});
  res.json({
    total_budget: Number(unwrap(trip).estimated_budget), total_shared_fund: Number(unwrap(fund).target_amount),
    total_collected, total_spent, fund_spent, personal_spent, remaining_fund: total_collected - fund_spent, by_category, by_day,
    members: unwrap(members), recent_expenses: expenseRows.slice(0, 5),
    unpaid_members: unwrap(members).filter((m) => m.contribution_status !== 'paid')
  });
});

export const dashboard = asyncHandler(async (req, res) => {
  const [trip, activities, expenses] = await Promise.all([
    db.from('trips').select('*,members:trip_members(count)').eq('id', req.params.tripId).single(),
    db.from('itinerary_activities').select('*').eq('trip_id', req.params.tripId).order('activity_date').order('start_time'),
    db.from('expenses').select('*').eq('trip_id', req.params.tripId).order('created_at', { ascending: false }).limit(5)
  ]);
  const activityRows = unwrap(activities);
  res.json({
    trip: unwrap(trip),
    upcoming_activities: activityRows.slice(0, 5),
    map_activities: activityRows,
    recent_expenses: unwrap(expenses)
  });
});
