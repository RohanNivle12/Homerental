import { Router } from 'express';
import {
  reportProperty,
  submitOwnerVerification,
  getAmenities,
} from '../controllers/userController';
import { authenticate, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.get('/amenities', getAmenities);
router.post('/properties/:propertyId/report', authenticate, reportProperty);
router.post('/owner/verify', authenticate, requireRole('OWNER', 'ADMIN'), submitOwnerVerification);

export default router;
