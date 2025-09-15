const express = require('express');
const Subject = require('../models/Subject');
const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const { authenticate, authorize } = require('../middleware/auth');
const { validationSets } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/subjects
// @desc    Get all subjects with filtering and pagination
// @access  Private (Admin, Teacher)
router.get('/', 
  authenticate, 
  authorize(['admin', 'teacher']), 
  validationSets.pagination,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      
      // Build filter object
      const filter = {};
      
      // Filter by category
      if (req.query.category) {
        filter.category = req.query.category;
      }
      
      // Filter by type
      if (req.query.type) {
        filter.type = req.query.type;
      }
      
      // Filter by academic year
      if (req.query.academicYear) {
        filter.academicYear = req.query.academicYear;
      }
      
      // Filter by class level
      if (req.query.level) {
        filter.level = req.query.level;
      }

      // Search functionality
      if (req.query.search) {
        const searchRegex = new RegExp(req.query.search, 'i');
        filter.$or = [
          { name: searchRegex },
          { code: searchRegex },
          { description: searchRegex }
        ];
      }

      // Get subjects with population
      const subjects = await Subject.find(filter)
        .populate('assignedTeachers.teacher', 'firstName lastName')
        .populate('createdBy', 'firstName lastName')
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit);

      // Get total count for pagination
      const total = await Subject.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);

      res.status(200).json({
        success: true,
        data: {
          subjects,
          pagination: {
            currentPage: page,
            totalPages,
            totalSubjects: total,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        }
      });
    } catch (error) {
      console.error('Get subjects error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subjects',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   POST /api/subjects
// @desc    Create new subject
// @access  Private (Admin only)
router.post('/', 
  authenticate, 
  authorize(['admin']), 
  validationSets.createSubject,
  async (req, res) => {
    try {
      const {
        name, code, category, type, level, credits, totalMarks, passingMarks,
        academicYear, description, prerequisites, syllabus, assignedTeachers
      } = req.body;

      // Check if subject code already exists for the same academic year
      const existingSubject = await Subject.findOne({ 
        code: code.toUpperCase(),
        academicYear 
      });
      
      if (existingSubject) {
        return res.status(400).json({
          success: false,
          message: 'Subject with this code already exists for the academic year'
        });
      }

      // Create new subject
      const subject = new Subject({
        name,
        code: code.toUpperCase(),
        category,
        type,
        level,
        credits,
        totalMarks,
        passingMarks,
        academicYear,
        description,
        prerequisites,
        syllabus,
        assignedTeachers,
        createdBy: req.user.id
      });

      await subject.save();

      // Populate the response
      await subject.populate([
        { path: 'assignedTeachers.teacher', select: 'firstName lastName email' },
        { path: 'createdBy', select: 'firstName lastName' }
      ]);

      res.status(201).json({
        success: true,
        message: 'Subject created successfully',
        data: subject
      });
    } catch (error) {
      console.error('Create subject error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create subject',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   GET /api/subjects/:id
// @desc    Get subject by ID
// @access  Private (Admin, Teacher - if teaching subject, Student - if enrolled)
router.get('/:id', 
  authenticate, 
  validationSets.mongoIdParam,
  async (req, res) => {
    try {
      const subjectId = req.params.id;
      
      const subject = await Subject.findById(subjectId)
        .populate('assignedTeachers.teacher', 'firstName lastName email phone')
        .populate('createdBy', 'firstName lastName');

      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'Subject not found'
        });
      }

      // Check access permissions
      let canAccess = req.user.role === 'admin';
      
      if (!canAccess && req.user.role === 'teacher') {
        // Check if teacher is assigned to this subject
        const isAssigned = subject.assignedTeachers.some(
          at => at.teacher._id.toString() === req.user.id
        );
        canAccess = isAssigned;
      }
      
      if (!canAccess && req.user.role === 'student') {
        // Check if student is enrolled in this subject
        const student = await Student.findOne({ user: req.user.id });
        canAccess = student && student.subjects.includes(subjectId);
      }

      if (!canAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Get classes where this subject is taught
      const classes = await Class.find({ subjects: subjectId })
        .select('name level grade')
        .sort({ grade: 1, name: 1 });

      res.status(200).json({
        success: true,
        data: {
          subject,
          classes
        }
      });
    } catch (error) {
      console.error('Get subject error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subject',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   PUT /api/subjects/:id
// @desc    Update subject
// @access  Private (Admin only)
router.put('/:id', 
  authenticate, 
  authorize(['admin']), 
  validationSets.mongoIdParam,
  async (req, res) => {
    try {
      const subjectId = req.params.id;
      const updates = req.body;
      
      // Find subject
      const subject = await Subject.findById(subjectId);
      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'Subject not found'
        });
      }

      // Define allowed fields for update
      const allowedFields = [
        'name', 'description', 'category', 'type', 'credits', 'totalMarks',
        'passingMarks', 'prerequisites', 'syllabus', 'assignedTeachers', 'isActive'
      ];

      // Filter updates to only allowed fields
      const filteredUpdates = {};
      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
          filteredUpdates[key] = updates[key];
        }
      });

      // Update subject
      const updatedSubject = await Subject.findByIdAndUpdate(
        subjectId,
        filteredUpdates,
        { 
          new: true, 
          runValidators: true 
        }
      ).populate([
        { path: 'assignedTeachers.teacher', select: 'firstName lastName email' },
        { path: 'createdBy', select: 'firstName lastName' }
      ]);

      res.status(200).json({
        success: true,
        message: 'Subject updated successfully',
        data: updatedSubject
      });
    } catch (error) {
      console.error('Update subject error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update subject',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   DELETE /api/subjects/:id
// @desc    Delete subject
// @access  Private (Admin only)
router.delete('/:id', 
  authenticate, 
  authorize(['admin']), 
  validationSets.mongoIdParam,
  async (req, res) => {
    try {
      const subjectId = req.params.id;

      const subject = await Subject.findById(subjectId);
      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'Subject not found'
        });
      }

      // Check if subject is assigned to any classes
      const classCount = await Class.countDocuments({ subjects: subjectId });
      if (classCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete subject that is assigned to classes. Please remove from classes first.'
        });
      }

      // Check if subject is assigned to any students
      const studentCount = await Student.countDocuments({ subjects: subjectId });
      if (studentCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete subject that is assigned to students. Please remove from students first.'
        });
      }

      // Soft delete by marking as inactive
      subject.isActive = false;
      await subject.save();

      res.status(200).json({
        success: true,
        message: 'Subject deactivated successfully'
      });
    } catch (error) {
      console.error('Delete subject error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete subject',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   GET /api/subjects/category/:category
// @desc    Get subjects by category
// @access  Private (Admin, Teacher)
router.get('/category/:category', 
  authenticate, 
  authorize(['admin', 'teacher']),
  validationSets.pagination,
  async (req, res) => {
    try {
      const { category } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const validCategories = [
        'Mathematics', 'Science', 'Language', 'Social Studies',
        'Computer Science', 'Arts', 'Physical Education', 'Music',
        'Vocational', 'Other'
      ];

      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category specified'
        });
      }

      const filter = { category, isActive: true };
      
      // Add academic year filter if provided
      if (req.query.academicYear) {
        filter.academicYear = req.query.academicYear;
      }

      const subjects = await Subject.find(filter)
        .populate('assignedTeachers.teacher', 'firstName lastName')
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit);

      const total = await Subject.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);

      res.status(200).json({
        success: true,
        data: {
          subjects,
          category,
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
      console.error('Get subjects by category error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subjects by category',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   GET /api/subjects/stats/overview
// @desc    Get subject statistics overview
// @access  Private (Admin)
router.get('/stats/overview', 
  authenticate, 
  authorize(['admin']),
  async (req, res) => {
    try {
      // Total subjects
      const totalSubjects = await Subject.countDocuments();
      const activeSubjects = await Subject.countDocuments({ isActive: true });
      
      // Subjects by category
      const categoryStats = await Subject.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            totalCredits: { $sum: '$credits' }
          }
        }
      ]);

      // Subjects by type
      const typeStats = await Subject.aggregate([
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 }
          }
        }
      ]);

      // Subjects by level
      const levelStats = await Subject.aggregate([
        {
          $group: {
            _id: '$level',
            count: { $sum: 1 }
          }
        }
      ]);

      // Teacher assignment statistics
      const teacherAssignmentStats = await Subject.aggregate([
        {
          $project: {
            name: 1,
            code: 1,
            teacherCount: { $size: '$assignedTeachers' }
          }
        },
        {
          $group: {
            _id: null,
            totalAssignments: { $sum: '$teacherCount' },
            averageTeachersPerSubject: { $avg: '$teacherCount' },
            subjectsWithoutTeachers: {
              $sum: { $cond: [{ $eq: ['$teacherCount', 0] }, 1, 0] }
            }
          }
        }
      ]);

      res.status(200).json({
        success: true,
        data: {
          totalSubjects,
          activeSubjects,
          categoryStats,
          typeStats,
          levelStats,
          teacherAssignmentStats: teacherAssignmentStats[0] || {
            totalAssignments: 0,
            averageTeachersPerSubject: 0,
            subjectsWithoutTeachers: 0
          }
        }
      });
    } catch (error) {
      console.error('Get subject stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subject statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   POST /api/subjects/:id/teachers
// @desc    Assign teacher to subject
// @access  Private (Admin only)
router.post('/:id/teachers', 
  authenticate, 
  authorize(['admin']), 
  validationSets.mongoIdParam,
  async (req, res) => {
    try {
      const subjectId = req.params.id;
      const { teacherId, role = 'teacher' } = req.body;

      if (!teacherId) {
        return res.status(400).json({
          success: false,
          message: 'Teacher ID is required'
        });
      }

      const subject = await Subject.findById(subjectId);
      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'Subject not found'
        });
      }

      // Check if teacher exists
      const teacher = await Teacher.findOne({ user: teacherId });
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: 'Teacher not found'
        });
      }

      // Check if teacher is already assigned
      const isAlreadyAssigned = subject.assignedTeachers.some(
        at => at.teacher.toString() === teacherId
      );

      if (isAlreadyAssigned) {
        return res.status(400).json({
          success: false,
          message: 'Teacher is already assigned to this subject'
        });
      }

      // Add teacher to subject
      subject.assignedTeachers.push({
        teacher: teacherId,
        role,
        assignedDate: new Date()
      });

      await subject.save();

      // Add subject to teacher's subjects list
      if (!teacher.subjects.includes(subjectId)) {
        teacher.subjects.push(subjectId);
        await teacher.save();
      }

      // Populate and return updated subject
      await subject.populate('assignedTeachers.teacher', 'firstName lastName email');

      res.status(200).json({
        success: true,
        message: 'Teacher assigned to subject successfully',
        data: subject
      });
    } catch (error) {
      console.error('Assign teacher to subject error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to assign teacher to subject',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   DELETE /api/subjects/:id/teachers/:teacherId
// @desc    Remove teacher from subject
// @access  Private (Admin only)
router.delete('/:id/teachers/:teacherId', 
  authenticate, 
  authorize(['admin']),
  async (req, res) => {
    try {
      const { id: subjectId, teacherId } = req.params;

      const subject = await Subject.findById(subjectId);
      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'Subject not found'
        });
      }

      // Remove teacher from subject
      const teacherIndex = subject.assignedTeachers.findIndex(
        at => at.teacher.toString() === teacherId
      );

      if (teacherIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Teacher not assigned to this subject'
        });
      }

      subject.assignedTeachers.splice(teacherIndex, 1);
      await subject.save();

      // Remove subject from teacher's subjects list
      const teacher = await Teacher.findOne({ user: teacherId });
      if (teacher) {
        teacher.subjects = teacher.subjects.filter(s => s.toString() !== subjectId);
        await teacher.save();
      }

      res.status(200).json({
        success: true,
        message: 'Teacher removed from subject successfully'
      });
    } catch (error) {
      console.error('Remove teacher from subject error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove teacher from subject',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

module.exports = router;