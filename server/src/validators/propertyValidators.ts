import { z } from 'zod';

export const createPropertySchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(150),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  propertyType: z.enum(['APARTMENT', 'INDEPENDENT_HOUSE', 'VILLA', 'STUDIO', 'PENTHOUSE']),
  address: z.string().min(5, 'Address is required'),
  locality: z.string().min(2, 'Locality is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  postalCode: z.string().min(4, 'Postal code is required'),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  stateId: z.string().optional(),
  districtId: z.string().optional(),
  subdistrictId: z.string().optional(),
  villageId: z.string().optional(),
  monthlyRent: z.coerce.number().positive('Monthly rent must be positive'),
  securityDeposit: z.coerce.number().nonnegative('Security deposit cannot be negative'),
  bedrooms: z.coerce.number().int().min(1, 'Bedrooms must be at least 1').max(20),
  bathrooms: z.coerce.number().int().min(1, 'Bathrooms must be at least 1').max(20),
  area: z.coerce.number().int().positive('Area must be positive square feet'),
  furnishing: z.enum(['FURNISHED', 'SEMI_FURNISHED', 'UNFURNISHED']),
  availableFrom: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).transform((val) => val ? new Date(val) : new Date()),
  status: z.enum(['DRAFT', 'AVAILABLE', 'RENTED', 'PAUSED']).optional().default('AVAILABLE'),
  amenityIds: z.array(z.string()).optional().default([]),
  imageUrls: z.array(z.string()).optional().default([]),
});

export const updatePropertySchema = createPropertySchema.partial().extend({
  status: z.enum(['DRAFT', 'AVAILABLE', 'RENTED', 'PAUSED']).optional(),
});

export const propertyQuerySchema = z.object({
  city: z.string().optional(),
  locality: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  pincode: z.string().optional(),
  stateId: z.string().optional(),
  districtId: z.string().optional(),
  subdistrictId: z.string().optional(),
  villageId: z.string().optional(),
  search: z.string().optional(),
  minRent: z.coerce.number().optional(),
  maxRent: z.coerce.number().optional(),
  bedrooms: z.string().optional(), // Can be single number or comma separated e.g. "1,2,3"
  bathrooms: z.string().optional(),
  propertyType: z.string().optional(), // Comma separated or single
  furnishing: z.string().optional(),
  amenities: z.string().optional(), // Comma separated amenity names or IDs
  sortBy: z.enum(['newest', 'rent_asc', 'rent_desc', 'area_desc']).optional().default('newest'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(12),
  ownerVerifiedOnly: z.coerce.boolean().optional().default(false),
});

export const mapQuerySchema = z.object({
  neLat: z.coerce.number(),
  neLng: z.coerce.number(),
  swLat: z.coerce.number(),
  swLng: z.coerce.number(),
  minRent: z.coerce.number().optional(),
  maxRent: z.coerce.number().optional(),
  bedrooms: z.string().optional(),
  propertyType: z.string().optional(),
  furnishing: z.string().optional(),
});

export const radiusQuerySchema = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  radiusKm: z.coerce.number().positive().max(500).default(10),
  minRent: z.coerce.number().optional(),
  maxRent: z.coerce.number().optional(),
});
