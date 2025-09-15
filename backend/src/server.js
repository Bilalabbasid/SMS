const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Import middleware
const { requestLogger, errorLogger, logger } = require('./middleware/logging');
const { generalLimiter, authLimiter, uploadLimiter } = require('./middleware/rateLimiting');

const app = express();
const server = createServer(app);

// Socket.IO setup with enhanced configuration
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Import routes
const apiRoutes = require('./routes');

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

app.use(compression({
  level: 6,
  threshold: 1024
}));

// Sanitize data to prevent NoSQL injection
app.use(mongoSanitize({
  replaceWith: '_'
}));

// Request logging
app.use(requestLogger);

// Rate limiting with different limits for different routes
app.use('/api/auth', authLimiter);
app.use('/api/uploads', uploadLimiter);
app.use(generalLimiter);

// CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    // Allowlist comes from ALLOWED_ORIGINS or FALLBACK to FRONTEND_URL for development
    const raw = process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || '';
    const allowedOrigins = raw.split(',').map(o => o.trim()).filter(Boolean);

    // If no origins configured, allow all (useful for local development)
    if (allowedOrigins.length === 0) {
      return callback(null, true);
    }

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Body parsing with size limits
app.use(express.json({ 
  limit: process.env.MAX_JSON_SIZE || '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: process.env.MAX_URL_ENCODED_SIZE || '10mb' 
}));

// Static files with proper headers
app.use('/uploads', express.static('uploads', {
  maxAge: '1y',
  etag: true,
  lastModified: true
}));

// Database connection with enhanced options
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      // Disable mongoose buffering in modern drivers using unified topology
      autoCreate: true
    });
    
    logger.info('MongoDB Connected', {
      host: conn.connection.host,
      port: conn.connection.port,
      database: conn.connection.name
    });
  } catch (error) {
    logger.error('MongoDB connection error', { error: error.message });
    process.exit(1);
  }
};

connectDB();

// Enhanced Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info('Socket connection established', { socketId: socket.id });
  
  // Handle room joining
  socket.on('join_room', (data) => {
    const { roomId, userRole, userId } = data;
    socket.join(roomId);
    logger.info('User joined room', { 
      socketId: socket.id, 
      roomId, 
      userRole, 
      userId 
    });
  });
  
  // Handle authentication
  socket.on('authenticate', (token) => {
    // Implement JWT verification for socket connections
    // This would verify the token and store user info in socket
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      logger.info('Socket authenticated', { 
        socketId: socket.id, 
        userId: decoded.id, 
        userRole: decoded.role 
      });
    } catch (error) {
      logger.warn('Socket authentication failed', { 
        socketId: socket.id, 
        error: error.message 
      });
      socket.emit('auth_error', 'Invalid token');
    }
  });
  
  // Handle notifications
  socket.on('mark_notification_read', (notificationId) => {
    // Implement notification marking logic
    logger.info('Notification marked as read', { 
      socketId: socket.id, 
      notificationId 
    });
  });
  
  socket.on('disconnect', (reason) => {
    logger.info('Socket disconnected', { 
      socketId: socket.id, 
      reason,
      userId: socket.userId 
    });
  });
  
  socket.on('error', (error) => {
    logger.error('Socket error', { 
      socketId: socket.id, 
      error: error.message 
    });
  });
});

// Make io accessible to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// API routes
app.use('/api', apiRoutes);

// Health check with detailed information
app.get('/health', (req, res) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version,
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    memory: process.memoryUsage()
  };
  
  res.status(200).json(healthCheck);
});

// API documentation endpoint (placeholder)
app.get('/api/docs', (req, res) => {
  res.status(200).json({
    message: 'API Documentation',
    version: '1.0.0',
    baseUrl: `${req.protocol}://${req.get('host')}/api`,
    endpoints: {
      authentication: '/api/auth',
      users: '/api/users',
      students: '/api/students',
      teachers: '/api/teachers',
      classes: '/api/classes',
      subjects: '/api/subjects',
      reports: '/api/reports'
    },
    documentation: 'https://docs.schoolmanagement.com'
  });
});

// 404 handler
app.use('*', (req, res) => {
  logger.warn('Route not found', { 
    method: req.method, 
    url: req.originalUrl, 
    ip: req.ip 
  });
  res.status(404).json({ 
    success: false,
    message: 'Route not found',
    requestedUrl: req.originalUrl 
  });
});

// Enhanced error handling
app.use(errorLogger);
app.use((err, req, res, next) => {
  // Default error status
  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    status = 400;
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message,
      value: e.value
    }));
    return res.status(status).json({
      success: false,
      message: 'Validation Error',
      errors
    });
  }
  
  if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid ID format';
  }
  
  if (err.code === 11000) {
    status = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already exists`;
  }
  
  if (err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Invalid token';
  }
  
  if (err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Token expired';
  }
  
  // Log error based on severity
  if (status >= 500) {
    logger.error('Server Error', { error: err, request: req.originalUrl });
  } else if (status >= 400) {
    logger.warn('Client Error', { error: err.message, request: req.originalUrl });
  }
  
  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err 
    })
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(async () => {
    logger.info('Server closed');
    try {
      await mongoose.connection.close(false);
      logger.info('MongoDB connection closed');
      process.exit(0);
    } catch (err) {
      logger.error('Error closing MongoDB connection', { error: err });
      process.exit(1);
    }
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  server.close(async () => {
    logger.info('Server closed');
    try {
      await mongoose.connection.close(false);
      logger.info('MongoDB connection closed');
      process.exit(0);
    } catch (err) {
      logger.error('Error closing MongoDB connection', { error: err });
      process.exit(1);
    }
  });
});

// Unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection', { error: err });
  server.close(() => {
    process.exit(1);
  });
});

// Uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { error: err });
  process.exit(1);
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  logger.info('Server started', {
    port: PORT,
    environment: process.env.NODE_ENV,
    nodeVersion: process.version,
    pid: process.pid
  });
});

module.exports = { app, server, io };