const jwt = require('jsonwebtoken');
const { User } = require('../models');

// JWT Token Generation
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// JWT Token Verification Middleware
const authenticate = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies (for web sessions)
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database
      const user = await User.findById(decoded.userId)
        .populate('studentProfile')
        .populate('teacherProfile')
        .populate('children');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Token is valid but user no longer exists.'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated.'
        });
      }

      // Update last login time
      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });

      // Attach user to request object
      req.user = user;
      req.userId = user._id;
      req.userRole = user.role;

      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired. Please login again.'
        });
      }
      
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token.'
        });
      }

      throw jwtError;
    }

  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed due to server error.'
    });
  }
};

// Role-based Authorization Middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}. Your role: ${req.user.role}`
      });
    }

    next();
  };
};

// Permission-based Authorization Middleware
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!req.user.hasPermission(permission)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required permission: ${permission}`
      });
    }

    next();
  };
};

// Multiple permissions (user must have ALL permissions)
const requireAllPermissions = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    const hasAllPermissions = permissions.every(permission => 
      req.user.hasPermission(permission)
    );

    if (!hasAllPermissions) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required permissions: ${permissions.join(', ')}`
      });
    }

    next();
  };
};

// Multiple permissions (user must have ANY of the permissions)
const requireAnyPermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    const hasAnyPermission = permissions.some(permission => 
      req.user.hasPermission(permission)
    );

    if (!hasAnyPermission) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required any of permissions: ${permissions.join(', ')}`
      });
    }

    next();
  };
};

// Resource ownership check (for students, teachers, parents accessing their own data)
const checkResourceOwnership = (resourceType) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.'
        });
      }

      // Admins have access to all resources
      if (req.user.role === 'admin') {
        return next();
      }

      const resourceId = req.params.id || req.params.studentId || req.params.teacherId;

      switch (resourceType) {
        case 'student':
          // Students can only access their own data
          if (req.user.role === 'student') {
            if (req.user.studentProfile && req.user.studentProfile._id.toString() === resourceId) {
              return next();
            }
          }
          // Parents can access their children's data
          else if (req.user.role === 'parent') {
            const hasChild = req.user.children.some(child => 
              child._id.toString() === resourceId
            );
            if (hasChild) {
              return next();
            }
          }
          // Teachers can access students in their classes
          else if (req.user.role === 'teacher' && req.user.teacherProfile) {
            // This would need additional logic to check if student is in teacher's class
            // For now, allowing teachers to access all student data
            return next();
          }
          break;

        case 'teacher':
          // Teachers can only access their own data
          if (req.user.role === 'teacher') {
            if (req.user.teacherProfile && req.user.teacherProfile._id.toString() === resourceId) {
              return next();
            }
          }
          break;

        case 'user':
          // Users can access their own user data
          if (req.user._id.toString() === resourceId) {
            return next();
          }
          break;

        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid resource type for ownership check.'
          });
      }

      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.'
      });

    } catch (error) {
      console.error('Resource ownership check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authorization failed due to server error.'
      });
    }
  };
};

// Class-based access control (for teachers and students)
const checkClassAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    // Admins have access to all classes
    if (req.user.role === 'admin') {
      return next();
    }

    const classId = req.params.classId || req.body.class || req.query.class;

    if (!classId) {
      return res.status(400).json({
        success: false,
        message: 'Class ID is required.'
      });
    }

    if (req.user.role === 'student' && req.user.studentProfile) {
      // Students can only access their own class
      if (req.user.studentProfile.class.toString() === classId) {
        return next();
      }
    } else if (req.user.role === 'teacher' && req.user.teacherProfile) {
      // Teachers can access classes they teach
      const teachesClass = req.user.teacherProfile.subjects.some(subject =>
        subject.classes.some(cls => cls.class.toString() === classId)
      );
      
      if (teachesClass) {
        return next();
      }
    } else if (req.user.role === 'parent') {
      // Parents can access classes their children are in
      const childrenInClass = req.user.children.some(child => 
        child.class && child.class.toString() === classId
      );
      
      if (childrenInClass) {
        return next();
      }
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. You do not have access to this class.'
    });

  } catch (error) {
    console.error('Class access check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authorization failed due to server error.'
    });
  }
};

// Optional authentication (for endpoints that work with or without auth)
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId)
          .populate('studentProfile')
          .populate('teacherProfile')
          .populate('children');

        if (user && user.isActive) {
          req.user = user;
          req.userId = user._id;
          req.userRole = user.role;
        }
      } catch (jwtError) {
        // Token is invalid, but we continue without authentication
        console.log('Optional auth: Invalid token provided, continuing without auth');
      }
    }

    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    next(); // Continue even if there's an error
  }
};

// Academic year validation middleware
const validateAcademicYear = (req, res, next) => {
  const academicYear = req.params.academicYear || req.body.academicYear || req.query.academicYear;
  
  if (academicYear) {
    const academicYearRegex = /^\d{4}-\d{4}$/;
    if (!academicYearRegex.test(academicYear)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid academic year format. Use YYYY-YYYY format (e.g., 2023-2024).'
      });
    }
    
    const [startYear, endYear] = academicYear.split('-').map(Number);
    if (endYear !== startYear + 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid academic year. End year must be start year + 1.'
      });
    }
  }
  
  next();
};

module.exports = {
  generateToken,
  authenticate,
  authorize,
  requirePermission,
  requireAllPermissions,
  requireAnyPermission,
  checkResourceOwnership,
  checkClassAccess,
  optionalAuth,
  validateAcademicYear
};