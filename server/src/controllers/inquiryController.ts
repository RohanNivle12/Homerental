import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { createInquirySchema, replyInquirySchema } from '../validators/visitValidators';

export const createInquiry = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { propertyId } = req.params;
    const { message } = createInquirySchema.parse(req.body);

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: { owner: true },
    });

    if (!property) {
      res.status(404).json({ success: false, message: 'Property not found.' });
      return;
    }

    if (property.ownerId === req.user.id) {
      res.status(400).json({
        success: false,
        message: 'You cannot send an inquiry for your own property.',
      });
      return;
    }

    const inquiry = await prisma.inquiry.create({
      data: {
        propertyId,
        tenantId: req.user.id,
        message: message.trim(),
        status: 'NEW',
      },
      include: {
        property: {
          select: { id: true, title: true, locality: true, city: true },
        },
      },
    });

    // Notify owner
    await prisma.notification.create({
      data: {
        userId: property.ownerId,
        type: 'INQUIRY',
        title: 'New Rental Inquiry!',
        message: `${req.user.fullName} sent an inquiry regarding "${property.title}".`,
        linkUrl: `/dashboard/owner/inquiries`,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Inquiry sent to property owner.',
      data: { inquiry },
    });
  } catch (error) {
    next(error);
  }
};

export const getTenantInquiries = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const inquiries = await prisma.inquiry.findMany({
      where: { tenantId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            locality: true,
            city: true,
            monthlyRent: true,
            owner: {
              select: { id: true, fullName: true, phone: true },
            },
            images: {
              where: { isPrimary: true },
              take: 1,
              select: { url: true },
            },
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: { inquiries },
    });
  } catch (error) {
    next(error);
  }
};

export const getOwnerInquiries = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const inquiries = await prisma.inquiry.findMany({
      where: {
        property: {
          ownerId: req.user.id,
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        tenant: {
          select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true },
        },
        property: {
          select: { id: true, title: true, locality: true, city: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: { inquiries },
    });
  } catch (error) {
    next(error);
  }
};

export const replyToInquiry = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const { ownerReply } = replyInquirySchema.parse(req.body);

    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
      include: { property: true },
    });

    if (!inquiry) {
      res.status(404).json({ success: false, message: 'Inquiry not found.' });
      return;
    }

    if (inquiry.property.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Unauthorized to reply to this inquiry.' });
      return;
    }

    const updated = await prisma.inquiry.update({
      where: { id },
      data: {
        ownerReply: ownerReply.trim(),
        status: 'RESPONDED',
      },
    });

    // Notify tenant
    await prisma.notification.create({
      data: {
        userId: inquiry.tenantId,
        type: 'INQUIRY',
        title: 'Landlord Replied to Your Inquiry',
        message: `Owner replied to your inquiry for "${inquiry.property.title}": "${ownerReply.slice(0, 80)}..."`,
        linkUrl: `/dashboard/tenant/inquiries`,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Reply sent successfully.',
      data: { inquiry: updated },
    });
  } catch (error) {
    next(error);
  }
};
