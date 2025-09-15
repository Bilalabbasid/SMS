const express = require('express');
const Student = require('../models/Student');
const User = require('../models/User');
const Class = require('../models/Class');
const { authenticate, authorize, checkClassAccess } = require('../middleware/auth');
const { validationSets } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/students
// @desc    Get all students with filtering and pagination
// @access  Private (Admin, Teacher, Accountant)
router.get('/', 
  authenticate, 
  authorize(['admin', 'teacher', 'accountant']), 
  validationSets.pagination,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      
      // Build filter object
      const filter = {};
      
      // Filter by class
      if (req.query.class) {
        filter.class = req.query.class;
      }
      
      // Filter by section
      if (req.query.section) {
        filter.section = req.query.section;
      }
      
      // Filter by academic year
      if (req.query.academicYear) {
        filter.academicYear = req.query.academicYear;
      }
      
      // Filter by enrollment status
      if (req.query.enrollmentStatus) {
        filter.enrollmentStatus = req.query.enrollmentStatus;
      }

      // Get students with population
      const students = await Student.find(filter)
        .populate('user', 'firstName lastName email phone avatar isActive')
        .populate('class', 'name level grade')
        .populate('subjects', 'name code')
        .populate('parents', 'firstName lastName email phone')
        .sort({ 'user.firstName': 1, 'user.lastName': 1 })
        .skip(skip)
        .limit(limit);

      // Get total count for pagination
      const total = await Student.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);

      // Filter students based on teacher's access if not admin
      let filteredStudents = students;
      if (req.user.role === 'teacher') {
        // Teachers can only see students from their classes
        const teacherClasses = req.user.classes || [];
        filteredStudents = students.filter(student => 
          teacherClasses.some(tc => tc.class.toString() === student.class._id.toString())
        );
      }

      res.status(200).json({
        success: true,
        data: {
          students: filteredStudents,
          pagination: {
            currentPage: page,
            totalPages,
            totalStudents: total,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        }
      });
    } catch (error) {
      console.error('Get students error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch students',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   POST /api/students
// @desc    Create new student
// @access  Private (Admin only)
router.post('/', 
  authenticate, 
  authorize(['admin']), 
  validationSets.createStudent,
  async (req, res) => {
    try {
      const {
        user, studentId, rollNumber, class: classId, section, academicYear,
        admissionDate, admissionNumber, previousSchool, parentInfo,
        medicalInfo, transportInfo
      } = req.body;

      // Check if user exists and is a student
      const userRecord = await User.findById(user);
      if (!userRecord || userRecord.role !== 'student') {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID or user is not a student'
        });
      }

      // Check if student record already exists
      const existingStudent = await Student.findOne({ user });
      if (existingStudent) {
        return res.status(400).json({
          success: false,
          message: 'Student record already exists for this user'
        });
      }

      // Check if studentId is unique
      const existingStudentId = await Student.findOne({ studentId });
      if (existingStudentId) {
        return res.status(400).json({
          success: false,
          message: 'Student ID already exists'
        });
      }

      // Check if class exists
      const classRecord = await Class.findById(classId);
      if (!classRecord) {
        return res.status(400).json({
          success: false,
          message: 'Class not found'
        });
      }

      // Create new student
      const student = new Student({
        user,
        studentId,
        rollNumber,
        class: classId,
        section,
        academicYear,
        admissionDate,
        admissionNumber,
        previousSchool,
        parentInfo,
        medicalInfo,
        transportInfo,
        createdBy: req.user.id
      });

      await student.save();

      // Populate the response
      await student.populate([
        { path: 'user', select: 'firstName lastName email phone avatar' },
        { path: 'class', select: 'name level grade' }
      ]);

      res.status(201).json({
        success: true,
        message: 'Student created successfully',
        data: student
      });
    } catch (error) {
      console.error('Create student error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create student',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   GET /api/students/:id
// @desc    Get student by ID
// @access  Private (Admin, Teacher - if teaching student, Student - self only, Parent - own child only)
router.get('/:id', 
  authenticate, 
  validationSets.mongoIdParam,
  async (req, res) => {
    try {
      const studentId = req.params.id;
      
      const student = await Student.findById(studentId)
        .populate('user', 'firstName lastName email phone avatar dateOfBirth gender address emergencyContact isActive')
        .populate('class', 'name level grade')
        .populate('subjects', 'name code credits')
        .populate('parents', 'firstName lastName email phone')
        .populate('createdBy', 'firstName lastName');

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      // Check access permissions
      const canAccess = 
        req.user.role === 'admin' ||
        req.user.role === 'accountant' ||
        (req.user.role === 'teacher' && req.user.classes && 
         req.user.classes.some(tc => tc.class.toString() === student.class._id.toString())) ||
        (req.user.role === 'student' && student.user._id.toString() === req.user.id) ||
        (req.user.role === 'parent' && student.parents.some(p => p._id.toString() === req.user.id));

      if (!canAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.status(200).json({
        success: true,
        data: student
      });
    } catch (error) {
      console.error('Get student error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch student',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   PUT /api/students/:id
// @desc    Update student
// @access  Private (Admin only)
router.put('/:id', 
  authenticate, 
  authorize(['admin']), 
  validationSets.mongoIdParam,
  async (req, res) => {
    try {
      const studentId = req.params.id;
      const updates = req.body;
      
      // Find student
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      // Define allowed fields for update
      const allowedFields = [
        'rollNumber', 'class', 'section', 'academicYear', 'enrollmentStatus',
        'previousSchool', 'parentInfo', 'medicalInfo', 'transportInfo',
        'subjects', 'emergencyContacts'
      ];

      // Filter updates to only allowed fields
      const filteredUpdates = {};
      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
          filteredUpdates[key] = updates[key];
        }
      });

      // If class is being changed, validate it exists
      if (filteredUpdates.class) {
        const classRecord = await Class.findById(filteredUpdates.class);
        if (!classRecord) {
          return res.status(400).json({
            success: false,
            message: 'Invalid class specified'
          });
        }
      }

      // Update student
      const updatedStudent = await Student.findByIdAndUpdate(
        studentId,
        filteredUpdates,
        { 
          new: true, 
          runValidators: true 
        }
      ).populate([
        { path: 'user', select: 'firstName lastName email phone avatar' },
        { path: 'class', select: 'name level grade' },
        { path: 'subjects', select: 'name code' }
      ]);

      res.status(200).json({
        success: true,
        message: 'Student updated successfully',
        data: updatedStudent
      });
    } catch (error) {
      console.error('Update student error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update student',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   DELETE /api/students/:id
// @desc    Delete student
// @access  Private (Admin only)
router.delete('/:id', 
  authenticate, 
  authorize(['admin']), 
  validationSets.mongoIdParam,
  async (req, res) => {
    try {
      const studentId = req.params.id;

      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      // Soft delete by changing enrollment status
      student.enrollmentStatus = 'withdrawn';
      student.withdrawalDate = new Date();
      await student.save();

      res.status(200).json({
        success: true,
        message: 'Student record updated to withdrawn status'
      });
    } catch (error) {
      console.error('Delete student error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete student',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   GET /api/students/class/:classId
// @desc    Get students by class
// @access  Private (Admin, Teacher - if teaching class, Accountant)
router.get('/class/:classId', 
  authenticate, 
  authorize(['admin', 'teacher', 'accountant']),
  validationSets.mongoIdParam,
  async (req, res) => {
    try {
      const { classId } = req.params;
      const { section } = req.query;

      // Build filter
      const filter = { class: classId };
      if (section) {
        filter.section = section;
      }

      // Check if teacher has access to this class
      if (req.user.role === 'teacher') {
        const hasAccess = req.user.classes && 
          req.user.classes.some(tc => tc.class.toString() === classId);
        
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Access denied - you do not teach this class'
          });
        }
      }

      const students = await Student.find(filter)
        .populate('user', 'firstName lastName email phone avatar')
        .populate('subjects', 'name code')
        .sort({ rollNumber: 1, 'user.firstName': 1 });

      // Get class information
      const classInfo = await Class.findById(classId);
      
      res.status(200).json({
        success: true,
        data: {
          students,
          class: classInfo,
          totalStudents: students.length
        }
      });
    } catch (error) {
      console.error('Get students by class error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch students by class',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   GET /api/students/stats/overview
// @desc    Get student statistics overview
// @access  Private (Admin, Accountant)
router.get('/stats/overview', 
  authenticate, 
  authorize(['admin', 'accountant']),
  async (req, res) => {
    try {
      // Total students
      const totalStudents = await Student.countDocuments();
      
      // Students by enrollment status
      const statusStats = await Student.aggregate([
        {
          $group: {
            _id: '$enrollmentStatus',
            count: { $sum: 1 }
          }
        }
      ]);

      // Students by class
      const classStats = await Student.aggregate([
        {
          $lookup: {
            from: 'classes',
            localField: 'class',
            foreignField: '_id',
            as: 'classInfo'
          }
        },
        {
          $unwind: '$classInfo'
        },
        {
          $group: {
            _id: {
              class: '$classInfo.name',
              level: '$classInfo.level'
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.level': 1, '_id.class': 1 }
        }
      ]);

      // Recent admissions (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentAdmissions = await Student.countDocuments({
        admissionDate: { $gte: thirtyDaysAgo }
      });

      // Students by academic year
      const academicYearStats = await Student.aggregate([
        {
          $group: {
            _id: '$academicYear',
            count: { $sum: 1 }
          }
        }
      ]);

      res.status(200).json({
        success: true,
        data: {
          totalStudents,
          recentAdmissions,
          statusStats,
          classStats,
          academicYearStats
        }
      });
    } catch (error) {
      console.error('Get student stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch student statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   PUT /api/students/:id/subjects
// @desc    Update student subjects
// @access  Private (Admin only)
router.put('/:id/subjects', 
  authenticate, 
  authorize(['admin']), 
  validationSets.mongoIdParam,
  async (req, res) => {
    try {
      const studentId = req.params.id;
      const { subjects } = req.body;

      if (!Array.isArray(subjects)) {
        return res.status(400).json({
          success: false,
          message: 'Subjects must be an array'
        });
      }

      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      // Update subjects
      student.subjects = subjects;
      await student.save();

      // Populate and return updated student
      await student.populate([
        { path: 'user', select: 'firstName lastName' },
        { path: 'subjects', select: 'name code credits' }
      ]);

      res.status(200).json({
        success: true,
        message: 'Student subjects updated successfully',
        data: student
      });
    } catch (error) {
      console.error('Update student subjects error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update student subjects',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

module.exports = router;