import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AppError } from './error.middleware';

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const subDir = file.fieldname === 'images' ? 'images' : file.fieldname === 'avatar' ? 'avatars' : 'attachments';
    const dir = path.join(uploadsDir, subDir);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req: any, file: any, cb: any) => {
  if (file.fieldname === 'images' || file.fieldname === 'avatar') {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new AppError('Only image files are allowed for images field.', 400));
    }
  }
  if (file.fieldname === 'attachments') {
    const allowed = ['application/pdf', 'application/msword', 'text/plain'];
    if (!allowed.includes(file.mimetype) && !file.mimetype.startsWith('image/')) {
      return cb(new AppError('Invalid file type for attachments.', 400));
    }
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});
