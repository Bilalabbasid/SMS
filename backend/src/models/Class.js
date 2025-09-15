const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Class name is required'],
    trim: true,
    maxlength: [50, 'Class name cannot exceed 50 characters']
  },
  level: {
    type: String,
    required: [true, 'Class level is required'],
    enum: [
      'Nursery', 'LKG', 'UKG', 'Pre-K',
      '1st', '2nd', '3rd', '4th', '5th',
      '6th', '7th', '8th', '9th', '10th',
      '11th', '12th', 'Diploma', 'Graduate'
    ]
  },
  grade: {
    type: Number,
    required: [true, 'Grade number is required'],
    min: 0,
    max: 20
  },
  
  // Sections
  sections: [{
    name: {
      type: String,
      required: [true, 'Section name is required'],
      trim: true,
      maxlength: [10, 'Section name cannot exceed 10 characters']
    },
    maxStudents: {
      type: Number,
      required: [true, 'Maximum students is required'],
      min: 1,
      max: 100,
      default: 40
    },
    currentStudents: {
      type: Number,
      default: 0,
      min: 0
    },
    classTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher'
    },
    room: {
      type: String,
      trim: true,
      maxlength: [20, 'Room number cannot exceed 20 characters']
    }
  }],
  
  // Academic Information
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    match: [/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY']
  },
  
  // Curriculum and Subjects
  subjects: [{
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject is required']
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher'
    },
    isCore: {
      type: Boolean,
      default: true
    },
    isOptional: {
      type: Boolean,
      default: false
    },
    periodsPerWeek: {
      type: Number,
      required: [true, 'Periods per week is required'],
      min: 1,
      max: 20,
      default: 5
    },
    maxMarks: {
      type: Number,
      default: 100,
      min: 50,
      max: 200
    },
    passMarks: {
      type: Number,
      default: 40,
      min: 30,
      max: 60
    }
  }],
  
  // Timetable Template
  timetable: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
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
      teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher'
      },
      type: {
        type: String,
        enum: ['regular', 'lab', 'library', 'sports', 'assembly', 'break'],
        default: 'regular'
      }
    }]
  }],
  
  // Fee Structure
  feeStructure: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeeStructure'
  },
  
  // Exam Configuration
  examConfig: {
    totalExams: {
      type: Number,
      default: 4
    },
    examTypes: [{
      name: {
        type: String,
        required: [true, 'Exam type name is required']
      },
      weightage: {
        type: Number,
        required: [true, 'Weightage is required'],
        min: 0,
        max: 100
      },
      maxMarks: {
        type: Number,
        required: [true, 'Maximum marks is required'],
        min: 50,
        max: 200,
        default: 100
      }
    }],
    gradingSystem: {
      type: String,
      enum: ['percentage', 'gpa', 'grade'],
      default: 'percentage'
    },
    passingCriteria: {
      overall: {
        type: Number,
        default: 40,
        min: 30,
        max: 60
      },
      individual: {
        type: Number,
        default: 35,
        min: 25,
        max: 50
      }
    }
  },
  
  // Class Statistics
  statistics: {
    totalStudents: {
      type: Number,
      default: 0
    },
    averageAttendance: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    averageMarks: {
      type: Number,
      default: 0
    },
    passPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  
  // Class Rules and Policies
  classRules: [{
    rule: {
      type: String,
      required: [true, 'Rule is required']
    },
    description: String,
    consequences: String
  }],
  
  // Resources
  resources: [{
    type: {
      type: String,
      enum: ['book', 'equipment', 'software', 'other'],
      required: [true, 'Resource type is required']
    },
    name: {
      type: String,
      required: [true, 'Resource name is required']
    },
    description: String,
    quantity: {
      type: Number,
      default: 1,
      min: 0
    },
    condition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor', 'damaged'],
      default: 'good'
    }
  }],
  
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

// Indexes
classSchema.index({ name: 1, academicYear: 1 }, { unique: true });
classSchema.index({ grade: 1 });
classSchema.index({ level: 1 });
classSchema.index({ academicYear: 1 });
classSchema.index({ isActive: 1 });

// Virtual for total capacity
classSchema.virtual('totalCapacity').get(function() {
  return this.sections.reduce((total, section) => total + section.maxStudents, 0);
});

// Virtual for total enrolled students
classSchema.virtual('totalEnrolled').get(function() {
  return this.sections.reduce((total, section) => total + section.currentStudents, 0);
});

// Virtual for available seats
classSchema.virtual('availableSeats').get(function() {
  return this.totalCapacity - this.totalEnrolled;
});

// Method to get section by name
classSchema.methods.getSection = function(sectionName) {
  return this.sections.find(section => section.name === sectionName);
};

// Method to add student to section
classSchema.methods.addStudentToSection = function(sectionName) {
  const section = this.getSection(sectionName);
  if (section && section.currentStudents < section.maxStudents) {
    section.currentStudents += 1;
    return true;
  }
  return false;
};

// Method to remove student from section
classSchema.methods.removeStudentFromSection = function(sectionName) {
  const section = this.getSection(sectionName);
  if (section && section.currentStudents > 0) {
    section.currentStudents -= 1;
    return true;
  }
  return false;
};

// Method to check if class has subject
classSchema.methods.hasSubject = function(subjectId) {
  return this.subjects.some(sub => sub.subject.toString() === subjectId.toString());
};

// Method to get total periods per week
classSchema.methods.getTotalPeriods = function() {
  return this.subjects.reduce((total, subject) => total + subject.periodsPerWeek, 0);
};

// Pre-save middleware to update statistics
classSchema.pre('save', function(next) {
  // Update total students
  this.statistics.totalStudents = this.totalEnrolled;
  next();
});

module.exports = mongoose.model('Class', classSchema);