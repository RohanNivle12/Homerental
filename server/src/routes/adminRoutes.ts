import { Router } from 'express';
import {
  getAdminOverview,
  getUsers,
  updateUserStatus,
  getAdminProperties,
  updatePropertyModeration,
  getAdminReports,
  updateReportStatus,
  getOwnerVerifications,
  updateOwnerVerification,
  getAuditLogs,
} from '../controllers/adminController';
import { authenticate, requireRole } from '../middleware/authMiddleware';

const router = Router();

// Protect all admin endpoints with ADMIN role guard
router.use(authenticate, requireRole('ADMIN'));

router.get('/overview', getAdminOverview);
router.get('/users', getUsers);
router.patch('/users/:id/status', updateUserStatus);
router.get('/properties', getAdminProperties);
router.patch('/properties/:id/moderation', updatePropertyModeration);
router.get('/reports', getAdminReports);
router.patch('/reports/:id', updateReportStatus);
router.get('/owner-verifications', getOwnerVerifications);
router.patch('/owner-verifications/:id', updateOwnerVerification);
router.get('/audit-logs', getAuditLogs);

export default router;
