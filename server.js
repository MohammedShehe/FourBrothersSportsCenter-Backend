// server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');

dotenv.config();
const app = express();

// ----------------- Enhanced CORS Configuration -----------------
const corsOptions = {
  origin: [
    'http://127.0.0.1:5500',      // VS Code Live Server
    'http://localhost:5500',       // VS Code Live Server alternative
    'http://localhost:3000',       // React development server
    'http://127.0.0.1:3000',       // React development server alternative
    'http://localhost:5173',       // Vite development server
    'http://127.0.0.1:5173',       // Vite development server alternative
    'http://localhost:8080',       // Alternative port
    'https://api.fourbrothers.online',  // Your API domain
    'https://www.fourbrothers.online',  // Your main domain
    'https://fourbrothers.online'       // Your main domain without www
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Allow-Headers',
    'Access-Control-Request-Headers',
    'Access-Control-Allow-Origin'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400 // 24 hours
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests for all routes
app.options('*', cors(corsOptions));

// ----------------- Middlewares -----------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Add security headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', corsOptions.origin.includes(req.headers.origin) ? req.headers.origin : corsOptions.origin[0]);
  res.header('Access-Control-Allow-Methods', corsOptions.methods.join(','));
  res.header('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(','));
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', corsOptions.maxAge.toString());
  
  // Additional security headers
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  
  next();
});

// ----------------- Routes -----------------
const customerRoutes = require('./routes/customerRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/customers', customerRoutes);
app.use('/api/admin', adminRoutes);

// ----------------- Health Check -----------------
app.get('/', (req, res) => {
  res.json({ 
    message: '✅ Four Brothers Sports Center API is up and running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Status Endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'operational',
    serverTime: new Date().toISOString(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage()
  });
});

// ----------------- 404 Handler -----------------
app.use((req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// ----------------- Global Error Handler -----------------
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  
  // Handle CORS errors specifically
  if (err.name === 'CorsError') {
    return res.status(403).json({ 
      message: 'CORS Error: Access forbidden',
      error: 'Cross-origin request blocked',
      origin: req.headers.origin,
      allowedOrigins: corsOptions.origin
    });
  }
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ 
      message: 'Invalid token',
      error: 'Authentication failed'
    });
  }
  
  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      message: 'Validation error',
      error: err.message,
      details: err.errors
    });
  }
  
  // Generic error response
  res.status(500).json({ 
    message: 'Server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// ----------------- Start Server -----------------
const PORT = process.env.PORT;
const HOST = process.env.HOST;

app.listen(PORT, HOST, () => {
  console.log(`🚀 Server listening on http://${HOST}:${PORT}`);
  console.log(`📡 CORS enabled for origins: ${corsOptions.origin.join(', ')}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});