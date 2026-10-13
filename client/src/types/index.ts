export type Role = 'TENANT' | 'OWNER' | 'ADMIN';

export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';

export type PropertyType =
  | 'APARTMENT'
  | 'INDEPENDENT_HOUSE'
  | 'VILLA'
  | 'STUDIO'
  | 'PENTHOUSE';

export type FurnishingStatus = 'FURNISHED' | 'SEMI_FURNISHED' | 'UNFURNISHED';

export type PropertyStatus = 'DRAFT' | 'AVAILABLE' | 'RENTED' | 'PAUSED';

export type ModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type InquiryStatus = 'NEW' | 'RESPONDED' | 'CLOSED';

export type VisitStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'COMPLETED';

export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: Role;
  accountStatus: AccountStatus;
  avatarUrl: string | null;
  createdAt: string;
  ownerVerification?: {
    status: VerificationStatus;
    documentType?: string;
  } | null;
}

export interface Amenity {
  id: string;
  name: string;
  iconKey: string;
  category: string;
}

export interface PropertyImage {
  id: string;
  url: string;
  publicId?: string | null;
  isPrimary: boolean;
  order: number;
}

export interface Property {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  propertyType: PropertyType;
  address: string;
  locality: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  monthlyRent: number | string;
  securityDeposit: number | string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  furnishing: FurnishingStatus;
  availableFrom: string;
  status: PropertyStatus;
  stateId?: string | null;
  districtId?: string | null;
  subdistrictId?: string | null;
  villageId?: string | null;
  moderationStatus: ModerationStatus;
  rejectionReason?: string | null;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
  images: PropertyImage[];
  amenities?: { amenity: Amenity }[];
  owner?: {
    id: string;
    fullName: string;
    phone?: string | null;
    avatarUrl?: string | null;
    createdAt?: string;
    ownerVerification?: {
      status: VerificationStatus;
    } | null;
  };
  _count?: {
    inquiries: number;
    visitRequests: number;
    favorites: number;
  };
}

export interface Inquiry {
  id: string;
  propertyId: string;
  tenantId: string;
  message: string;
  ownerReply?: string | null;
  status: InquiryStatus;
  createdAt: string;
  updatedAt: string;
  property?: Property;
  tenant?: User;
}

export interface VisitRequest {
  id: string;
  propertyId: string;
  tenantId: string;
  visitDate: string;
  timeSlot: string;
  notes?: string | null;
  ownerNotes?: string | null;
  status: VisitStatus;
  createdAt: string;
  updatedAt: string;
  property?: Property;
  tenant?: User;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  linkUrl?: string | null;
  createdAt: string;
}

export interface PropertyReport {
  id: string;
  propertyId: string;
  reporterId: string;
  reason: string;
  details?: string | null;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  adminNotes?: string | null;
  createdAt: string;
  reporter?: User;
  property?: Property;
}

export interface OwnerVerification {
  id: string;
  userId: string;
  documentType: string;
  documentUrl: string;
  status: VerificationStatus;
  rejectionReason?: string | null;
  adminNotes?: string | null;
  createdAt: string;
  user?: User;
}

export interface AuditLog {
  id: string;
  performedById?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: string | null;
  ipAddress?: string | null;
  createdAt: string;
  performedBy?: User | null;
}

export interface SearchFilters {
  city?: string;
  locality?: string;
  state?: string;
  postalCode?: string;
  pincode?: string;
  stateId?: string;
  districtId?: string;
  subdistrictId?: string;
  villageId?: string;
  search?: string;
  minRent?: number;
  maxRent?: number;
  bedrooms?: string;
  bathrooms?: string;
  propertyType?: string;
  furnishing?: string;
  amenities?: string;
  sortBy?: 'newest' | 'rent_asc' | 'rent_desc' | 'area_desc';
  page?: number;
  limit?: number;
  ownerVerifiedOnly?: boolean;
}

export interface State {
  id: string;
  code: string;
  name: string;
  type: 'STATE' | 'UT';
  _count?: {
    districts: number;
    properties: number;
  };
}

export interface District {
  id: string;
  stateId: string;
  name: string;
  headquarters?: string | null;
  _count?: {
    subdistricts: number;
    properties: number;
  };
}

export interface Subdistrict {
  id: string;
  districtId: string;
  name: string;
  _count?: {
    villages: number;
    properties: number;
  };
}

export interface Village {
  id: string;
  subdistrictId: string;
  name: string;
  isUrban: boolean;
  _count?: {
    properties: number;
  };
}

export interface LocationSearchResult {
  type: 'STATE' | 'DISTRICT' | 'SUBDISTRICT' | 'VILLAGE' | 'PINCODE';
  id: string;
  name: string;
  breadcrumb: string;
  stateId?: string;
  stateName?: string;
  districtId?: string;
  districtName?: string;
  subdistrictId?: string;
  subdistrictName?: string;
  villageId?: string;
  villageName?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
}

