const mongoose = require('mongoose');

// Fee Structure Schema
const feeStructureSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Fee structure name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  // Academic Information
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    match: [/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY']
  },
  applicableClasses: [{
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class is required']
    },
    sections: [String] // Array of section names, empty array means all sections
  }],
  
  // Fee Components
  feeComponents: [{
    name: {
      type: String,
      required: [true, 'Fee component name is required'],
      trim: true
    },
    type: {
      type: String,
      required: [true, 'Fee type is required'],
      enum: [
        'tuition', 'admission', 'development', 'library', 'laboratory', 
        'sports', 'transport', 'examination', 'activity', 'miscellaneous',
        'hostel', 'mess', 'uniform', 'books', 'stationery', 'insurance',
        'security-deposit', 'caution-money'
      ]
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: 0
    },
    frequency: {
      type: String,
      required: [true, 'Payment frequency is required'],
      enum: ['monthly', 'quarterly', 'half-yearly', 'yearly', 'one-time']
    },
    dueDate: {
      type: String, // Format: "DD" for monthly, "MM-DD" for others
      required: [true, 'Due date is required']
    },
    isOptional: {
      type: Boolean,
      default: false
    },
    isRefundable: {
      type: Boolean,
      default: false
    },
    description: String
  }],
  
  // Discounts and Scholarships
  discounts: [{
    name: {
      type: String,
      required: [true, 'Discount name is required']
    },
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: [true, 'Discount type is required']
    },
    value: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: 0
    },
    applicableComponents: [String], // Names of fee components
    criteria: {
      type: String,
      enum: [
        'merit', 'sports', 'cultural', 'economically-weak', 'staff-ward',
        'sibling', 'early-payment', 'loyalty', 'other'
      ]
    },
    maxStudents: Number, // Maximum students eligible
    validFrom: Date,
    validUntil: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  
  // Payment Terms
  paymentTerms: {
    lateFee: {
      type: Number,
      default: 0,
      min: 0
    },
    lateFeeType: {
      type: String,
      enum: ['fixed', 'percentage'],
      default: 'fixed'
    },
    gracePeriod: {
      type: Number, // Days
      default: 0,
      min: 0
    },
    installmentsAllowed: {
      type: Boolean,
      default: false
    },
    maxInstallments: {
      type: Number,
      default: 1,
      min: 1,
      max: 12
    }
  },
  
  // Total Amounts (calculated fields)
  totalAmount: {
    yearly: {
      type: Number,
      default: 0
    },
    monthly: {
      type: Number,
      default: 0
    }
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
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

// Fee Transaction Schema
const feeTransactionSchema = new mongoose.Schema({
  // Basic Information
  transactionId: {
    type: String,
    required: [true, 'Transaction ID is required'],
    unique: true
  },
  receiptNumber: {
    type: String,
    required: [true, 'Receipt number is required'],
    unique: true
  },
  
  // Student Information
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student is required']
  },
  
  // Academic Information
  academicYear: {
    type: String,
    required: [true, 'Academic year is required']
  },
  feeStructure: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeeStructure',
    required: [true, 'Fee structure is required']
  },
  
  // Payment Details
  paymentFor: {
    month: Number, // 1-12 for monthly fees
    quarter: Number, // 1-4 for quarterly fees
    term: String, // For term-wise payments
    description: String
  },
  
  // Fee Components Paid
  componentsPaid: [{
    componentName: {
      type: String,
      required: [true, 'Component name is required']
    },
    baseAmount: {
      type: Number,
      required: [true, 'Base amount is required']
    },
    discount: {
      amount: {
        type: Number,
        default: 0
      },
      type: String,
      description: String
    },
    finalAmount: {
      type: Number,
      required: [true, 'Final amount is required']
    }
  }],
  
  // Transaction Amounts
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: 0
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  lateFeeAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  paidAmount: {
    type: Number,
    required: [true, 'Paid amount is required'],
    min: 0
  },
  
  // Payment Information
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: ['cash', 'cheque', 'bank-transfer', 'online', 'upi', 'card', 'dd']
  },
  paymentReference: String, // Cheque number, transaction ID, etc.
  paymentDate: {
    type: Date,
    required: [true, 'Payment date is required'],
    default: Date.now
  },
  
  // Bank Details (for cheque/DD/transfer)
  bankDetails: {
    bankName: String,
    branchName: String,
    accountNumber: String,
    chequeNumber: String,
    ddNumber: String,
    clearanceDate: Date,
    clearanceStatus: {
      type: String,
      enum: ['pending', 'cleared', 'bounced'],
      default: 'cleared'
    }
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'completed'
  },
  
  // Collected by
  collectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Collected by is required']
  },
  
  // Additional Information
  remarks: String,
  
  // Refund Information
  refund: {
    amount: {
      type: Number,
      default: 0
    },
    date: Date,
    reason: String,
    refundedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
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

// Student Fee Status Schema
const studentFeeStatusSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student is required']
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required']
  },
  feeStructure: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeeStructure',
    required: [true, 'Fee structure is required']
  },
  
  // Fee Summary
  totalYearlyFee: {
    type: Number,
    required: [true, 'Total yearly fee is required']
  },
  totalPaidAmount: {
    type: Number,
    default: 0
  },
  totalDiscountAmount: {
    type: Number,
    default: 0
  },
  totalLateFeeAmount: {
    type: Number,
    default: 0
  },
  outstandingAmount: {
    type: Number,
    default: 0
  },
  
  // Month-wise Status (for monthly fee structures)
  monthlyStatus: [{
    month: {
      type: Number,
      required: [true, 'Month is required'],
      min: 1,
      max: 12
    },
    dueAmount: {
      type: Number,
      required: [true, 'Due amount is required']
    },
    paidAmount: {
      type: Number,
      default: 0
    },
    discountAmount: {
      type: Number,
      default: 0
    },
    lateFeeAmount: {
      type: Number,
      default: 0
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required']
    },
    paidDate: Date,
    status: {
      type: String,
      enum: ['pending', 'paid', 'partial', 'overdue'],
      default: 'pending'
    }
  }],
  
  // Applied Discounts
  appliedDiscounts: [{
    discountName: String,
    discountType: String,
    discountValue: Number,
    appliedAmount: Number,
    appliedDate: Date
  }],
  
  // Last Updated
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
feeStructureSchema.index({ academicYear: 1 });
feeStructureSchema.index({ 'applicableClasses.class': 1 });

