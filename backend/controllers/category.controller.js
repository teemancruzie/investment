const Category = require('../models/Category');
const Investment = require('../models/Investment');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/ApiResponse');

const listCategories = asyncHandler(async (req, res) => {
  const filter = req.query.all === 'true' ? {} : { isActive: true };
  const categories = await Category.find(filter).sort('order name').lean();
  const counts = await Investment.aggregate([
    { $match: { status: { $in: ['active', 'funded'] } } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));
  return sendSuccess(res, {
    message: 'Categories',
    data: categories.map((c) => ({ ...c, id: c._id, investmentCount: countMap[String(c._id)] || 0 })),
  });
});

const createCategory = asyncHandler(async (req, res) => {
  const category = await Category.create(req.body);
  return sendSuccess(res, { statusCode: 201, message: 'Category created', data: category });
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw ApiError.notFound('Category not found');
  Object.assign(category, req.body);
  await category.save();
  return sendSuccess(res, { message: 'Category updated', data: category });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const inUse = await Investment.countDocuments({ category: req.params.id });
  if (inUse) throw ApiError.conflict('Category is used by existing investments');
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw ApiError.notFound('Category not found');
  return sendSuccess(res, { message: 'Category deleted', data: null });
});

module.exports = { listCategories, createCategory, updateCategory, deleteCategory };
