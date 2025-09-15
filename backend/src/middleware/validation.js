const { validationResult, body, param, query } = require('express-validator');

// Error formatter for validation results
const formatValidationErrors = (errors) => {
  return errors.map(error => ({
    field: error.param,
    message: error.msg,
    value: error.value
  }));
};

// Middleware to handle validation results
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formatValidationErrors(errors.array())
    });
  }
  
  next();
};

// Common validation rules
const commonValidations = {
  // User validations
  email: body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
    
  password: body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    
  phone: body('phone')
    .matches(/^[0-9+\-\s\(\)]+$/)
    .withMessage('Please provide a valid phone number'),
    
  name: (fieldName) => body(fieldName)
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage(`${fieldName} must be between 2 and 50 characters`)
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage(`${fieldName} must contain only letters and spaces`),
    
  // Date validations
  date: (fieldName) => body(fieldName)
    .isISO8601()
    .withMessage(`${fieldName} must be a valid date`)
    .toDate(),
    
  // Academic year validation
  academicYear: body('academicYear')
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in format YYYY-YYYY (e.g., 2023-2024)')
    .custom((value) => {
      const [startYear, endYear] = value.split('-').map(Number);
      if (endYear !== startYear + 1) {
        throw new Error('End year must be start year + 1');
      }
      return true;
    }),
    
  // ObjectId validation
  mongoId: (fieldName) => param(fieldName)
    .isMongoId()
    .withMessage(`${fieldName} must be a valid ID`),
    
  // Pagination
  page: query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
    
  limit: query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
    
  // Role validation
  role: body('role')
    .isIn(['admin', 'teacher', 'student', 'parent', 'accountant', 'librarian'])
    .withMessage('Invalid role specified'),
    
  // Gender validation
  gender: body('gender')
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other')
};

