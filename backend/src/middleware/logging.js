const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Console format
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.simple(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return `${timestamp} [${level}]: ${message} ${
      Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
    }`;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'sms-api' },
  transports: [
    // Error logs
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      handleExceptions: true,
      handleRejections: true,
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true
    }),
    
    // Combined logs
    new DailyRotateFile({
      filename: path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true
    }),
    
    // Access logs
    new DailyRotateFile({
      filename: path.join(logsDir, 'access-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'http',
      maxSize: '20m',
      maxFiles: '30d',
      zippedArchive: true
    })
  ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    level: 'debug'
  }));
}

// Request logging middleware
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log incoming request
  logger.http('Incoming Request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    userRole: req.user?.role,
    timestamp: new Date().toISOString()
  });
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'http';
    
    logger.log(logLevel, 'Request Completed', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${duration}ms`,
      ip: req.ip,
      userId: req.user?.id,
      userRole: req.user?.role,
      timestamp: new Date().toISOString()
    });
  });
  
  next();
};

// Error logging middleware
const errorLogger = (err, req, res, next) => {
  logger.error('Application Error', {
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      userRole: req.user?.role
    },
    timestamp: new Date().toISOString()
  });
  
  next(err);
};

// Authentication logging
const authLogger = (event, req, details = {}) => {
  logger.info('Authentication Event', {
    event,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    email: req.body?.email,
    userId: req.user?.id,
    userRole: req.user?.role,
    ...details,
    timestamp: new Date().toISOString()
  });
};

// Security event logging
const securityLogger = (event, req, details = {}) => {
  logger.warn('Security Event', {
    event,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    userRole: req.user?.role,
    url: req.originalUrl,
    method: req.method,
    ...details,
    timestamp: new Date().toISOString()
  });
};

// Database operation logging
const dbLogger = (operation, collection, query = {}, result = {}) => {
  logger.debug('Database Operation', {
    operation,
    collection,
    query: JSON.stringify(query),
    result: {
      success: result.success || false,
      count: result.count || 0,
      duration: result.duration || 0
    },
    timestamp: new Date().toISOString()
  });
};

// Performance logging
const performanceLogger = (operation, duration, details = {}) => {
  const logLevel = duration > 5000 ? 'warn' : duration > 2000 ? 'info' : 'debug';
  
  logger.log(logLevel, 'Performance Metric', {
    operation,
    duration: `${duration}ms`,
    ...details,
    timestamp: new Date().toISOString()
  });
};

// Business logic logging
const businessLogger = (action, entity, details = {}, userId = null) => {
  logger.info('Business Action', {
    action,
    entity,
    userId,
    ...details,
    timestamp: new Date().toISOString()
  });
};

// Audit logging for sensitive operations
const auditLogger = (action, entity, entityId, userId, changes = {}, metadata = {}) => {
  logger.info('Audit Trail', {
    action, // CREATE, UPDATE, DELETE, VIEW
    entity, // User, Student, Teacher, etc.
    entityId,
    userId,
    changes,
    metadata,
    timestamp: new Date().toISOString()
  });
};

// API usage logging
const apiUsageLogger = (endpoint, method, userId, userRole, responseTime) => {
  logger.info('API Usage', {
    endpoint,
    method,
    userId,
    userRole,
    responseTime: `${responseTime}ms`,
    timestamp: new Date().toISOString()
  });
};

// File operation logging
const fileLogger = (operation, filename, userId, details = {}) => {
  logger.info('File Operation', {
    operation, // UPLOAD, DOWNLOAD, DELETE
    filename,
    userId,
    ...details,
    timestamp: new Date().toISOString()
  });
};

// Email logging
const emailLogger = (action, recipient, subject, status, details = {}) => {
  logger.info('Email Activity', {
    action, // SEND, BOUNCE, DELIVERY
    recipient,
    subject,
    status, // SUCCESS, FAILED, PENDING
    ...details,
    timestamp: new Date().toISOString()
  });
};

// System health logging
const healthLogger = (metric, value, threshold = null, status = 'OK') => {
  const logLevel = status === 'CRITICAL' ? 'error' : status === 'WARNING' ? 'warn' : 'info';
  
  logger.log(logLevel, 'System Health', {
    metric, // CPU, MEMORY, DISK, DATABASE
    value,
    threshold,
    status,
    timestamp: new Date().toISOString()
  });
};

// Log cleanup utility
const cleanupLogs = (daysToKeep = 30) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  fs.readdir(logsDir, (err, files) => {
    if (err) {
      logger.error('Error reading logs directory', { error: err.message });
      return;
    }
    
    files.forEach(file => {
      const filePath = path.join(logsDir, file);
      fs.stat(filePath, (err, stats) => {
        if (err) return;
        
        if (stats.mtime < cutoffDate) {
          fs.unlink(filePath, (err) => {
            if (!err) {
              logger.info('Log file cleaned up', { filename: file });
            }
          });
        }
      });
    });
  });
};

// Log rotation notification
const rotationLogger = () => {
  logger.info('Log Rotation', {
    message: 'Log files rotated successfully',
    timestamp: new Date().toISOString()
  });
};

// Export logger and logging utilities
module.exports = {
  logger,
  
  // Middleware
  requestLogger,
  errorLogger,
  
  // Specific loggers
  authLogger,
  securityLogger,
  dbLogger,
  performanceLogger,
  businessLogger,
  auditLogger,
  apiUsageLogger,
  fileLogger,
  emailLogger,
  healthLogger,
  
  // Utilities
  cleanupLogs,
  rotationLogger
};