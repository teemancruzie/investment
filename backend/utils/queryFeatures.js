/**
 * Shared list helper: pagination, sorting, projection and text search
 * applied to any Mongoose model with a single round-trip count.
 */
async function paginate(model, { filter = {}, page = 1, limit = 12, sort = '-createdAt', select, populate }) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 12));
  const skip = (safePage - 1) * safeLimit;

  let query = model.find(filter).sort(sort).skip(skip).limit(safeLimit);
  if (select) query = query.select(select);
  if (populate) query = query.populate(populate);

  const [items, total] = await Promise.all([query.lean(), model.countDocuments(filter)]);

  return {
    items,
    meta: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
      hasNext: safePage * safeLimit < total,
      hasPrev: safePage > 1,
    },
  };
}

/** Escapes user input before using it inside a RegExp. */
function escapeRegex(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { paginate, escapeRegex };
