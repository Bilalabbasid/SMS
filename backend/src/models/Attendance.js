const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  // Basic Information
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  
  // Academic Information
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: [true, 'Class is required']
  },
  section: {
    type: String,
    required: [true, 'Section is required'],
    trim: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  },
  period: {
    type: Number,
    min: 1,
    max: 10
  },
  
  // Attendance Records
  studentAttendance: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student is required']
    },
    status: {
      type: String,
      required: [true, 'Attendance status is required'],
      enum: ['present', 'absent', 'late', 'half-day', 'excused']
    },
    arrivalTime: String, // Format: "HH:MM"
    departureTime: String, // Format: "HH:MM"
    reason: String, // Reason for absence or lateness
    isExcused: {
      type: Boolean,
      default: false
    },
    excusedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String
  }],
  
  // Staff/Teacher who marked attendance
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: [true, 'Marked by teacher is required']
  },
  markedAt: {
    type: Date,
    default: Date.now
  },
  
  // Attendance Type
  type: {
    type: String,
    required: [true, 'Attendance type is required'],
    enum: ['daily', 'period-wise', 'activity', 'exam']
  },
  
  // Statistics
  statistics: {
    totalStudents: {
      type: Number,
      default: 0
    },
    present: {
      type: Number,
      default: 0
    },
    absent: {
      type: Number,
      default: 0
    },
    late: {
      type: Number,
      default: 0
    },
    halfDay: {
      type: Number,
      default: 0
    },
    excused: {
      type: Number,
      default: 0
    },
    attendancePercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  
  // Status
  isLocked: {
    type: Boolean,
    default: false
  },
  lockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lockedAt: Date,
  
  // Academic Year and Month
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    match: [/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY']
  },
  month: {
    type: Number,
    required: [true, 'Month is required'],
    min: 1,
    max: 12
  },
  
  // Weather and Special Conditions
  weatherCondition: {
    type: String,
    enum: ['clear', 'rainy', 'stormy', 'foggy', 'extreme-cold', 'extreme-hot']
  },
  specialConditions: [String], // e.g., 'holiday', 'strike', 'festival'
  
  // Created and Updated by
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
attendanceSchema.index({ date: 1, class: 1, section: 1 }, { unique: true });
attendanceSchema.index({ 'studentAttendance.student': 1 });
attendanceSchema.index({ markedBy: 1 });
attendanceSchema.index({ academicYear: 1, month: 1 });
attendanceSchema.index({ type: 1 });

// Method to calculate attendance statistics
attendanceSchema.methods.calculateStatistics = function() {
  const total = this.studentAttendance.length;
  const present = this.studentAttendance.filter(sa => sa.status === 'present').length;
  const absent = this.studentAttendance.filter(sa => sa.status === 'absent').length;
  const late = this.studentAttendance.filter(sa => sa.status === 'late').length;
  const halfDay = this.studentAttendance.filter(sa => sa.status === 'half-day').length;
  const excused = this.studentAttendance.filter(sa => sa.status === 'excused').length;
  
  this.statistics = {
    totalStudents: total,
    present,
    absent,
    late,
    halfDay,
    excused,
    attendancePercentage: total > 0 ? Math.round(((present + halfDay * 0.5) / total) * 100) : 0
  };
  
  return this.statistics;
};

// Method to mark student attendance
attendanceSchema.methods.markStudentAttendance = function(studentId, status, additionalData = {}) {
  const studentRecord = this.studentAttendance.find(sa => 
    sa.student.toString() === studentId.toString()
  );
  
  if (studentRecord) {
    studentRecord.status = status;
    Object.assign(studentRecord, additionalData);
  } else {
    this.studentAttendance.push({
      student: studentId,
      status,
      ...additionalData
    });
  }
  
  this.calculateStatistics();
  return studentRecord || this.studentAttendance[this.studentAttendance.length - 1];
};

// Method to get student attendance
attendanceSchema.methods.getStudentAttendance = function(studentId) {
  return this.studentAttendance.find(sa => 
    sa.student.toString() === studentId.toString()
  );
};

// Pre-save middleware to calculate statistics
attendanceSchema.pre('save', function(next) {
  this.calculateStatistics();
  next();
});

// Student Attendance Summary Schema
const studentAttendanceSummarySchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student is required']
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: [true, 'Class is required']
  },
  section: {
    type: String,
    required: [true, 'Section is required']
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    match: [/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY']
  },
  month: {
    type: Number,
    required: [true, 'Month is required'],
    min: 1,
    max: 12
  },
  
  // Summary Statistics
  totalDays: {
    type: Number,
    default: 0
  },
  presentDays: {
    type: Number,
    default: 0
  },
  absentDays: {
    type: Number,
    default: 0
  },
  lateDays: {
    type: Number,
    default: 0
  },
  halfDays: {
    type: Number,
    default: 0
  },
  excusedDays: {
    type: Number,
    default: 0
  },
  
  // Calculated Fields
  attendancePercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  workingDays: {
    type: Number,
    default: 0
  },
  
  // Streaks
  currentPresentStreak: {
    type: Number,
    default: 0
  },
  longestPresentStreak: {
    type: Number,
    default: 0
  },
  currentAbsentStreak: {
    type: Number,
    default: 0
  },
  
  // Subject-wise attendance (for period-wise tracking)
  subjectAttendance: [{
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject'
    },
    totalPeriods: {
      type: Number,
      default: 0
    },
    attendedPeriods: {
      type: Number,
      default: 0
    },
    attendancePercentage: {
      type: Number,
      default: 0
    }
  }],
  
  // Last Updated
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for Student Attendance Summary
studentAttendanceSummarySchema.index({ 
  student: 1, 
  academicYear: 1, 
  month: 1 
}, { unique: true });

studentAttendanceSummarySchema.index({ class: 1, section: 1 });

// Method to update attendance summary
studentAttendanceSummarySchema.methods.updateSummary = function(attendanceRecords) {
  // Reset counters
  this.totalDays = 0;
  this.presentDays = 0;
  this.absentDays = 0;
  this.lateDays = 0;
  this.halfDays = 0;
  this.excusedDays = 0;
  
  // Process attendance records
  attendanceRecords.forEach(record => {
    const studentAttendance = record.studentAttendance.find(sa => 
      sa.student.toString() === this.student.toString()
    );
    
    if (studentAttendance) {
      this.totalDays++;
      
      switch (studentAttendance.status) {
        case 'present':
          this.presentDays++;
          break;
        case 'absent':
          this.absentDays++;
          break;
        case 'late':
          this.lateDays++;
          break;
        case 'half-day':
          this.halfDays++;
          break;
        case 'excused':
          this.excusedDays++;
          break;
      }
    }
  });
  
  // Calculate percentage
  if (this.totalDays > 0) {
    this.attendancePercentage = Math.round(
      ((this.presentDays + this.halfDays * 0.5) / this.totalDays) * 100
    );
  }
  
  this.lastUpdated = new Date();
  return this;
};

// Models
const Attendance = mongoose.model('Attendance', attendanceSchema);
const StudentAttendanceSummary = mongoose.model('StudentAttendanceSummary', studentAttendanceSummarySchema);

module.exports = {
  Attendance,
  StudentAttendanceSummary
};