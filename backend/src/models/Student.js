const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  // Student Identification
  studentId: {
    type: String,
    required: [true, 'Student ID is required'],
    unique: true,
    trim: true
  },
  rollNumber: {
    type: String,
    required: [true, 'Roll number is required'],
    trim: true
  },
  
  // Link to User account
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
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
    trim: true,
    maxlength: [10, 'Section cannot exceed 10 characters']
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    match: [/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY']
  },
  
  // Admission Details
  admissionDate: {
    type: Date,
    required: [true, 'Admission date is required']
  },
  admissionNumber: {
    type: String,
    required: [true, 'Admission number is required'],
    unique: true,
    trim: true
  },
  previousSchool: {
    name: String,
    address: String,
    reasonForLeaving: String
  },
  
  // Parent/Guardian Information
  parents: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    relationship: {
      type: String,
      required: [true, 'Relationship is required'],
      enum: ['father', 'mother', 'guardian', 'other']
    },
    isPrimary: {
      type: Boolean,
      default: false
    },
    occupation: String,
    workPhone: String
  }],
  
  // Medical Information
  medicalInfo: {
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown']
    },
    allergies: [String],
    medications: [String],
    medicalConditions: [String],
    doctorName: String,
    doctorPhone: String,
    insuranceDetails: {
      provider: String,
      policyNumber: String,
      validUntil: Date
    }
  },
  
  // Academic Performance
  subjects: [{
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject'
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher'
    },
    isOptional: {
      type: Boolean,
      default: false
    }
  }],
  
  // Attendance Statistics (calculated fields)
  attendanceStats: {
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
    attendancePercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  
  // Fee Information
  feeStructure: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeeStructure'
  },
  
  // Transport Information
  transport: {
    isAvailed: {
      type: Boolean,
      default: false
    },
    route: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TransportRoute'
    },
    pickupPoint: String,
    feeAmount: Number
  },
  
  // Library Information
  library: {
    cardNumber: {
      type: String,
      unique: true,
      sparse: true
    },
    booksIssued: [{
      book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book'
      },
      issueDate: Date,
      returnDate: Date,
      fine: {
        type: Number,
        default: 0
      }
    }],
    totalFine: {
      type: Number,
      default: 0
    }
  },
  
  // Disciplinary Records
  disciplinaryRecords: [{
    date: {
      type: Date,
      required: true
    },
    type: {
      type: String,
      enum: ['warning', 'detention', 'suspension', 'expulsion', 'commendation'],
      required: true
    },
    reason: {
      type: String,
      required: true
    },
    action: String,
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolved: {
      type: Boolean,
      default: false
    }
  }],
  
  // Achievements and Awards
  achievements: [{
    title: {
      type: String,
      required: true
    },
    description: String,
    date: {
      type: Date,
      required: true
    },
    category: {
      type: String,
      enum: ['academic', 'sports', 'cultural', 'social', 'other'],
      required: true
    },
    certificate: String // File path or URL
  }],
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'transferred', 'graduated', 'dropped'],
    default: 'active'
  },
  
  // Graduation/Leaving Details
  graduationDate: Date,
  leavingReason: String,
  transferCertificateIssued: {
    type: Boolean,
    default: false
  },
  
  // Additional Notes
  notes: String,
  
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
studentSchema.index({ studentId: 1 });
studentSchema.index({ admissionNumber: 1 });
studentSchema.index({ class: 1, section: 1 });
studentSchema.index({ academicYear: 1 });
studentSchema.index({ status: 1 });
studentSchema.index({ 'parents.user': 1 });

// Compound index for roll number uniqueness within class and academic year
studentSchema.index({ 
  rollNumber: 1, 
  class: 1, 
  academicYear: 1 
}, { unique: true });

// Virtual for full name (from user)
studentSchema.virtual('fullName').get(function() {
  return this.user ? `${this.user.firstName} ${this.user.lastName}` : '';
});

// Method to calculate attendance percentage
studentSchema.methods.calculateAttendance = function() {
  if (this.attendanceStats.totalDays === 0) {
    this.attendanceStats.attendancePercentage = 0;
  } else {
    this.attendanceStats.attendancePercentage = 
      Math.round((this.attendanceStats.presentDays / this.attendanceStats.totalDays) * 100);
  }
  return this.attendanceStats.attendancePercentage;
};

// Method to get primary parent
studentSchema.methods.getPrimaryParent = function() {
  return this.parents.find(parent => parent.isPrimary) || this.parents[0] || null;
};

// Method to check if student has subject
studentSchema.methods.hasSubject = function(subjectId) {
  return this.subjects.some(sub => sub.subject.toString() === subjectId.toString());
};

// Pre-save middleware to ensure only one primary parent
studentSchema.pre('save', function(next) {
  if (this.parents && this.parents.length > 0) {
    let primaryCount = this.parents.filter(parent => parent.isPrimary).length;
    
    // If no primary parent is set, make the first one primary
    if (primaryCount === 0) {
      this.parents[0].isPrimary = true;
    }
    
    // If multiple primary parents, keep only the first one
    if (primaryCount > 1) {
      let foundPrimary = false;
      this.parents.forEach(parent => {
        if (parent.isPrimary && !foundPrimary) {
          foundPrimary = true;
        } else if (parent.isPrimary && foundPrimary) {
          parent.isPrimary = false;
        }
      });
    }
  }
  
  next();
});

module.exports = mongoose.model('Student', studentSchema);