const express = require('express');
const router = express.Router();
const multer = require('multer');
const s3Service = require('../services/s3Service');
const { extractTimetableFromImage } = require('../services/timetableService');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only PDF and image files
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and image files are allowed.'));
    }
  },
});

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Upload file to S3
    const uploadResult = await s3Service.uploadFile(req.file);

    // Business logic: Extract timetable from image using GPT-5 and store in SQLite
    let timetableJson = null;
    if (req.file.mimetype.startsWith('image/')) {
      try {
        timetableJson = await extractTimetableFromImage(req.file.buffer, uploadResult.fileId);
      } catch (err) {
        console.error('Timetable extraction error:', err);
      }
    }

    res.status(200).json({
      message: 'File uploaded successfully',
      uploadId: uploadResult.fileId,
      key: uploadResult.key,
      timetable: timetableJson,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Error uploading file' });
  }
});

router.get('/file/:key', async (req, res) => {
  try {
    const signedUrl = await s3Service.getSignedUrl(req.params.key);
    res.json({ url: signedUrl });
  } catch (error) {
    console.error('Error getting signed URL:', error);
    res.status(500).json({ error: 'Error generating file access URL' });
  }
});

module.exports = router;