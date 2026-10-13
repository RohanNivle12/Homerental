import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/db';
import {
  createPropertySchema,
  updatePropertySchema,
  propertyQuerySchema,
  mapQuerySchema,
  radiusQuerySchema,
} from '../validators/propertyValidators';
import { haversineDistance, getBoundingBox } from '../utils/haversine';
import { uploadPropertyImage } from '../config/cloudinary';
import { createAuditLog } from '../utils/auditLogger';

export const getProperties = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query = propertyQuerySchema.parse(req.query);

    const where: Prisma.PropertyWhereInput = {
      status: 'AVAILABLE',
      moderationStatus: 'APPROVED',
    };

    if (query.stateId) {
      where.stateId = query.stateId;
    } else if (query.state) {
      where.state = { contains: query.state.trim() };
    }

    if (query.districtId) {
      where.districtId = query.districtId;
    }

    if (query.subdistrictId) {
      where.subdistrictId = query.subdistrictId;
    }

    if (query.villageId) {
      where.villageId = query.villageId;
    }

    const pin = query.postalCode || query.pincode;
    if (pin) {
      where.postalCode = { startsWith: pin.trim() };
    }

    if (query.city) {
      where.city = { contains: query.city.trim() };
    }

    if (query.locality) {
      where.locality = { contains: query.locality.trim() };
    }

    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { title: { contains: term } },
        { description: { contains: term } },
        { locality: { contains: term } },
        { city: { contains: term } },
        { address: { contains: term } },
      ];
    }

    if (query.minRent !== undefined || query.maxRent !== undefined) {
      where.monthlyRent = {};
      if (query.minRent !== undefined) where.monthlyRent.gte = query.minRent;
      if (query.maxRent !== undefined) where.monthlyRent.lte = query.maxRent;
    }

    if (query.bedrooms) {
      const beds = query.bedrooms.split(',').map((b) => parseInt(b.trim(), 10)).filter((n) => !isNaN(n));
      if (beds.length > 0) {
        where.bedrooms = { in: beds };
      }
    }

    if (query.bathrooms) {
      const baths = parseInt(query.bathrooms.trim(), 10);
      if (!isNaN(baths)) {
        where.bathrooms = { gte: baths };
      }
    }

    if (query.propertyType) {
      const types = query.propertyType.split(',').map((t) => t.trim()) as any[];
      where.propertyType = { in: types };
    }

    if (query.furnishing) {
      const furnishings = query.furnishing.split(',').map((f) => f.trim()) as any[];
      where.furnishing = { in: furnishings };
    }

    if (query.amenities) {
      const amenityNames = query.amenities.split(',').map((a) => a.trim().toLowerCase());
      where.amenities = {
        some: {
          amenity: {
            name: { in: amenityNames },
          },
        },
      };
    }

    if (query.ownerVerifiedOnly) {
      where.owner = {
        ownerVerification: {
          status: 'APPROVED',
        },
      };
    }

    let orderBy: Prisma.PropertyOrderByWithRelationInput = { createdAt: 'desc' };
    if (query.sortBy === 'rent_asc') orderBy = { monthlyRent: 'asc' };
    if (query.sortBy === 'rent_desc') orderBy = { monthlyRent: 'desc' };
    if (query.sortBy === 'area_desc') orderBy = { area: 'desc' };

    const skip = (query.page - 1) * query.limit;

    const [total, properties] = await Promise.all([
      prisma.property.count({ where }),
      prisma.property.findMany({
        where,
        orderBy,
        skip,
        take: query.limit,
        include: {
          images: {
            orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }],
            take: 5,
          },
          amenities: {
            include: { amenity: true },
          },
          owner: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              ownerVerification: {
                select: { status: true },
              },
            },
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
          page: query.page,
          limit: query.limit,
          totalPages: Math.ceil(total / query.limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPropertyById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }],
        },
        amenities: {
          include: { amenity: true },
        },
        owner: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            avatarUrl: true,
            createdAt: true,
            ownerVerification: {
              select: { status: true },
            },
          },
        },
      },
    });

    if (!property) {
      res.status(404).json({ success: false, message: 'Property not found.' });
      return;
    }

    // Increment view count asynchronously
    prisma.property
      .update({
        where: { id },
        data: { viewsCount: { increment: 1 } },
      })
      .catch((err) => console.error('Failed to increment view count:', err));

    // Fetch up to 4 similar properties in same city/locality
    const similarProperties = await prisma.property.findMany({
      where: {
        id: { not: id },
        city: property.city,
        status: 'AVAILABLE',
        moderationStatus: 'APPROVED',
      },
      take: 4,
      include: {
        images: {
          orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }],
          take: 1,
        },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        property,
        similarProperties,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPropertiesOnMap = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query = mapQuerySchema.parse(req.query);

    const minLat = Math.min(query.swLat, query.neLat);
    const maxLat = Math.max(query.swLat, query.neLat);
    const minLng = Math.min(query.swLng, query.neLng);
    const maxLng = Math.max(query.swLng, query.neLng);

    const where: Prisma.PropertyWhereInput = {
      status: 'AVAILABLE',
      moderationStatus: 'APPROVED',
      latitude: { gte: minLat, lte: maxLat },
      longitude: { gte: minLng, lte: maxLng },
    };

    if (query.minRent !== undefined || query.maxRent !== undefined) {
      where.monthlyRent = {};
      if (query.minRent !== undefined) where.monthlyRent.gte = query.minRent;
      if (query.maxRent !== undefined) where.monthlyRent.lte = query.maxRent;
    }

    if (query.bedrooms) {
      const beds = query.bedrooms.split(',').map((b) => parseInt(b.trim(), 10)).filter((n) => !isNaN(n));
      if (beds.length > 0) where.bedrooms = { in: beds };
    }

    if (query.propertyType) {
      const types = query.propertyType.split(',').map((t) => t.trim()) as any[];
      where.propertyType = { in: types };
    }

    if (query.furnishing) {
      const furnishings = query.furnishing.split(',').map((f) => f.trim()) as any[];
      where.furnishing = { in: furnishings };
    }

    const properties = await prisma.property.findMany({
      where,
      take: 100, // Return up to 100 markers for area
      select: {
        id: true,
        title: true,
        monthlyRent: true,
        bedrooms: true,
        bathrooms: true,
        propertyType: true,
        locality: true,
        city: true,
        latitude: true,
        longitude: true,
        images: {
          where: { isPrimary: true },
          take: 1,
          select: { url: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: { properties },
    });
  } catch (error) {
    next(error);
  }
};

export const getPropertiesByRadius = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query = radiusQuerySchema.parse(req.query);
    const box = getBoundingBox(query.lat, query.lng, query.radiusKm);

    const where: Prisma.PropertyWhereInput = {
      status: 'AVAILABLE',
      moderationStatus: 'APPROVED',
      latitude: { gte: box.minLat, lte: box.maxLat },
      longitude: { gte: box.minLng, lte: box.maxLng },
    };

    if (query.minRent !== undefined || query.maxRent !== undefined) {
      where.monthlyRent = {};
      if (query.minRent !== undefined) where.monthlyRent.gte = query.minRent;
      if (query.maxRent !== undefined) where.monthlyRent.lte = query.maxRent;
    }

    const candidateProperties = await prisma.property.findMany({
      where,
      include: {
        images: { take: 1 },
      },
    });

    // Exact Haversine distance filtering and sort
    const withDistances = candidateProperties
      .map((p) => ({
        ...p,
        distanceKm: Math.round(haversineDistance(query.lat, query.lng, p.latitude, p.longitude) * 10) / 10,
      }))
      .filter((p) => p.distanceKm <= query.radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    res.status(200).json({
      success: true,
      data: { properties: withDistances },
    });
  } catch (error) {
    next(error);
  }
};

export const createProperty = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const data = createPropertySchema.parse(req.body);
    if (data.districtId && data.stateId) {
      const district = await prisma.district.findUnique({ where: { id: data.districtId } });
      if (!district || district.stateId !== data.stateId) {
        res.status(400).json({
          success: false,
          message: 'The selected District does not belong to the selected State.',
        });
        return;
      }
    }

    if (data.subdistrictId && data.districtId) {
      const subdistrict = await prisma.subdistrict.findUnique({ where: { id: data.subdistrictId } });
      if (!subdistrict || subdistrict.districtId !== data.districtId) {
        res.status(400).json({
          success: false,
          message: 'The selected Subdistrict does not belong to the selected District.',
        });
        return;
      }
    }

    if (data.villageId && data.subdistrictId) {
      const village = await prisma.village.findUnique({ where: { id: data.villageId } });
      if (!village || village.subdistrictId !== data.subdistrictId) {
        res.status(400).json({
          success: false,
          message: 'The selected Settlement/Village does not belong to the selected Subdistrict.',
        });
        return;
      }
    }

    // Check owner verification status
    const verification = await prisma.ownerVerification.findUnique({
      where: { userId: req.user.id },
    });

    // If owner is approved by admin, listing is approved immediately, else PENDING moderation
    const moderationStatus = verification?.status === 'APPROVED' ? 'APPROVED' : 'PENDING';

    const property = await prisma.property.create({
      data: {
        ownerId: req.user.id,
        title: data.title.trim(),
        description: data.description.trim(),
        propertyType: data.propertyType,
        address: data.address.trim(),
        locality: data.locality.trim(),
        city: data.city.trim(),
        state: data.state.trim(),
        postalCode: data.postalCode.trim(),
        stateId: data.stateId || null,
        districtId: data.districtId || null,
        subdistrictId: data.subdistrictId || null,
        villageId: data.villageId || null,
        latitude: data.latitude,
        longitude: data.longitude,
        monthlyRent: data.monthlyRent,
        securityDeposit: data.securityDeposit,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        area: data.area,
        furnishing: data.furnishing,
        availableFrom: data.availableFrom,
        status: data.status,
        moderationStatus,
        images: {
          create: data.imageUrls.map((url, index) => ({
            url,
            isPrimary: index === 0,
            order: index,
          })),
        },
        amenities: {
          create: data.amenityIds.map((amenityId) => ({
            amenityId,
          })),
        },
      },
      include: {
        images: true,
        amenities: { include: { amenity: true } },
      },
    });

    // Notify user about moderation status
    await prisma.notification.create({
      data: {
        userId: req.user.id,
        type: 'MODERATION',
        title: moderationStatus === 'APPROVED' ? 'Listing Published!' : 'Listing Under Review',
        message:
          moderationStatus === 'APPROVED'
            ? `Your listing "${property.title}" is now active and live.`
            : `Your listing "${property.title}" was submitted and is pending administrator moderation.`,
        linkUrl: `/properties/${property.id}`,
      },
    });

    await createAuditLog({
      req,
      action: 'PROPERTY_CREATED',
      entityType: 'PROPERTY',
      entityId: property.id,
      details: { title: property.title, moderationStatus },
    });

    res.status(201).json({
      success: true,
      message:
        moderationStatus === 'APPROVED'
          ? 'Listing published successfully!'
          : 'Listing submitted for admin moderation.',
      data: { property },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProperty = async (
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
    const property = await prisma.property.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!property) {
      res.status(404).json({ success: false, message: 'Property not found' });
      return;
    }

    // IDOR protection: Verify ownership or admin role
    if (property.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to modify this property.',
      });
      return;
    }

    const data = updatePropertySchema.parse(req.body);

    const targetStateId = data.stateId || property.stateId;
    const targetDistrictId = data.districtId || property.districtId;
    const targetSubdistrictId = data.subdistrictId || property.subdistrictId;

    if (data.districtId && targetStateId) {
      const district = await prisma.district.findUnique({ where: { id: data.districtId } });
      if (!district || district.stateId !== targetStateId) {
        res.status(400).json({
          success: false,
          message: 'The selected District does not belong to the selected State.',
        });
        return;
      }
    }

    if (data.subdistrictId && targetDistrictId) {
      const subdistrict = await prisma.subdistrict.findUnique({ where: { id: data.subdistrictId } });
      if (!subdistrict || subdistrict.districtId !== targetDistrictId) {
        res.status(400).json({
          success: false,
          message: 'The selected Subdistrict does not belong to the selected District.',
        });
        return;
      }
    }

    if (data.villageId && targetSubdistrictId) {
      const village = await prisma.village.findUnique({ where: { id: data.villageId } });
      if (!village || village.subdistrictId !== targetSubdistrictId) {
        res.status(400).json({
          success: false,
          message: 'The selected Settlement/Village does not belong to the selected Subdistrict.',
        });
        return;
      }
    }

    // Update images if provided
    if (data.imageUrls) {
      await prisma.propertyImage.deleteMany({ where: { propertyId: id } });
      await prisma.propertyImage.createMany({
        data: data.imageUrls.map((url, index) => ({
          propertyId: id,
          url,
          isPrimary: index === 0,
          order: index,
        })),
      });
    }

    // Update amenities if provided
    if (data.amenityIds) {
      await prisma.propertyAmenity.deleteMany({ where: { propertyId: id } });
      await prisma.propertyAmenity.createMany({
        data: data.amenityIds.map((amenityId) => ({
          propertyId: id,
          amenityId,
        })),
      });
    }

    const { imageUrls, amenityIds, ...updateFields } = data;

    const updated = await prisma.property.update({
      where: { id },
      data: updateFields,
      include: {
        images: true,
        amenities: { include: { amenity: true } },
      },
    });

    await createAuditLog({
      req,
      action: 'PROPERTY_UPDATED',
      entityType: 'PROPERTY',
      entityId: id,
      details: updateFields,
    });

    res.status(200).json({
      success: true,
      message: 'Property updated successfully',
      data: { property: updated },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProperty = async (
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
    const property = await prisma.property.findUnique({ where: { id } });

    if (!property) {
      res.status(404).json({ success: false, message: 'Property not found' });
      return;
    }

    if (property.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this property.',
      });
      return;
    }

    await prisma.property.delete({ where: { id } });

    await createAuditLog({
      req,
      action: 'PROPERTY_DELETED',
      entityType: 'PROPERTY',
      entityId: id,
      details: { title: property.title },
    });

    res.status(200).json({
      success: true,
      message: 'Property deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const getOwnerProperties = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const properties = await prisma.property.findMany({
      where: { ownerId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        images: {
          orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }],
          take: 1,
        },
        _count: {
          select: {
            inquiries: true,
            visitRequests: true,
            favorites: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: { properties },
    });
  } catch (error) {
    next(error);
  }
};

export const uploadImagesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ success: false, message: 'No images uploaded' });
      return;
    }

    const uploadPromises = files.map((file) =>
      uploadPropertyImage(file.path, file.originalname)
    );

    const results = await Promise.all(uploadPromises);

    res.status(200).json({
      success: true,
      data: {
        images: results,
      },
    });
  } catch (error) {
    next(error);
  }
};
