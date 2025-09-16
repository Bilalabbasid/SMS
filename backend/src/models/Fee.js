const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
  // Student Information
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

  // Fee Details
  type: {
    type: String,
    required: [true, 'Fee type is required'],
    enum: [
      'tuition', 'admission', 'examination', 'laboratory', 'library',
      'sports', 'transport', 'hostel', 'uniform', 'books',
      'activity', 'development', 'maintenance', 'security',
      'computer', 'medical', 'insurance', 'miscellaneous', 'fine'
    ]
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },

  // Academic Information
  academicYear: {
    type: Number,
    required: [true, 'Academic year is required'],
    min: 2020,
    max: 2030
  },
  month: {
    type: String,
    enum: [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ]
  },
  quarter: {
    type: String,
    enum: ['q1', 'q2', 'q3', 'q4']
  },
  semester: {
    type: String,
    enum: ['1st', '2nd']
  },

  // Fee Breakdown
  breakdown: [{
    itemName: {
      type: String,
      required: true,
      trim: true
    },
    itemAmount: {
      type: Number,
      required: true,
      min: 0
    },
    itemDescription: {
      type: String,
      trim: true
    },
    isTaxable: {
      type: Boolean,
      default: false
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    taxPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  }],

  // Payment Information
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  status: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'overdue', 'cancelled', 'refunded'],
    default: 'pending'
  },
  amountPaid: {
    type: Number,
    default: 0,
    min: 0
  },
  paidDate: {
    type: Date
  },
  remainingAmount: {
    type: Number,
    default: 0,
    min: 0
  },

  // Payment Records
  payments: [{
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    method: {
      type: String,
      required: true,
      enum: [
        'cash', 'cheque', 'card', 'bank_transfer', 'online',
        'upi', 'wallet', 'netbanking', 'demand_draft'
      ]
    },
    transactionId: {
      type: String,
      trim: true
    },
    chequeNumber: {
      type: String,
      trim: true
    },
    bankName: {
      type: String,
      trim: true
    },
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: 500
    },
    receiptNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['successful', 'failed', 'pending', 'cancelled'],
      default: 'successful'
    }
  }],

  // Discount Information
  discount: {
    type: {
      type: String,
      enum: ['percentage', 'fixed', 'scholarship', 'sibling', 'staff', 'merit', 'need_based']
    },
    amount: {
      type: Number,
      default: 0,
      min: 0
    },
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    reason: {
      type: String,
      trim: true
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvalDate: {
      type: Date
    }
  },

  // Late Fee Information
  lateFee: {
    amount: {
      type: Number,
      default: 0,
      min: 0
    },
    appliedDate: {
      type: Date
    },
    waived: {
      type: Boolean,
      default: false
    },
    waivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    waivedDate: {
      type: Date
    },
    waivedReason: {
      type: String,
      trim: true
    }
  },

  // Refund Information
  refund: {
    amount: {
      type: Number,
      default: 0,
      min: 0
    },
    reason: {
      type: String,
      trim: true
    },
    requestDate: {
      type: Date
    },
    approvedDate: {
      type: Date
    },
    processedDate: {
      type: Date
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    refundMethod: {
      type: String,
      enum: ['cash', 'cheque', 'bank_transfer', 'adjustment']
    },
    status: {
      type: String,
      enum: ['requested', 'approved', 'processed', 'rejected'],
      default: 'requested'
    }
  },

  // Installment Information
  installment: {
    isInstallment: {
      type: Boolean,
      default: false
    },
    installmentNumber: {
      type: Number,
      min: 1
    },
    totalInstallments: {
      type: Number,
      min: 1
    },
    parentFeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fee'
    }
  },

  // Receipt Information
  receiptGenerated: {
    type: Boolean,
    default: false
  },
  receiptNumber: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  receiptDate: {
    type: Date
  },

  // Notification Information
  notifications: {
    remindersSent: {
      type: Number,
      default: 0
    },
    lastReminderDate: {
      type: Date
    },
    overdueNoticeSent: {
      type: Boolean,
      default: false
    },
    overdueNoticeDate: {
      type: Date
    }
  },

  // Audit Information
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recorded by is required']
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Additional Information
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['mandatory', 'optional', 'conditional'],
    default: 'mandatory'
  },
  tags: [{
    type: String,
    trim: true
  }],
  notes: [{
    note: {
      type: String,
      required: true,
      trim: true
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    addedDate: {
      type: Date,
      default: Date.now
    },
    isPrivate: {
      type: Boolean,
      default: false
    }
  }],

  // System Fields
  isActive: {
    type: Boolean,
    default: true
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for optimal query performance
feeSchema.index({ student: 1, academicYear: 1 });
feeSchema.index({ status: 1 });
feeSchema.index({ type: 1 });
feeSchema.index({ class: 1 });
feeSchema.index({ dueDate: 1 });
feeSchema.index({ academicYear: 1, month: 1 });
feeSchema.index({ 'payments.receiptNumber': 1 });
feeSchema.index({ receiptNumber: 1 });
feeSchema.index({ createdAt: 1 });
feeSchema.index({ 'payments.date': 1 });

// Compound indexes for complex queries
feeSchema.index({ student: 1, status: 1, academicYear: 1 });
feeSchema.index({ class: 1, type: 1, status: 1 });
feeSchema.index({ dueDate: 1, status: 1 });

// Virtual properties
feeSchema.virtual('totalDiscountAmount').get(function() {
  if (!this.discount) return 0;
  
  if (this.discount.type === 'percentage') {
    return (this.amount * this.discount.percentage) / 100;
  } else if (this.discount.type === 'fixed') {
    return this.discount.amount;
  }
  return this.discount.amount || 0;
});

feeSchema.virtual('netAmount').get(function() {
  const discount = this.totalDiscountAmount;
  const lateFeeAmount = this.lateFee?.amount || 0;
  return this.amount - discount + lateFeeAmount;
});

feeSchema.virtual('balanceAmount').get(function() {
  return Math.max(0, this.netAmount - this.amountPaid);
});

feeSchema.virtual('isOverdue').get(function() {
  if (this.status === 'paid') return false;
  return new Date() > this.dueDate;
});

feeSchema.virtual('daysPastDue').get(function() {
  if (!this.isOverdue) return 0;
  return Math.floor((new Date() - this.dueDate) / (1000 * 60 * 60 * 24));
});

feeSchema.virtual('paymentPercentage').get(function() {
  if (this.netAmount === 0) return 100;
  return Math.round((this.amountPaid / this.netAmount) * 100);
});

feeSchema.virtual('totalTaxAmount').get(function() {
  return this.breakdown.reduce((total, item) => total + (item.taxAmount || 0), 0);
});

feeSchema.virtual('latestPayment').get(function() {
  if (this.payments.length === 0) return null;
  return this.payments.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
});

// Instance methods
feeSchema.methods.calculateLateFee = function(feePerDay = 5, maxLateFee = 500) {
  if (!this.isOverdue || this.status === 'paid') return 0;
  
  const daysLate = this.daysPastDue;
  const calculatedFee = Math.min(daysLate * feePerDay, maxLateFee);
  
  return calculatedFee;
};

feeSchema.methods.applyDiscount = function(discountType, value, reason, approvedBy) {
  this.discount = {
    type: discountType,
    [discountType === 'percentage' ? 'percentage' : 'amount']: value,
    reason: reason,
    approvedBy: approvedBy,
    approvalDate: new Date()
  };
  
  this.updateStatus();
  return this;
};

feeSchema.methods.addPayment = function(paymentData) {
  // Generate receipt number if not provided
  if (!paymentData.receiptNumber) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    paymentData.receiptNumber = `RCP${timestamp}${random}`;
  }
  
  this.payments.push(paymentData);
  this.amountPaid += paymentData.amount;
  
  this.updateStatus();
  
  if (this.status === 'paid') {
    this.paidDate = new Date();
  }
  
  return this;
};

feeSchema.methods.updateStatus = function() {
  const netAmount = this.netAmount;
  const paidAmount = this.amountPaid;
  
  if (paidAmount >= netAmount) {
    this.status = 'paid';
    this.remainingAmount = 0;
  } else if (paidAmount > 0) {
    this.status = 'partial';
    this.remainingAmount = netAmount - paidAmount;
  } else if (this.isOverdue) {
    this.status = 'overdue';
    this.remainingAmount = netAmount;
  } else {
    this.status = 'pending';
    this.remainingAmount = netAmount;
  }
  
  return this;
};

feeSchema.methods.generateReceiptNumber = function() {
  if (this.receiptNumber) return this.receiptNumber;
  
  const academicYearShort = this.academicYear.toString().slice(-2);
  const monthNumber = new Date().getMonth() + 1;
  const timestamp = Date.now().toString().slice(-6);
  
  this.receiptNumber = `${academicYearShort}${monthNumber.toString().padStart(2, '0')}${timestamp}`;
  this.receiptGenerated = true;
  this.receiptDate = new Date();
  
  return this.receiptNumber;
};

feeSchema.methods.addNote = function(noteText, addedBy, isPrivate = false) {
  this.notes.push({
    note: noteText,
    addedBy: addedBy,
    isPrivate: isPrivate
  });
  return this;
};

feeSchema.methods.canBeRefunded = function() {
  return this.status === 'paid' && 
         this.amountPaid > 0 && 
         (!this.refund || this.refund.status !== 'processed');
};

feeSchema.methods.requestRefund = function(amount, reason, requestedBy) {
  if (!this.canBeRefunded()) {
    throw new Error('Fee cannot be refunded');
  }
  
  if (amount > this.amountPaid) {
    throw new Error('Refund amount cannot exceed paid amount');
  }
  
  this.refund = {
    amount: amount,
    reason: reason,
    requestDate: new Date(),
    status: 'requested'
  };
  
  return this;
};

// Static methods
feeSchema.statics.findOverdueFees = function(classId = null, days = 0) {
  const query = {
    status: { $in: ['pending', 'partial', 'overdue'] },
    dueDate: { $lt: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
  };
  
  if (classId) {
    query.class = classId;
  }
  
  return this.find(query)
    .populate('student', 'firstName lastName rollNumber')
    .populate('class', 'name level')
    .sort({ dueDate: 1 });
};

feeSchema.statics.getCollectionSummary = function(filters = {}) {
  const pipeline = [
    { $match: filters },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        totalCollected: { $sum: '$amountPaid' },
        totalPending: { $sum: { $subtract: ['$amount', '$amountPaid'] } },
        totalRecords: { $sum: 1 },
        paidCount: {
          $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
        },
        partialCount: {
          $sum: { $cond: [{ $eq: ['$status', 'partial'] }, 1, 0] }
        },
        pendingCount: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        overdueCount: {
          $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0] }
        }
      }
    }
  ];
  
  return this.aggregate(pipeline);
};

// Pre-save middleware
feeSchema.pre('save', function(next) {
  // Calculate remaining amount
  this.remainingAmount = Math.max(0, this.netAmount - this.amountPaid);
  
  // Update status based on payment
  this.updateStatus();
  
  // Apply automatic late fee if overdue
  if (this.isOverdue && this.status !== 'paid' && !this.lateFee.amount) {
    const calculatedLateFee = this.calculateLateFee();
    if (calculatedLateFee > 0) {
      this.lateFee.amount = calculatedLateFee;
      this.lateFee.appliedDate = new Date();
    }
  }
  
  // Validate payment amounts
  const totalPayments = this.payments.reduce((sum, payment) => sum + payment.amount, 0);
  if (Math.abs(totalPayments - this.amountPaid) > 0.01) {
    this.amountPaid = totalPayments;
  }
  
  next();
});

// Pre-find middleware to exclude archived records by default
feeSchema.pre(/^find/, function(next) {
  if (!this.getQuery().isArchived) {
    this.find({ isArchived: { $ne: true } });
  }
  next();
});

module.exports = mongoose.models.Fee || mongoose.model('Fee', feeSchema);