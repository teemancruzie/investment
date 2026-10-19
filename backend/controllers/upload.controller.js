const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/ApiResponse');
const { toPublicPath } = require('../middleware/upload');

/** Returns the public URL of a single uploaded file. */
const uploadSingle = (folder) =>
  asyncHandler(async (req, res) => {
    if (!req.file) throw ApiError.badRequest('No file uploaded');
    return sendSuccess(res, {
      statusCode: 201,
      message: 'File uploaded',
      data: { url: toPublicPath(folder, req.file.filename), filename: req.file.filename, size: req.file.size },
    });
  });

const uploadMany = (folder) =>
  asyncHandler(async (req, res) => {
    if (!req.files?.length) throw ApiError.badRequest('No files uploaded');
    return sendSuccess(res, {
      statusCode: 201,
      message: 'Files uploaded',
      data: req.files.map((f) => ({ url: toPublicPath(folder, f.filename), filename: f.filename, size: f.size })),
    });
  });

module.exports = { uploadSingle, uploadMany };
