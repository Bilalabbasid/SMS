const mongoose = require('mongoose');

// Exam Schema
const examSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Exam name is required'],
    trim: true,
    maxlength: [100, 'Exam name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  // Exam Classification
  type: {
    type: String,
    required: [true, 'Exam type is required'],
    enum: [
      'unit-test', 'mid-term', 'final-term', 'quarterly', 'half-yearly', 
      'annual', 'practical', 'oral', 'assignment', 'project', 'internal', 
      'board-exam', 'entrance-exam'
    ]
  },
  category: {
    type: String,
    required: [true, 'Exam category is required'],
    enum: ['formative', 'summative', 'diagnostic', 'benchmark']
  },
  
  // Academic Information
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    match: [/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY']
  },
  term: {
    type: String,
    required: [true, 'Term is required'],
    enum: ['1st-term', '2nd-term', '3rd-term', 'annual']
  },
  
  // Classes and Subjects
  applicableClasses: [{
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class is required']
    },
    sections: [String], // Array of section names
    subjects: [{
      subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: [true, 'Subject is required']
      },
      examDate: {
        type: Date,
        required: [true, 'Exam date is required']
      },
      startTime: {
        type: String,
        required: [true, 'Start time is required'],
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format']
      },
      endTime: {
        type: String,
        required: [true, 'End time is required'],
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format']
      },
      duration: {
        type: Number, // in minutes
        required: [true, 'Duration is required'],
        min: 30,
        max: 300
      },
      maxMarks: {
        type: Number,
        required: [true, 'Maximum marks is required'],
        min: 10,
        max: 200,
        default: 100
      },
      passingMarks: {
        type: Number,
        required: [true, 'Passing marks is required'],
        min: 20,
        max: 100,
        default: 40
      },
      examiner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher'
      },
      invigilator: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher'
      }],
      room: String,
      instructions: String
    }]
  }],
  
  // Exam Configuration
  configuration: {
    gradingSystem: {
      type: String,
      enum: ['percentage', 'grade', 'gpa', 'marks'],
      default: 'percentage'
    },
    gradeScale: [{
      grade: {
        type: String,
        required: [true, 'Grade is required']
      },
      minPercentage: {
        type: Number,
        required: [true, 'Minimum percentage is required'],
        min: 0,
        max: 100
      },
      maxPercentage: {
        type: Number,
        required: [true, 'Maximum percentage is required'],
        min: 0,
        max: 100
      },
      gpa: Number,
      description: String
    }],
    allowReexam: {
      type: Boolean,
      default: false
    },
    reexamEligibility: {
      maxAttempts: {
        type: Number,
        default: 1,
        min: 1,
        max: 3
      },
      minimumGap: {
        type: Number, // days
        default: 7
      }
    }
  },
  
  // Exam Results and Marks
  results: [{
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
    
    // Subject-wise marks
    subjectMarks: [{
      subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: [true, 'Subject is required']
      },
      marksObtained: {
        type: Number,
        min: 0,
        default: 0
      },
      maxMarks: {
        type: Number,
        required: [true, 'Maximum marks is required']
      },
      percentage: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      grade: String,
      gpa: Number,
      isPassed: {
        type: Boolean,
        default: false
      },
      
      // Component-wise marks (theory, practical, internal)
      components: [{
        type: {
          type: String,
          enum: ['theory', 'practical', 'internal', 'oral', 'assignment'],
          required: [true, 'Component type is required']
        },
        marksObtained: {
          type: Number,
          min: 0,
          default: 0
        },
        maxMarks: {
          type: Number,
          required: [true, 'Maximum marks is required']
        },
        percentage: {
          type: Number,
          min: 0,
          max: 100,
          default: 0
        }
      }],
      
      // Examiner details
      markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher'
      },
      markedDate: Date,
      remarks: String
    }],
    
    // Overall performance
    totalMarks: {
      obtained: {
        type: Number,
        default: 0
      },
      maximum: {
        type: Number,
        default: 0
      }
    },
    overallPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    overallGrade: String,
    overallGPA: Number,
    
    // Result status
    result: {
      type: String,
      enum: ['pass', 'fail', 'absent', 'pending'],
      default: 'pending'
    },
    
    // Ranking
    classRank: Number,
    sectionRank: Number,
    
    // Attendance during exam
    attendanceStatus: {
      type: String,
      enum: ['present', 'absent', 'partial'],
      default: 'present'
    },
    
    // Publication status
    isPublished: {
      type: Boolean,
      default: false
    },
    publishedDate: Date
  }],
  
  // Exam Statistics
  statistics: {
    totalStudents: {
      type: Number,
      default: 0
    },
    studentsAppeared: {
      type: Number,
      default: 0
    },
    studentsAbsent: {
      type: Number,
      default: 0
    },
    studentsPass: {
      type: Number,
      default: 0
    },
    studentsFail: {
      type: Number,
      default: 0
    },
    passPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    averageMarks: {
      type: Number,
      default: 0
    },
    highestMarks: {
      type: Number,
      default: 0
    },
    lowestMarks: {
      type: Number,
      default: 0
    },
    
    // Subject-wise statistics
    subjectStatistics: [{
      subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
      },
      averageMarks: Number,
      passPercentage: Number,
      highestMarks: Number,
      lowestMarks: Number
    }]
  },
  
  // Exam Status
  status: {
    type: String,
    enum: ['scheduled', 'ongoing', 'completed', 'cancelled', 'postponed'],
    default: 'scheduled'
  },
  
  // Date Management
  registrationStart: {
    type: Date,
    required: [true, 'Registration start date is required']
  },
  registrationEnd: {
    type: Date,
    required: [true, 'Registration end date is required']
  },
  examStartDate: {
    type: Date,
    required: [true, 'Exam start date is required']
  },
  examEndDate: {
    type: Date,
    required: [true, 'Exam end date is required']
  },
  resultDate: Date,
  
  // Notifications
  notifications: [{
    type: {
      type: String,
      enum: ['exam-schedule', 'result-published', 'reexam-notice'],
      required: [true, 'Notification type is required']
    },
    message: {
      type: String,
      required: [true, 'Message is required']
    },
    recipients: [{
      type: String,
      enum: ['students', 'parents', 'teachers', 'all'],
      required: [true, 'Recipients are required']
    }],
    sentDate: Date,
    isRead: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      readAt: Date
    }]
  }],
  
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
examSchema.index({ academicYear: 1, term: 1 });
examSchema.index({ type: 1 });
examSchema.index({ status: 1 });
examSchema.index({ examStartDate: 1 });
examSchema.index({ 'results.student': 1 });
examSchema.index({ 'applicableClasses.class': 1 });

