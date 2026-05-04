const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const studentRoutes = require('./routes/studentRoutes');

const setupSwagger = require('./configs/swagger');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', teacherRoutes);
app.use('/api/student', studentRoutes);

setupSwagger(app);

app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint không tồn tại' });
});

app.use(errorHandler);

module.exports = app;
