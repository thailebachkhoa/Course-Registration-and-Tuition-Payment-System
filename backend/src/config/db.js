// Re-export pool từ db layer để các controllers dùng '../config/db' vẫn hoạt động
const pool = require('../db/db');
module.exports = pool;