// Method to calculate result statistics
examSchema.methods.calculateStatistics = function() {
  const totalStudents = this.results.length;
  const studentsAppeared = this.results.filter(r => r.attendanceStatus !== 'absent').length;
  const studentsAbsent = this.results.filter(r => r.attendanceStatus === 'absent').length;
  const studentsPass = this.results.filter(r => r.result === 'pass').length;
  const studentsFail = this.results.filter(r => r.result === 'fail').length;
  
  this.statistics.totalStudents = totalStudents;
  this.statistics.studentsAppeared = studentsAppeared;
  this.statistics.studentsAbsent = studentsAbsent;
  this.statistics.studentsPass = studentsPass;
  this.statistics.studentsFail = studentsFail;
  this.statistics.passPercentage = studentsAppeared > 0 ? 
    Math.round((studentsPass / studentsAppeared) * 100) : 0;
  
  // Calculate average, highest, and lowest marks
  const appearedResults = this.results.filter(r => r.attendanceStatus !== 'absent');
  if (appearedResults.length > 0) {
    const totalMarks = appearedResults.reduce((sum, r) => sum + r.overallPercentage, 0);
    this.statistics.averageMarks = Math.round(totalMarks / appearedResults.length);
    this.statistics.highestMarks = Math.max(...appearedResults.map(r => r.overallPercentage));
    this.statistics.lowestMarks = Math.min(...appearedResults.map(r => r.overallPercentage));
  }
  
  return this.statistics;
};

