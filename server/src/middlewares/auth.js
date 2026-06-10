import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';
import { ApiError, asyncHandler } from '../utils/api.js';

export const authenticate = asyncHandler(async (req, _res, next) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) throw new ApiError(401, 'Authentication required');
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'development-only-secret');
    const { data: user } = await db.from('profiles').select('id,email,full_name,avatar_url,phone').eq('id', payload.sub).single();
    if (!user) throw new Error('User not found');
    req.user = user;
    next();
  } catch {
    throw new ApiError(401, 'Invalid or expired token');
  }
});

export const requireTripMember = asyncHandler(async (req, _res, next) => {
  const tripId = req.params.tripId || req.body.trip_id;
  const { data } = await db.from('trip_members').select('role').eq('trip_id', tripId).eq('user_id', req.user.id).single();
  if (!data) throw new ApiError(403, 'You are not a member of this trip');
  req.tripRole = data.role;
  next();
});

export const requireTripOwner = [requireTripMember, (req, _res, next) => {
  if (req.tripRole !== 'owner') return next(new ApiError(403, 'Only the trip owner can perform this action'));
  next();
}];

const resourceMember = (table, param, relation = 'trip_id') => asyncHandler(async (req, _res, next) => {
  const { data: resource } = await db.from(table).select(relation).eq('id', req.params[param]).single();
  if (!resource) throw new ApiError(404, 'Resource not found');
  const tripId = resource[relation];
  const { data: membership } = await db.from('trip_members').select('role').eq('trip_id', tripId).eq('user_id', req.user.id).single();
  if (!membership) throw new ApiError(403, 'You are not a member of this trip');
  req.tripRole = membership.role;
  next();
});

export const requireActivityMember = resourceMember('itinerary_activities', 'activityId');
export const requireExpenseMember = resourceMember('expenses', 'expenseId');
export const requireContributionMember = resourceMember('fund_contributions', 'contributionId');
export const requireSplitMember = asyncHandler(async (req, _res, next) => {
  const { data: split } = await db.from('expense_splits').select('expense:expenses(trip_id)').eq('id', req.params.splitId).single();
  const tripId = split?.expense?.trip_id;
  const { data: membership } = await db.from('trip_members').select('role').eq('trip_id', tripId).eq('user_id', req.user.id).single();
  if (!membership) throw new ApiError(403, 'You are not a member of this trip');
  next();
});
