const mongoose = require('mongoose');

const gradeComponentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Component name is required'],
    trim: true,
    maxlength: [100, 'Component name cannot exceed 100 characters']
  },
  type: {
    type: String,
    required: [true, 'Component type is required'],
    enum: ['assignment', 'exam', 'quiz', 'project', 'participation', 'homework', 'test']
  },
  maxMarks: {
    type: Number,
    required: [true, 'Maximum marks is required'],
    min: [1, 'Maximum marks must be at least 1']
  },
  weightage: {
    type: Number,
    required: [true, 'Weightage is required'],
    min: [0, 'Weightage must be at least 0'],
    max: [100, 'Weightage cannot exceed 100']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: [true, 'Class is required']
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject is required']
  },
  dueDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
gradeComponentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
gradeComponentSchema.index({ class: 1, subject: 1 });
gradeComponentSchema.index({ createdBy: 1 });
gradeComponentSchema.index({ type: 1 });

const GradeComponent = mongoose.model('GradeComponent', gradeComponentSchema);

module.exports = GradeComponent;