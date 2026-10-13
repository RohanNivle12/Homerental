import { Router } from 'express';
import {
  getProperties,
  getPropertyById,
  getPropertiesOnMap,
  getPropertiesByRadius,
  createProperty,
  updateProperty,
  deleteProperty,
  getOwnerProperties,
  uploadImagesHandler,
} from '../controllers/propertyController';
import { authenticate, requireRole, optionalAuthenticate } from '../middleware/authMiddleware';
import { uploadImages } from '../middleware/uploadMiddleware';

const router = Router();

// Public / Semi-public listing discovery
router.get('/', optionalAuthenticate, getProperties);
router.get('/map', getPropertiesOnMap);
router.get('/radius', getPropertiesByRadius);
router.get('/owner/me', authenticate, requireRole('OWNER', 'ADMIN'), getOwnerProperties);
router.get('/:id', optionalAuthenticate, getPropertyById);

// Owner / Admin operations
router.post(
  '/upload-images',
  authenticate,
  requireRole('OWNER', 'ADMIN'),
  uploadImages.array('images', 10),
  uploadImagesHandler
);
router.post('/', authenticate, requireRole('OWNER', 'ADMIN'), createProperty);
router.patch('/:id', authenticate, requireRole('OWNER', 'ADMIN'), updateProperty);
router.delete('/:id', authenticate, requireRole('OWNER', 'ADMIN'), deleteProperty);

export default router;
