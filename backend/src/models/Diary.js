const mongoose = require('mongoose');

const diarySchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Diary title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  
  // Classification
  type: {
    type: String,
    required: [true, 'Diary type is required'],
    enum: ['homework', 'assignment', 'project', 'study-material', 'announcement', 'note']
  },
  priority: {
    type: String,
    required: [true, 'Priority is required'],
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
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
    ref: 'Subject',
    required: [true, 'Subject is required']
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: [true, 'Teacher is required']
  },
  
  // Content and Instructions
  content: {
    instructions: {
      type: String,
      required: [true, 'Instructions are required'],
      maxlength: [3000, 'Instructions cannot exceed 3000 characters']
    },
    topics: [String], // List of topics covered
    chapters: [String], // List of chapters
    pages: String, // Page numbers like "45-50, 67"
    questions: [{
      questionNumber: Number,
      question: String,
      hint: String,
      difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
      }
    }],
    additionalNotes: String
  },
  
  // Attachments and Resources
  attachments: [{
    fileName: {
      type: String,
      required: [true, 'File name is required']
    },
    originalName: {
      type: String,
      required: [true, 'Original file name is required']
    },
    filePath: {
      type: String,
      required: [true, 'File path is required']
    },
    fileType: {
      type: String,
      required: [true, 'File type is required']
    },
    fileSize: {
      type: Number,
      required: [true, 'File size is required']
    },
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  
  links: [{
    title: String,
    url: {
      type: String,
      match: [/^https?:\/\/.+/, 'Please provide a valid URL']
    },
    description: String
  }],
  
  // Timeline
  assignedDate: {
    type: Date,
    required: [true, 'Assigned date is required'],
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  completionTime: {
    estimated: {
      type: Number, // in minutes
      min: 5,
      max: 480, // 8 hours
      default: 60
    },
    actual: Number // Filled by students
  },
  
  // Submission Configuration
  submissionConfig: {
    allowSubmission: {
      type: Boolean,
      default: true
    },
    submissionType: {
      type: String,
      enum: ['file-upload', 'text-answer', 'both', 'none'],
      default: 'both'
    },
    allowedFileTypes: [{
      type: String,
      enum: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'txt', 'zip']
    }],
    maxFileSize: {
      type: Number, // in MB
      default: 10,
      min: 1,
      max: 50
    },
    maxFiles: {
      type: Number,
      default: 5,
      min: 1,
      max: 20
    },
    allowLateSubmission: {
      type: Boolean,
      default: true
    },
    latePenalty: {
      type: Number, // percentage deduction per day
      default: 5,
      min: 0,
      max: 50
    }
  },
  
  // Submissions
  submissions: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student is required']
    },
    submissionDate: {
      type: Date,
      required: [true, 'Submission date is required'],
      default: Date.now
    },
    isLate: {
      type: Boolean,
      default: false
    },
    daysLate: {
      type: Number,
      default: 0,
      min: 0
    },
    
    // Submission Content
    textAnswer: String,
    files: [{
      fileName: String,
      originalName: String,
      filePath: String,
      fileType: String,
      fileSize: Number,
      uploadDate: {
        type: Date,
        default: Date.now
      }
    }],
    
    // Assessment
    status: {
      type: String,
      enum: ['submitted', 'reviewed', 'graded', 'returned'],
      default: 'submitted'
    },
    marks: {
      obtained: {
        type: Number,
        min: 0
      },
      total: {
        type: Number,
        min: 0
      },
      percentage: {
        type: Number,
        min: 0,
        max: 100
      }
    },
    feedback: {
      teacherComments: String,
      strengths: [String],
      improvements: [String],
      grade: {
        type: String,
        enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F']
      }
    },
    
    // Timestamps
    reviewedDate: Date,
    gradedDate: Date,
    returnedDate: Date
  }],
  
  // Statistics
  statistics: {
    totalStudents: {
      type: Number,
      default: 0
    },
    submissionsReceived: {
      type: Number,
      default: 0
    },
    onTimeSubmissions: {
      type: Number,
      default: 0
    },
    lateSubmissions: {
      type: Number,
      default: 0
    },
    pendingSubmissions: {
      type: Number,
      default: 0
    },
    averageMarks: {
      type: Number,
      default: 0
    },
    submissionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  
  // Status and Configuration
  status: {
    type: String,
    enum: ['draft', 'published', 'closed', 'archived'],
    default: 'draft'
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  
  // Reminders
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'sms', 'in-app'],
      required: [true, 'Reminder type is required']
    },
    scheduledDate: {
      type: Date,
      required: [true, 'Scheduled date is required']
    },
    message: String,
    sent: {
      type: Boolean,
      default: false
    },
    sentDate: Date,
    recipients: [{
      type: String,
      enum: ['students', 'parents', 'both'],
      default: 'both'
    }]
  }],
  
  // Parent Visibility
  parentVisibility: {
    showToParents: {
      type: Boolean,
      default: true
    },
    showSubmissionStatus: {
      type: Boolean,
      default: true
    },
    showMarks: {
      type: Boolean,
      default: true
    }
  },
  
  // Academic Standards (for alignment)
  standards: [{
    code: String,
    description: String,
    level: {
      type: String,
      enum: ['basic', 'intermediate', 'advanced']
    }
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
diarySchema.index({ class: 1, section: 1, subject: 1 });
diarySchema.index({ teacher: 1 });
diarySchema.index({ assignedDate: 1 });
diarySchema.index({ dueDate: 1 });
diarySchema.index({ status: 1 });
diarySchema.index({ type: 1 });
diarySchema.index({ priority: 1 });
diarySchema.index({ 'submissions.student': 1 });

// Virtual for overdue status
diarySchema.virtual('isOverdue').get(function() {
  return new Date() > this.dueDate && this.status !== 'closed';
});

// Virtual for days remaining
diarySchema.virtual('daysRemaining').get(function() {
  const today = new Date();
  const due = new Date(this.dueDate);
  const diffTime = due - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for submission percentage
diarySchema.virtual('submissionPercentage').get(function() {
  if (this.statistics.totalStudents === 0) return 0;
  return Math.round((this.statistics.submissionsReceived / this.statistics.totalStudents) * 100);
});

// Method to check if student has submitted
diarySchema.methods.hasStudentSubmitted = function(studentId) {
  return this.submissions.some(sub => sub.student.toString() === studentId.toString());
};

// Method to get student submission
diarySchema.methods.getStudentSubmission = function(studentId) {
  return this.submissions.find(sub => sub.student.toString() === studentId.toString());
};

// Method to calculate submission statistics
diarySchema.methods.calculateStatistics = function() {
  const totalSubs = this.submissions.length;
  const onTime = this.submissions.filter(sub => !sub.isLate).length;
  const late = this.submissions.filter(sub => sub.isLate).length;
  
  this.statistics.submissionsReceived = totalSubs;
  this.statistics.onTimeSubmissions = onTime;
  this.statistics.lateSubmissions = late;
  this.statistics.pendingSubmissions = this.statistics.totalStudents - totalSubs;
  this.statistics.submissionRate = this.statistics.totalStudents > 0 
    ? Math.round((totalSubs / this.statistics.totalStudents) * 100) 
    : 0;
  
  // Calculate average marks
  const gradedSubmissions = this.submissions.filter(sub => 
    sub.marks && sub.marks.obtained !== undefined
  );
  
  if (gradedSubmissions.length > 0) {
    const totalMarks = gradedSubmissions.reduce((sum, sub) => sum + sub.marks.obtained, 0);
    this.statistics.averageMarks = Math.round(totalMarks / gradedSubmissions.length);
  }
  
  return this.statistics;
};

// Method to add submission
diarySchema.methods.addSubmission = function(submissionData) {
  // Check if student already submitted
  const existingSubmission = this.getStudentSubmission(submissionData.student);
  if (existingSubmission) {
    throw new Error('Student has already submitted');
  }
  
  // Check if submission is late
  const now = new Date();
  const isLate = now > this.dueDate;
  const daysLate = isLate ? Math.ceil((now - this.dueDate) / (1000 * 60 * 60 * 24)) : 0;
  
  const submission = {
    ...submissionData,
    isLate,
    daysLate,
    submissionDate: now
  };
  
  this.submissions.push(submission);
  this.calculateStatistics();
  
  return submission;
};

// Method to grade submission
diarySchema.methods.gradeSubmission = function(studentId, gradeData) {
  const submission = this.getStudentSubmission(studentId);
  if (!submission) {
    throw new Error('Submission not found');
  }
  
  submission.marks = gradeData.marks;
  submission.feedback = gradeData.feedback;
  submission.status = 'graded';
  submission.gradedDate = new Date();
  
  this.calculateStatistics();
  return submission;
};

// Pre-save middleware to calculate late submission penalty
diarySchema.pre('save', function(next) {
  this.submissions.forEach(submission => {
    if (submission.isLate && submission.marks && submission.marks.obtained) {
      const penalty = Math.min(
        submission.daysLate * (this.submissionConfig.latePenalty || 5),
        submission.marks.obtained
      );
      submission.marks.obtained = Math.max(0, submission.marks.obtained - penalty);
      submission.marks.percentage = submission.marks.total > 0 
        ? Math.round((submission.marks.obtained / submission.marks.total) * 100)
        : 0;
    }
  });
  
  next();
});

module.exports = mongoose.model('Diary', diarySchema);