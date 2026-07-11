const Message = require('../models/Message');

const onlineUsers = new Map();

function usersInRoom(room) {
  const seen = new Set();
  for (const info of onlineUsers.values()) {
    if (info.room === room) seen.add(info.username);
  }
  return Array.from(seen);
}

function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('user:join', ({ username, room = 'general' } = {}) => {
      if (!username || typeof username !== 'string' || !username.trim()) {
        socket.emit('error:message', 'A valid username is required to join.');
        return;
      }

      socket.data.username = username.trim();
      socket.data.room = room;
      onlineUsers.set(socket.id, { username: socket.data.username, room });

      socket.join(room);

      io.to(room).emit('users:online', usersInRoom(room));
      socket.to(room).emit('user:joined', { username: socket.data.username });
    });

    socket.on('message:send', ({ text, room = 'general' } = {}) => {
      try {
        const username = socket.data.username;
        if (!username) {
          socket.emit('error:message', 'You must join before sending messages.');
          return;
        }
        if (!text || typeof text !== 'string' || !text.trim()) {
          socket.emit('error:message', 'Message text cannot be empty.');
          return;
        }
        if (text.length > 2000) {
          socket.emit('error:message', 'Message exceeds max length of 2000 characters.');
          return;
        }

        const message = Message.create({ room, username, text: text.trim() });
        io.to(room).emit('message:new', message);
      } catch (err) {
        console.error('Error handling message:send:', err);
        socket.emit('error:message', 'Server failed to process your message.');
      }
    });

    socket.on('typing:start', ({ room = 'general' } = {}) => {
      if (!socket.data.username) return;
      socket.to(room).emit('typing:update', { username: socket.data.username, isTyping: true });
    });

    socket.on('typing:stop', ({ room = 'general' } = {}) => {
      if (!socket.data.username) return;
      socket.to(room).emit('typing:update', { username: socket.data.username, isTyping: false });
    });

    socket.on('disconnect', () => {
      const info = onlineUsers.get(socket.id);
      onlineUsers.delete(socket.id);

      if (info) {
        io.to(info.room).emit('users:online', usersInRoom(info.room));
        io.to(info.room).emit('user:left', { username: info.username });
      }
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}

module.exports = registerSocketHandlers;
