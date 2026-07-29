const mongoose = require('mongoose');

const pdfSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    isFree: { type: Boolean, default: false },
    filePath: { type: String, required: true },
    fileId: { type: String }, // For ImageKit
    category: { type: String },
    semester: { type: String },
}, { timestamps: true });

const PDF = mongoose.model('PDF', pdfSchema);
module.exports = PDF;
