const mongoose = require('mongoose');

// Book Schema
const bookSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Book title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  subtitle: {
    type: String,
    trim: true,
    maxlength: [200, 'Subtitle cannot exceed 200 characters']
  },
  
  // Author Information
  authors: [{
    name: {
      type: String,
      required: [true, 'Author name is required'],
      trim: true
    },
    role: {
      type: String,
      enum: ['author', 'co-author', 'editor', 'translator', 'illustrator'],
      default: 'author'
    }
  }],
  
  // Publication Details
  publisher: {
    name: {
      type: String,
      required: [true, 'Publisher name is required'],
      trim: true
    },
    location: String
  },
  publicationYear: {
    type: Number,
    required: [true, 'Publication year is required'],
    min: 1500,
    max: new Date().getFullYear() + 1
  },
  edition: {
    type: String,
    trim: true
  },
  
  // Book Identification
  isbn10: {
    type: String,
    unique: true,
    sparse: true,
    match: [/^[0-9]{9}[0-9X]$/, 'Invalid ISBN-10 format']
  },
  isbn13: {
    type: String,
    unique: true,
    sparse: true,
    match: [/^[0-9]{13}$/, 'Invalid ISBN-13 format']
  },
  
  // Classification
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Fiction', 'Non-Fiction', 'Science', 'Mathematics', 'History',
      'Geography', 'Literature', 'Language', 'Arts', 'Music',
      'Sports', 'Technology', 'Philosophy', 'Religion', 'Biography',
      'Reference', 'Textbook', 'Workbook', 'Encyclopedia', 'Dictionary',
      'Children', 'Young Adult', 'Academic', 'Professional', 'Other'
    ]
  },
  subcategory: String,
  subjects: [{
    type: String,
    trim: true
  }],
  
  // Physical Details
  language: {
    type: String,
    required: [true, 'Language is required'],
    default: 'English'
  },
  pages: {
    type: Number,
    min: 1
  },
  format: {
    type: String,
    enum: ['hardcover', 'paperback', 'ebook', 'audiobook', 'magazine', 'journal'],
    default: 'paperback'
  },
  dimensions: {
    length: Number, // in cm
    width: Number,  // in cm
    height: Number  // in cm
  },
  weight: Number, // in grams
  
  // Library Management
  accessionNumber: {
    type: String,
    required: [true, 'Accession number is required'],
    unique: true,
    trim: true
  },
  callNumber: {
    type: String,
    trim: true
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Acquisition Details
  acquisitionDate: {
    type: Date,
    required: [true, 'Acquisition date is required'],
    default: Date.now
  },
  acquisitionMethod: {
    type: String,
    enum: ['purchase', 'donation', 'exchange', 'gift'],
    default: 'purchase'
  },
  supplier: {
    name: String,
    contact: String,
    address: String
  },
  price: {
    amount: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },
  
  // Physical Copies
  totalCopies: {
    type: Number,
    required: [true, 'Total copies is required'],
    min: 1,
    default: 1
  },
  availableCopies: {
    type: Number,
    required: [true, 'Available copies is required'],
    min: 0
  },
  issuedCopies: {
    type: Number,
    default: 0,
    min: 0
  },
  damagedCopies: {
    type: Number,
    default: 0,
    min: 0
  },
  lostCopies: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Copy Details
  copies: [{
    copyNumber: {
      type: String,
      required: [true, 'Copy number is required']
    },
    condition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor', 'damaged'],
      default: 'good'
    },
    location: {
      shelf: String,
      section: String,
      floor: String
    },
    status: {
      type: String,
      enum: ['available', 'issued', 'reserved', 'lost', 'damaged', 'under-repair'],
      default: 'available'
    },
    issuedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    issueDate: Date,
    returnDate: Date,
    lastIssueDate: Date
  }],
  
  // Content Description
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  tableOfContents: [String],
  keywords: [String],
  summary: String,
  
  // Target Audience
  targetAudience: {
    ageGroup: {
      type: String,
      enum: ['children', 'young-adult', 'adult', 'all-ages']
    },
    readingLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert']
    },
    applicableClasses: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class'
    }]
  },
  
  // Digital Information
  digitalCopy: {
    isAvailable: {
      type: Boolean,
      default: false
    },
    fileFormat: String,
    fileSize: String,
    filePath: String,
    accessLevel: {
      type: String,
      enum: ['public', 'students', 'teachers', 'restricted'],
      default: 'students'
    }
  },
  
  // Reviews and Ratings
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    reviewDate: {
      type: Date,
      default: Date.now
    }
  }],
  averageRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  
  // Statistics
  statistics: {
    totalIssues: {
      type: Number,
      default: 0
    },
    currentIssues: {
      type: Number,
      default: 0
    },
    reservationCount: {
      type: Number,
      default: 0
    },
    popularityScore: {
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

// Library Transaction Schema (Issue/Return)
const libraryTransactionSchema = new mongoose.Schema({
  // Transaction Information
  transactionId: {
    type: String,
    required: [true, 'Transaction ID is required'],
    unique: true
  },
  type: {
    type: String,
    required: [true, 'Transaction type is required'],
    enum: ['issue', 'return', 'renew', 'reserve', 'cancel-reservation']
  },
  
  // Book and User Information
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: [true, 'Book is required']
  },
  copyNumber: {
    type: String,
    required: [true, 'Copy number is required']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  
  // Issue Details
  issueDate: {
    type: Date,
    required: function() { return this.type === 'issue' || this.type === 'renew'; }
  },
  dueDate: {
    type: Date,
    required: function() { return this.type === 'issue' || this.type === 'renew'; }
  },
  returnDate: {
    type: Date,
    required: function() { return this.type === 'return'; }
  },
  
  // Renewal Information
  renewalCount: {
    type: Number,
    default: 0,
    min: 0,
    max: 3
  },
  maxRenewals: {
    type: Number,
    default: 2,
    min: 0,
    max: 5
  },
  
  // Fine Information
  fine: {
    amount: {
      type: Number,
      default: 0,
      min: 0
    },
    reason: {
      type: String,
      enum: ['late-return', 'damage', 'loss', 'other']
    },
    isPaid: {
      type: Boolean,
      default: false
    },
    paidDate: Date,
    paidAmount: {
      type: Number,
      default: 0
    },
    waived: {
      type: Boolean,
      default: false
    },
    waivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    waivedReason: String
  },
  
  // Condition Information
  issueCondition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor'],
    default: 'good'
  },
  returnCondition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor', 'damaged', 'lost']
  },
  damageDescription: String,
  
  // Staff Information
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  returnedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'returned', 'overdue', 'lost', 'cancelled'],
    default: 'active'
  },
  
  // Remarks
  remarks: String,
  
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

