const express = require('express');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Class = require('../models/Class');
const { authenticate, authorize } = require('../middleware/auth');
const { validationSets } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/attendance
// @desc    Get attendance records with filtering
// @access  Private (Admin, Teacher)
router.get('/', 
  authenticate, 
  authorize(['admin', 'teacher']),
  async (req, res) => {
    try {
      const { date, classId, studentId, status, page = 1, limit = 50 } = req.query;
      const skip = (page - 1) * limit;

      // Build filter
      const filter = {};
      if (date) filter.date = new Date(date);
      if (classId) filter.class = classId;
      if (studentId) filter.student = studentId;
      if (status) filter.status = status;

      // If teacher, limit to their classes
      if (req.user.role === 'teacher' && req.user.teacherProfile) {
        const teacherClasses = req.user.teacherProfile.subjects.flatMap(s => 
          s.classes.map(c => c.class)
        );
        filter.class = { $in: teacherClasses };
      }

      const attendance = await Attendance.find(filter)
        .populate('student', 'firstName lastName rollNumber')
        .populate('class', 'name level')
        .populate('markedBy', 'firstName lastName')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Attendance.countDocuments(filter);

      res.status(200).json({
        success: true,
        data: {
          attendance,
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
      console.error('Get attendance error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch attendance records',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   POST /api/attendance/bulk
// @desc    Mark attendance for multiple students
// @access  Private (Admin, Teacher)
router.post('/bulk',
  authenticate,
  authorize(['admin', 'teacher']),
  async (req, res) => {
    try {
      const { classId, date, attendanceList } = req.body;

      if (!classId || !date || !attendanceList || !Array.isArray(attendanceList)) {
        return res.status(400).json({
          success: false,
          message: 'Class ID, date, and attendance list are required'
        });
      }

      // Verify class exists and teacher has access
      const classDoc = await Class.findById(classId);
      if (!classDoc) {
        return res.status(404).json({
          success: false,
          message: 'Class not found'
        });
      }

      // Check if teacher has access to this class
      if (req.user.role === 'teacher' && req.user.teacherProfile) {
        const hasAccess = req.user.teacherProfile.subjects.some(subject =>
          subject.classes.some(cls => cls.class.toString() === classId)
        );
        
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to this class'
          });
        }
      }

      const attendanceDate = new Date(date);
      const attendanceRecords = [];

      for (const record of attendanceList) {
        const { studentId, status, remarks } = record;

        // Check if attendance already exists for this student and date
        let attendance = await Attendance.findOne({
          student: studentId,
          class: classId,
          date: attendanceDate
        });

        if (attendance) {
          // Update existing record
          attendance.status = status;
          attendance.remarks = remarks || '';
          attendance.markedBy = req.user._id;
          attendance.markedAt = new Date();
          await attendance.save();
        } else {
          // Create new record
          attendance = new Attendance({
            student: studentId,
            class: classId,
            date: attendanceDate,
            status,
            remarks: remarks || '',
            markedBy: req.user._id,
            markedAt: new Date()
          });
          await attendance.save();
        }

        attendanceRecords.push(attendance);
      }

      // Populate the records before sending response
      const populatedRecords = await Attendance.find({
        _id: { $in: attendanceRecords.map(r => r._id) }
      })
      .populate('student', 'firstName lastName rollNumber')
      .populate('class', 'name level')
      .populate('markedBy', 'firstName lastName');

      res.status(200).json({
        success: true,
        message: `Attendance marked for ${attendanceRecords.length} students`,
        data: populatedRecords
      });

    } catch (error) {
      console.error('Bulk attendance error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark attendance',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   GET /api/attendance/class/:classId
// @desc    Get attendance for a specific class
// @access  Private (Admin, Teacher)
router.get('/class/:classId',
  authenticate,
  authorize(['admin', 'teacher']),
  async (req, res) => {
    try {
      const { classId } = req.params;
      const { date, month, year } = req.query;

      // Build date filter
      let dateFilter = {};
      if (date) {
        dateFilter = { date: new Date(date) };
      } else if (month && year) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        dateFilter = {
          date: {
            $gte: startDate,
            $lte: endDate
          }
        };
      }

      const attendance = await Attendance.find({
        class: classId,
        ...dateFilter
      })
      .populate('student', 'firstName lastName rollNumber')
      .populate('markedBy', 'firstName lastName')
      .sort({ date: -1 });

      // Get class details with students
      const classDoc = await Class.findById(classId)
        .populate('students', 'firstName lastName rollNumber');

      res.status(200).json({
        success: true,
        data: {
          class: classDoc,
          attendance
        }
      });

    } catch (error) {
      console.error('Get class attendance error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch class attendance',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   GET /api/attendance/student/:studentId
// @desc    Get attendance for a specific student
// @access  Private (Admin, Teacher, Student, Parent)
router.get('/student/:studentId',
  authenticate,
  authorize(['admin', 'teacher', 'student', 'parent']),
  async (req, res) => {
    try {
      const { studentId } = req.params;
      const { startDate, endDate, limit = 50 } = req.query;

      // Authorization check
      if (req.user.role === 'student') {
        if (req.user.studentProfile && req.user.studentProfile._id.toString() !== studentId) {
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

      // Build date filter
      let dateFilter = {};
      if (startDate || endDate) {
        dateFilter.date = {};
        if (startDate) dateFilter.date.$gte = new Date(startDate);
        if (endDate) dateFilter.date.$lte = new Date(endDate);
      }

      const attendance = await Attendance.find({
        student: studentId,
        ...dateFilter
      })
      .populate('class', 'name level')
      .populate('markedBy', 'firstName lastName')
      .sort({ date: -1 })
      .limit(parseInt(limit));

      // Calculate attendance statistics
      const stats = await Attendance.aggregate([
        {
          $match: {
            student: require('mongoose').Types.ObjectId(studentId),
            ...dateFilter
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const attendanceStats = {
        present: 0,
        absent: 0,
        late: 0,
        total: 0
      };

      stats.forEach(stat => {
        attendanceStats[stat._id] = stat.count;
        attendanceStats.total += stat.count;
      });

      if (attendanceStats.total > 0) {
        attendanceStats.percentage = (attendanceStats.present / attendanceStats.total * 100).toFixed(2);
      }

      res.status(200).json({
        success: true,
        data: {
          attendance,
          statistics: attendanceStats
        }
      });

    } catch (error) {
      console.error('Get student attendance error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch student attendance',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @route   GET /api/attendance/reports/summary
// @desc    Get attendance summary reports
// @access  Private (Admin, Teacher)
router.get('/reports/summary',
  authenticate,
  authorize(['admin', 'teacher']),
  async (req, res) => {
    try {
      const { classId, startDate, endDate } = req.query;

      let matchFilter = {};
      if (classId) matchFilter.class = require('mongoose').Types.ObjectId(classId);
      if (startDate || endDate) {
        matchFilter.date = {};
        if (startDate) matchFilter.date.$gte = new Date(startDate);
        if (endDate) matchFilter.date.$lte = new Date(endDate);
      }

      const summary = await Attendance.aggregate([
        { $match: matchFilter },
        {
          $lookup: {
            from: 'students',
            localField: 'student',
            foreignField: '_id',
            as: 'studentInfo'
          }
        },
        { $unwind: '$studentInfo' },
        {
          $lookup: {
            from: 'classes',
            localField: 'class',
            foreignField: '_id',
            as: 'classInfo'
          }
        },
        { $unwind: '$classInfo' },
        {
          $group: {
            _id: {
              student: '$student',
              studentName: { $concat: ['$studentInfo.firstName', ' ', '$studentInfo.lastName'] },
              rollNumber: '$studentInfo.rollNumber',
              className: '$classInfo.name'
            },
            totalDays: { $sum: 1 },
            presentDays: {
              $sum: {
                $cond: [{ $eq: ['$status', 'present'] }, 1, 0]
              }
            },
            absentDays: {
              $sum: {
                $cond: [{ $eq: ['$status', 'absent'] }, 1, 0]
              }
            },
            lateDays: {
              $sum: {
                $cond: [{ $eq: ['$status', 'late'] }, 1, 0]
              }
            }
          }
        },
        {
          $addFields: {
            attendancePercentage: {
              $round: [
                { $multiply: [{ $divide: ['$presentDays', '$totalDays'] }, 100] },
                2
              ]
            }
          }
        },
        { $sort: { '_id.className': 1, '_id.rollNumber': 1 } }
      ]);

      res.status(200).json({
        success: true,
        data: summary
      });

    } catch (error) {
      console.error('Get attendance summary error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch attendance summary',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

module.exports = router;