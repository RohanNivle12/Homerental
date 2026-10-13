import { Router } from 'express';
import {
  createVisitRequest,
  getTenantVisits,
  getOwnerVisits,
  updateVisitStatus,
  cancelVisit,
} from '../controllers/visitController';
import { authenticate, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.post('/properties/:propertyId/visits', authenticate, createVisitRequest);
router.get('/tenant/visits', authenticate, getTenantVisits);
router.get('/owner/visits', authenticate, requireRole('OWNER', 'ADMIN'), getOwnerVisits);
router.patch('/owner/visits/:id', authenticate, requireRole('OWNER', 'ADMIN'), updateVisitStatus);
router.post('/visits/:id/cancel', authenticate, cancelVisit);

export default router;