// Method to add student result
examSchema.methods.addStudentResult = function(resultData) {
  // Check if student result already exists
  const existingResultIndex = this.results.findIndex(r => 
    r.student.toString() === resultData.student.toString()
  );
  
  if (existingResultIndex !== -1) {
    // Update existing result
    this.results[existingResultIndex] = { ...this.results[existingResultIndex], ...resultData };
  } else {
    // Add new result
    this.results.push(resultData);
  }
  
  // Recalculate statistics
  this.calculateStatistics();
  
  return this.results[existingResultIndex !== -1 ? existingResultIndex : this.results.length - 1];
};

// Method to get student result
examSchema.methods.getStudentResult = function(studentId) {
  return this.results.find(r => r.student.toString() === studentId.toString());
};

// Method to calculate ranks
examSchema.methods.calculateRanks = function() {
  // Sort results by overall percentage in descending order
  const sortedResults = this.results
    .filter(r => r.attendanceStatus !== 'absent')
    .sort((a, b) => b.overallPercentage - a.overallPercentage);
  
  // Assign ranks
  sortedResults.forEach((result, index) => {
    const rank = index + 1;
    const originalResult = this.results.find(r => 
      r.student.toString() === result.student.toString()
    );
    if (originalResult) {
      originalResult.classRank = rank;
      // Section rank would need to be calculated separately for each section
    }
  });
  
  return sortedResults;
};

// Method to publish results
examSchema.methods.publishResults = function(classId, section = null) {
  let resultsToPublish;
  
  if (section) {
    resultsToPublish = this.results.filter(r => 
      r.class.toString() === classId.toString() && r.section === section
    );
  } else {
    resultsToPublish = this.results.filter(r => 
      r.class.toString() === classId.toString()
    );
  }
  
  const publishDate = new Date();
  resultsToPublish.forEach(result => {
    result.isPublished = true;
    result.publishedDate = publishDate;
  });
  
  return resultsToPublish.length;
};

// Pre-save middleware to calculate percentages and determine pass/fail
examSchema.pre('save', function(next) {
  this.results.forEach(result => {
    // Calculate subject-wise percentages and pass/fail status
    result.subjectMarks.forEach(subjectMark => {
      if (subjectMark.maxMarks > 0) {
        subjectMark.percentage = Math.round((subjectMark.marksObtained / subjectMark.maxMarks) * 100);
        
        // Determine pass/fail based on passing marks
        const passingMarks = this.applicableClasses
          .flatMap(ac => ac.subjects)
          .find(s => s.subject.toString() === subjectMark.subject.toString())?.passingMarks || 40;
        
        subjectMark.isPassed = subjectMark.marksObtained >= passingMarks;
        
        // Assign grade based on percentage
        const gradeScale = this.configuration.gradeScale;
        const grade = gradeScale.find(g => 
          subjectMark.percentage >= g.minPercentage && 
          subjectMark.percentage <= g.maxPercentage
        );
        if (grade) {
          subjectMark.grade = grade.grade;
          subjectMark.gpa = grade.gpa;
        }
      }
      
      // Calculate component percentages
      subjectMark.components.forEach(component => {
        if (component.maxMarks > 0) {
          component.percentage = Math.round((component.marksObtained / component.maxMarks) * 100);
        }
      });
    });
    
    // Calculate overall totals
    result.totalMarks.obtained = result.subjectMarks.reduce((sum, sm) => sum + sm.marksObtained, 0);
    result.totalMarks.maximum = result.subjectMarks.reduce((sum, sm) => sum + sm.maxMarks, 0);
    
    if (result.totalMarks.maximum > 0) {
      result.overallPercentage = Math.round((result.totalMarks.obtained / result.totalMarks.maximum) * 100);
    }
    
    // Determine overall pass/fail
    const allSubjectsPassed = result.subjectMarks.every(sm => sm.isPassed);
    result.result = allSubjectsPassed ? 'pass' : 'fail';
    
    // Assign overall grade
    const gradeScale = this.configuration.gradeScale;
    const overallGrade = gradeScale.find(g => 
      result.overallPercentage >= g.minPercentage && 
      result.overallPercentage <= g.maxPercentage
    );
    if (overallGrade) {
      result.overallGrade = overallGrade.grade;
      result.overallGPA = overallGrade.gpa;
    }
  });
  
  next();
});

module.exports = mongoose.model('Exam', examSchema);