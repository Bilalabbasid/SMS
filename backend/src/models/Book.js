const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Book title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  author: {
    type: String,
    required: [true, 'Author is required'],
    trim: true
  },
  isbn: {
    type: String,
    required: [true, 'ISBN is required'],
    unique: true,
    trim: true
  },
  publisher: {
    type: String,
    trim: true,
    default: ''
  },
  publicationYear: {
    type: Number,
    min: 1500,
    max: new Date().getFullYear() + 1
  },
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
  location: {
    type: String,
    trim: true,
    default: ''
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
    default: ''
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
bookSchema.index({ title: 'text', author: 'text' });
bookSchema.index({ isbn: 1 });
bookSchema.index({ category: 1 });
bookSchema.index({ availableCopies: 1 });

// Virtual for issued copies
bookSchema.virtual('issuedCopies').get(function() {
  return this.totalCopies - this.availableCopies;
});

// Virtual for availability status
bookSchema.virtual('isAvailable').get(function() {
  return this.availableCopies > 0;
});

// Pre-save middleware to ensure availableCopies doesn't exceed totalCopies
bookSchema.pre('save', function(next) {
  if (this.availableCopies > this.totalCopies) {
    this.availableCopies = this.totalCopies;
  }
  next();
});

module.exports = mongoose.models.Book || mongoose.model('Book', bookSchema);