const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  // Teacher Identification
  employeeId: {
    type: String,
    required: [true, 'Employee ID is required'],
    unique: true,
    trim: true
  },
  
  // Link to User account
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  
  // Professional Information
  designation: {
    type: String,
    required: [true, 'Designation is required'],
    enum: [
      'Principal', 'Vice Principal', 'Head Teacher', 'Senior Teacher', 
      'Teacher', 'Assistant Teacher', 'Subject Coordinator', 'Lab Assistant',
      'Sports Teacher', 'Music Teacher', 'Art Teacher', 'Librarian',
      'Counselor', 'Admin Staff'
    ]
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    enum: [
      'Mathematics', 'Science', 'English', 'Social Studies', 'Languages',
      'Computer Science', 'Physical Education', 'Arts', 'Music',
      'Administration', 'Library', 'Counseling'
    ]
  },
  
  // Employment Details
  joiningDate: {
    type: Date,
    required: [true, 'Joining date is required']
  },
  employmentType: {
    type: String,
    required: [true, 'Employment type is required'],
    enum: ['permanent', 'contract', 'part-time', 'temporary', 'probation']
  },
  contractEndDate: {
    type: Date,
    required: function() {
      return this.employmentType === 'contract' || this.employmentType === 'temporary';
    }
  },
  
  // Qualifications
  qualifications: [{
    degree: {
      type: String,
      required: [true, 'Degree is required']
    },
    field: String,
    institution: {
      type: String,
      required: [true, 'Institution is required']
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: 1950,
      max: new Date().getFullYear()
    },
    grade: String,
    certificate: String // File path or URL
  }],
  
  // Experience
  previousExperience: [{
    organization: {
      type: String,
      required: [true, 'Organization is required']
    },
    position: {
      type: String,
      required: [true, 'Position is required']
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required']
    },
    responsibilities: String,
    reasonForLeaving: String
  }],
  totalExperience: {
    years: {
      type: Number,
      default: 0,
      min: 0
    },
    months: {
      type: Number,
      default: 0,
      min: 0,
      max: 11
    }
  },
  
  // Teaching Assignment
  subjects: [{
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject is required']
    },
    classes: [{
      class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class'
      },
      section: String
    }],
    isClassTeacher: {
      type: Boolean,
      default: false
    }
  }],
  
  // Class Teacher Assignment
  assignedClasses: [{
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class'
    },
    section: String,
    academicYear: String
  }],
  
  // Timetable
  timetable: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      required: [true, 'Day is required']
    },
    periods: [{
      periodNumber: {
        type: Number,
        required: [true, 'Period number is required'],
        min: 1,
        max: 10
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
      subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
      },
      class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class'
      },
      section: String,
      room: String
    }]
  }],
  
  // Salary Information
  salary: {
    basicSalary: {
      type: Number,
      required: [true, 'Basic salary is required'],
      min: 0
    },
    allowances: {
      hra: { type: Number, default: 0 },
      transport: { type: Number, default: 0 },
      medical: { type: Number, default: 0 },
      special: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    },
    deductions: {
      pf: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      insurance: { type: Number, default: 0 },
      loan: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    },
    grossSalary: Number, // Calculated field
    netSalary: Number // Calculated field
  },
  
  // Leave Information
  leaveBalance: {
    casual: { type: Number, default: 12 },
    sick: { type: Number, default: 12 },
    earned: { type: Number, default: 0 },
    maternity: { type: Number, default: 0 },
    paternity: { type: Number, default: 0 }
  },
  
  // Performance
  performanceRatings: [{
    academicYear: String,
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: String,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewDate: Date
  }],
  
  // Training and Development
  trainings: [{
    title: {
      type: String,
      required: [true, 'Training title is required']
    },
    provider: String,
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: Date,
    duration: String, // e.g., "40 hours"
    certificate: String, // File path or URL
    status: {
      type: String,
      enum: ['completed', 'ongoing', 'cancelled'],
      default: 'ongoing'
    }
  }],
  
  // Disciplinary Records
  disciplinaryRecords: [{
    date: {
      type: Date,
      required: true
    },
    type: {
      type: String,
      enum: ['warning', 'show_cause', 'suspension', 'termination', 'commendation'],
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
  
  // Bank Details
  bankDetails: {
    accountNumber: String,
    bankName: String,
    branchName: String,
    ifscCode: String,
    accountHolderName: String
  },
  
  // Documents
  documents: [{
    type: {
      type: String,
      required: [true, 'Document type is required'],
      enum: [
        'resume', 'degree_certificate', 'experience_letter',
        'identity_proof', 'address_proof', 'photo',
        'medical_certificate', 'police_verification'
      ]
    },
    fileName: String,
    filePath: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'resigned', 'terminated', 'retired'],
    default: 'active'
  },
  
  // Exit Details
  exitDate: Date,
  exitReason: String,
  
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
teacherSchema.index({ employeeId: 1 });
teacherSchema.index({ department: 1 });
teacherSchema.index({ designation: 1 });
teacherSchema.index({ status: 1 });
teacherSchema.index({ 'subjects.subject': 1 });
teacherSchema.index({ 'assignedClasses.class': 1 });

// Virtual for full name (from user)
teacherSchema.virtual('fullName').get(function() {
  return this.user ? `${this.user.firstName} ${this.user.lastName}` : '';
});

// Method to calculate gross and net salary
teacherSchema.methods.calculateSalary = function() {
  const allowanceTotal = Object.values(this.salary.allowances || {}).reduce((sum, val) => sum + (val || 0), 0);
  const deductionTotal = Object.values(this.salary.deductions || {}).reduce((sum, val) => sum + (val || 0), 0);
  
  this.salary.grossSalary = this.salary.basicSalary + allowanceTotal;
  this.salary.netSalary = this.salary.grossSalary - deductionTotal;
  
  return {
    gross: this.salary.grossSalary,
    net: this.salary.netSalary
  };
};

// Method to check if teacher is class teacher for a specific class
teacherSchema.methods.isClassTeacherOf = function(classId, section) {
  return this.assignedClasses.some(ac => 
    ac.class.toString() === classId.toString() && 
    ac.section === section
  );
};

// Method to get teaching load (number of periods per week)
teacherSchema.methods.getTeachingLoad = function() {
  let totalPeriods = 0;
  this.timetable.forEach(day => {
    totalPeriods += day.periods.length;
  });
  return totalPeriods;
};

// Method to check availability for a specific time slot
teacherSchema.methods.isAvailable = function(day, startTime, endTime) {
  const daySchedule = this.timetable.find(t => t.day === day.toLowerCase());
  if (!daySchedule) return true;
  
  return !daySchedule.periods.some(period => {
    return (startTime < period.endTime && endTime > period.startTime);
  });
};

// Pre-save middleware to calculate salary
teacherSchema.pre('save', function(next) {
  if (this.salary && this.salary.basicSalary) {
    this.calculateSalary();
  }
  next();
});

module.exports = mongoose.model('Teacher', teacherSchema);