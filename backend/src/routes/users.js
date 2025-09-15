const express = require('express');
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const { authenticate, authorize, checkResourceOwnership } = require('../middleware/auth');
const { validationSets } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users with filtering and pagination
// @access  Private (Admin, Principal)
router.get('/', 
  authenticate, 
  authorize(['admin']), 
  validationSets.pagination,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      
      // Build filter object
      const filter = {};
      
      // Filter by role
      if (req.query.role) {
        filter.role = req.query.role;
      }
      
      // Filter by active status
      if (req.query.isActive !== undefined) {
        filter.isActive = req.query.isActive === 'true';
      }
      
      // Search functionality
      if (req.query.search) {
        const searchRegex = new RegExp(req.query.search, 'i');
        filter.$or = [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { email: searchRegex },
          { phone: searchRegex }
        ];
      }
      
      // Date range filter
      if (req.query.startDate || req.query.endDate) {
        filter.createdAt = {};
        if (req.query.startDate) {
          filter.createdAt.$gte = new Date(req.query.startDate);
        }
        if (req.query.endDate) {
          filter.createdAt.$lte = new Date(req.query.endDate);
        }
      }

      // Get users with pagination
      const users = await User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'firstName lastName');

      // Get total count for pagination
      const total = await User.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);

      res.status(200).json({
        success: true,
        data: {
          users,
          pagination: {
            currentPage: page,
            totalPages,
            totalUsers: total,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        }
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private (Admin, Self)
router.get('/:id', 
  authenticate, 
  validationSets.mongoIdParam,
  async (req, res) => {
    try {
      const userId = req.params.id;
      
      // Check if user can access this profile
      if (req.user.role !== 'admin' && req.user.id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const user = await User.findById(userId)
        .select('-password')
        .populate('createdBy', 'firstName lastName');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Get additional profile data based on role
      let profileData = {};
      if (user.role === 'student') {
        profileData = await Student.findOne({ user: userId })
          .populate('class', 'name level grade')
          .populate('subjects', 'name code')
          .populate('parents', 'firstName lastName email phone');
      } else if (user.role === 'teacher') {
        profileData = await Teacher.findOne({ user: userId })
          .populate('subjects', 'name code')
          .populate('classes.class', 'name level')
          .populate('supervisor', 'firstName lastName');
      }

      res.status(200).json({
        success: true,
        data: {
          user,
          profile: profileData
        }
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (Admin, Self - limited fields)
router.put('/:id', 
  authenticate, 
  validationSets.updateUser,
  async (req, res) => {
    try {
      const userId = req.params.id;
      const updates = req.body;
      
      // Check permissions
      const isAdmin = req.user.role === 'admin';
      const isSelf = req.user.id === userId;
      
      if (!isAdmin && !isSelf) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Find user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Define allowed fields for different roles
      const allowedFieldsForSelf = ['firstName', 'lastName', 'phone', 'address', 'emergencyContact'];
      const allowedFieldsForAdmin = [
        'firstName', 'lastName', 'phone', 'address', 'emergencyContact',
        'role', 'isActive', 'dateOfBirth', 'gender'
      ];

      const allowedFields = isAdmin ? allowedFieldsForAdmin : allowedFieldsForSelf;
      
      // Filter updates to only allowed fields
      const filteredUpdates = {};
      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
          filteredUpdates[key] = updates[key];
        }
      });

      // Prevent role change to admin by non-admin users
      if (filteredUpdates.role && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Only admin can change user roles'
        });
      }

      // Update user
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        filteredUpdates,
        { 
          new: true, 
          runValidators: true 
        }
      ).select('-password');

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: updatedUser
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   DELETE /api/users/:id
// @desc    Delete/Deactivate user
// @access  Private (Admin only)
router.delete('/:id', 
  authenticate, 
  authorize(['admin']), 
  validationSets.mongoIdParam,
  async (req, res) => {
    try {
      const userId = req.params.id;
      const { permanent = false } = req.query;

      // Prevent self-deletion
      if (req.user.id === userId) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete your own account'
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (permanent === 'true') {
        // Permanent deletion (use with caution)
        await User.findByIdAndDelete(userId);
        
        // Also delete related student/teacher records
        if (user.role === 'student') {
          await Student.findOneAndDelete({ user: userId });
        } else if (user.role === 'teacher') {
          await Teacher.findOneAndDelete({ user: userId });
        }
        
        res.status(200).json({
          success: true,
          message: 'User permanently deleted'
        });
      } else {
        // Soft delete (deactivation)
        user.isActive = false;
        await user.save();
        
        res.status(200).json({
          success: true,
          message: 'User deactivated successfully'
        });
      }
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete user',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   PUT /api/users/:id/activate
// @desc    Activate deactivated user
// @access  Private (Admin only)
router.put('/:id/activate', 
  authenticate, 
  authorize(['admin']), 
  validationSets.mongoIdParam,
  async (req, res) => {
    try {
      const userId = req.params.id;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (user.isActive) {
        return res.status(400).json({
          success: false,
          message: 'User is already active'
        });
      }

      user.isActive = true;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'User activated successfully',
        data: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          isActive: user.isActive
        }
      });
    } catch (error) {
      console.error('Activate user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to activate user',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   GET /api/users/stats/overview
// @desc    Get user statistics overview
// @access  Private (Admin only)
router.get('/stats/overview', 
  authenticate, 
  authorize(['admin']),
  async (req, res) => {
    try {
      const stats = await User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 },
            active: {
              $sum: {
                $cond: ['$isActive', 1, 0]
              }
            },
            inactive: {
              $sum: {
                $cond: ['$isActive', 0, 1]
              }
            }
          }
        }
      ]);

      // Get total users count
      const totalUsers = await User.countDocuments();
      const totalActive = await User.countDocuments({ isActive: true });
      const totalInactive = await User.countDocuments({ isActive: false });

      // Get recent registrations (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentRegistrations = await User.countDocuments({
        createdAt: { $gte: sevenDaysAgo }
      });

      res.status(200).json({
        success: true,
        data: {
          totalUsers,
          totalActive,
          totalInactive,
          recentRegistrations,
          roleWiseStats: stats
        }
      });
    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   GET /api/users/roles/:role
// @desc    Get users by role
// @access  Private (Admin, Teacher - for students only)
router.get('/roles/:role', 
  authenticate, 
  validationSets.pagination,
  async (req, res) => {
    try {
      const { role } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // Check permissions
      if (req.user.role !== 'admin') {
        if (req.user.role === 'teacher' && role !== 'student') {
          return res.status(403).json({
            success: false,
            message: 'Teachers can only view student lists'
          });
        } else if (req.user.role !== 'teacher') {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }
      }

      const validRoles = ['admin', 'teacher', 'student', 'parent', 'accountant', 'librarian'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role specified'
        });
      }

      const filter = { role };
      
      // Add search functionality
      if (req.query.search) {
        const searchRegex = new RegExp(req.query.search, 'i');
        filter.$or = [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { email: searchRegex }
        ];
      }

      // Filter by active status
      if (req.query.isActive !== undefined) {
        filter.isActive = req.query.isActive === 'true';
      }

      const users = await User.find(filter)
        .select('-password')
        .sort({ firstName: 1, lastName: 1 })
        .skip(skip)
        .limit(limit);

      const total = await User.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);

      res.status(200).json({
        success: true,
        data: {
          users,
          pagination: {
            currentPage: page,
            totalPages,
            total,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        }
      });
    } catch (error) {
      console.error('Get users by role error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users by role',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

module.exports = router;