const express = require('express');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const { authenticate, authorize } = require('../middleware/auth');
const { validationSets } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/classes
// @desc    Get all classes with filtering and pagination
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
      
      // Filter by level
      if (req.query.level) {
        filter.level = req.query.level;
      }
      
      // Filter by academic year
      if (req.query.academicYear) {
        filter.academicYear = req.query.academicYear;
      }
      
      // Filter by grade
      if (req.query.grade) {
        filter.grade = parseInt(req.query.grade);
      }

      // Search functionality
      if (req.query.search) {
        const searchRegex = new RegExp(req.query.search, 'i');
        filter.$or = [
          { name: searchRegex },
          { description: searchRegex }
        ];
      }

      // Get classes with population
      const classes = await Class.find(filter)
        .populate('subjects', 'name code credits')
        .populate('classTeacher', 'firstName lastName')
        .populate('createdBy', 'firstName lastName')
        .sort({ grade: 1, name: 1 })
        .skip(skip)
        .limit(limit);

      // Get student count for each class
      const classesWithStudentCount = await Promise.all(
        classes.map(async (classItem) => {
          const studentCount = await Student.countDocuments({ class: classItem._id });
          return {
            ...classItem.toObject(),
            studentCount
          };
        })
      );

      // Get total count for pagination
      const total = await Class.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);

      res.status(200).json({
        success: true,
        data: {
          classes: classesWithStudentCount,
          pagination: {
            currentPage: page,
            totalPages,
            totalClasses: total,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        }
      });
    } catch (error) {
      console.error('Get classes error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch classes',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   POST /api/classes
// @desc    Create new class
// @access  Private (Admin only)
router.post('/', 
  authenticate, 
  authorize(['admin']), 
  validationSets.createClass,
  async (req, res) => {
    try {
      const {
        name, level, grade, academicYear, description,
        maxStudents, subjects, classTeacher, schedule,
        classroom
      } = req.body;

      // Check if class name already exists for the same academic year
      const existingClass = await Class.findOne({ 
        name, 
        academicYear,
        level 
      });
      
      if (existingClass) {
        return res.status(400).json({
          success: false,
          message: 'Class with this name already exists for the academic year'
        });
      }

      // Validate subjects if provided
      if (subjects && subjects.length > 0) {
        const validSubjects = await Subject.find({ _id: { $in: subjects } });
        if (validSubjects.length !== subjects.length) {
          return res.status(400).json({
            success: false,
            message: 'One or more subjects are invalid'
          });
        }
      }

      // Create new class
      const newClass = new Class({
        name,
        level,
        grade,
        academicYear,
        description,
        maxStudents,
        subjects,
        classTeacher,
        schedule,
        classroom,
        createdBy: req.user.id
      });

      await newClass.save();

      // Populate the response
      await newClass.populate([
        { path: 'subjects', select: 'name code credits' },
        { path: 'classTeacher', select: 'firstName lastName email' },
        { path: 'createdBy', select: 'firstName lastName' }
      ]);

      res.status(201).json({
        success: true,
        message: 'Class created successfully',
        data: newClass
      });
    } catch (error) {
      console.error('Create class error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create class',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   GET /api/classes/:id
// @desc    Get class by ID
// @access  Private (Admin, Teacher - if teaching class, Student - if enrolled)
router.get('/:id', 
  authenticate, 
  validationSets.mongoIdParam,
  async (req, res) => {
    try {
      const classId = req.params.id;
      
      const classInfo = await Class.findById(classId)
        .populate('subjects', 'name code credits category')
        .populate('classTeacher', 'firstName lastName email phone')
        .populate('createdBy', 'firstName lastName');

      if (!classInfo) {
        return res.status(404).json({
          success: false,
          message: 'Class not found'
        });
      }

      // Check access permissions
      let canAccess = req.user.role === 'admin' || req.user.role === 'accountant';
      
      if (!canAccess && req.user.role === 'teacher') {
        // Check if teacher teaches this class
        const teacher = await Teacher.findOne({ user: req.user.id });
        canAccess = teacher && teacher.classes.some(c => c.class.toString() === classId);
      }
      
      if (!canAccess && req.user.role === 'student') {
        // Check if student is enrolled in this class
        const student = await Student.findOne({ user: req.user.id });
        canAccess = student && student.class.toString() === classId;
      }

      if (!canAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Get students count and list if allowed
      const studentCount = await Student.countDocuments({ class: classId });
      
      let studentsInfo = null;
      if (req.user.role === 'admin' || req.user.role === 'teacher') {
        studentsInfo = await Student.find({ class: classId })
          .populate('user', 'firstName lastName email')
          .select('rollNumber section studentId')
          .sort({ rollNumber: 1 });
      }

      res.status(200).json({
        success: true,
        data: {
          class: classInfo,
          studentCount,
          students: studentsInfo
        }
      });
    } catch (error) {
      console.error('Get class error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch class',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   PUT /api/classes/:id
// @desc    Update class
// @access  Private (Admin only)
router.put('/:id', 
  authenticate, 
  authorize(['admin']), 
  validationSets.mongoIdParam,
  async (req, res) => {
    try {
      const classId = req.params.id;
      const updates = req.body;
      
      // Find class
      const classRecord = await Class.findById(classId);
      if (!classRecord) {
        return res.status(404).json({
          success: false,
          message: 'Class not found'
        });
      }

      // Define allowed fields for update
      const allowedFields = [
        'name', 'description', 'maxStudents', 'subjects', 'classTeacher',
        'schedule', 'classroom', 'isActive'
      ];

      // Filter updates to only allowed fields
      const filteredUpdates = {};
      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
          filteredUpdates[key] = updates[key];
        }
      });

      // Validate subjects if being updated
      if (filteredUpdates.subjects) {
        const validSubjects = await Subject.find({ _id: { $in: filteredUpdates.subjects } });
        if (validSubjects.length !== filteredUpdates.subjects.length) {
          return res.status(400).json({
            success: false,
            message: 'One or more subjects are invalid'
          });
        }
      }

      // Update class
      const updatedClass = await Class.findByIdAndUpdate(
        classId,
        filteredUpdates,
        { 
          new: true, 
          runValidators: true 
        }
      ).populate([
        { path: 'subjects', select: 'name code credits' },
        { path: 'classTeacher', select: 'firstName lastName email' }
      ]);

      res.status(200).json({
        success: true,
        message: 'Class updated successfully',
        data: updatedClass
      });
    } catch (error) {
      console.error('Update class error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update class',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   DELETE /api/classes/:id
// @desc    Delete class
// @access  Private (Admin only)
router.delete('/:id', 
  authenticate, 
  authorize(['admin']), 
  validationSets.mongoIdParam,
  async (req, res) => {
    try {
      const classId = req.params.id;

      const classRecord = await Class.findById(classId);
      if (!classRecord) {
        return res.status(404).json({
          success: false,
          message: 'Class not found'
        });
      }

      // Check if there are students enrolled
      const studentCount = await Student.countDocuments({ class: classId });
      if (studentCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete class with enrolled students. Please transfer students first.'
        });
      }

      // Soft delete by marking as inactive
      classRecord.isActive = false;
      await classRecord.save();

      res.status(200).json({
        success: true,
        message: 'Class deactivated successfully'
      });
    } catch (error) {
      console.error('Delete class error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete class',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   GET /api/classes/:id/sections
// @desc    Get all sections for a class
// @access  Private (Admin, Teacher - if teaching class)
router.get('/:id/sections', 
  authenticate, 
  authorize(['admin', 'teacher']),
  validationSets.mongoIdParam,
  async (req, res) => {
    try {
      const classId = req.params.id;

      // Verify class exists
      const classRecord = await Class.findById(classId);
      if (!classRecord) {
        return res.status(404).json({
          success: false,
          message: 'Class not found'
        });
      }

      // Get all unique sections for this class
      const sections = await Student.aggregate([
        { $match: { class: classRecord._id } },
        {
          $group: {
            _id: '$section',
            studentCount: { $sum: 1 },
            students: {
              $push: {
                id: '$_id',
                rollNumber: '$rollNumber',
                studentId: '$studentId',
                user: '$user'
              }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // Populate student user data
      const sectionsWithUsers = await Student.populate(sections, {
        path: 'students.user',
        select: 'firstName lastName'
      });

      res.status(200).json({
        success: true,
        data: {
          class: {
            id: classRecord._id,
            name: classRecord.name,
            level: classRecord.level
          },
          sections: sectionsWithUsers
        }
      });
    } catch (error) {
      console.error('Get class sections error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch class sections',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   GET /api/classes/stats/overview
// @desc    Get class statistics overview
// @access  Private (Admin)
router.get('/stats/overview', 
  authenticate, 
  authorize(['admin']),
  async (req, res) => {
    try {
      // Total classes
      const totalClasses = await Class.countDocuments();
      const activeClasses = await Class.countDocuments({ isActive: true });
      
      // Classes by level
      const levelStats = await Class.aggregate([
        {
          $group: {
            _id: '$level',
            count: { $sum: 1 },
            totalCapacity: { $sum: '$maxStudents' }
          }
        }
      ]);

      // Classes by academic year
      const academicYearStats = await Class.aggregate([
        {
          $group: {
            _id: '$academicYear',
            count: { $sum: 1 }
          }
        }
      ]);

      // Class utilization (students vs capacity)
      const utilizationStats = await Class.aggregate([
        {
          $lookup: {
            from: 'students',
            localField: '_id',
            foreignField: 'class',
            as: 'students'
          }
        },
        {
          $project: {
            name: 1,
            level: 1,
            maxStudents: 1,
            currentStudents: { $size: '$students' },
            utilizationPercentage: {
              $multiply: [
                { $divide: [{ $size: '$students' }, '$maxStudents'] },
                100
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            totalCapacity: { $sum: '$maxStudents' },
            totalEnrolled: { $sum: '$currentStudents' },
            averageUtilization: { $avg: '$utilizationPercentage' },
            classes: {
              $push: {
                name: '$name',
                level: '$level',
                capacity: '$maxStudents',
                enrolled: '$currentStudents',
                utilization: '$utilizationPercentage'
              }
            }
          }
        }
      ]);

      res.status(200).json({
        success: true,
        data: {
          totalClasses,
          activeClasses,
          levelStats,
          academicYearStats,
          utilizationStats: utilizationStats[0] || {
            totalCapacity: 0,
            totalEnrolled: 0,
            averageUtilization: 0,
            classes: []
          }
        }
      });
    } catch (error) {
      console.error('Get class stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch class statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   POST /api/classes/:id/subjects
// @desc    Add subjects to class
// @access  Private (Admin only)
router.post('/:id/subjects', 
  authenticate, 
  authorize(['admin']), 
  validationSets.mongoIdParam,
  async (req, res) => {
    try {
      const classId = req.params.id;
      const { subjects } = req.body;

      if (!Array.isArray(subjects) || subjects.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Subjects array is required'
        });
      }

      const classRecord = await Class.findById(classId);
      if (!classRecord) {
        return res.status(404).json({
          success: false,
          message: 'Class not found'
        });
      }

      // Validate subjects exist
      const validSubjects = await Subject.find({ _id: { $in: subjects } });
      if (validSubjects.length !== subjects.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more subjects are invalid'
        });
      }

      // Add new subjects (avoid duplicates)
      const existingSubjects = classRecord.subjects.map(s => s.toString());
      const newSubjects = subjects.filter(s => !existingSubjects.includes(s));
      
      classRecord.subjects.push(...newSubjects);
      await classRecord.save();

      // Populate and return updated class
      await classRecord.populate('subjects', 'name code credits category');

      res.status(200).json({
        success: true,
        message: 'Subjects added to class successfully',
        data: classRecord
      });
    } catch (error) {
      console.error('Add subjects to class error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add subjects to class',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   DELETE /api/classes/:id/subjects/:subjectId
// @desc    Remove subject from class
// @access  Private (Admin only)
router.delete('/:id/subjects/:subjectId', 
  authenticate, 
  authorize(['admin']),
  async (req, res) => {
    try {
      const { id: classId, subjectId } = req.params;

      const classRecord = await Class.findById(classId);
      if (!classRecord) {
        return res.status(404).json({
          success: false,
          message: 'Class not found'
        });
      }

      // Remove subject from class
      const subjectIndex = classRecord.subjects.findIndex(s => s.toString() === subjectId);
      if (subjectIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Subject not found in this class'
        });
      }

      classRecord.subjects.splice(subjectIndex, 1);
      await classRecord.save();

      res.status(200).json({
        success: true,
        message: 'Subject removed from class successfully'
      });
    } catch (error) {
      console.error('Remove subject from class error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove subject from class',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

module.exports = router;