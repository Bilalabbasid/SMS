const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student is required']
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject is required']
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: [true, 'Class is required']
  },
  component: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GradeComponent',
    required: [true, 'Grade component is required']
  },
  marksObtained: {
    type: Number,
    required: [true, 'Marks obtained is required'],
    min: [0, 'Marks cannot be negative']
  },
  percentage: {
    type: Number,
    required: [true, 'Percentage is required'],
    min: [0, 'Percentage cannot be negative'],
    max: [100, 'Percentage cannot exceed 100']
  },
  grade: {
    type: String,
    required: [true, 'Letter grade is required'],
    enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F']
  },
  remarks: {
    type: String,
    maxlength: [200, 'Remarks cannot exceed 200 characters']
  },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Graded by is required']
  },
  gradedAt: {
    type: Date,
    required: [true, 'Graded at date is required']
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    default: function() {
      const currentYear = new Date().getFullYear();
      return `${currentYear}-${currentYear + 1}`;
    }
  },
  term: {
    type: String,
    enum: ['1st Term', '2nd Term', '3rd Term', 'Annual'],
    default: '1st Term'
  },
  isPublished: {
    type: Boolean,
    default: false
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
gradeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Compound indexes for efficient queries
gradeSchema.index({ student: 1, subject: 1, academicYear: 1 });
gradeSchema.index({ class: 1, subject: 1, component: 1 });
gradeSchema.index({ component: 1 });
gradeSchema.index({ gradedBy: 1 });
gradeSchema.index({ gradedAt: -1 });

// Unique constraint to prevent duplicate grades for same student-component
gradeSchema.index({ student: 1, component: 1 }, { unique: true });

// Virtual for grade point calculation
gradeSchema.virtual('gradePoint').get(function() {
  const gradePoints = {
    'A+': 4.0, 'A': 3.7, 'B+': 3.3, 'B': 3.0,
    'C+': 2.7, 'C': 2.3, 'D+': 2.0, 'D': 1.0, 'F': 0.0
  };
  return gradePoints[this.grade] || 0.0;
});

// Static method to calculate class average
gradeSchema.statics.getClassAverage = async function(classId, subjectId, componentId) {
  const result = await this.aggregate([
    {
      $match: {
        class: mongoose.Types.ObjectId(classId),
        subject: mongoose.Types.ObjectId(subjectId),
        ...(componentId && { component: mongoose.Types.ObjectId(componentId) })
      }
    },
    {
      $group: {
        _id: null,
        averagePercentage: { $avg: '$percentage' },
        averageGradePoint: { $avg: '$gradePoint' },
        totalStudents: { $sum: 1 }
      }
    }
  ]);
  
  return result.length > 0 ? result[0] : null;
};

// Static method to get grade distribution
gradeSchema.statics.getGradeDistribution = async function(classId, subjectId) {
  return await this.aggregate([
    {
      $match: {
        class: mongoose.Types.ObjectId(classId),
        subject: mongoose.Types.ObjectId(subjectId)
      }
    },
    {
      $group: {
        _id: '$grade',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
};

const Grade = mongoose.model('Grade', gradeSchema);

module.exports = Grade;