import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { createReportSchema } from '../validators/visitValidators';

export const reportProperty = async (
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
    const { reason, details } = createReportSchema.parse(req.body);

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      res.status(404).json({ success: false, message: 'Property not found.' });
      return;
    }

    const report = await prisma.propertyReport.create({
      data: {
        propertyId,
        reporterId: req.user.id,
        reason,
        details: details ? details.trim() : null,
        status: 'PENDING',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Report submitted. Our moderation team will investigate.',
      data: { report },
    });
  } catch (error) {
    next(error);
  }
};

export const submitOwnerVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { documentType, documentUrl } = req.body;
    if (!documentType || !documentUrl) {
      res.status(400).json({ success: false, message: 'Document type and URL are required.' });
      return;
    }

    const verification = await prisma.ownerVerification.upsert({
      where: { userId: req.user.id },
      update: {
        documentType,
        documentUrl,
        status: 'PENDING',
        rejectionReason: null,
      },
      create: {
        userId: req.user.id,
        documentType,
        documentUrl,
        status: 'PENDING',
      },
    });

    res.status(200).json({
      success: true,
      message: 'Verification document submitted for review.',
      data: { verification },
    });
  } catch (error) {
    next(error);
  }
};

export const getAmenities = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const amenities = await prisma.amenity.findMany({
      orderBy: { name: 'asc' },
    });
    res.status(200).json({
      success: true,
      data: { amenities },
    });
  } catch (error) {
    next(error);
  }
};
