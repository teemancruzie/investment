const Testimonial = require('../models/Testimonial');
const Faq = require('../models/Faq');
const TeamMember = require('../models/TeamMember');
const Setting = require('../models/Setting');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/ApiResponse');

/** Generic CRUD factory shared by testimonials, FAQs and team members. */
function crudFor(Model, label) {
  return {
    list: asyncHandler(async (req, res) => {
      const filter = req.query.all === 'true' ? {} : { isPublished: true };
      const items = await Model.find(filter).sort('order createdAt').lean();
      return sendSuccess(res, { message: label, data: items.map((i) => ({ ...i, id: i._id })) });
    }),
    create: asyncHandler(async (req, res) => {
      const item = await Model.create(req.body);
      return sendSuccess(res, { statusCode: 201, message: `${label} created`, data: item });
    }),
    update: asyncHandler(async (req, res) => {
      const item = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!item) throw ApiError.notFound(`${label} not found`);
      return sendSuccess(res, { message: `${label} updated`, data: item });
    }),
    remove: asyncHandler(async (req, res) => {
      const item = await Model.findByIdAndDelete(req.params.id);
      if (!item) throw ApiError.notFound(`${label} not found`);
      return sendSuccess(res, { message: `${label} deleted`, data: null });
    }),
  };
}

const testimonials = crudFor(Testimonial, 'Testimonial');
const faqs = crudFor(Faq, 'FAQ');
const team = crudFor(TeamMember, 'Team member');

const getSettings = asyncHandler(async (req, res) => {
  const filter = req.query.group ? { group: req.query.group } : {};
  const settings = await Setting.find(filter).lean();
  const data = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  return sendSuccess(res, { message: 'Settings', data });
});

const upsertSettings = asyncHandler(async (req, res) => {
  const { group = 'general', values = {} } = req.body;
  const ops = Object.entries(values).map(([key, value]) =>
    Setting.findOneAndUpdate({ key }, { key, group, value }, { upsert: true, new: true })
  );
  await Promise.all(ops);
  return sendSuccess(res, { message: 'Settings saved', data: values });
});

module.exports = { testimonials, faqs, team, getSettings, upsertSettings };
