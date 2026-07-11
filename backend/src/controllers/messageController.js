const Message = require('../models/Message');

function getMessages(req, res) {
  try {
    const room = req.query.room || 'general';
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const offset = parseInt(req.query.offset, 10) || 0;

    const { messages, total } = Message.getHistory({ room, limit, offset });
    res.status(200).json({ success: true, room, total, messages });
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch chat history' });
  }
}

function createMessage(req, res) {
  try {
    const { username, text, room = 'general' } = req.body;

    if (!username || typeof username !== 'string' || !username.trim()) {
      return res.status(400).json({ success: false, error: 'username is required' });
    }
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ success: false, error: 'text is required' });
    }
    if (text.length > 2000) {
      return res.status(400).json({ success: false, error: 'text exceeds max length of 2000 characters' });
    }

    const message = Message.create({ room, username: username.trim(), text: text.trim() });

    const io = req.app.get('io');
    if (io) {
      io.to(room).emit('message:new', message);
    }

    res.status(201).json({ success: true, message });
  } catch (err) {
    console.error('Error creating message:', err);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
}

module.exports = { getMessages, createMessage };
