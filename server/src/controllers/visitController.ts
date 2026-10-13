import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { createVisitSchema, updateVisitStatusSchema } from '../validators/visitValidators';

export const createVisitRequest = async (
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
    const { visitDate, timeSlot, notes } = createVisitSchema.parse(req.body);

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      res.status(404).json({ success: false, message: 'Property not found.' });
      return;
    }

    if (property.ownerId === req.user.id) {
      res.status(400).json({
        success: false,
        message: 'You cannot schedule a visit for your own property.',
      });
      return;
    }

    const parsedDate = new Date(visitDate);

    // Conflict Check: Check if tenant already has an active visit for this property on this date
    const existingVisit = await prisma.visitRequest.findFirst({
      where: {
        propertyId,
        tenantId: req.user.id,
        visitDate: {
          gte: new Date(parsedDate.setHours(0, 0, 0, 0)),
          lte: new Date(parsedDate.setHours(23, 59, 59, 999)),
        },
        status: { in: ['PENDING', 'ACCEPTED'] },
      },
    });

    if (existingVisit) {
      res.status(409).json({
        success: false,
        message: 'You already have an active visit scheduled for this property on this date.',
      });
      return;
    }

    const visit = await prisma.visitRequest.create({
      data: {
        propertyId,
        tenantId: req.user.id,
        visitDate: new Date(visitDate),
        timeSlot,
        notes: notes ? notes.trim() : null,
        status: 'PENDING',
      },
      include: {
        property: {
          select: { id: true, title: true, address: true, locality: true, city: true },
        },
      },
    });

    // Notify owner
    await prisma.notification.create({
      data: {
        userId: property.ownerId,
        type: 'VISIT',
        title: 'New Visit Request!',
        message: `${req.user.fullName} requested a visit for "${property.title}" on ${new Date(visitDate).toLocaleDateString()} (${timeSlot}).`,
        linkUrl: `/dashboard/owner/visits`,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Visit request submitted successfully.',
      data: { visit },
    });
  } catch (error) {
    next(error);
  }
};

export const getTenantVisits = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const visits = await prisma.visitRequest.findMany({
      where: { tenantId: req.user.id },
      orderBy: { visitDate: 'asc' },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
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
      data: { visits },
    });
  } catch (error) {
    next(error);
  }
};

export const getOwnerVisits = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const visits = await prisma.visitRequest.findMany({
      where: {
        property: {
          ownerId: req.user.id,
        },
      },
      orderBy: { visitDate: 'asc' },
      include: {
        tenant: {
          select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true },
        },
        property: {
          select: { id: true, title: true, address: true, locality: true, city: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: { visits },
    });
  } catch (error) {
    next(error);
  }
};

export const updateVisitStatus = async (
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
    const { status, ownerNotes } = updateVisitStatusSchema.parse(req.body);

    const visit = await prisma.visitRequest.findUnique({
      where: { id },
      include: { property: true },
    });

    if (!visit) {
      res.status(404).json({ success: false, message: 'Visit request not found.' });
      return;
    }

    if (visit.property.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Unauthorized to update this visit request.' });
      return;
    }

    // Backend state transition validation
    if (visit.status === 'CANCELLED') {
      res.status(400).json({
        success: false,
        message: 'Cannot update status of a cancelled visit request.',
      });
      return;
    }

    const updated = await prisma.visitRequest.update({
      where: { id },
      data: {
        status,
        ownerNotes: ownerNotes ? ownerNotes.trim() : visit.ownerNotes,
      },
    });

    // Notify tenant
    const statusText = status === 'ACCEPTED' ? 'Accepted' : status === 'REJECTED' ? 'Declined' : 'Marked Completed';
    await prisma.notification.create({
      data: {
        userId: visit.tenantId,
        type: 'VISIT',
        title: `Visit Request ${statusText}`,
        message: `Your visit for "${visit.property.title}" on ${new Date(visit.visitDate).toLocaleDateString()} was ${statusText.toLowerCase()}.${ownerNotes ? ` Landlord note: "${ownerNotes}"` : ''}`,
        linkUrl: `/dashboard/tenant/visits`,
      },
    });

    res.status(200).json({
      success: true,
      message: `Visit request ${statusText.toLowerCase()} successfully.`,
      data: { visit: updated },
    });
  } catch (error) {
    next(error);
  }
};

export const cancelVisit = async (
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

    const visit = await prisma.visitRequest.findUnique({
      where: { id },
      include: { property: true },
    });

    if (!visit) {
      res.status(404).json({ success: false, message: 'Visit request not found.' });
      return;
    }

    if (visit.tenantId !== req.user.id && req.user.role !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Unauthorized to cancel this visit request.' });
      return;
    }

    if (visit.status === 'CANCELLED' || visit.status === 'COMPLETED') {
      res.status(400).json({
        success: false,
        message: `Visit is already ${visit.status.toLowerCase()}.`,
      });
      return;
    }

    const cancelled = await prisma.visitRequest.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    // Notify owner
    await prisma.notification.create({
      data: {
        userId: visit.property.ownerId,
        type: 'VISIT',
        title: 'Visit Request Cancelled',
        message: `${req.user.fullName} cancelled their scheduled visit for "${visit.property.title}".`,
        linkUrl: `/dashboard/owner/visits`,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Visit request cancelled successfully.',
      data: { visit: cancelled },
    });
  } catch (error) {
    next(error);
  }
};
