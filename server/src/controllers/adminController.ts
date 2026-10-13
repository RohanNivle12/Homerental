import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { createAuditLog } from '../utils/auditLogger';

export const getAdminOverview = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [
      totalUsers,
      totalTenants,
      totalOwners,
      totalProperties,
      pendingProperties,
      reportedProperties,
      totalVisits,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'TENANT' } }),
      prisma.user.count({ where: { role: 'OWNER' } }),
      prisma.property.count({ where: { status: 'AVAILABLE', moderationStatus: 'APPROVED' } }),
      prisma.property.count({ where: { moderationStatus: 'PENDING' } }),
      prisma.propertyReport.count({ where: { status: 'PENDING' } }),
      prisma.visitRequest.count(),
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          performedBy: {
            select: { id: true, fullName: true, email: true },
          },
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalTenants,
        totalOwners,
        totalProperties,
        pendingProperties,
        reportedProperties,
        totalVisits,
        recentAuditLogs,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 15;
    const role = req.query.role as any;
    const status = req.query.status as any;
    const search = req.query.search as string;

    const where: any = {};
    if (role) where.role = role;
    if (status) where.accountStatus = status;
    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const skip = (page - 1) * limit;

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          role: true,
          accountStatus: true,
          createdAt: true,
          ownerVerification: {
            select: { status: true, documentType: true },
          },
          _count: {
            select: {
              properties: true,
              visitRequests: true,
            },
          },
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { accountStatus } = req.body;

    if (!['ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION'].includes(accountStatus)) {
      res.status(400).json({ success: false, message: 'Invalid account status' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { accountStatus },
      select: { id: true, fullName: true, email: true, role: true, accountStatus: true },
    });

    await createAuditLog({
      req,
      action: `USER_STATUS_${accountStatus}`,
      entityType: 'USER',
      entityId: id,
      details: { accountStatus },
    });

    res.status(200).json({
      success: true,
      message: `User status updated to ${accountStatus}.`,
      data: { user: updated },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminProperties = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 15;
    const moderationStatus = req.query.moderationStatus as any;

    const where: any = {};
    if (moderationStatus) where.moderationStatus = moderationStatus;

    const skip = (page - 1) * limit;

    const [total, properties] = await Promise.all([
      prisma.property.count({ where }),
      prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: {
            select: { id: true, fullName: true, email: true, phone: true },
          },
          images: {
            where: { isPrimary: true },
            take: 1,
          },
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        properties,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updatePropertyModeration = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { moderationStatus, rejectionReason } = req.body;

    if (!['APPROVED', 'REJECTED', 'PENDING'].includes(moderationStatus)) {
      res.status(400).json({ success: false, message: 'Invalid moderation status.' });
      return;
    }

    const property = await prisma.property.findUnique({
      where: { id },
    });

    if (!property) {
      res.status(404).json({ success: false, message: 'Property not found.' });
      return;
    }

    const updated = await prisma.property.update({
      where: { id },
      data: {
        moderationStatus,
        rejectionReason: moderationStatus === 'REJECTED' ? rejectionReason : null,
      },
    });

    // Notify landlord
    await prisma.notification.create({
      data: {
        userId: property.ownerId,
        type: 'MODERATION',
        title: moderationStatus === 'APPROVED' ? 'Property Listing Approved!' : 'Property Listing Rejected',
        message:
          moderationStatus === 'APPROVED'
            ? `Your listing "${property.title}" has been reviewed and approved by administrators.`
            : `Your listing "${property.title}" was rejected. Reason: ${rejectionReason || 'Does not meet guidelines.'}`,
        linkUrl: `/properties/${property.id}`,
      },
    });

    await createAuditLog({
      req,
      action: `PROPERTY_MODERATION_${moderationStatus}`,
      entityType: 'PROPERTY',
      entityId: id,
      details: { moderationStatus, rejectionReason },
    });

    res.status(200).json({
      success: true,
      message: `Property listing ${moderationStatus.toLowerCase()} successfully.`,
      data: { property: updated },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminReports = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const reports = await prisma.propertyReport.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: {
          select: { id: true, fullName: true, email: true },
        },
        property: {
          select: {
            id: true,
            title: true,
            locality: true,
            city: true,
            owner: {
              select: { id: true, fullName: true, email: true },
            },
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: { reports },
    });
  } catch (error) {
    next(error);
  }
};

export const updateReportStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, adminNotes, takeDownProperty } = req.body;

    if (!['RESOLVED', 'DISMISSED', 'PENDING'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid report status.' });
      return;
    }

    const report = await prisma.propertyReport.findUnique({
      where: { id },
    });

    if (!report) {
      res.status(404).json({ success: false, message: 'Report not found.' });
      return;
    }

    const updated = await prisma.propertyReport.update({
      where: { id },
      data: {
        status,
        adminNotes,
      },
    });

    // If admin chose to take down property due to fraudulent/inappropriate report
    if (takeDownProperty && report.propertyId) {
      await prisma.property.update({
        where: { id: report.propertyId },
        data: {
          status: 'PAUSED',
          moderationStatus: 'REJECTED',
          rejectionReason: `Suspended due to report: ${report.reason}`,
        },
      });
    }

    await createAuditLog({
      req,
      action: `REPORT_${status}`,
      entityType: 'PROPERTY_REPORT',
      entityId: id,
      details: { status, takeDownProperty },
    });

    res.status(200).json({
      success: true,
      message: `Report marked as ${status.toLowerCase()}.`,
      data: { report: updated },
    });
  } catch (error) {
    next(error);
  }
};

export const getOwnerVerifications = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const verifications = await prisma.ownerVerification.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: { verifications },
    });
  } catch (error) {
    next(error);
  }
};

export const updateOwnerVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, rejectionReason, adminNotes } = req.body;

    if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid verification status.' });
      return;
    }

    const updated = await prisma.ownerVerification.update({
      where: { id },
      data: {
        status,
        rejectionReason: status === 'REJECTED' ? rejectionReason : null,
        adminNotes,
      },
      include: { user: true },
    });

    // Notify owner
    await prisma.notification.create({
      data: {
        userId: updated.userId,
        type: 'SYSTEM',
        title: status === 'APPROVED' ? 'Owner Profile Verified!' : 'Owner Verification Rejected',
        message:
          status === 'APPROVED'
            ? 'Congratulations! Your owner profile has been verified. You now display the Verified Landlord badge.'
            : `Your verification request was rejected: ${rejectionReason || 'Please review your document.'}`,
        linkUrl: `/dashboard/owner`,
      },
    });

    await createAuditLog({
      req,
      action: `OWNER_VERIFICATION_${status}`,
      entityType: 'OWNER_VERIFICATION',
      entityId: id,
      details: { status, rejectionReason },
    });

    res.status(200).json({
      success: true,
      message: `Owner verification ${status.toLowerCase()} successfully.`,
      data: { verification: updated },
    });
  } catch (error) {
    next(error);
  }
};

export const getAuditLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const action = req.query.action as string;

    const where: any = {};
    if (action) where.action = { contains: action };

    const skip = (page - 1) * limit;

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          performedBy: {
            select: { id: true, fullName: true, email: true, role: true },
          },
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
