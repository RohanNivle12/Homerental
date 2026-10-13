import { Router } from 'express';
import authRoutes from './authRoutes';
import propertyRoutes from './propertyRoutes';
import inquiryRoutes from './inquiryRoutes';
import visitRoutes from './visitRoutes';
import favoriteRoutes from './favoriteRoutes';
import notificationRoutes from './notificationRoutes';
import adminRoutes from './adminRoutes';
import userRoutes from './userRoutes';
import locationRoutes from './locationRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/properties', propertyRoutes);
router.use('/locations', locationRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/', inquiryRoutes);
router.use('/', visitRoutes);
router.use('/', userRoutes);

export default router;