// Library Member Schema
const libraryMemberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
    unique: true
  },
  
  // Membership Information
  membershipId: {
    type: String,
    required: [true, 'Membership ID is required'],
    unique: true
  },
  membershipType: {
    type: String,
    required: [true, 'Membership type is required'],
    enum: ['student', 'teacher', 'staff', 'parent', 'guest']
  },
  
  // Membership Validity
  validFrom: {
    type: Date,
    required: [true, 'Valid from date is required'],
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: [true, 'Valid until date is required']
  },
  
  // Issue Limits
  maxBooksAllowed: {
    type: Number,
    required: [true, 'Maximum books allowed is required'],
    min: 1,
    max: 20,
    default: 3
  },
  maxIssueDays: {
    type: Number,
    required: [true, 'Maximum issue days is required'],
    min: 1,
    max: 365,
    default: 14
  },
  maxRenewals: {
    type: Number,
    default: 2,
    min: 0,
    max: 5
  },
  
  // Current Status
  currentIssues: {
    type: Number,
    default: 0,
    min: 0
  },
  overdueBooks: {
    type: Number,
    default: 0,
    min: 0
  },
  reservedBooks: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Fine Information
  totalFine: {
    type: Number,
    default: 0,
    min: 0
  },
  paidFine: {
    type: Number,
    default: 0,
    min: 0
  },
  outstandingFine: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Statistics
  statistics: {
    totalBooksIssued: {
      type: Number,
      default: 0
    },
    totalBooksReturned: {
      type: Number,
      default: 0
    },
    averageReadingTime: {
      type: Number,
      default: 0 // in days
    },
    favoriteCategories: [String],
    lastIssueDate: Date,
    lastReturnDate: Date
  },
  
  // Preferences
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    smsNotifications: {
      type: Boolean,
      default: false
    },
    reminderDays: {
      type: Number,
      default: 2,
      min: 1,
      max: 7
    }
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isSuspended: {
    type: Boolean,
    default: false
  },
  suspensionReason: String,
  suspendedUntil: Date,
  
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
bookSchema.index({ title: 'text', 'authors.name': 'text' });
bookSchema.index({ accessionNumber: 1 });
bookSchema.index({ category: 1 });
bookSchema.index({ 'targetAudience.applicableClasses': 1 });
bookSchema.index({ isbn10: 1 });
bookSchema.index({ isbn13: 1 });

libraryTransactionSchema.index({ book: 1, user: 1 });
libraryTransactionSchema.index({ type: 1, status: 1 });
libraryTransactionSchema.index({ dueDate: 1 });
libraryTransactionSchema.index({ issueDate: 1 });

libraryMemberSchema.index({ user: 1 });
libraryMemberSchema.index({ membershipId: 1 });
libraryMemberSchema.index({ membershipType: 1 });

// Book Methods
bookSchema.methods.updateAvailability = function() {
  const availableCopies = this.copies.filter(copy => copy.status === 'available').length;
  const issuedCopies = this.copies.filter(copy => copy.status === 'issued').length;
  const damagedCopies = this.copies.filter(copy => copy.status === 'damaged').length;
  const lostCopies = this.copies.filter(copy => copy.status === 'lost').length;
  
  this.availableCopies = availableCopies;
  this.issuedCopies = issuedCopies;
  this.damagedCopies = damagedCopies;
  this.lostCopies = lostCopies;
  
  return this;
};

bookSchema.methods.calculateAverageRating = function() {
  if (this.reviews.length === 0) {
    this.averageRating = 0;
    return 0;
  }
  
  const total = this.reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
  this.averageRating = Math.round((total / this.reviews.length) * 10) / 10;
  return this.averageRating;
};

// Library Member Methods
libraryMemberSchema.methods.canIssueBook = function() {
  return this.isActive && 
         !this.isSuspended && 
         this.currentIssues < this.maxBooksAllowed &&
         this.outstandingFine === 0;
};

libraryMemberSchema.methods.calculateFine = function(daysOverdue, finePerDay = 2) {
  return Math.max(0, daysOverdue * finePerDay);
};

// Pre-save middlewares
bookSchema.pre('save', function(next) {
  this.updateAvailability();
  this.calculateAverageRating();
  next();
});

libraryMemberSchema.pre('save', function(next) {
  this.outstandingFine = this.totalFine - this.paidFine;
  next();
});

// Models
const Book = mongoose.model('Book', bookSchema);
const LibraryTransaction = mongoose.model('LibraryTransaction', libraryTransactionSchema);
const LibraryMember = mongoose.model('LibraryMember', libraryMemberSchema);

module.exports = {
  Book,
  LibraryTransaction,
  LibraryMember
};