const express = require('express');

// Import route modules
const authRoutes = require('./auth');
const userRoutes = require('./users');
const studentRoutes = require('./students');
const teacherRoutes = require('./teachers');
const classRoutes = require('./classes');
const subjectRoutes = require('./subjects');
const uploadRoutes = require('./uploads');
const reportRoutes = require('./reports');
// Import other routes as they are created
// const diaryRoutes = require('./diary');
// const attendanceRoutes = require('./attendance');
// const examRoutes = require('./exams');
// const feeRoutes = require('./fees');
// const libraryRoutes = require('./library');
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
      diary: '/api/diary',
      attendance: '/api/attendance',
      exams: '/api/exams',
      fees: '/api/fees',
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

// Mount other routes as they are created
// router.use('/diary', diaryRoutes);
// router.use('/attendance', attendanceRoutes);
// router.use('/exams', examRoutes);
// router.use('/fees', feeRoutes);
// router.use('/library', libraryRoutes);
// router.use('/transport', transportRoutes);
// router.use('/notifications', notificationRoutes);

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
      reports: '/api/reports'
      // Add other endpoints as they are implemented
    }
  });
});

module.exports = router;