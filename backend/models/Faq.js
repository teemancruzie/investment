const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, maxlength: 240 },
    answer: { type: String, required: true, maxlength: 2000 },
    category: { type: String, default: 'general' },
    isPublished: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Faq', faqSchema);
