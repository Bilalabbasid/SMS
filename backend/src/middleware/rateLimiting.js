const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

// General rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(15 * 60 / 60) + ' minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// Strict rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs for auth endpoints
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    retryAfter: Math.ceil(15 * 60 / 60) + ' minutes'
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts from this IP, please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// Login specific rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login attempts per windowMs
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.',
    retryAfter: Math.ceil(15 * 60 / 60) + ' minutes'
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many login attempts from this IP, please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// Password reset rate limiting
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again later.',
    retryAfter: Math.ceil(60 * 60 / 60) + ' minutes'
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many password reset attempts from this IP, please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// File upload rate limiting
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit each IP to 50 upload requests per hour
  message: {
    success: false,
    message: 'Upload limit exceeded, please try again later.',
    retryAfter: Math.ceil(60 * 60 / 60) + ' minutes'
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Upload limit exceeded from this IP, please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// API call speed limiter (progressive delay)
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 100, // Allow 100 requests per windowMs at full speed
  // Use the new express-slow-down v2 behavior for delayMs
  delayMs: () => 500, // constant 500ms delay per extra request
  maxDelayMs: 20000, // Maximum delay of 20 seconds
  skipFailedRequests: false,
  skipSuccessfulRequests: false
});

// Heavy operation rate limiting (for reports, bulk operations)
const heavyOperationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 heavy operations per windowMs
  message: {
    success: false,
    message: 'Too many resource-intensive requests, please try again later.',
    retryAfter: Math.ceil(15 * 60 / 60) + ' minutes'
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many resource-intensive requests from this IP, please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// Create custom rate limiter
const createCustomLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
      success: false,
      message: 'Rate limit exceeded, please try again later.'
    }
  };

  return rateLimit({
    ...defaultOptions,
    ...options,
    handler: (req, res) => {
      res.status(429).json(options.message || defaultOptions.message);
    }
  });
};

// Dynamic rate limiter based on user role
const roleBasedLimiter = (limits = {}) => {
  return (req, res, next) => {
    const userRole = req.user?.role || 'guest';
    const limit = limits[userRole] || limits.default || 100;
    
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: limit,
      message: {
        success: false,
        message: `Rate limit exceeded for ${userRole} role, please try again later.`
      },
      keyGenerator: (req) => {
        return req.user?.id || req.ip;
      },
      handler: (req, res) => {
        res.status(429).json({
          success: false,
          message: `Rate limit exceeded for ${userRole} role, please try again later.`,
          retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
        });
      }
    });
    
    return limiter(req, res, next);
  };
};

// IP whitelist middleware
const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (allowedIPs.length === 0 || allowedIPs.includes(clientIP)) {
      return next();
    }
    
    res.status(403).json({
      success: false,
      message: 'Access denied from this IP address'
    });
  };
};

// Request size limiter
const requestSizeLimiter = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = parseInt(req.get('Content-Length'));
    const maxSizeBytes = parseSize(maxSize);
    
    if (contentLength > maxSizeBytes) {
      return res.status(413).json({
        success: false,
        message: `Request size exceeds maximum allowed size of ${maxSize}`
      });
    }
    
    next();
  };
};

// Helper function to parse size string
const parseSize = (size) => {
  const units = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([kmg]?b)$/);
  
  if (!match) {
    throw new Error('Invalid size format');
  }
  
  const [, number, unit] = match;
  return parseFloat(number) * units[unit];
};

// Concurrent request limiter per user
const concurrentLimiter = (maxConcurrent = 5) => {
  const activeRequests = new Map();
  
  return (req, res, next) => {
    const userId = req.user?.id || req.ip;
    const currentCount = activeRequests.get(userId) || 0;
    
    if (currentCount >= maxConcurrent) {
      return res.status(429).json({
        success: false,
        message: 'Too many concurrent requests, please wait for previous requests to complete'
      });
    }
    
    // Increment counter
    activeRequests.set(userId, currentCount + 1);
    
    // Decrement counter when response finishes
    res.on('finish', () => {
      const count = activeRequests.get(userId) || 0;
      if (count <= 1) {
        activeRequests.delete(userId);
      } else {
        activeRequests.set(userId, count - 1);
      }
    });
    
    next();
  };
};

// Request duration limiter (timeout)
const requestTimeout = (timeout = 30000) => {
  return (req, res, next) => {
    req.setTimeout(timeout, () => {
      res.status(408).json({
        success: false,
        message: 'Request timeout'
      });
    });
    
    next();
  };
};

module.exports = {
  // Pre-configured limiters
  generalLimiter,
  authLimiter,
  loginLimiter,
  passwordResetLimiter,
  uploadLimiter,
  speedLimiter,
  heavyOperationLimiter,
  
  // Custom limiters
  createCustomLimiter,
  roleBasedLimiter,
  ipWhitelist,
  requestSizeLimiter,
  concurrentLimiter,
  requestTimeout,
  
  // Utility functions
  parseSize
};