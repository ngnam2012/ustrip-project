import cloudinary from '../config/cloudinary.js';
import { db } from '../config/db.js';
import { ApiError, asyncHandler, unwrap } from '../utils/api.js';

export const notifications = asyncHandler(async (req, res) => {
  res.json(unwrap(await db.from('notifications').select('*').eq('user_id', req.user.id).order('created_at', { ascending: false })));
});

export const readNotification = asyncHandler(async (req, res) => {
  res.json(unwrap(await db.from('notifications').update({ is_read: true }).eq('id', req.params.notificationId).eq('user_id', req.user.id).select('*').single()));
});

export const registerPushToken = asyncHandler(async (req, res) => {
  if (!/^(ExponentPushToken|ExpoPushToken)\[[^\]]+\]$/.test(req.body.token || '')) {
    throw new ApiError(422, 'A valid Expo push token is required');
  }
  const token = unwrap(await db.from('push_tokens').upsert({
    token: req.body.token,
    user_id: req.user.id,
    platform: req.body.platform || 'unknown',
    updated_at: new Date().toISOString()
  }, { onConflict: 'token' }).select('*').single());
  res.json(token);
});

export const removePushToken = asyncHandler(async (req, res) => {
  unwrap(await db.from('push_tokens').delete().eq('token', req.body.token).eq('user_id', req.user.id));
  res.status(204).end();
});

export const uploadImage = (kind) => asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(422, 'An image file is required');
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new ApiError(503, 'Cloudinary is not configured on the server');
  }
  const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  try {
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: `${process.env.CLOUDINARY_FOLDER || 'ustrip'}/${kind}`,
      resource_type: 'image', transformation: [{ width: 1800, height: 1800, crop: 'limit', quality: 'auto' }]
    });
    res.status(201).json({ url: result.secure_url, public_id: result.public_id });
  } catch (error) {
    if ([401, 403].includes(error.http_code)) {
      throw new ApiError(502, 'Cloudinary rejected the configured cloud name, API key, or API secret');
    }
    throw new ApiError(502, `Cloudinary upload failed: ${error.message}`);
  }
});