feeTransactionSchema.index({ student: 1 });
feeTransactionSchema.index({ academicYear: 1 });
feeTransactionSchema.index({ paymentDate: 1 });
feeTransactionSchema.index({ status: 1 });
feeTransactionSchema.index({ transactionId: 1 });
feeTransactionSchema.index({ receiptNumber: 1 });

studentFeeStatusSchema.index({ student: 1, academicYear: 1 }, { unique: true });
studentFeeStatusSchema.index({ 'monthlyStatus.status': 1 });

// Fee Structure Methods
feeStructureSchema.methods.calculateTotalAmount = function() {
  let yearlyTotal = 0;
  let monthlyTotal = 0;
  
  this.feeComponents.forEach(component => {
    switch (component.frequency) {
      case 'yearly':
      case 'one-time':
        yearlyTotal += component.amount;
        break;
      case 'half-yearly':
        yearlyTotal += component.amount * 2;
        break;
      case 'quarterly':
        yearlyTotal += component.amount * 4;
        break;
      case 'monthly':
        yearlyTotal += component.amount * 12;
        monthlyTotal += component.amount;
        break;
    }
  });
  
  this.totalAmount.yearly = yearlyTotal;
  this.totalAmount.monthly = monthlyTotal;
  
  return this.totalAmount;
};

// Student Fee Status Methods
studentFeeStatusSchema.methods.updateStatus = function() {
  // Calculate outstanding amount
  this.outstandingAmount = this.totalYearlyFee + this.totalLateFeeAmount 
    - this.totalPaidAmount - this.totalDiscountAmount;
  
  // Update monthly status
  this.monthlyStatus.forEach(month => {
    const totalDue = month.dueAmount + month.lateFeeAmount;
    const totalPaid = month.paidAmount + month.discountAmount;
    
    if (totalPaid >= totalDue) {
      month.status = 'paid';
    } else if (totalPaid > 0) {
      month.status = 'partial';
    } else if (new Date() > month.dueDate) {
      month.status = 'overdue';
    } else {
      month.status = 'pending';
    }
  });
  
  this.lastUpdated = new Date();
  return this;
};

// Pre-save middlewares
feeStructureSchema.pre('save', function(next) {
  this.calculateTotalAmount();
  next();
});

studentFeeStatusSchema.pre('save', function(next) {
  this.updateStatus();
  next();
});

// Models
const FeeStructure = mongoose.model('FeeStructure', feeStructureSchema);
const FeeTransaction = mongoose.model('FeeTransaction', feeTransactionSchema);
const StudentFeeStatus = mongoose.model('StudentFeeStatus', studentFeeStatusSchema);

module.exports = {
  FeeStructure,
  FeeTransaction,
  StudentFeeStatus
};