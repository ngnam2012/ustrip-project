import { db } from '../config/db.js';
import { ApiError, asyncHandler, pick, unwrap } from '../utils/api.js';
import { notifyUser } from '../services/notifications.js';
import { refreshTripContributions } from '../services/fund.service.js';

const tripFields = ['name', 'destination', 'start_date', 'end_date', 'estimated_budget', 'description', 'cover_image_url'];

export const listTrips = asyncHandler(async (req, res) => {
  const memberships = unwrap(await db.from('trip_members').select('role,trip:trips(*,members:trip_members(count),fund:shared_funds(target_amount))').eq('user_id', req.user.id));
  res.json(memberships.map(({ role, trip }) => ({ ...trip, role })));
});

export const createTrip = asyncHandler(async (req, res) => {
  const payload = { ...pick(req.body, tripFields), created_by: req.user.id };
  const trip = unwrap(await db.from('trips').insert(payload).select('*').single());
  await Promise.all([
    db.from('trip_members').insert({ trip_id: trip.id, user_id: req.user.id, role: 'owner', contribution_status: 'unpaid' }),
    db.from('shared_funds').insert({ trip_id: trip.id, target_amount: trip.estimated_budget })
  ]);
  res.status(201).json(trip);
});

export const getTrip = asyncHandler(async (req, res) => {
  const trip = unwrap(await db.from('trips').select('*,members:trip_members(*,profile:profiles(id,email,full_name,avatar_url)),fund:shared_funds(*)').eq('id', req.params.tripId).single());
  res.json(trip);
});

export const updateTrip = asyncHandler(async (req, res) => {
  const trip = unwrap(await db.from('trips').update(pick(req.body, tripFields)).eq('id', req.params.tripId).select('*').single());
  res.json(trip);
});

export const deleteTrip = asyncHandler(async (req, res) => {
  unwrap(await db.from('trips').delete().eq('id', req.params.tripId));
  res.status(204).end();
});

export const listMembers = asyncHandler(async (req, res) => {
  const members = unwrap(await db.from('trip_members').select('*,profile:profiles(id,email,full_name,avatar_url,phone)').eq('trip_id', req.params.tripId).order('created_at'));
  res.json(members);
});

export const addMember = asyncHandler(async (req, res) => {
  const profile = unwrap(await db.from('profiles').select('id,email,full_name,avatar_url').eq('email', req.body.email.toLowerCase()).single());
  if (!profile) throw new ApiError(404, 'No registered user found with that email');
  const member = unwrap(await db.from('trip_members').insert({ trip_id: req.params.tripId, user_id: profile.id, role: req.body.role || 'member' }).select('*').single());
  await refreshTripContributions(req.params.tripId);
  await notifyUser(profile.id, req.params.tripId, 'member_added', 'Bạn đã được thêm vào chuyến đi', 'Mở UsTrip để xem kế hoạch mới.');
  res.status(201).json({ ...member, profile });
});

export const updateMember = asyncHandler(async (req, res) => {
  const changes = pick(req.body, ['role', 'contribution_status', 'paid_amount', 'remaining_amount']);
  const member = unwrap(await db.from('trip_members').update(changes).eq('trip_id', req.params.tripId).eq('user_id', req.params.userId).select('*').single());
  res.json(member);
});

export const removeMember = asyncHandler(async (req, res) => {
  if (req.params.userId === req.user.id) throw new ApiError(400, 'Trip owner cannot remove themselves');
  unwrap(await db.from('trip_members').delete().eq('trip_id', req.params.tripId).eq('user_id', req.params.userId));
  await refreshTripContributions(req.params.tripId);
  res.status(204).end();
});

export const createReminder = asyncHandler(async (req, res) => {
  const reminder = unwrap(await db.from('reminders').insert({
    trip_id: req.params.tripId, recipient_id: req.body.recipient_id, created_by: req.user.id,
    message: req.body.message || 'Nhắc bạn hoàn tất khoản đóng góp cho chuyến đi.'
  }).select('*').single());
  await notifyUser(reminder.recipient_id, req.params.tripId, 'contribution_reminder', 'Nhắc đóng góp', reminder.message);
  res.status(201).json(reminder);
});

export const listReminders = asyncHandler(async (req, res) => {
  res.json(unwrap(await db.from('reminders').select('*,recipient:profiles!recipient_id(id,full_name,email,avatar_url)').eq('trip_id', req.params.tripId).order('sent_at', { ascending: false })));
});
