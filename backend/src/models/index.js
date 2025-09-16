// Models index file - exports all models for easy importing

// Core Models
const User = require('./User');
const Student = require('./Student');
const Teacher = require('./Teacher');
const Class = require('./Class');
const Subject = require('./Subject');

// Academic Models
const Assignment = require('./Assignment');
const Diary = require('./Diary');
const { Attendance, StudentAttendanceSummary } = require('./Attendance');
const Exam = require('./Exam');

// Financial Models
const Fee = require('./Fee');

// Library Models
const Book = require('./Book');
const BookTransaction = require('./BookTransaction');
// const { LibraryTransaction, LibraryMember } = require('./Library');

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
  Assignment,
  Diary,
  Attendance,
  StudentAttendanceSummary,
  Exam,
  
  // Financial Models
  Fee,
  
  // Library Models
  Book,
  BookTransaction,
  // LibraryTransaction,
  // LibraryMember,
  
  // Transport Models
  TransportRoute,
  Vehicle,
  StudentTransport,
  
  // Communication Models
  Notification,
  NotificationTemplate
};