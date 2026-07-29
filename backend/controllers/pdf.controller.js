const path = require('path');
const fs = require('fs');
const PDF = require('../models/PDF');
const Order = require('../models/Order');

// @desc    Get all PDFs (Public info)
// @route   GET /api/pdfs
// @access  Public
const getPdfs = async (req, res) => {
    try {
        const pdfs = await PDF.find({}).sort({ createdAt: -1 });
        // Don't send filePath to public
        const publicPdfs = pdfs.map(pdf => ({
            _id: pdf._id,
            title: pdf.title,
            description: pdf.description,
            price: pdf.price,
            isFree: pdf.isFree,
            category: pdf.category,
            semester: pdf.semester,
            createdAt: pdf.createdAt
        }));
        res.json(publicPdfs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Upload PDF
// @route   POST /api/pdfs
// @access  Admin
const uploadPdf = async (req, res) => {
    try {
        const { title, description, price, isFree, category, semester } = req.body;

        const pdf = new PDF({
            title,
            description,
            price: Number(price),
            isFree: isFree === 'true' || isFree === true,
            filePath: req.file.path,
            category,
            semester
        });

        const createdPdf = await pdf.save();
        res.status(201).json(createdPdf);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Download PDF
// @route   GET /api/pdfs/download/:id
// @access  Private (Paid)
const downloadPdf = async (req, res) => {
    try {
        const pdf = await PDF.findById(req.params.id);
        if (!pdf) {
            return res.status(404).json({ message: 'PDF not found' });
        }

        // Check if user is admin or purchased
        if (req.user.role !== 'admin') {
            const order = await Order.findOne({
                userId: req.user._id,
                pdfId: pdf._id,
                status: 'approved'
            });

            if (!order) {
                return res.status(403).json({ message: 'Not authorized. Please purchase this note.' });
            }
        }

        const fileName = path.basename(pdf.filePath.replace(/\\/g, '/'));
        const filePath = path.join(__dirname, '../uploads/pdfs', fileName);
        if (fs.existsSync(filePath)) {
            res.download(filePath);
        } else {
            console.error(`File not found: DB path was ${pdf.filePath}, constructed path was ${filePath}`);
            res.status(404).json({ message: 'File not found on server' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete PDF
// @route   DELETE /api/pdfs/:id
// @access  Admin
const deletePdf = async (req, res) => {
    try {
        const pdf = await PDF.findById(req.params.id);
        if (pdf) {
            const fileName = path.basename(pdf.filePath.replace(/\\/g, '/'));
            const filePath = path.join(__dirname, '../uploads/pdfs', fileName);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            await pdf.deleteOne();
            res.json({ message: 'PDF removed' });
        } else {
            res.status(404).json({ message: 'PDF not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getPdfs,
    uploadPdf,
    downloadPdf,
    deletePdf
};
