const db = require('../config/db');

const insertStmt = db.prepare(
  `INSERT INTO messages (room, username, text) VALUES (@room, @username, @text)`
);
const getByIdStmt = db.prepare(`SELECT * FROM messages WHERE id = ?`);
const historyStmt = db.prepare(
  `SELECT * FROM messages WHERE room = @room ORDER BY id ASC LIMIT @limit OFFSET @offset`
);
const countStmt = db.prepare(`SELECT COUNT(*) as count FROM messages WHERE room = ?`);

const Message = {
  create({ room = 'general', username, text }) {
    const info = insertStmt.run({ room, username, text });
    return getByIdStmt.get(info.lastInsertRowid);
  },

  getHistory({ room = 'general', limit = 100, offset = 0 }) {
    const rows = historyStmt.all({ room, limit, offset });
    const total = countStmt.get(room).count;
    return { messages: rows, total };
  },
};

module.exports = Message;
