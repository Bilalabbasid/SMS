const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  maxMarks: {
    type: Number,
    required: true,
    min: 1
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  instructions: [{
    type: String
  }],
  resources: [{
    title: String,
    url: String,
    type: {
      type: String,
      enum: ['link', 'file', 'video', 'document']
    }
  }],
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String
  }],
  submissions: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    content: {
      type: String,
      required: true
    },
    attachments: [{
      filename: String,
      originalName: String,
      mimetype: String,
      size: Number,
      url: String
    }],
    submittedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['submitted', 'late', 'graded'],
      default: 'submitted'
    },
    isLate: {
      type: Boolean,
      default: false
    },
    marksObtained: {
      type: Number,
      min: 0
    },
    feedback: String,
    comments: String,
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    gradedAt: Date
  }],
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
assignmentSchema.index({ class: 1, subject: 1 });
assignmentSchema.index({ dueDate: 1 });
assignmentSchema.index({ status: 1 });
assignmentSchema.index({ 'submissions.student': 1 });

// Virtual for submission count
assignmentSchema.virtual('submissionCount').get(function() {
  return this.submissions.length;
});

// Virtual for graded count
assignmentSchema.virtual('gradedCount').get(function() {
  return this.submissions.filter(s => s.status === 'graded').length;
});

// Virtual for late submission count
assignmentSchema.virtual('lateSubmissionCount').get(function() {
  return this.submissions.filter(s => s.isLate).length;
});

// Check if assignment is overdue
assignmentSchema.virtual('isOverdue').get(function() {
  return new Date() > this.dueDate && this.status === 'active';
});

// Pre-save middleware
assignmentSchema.pre('save', function(next) {
  // Validate marks obtained don't exceed max marks
  this.submissions.forEach(submission => {
    if (submission.marksObtained > this.maxMarks) {
      submission.marksObtained = this.maxMarks;
    }
  });
  next();
});

module.exports = mongoose.models.Assignment || mongoose.model('Assignment', assignmentSchema);