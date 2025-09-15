const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for different types of file uploads
const createMulterConfig = (uploadPath, allowedTypes, maxSize = 10 * 1024 * 1024) => {
  // Ensure upload directory exists
  const fullUploadPath = path.join(__dirname, '../../uploads', uploadPath);
  if (!fs.existsSync(fullUploadPath)) {
    fs.mkdirSync(fullUploadPath, { recursive: true });
  }

  // Storage configuration
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, fullUploadPath);
    },
    filename: (req, file, cb) => {
      // Generate unique filename: timestamp_userId_originalname
      const userId = req.user ? req.user._id : 'anonymous';
      const timestamp = Date.now();
      const extension = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, extension);
      
      // Sanitize filename
      const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
      const uniqueFilename = `${timestamp}_${userId}_${sanitizedBaseName}${extension}`;
      
      cb(null, uniqueFilename);
    }
  });

  // File filter
  const fileFilter = (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`), false);
    }
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: maxSize
    }
  });
};

// Predefined configurations for different upload types
const uploadConfigs = {
  // Profile pictures
  avatar: createMulterConfig('avatars', [
    'image/jpeg',
    'image/png',
    'image/gif'
  ], 5 * 1024 * 1024), // 5MB

  // Homework and assignment files
  homework: createMulterConfig('homework', [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
  ], 10 * 1024 * 1024), // 10MB

  // Library books and documents
  library: createMulterConfig('library', [
    'application/pdf',
    'application/epub+zip',
    'application/x-mobipocket-ebook',
    'image/jpeg',
    'image/png'
  ], 50 * 1024 * 1024), // 50MB

  // Student documents
  documents: createMulterConfig('documents', [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ], 10 * 1024 * 1024), // 10MB

  // General files
  general: createMulterConfig('general', [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ], 20 * 1024 * 1024) // 20MB
};

// Middleware factory function
const createUploadMiddleware = (configName, fieldName = 'file', multiple = false) => {
  if (!uploadConfigs[configName]) {
    throw new Error(`Upload configuration '${configName}' not found`);
  }

  const upload = uploadConfigs[configName];

  if (multiple) {
    return upload.array(fieldName, 10); // Max 10 files
  } else {
    return upload.single(fieldName);
  }
};

// Error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Please choose a smaller file.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum allowed files exceeded.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name for file upload.'
      });
    }
  }

  if (error.message && error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  next(error);
};

// File validation middleware
const validateFileUpload = (req, res, next) => {
  if (!req.file && !req.files) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  // Add file information to request
  if (req.file) {
    req.uploadedFile = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    };
  }

  if (req.files && req.files.length > 0) {
    req.uploadedFiles = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path
    }));
  }

  next();
};

// Clean up temporary files on error
const cleanupFiles = (req, res, next) => {
  const cleanup = () => {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
  };

  // Override res.status to catch errors
  const originalStatus = res.status;
  res.status = function(code) {
    if (code >= 400) {
      cleanup();
    }
    return originalStatus.call(this, code);
  };

  next();
};

// Get file URL helper
const getFileUrl = (filename, uploadType = 'general') => {
  if (!filename) return null;
  return `/uploads/${uploadType}/${filename}`;
};

// Delete file helper
const deleteFile = async (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

module.exports = {
  createUploadMiddleware,
  handleUploadError,
  validateFileUpload,
  cleanupFiles,
  getFileUrl,
  deleteFile,
  
  // Direct access to specific configs
  uploadAvatar: createUploadMiddleware('avatar', 'avatar'),
  uploadHomework: createUploadMiddleware('homework', 'files', true),
  uploadDocument: createUploadMiddleware('documents', 'document'),
  uploadLibraryFile: createUploadMiddleware('library', 'file'),
  uploadGeneral: createUploadMiddleware('general', 'file')
};