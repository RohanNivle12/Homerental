import {
  Property,
  SearchFilters,
  User,
  Inquiry,
  VisitRequest,
  Notification,
  Amenity,
  State,
  District,
  Subdistrict,
  Village,
  LocationSearchResult,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
}

class ApiError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Always send and receive HTTP-only cookies
  });

  const text = await response.text();
  let json: any = {};
  if (text) {
    try {
      json = JSON.parse(text);
    } catch (e) {
      json = { message: text };
    }
  }

  if (!response.ok) {
    const errorMsg = json.message || json.errors?.[0]?.message || `Request failed with status ${response.status}`;
    throw new ApiError(errorMsg, response.status, json);
  }

  return json.data !== undefined ? json.data : json;
}

// Authentication Service
export const authApi = {
  register: (data: any) => request<{ user: User; token: string }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: any) => request<{ user: User; token: string }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => request<{ success: boolean }>('/auth/logout', { method: 'POST' }),
  getMe: () => request<{ user: User; unreadNotifications: number; favoritePropertyIds: string[] }>('/auth/me'),
  forgotPassword: (email: string) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (data: any) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),
  changePassword: (data: any) => request('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),
  updateProfile: (data: any) => request<{ user: User }>('/auth/profile', { method: 'PATCH', body: JSON.stringify(data) }),
};

// Properties Service
export const propertyApi = {
  getProperties: (filters: SearchFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        params.append(key, String(val));
      }
    });
    return request<{ properties: Property[]; pagination: { total: number; page: number; limit: number; totalPages: number } }>(
      `/properties?${params.toString()}`
    );
  },
  getPropertyById: (id: string) => request<{ property: Property; similarProperties: Property[] }>(`/properties/${id}`),
  getPropertiesOnMap: (params: { neLat: number; neLng: number; swLat: number; swLng: number; minRent?: number; maxRent?: number }) => {
    const q = new URLSearchParams({
      neLat: String(params.neLat),
      neLng: String(params.neLng),
      swLat: String(params.swLat),
      swLng: String(params.swLng),
    });
    if (params.minRent) q.append('minRent', String(params.minRent));
    if (params.maxRent) q.append('maxRent', String(params.maxRent));
    return request<{ properties: any[] }>(`/properties/map?${q.toString()}`);
  },
  getOwnerProperties: () => request<{ properties: Property[] }>('/properties/owner/me'),
  createProperty: (data: any) => request<{ property: Property }>('/properties', { method: 'POST', body: JSON.stringify(data) }),
  updateProperty: (id: string, data: any) => request<{ property: Property }>(`/properties/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteProperty: (id: string) => request(`/properties/${id}`, { method: 'DELETE' }),
  uploadImages: async (files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    return request<{ images: { url: string; publicId?: string }[] }>('/properties/upload-images', {
      method: 'POST',
      body: formData,
    });
  },
};

// Favorites Service
export const favoriteApi = {
  getFavorites: () => request<{ favorites: Property[] }>('/favorites'),
  addFavorite: (propertyId: string) => request(`/favorites/${propertyId}`, { method: 'POST' }),
  removeFavorite: (propertyId: string) => request(`/favorites/${propertyId}`, { method: 'DELETE' }),
};

// Inquiries Service
export const inquiryApi = {
  createInquiry: (propertyId: string, message: string) =>
    request<{ inquiry: Inquiry }>(`/properties/${propertyId}/inquiries`, { method: 'POST', body: JSON.stringify({ message }) }),
  getTenantInquiries: () => request<{ inquiries: Inquiry[] }>('/tenant/inquiries'),
  getOwnerInquiries: () => request<{ inquiries: Inquiry[] }>('/owner/inquiries'),
  replyInquiry: (id: string, ownerReply: string) =>
    request<{ inquiry: Inquiry }>(`/inquiries/${id}/reply`, { method: 'PATCH', body: JSON.stringify({ ownerReply }) }),
};

// Visit Requests Service
export const visitApi = {
  createVisit: (propertyId: string, data: { visitDate: string; timeSlot: string; notes?: string }) =>
    request<{ visit: VisitRequest }>(`/properties/${propertyId}/visits`, { method: 'POST', body: JSON.stringify(data) }),
  getTenantVisits: () => request<{ visits: VisitRequest[] }>('/tenant/visits'),
  getOwnerVisits: () => request<{ visits: VisitRequest[] }>('/owner/visits'),
  updateVisitStatus: (id: string, status: 'ACCEPTED' | 'REJECTED' | 'COMPLETED', ownerNotes?: string) =>
    request<{ visit: VisitRequest }>(`/owner/visits/${id}`, { method: 'PATCH', body: JSON.stringify({ status, ownerNotes }) }),
  cancelVisit: (id: string) => request<{ visit: VisitRequest }>(`/visits/${id}/cancel`, { method: 'POST' }),
};

// Notifications Service
export const notificationApi = {
  getNotifications: () => request<{ notifications: Notification[] }>('/notifications'),
  markRead: (id: string) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () => request('/notifications/read-all', { method: 'PATCH' }),
};

// Admin Service
export const adminApi = {
  getOverview: () => request<any>('/admin/overview'),
  getUsers: (params: { page?: number; limit?: number; role?: string; status?: string; search?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.page) q.append('page', String(params.page));
    if (params.limit) q.append('limit', String(params.limit));
    if (params.role) q.append('role', params.role);
    if (params.status) q.append('status', params.status);
    if (params.search) q.append('search', params.search);
    return request<{ users: any[]; pagination: any }>(`/admin/users?${q.toString()}`);
  },
  updateUserStatus: (id: string, accountStatus: string) =>
    request(`/admin/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ accountStatus }) }),
  getProperties: (params: { page?: number; limit?: number; moderationStatus?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.page) q.append('page', String(params.page));
    if (params.limit) q.append('limit', String(params.limit));
    if (params.moderationStatus) q.append('moderationStatus', params.moderationStatus);
    return request<{ properties: any[]; pagination: any }>(`/admin/properties?${q.toString()}`);
  },
  updateModeration: (id: string, moderationStatus: string, rejectionReason?: string) =>
    request(`/admin/properties/${id}/moderation`, { method: 'PATCH', body: JSON.stringify({ moderationStatus, rejectionReason }) }),
  getReports: () => request<{ reports: any[] }>('/admin/reports'),
  updateReport: (id: string, status: string, adminNotes?: string, takeDownProperty?: boolean) =>
    request(`/admin/reports/${id}`, { method: 'PATCH', body: JSON.stringify({ status, adminNotes, takeDownProperty }) }),
  getOwnerVerifications: () => request<{ verifications: any[] }>('/admin/owner-verifications'),
  updateOwnerVerification: (id: string, status: string, rejectionReason?: string, adminNotes?: string) =>
    request(`/admin/owner-verifications/${id}`, { method: 'PATCH', body: JSON.stringify({ status, rejectionReason, adminNotes }) }),
  getAuditLogs: (params: { page?: number; limit?: number; action?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.page) q.append('page', String(params.page));
    if (params.limit) q.append('limit', String(params.limit));
    if (params.action) q.append('action', params.action);
    return request<{ logs: any[]; pagination: any }>(`/admin/audit-logs?${q.toString()}`);
  },
};

