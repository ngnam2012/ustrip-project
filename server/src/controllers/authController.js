import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';
import { ApiError, asyncHandler, pick, unwrap } from '../utils/api.js';

const publicFields = 'id,email,full_name,avatar_url,phone,created_at';
const signToken = (id) => jwt.sign({ sub: id }, process.env.JWT_SECRET || 'development-only-secret', {
  expiresIn: process.env.JWT_EXPIRES_IN || '7d'
});

export const register = asyncHandler(async (req, res) => {
  const { email, password, full_name } = req.body;
  const existing = unwrap(await db.from('profiles').select('id').eq('email', email.toLowerCase()));
  if (existing.length) throw new ApiError(409, 'Email is already registered');
  const password_hash = await bcrypt.hash(password, 12);
  const user = unwrap(await db.from('profiles').insert({ email: email.toLowerCase(), password_hash, full_name }).select(publicFields).single());
  res.status(201).json({ token: signToken(user.id), user });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { data: user, error } = await db.from('profiles').select('*').eq('email', email.toLowerCase()).maybeSingle();
  if (error) throw new ApiError(400, error.message);
  if (!user || !(await bcrypt.compare(password, user.password_hash))) throw new ApiError(401, 'Invalid email or password');
  delete user.password_hash;
  res.json({ token: signToken(user.id), user });
});

export const me = asyncHandler(async (req, res) => res.json(req.user));

export const updateProfile = asyncHandler(async (req, res) => {
  const changes = pick(req.body, ['full_name', 'avatar_url', 'phone']);
  const user = unwrap(await db.from('profiles').update(changes).eq('id', req.user.id).select(publicFields).single());
  res.json(user);
});
