// Re-export pool từ db layer để các controllers dùng '../config/db' vẫn hoạt động
// location: backend/src/config/db.js
const pool = require('../db/db');
module.exports = pool;