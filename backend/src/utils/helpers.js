const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Create pagination object
const createPagination = (page, limit, total) => {
  const currentPage = parseInt(page);
  const pageSize = parseInt(limit);
  const totalPages = Math.ceil(total / pageSize);
  
  return {
    currentPage,
    totalPages,
    pageSize,
    totalRecords: total,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    nextPage: currentPage < totalPages ? currentPage + 1 : null,
    previousPage: currentPage > 1 ? currentPage - 1 : null,
    startRecord: (currentPage - 1) * pageSize + 1,
    endRecord: Math.min(currentPage * pageSize, total)
  };
};

// Generate random string
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Generate OTP
const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

// Generate unique ID
const generateUniqueId = (prefix = '') => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${prefix}${timestamp}${randomStr}`.toUpperCase();
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number
const isValidPhone = (phone) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone);
};

// Format date to readable string
const formatDate = (date, format = 'dd/mm/yyyy') => {
  if (!date) return '';
  
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  switch (format) {
    case 'dd/mm/yyyy':
      return `${day}/${month}/${year}`;
    case 'mm/dd/yyyy':
      return `${month}/${day}/${year}`;
    case 'yyyy-mm-dd':
      return `${year}-${month}-${day}`;
    default:
      return d.toLocaleDateString();
  }
};

// Calculate age from date of birth
const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

// Sanitize input string
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/[&]/g, '&amp;')
    .replace(/["]/g, '&quot;')
    .replace(/[']/g, '&#x27;');
};

// Generate slug from string
const generateSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Check if date is in range
const isDateInRange = (date, startDate, endDate) => {
  const checkDate = new Date(date);
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return checkDate >= start && checkDate <= end;
};

// Get academic year from date
const getAcademicYear = (date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // JavaScript months are 0-indexed
  
  // Assuming academic year starts in April
  if (month >= 4) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
};

// Generate password hash
const generatePasswordHash = async (password) => {
  const bcrypt = require('bcrypt');
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Compare password with hash
const comparePassword = async (password, hash) => {
  const bcrypt = require('bcrypt');
  return await bcrypt.compare(password, hash);
};

// Generate JWT token
const generateToken = (payload, expiresIn = '24h') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Create email transporter
const createEmailTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Send email
const sendEmail = async (to, subject, html, attachments = []) => {
  try {
    const transporter = createEmailTransporter();
    
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
      attachments
    };
    
    const result = await transporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Send email error:', error);
    return { success: false, error: error.message };
  }
};

// Format currency
const formatCurrency = (amount, currency = 'PKR', locale = 'en-PK') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(amount);
};

// Validate Pakistani CNIC
const isValidCNIC = (cnic) => {
  const cnicRegex = /^[0-9]{5}-[0-9]{7}-[0-9]$/;
  return cnicRegex.test(cnic);
};

// Generate roll number
const generateRollNumber = (classGrade, year, sequence) => {
  const yearSuffix = year.toString().slice(-2);
  const gradeFormatted = String(classGrade).padStart(2, '0');
  const sequenceFormatted = String(sequence).padStart(3, '0');
  
  return `${yearSuffix}${gradeFormatted}${sequenceFormatted}`;
};

// File upload helpers
const getAllowedFileTypes = (category) => {
  const fileTypes = {
    image: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    document: ['pdf', 'doc', 'docx', 'txt', 'rtf'],
    spreadsheet: ['xls', 'xlsx', 'csv'],
    archive: ['zip', 'rar', '7z'],
    video: ['mp4', 'avi', 'mkv', 'mov'],
    audio: ['mp3', 'wav', 'aac']
  };
  
  return fileTypes[category] || [];
};

const getFileExtension = (filename) => {
  return filename.split('.').pop().toLowerCase();
};

const isFileTypeAllowed = (filename, allowedTypes) => {
  const extension = getFileExtension(filename);
  return allowedTypes.includes(extension);
};

// Database query helpers
const buildSortObject = (sortBy, sortOrder = 'asc') => {
  const order = sortOrder.toLowerCase() === 'desc' ? -1 : 1;
  return { [sortBy]: order };
};

const buildSearchRegex = (searchTerm, fields = []) => {
  const regex = new RegExp(searchTerm, 'i');
  return fields.map(field => ({ [field]: regex }));
};

// Date range helpers
const getDateRanges = () => {
  const now = new Date();
  
  return {
    today: {
      start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
    },
    thisWeek: {
      start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()),
      end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + (6 - now.getDay()), 23, 59, 59)
    },
    thisMonth: {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    },
    thisYear: {
      start: new Date(now.getFullYear(), 0, 1),
      end: new Date(now.getFullYear(), 11, 31, 23, 59, 59)
    }
  };
};

// Validation helpers
const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${fieldName} is required`;
  }
  return null;
};

const validateMinLength = (value, minLength, fieldName) => {
  if (value && value.length < minLength) {
    return `${fieldName} must be at least ${minLength} characters long`;
  }
  return null;
};

const validateMaxLength = (value, maxLength, fieldName) => {
  if (value && value.length > maxLength) {
    return `${fieldName} must not exceed ${maxLength} characters`;
  }
  return null;
};

// Error handling helpers
const createAPIResponse = (success, message, data = null, errors = null) => {
  const response = {
    success,
    message,
    timestamp: new Date().toISOString()
  };
  
  if (data !== null) response.data = data;
  if (errors !== null) response.errors = errors;
  
  return response;
};

const createErrorResponse = (message, statusCode = 500, errors = null) => {
  return {
    statusCode,
    response: createAPIResponse(false, message, null, errors)
  };
};

// Export all utilities
module.exports = {
  // Pagination
  createPagination,
  
  // String generators
  generateRandomString,
  generateOTP,
  generateUniqueId,
  generateSlug,
  generateRollNumber,
  
  // Validation
  isValidEmail,
  isValidPhone,
  isValidCNIC,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  
  // Date and time
  formatDate,
  calculateAge,
  isDateInRange,
  getAcademicYear,
  getDateRanges,
  
  // Security
  generatePasswordHash,
  comparePassword,
  generateToken,
  verifyToken,
  sanitizeInput,
  
  // Email
  createEmailTransporter,
  sendEmail,
  
  // File handling
  getAllowedFileTypes,
  getFileExtension,
  isFileTypeAllowed,
  
  // Database
  buildSortObject,
  buildSearchRegex,
  
  // Formatting
  formatCurrency,
  
  // API responses
  createAPIResponse,
  createErrorResponse
};