const path = require('path');
const fs = require('fs');
const PDF = require('../models/PDF');
const Order = require('../models/Order');
const ImageKit = require("imagekit");

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

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

        if (!req.file) {
            return res.status(400).json({ message: 'No PDF file provided' });
        }

        const uploadResponse = await imagekit.upload({
            file: req.file.buffer, // memory buffer
            fileName: `${Date.now()}_${req.file.originalname}`,
            folder: "/pdfs"
        });

        const pdf = new PDF({
            title,
            description,
            price: Number(price),
            isFree: isFree === 'true' || isFree === true,
            filePath: uploadResponse.url,
            fileId: uploadResponse.fileId,
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

        // If it's a cloud URL (ImageKit), fetch it and stream to client
        if (pdf.filePath.startsWith('http')) {
            const https = require('https');
            
            res.setHeader('Content-Disposition', `attachment; filename="${pdf.title}.pdf"`);
            res.setHeader('Content-Type', 'application/pdf');
            
            https.get(pdf.filePath, (stream) => {
                stream.pipe(res);
            }).on('error', (err) => {
                res.status(500).json({ message: 'Error downloading file from cloud' });
            });
            return;
        }

        const fileName = path.basename(pdf.filePath.replace(/\\/g, '/'));
        const localFilePath = path.join(__dirname, '../uploads/pdfs', fileName);
        if (fs.existsSync(localFilePath)) {
            res.download(localFilePath);
        } else {
            console.error(`File not found: DB path was ${pdf.filePath}, constructed path was ${localFilePath}`);
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
            if (pdf.fileId) {
                // Delete from ImageKit
                await imagekit.deleteFile(pdf.fileId);
            } else if (!pdf.filePath.startsWith('http')) {
                // Delete local file
                const fileName = path.basename(pdf.filePath.replace(/\\/g, '/'));
                const localFilePath = path.join(__dirname, '../uploads/pdfs', fileName);
                if (fs.existsSync(localFilePath)) {
                    fs.unlinkSync(localFilePath);
                }
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
