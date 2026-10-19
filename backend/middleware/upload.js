const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { env } = require('../config/env');
const ApiError = require('../utils/ApiError');

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

/** Creates a Multer instance writing into uploads/<folder>. */
function createUploader(folder) {
  const dest = path.join(process.cwd(), env.uploadDir, folder);
  fs.mkdirSync(dest, { recursive: true });

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dest),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const base = path.basename(file.originalname, ext).replace(/[^a-z0-9]/gi, '-').slice(0, 40);
      cb(null, `${Date.now()}-${base}${ext}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: env.maxUploadSizeMb * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!ALLOWED.includes(file.mimetype)) {
        return cb(ApiError.badRequest('Only JPEG, PNG, WebP or AVIF images are allowed'));
      }
      return cb(null, true);
    },
  });
}

const uploadInvestment = createUploader('investments');
const uploadTeam = createUploader('team');
const uploadAvatar = createUploader('avatars');
const uploadProof = createUploader('proofs');

/** Public URL path for a stored file. */
const toPublicPath = (folder, filename) => `/${env.uploadDir}/${folder}/${filename}`;

module.exports = { createUploader, uploadInvestment, uploadTeam, uploadAvatar, uploadProof, toPublicPath };
