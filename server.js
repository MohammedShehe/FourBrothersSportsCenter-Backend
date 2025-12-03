// server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');

dotenv.config();
const app = express();

// ----------------- Middlewares -----------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ----------------- Routes -----------------
const customerRoutes = require('./routes/customerRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/customers', customerRoutes);
app.use('/api/admin', adminRoutes);

// ----------------- Health Check -----------------
app.get('/', (req, res) => {
  res.json({ message: '✅ Four Brothers Sports Center API is up and running' });
});

// ----------------- 404 Handler -----------------
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ----------------- Global Error Handler -----------------
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({ message: 'Server error', error: err.message });
});



// ----------------- Start Server -----------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});