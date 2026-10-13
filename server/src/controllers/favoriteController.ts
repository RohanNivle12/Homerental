import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';

export const getFavorites = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        property: {
          include: {
            images: {
              where: { isPrimary: true },
              take: 1,
            },
            owner: {
              select: { id: true, fullName: true, phone: true },
            },
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        favorites: favorites.map((f) => f.property),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const addFavorite = async (
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

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      res.status(404).json({ success: false, message: 'Property not found.' });
      return;
    }

    const favorite = await prisma.favorite.upsert({
      where: {
        userId_propertyId: {
          userId: req.user.id,
          propertyId,
        },
      },
      update: {},
      create: {
        userId: req.user.id,
        propertyId,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Property saved to favorites.',
      data: { favorite },
    });
  } catch (error) {
    next(error);
  }
};

export const removeFavorite = async (
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

    await prisma.favorite.deleteMany({
      where: {
        userId: req.user.id,
        propertyId,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Property removed from favorites.',
    });
  } catch (error) {
    next(error);
  }
};
