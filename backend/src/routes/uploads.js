const express = require('express');
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');
const crypto = require('crypto');
const path = require('path');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Supported upload types and their allowed mime types and bucket names
const uploadTypeMap = {
  avatar: { bucketName: 'avatars', fieldName: 'avatar', maxCount: 1 },
  homework: { bucketName: 'homework', fieldName: 'files', maxCount: 10 },
  library: { bucketName: 'library', fieldName: 'file', maxCount: 1 },
  document: { bucketName: 'documents', fieldName: 'document', maxCount: 5 },
  general: { bucketName: 'general', fieldName: 'file', maxCount: 5 }
};

// Create a multer-gridfs-storage instance per upload type
const createStorage = (uploadType) => {
  const options = uploadTypeMap[uploadType] || uploadTypeMap.general;

  const storage = new GridFsStorage({
    url: process.env.MONGO_URI || process.env.MONGODB_URI,
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        // Generate a unique filename
        crypto.randomBytes(16, (err, buf) => {
          if (err) return reject(err);
          const ext = path.extname(file.originalname);
          const filename = `${Date.now()}-${buf.toString('hex')}${ext}`;

          const fileInfo = {
            filename,
            bucketName: options.bucketName,
            metadata: {
              uploadedBy: req.user ? req.user.id : null,
              originalName: file.originalname,
              uploadType,
              fieldName: file.fieldname
            }
          };
          resolve(fileInfo);
        });
      });
    }
  });

  return storage;
};

// Middleware to get a multer instance for a given upload type
const uploadMiddlewareForType = (type) => {
  const storage = createStorage(type);
  const upload = multer({ storage });
  const cfg = uploadTypeMap[type] || uploadTypeMap.general;
  return cfg.maxCount === 1 ? upload.single(cfg.fieldName) : upload.array(cfg.fieldName, cfg.maxCount);
};

// POST /api/uploads/:type
// Upload files to GridFS (authenticated)
router.post('/:type', authenticate, async (req, res, next) => {
  try {
    const { type } = req.params;
    if (!uploadTypeMap[type]) {
      return res.status(400).json({ success: false, message: 'Invalid upload type' });
    }

    const middleware = uploadMiddlewareForType(type);

    middleware(req, res, function (err) {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      // Normalize file info
      const files = [];
      if (req.file) {
        const f = req.file;
        files.push({ id: f.id, filename: f.filename, originalName: f.metadata && f.metadata.originalName, contentType: f.contentType });
      }
      if (req.files && req.files.length) {
        req.files.forEach(f => files.push({ id: f.id, filename: f.filename, originalName: f.metadata && f.metadata.originalName, contentType: f.contentType }));
      }

      if (files.length === 0) {
        return res.status(400).json({ success: false, message: 'No files uploaded' });
      }

      res.status(201).json({ success: true, message: 'Files uploaded', data: files });
    });
  } catch (error) {
    next(error);
  }
});

// Helper to get GridFSBucket
const getBucket = (bucketName) => {
  const conn = mongoose.connection.db;
  return new mongoose.mongo.GridFSBucket(conn, { bucketName });
};

// GET /api/uploads/file/:id - stream by file id
router.get('/file/:id', authenticate, async (req, res) => {
  try {
    const fileId = req.params.id;
    if (!ObjectId.isValid(fileId)) {
      return res.status(400).json({ success: false, message: 'Invalid file id' });
    }

    // Find file in any bucket by searching collections
    const db = mongoose.connection.db;
    // Collections for buckets end with .files - search common buckets
    const buckets = Object.keys(uploadTypeMap).map(k => uploadTypeMap[k].bucketName);

    let fileDoc = null;
    let bucketName = null;
    for (const b of buckets) {
      const doc = await db.collection(`${b}.files`).findOne({ _id: new ObjectId(fileId) });
      if (doc) {
        fileDoc = doc;
        bucketName = b;
        break;
      }
    }

    if (!fileDoc) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const bucket = getBucket(bucketName);
    res.set('Content-Type', fileDoc.contentType || 'application/octet-stream');
    res.set('Content-Disposition', `attachment; filename="${fileDoc.filename}"`);

    const downloadStream = bucket.openDownloadStream(new ObjectId(fileId));
    downloadStream.on('error', (err) => {
      console.error('GridFS stream error', err);
      res.status(500).end();
    });
    downloadStream.pipe(res);
  } catch (error) {
    console.error('Download error', error);
    res.status(500).json({ success: false, message: 'Failed to download file' });
  }
});

// GET /api/uploads/filename/:bucket/:filename - stream by filename from a bucket
router.get('/filename/:bucket/:filename', authenticate, async (req, res) => {
  try {
    const { bucket, filename } = req.params;
    if (!bucket) return res.status(400).json({ success: false, message: 'Bucket is required' });

    const bucketName = bucket;
    const db = mongoose.connection.db;
    const fileDoc = await db.collection(`${bucketName}.files`).findOne({ filename });
    if (!fileDoc) return res.status(404).json({ success: false, message: 'File not found' });

    const bucketObj = getBucket(bucketName);
    res.set('Content-Type', fileDoc.contentType || 'application/octet-stream');
    res.set('Content-Disposition', `attachment; filename="${fileDoc.filename}"`);
    bucketObj.openDownloadStream(fileDoc._id).pipe(res);
  } catch (error) {
    console.error('Download by filename error', error);
    res.status(500).json({ success: false, message: 'Failed to download file' });
  }
});

// DELETE /api/uploads/file/:id - delete file from GridFS
router.delete('/file/:id', authenticate, async (req, res) => {
  try {
    const fileId = req.params.id;
    if (!ObjectId.isValid(fileId)) {
      return res.status(400).json({ success: false, message: 'Invalid file id' });
    }

    const db = mongoose.connection.db;
    const buckets = Object.keys(uploadTypeMap).map(k => uploadTypeMap[k].bucketName);

    let bucketName = null;
    for (const b of buckets) {
      const doc = await db.collection(`${b}.files`).findOne({ _id: new ObjectId(fileId) });
      if (doc) {
        bucketName = b;
        break;
      }
    }

    if (!bucketName) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const bucket = getBucket(bucketName);
    bucket.delete(new ObjectId(fileId), (err) => {
      if (err) {
        console.error('GridFS delete error', err);
        return res.status(500).json({ success: false, message: 'Failed to delete file' });
      }
      res.status(200).json({ success: true, message: 'File deleted' });
    });
  } catch (error) {
    console.error('Delete file error', error);
    res.status(500).json({ success: false, message: 'Failed to delete file' });
  }
});

module.exports = router;
