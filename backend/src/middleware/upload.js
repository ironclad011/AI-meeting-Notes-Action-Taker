const multer = require('multer');

// Configure multer memory storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const name = file.originalname.toLowerCase();
  const isTxt = name.endsWith('.txt');
  const isPdf = name.endsWith('.pdf');
  const isDocx = name.endsWith('.docx');

  if (isTxt || isPdf || isDocx) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only .txt, .pdf, and .docx files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB cap for PDF/DOCX
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
            message: 'File size exceeds maximum limit of 5MB.',
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
          message: 'Please provide a .txt, .pdf, or .docx transcript file to upload.',
        },
      });
    }

    next();
  });
};

module.exports = uploadTranscriptMiddleware;
