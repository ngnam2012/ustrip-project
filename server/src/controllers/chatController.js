import { db } from '../config/db.js';
import { asyncHandler, unwrap } from '../utils/api.js';
import { getIO } from '../socket.js';

export const getMessages = asyncHandler(async (req, res) => {
  const messages = unwrap(await db.from('trip_messages')
    .select('*')
    .eq('trip_id', req.params.tripId)
    .order('created_at', { ascending: true }));
    
  if (messages.length > 0) {
    const userIds = [...new Set(messages.map(m => m.user_id))];
    const profiles = unwrap(await db.from('profiles').select('id, full_name, avatar_url').in('id', userIds));
    const profileMap = profiles.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
    messages.forEach(m => {
      m.sender = profileMap[m.user_id] || { full_name: 'Unknown' };
    });
  }
  
  res.json(messages);
});

export const sendMessage = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ message: 'Content is required' });
  }

  const message = unwrap(await db.from('trip_messages').insert({
    trip_id: req.params.tripId,
    user_id: req.user.id,
    content: content.trim()
  }).select('*').single());

  const sender = unwrap(await db.from('profiles').select('id, full_name, avatar_url').eq('id', req.user.id).single());
  message.sender = sender;

  // Emit to socket room
  try {
    const io = getIO();
    io.to(`trip_${req.params.tripId}`).emit('new_message', message);
  } catch (e) {
    console.error('Socket.io error emitting message:', e);
  }

  res.status(201).json(message);
});
