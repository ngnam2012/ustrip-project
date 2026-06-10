import { db } from '../config/db.js';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const PUSH_BATCH_SIZE = 100;

function batches(items, size = PUSH_BATCH_SIZE) {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, (index + 1) * size));
}

async function sendExpoPush(notifications) {
  if (!notifications.length) return;

  const userIds = [...new Set(notifications.map(({ user_id }) => user_id))];
  const { data: tokens, error } = await db.from('push_tokens').select('token,user_id').in('user_id', userIds);
  if (error) {
    console.error('Cannot load push tokens:', error.message);
    return;
  }

  const notificationsByUser = notifications.reduce((result, notification) => {
    result.set(notification.user_id, [...(result.get(notification.user_id) || []), notification]);
    return result;
  }, new Map());
  const messages = (tokens || []).flatMap(({ token, user_id }) => (notificationsByUser.get(user_id) || []).map((notification) => ({
      to: token,
      sound: 'default',
      title: notification.title,
      body: notification.message,
      priority: 'high',
      channelId: 'default',
      data: {
        notificationId: notification.id,
        tripId: notification.trip_id,
        type: notification.type
      }
    })));

  for (const batch of batches(messages)) {
    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.EXPO_ACCESS_TOKEN ? { Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` } : {})
        },
        body: JSON.stringify(batch)
      });
      if (!response.ok) console.error('Expo push request failed:', response.status, await response.text());
    } catch (error) {
      // Creating the in-app notification must still succeed if Expo Push is temporarily unavailable.
      console.error('Expo push delivery failed:', error.message);
    }
  }
}

export async function notifyUsers(payloads) {
  if (!payloads.length) return [];
  const { data, error } = await db.from('notifications').insert(payloads).select('*');
  if (error) throw error;
  await sendExpoPush(data || []);
  return data || [];
}

export async function notifyUser(userId, tripId, type, title, message) {
  const [notification] = await notifyUsers([{ user_id: userId, trip_id: tripId, type, title, message }]);
  return notification;
}

export async function notifyTripMembers(tripId, actorId, type, title, message) {
  const { data: members, error } = await db.from('trip_members').select('user_id').eq('trip_id', tripId).neq('user_id', actorId);
  if (error) throw error;
  return notifyUsers((members || []).map(({ user_id }) => ({ user_id, trip_id: tripId, type, title, message })));
}
