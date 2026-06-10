import { db } from '../config/db.js';
import { asyncHandler, pick, unwrap } from '../utils/api.js';
import { notifyTripMembers } from '../services/notifications.js';

const fields = ['title', 'activity_date', 'start_time', 'end_time', 'location', 'location_name', 'address', 'latitude', 'longitude', 'place_id', 'map_provider', 'estimated_cost', 'notes'];

async function saveParticipants(activityId, participants = []) {
  await db.from('activity_participants').delete().eq('activity_id', activityId);
  if (participants.length) await db.from('activity_participants').insert(participants.map((user_id) => ({ activity_id: activityId, user_id })));
}

export const listActivities = asyncHandler(async (req, res) => {
  res.json(unwrap(await db.from('itinerary_activities').select('*,participants:activity_participants(user_id,profile:profiles(id,full_name,avatar_url)),expenses(id,title,amount)').eq('trip_id', req.params.tripId).order('activity_date').order('start_time')));
});

export const createActivity = asyncHandler(async (req, res) => {
  const activity = unwrap(await db.from('itinerary_activities').insert({ ...pick(req.body, fields), trip_id: req.params.tripId, created_by: req.user.id }).select('*').single());
  await saveParticipants(activity.id, req.body.participants);
  await notifyTripMembers(req.params.tripId, req.user.id, 'itinerary_update', 'Lịch trình mới', activity.title);
  res.status(201).json(activity);
});

export const getActivity = asyncHandler(async (req, res) => {
  res.json(unwrap(await db.from('itinerary_activities').select('*,participants:activity_participants(user_id,profile:profiles(id,full_name,avatar_url)),expenses(*)').eq('id', req.params.activityId).single()));
});

export const updateActivity = asyncHandler(async (req, res) => {
  const activity = unwrap(await db.from('itinerary_activities').update(pick(req.body, fields)).eq('id', req.params.activityId).select('*').single());
  if (req.body.participants) await saveParticipants(activity.id, req.body.participants);
  res.json(activity);
});

export const deleteActivity = asyncHandler(async (req, res) => {
  unwrap(await db.from('itinerary_activities').delete().eq('id', req.params.activityId));
  res.status(204).end();
});
