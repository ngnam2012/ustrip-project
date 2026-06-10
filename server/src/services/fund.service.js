import { db } from '../config/db.js';

export async function refreshMemberContribution(tripId, userId) {
  const [{ data: contributions }, { data: fund }, { count }] = await Promise.all([
    db.from('fund_contributions').select('amount').eq('trip_id', tripId).eq('user_id', userId).eq('payment_status', 'success'),
    db.from('shared_funds').select('target_amount').eq('trip_id', tripId).single(),
    db.from('trip_members').select('*', { count: 'exact', head: true }).eq('trip_id', tripId)
  ]);
  const paid = (contributions || []).reduce((sum, item) => sum + Number(item.amount), 0);
  const expected = Number(fund?.target_amount || 0) / Math.max(count || 0, 1);
  const status = paid >= expected && expected > 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid';
  await db.from('trip_members').update({
    paid_amount: paid,
    remaining_amount: Math.max(0, expected - paid),
    contribution_status: status
  }).eq('trip_id', tripId).eq('user_id', userId);
}

export async function refreshTripContributions(tripId) {
  const { data: members } = await db.from('trip_members').select('user_id').eq('trip_id', tripId);
  await Promise.all((members || []).map((member) => refreshMemberContribution(tripId, member.user_id)));
}
