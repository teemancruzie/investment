const mongoose = require('mongoose');
const slugify = require('slugify');

const investmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    slug: { type: String, unique: true, index: true },
    summary: { type: String, default: '', maxlength: 280 },
    description: { type: String, required: true },
    image: { type: String, default: '' },
    gallery: [{ type: String }],
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    expectedAnnualReturn: { type: Number, required: true, min: 0, max: 200 },
    durationMonths: { type: Number, required: true, min: 1 },
    minimumInvestment: { type: Number, required: true, min: 0 },
    fundingGoal: { type: Number, required: true, min: 1 },
    fundedAmount: { type: Number, default: 0, min: 0 },
    totalUnits: { type: Number, required: true, min: 1 },
    unitsSold: { type: Number, default: 0, min: 0 },
    riskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'medium', index: true },
    status: { type: String, enum: ['draft', 'active', 'funded', 'closed', 'archived'], default: 'draft', index: true },
    isFeatured: { type: Boolean, default: false },
    location: { type: String, default: '' },
    startDate: { type: Date },
    endDate: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

investmentSchema.index({ title: 'text', summary: 'text', description: 'text' });
investmentSchema.index({ status: 1, category: 1, expectedAnnualReturn: -1 });

investmentSchema.virtual('availableUnits').get(function availableUnits() {
  return Math.max(0, this.totalUnits - this.unitsSold);
});

investmentSchema.virtual('fundingProgress').get(function fundingProgress() {
  if (!this.fundingGoal) return 0;
  return Math.min(100, Number(((this.fundedAmount / this.fundingGoal) * 100).toFixed(2)));
});

investmentSchema.pre('validate', function setSlug(next) {
  if (this.isModified('title')) {
    this.slug = `${slugify(this.title, { lower: true, strict: true })}-${Date.now().toString(36)}`;
  }
  next();
});

module.exports = mongoose.model('Investment', investmentSchema);
