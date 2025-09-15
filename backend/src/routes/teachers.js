const express = require('express');
const Teacher = require('../models/Teacher');
const User = require('../models/User');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const { authenticate, authorize } = require('../middleware/auth');
const { validationSets } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/teachers
// @desc    Get all teachers with filtering and pagination
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
      
      // Filter by department
      if (req.query.department) {
        filter.department = req.query.department;
      }
      
      // Filter by designation
      if (req.query.designation) {
        filter.designation = req.query.designation;
      }
      
      // Filter by employment type
      if (req.query.employmentType) {
        filter.employmentType = req.query.employmentType;
      }
      
      // Filter by employment status
      if (req.query.employmentStatus) {
        filter.employmentStatus = req.query.employmentStatus;
      }

      // Get teachers with population
      const teachers = await Teacher.find(filter)
        .populate('user', 'firstName lastName email phone avatar isActive')
        .populate('subjects', 'name code')
        .populate('classes.class', 'name level')
        .populate('supervisor', 'firstName lastName')
        .sort({ 'user.firstName': 1, 'user.lastName': 1 })
        .skip(skip)
        .limit(limit);

      // Get total count for pagination
      const total = await Teacher.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);

      res.status(200).json({
        success: true,
        data: {
          teachers,
          pagination: {
            currentPage: page,
            totalPages,
            totalTeachers: total,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        }
      });
    } catch (error) {
      console.error('Get teachers error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch teachers',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   POST /api/teachers
// @desc    Create new teacher
// @access  Private (Admin only)
router.post('/', 
  authenticate, 
  authorize(['admin']), 
  validationSets.createTeacher,
  async (req, res) => {
    try {
      const {
        user, employeeId, designation, department, joiningDate,
        employmentType, salary, qualifications, experience,
        subjects, classes, supervisor, schedule
      } = req.body;

      // Check if user exists and is a teacher
      const userRecord = await User.findById(user);
      if (!userRecord || userRecord.role !== 'teacher') {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID or user is not a teacher'
        });
      }

      // Check if teacher record already exists
      const existingTeacher = await Teacher.findOne({ user });
      if (existingTeacher) {
        return res.status(400).json({
          success: false,
          message: 'Teacher record already exists for this user'
        });
      }

      // Check if employeeId is unique
      const existingEmployeeId = await Teacher.findOne({ employeeId });
      if (existingEmployeeId) {
        return res.status(400).json({
          success: false,
          message: 'Employee ID already exists'
        });
      }

      // Create new teacher
      const teacher = new Teacher({
        user,
        employeeId,
        designation,
        department,
        joiningDate,
        employmentType,
        salary,
        qualifications,
        experience,
        subjects,
        classes,
        supervisor,
        schedule,
        createdBy: req.user.id
      });

      await teacher.save();

      // Populate the response
      await teacher.populate([
        { path: 'user', select: 'firstName lastName email phone avatar' },
        { path: 'subjects', select: 'name code' },
        { path: 'classes.class', select: 'name level' },
        { path: 'supervisor', select: 'firstName lastName' }
      ]);

      res.status(201).json({
        success: true,
        message: 'Teacher created successfully',
        data: teacher
      });
    } catch (error) {
      console.error('Create teacher error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create teacher',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   GET /api/teachers/:id
// @desc    Get teacher by ID
// @access  Private (Admin, Self)
router.get('/:id', 
  authenticate, 
  validationSets.mongoIdParam,
  async (req, res) => {
    try {
      const teacherId = req.params.id;
      
      const teacher = await Teacher.findById(teacherId)
        .populate('user', 'firstName lastName email phone avatar dateOfBirth gender address emergencyContact isActive')
        .populate('subjects', 'name code credits category')
        .populate('classes.class', 'name level grade')
        .populate('supervisor', 'firstName lastName email')
        .populate('createdBy', 'firstName lastName');

      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: 'Teacher not found'
        });
      }

      // Check access permissions
      const canAccess = 
        req.user.role === 'admin' ||
        teacher.user._id.toString() === req.user.id ||
        (teacher.supervisor && teacher.supervisor._id.toString() === req.user.id);

      if (!canAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.status(200).json({
        success: true,
        data: teacher
      });
    } catch (error) {
      console.error('Get teacher error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch teacher',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   PUT /api/teachers/:id
// @desc    Update teacher
// @access  Private (Admin, Self - limited fields)
router.put('/:id', 
  authenticate, 
  validationSets.mongoIdParam,
  async (req, res) => {
    try {
      const teacherId = req.params.id;
      const updates = req.body;
      
      // Find teacher
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: 'Teacher not found'
        });
      }

      // Check permissions
      const isAdmin = req.user.role === 'admin';
      const isSelf = teacher.user.toString() === req.user.id;
      
      if (!isAdmin && !isSelf) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Define allowed fields for different roles
      const allowedFieldsForSelf = ['qualifications', 'experience', 'schedule', 'emergencyContact'];
      const allowedFieldsForAdmin = [
        'designation', 'department', 'employmentType', 'employmentStatus',
        'salary', 'qualifications', 'experience', 'subjects', 'classes',
        'supervisor', 'schedule', 'probationEndDate', 'contractEndDate'
      ];

      const allowedFields = isAdmin ? allowedFieldsForAdmin : allowedFieldsForSelf;
      
      // Filter updates to only allowed fields
      const filteredUpdates = {};
      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
          filteredUpdates[key] = updates[key];
        }
      });

      // Update teacher
      const updatedTeacher = await Teacher.findByIdAndUpdate(
        teacherId,
        filteredUpdates,
        { 
          new: true, 
          runValidators: true 
        }
      ).populate([
        { path: 'user', select: 'firstName lastName email phone avatar' },
        { path: 'subjects', select: 'name code' },
        { path: 'classes.class', select: 'name level' },
        { path: 'supervisor', select: 'firstName lastName' }
      ]);

      res.status(200).json({
        success: true,
        message: 'Teacher updated successfully',
        data: updatedTeacher
      });
    } catch (error) {
      console.error('Update teacher error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update teacher',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   DELETE /api/teachers/:id
// @desc    Delete teacher
// @access  Private (Admin only)
router.delete('/:id', 
  authenticate, 
  authorize(['admin']), 
  validationSets.mongoIdParam,
  async (req, res) => {
    try {
      const teacherId = req.params.id;

      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: 'Teacher not found'
        });
      }

      // Soft delete by changing employment status
      teacher.employmentStatus = 'terminated';
      teacher.terminationDate = new Date();
      await teacher.save();

      res.status(200).json({
        success: true,
        message: 'Teacher employment terminated'
      });
    } catch (error) {
      console.error('Delete teacher error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete teacher',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   GET /api/teachers/department/:department
// @desc    Get teachers by department
// @access  Private (Admin)
router.get('/department/:department', 
  authenticate, 
  authorize(['admin']),
  validationSets.pagination,
  async (req, res) => {
    try {
      const { department } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const validDepartments = [
        'Mathematics', 'Science', 'English', 'Social Studies', 'Languages',
        'Computer Science', 'Physical Education', 'Arts', 'Music',
        'Administration', 'Library', 'Counseling'
      ];

      if (!validDepartments.includes(department)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid department specified'
        });
      }

      const filter = { department };
      
      // Add search functionality
      if (req.query.search) {
        const userIds = await User.find({
          $or: [
            { firstName: new RegExp(req.query.search, 'i') },
            { lastName: new RegExp(req.query.search, 'i') }
          ]
        }).distinct('_id');
        
        filter.user = { $in: userIds };
      }

      const teachers = await Teacher.find(filter)
        .populate('user', 'firstName lastName email phone avatar')
        .populate('subjects', 'name code')
        .sort({ 'user.firstName': 1, 'user.lastName': 1 })
        .skip(skip)
        .limit(limit);

      const total = await Teacher.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);

      res.status(200).json({
        success: true,
        data: {
          teachers,
          department,
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
      console.error('Get teachers by department error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch teachers by department',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   GET /api/teachers/stats/overview
// @desc    Get teacher statistics overview
// @access  Private (Admin)
router.get('/stats/overview', 
  authenticate, 
  authorize(['admin']),
  async (req, res) => {
    try {
      // Total teachers
      const totalTeachers = await Teacher.countDocuments();
      
      // Teachers by department
      const departmentStats = await Teacher.aggregate([
        {
          $group: {
            _id: '$department',
            count: { $sum: 1 }
          }
        }
      ]);

      // Teachers by employment type
      const employmentTypeStats = await Teacher.aggregate([
        {
          $group: {
            _id: '$employmentType',
            count: { $sum: 1 }
          }
        }
      ]);

      // Teachers by designation
      const designationStats = await Teacher.aggregate([
        {
          $group: {
            _id: '$designation',
            count: { $sum: 1 }
          }
        }
      ]);

      // Recent hires (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentHires = await Teacher.countDocuments({
        joiningDate: { $gte: thirtyDaysAgo }
      });

      // Active teachers
      const activeTeachers = await Teacher.countDocuments({
        employmentStatus: 'active'
      });

      res.status(200).json({
        success: true,
        data: {
          totalTeachers,
          activeTeachers,
          recentHires,
          departmentStats,
          employmentTypeStats,
          designationStats
        }
      });
    } catch (error) {
      console.error('Get teacher stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch teacher statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   PUT /api/teachers/:id/subjects
// @desc    Update teacher subjects
// @access  Private (Admin only)
router.put('/:id/subjects', 
  authenticate, 
  authorize(['admin']), 
  validationSets.mongoIdParam,
  async (req, res) => {
    try {
      const teacherId = req.params.id;
      const { subjects } = req.body;

      if (!Array.isArray(subjects)) {
        return res.status(400).json({
          success: false,
          message: 'Subjects must be an array'
        });
      }

      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: 'Teacher not found'
        });
      }

      // Validate subjects exist
      const existingSubjects = await Subject.find({ _id: { $in: subjects } });
      if (existingSubjects.length !== subjects.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more subjects are invalid'
        });
      }

      // Update subjects
      teacher.subjects = subjects;
      await teacher.save();

      // Populate and return updated teacher
      await teacher.populate([
        { path: 'user', select: 'firstName lastName' },
        { path: 'subjects', select: 'name code category' }
      ]);

      res.status(200).json({
        success: true,
        message: 'Teacher subjects updated successfully',
        data: teacher
      });
    } catch (error) {
      console.error('Update teacher subjects error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update teacher subjects',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   PUT /api/teachers/:id/classes
// @desc    Update teacher classes
// @access  Private (Admin only)
router.put('/:id/classes', 
  authenticate, 
  authorize(['admin']), 
  validationSets.mongoIdParam,
  async (req, res) => {
    try {
      const teacherId = req.params.id;
      const { classes } = req.body;

      if (!Array.isArray(classes)) {
        return res.status(400).json({
          success: false,
          message: 'Classes must be an array'
        });
      }

      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: 'Teacher not found'
        });
      }

      // Validate classes structure and existence
      for (const classItem of classes) {
        if (!classItem.class || !classItem.section) {
          return res.status(400).json({
            success: false,
            message: 'Each class must have class and section'
          });
        }

        const classExists = await Class.findById(classItem.class);
        if (!classExists) {
          return res.status(400).json({
            success: false,
            message: `Class ${classItem.class} not found`
          });
        }
      }

      // Update classes
      teacher.classes = classes;
      await teacher.save();

      // Populate and return updated teacher
      await teacher.populate([
        { path: 'user', select: 'firstName lastName' },
        { path: 'classes.class', select: 'name level grade' }
      ]);

      res.status(200).json({
        success: true,
        message: 'Teacher classes updated successfully',
        data: teacher
      });
    } catch (error) {
      console.error('Update teacher classes error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update teacher classes',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   GET /api/teachers/:id/schedule
// @desc    Get teacher schedule
// @access  Private (Admin, Self)
router.get('/:id/schedule', 
  authenticate, 
  validationSets.mongoIdParam,
  async (req, res) => {
    try {
      const teacherId = req.params.id;
      
      const teacher = await Teacher.findById(teacherId)
        .populate('user', 'firstName lastName')
        .populate('classes.class', 'name level')
        .populate('subjects', 'name code')
        .select('schedule user classes subjects');

      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: 'Teacher not found'
        });
      }

      // Check access permissions
      if (req.user.role !== 'admin' && teacher.user._id.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.status(200).json({
        success: true,
        data: {
          teacher: {
            name: `${teacher.user.firstName} ${teacher.user.lastName}`,
            classes: teacher.classes,
            subjects: teacher.subjects
          },
          schedule: teacher.schedule
        }
      });
    } catch (error) {
      console.error('Get teacher schedule error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch teacher schedule',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

module.exports = router;