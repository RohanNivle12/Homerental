import { Request } from 'express';
import { prisma } from '../config/db';

interface AuditLogParams {
  req?: Request;
  performedById?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, any> | string;
}

export const createAuditLog = async ({
  req,
  performedById,
  action,
  entityType,
  entityId,
  details,
}: AuditLogParams): Promise<void> => {
  try {
    const actorId = performedById || (req as any)?.user?.id;
    const ipAddress =
      req?.headers['x-forwarded-for']?.toString() ||
      req?.socket?.remoteAddress ||
      undefined;

    const detailsStr =
      typeof details === 'object' ? JSON.stringify(details) : details;

    await prisma.auditLog.create({
      data: {
        performedById: actorId,
        action,
        entityType,
        entityId,
        details: detailsStr,
        ipAddress,
      },
    });
  } catch (err) {
    console.error('Failed to create audit log:', err);
  }
};
