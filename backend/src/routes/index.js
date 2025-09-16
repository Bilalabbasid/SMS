const express = require('express');
const { authenticate } = require('../middleware/auth');

// Import route modules
const authRoutes = require('./auth');
const userRoutes = require('./users');
const studentRoutes = require('./students');
const teacherRoutes = require('./teachers');
const classRoutes = require('./classes');
const subjectRoutes = require('./subjects');
const uploadRoutes = require('./uploads');
const reportRoutes = require('./reports');
// Import other routes
const attendanceRoutes = require('./attendance');
const examRoutes = require('./exams');
const assignmentRoutes = require('./assignments');
const feeRoutes = require('./fees');
const messageRoutes = require('./messages');
const gradeRoutes = require('./grades');
// const libraryRoutes = require('./library');
// const diaryRoutes = require('./diary');
// const transportRoutes = require('./transport');
// const notificationRoutes = require('./notifications');

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SMS API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API information endpoint
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'School Management System API',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      students: '/api/students',
      teachers: '/api/teachers',
      classes: '/api/classes',
      subjects: '/api/subjects',
      reports: '/api/reports',
      attendance: '/api/attendance',
      exams: '/api/exams',
      assignments: '/api/assignments',
      fees: '/api/fees',
      grades: '/api/grades',
      timeslots: '/api/timeslots',
      library: '/api/library',
      transport: '/api/transport',
      notifications: '/api/notifications'
    }
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/students', studentRoutes);
router.use('/teachers', teacherRoutes);
router.use('/classes', classRoutes);
router.use('/subjects', subjectRoutes);
router.use('/uploads', uploadRoutes);
router.use('/reports', reportRoutes);

// Mount other routes
router.use('/attendance', attendanceRoutes);
router.use('/exams', examRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/fees', feeRoutes);
router.use('/messages', messageRoutes);
router.use('/grades', gradeRoutes);
// router.use('/library', libraryRoutes);
// router.use('/diary', diaryRoutes);
// router.use('/transport', transportRoutes);
// router.use('/notifications', notificationRoutes);

// @route   GET /api/timeslots
// @desc    Get all time slots (for schedule management)
// @access  Private (Teacher, Admin)
router.get('/timeslots',
  authenticate,
  async (req, res) => {
    try {
      // Mock time slots data - in a real system this would come from database
      const timeSlots = [
        { _id: '1', startTime: '08:00', endTime: '08:45', period: 1, name: 'Period 1' },
        { _id: '2', startTime: '08:45', endTime: '09:30', period: 2, name: 'Period 2' },
        { _id: '3', startTime: '09:45', endTime: '10:30', period: 3, name: 'Period 3' },
        { _id: '4', startTime: '10:30', endTime: '11:15', period: 4, name: 'Period 4' },
        { _id: '5', startTime: '11:30', endTime: '12:15', period: 5, name: 'Period 5' },
        { _id: '6', startTime: '12:15', endTime: '13:00', period: 6, name: 'Period 6' },
        { _id: '7', startTime: '14:00', endTime: '14:45', period: 7, name: 'Period 7' },
        { _id: '8', startTime: '14:45', endTime: '15:30', period: 8, name: 'Period 8' }
      ];

      res.status(200).json({
        success: true,
        data: timeSlots
      });
    } catch (error) {
      console.error('Get time slots error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch time slots',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// 404 handler for API routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} not found`,
    availableEndpoints: {
      auth: '/api/auth',
      users: '/api/users',
      students: '/api/students',
      teachers: '/api/teachers',
      classes: '/api/classes',
      reports: '/api/reports',
      attendance: '/api/attendance',
      exams: '/api/exams',
      assignments: '/api/assignments',
      fees: '/api/fees',
      library: '/api/library'
      // Add other endpoints as they are implemented
    }
  });
});

module.exports = router;