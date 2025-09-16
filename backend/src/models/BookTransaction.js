const mongoose = require('mongoose');

const bookTransactionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student is required']
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: [true, 'Book is required']
  },
  type: {
    type: String,
    required: [true, 'Transaction type is required'],
    enum: ['issue', 'return', 'renew', 'reserve']
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'overdue', 'cancelled'],
    default: 'active'
  },
  issueDate: {
    type: Date,
    required: function() { 
      return this.type === 'issue' || this.type === 'renew'; 
    }
  },
  dueDate: {
    type: Date,
    required: function() { 
      return this.type === 'issue' || this.type === 'renew'; 
    }
  },
  returnDate: {
    type: Date,
    required: function() { 
      return this.type === 'return'; 
    }
  },
  returnCondition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor', 'damaged'],
    default: 'good'
  },
  lateFee: {
    type: Number,
    default: 0,
    min: 0
  },
  remarks: {
    type: String,
    default: ''
  },
  returnRemarks: {
    type: String,
    default: ''
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  returnedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
bookTransactionSchema.index({ student: 1, book: 1 });
bookTransactionSchema.index({ type: 1, status: 1 });
bookTransactionSchema.index({ dueDate: 1 });
bookTransactionSchema.index({ issueDate: 1 });

// Virtual for days overdue
bookTransactionSchema.virtual('daysOverdue').get(function() {
  if (this.type !== 'issue' || this.status !== 'active') return 0;
  if (!this.dueDate) return 0;
  
  const now = new Date();
  if (now <= this.dueDate) return 0;
  
  return Math.floor((now - this.dueDate) / (1000 * 60 * 60 * 24));
});

// Virtual to check if transaction is overdue
bookTransactionSchema.virtual('isOverdue').get(function() {
  return this.daysOverdue > 0;
});

// Pre-save middleware to update status if overdue
bookTransactionSchema.pre('save', function(next) {
  if (this.type === 'issue' && this.status === 'active' && this.isOverdue) {
    this.status = 'overdue';
  }
  next();
});

module.exports = mongoose.models.BookTransaction || mongoose.model('BookTransaction', bookTransactionSchema);