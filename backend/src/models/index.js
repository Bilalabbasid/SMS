// Models index file - exports all models for easy importing

// Core Models
const User = require('./User');
const Student = require('./Student');
const Teacher = require('./Teacher');
const Class = require('./Class');
const Subject = require('./Subject');

// Academic Models
const Diary = require('./Diary');
const { Attendance, StudentAttendanceSummary } = require('./Attendance');
const Exam = require('./Exam');

// Financial Models
const { FeeStructure, FeeTransaction, StudentFeeStatus } = require('./Fee');

// Library Models
const { Book, LibraryTransaction, LibraryMember } = require('./Library');

// Transport Models
const { TransportRoute, Vehicle, StudentTransport } = require('./Transport');

// Communication Models
const { Notification, NotificationTemplate } = require('./Notification');

module.exports = {
  // Core Models
  User,
  Student,
  Teacher,
  Class,
  Subject,
  
  // Academic Models
  Diary,
  Attendance,
  StudentAttendanceSummary,
  Exam,
  
  // Financial Models
  FeeStructure,
  FeeTransaction,
  StudentFeeStatus,
  
  // Library Models
  Book,
  LibraryTransaction,
  LibraryMember,
  
  // Transport Models
  TransportRoute,
  Vehicle,
  StudentTransport,
  
  // Communication Models
  Notification,
  NotificationTemplate
};