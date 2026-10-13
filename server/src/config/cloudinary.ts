import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export { isCloudinaryConfigured };

export interface UploadResult {
  url: string;
  publicId?: string;
}

/**
 * Uploads a file buffer or local file path to Cloudinary, or falls back to local uploads directory
 */
export async function uploadPropertyImage(
  filePath: string,
  originalName: string
): Promise<UploadResult> {
  if (isCloudinaryConfigured) {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: 'homefinder/properties',
        transformation: [{ width: 1200, height: 800, crop: 'limit', quality: 'auto' }],
      });
      // Remove temporary local file if created
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      console.warn('Cloudinary upload failed, falling back to local storage:', error);
    }
  }

  // Local storage fallback
  const uploadsDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const ext = path.extname(originalName) || '.jpg';
  const fileName = `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
  const targetPath = path.join(uploadsDir, fileName);

  if (fs.existsSync(filePath)) {
    fs.copyFileSync(filePath, targetPath);
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      // ignore
    }
  }

  return {
    url: `/uploads/${fileName}`,
    publicId: fileName,
  };
}
