const express = require('express');
const Assignment = require('../models/Assignment');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/assignments
// @desc    Get all assignments with filtering
// @access  Private (All roles)
router.get('/', 
  authenticate,
  async (req, res) => {
    try {
      const { status, classId, subjectId, priority, page = 1, limit = 20 } = req.query;
      const skip = (page - 1) * limit;

      // Build filter
      let filter = {};
      if (status) filter.status = status;
      if (classId) filter.class = classId;
      if (subjectId) filter.subject = subjectId;
      if (priority) filter.priority = priority;

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

      const assignments = await Assignment.find(filter)
        .populate('class', 'name level')
        .populate('subject', 'name code')
        .populate('assignedBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Assignment.countDocuments(filter);

      res.status(200).json({
        success: true,
        data: {
          assignments,
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
      console.error('Get assignments error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch assignments',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   GET /api/assignments/:id
// @desc    Get single assignment
// @access  Private
router.get('/:id',
  authenticate,
  async (req, res) => {
    try {
      const assignment = await Assignment.findById(req.params.id)
        .populate('class', 'name level students')
        .populate('subject', 'name code description')
        .populate('assignedBy', 'firstName lastName')
        .populate({
          path: 'submissions.student',
          select: 'firstName lastName rollNumber'
        });

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Assignment not found'
        });
      }

      // Role-based access control
      if (req.user.role === 'teacher') {
        const hasAccess = req.user.teacherProfile?.subjects.some(s => 
          s.subject.toString() === assignment.subject._id.toString()
        );
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to this assignment'
          });
        }
      }

      if (req.user.role === 'student') {
        if (req.user.studentProfile?.class.toString() !== assignment.class._id.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to this assignment'
          });
        }
      }

      res.status(200).json({
        success: true,
        data: assignment
      });

    } catch (error) {
      console.error('Get assignment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch assignment',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   POST /api/assignments
// @desc    Create new assignment
// @access  Private (Admin, Teacher)
router.post('/',
  authenticate,
  authorize(['admin', 'teacher']),
  async (req, res) => {
    try {
      const {
        title,
        description,
        class: classId,
        subject: subjectId,
        dueDate,
        maxMarks,
        priority,
        instructions,
        resources,
        attachments
      } = req.body;

      // Validate required fields
      if (!title || !description || !classId || !subjectId || !dueDate || !maxMarks) {
        return res.status(400).json({
          success: false,
          message: 'Required fields: title, description, class, subject, dueDate, maxMarks'
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
            message: 'Access denied to create assignment for this subject'
          });
        }
      }

      const assignment = new Assignment({
        title,
        description,
        class: classId,
        subject: subjectId,
        dueDate: new Date(dueDate),
        maxMarks: parseInt(maxMarks),
        priority: priority || 'medium',
        instructions: instructions || [],
        resources: resources || [],
        attachments: attachments || [],
        status: 'active',
        assignedBy: req.user._id
      });

      await assignment.save();

      const populatedAssignment = await Assignment.findById(assignment._id)
        .populate('class', 'name level')
        .populate('subject', 'name code')
        .populate('assignedBy', 'firstName lastName');

      res.status(201).json({
        success: true,
        message: 'Assignment created successfully',
        data: populatedAssignment
      });

    } catch (error) {
      console.error('Create assignment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create assignment',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   PUT /api/assignments/:id
// @desc    Update assignment
// @access  Private (Admin, Teacher)
router.put('/:id',
  authenticate,
  authorize(['admin', 'teacher']),
  async (req, res) => {
    try {
      const assignmentId = req.params.id;
      const updates = req.body;

      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Assignment not found'
        });
      }

      // Check if teacher has access
      if (req.user.role === 'teacher') {
        if (assignment.assignedBy.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }
      }

      const allowedUpdates = [
        'title', 'description', 'dueDate', 'maxMarks', 'priority',
        'instructions', 'resources', 'attachments', 'status'
      ];

      const filteredUpdates = {};
      Object.keys(updates).forEach(key => {
        if (allowedUpdates.includes(key)) {
          filteredUpdates[key] = updates[key];
        }
      });

      const updatedAssignment = await Assignment.findByIdAndUpdate(
        assignmentId,
        filteredUpdates,
        { new: true, runValidators: true }
      )
      .populate('class', 'name level')
      .populate('subject', 'name code')
      .populate('assignedBy', 'firstName lastName');

      res.status(200).json({
        success: true,
        message: 'Assignment updated successfully',
        data: updatedAssignment
      });

    } catch (error) {
      console.error('Update assignment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update assignment',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   POST /api/assignments/:id/submit
// @desc    Submit assignment (Student)
// @access  Private (Student)
router.post('/:id/submit',
  authenticate,
  authorize(['student']),
  async (req, res) => {
    try {
      const assignmentId = req.params.id;
      const { content, attachments, comments } = req.body;

      if (!content) {
        return res.status(400).json({
          success: false,
          message: 'Submission content is required'
        });
      }

      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Assignment not found'
        });
      }

      // Check if student belongs to assignment's class
      if (req.user.studentProfile?.class.toString() !== assignment.class.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this assignment'
        });
      }

      // Check if assignment is still active and not past due
      if (assignment.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'Assignment is not active'
        });
      }

      const now = new Date();
      const isLate = now > assignment.dueDate;

      // Check if student has already submitted
      const existingSubmissionIndex = assignment.submissions.findIndex(s => 
        s.student.toString() === req.user.studentProfile._id.toString()
      );

      const submissionData = {
        student: req.user.studentProfile._id,
        content,
        attachments: attachments || [],
        submittedAt: now,
        status: isLate ? 'late' : 'submitted',
        comments: comments || '',
        isLate
      };

      if (existingSubmissionIndex >= 0) {
        // Update existing submission
        assignment.submissions[existingSubmissionIndex] = submissionData;
      } else {
        // Add new submission
        assignment.submissions.push(submissionData);
      }

      await assignment.save();

      const updatedAssignment = await Assignment.findById(assignmentId)
        .populate('class', 'name level')
        .populate('subject', 'name code')
        .populate({
          path: 'submissions.student',
          select: 'firstName lastName rollNumber'
        });

      res.status(200).json({
        success: true,
        message: 'Assignment submitted successfully',
        data: updatedAssignment
      });

    } catch (error) {
      console.error('Submit assignment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit assignment',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   POST /api/assignments/:id/grade
// @desc    Grade assignment submissions
// @access  Private (Admin, Teacher)
router.post('/:id/grade',
  authenticate,
  authorize(['admin', 'teacher']),
  async (req, res) => {
    try {
      const assignmentId = req.params.id;
      const { grades } = req.body;

      if (!grades || !Array.isArray(grades)) {
        return res.status(400).json({
          success: false,
          message: 'Grades array is required'
        });
      }

      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Assignment not found'
        });
      }

      // Check teacher access
      if (req.user.role === 'teacher') {
        if (assignment.assignedBy.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }
      }

      // Update grades
      for (const grade of grades) {
        const { studentId, marksObtained, feedback } = grade;

        if (marksObtained > assignment.maxMarks) {
          return res.status(400).json({
            success: false,
            message: `Marks cannot exceed maximum marks (${assignment.maxMarks})`
          });
        }

        const submissionIndex = assignment.submissions.findIndex(s => 
          s.student.toString() === studentId
        );

        if (submissionIndex >= 0) {
          assignment.submissions[submissionIndex].marksObtained = parseInt(marksObtained);
          assignment.submissions[submissionIndex].feedback = feedback || '';
          assignment.submissions[submissionIndex].gradedBy = req.user._id;
          assignment.submissions[submissionIndex].gradedAt = new Date();
          assignment.submissions[submissionIndex].status = 'graded';
        }
      }

      await assignment.save();

      const updatedAssignment = await Assignment.findById(assignmentId)
        .populate('class', 'name level')
        .populate('subject', 'name code')
        .populate({
          path: 'submissions.student',
          select: 'firstName lastName rollNumber'
        })
        .populate({
          path: 'submissions.gradedBy',
          select: 'firstName lastName'
        });

      res.status(200).json({
        success: true,
        message: 'Assignments graded successfully',
        data: updatedAssignment
      });

    } catch (error) {
      console.error('Grade assignment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to grade assignments',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   GET /api/assignments/student/:studentId/submissions
// @desc    Get assignment submissions for a student
// @access  Private (Admin, Teacher, Student, Parent)
router.get('/student/:studentId/submissions',
  authenticate,
  async (req, res) => {
    try {
      const { studentId } = req.params;
      const { status, subjectId, startDate, endDate } = req.query;

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
        'submissions.student': studentId
      };

      if (status) filter['submissions.status'] = status;
      if (subjectId) filter.subject = subjectId;
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }

      const assignments = await Assignment.find(filter)
        .populate('class', 'name level')
        .populate('subject', 'name code')
        .populate('assignedBy', 'firstName lastName')
        .select('title dueDate maxMarks priority status submissions')
        .sort({ createdAt: -1 });

      // Extract student's submissions
      const studentSubmissions = assignments.map(assignment => {
        const studentSubmission = assignment.submissions.find(s => 
          s.student.toString() === studentId
        );

        return {
          assignment: {
            _id: assignment._id,
            title: assignment.title,
            dueDate: assignment.dueDate,
            maxMarks: assignment.maxMarks,
            priority: assignment.priority,
            status: assignment.status,
            class: assignment.class,
            subject: assignment.subject,
            assignedBy: assignment.assignedBy
          },
          submission: studentSubmission
        };
      }).filter(item => item.submission);

      res.status(200).json({
        success: true,
        data: studentSubmissions
      });

    } catch (error) {
      console.error('Get student submissions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch student submissions',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   DELETE /api/assignments/:id
// @desc    Delete assignment
// @access  Private (Admin only)
router.delete('/:id',
  authenticate,
  authorize(['admin']),
  async (req, res) => {
    try {
      const assignment = await Assignment.findById(req.params.id);
      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Assignment not found'
        });
      }

      await Assignment.findByIdAndDelete(req.params.id);

      res.status(200).json({
        success: true,
        message: 'Assignment deleted successfully'
      });

    } catch (error) {
      console.error('Delete assignment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete assignment',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

module.exports = router;