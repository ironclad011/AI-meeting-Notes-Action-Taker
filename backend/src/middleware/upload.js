const multer = require('multer');

// Configure multer memory storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const isTxtExtension = file.originalname.toLowerCase().endsWith('.txt');
  const isTxtMime = file.mimetype === 'text/plain' || file.mimetype === 'text/octet-stream' || file.mimetype === 'application/octet-stream';

  if (isTxtExtension || isTxtMime) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only plain text (.txt) files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB cap
  },
  fileFilter,
}).single('file');

/**
 * Express middleware wrapper to catch Multer errors gracefully
 */
const uploadTranscriptMiddleware = (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: {
            message: 'File size exceeds maximum limit of 2MB.',
          },
        });
      }
      return res.status(400).json({
        success: false,
        error: {
          message: err.message || 'File upload error.',
        },
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        error: {
          message: err.message || 'Invalid file upload.',
        },
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Please provide a .txt transcript file to upload.',
        },
      });
    }

    next();
  });
};

module.exports = uploadTranscriptMiddleware;