// User & Common Service
export const commonApi = {
  getAmenities: () => request<{ amenities: Amenity[] }>('/amenities'),
  reportProperty: (propertyId: string, reason: string, details?: string) =>
    request(`/properties/${propertyId}/report`, { method: 'POST', body: JSON.stringify({ reason, details }) }),
  submitOwnerVerification: (documentType: string, documentUrl: string) =>
    request('/owner/verify', { method: 'POST', body: JSON.stringify({ documentType, documentUrl }) }),
};

// India-Wide Location Service
export const locationApi = {
  getStates: () => request<{ states: State[] }>('/locations/states'),
  getDistricts: (stateId?: string, stateCode?: string) => {
    const q = new URLSearchParams();
    if (stateId) q.append('stateId', stateId);
    if (stateCode) q.append('stateCode', stateCode);
    return request<{ districts: District[] }>(`/locations/districts?${q.toString()}`);
  },
  getSubdistricts: (districtId: string) =>
    request<{ subdistricts: Subdistrict[] }>(`/locations/subdistricts?districtId=${districtId}`),
  getVillages: (params: { subdistrictId?: string; districtId?: string }) => {
    const q = new URLSearchParams();
    if (params.subdistrictId) q.append('subdistrictId', params.subdistrictId);
    if (params.districtId) q.append('districtId', params.districtId);
    return request<{ villages: Village[] }>(`/locations/villages?${q.toString()}`);
  },
  searchLocations: (query: string) =>
    request<{ results: LocationSearchResult[] }>(`/locations/search?q=${encodeURIComponent(query)}`),
  lookupPincode: (pincode: string) =>
    request<{ pincode: string; records: any[] }>(`/locations/pincode/${pincode}`),
  geocodeAddress: (query: string) =>
    request<{ results: any[] }>(`/locations/geocode?q=${encodeURIComponent(query)}`),
};

