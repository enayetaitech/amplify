// backend/utils/multer.ts
import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';

// Store files in memory so we can hand the buffer off to S3
const storage = multer.memoryStorage();

// Only accept common image types
const imageFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, WEBP or GIF images are allowed'));
  }
};

// Export a configured Multer instance
export const uploadImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // limit to 5MB
  },
});
