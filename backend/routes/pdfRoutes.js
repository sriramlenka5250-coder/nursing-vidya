const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, admin } = require('../middleware/authMiddleware');
const { getPdfs, uploadPdf, downloadPdf, deletePdf } = require('../controllers/pdf.controller');

// Multer Storage for PDFs (Memory Storage for ImageKit upload)
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    fileFilter: function (req, file, cb) {
        if (path.extname(file.originalname).toLowerCase() !== '.pdf') {
            return cb(new Error('Only PDFs are allowed'));
        }
        cb(null, true);
    },
});

// @desc    Get all PDFs (Public info)
// @route   GET /api/pdfs
// @access  Public
router.get('/', getPdfs);

// @desc    Upload PDF
// @route   POST /api/pdfs
// @access  Admin
router.post('/', protect, admin, upload.single('pdf'), uploadPdf);

// @desc    Download PDF
// @route   GET /api/pdfs/download/:id
// @access  Private (Paid)
router.get('/download/:id', protect, downloadPdf);

// @desc    Delete PDF
// @route   DELETE /api/pdfs/:id
// @access  Admin
router.delete('/:id', protect, admin, deletePdf);

module.exports = router;
