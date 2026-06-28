import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { verifyToken } from '../middleware/verifyToken.js';

const router = Router();

// Configure Multer in-memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Configure Cloudinary lazy-loader
let cloudinaryConfigured = false;
if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  cloudinaryConfigured = true;
  console.log('[Upload] Cloudinary configured successfully.');
} else {
  console.log('[Upload] Cloudinary keys missing. Falling back to local Base64 / Unsplash placeholder generator.');
}

// POST /api/upload - Handle file upload (Protected)
router.post('/', verifyToken, upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded.' });
      return;
    }

    if (cloudinaryConfigured) {
      // Upload stream to Cloudinary
      const uploadStream = () => {
        return new Promise<string>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: 'blog_platform',
              resource_type: 'auto',
            },
            (error, result) => {
              if (error) reject(error);
              else if (result) resolve(result.secure_url);
              else reject(new Error('Upload failed with empty result.'));
            }
          );
          stream.end(req.file!.buffer);
        });
      };

      const secureUrl = await uploadStream();
      res.status(200).json({ url: secureUrl, secure_url: secureUrl });
    } else {
      // In-memory/Base64 fallback so the preview works perfectly without Cloudinary keys
      const base64Data = req.file.buffer.toString('base64');
      const dataUri = `data:${req.file.mimetype};base64,${base64Data}`;
      res.status(200).json({ url: dataUri, secure_url: dataUri });
    }
  } catch (error: any) {
    console.error('File upload error:', error);
    res.status(500).json({ message: error.message || 'Error uploading file.' });
  }
});

export default router;
