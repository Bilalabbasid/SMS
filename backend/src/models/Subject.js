const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true,
    maxlength: [100, 'Subject name cannot exceed 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Subject code is required'],
    unique: true,
    trim: true,
    uppercase: true,
    maxlength: [20, 'Subject code cannot exceed 20 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  // Subject Classification
  category: {
    type: String,
    required: [true, 'Subject category is required'],
    enum: [
      'Mathematics', 'Science', 'Language', 'Social Studies',
      'Computer Science', 'Arts', 'Physical Education', 'Music',
      'Vocational', 'Other'
    ]
  },
  type: {
    type: String,
    required: [true, 'Subject type is required'],
    enum: ['core', 'optional', 'extra-curricular']
  },
  
  // Academic Information
  credits: {
    type: Number,
    required: [true, 'Credits are required'],
    min: 1,
    max: 10,
    default: 4
  },
  totalMarks: {
    type: Number,
    required: [true, 'Total marks is required'],
    min: 50,
    max: 200,
    default: 100
  },
  passingMarks: {
    type: Number,
    required: [true, 'Passing marks is required'],
    min: 30,
    max: 100,
    default: 40
  },
  
  // Assessment Structure
  assessmentStructure: {
    theory: {
      weightage: {
        type: Number,
        min: 0,
        max: 100,
        default: 80
      },
      maxMarks: {
        type: Number,
        min: 0,
        max: 200,
        default: 80
      }
    },
    practical: {
      weightage: {
        type: Number,
        min: 0,
        max: 100,
        default: 20
      },
      maxMarks: {
        type: Number,
        min: 0,
        max: 100,
        default: 20
      }
    },
    internal: {
      weightage: {
        type: Number,
        min: 0,
        max: 50,
        default: 20
      },
      maxMarks: {
        type: Number,
        min: 0,
        max: 50,
        default: 20
      }
    },
    external: {
      weightage: {
        type: Number,
        min: 50,
        max: 100,
        default: 80
      },
      maxMarks: {
        type: Number,
        min: 50,
        max: 200,
        default: 80
      }
    }
  },
  
  // Classes and Levels
  applicableClasses: [{
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class is required']
    },
    isCompulsory: {
      type: Boolean,
      default: true
    },
    periodsPerWeek: {
      type: Number,
      required: [true, 'Periods per week is required'],
      min: 1,
      max: 20,
      default: 5
    }
  }],
  
  // Prerequisites
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  
  // Syllabus and Curriculum
  syllabus: {
    overview: String,
    objectives: [String],
    units: [{
      unitNumber: {
        type: Number,
        required: [true, 'Unit number is required'],
        min: 1
      },
      title: {
        type: String,
        required: [true, 'Unit title is required']
      },
      description: String,
      topics: [String],
      duration: {
        type: Number, // Duration in hours
        min: 1,
        default: 10
      },
      weightage: {
        type: Number, // Percentage weightage in exam
        min: 0,
        max: 100,
        default: 20
      }
    }],
    practicalWork: [{
      title: {
        type: String,
        required: [true, 'Practical title is required']
      },
      description: String,
      duration: Number, // Duration in hours
      materials: [String],
      learningOutcomes: [String]
    }]
  },
  
  // Resources
  textbooks: [{
    title: {
      type: String,
      required: [true, 'Book title is required']
    },
    author: String,
    publisher: String,
    edition: String,
    isbn: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  
  referenceBooks: [{
    title: {
      type: String,
      required: [true, 'Book title is required']
    },
    author: String,
    publisher: String,
    isbn: String
  }],
  
  onlineResources: [{
    title: {
      type: String,
      required: [true, 'Resource title is required']
    },
    url: {
      type: String,
      required: [true, 'URL is required'],
      match: [/^https?:\/\/.+/, 'Please provide a valid URL']
    },
    type: {
      type: String,
      enum: ['video', 'article', 'interactive', 'quiz', 'simulation', 'other'],
      default: 'other'
    },
    description: String
  }],
  
  // Teaching Methods
  teachingMethodologies: [{
    type: String,
    enum: [
      'lecture', 'discussion', 'project-based', 'problem-solving',
      'laboratory', 'field-work', 'presentation', 'group-work',
      'case-study', 'demonstration', 'simulation', 'other'
    ]
  }],
  
  // Assessment Methods
  assessmentMethods: [{
    type: String,
    enum: [
      'written-exam', 'oral-exam', 'practical-exam', 'project',
      'assignment', 'presentation', 'quiz', 'portfolio',
      'observation', 'peer-assessment', 'other'
    ]
  }],
  
  // Learning Outcomes
  learningOutcomes: [{
    outcome: {
      type: String,
      required: [true, 'Learning outcome is required']
    },
    bloomsLevel: {
      type: String,
      enum: ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'],
      required: [true, 'Blooms taxonomy level is required']
    }
  }],
  
  // Equipment and Lab Requirements
  equipmentRequired: [{
    item: {
      type: String,
      required: [true, 'Equipment item is required']
    },
    quantity: {
      type: Number,
      default: 1,
      min: 0
    },
    specifications: String,
    priority: {
      type: String,
      enum: ['essential', 'important', 'optional'],
      default: 'important'
    }
  }],
  
  // Software Requirements
  softwareRequired: [{
    name: {
      type: String,
      required: [true, 'Software name is required']
    },
    version: String,
    license: {
      type: String,
      enum: ['free', 'paid', 'educational'],
      default: 'free'
    },
    purpose: String
  }],
  
  // Department and Faculty
  department: {
    type: String,
    required: [true, 'Department is required'],
    enum: [
      'Mathematics', 'Science', 'English', 'Social Studies', 'Languages',
      'Computer Science', 'Physical Education', 'Arts', 'Music',
      'Vocational', 'Other'
    ]
  },
  
  headOfDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  },
  
  teachers: [{
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher'
    },
    isPrimary: {
      type: Boolean,
      default: false
    },
    specialization: String
  }],
  
  // Status and Configuration
  isActive: {
    type: Boolean,
    default: true
  },
  isExamSubject: {
    type: Boolean,
    default: true
  },
  hasLab: {
    type: Boolean,
    default: false
  },
  
  // Academic Year
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    match: [/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY']
  },
  
  // Statistics
  statistics: {
    totalStudents: {
      type: Number,
      default: 0
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
    },
    highestMarks: {
      type: Number,
      default: 0
    },
    lowestMarks: {
      type: Number,
      default: 0
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

// Indexes
subjectSchema.index({ code: 1 }, { unique: true });
subjectSchema.index({ name: 1 });
subjectSchema.index({ category: 1 });
subjectSchema.index({ department: 1 });
subjectSchema.index({ academicYear: 1 });
subjectSchema.index({ isActive: 1 });
subjectSchema.index({ 'applicableClasses.class': 1 });

// Virtual for total units
subjectSchema.virtual('totalUnits').get(function() {
  return this.syllabus.units ? this.syllabus.units.length : 0;
});

// Virtual for total duration
subjectSchema.virtual('totalDuration').get(function() {
  if (!this.syllabus.units) return 0;
  return this.syllabus.units.reduce((total, unit) => total + (unit.duration || 0), 0);
});

// Method to check if assessment structure is valid
subjectSchema.methods.validateAssessmentStructure = function() {
  const theory = this.assessmentStructure.theory.weightage || 0;
  const practical = this.assessmentStructure.practical.weightage || 0;
  return (theory + practical) === 100;
};

// Method to get applicable class grades
subjectSchema.methods.getApplicableGrades = function() {
  return this.applicableClasses.map(ac => ac.class.grade).sort((a, b) => a - b);
};

// Method to check if subject is applicable for a class
subjectSchema.methods.isApplicableForClass = function(classId) {
  return this.applicableClasses.some(ac => ac.class.toString() === classId.toString());
};

// Method to get primary teacher
subjectSchema.methods.getPrimaryTeacher = function() {
  return this.teachers.find(t => t.isPrimary) || this.teachers[0] || null;
};

// Method to calculate total practical hours
subjectSchema.methods.getTotalPracticalHours = function() {
  if (!this.syllabus.practicalWork) return 0;
  return this.syllabus.practicalWork.reduce((total, practical) => {
    return total + (practical.duration || 0);
  }, 0);
};

// Pre-save middleware to validate assessment structure
subjectSchema.pre('save', function(next) {
  // Ensure assessment structure weightages add up to 100
  if (this.assessmentStructure) {
    const theoryWeight = this.assessmentStructure.theory.weightage || 0;
    const practicalWeight = this.assessmentStructure.practical.weightage || 0;
    
    if (theoryWeight + practicalWeight !== 100) {
      return next(new Error('Theory and practical weightages must add up to 100%'));
    }
    
    // Set max marks based on weightages
    this.assessmentStructure.theory.maxMarks = 
      Math.round((this.totalMarks * theoryWeight) / 100);
    this.assessmentStructure.practical.maxMarks = 
      Math.round((this.totalMarks * practicalWeight) / 100);
  }
  
  // Ensure only one primary teacher
  const primaryTeachers = this.teachers.filter(t => t.isPrimary);
  if (primaryTeachers.length > 1) {
    this.teachers.forEach((teacher, index) => {
      if (index > 0) teacher.isPrimary = false;
    });
  }
  
  next();
});

module.exports = mongoose.model('Subject', subjectSchema);