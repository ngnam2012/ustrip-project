import { validationResult } from 'express-validator';
import { ApiError } from '../utils/api.js';

export function validate(req, _res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return next(new ApiError(422, errors.array().map((e) => e.msg).join(', ')));
  next();
}
