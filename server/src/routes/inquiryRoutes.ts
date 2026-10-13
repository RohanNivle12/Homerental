import { Router } from 'express';
import {
  createInquiry,
  getTenantInquiries,
  getOwnerInquiries,
  replyToInquiry,
} from '../controllers/inquiryController';
import { authenticate, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.post('/properties/:propertyId/inquiries', authenticate, createInquiry);
router.get('/tenant/inquiries', authenticate, getTenantInquiries);
router.get('/owner/inquiries', authenticate, requireRole('OWNER', 'ADMIN'), getOwnerInquiries);
router.patch('/inquiries/:id/reply', authenticate, requireRole('OWNER', 'ADMIN'), replyToInquiry);

export default router;