// Specific validation sets
const validationSets = {
  // User validations
  createUser: [
    commonValidations.name('firstName'),
    commonValidations.name('lastName'),
    commonValidations.email,
    commonValidations.password,
    commonValidations.phone,
    commonValidations.role,
    commonValidations.gender,
    commonValidations.date('dateOfBirth'),
    handleValidationErrors
  ],
  
  updateUser: [
    commonValidations.mongoId('id'),
    commonValidations.name('firstName').optional(),
    commonValidations.name('lastName').optional(),
    commonValidations.phone.optional(),
    commonValidations.gender.optional(),
    commonValidations.date('dateOfBirth').optional(),
    handleValidationErrors
  ],
  
  login: [
    commonValidations.email,
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 1 })
      .withMessage('Password is required'),
    handleValidationErrors
  ],
  
  // Student validations
  createStudent: [
    commonValidations.mongoId('user'),
    body('studentId')
      .trim()
      .isLength({ min: 4, max: 20 })
      .withMessage('Student ID must be between 4 and 20 characters'),
    body('rollNumber')
      .trim()
      .isLength({ min: 1, max: 10 })
      .withMessage('Roll number must be between 1 and 10 characters'),
    commonValidations.mongoId('class'),
    body('section')
      .trim()
      .isLength({ min: 1, max: 10 })
      .withMessage('Section must be between 1 and 10 characters'),
    commonValidations.academicYear,
    commonValidations.date('admissionDate'),
    body('admissionNumber')
      .trim()
      .isLength({ min: 4, max: 20 })
      .withMessage('Admission number must be between 4 and 20 characters'),
    handleValidationErrors
  ],
  
  // Teacher validations
  createTeacher: [
    commonValidations.mongoId('user'),
    body('employeeId')
      .trim()
      .isLength({ min: 4, max: 20 })
      .withMessage('Employee ID must be between 4 and 20 characters'),
    body('designation')
      .isIn([
        'Principal', 'Vice Principal', 'Head Teacher', 'Senior Teacher',
        'Teacher', 'Assistant Teacher', 'Subject Coordinator', 'Lab Assistant',
        'Sports Teacher', 'Music Teacher', 'Art Teacher', 'Librarian',
        'Counselor', 'Admin Staff'
      ])
      .withMessage('Invalid designation'),
    body('department')
      .isIn([
        'Mathematics', 'Science', 'English', 'Social Studies', 'Languages',
        'Computer Science', 'Physical Education', 'Arts', 'Music',
        'Administration', 'Library', 'Counseling'
      ])
      .withMessage('Invalid department'),
    commonValidations.date('joiningDate'),
    body('employmentType')
      .isIn(['permanent', 'contract', 'part-time', 'temporary', 'probation'])
      .withMessage('Invalid employment type'),
    body('salary.basicSalary')
      .isNumeric()
      .withMessage('Basic salary must be a number')
      .custom(value => value >= 0)
      .withMessage('Basic salary must be non-negative'),
    handleValidationErrors
  ],
  
  // Class validations
  createClass: [
    body('name')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Class name must be between 1 and 50 characters'),
    body('level')
      .isIn([
        'Nursery', 'LKG', 'UKG', 'Pre-K',
        '1st', '2nd', '3rd', '4th', '5th',
        '6th', '7th', '8th', '9th', '10th',
        '11th', '12th', 'Diploma', 'Graduate'
      ])
      .withMessage('Invalid class level'),
    body('grade')
      .isInt({ min: 0, max: 20 })
      .withMessage('Grade must be between 0 and 20'),
    commonValidations.academicYear,
    handleValidationErrors
  ],
  
  // Subject validations
  createSubject: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Subject name must be between 2 and 100 characters'),
    body('code')
      .trim()
      .isLength({ min: 2, max: 20 })
      .withMessage('Subject code must be between 2 and 20 characters')
      .matches(/^[A-Z0-9]+$/)
      .withMessage('Subject code must contain only uppercase letters and numbers'),
    body('category')
      .isIn([
        'Mathematics', 'Science', 'Language', 'Social Studies',
        'Computer Science', 'Arts', 'Physical Education', 'Music',
        'Vocational', 'Other'
      ])
      .withMessage('Invalid subject category'),
    body('type')
      .isIn(['core', 'optional', 'extra-curricular'])
      .withMessage('Subject type must be core, optional, or extra-curricular'),
    body('credits')
      .isInt({ min: 1, max: 10 })
      .withMessage('Credits must be between 1 and 10'),
    body('totalMarks')
      .isInt({ min: 50, max: 200 })
      .withMessage('Total marks must be between 50 and 200'),
    body('passingMarks')
      .isInt({ min: 30, max: 100 })
      .withMessage('Passing marks must be between 30 and 100'),
    commonValidations.academicYear,
    handleValidationErrors
  ],
  
  // Diary/Homework validations
  createDiary: [
    body('title')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Title must be between 5 and 200 characters'),
    body('description')
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Description must be between 10 and 2000 characters'),
    body('type')
      .isIn(['homework', 'assignment', 'project', 'study-material', 'announcement', 'note'])
      .withMessage('Invalid diary type'),
    body('priority')
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Priority must be low, medium, high, or urgent'),
    commonValidations.mongoId('class'),
    body('section')
      .trim()
      .isLength({ min: 1, max: 10 })
      .withMessage('Section is required'),
    commonValidations.mongoId('subject'),
    commonValidations.mongoId('teacher'),
    commonValidations.date('dueDate'),
    body('content.instructions')
      .trim()
      .isLength({ min: 10, max: 3000 })
      .withMessage('Instructions must be between 10 and 3000 characters'),
    handleValidationErrors
  ],
  
  // Attendance validations
  markAttendance: [
    commonValidations.date('date'),
    commonValidations.mongoId('class'),
    body('section')
      .trim()
      .isLength({ min: 1, max: 10 })
      .withMessage('Section is required'),
    body('studentAttendance')
      .isArray({ min: 1 })
      .withMessage('Student attendance array is required'),
    body('studentAttendance.*.student')
      .isMongoId()
      .withMessage('Valid student ID is required'),
    body('studentAttendance.*.status')
      .isIn(['present', 'absent', 'late', 'half-day', 'excused'])
      .withMessage('Invalid attendance status'),
    commonValidations.mongoId('markedBy'),
    body('type')
      .isIn(['daily', 'period-wise', 'activity', 'exam'])
      .withMessage('Invalid attendance type'),
    handleValidationErrors
  ],
  
  // Exam validations
  createExam: [
    body('name')
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Exam name must be between 3 and 100 characters'),
    body('type')
      .isIn([
        'unit-test', 'mid-term', 'final-term', 'quarterly', 'half-yearly',
        'annual', 'practical', 'oral', 'assignment', 'project', 'internal',
        'board-exam', 'entrance-exam'
      ])
      .withMessage('Invalid exam type'),
    body('category')
      .isIn(['formative', 'summative', 'diagnostic', 'benchmark'])
      .withMessage('Invalid exam category'),
    commonValidations.academicYear,
    body('term')
      .isIn(['1st-term', '2nd-term', '3rd-term', 'annual'])
      .withMessage('Invalid term'),
    commonValidations.date('registrationStart'),
    commonValidations.date('registrationEnd'),
    commonValidations.date('examStartDate'),
    commonValidations.date('examEndDate'),
    handleValidationErrors
  ],
  
  // Fee validations
  createFeeStructure: [
    body('name')
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Fee structure name must be between 3 and 100 characters'),
    commonValidations.academicYear,
    body('feeComponents')
      .isArray({ min: 1 })
      .withMessage('At least one fee component is required'),
    body('feeComponents.*.name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Fee component name must be between 2 and 50 characters'),
    body('feeComponents.*.type')
      .isIn([
        'tuition', 'admission', 'development', 'library', 'laboratory',
        'sports', 'transport', 'examination', 'activity', 'miscellaneous',
        'hostel', 'mess', 'uniform', 'books', 'stationery', 'insurance',
        'security-deposit', 'caution-money'
      ])
      .withMessage('Invalid fee component type'),
    body('feeComponents.*.amount')
      .isNumeric()
      .withMessage('Fee amount must be a number')
      .custom(value => value >= 0)
      .withMessage('Fee amount must be non-negative'),
    body('feeComponents.*.frequency')
      .isIn(['monthly', 'quarterly', 'half-yearly', 'yearly', 'one-time'])
      .withMessage('Invalid payment frequency'),
    handleValidationErrors
  ],
  
  // Library validations
  createBook: [
    body('title')
      .trim()
      .isLength({ min: 2, max: 200 })
      .withMessage('Book title must be between 2 and 200 characters'),
    body('authors')
      .isArray({ min: 1 })
      .withMessage('At least one author is required'),
    body('authors.*.name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Author name must be between 2 and 100 characters'),
    body('publisher.name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Publisher name must be between 2 and 100 characters'),
    body('publicationYear')
      .isInt({ min: 1500, max: new Date().getFullYear() + 1 })
      .withMessage('Invalid publication year'),
    body('category')
      .isIn([
        'Fiction', 'Non-Fiction', 'Science', 'Mathematics', 'History',
        'Geography', 'Literature', 'Language', 'Arts', 'Music',
        'Sports', 'Technology', 'Philosophy', 'Religion', 'Biography',
        'Reference', 'Textbook', 'Workbook', 'Encyclopedia', 'Dictionary',
        'Children', 'Young Adult', 'Academic', 'Professional', 'Other'
      ])
      .withMessage('Invalid book category'),
    body('accessionNumber')
      .trim()
      .isLength({ min: 4, max: 20 })
      .withMessage('Accession number must be between 4 and 20 characters'),
    body('totalCopies')
      .isInt({ min: 1 })
      .withMessage('Total copies must be at least 1'),
    handleValidationErrors
  ],
  
  // Transport validations
  createRoute: [
    body('routeName')
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Route name must be between 3 and 100 characters'),
    body('routeNumber')
      .trim()
      .isLength({ min: 2, max: 20 })
      .withMessage('Route number must be between 2 and 20 characters'),
    body('startingPoint.name')
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Starting point name must be between 3 and 100 characters'),
    body('endingPoint.name')
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Ending point name must be between 3 and 100 characters'),
    body('totalDistance')
      .isNumeric()
      .withMessage('Total distance must be a number')
      .custom(value => value >= 1)
      .withMessage('Total distance must be at least 1 km'),
    body('estimatedTime')
      .isInt({ min: 10 })
      .withMessage('Estimated time must be at least 10 minutes'),
    handleValidationErrors
  ],
  
  // General validations
  mongoIdParam: [
    commonValidations.mongoId('id'),
    handleValidationErrors
  ],
  
  pagination: [
    commonValidations.page,
    commonValidations.limit,
    handleValidationErrors
  ]
};

module.exports = {
  handleValidationErrors,
  commonValidations,
  validationSets
};