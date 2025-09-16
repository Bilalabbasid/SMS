const express = require('express');
const Exam = require('../models/Exam');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/exams
// @desc    Get all exams with filtering
// @access  Private (All roles)
router.get('/', 
  authenticate,
  async (req, res) => {
    try {
      const { type, status, classId, subjectId, page = 1, limit = 20 } = req.query;
      const skip = (page - 1) * limit;

      // Build filter
      let filter = {};
      if (type) filter.type = type;
      if (status) filter.status = status;
      if (classId) filter.class = classId;
      if (subjectId) filter.subject = subjectId;

      // Role-based filtering
      if (req.user.role === 'teacher' && req.user.teacherProfile) {
        const teacherSubjects = req.user.teacherProfile.subjects.map(s => s.subject);
        filter.subject = { $in: teacherSubjects };
      }

      if (req.user.role === 'student' && req.user.studentProfile) {
        filter.class = req.user.studentProfile.class;
      }

      if (req.user.role === 'parent' && req.user.children.length > 0) {
        const childrenClasses = req.user.children.map(child => child.class);
        filter.class = { $in: childrenClasses };
      }

      const exams = await Exam.find(filter)
        .populate('class', 'name level')
        .populate('subject', 'name code')
        .populate('createdBy', 'firstName lastName')
        .sort({ examDate: 1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Exam.countDocuments(filter);

      res.status(200).json({
        success: true,
        data: {
          exams,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalRecords: total,
            hasNextPage: page < Math.ceil(total / limit),
            hasPrevPage: page > 1
          }
        }
      });

    } catch (error) {
      console.error('Get exams error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch exams',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   GET /api/exams/:id
// @desc    Get single exam
// @access  Private
router.get('/:id',
  authenticate,
  async (req, res) => {
    try {
      const exam = await Exam.findById(req.params.id)
        .populate('class', 'name level students')
        .populate('subject', 'name code description')
        .populate('createdBy', 'firstName lastName')
        .populate({
          path: 'results.student',
          select: 'firstName lastName rollNumber'
        });

      if (!exam) {
        return res.status(404).json({
          success: false,
          message: 'Exam not found'
        });
      }

      // Role-based access control
      if (req.user.role === 'teacher') {
        const hasAccess = req.user.teacherProfile?.subjects.some(s => 
          s.subject.toString() === exam.subject._id.toString()
        );
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to this exam'
          });
        }
      }

      if (req.user.role === 'student') {
        if (req.user.studentProfile?.class.toString() !== exam.class._id.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to this exam'
          });
        }
      }

      res.status(200).json({
        success: true,
        data: exam
      });

    } catch (error) {
      console.error('Get exam error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch exam',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   POST /api/exams
// @desc    Create new exam
// @access  Private (Admin, Teacher)
router.post('/',
  authenticate,
  authorize(['admin', 'teacher']),
  async (req, res) => {
    try {
      const {
        title,
        description,
        type,
        class: classId,
        subject: subjectId,
        examDate,
        startTime,
        duration,
        maxMarks,
        passingMarks,
        instructions,
        syllabus
      } = req.body;

      // Validate required fields
      if (!title || !type || !classId || !subjectId || !examDate || !maxMarks) {
        return res.status(400).json({
          success: false,
          message: 'Required fields: title, type, class, subject, examDate, maxMarks'
        });
      }

      // Verify class and subject exist
      const [classDoc, subjectDoc] = await Promise.all([
        Class.findById(classId),
        Subject.findById(subjectId)
      ]);

      if (!classDoc || !subjectDoc) {
        return res.status(404).json({
          success: false,
          message: 'Class or subject not found'
        });
      }

      // Check if teacher has access to this subject
      if (req.user.role === 'teacher') {
        const hasAccess = req.user.teacherProfile?.subjects.some(s => 
          s.subject.toString() === subjectId
        );
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to create exam for this subject'
          });
        }
      }

      const exam = new Exam({
        title,
        description,
        type,
        class: classId,
        subject: subjectId,
        examDate: new Date(examDate),
        startTime,
        duration: duration || 60,
        maxMarks: parseInt(maxMarks),
        passingMarks: passingMarks || Math.ceil(maxMarks * 0.4),
        instructions: instructions || [],
        syllabus: syllabus || [],
        status: 'scheduled',
        createdBy: req.user._id
      });

      await exam.save();

      const populatedExam = await Exam.findById(exam._id)
        .populate('class', 'name level')
        .populate('subject', 'name code')
        .populate('createdBy', 'firstName lastName');

      res.status(201).json({
        success: true,
        message: 'Exam created successfully',
        data: populatedExam
      });

    } catch (error) {
      console.error('Create exam error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create exam',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   PUT /api/exams/:id
// @desc    Update exam
// @access  Private (Admin, Teacher)
router.put('/:id',
  authenticate,
  authorize(['admin', 'teacher']),
  async (req, res) => {
    try {
      const examId = req.params.id;
      const updates = req.body;

      const exam = await Exam.findById(examId);
      if (!exam) {
        return res.status(404).json({
          success: false,
          message: 'Exam not found'
        });
      }

      // Check if teacher has access
      if (req.user.role === 'teacher') {
        if (exam.createdBy.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }
      }

      // Prevent updating if exam is completed
      if (exam.status === 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Cannot update completed exam'
        });
      }

      const allowedUpdates = [
        'title', 'description', 'examDate', 'startTime', 'duration',
        'maxMarks', 'passingMarks', 'instructions', 'syllabus', 'status'
      ];

      const filteredUpdates = {};
      Object.keys(updates).forEach(key => {
        if (allowedUpdates.includes(key)) {
          filteredUpdates[key] = updates[key];
        }
      });

      const updatedExam = await Exam.findByIdAndUpdate(
        examId,
        filteredUpdates,
        { new: true, runValidators: true }
      )
      .populate('class', 'name level')
      .populate('subject', 'name code')
      .populate('createdBy', 'firstName lastName');

      res.status(200).json({
        success: true,
        message: 'Exam updated successfully',
        data: updatedExam
      });

    } catch (error) {
      console.error('Update exam error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update exam',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   POST /api/exams/:id/results
// @desc    Add or update exam results
// @access  Private (Admin, Teacher)
router.post('/:id/results',
  authenticate,
  authorize(['admin', 'teacher']),
  async (req, res) => {
    try {
      const examId = req.params.id;
      const { results } = req.body;

      if (!results || !Array.isArray(results)) {
        return res.status(400).json({
          success: false,
          message: 'Results array is required'
        });
      }

      const exam = await Exam.findById(examId);
      if (!exam) {
        return res.status(404).json({
          success: false,
          message: 'Exam not found'
        });
      }

      // Check teacher access
      if (req.user.role === 'teacher') {
        if (exam.createdBy.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }
      }

      // Update or add results
      for (const result of results) {
        const { studentId, marksObtained, grade, remarks } = result;

        if (marksObtained > exam.maxMarks) {
          return res.status(400).json({
            success: false,
            message: `Marks cannot exceed maximum marks (${exam.maxMarks})`
          });
        }

        const existingResultIndex = exam.results.findIndex(r => 
          r.student.toString() === studentId
        );

        const resultData = {
          student: studentId,
          marksObtained: parseInt(marksObtained),
          grade: grade || calculateGrade(marksObtained, exam.maxMarks),
          percentage: parseFloat(((marksObtained / exam.maxMarks) * 100).toFixed(2)),
          status: marksObtained >= exam.passingMarks ? 'pass' : 'fail',
          remarks: remarks || '',
          gradedBy: req.user._id,
          gradedAt: new Date()
        };

        if (existingResultIndex >= 0) {
          exam.results[existingResultIndex] = resultData;
        } else {
          exam.results.push(resultData);
        }
      }

      // Update exam status if all students have results
      const classDoc = await Class.findById(exam.class);
      if (exam.results.length >= classDoc.students.length) {
        exam.status = 'completed';
      }

      await exam.save();

      const updatedExam = await Exam.findById(examId)
        .populate('class', 'name level')
        .populate('subject', 'name code')
        .populate({
          path: 'results.student',
          select: 'firstName lastName rollNumber'
        });

      res.status(200).json({
        success: true,
        message: 'Results updated successfully',
        data: updatedExam
      });

    } catch (error) {
      console.error('Update exam results error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update exam results',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   GET /api/exams/student/:studentId/results
// @desc    Get exam results for a student
// @access  Private (Admin, Teacher, Student, Parent)
router.get('/student/:studentId/results',
  authenticate,
  async (req, res) => {
    try {
      const { studentId } = req.params;
      const { subjectId, startDate, endDate } = req.query;

      // Authorization check
      if (req.user.role === 'student') {
        if (req.user.studentProfile?._id.toString() !== studentId) {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }
      }

      if (req.user.role === 'parent') {
        const hasChild = req.user.children.some(child => 
          child._id.toString() === studentId
        );
        if (!hasChild) {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }
      }

      let filter = {
        'results.student': studentId,
        status: 'completed'
      };

      if (subjectId) filter.subject = subjectId;
      if (startDate || endDate) {
        filter.examDate = {};
        if (startDate) filter.examDate.$gte = new Date(startDate);
        if (endDate) filter.examDate.$lte = new Date(endDate);
      }

      const exams = await Exam.find(filter)
        .populate('class', 'name level')
        .populate('subject', 'name code')
        .select('title type examDate maxMarks passingMarks results')
        .sort({ examDate: -1 });

      // Extract student's results
      const studentResults = exams.map(exam => {
        const studentResult = exam.results.find(r => 
          r.student.toString() === studentId
        );

        return {
          exam: {
            _id: exam._id,
            title: exam.title,
            type: exam.type,
            examDate: exam.examDate,
            maxMarks: exam.maxMarks,
            passingMarks: exam.passingMarks,
            class: exam.class,
            subject: exam.subject
          },
          result: studentResult
        };
      }).filter(item => item.result);

      res.status(200).json({
        success: true,
        data: studentResults
      });

    } catch (error) {
      console.error('Get student results error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch student results',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   DELETE /api/exams/:id
// @desc    Delete exam
// @access  Private (Admin only)
router.delete('/:id',
  authenticate,
  authorize(['admin']),
  async (req, res) => {
    try {
      const exam = await Exam.findById(req.params.id);
      if (!exam) {
        return res.status(404).json({
          success: false,
          message: 'Exam not found'
        });
      }

      await Exam.findByIdAndDelete(req.params.id);

      res.status(200).json({
        success: true,
        message: 'Exam deleted successfully'
      });

    } catch (error) {
      console.error('Delete exam error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete exam',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// Helper function to calculate grade
function calculateGrade(marks, maxMarks) {
  const percentage = (marks / maxMarks) * 100;
  
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C+';
  if (percentage >= 40) return 'C';
  return 'F';
}

module.exports = router;