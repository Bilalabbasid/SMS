const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[0-9+\-\s\(\)]+$/, 'Please provide a valid phone number']
  },
  
  // Role and Permissions
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: {
      values: ['admin', 'teacher', 'student', 'parent', 'accountant', 'librarian'],
      message: 'Role must be one of: admin, teacher, student, parent, accountant, librarian'
    }
  },
  permissions: [{
    type: String,
    enum: [
      'manage_users', 'manage_students', 'manage_teachers', 'manage_classes',
      'manage_subjects', 'manage_diary', 'manage_attendance', 'manage_exams',
      'manage_fees', 'manage_library', 'manage_transport', 'view_reports',
      'manage_notifications', 'manage_system'
    ]
  }],
  
  // Profile Information
  avatar: {
    type: String,
    default: null
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: ['male', 'female', 'other']
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date,
    default: null
  },
  
  // Password Reset
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  
  // Email Verification
  emailVerificationToken: String,
  emailVerificationExpire: Date,
  
  // Linked Records (populated based on role)
  studentProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  },
  teacherProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  },
  
  // Children (for parents)
  children: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  
  // Preferences
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    language: {
      type: String,
      default: 'en'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      },
      inApp: {
        type: Boolean,
        default: true
      }
    }
  }
}, {
  timestamps: true
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Instance method to get role permissions
userSchema.methods.getRolePermissions = function() {
  const rolePermissions = {
    admin: [
      'manage_users', 'manage_students', 'manage_teachers', 'manage_classes',
      'manage_subjects', 'manage_diary', 'manage_attendance', 'manage_exams',
      'manage_fees', 'manage_library', 'manage_transport', 'view_reports',
      'manage_notifications', 'manage_system'
    ],
    teacher: [
      'manage_diary', 'manage_attendance', 'manage_exams', 'view_reports'
    ],
    student: [
      'view_diary', 'view_attendance', 'view_exams', 'view_fees'
    ],
    parent: [
      'view_diary', 'view_attendance', 'view_exams', 'view_fees', 'view_reports'
    ],
    accountant: [
      'manage_fees', 'view_reports'
    ],
    librarian: [
      'manage_library'
    ]
  };

  return rolePermissions[this.role] || [];
};

// Instance method to check if user has permission
userSchema.methods.hasPermission = function(permission) {
  const rolePermissions = this.getRolePermissions();
  return rolePermissions.includes(permission) || this.permissions.includes(permission);
};

module.exports = mongoose.model('User', userSchema);