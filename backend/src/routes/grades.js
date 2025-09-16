const express = require('express');
const mongoose = require('mongoose');
const Grade = require('../models/Grade');
const GradeComponent = require('../models/GradeComponent');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const { authenticate, authorize } = require('../middleware/auth');
const { validationSets } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/grades/components
// @desc    Get grade components for a class and subject
// @access  Private (Teacher, Admin)
router.get('/components',
  authenticate,
  async (req, res) => {
    try {
      const { classId, subjectId } = req.query;

      if (!classId || !subjectId) {
        return res.status(400).json({
          success: false,
          message: 'Class ID and Subject ID are required'
        });
      }

      // Check if teacher has access to this class
      if (req.user.role === 'teacher') {
        const teacher = await Teacher.findOne({ user: req.user._id });
        const hasAccess = teacher.assignedClasses?.some(ac => ac.class.toString() === classId) ||
                         teacher.classes?.some(c => c.class.toString() === classId);
        
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to this class'
          });
        }
      }

      const components = await GradeComponent.find({
        class: classId,
        subject: subjectId
      }).sort({ createdAt: 1 });

      res.status(200).json({
        success: true,
        data: components
      });
    } catch (error) {
      console.error('Get grade components error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch grade components',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// @route   POST /api/grades/components
// @desc    Create a new grade component
// @access  Private (Teacher, Admin)
router.post('/components',
  authenticate,
  async (req, res) => {
    try {
      const {
        name, type, maxMarks, weightage, description,
        classId, subjectId, dueDate
      } = req.body;

      // Validation
      if (!name || !type || !maxMarks || !weightage || !classId || !subjectId) {
        return res.status(400).json({
          success: false,
          message: 'All required fields must be provided'
        });
      }

      // Check if teacher has access to this class
      if (req.user.role === 'teacher') {
        const teacher = await Teacher.findOne({ user: req.user._id });
        const hasAccess = teacher.assignedClasses?.some(ac => ac.class.toString() === classId) ||
                         teacher.classes?.some(c => c.class.toString() === classId);
        
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to this class'
          });
        }
      }

      // Check if class and subject exist
      const [classExists, subjectExists] = await Promise.all([
        Class.findById(classId),
        Subject.findById(subjectId)
      ]);

      if (!classExists || !subjectExists) {
        return res.status(404).json({
          success: false,
          message: 'Class or Subject not found'
        });
      }

      // Create grade component
      const component = new GradeComponent({
        name,
        type,
        maxMarks,
        weightage,
        description,
        class: classId,
        subject: subjectId,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        createdBy: req.user._id
      });

      await component.save();

      res.status(201).json({
        success: true,
        message: 'Grade component created successfully',
        data: component
      });
    } catch (error) {
      console.error('Create grade component error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create grade component',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// @route   PUT /api/grades/components/:id
// @desc    Update a grade component
// @access  Private (Teacher, Admin)
router.put('/components/:id',
  authenticate,
  async (req, res) => {
    try {
      const componentId = req.params.id;
      const updates = req.body;

      const component = await GradeComponent.findById(componentId);
      if (!component) {
        return res.status(404).json({
          success: false,
          message: 'Grade component not found'
        });
      }

      // Check if teacher has access to this class
      if (req.user.role === 'teacher') {
        const teacher = await Teacher.findOne({ user: req.user._id });
        const hasAccess = teacher.assignedClasses?.some(ac => ac.class.toString() === component.class.toString()) ||
                         teacher.classes?.some(c => c.class.toString() === component.class.toString());
        
        if (!hasAccess && component.createdBy.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }
      }

      // Update component
      Object.keys(updates).forEach(key => {
        if (['name', 'type', 'maxMarks', 'weightage', 'description', 'dueDate'].includes(key)) {
          component[key] = updates[key];
        }
      });

      await component.save();

      res.status(200).json({
        success: true,
        message: 'Grade component updated successfully',
        data: component
      });
    } catch (error) {
      console.error('Update grade component error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update grade component',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// @route   DELETE /api/grades/components/:id
// @desc    Delete a grade component
// @access  Private (Teacher, Admin)
router.delete('/components/:id',
  authenticate,
  async (req, res) => {
    try {
      const componentId = req.params.id;

      const component = await GradeComponent.findById(componentId);
      if (!component) {
        return res.status(404).json({
          success: false,
          message: 'Grade component not found'
        });
      }

      // Check if teacher has access
      if (req.user.role === 'teacher') {
        if (component.createdBy.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }
      }

      // Check if there are any grades for this component
      const gradesCount = await Grade.countDocuments({ component: componentId });
      if (gradesCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete component with existing grades. Archive it instead.'
        });
      }

      await GradeComponent.findByIdAndDelete(componentId);

      res.status(200).json({
        success: true,
        message: 'Grade component deleted successfully'
      });
    } catch (error) {
      console.error('Delete grade component error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete grade component',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// @route   GET /api/grades
// @desc    Get grades for a class and component
// @access  Private (Teacher, Admin)
router.get('/',
  authenticate,
  async (req, res) => {
    try {
      const { classId, componentId, subjectId } = req.query;

      if (!classId) {
        return res.status(400).json({
          success: false,
          message: 'Class ID is required'
        });
      }

      // Check if teacher has access to this class
      if (req.user.role === 'teacher') {
        const teacher = await Teacher.findOne({ user: req.user._id });
        const hasAccess = teacher.assignedClasses?.some(ac => ac.class.toString() === classId) ||
                         teacher.classes?.some(c => c.class.toString() === classId);
        
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to this class'
          });
        }
      }

      // Build query
      const query = { class: classId };
      if (componentId) query.component = componentId;
      if (subjectId) query.subject = subjectId;

      const grades = await Grade.find(query)
        .populate('student', 'firstName lastName rollNumber')
        .populate('subject', 'name code')
        .populate('component', 'name type maxMarks weightage')
        .populate('gradedBy', 'firstName lastName')
        .sort({ 'student.rollNumber': 1 });

      res.status(200).json({
        success: true,
        data: grades
      });
    } catch (error) {
      console.error('Get grades error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch grades',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// @route   POST /api/grades/bulk
// @desc    Create or update grades in bulk
// @access  Private (Teacher, Admin)
router.post('/bulk',
  authenticate,
  async (req, res) => {
    try {
      const { grades } = req.body;

      if (!Array.isArray(grades) || grades.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Grades array is required'
        });
      }

      // Validate all grades have required fields
      for (const grade of grades) {
        if (!grade.studentId || !grade.componentId || grade.marksObtained === undefined) {
          return res.status(400).json({
            success: false,
            message: 'Each grade must have studentId, componentId, and marksObtained'
          });
        }
      }

      // Get component details for validation
      const componentIds = [...new Set(grades.map(g => g.componentId))];
      const components = await GradeComponent.find({ _id: { $in: componentIds } });

      if (components.length !== componentIds.length) {
        return res.status(404).json({
          success: false,
          message: 'One or more components not found'
        });
      }

      // Check teacher access for all components
      if (req.user.role === 'teacher') {
        const teacher = await Teacher.findOne({ user: req.user._id });
        for (const component of components) {
          const hasAccess = teacher.assignedClasses?.some(ac => ac.class.toString() === component.class.toString()) ||
                           teacher.classes?.some(c => c.class.toString() === component.class.toString());
          
          if (!hasAccess) {
            return res.status(403).json({
              success: false,
              message: `Access denied to class for component ${component.name}`
            });
          }
        }
      }

      // Process grades
      const gradeOperations = [];
      
      for (const gradeData of grades) {
        const component = components.find(c => c._id.toString() === gradeData.componentId);
        const percentage = (gradeData.marksObtained / component.maxMarks) * 100;
        const letterGrade = calculateLetterGrade(percentage);

        const gradeDoc = {
          student: gradeData.studentId,
          subject: component.subject,
          class: component.class,
          component: gradeData.componentId,
          marksObtained: gradeData.marksObtained,
          percentage: Math.round(percentage * 100) / 100,
          grade: letterGrade,
          remarks: gradeData.remarks || '',
          gradedBy: req.user._id,
          gradedAt: new Date()
        };

        gradeOperations.push({
          updateOne: {
            filter: {
              student: gradeData.studentId,
              component: gradeData.componentId
            },
            update: gradeDoc,
            upsert: true
          }
        });
      }

      // Execute bulk operations
      const result = await Grade.bulkWrite(gradeOperations);

      res.status(200).json({
        success: true,
        message: 'Grades saved successfully',
        data: {
          modified: result.modifiedCount,
          upserted: result.upsertedCount,
          total: grades.length
        }
      });
    } catch (error) {
      console.error('Bulk grades error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save grades',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// @route   GET /api/grades/summary/:classId/:subjectId
// @desc    Get grade summary for a class and subject
// @access  Private (Teacher, Admin)
router.get('/summary/:classId/:subjectId',
  authenticate,
  async (req, res) => {
    try {
      const { classId, subjectId } = req.params;

      // Check if teacher has access to this class
      if (req.user.role === 'teacher') {
        const teacher = await Teacher.findOne({ user: req.user._id });
        const hasAccess = teacher.assignedClasses?.some(ac => ac.class.toString() === classId) ||
                         teacher.classes?.some(c => c.class.toString() === classId);
        
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to this class'
          });
        }
      }

      // Get all students in the class
      const students = await Student.find({ class: classId })
        .select('firstName lastName rollNumber')
        .sort({ rollNumber: 1 });

      // Get all grade components for this class and subject
      const components = await GradeComponent.find({
        class: classId,
        subject: subjectId
      }).sort({ createdAt: 1 });

      // Get all grades for this class and subject
      const grades = await Grade.find({
        class: classId,
        subject: subjectId
      }).populate('component', 'name maxMarks weightage');

      // Calculate summary for each student
      const summaries = students.map(student => {
        const studentGrades = grades.filter(g => g.student.toString() === student._id.toString());
        
        let totalWeightedMarks = 0;
        let totalPossibleMarks = 0;

        components.forEach(component => {
          const grade = studentGrades.find(g => g.component._id.toString() === component._id.toString());
          if (grade) {
            const weightedMarks = (grade.marksObtained / component.maxMarks) * component.weightage;
            totalWeightedMarks += weightedMarks;
          }
          totalPossibleMarks += component.weightage;
        });

        const overallPercentage = totalPossibleMarks > 0 ? (totalWeightedMarks / totalPossibleMarks) * 100 : 0;

        return {
          student,
          grades: studentGrades,
          totalWeightedMarks: Math.round(totalWeightedMarks * 100) / 100,
          totalPossibleMarks,
          overallPercentage: Math.round(overallPercentage * 100) / 100,
          overallGrade: calculateLetterGrade(overallPercentage)
        };
      });

      // Sort by overall percentage (highest first)
      summaries.sort((a, b) => b.overallPercentage - a.overallPercentage);

      // Calculate class statistics
      const classAverage = summaries.length > 0 
        ? summaries.reduce((sum, s) => sum + s.overallPercentage, 0) / summaries.length
        : 0;

      const passingStudents = summaries.filter(s => s.overallPercentage >= 60).length;
      const passingRate = summaries.length > 0 ? (passingStudents / summaries.length) * 100 : 0;

      res.status(200).json({
        success: true,
        data: {
          summaries,
          components,
          statistics: {
            totalStudents: summaries.length,
            classAverage: Math.round(classAverage * 100) / 100,
            passingStudents,
            passingRate: Math.round(passingRate * 100) / 100
          }
        }
      });
    } catch (error) {
      console.error('Get grade summary error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch grade summary',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// @route   GET /api/grades/analytics/:classId/:subjectId
// @desc    Get grade analytics for a class and subject
// @access  Private (Teacher, Admin)
router.get('/analytics/:classId/:subjectId',
  authenticate,
  async (req, res) => {
    try {
      const { classId, subjectId } = req.params;

      // Check access
      if (req.user.role === 'teacher') {
        const teacher = await Teacher.findOne({ user: req.user._id });
        const hasAccess = teacher.assignedClasses?.some(ac => ac.class.toString() === classId) ||
                         teacher.classes?.some(c => c.class.toString() === classId);
        
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to this class'
          });
        }
      }

      // Get grade distribution
      const gradeDistribution = await Grade.aggregate([
        {
          $match: {
            class: mongoose.Types.ObjectId(classId),
            subject: mongoose.Types.ObjectId(subjectId)
          }
        },
        {
          $group: {
            _id: '$grade',
            count: { $sum: 1 }
          }
        }
      ]);

      // Get component performance
      const componentPerformance = await Grade.aggregate([
        {
          $match: {
            class: mongoose.Types.ObjectId(classId),
            subject: mongoose.Types.ObjectId(subjectId)
          }
        },
        {
          $lookup: {
            from: 'gradecomponents',
            localField: 'component',
            foreignField: '_id',
            as: 'componentInfo'
          }
        },
        {
          $unwind: '$componentInfo'
        },
        {
          $group: {
            _id: '$component',
            componentName: { $first: '$componentInfo.name' },
            averagePercentage: { $avg: '$percentage' },
            maxPercentage: { $max: '$percentage' },
            minPercentage: { $min: '$percentage' },
            totalStudents: { $sum: 1 }
          }
        }
      ]);

      res.status(200).json({
        success: true,
        data: {
          gradeDistribution,
          componentPerformance
        }
      });
    } catch (error) {
      console.error('Get grade analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch grade analytics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Helper function to calculate letter grade
function calculateLetterGrade(percentage) {
  if (percentage >= 90) return 'A+';
  if (percentage >= 85) return 'A';
  if (percentage >= 80) return 'B+';
  if (percentage >= 75) return 'B';
  if (percentage >= 70) return 'C+';
  if (percentage >= 65) return 'C';
  if (percentage >= 60) return 'D+';
  if (percentage >= 55) return 'D';
  return 'F';
}

module.exports = router;