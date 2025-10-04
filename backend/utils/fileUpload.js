const multer = require('multer');
const path = require('path');
const { ErrorResponse } = require('../middleware/errorHandler');
const fs = require('fs');

// Storage: Save files temporarily in /tmp/uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../tmp/uploads');
        // Ensure directory exists
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;

    const extname = allowedTypes.test(
        path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        cb(null, true);
    } else {
        cb(new ErrorResponse('Only image files are allowed (jpeg, jpg, png, webp)', 400));
    }
};

// Multer config
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB per file
        files: 5
    },
    fileFilter: fileFilter
});

module.exports = upload;
