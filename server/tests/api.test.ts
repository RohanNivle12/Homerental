import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app';

describe('HomeFinder API Test Suite', () => {
  let tenantCookie: string;
  let ownerCookie: string;
  let adminCookie: string;
  let testPropertyId: string;
  let ownerVisitId: string;

  // 1. Health check
  it('GET /api/health should return ok status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('HomeFinder Backend API');
  });

  // 2. Authentication & Security
  describe('Authentication & RBAC', () => {
    it('POST /api/auth/register should reject attempt to register as ADMIN', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Hacker Admin',
          email: 'hacker@test.com',
          password: 'Password@123',
          confirmPassword: 'Password@123',
          role: 'ADMIN',
        });
      expect([400, 403]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/auth/login should fail with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          emailOrPhone: 'admin@homefinder.com',
          password: 'WrongPassword@123',
        });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/auth/login should log in Admin and set cookie', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          emailOrPhone: 'admin@homefinder.com',
          password: 'Admin@123456',
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('ADMIN');

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      adminCookie = cookies[0];
    });

    it('POST /api/auth/login should log in Tenant and set cookie', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          emailOrPhone: 'rahul.mehta@homefinder.com',
          password: 'Tenant@123456',
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('TENANT');

      const cookies = res.headers['set-cookie'];
      tenantCookie = cookies[0];
    });

    it('POST /api/auth/login should log in Owner and set cookie', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          emailOrPhone: 'rajesh.sharma@homefinder.com',
          password: 'Owner@123456',
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('OWNER');

      const cookies = res.headers['set-cookie'];
      ownerCookie = cookies[0];
    });

    it('GET /api/auth/me should restore session from cookie', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', tenantCookie);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('rahul.mehta@homefinder.com');
      expect(res.body.data.user.role).toBe('TENANT');
    });

    it('POST /api/auth/register should reject duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Duplicate Rahul',
          email: 'rahul.mehta@homefinder.com',
          password: 'Password@123',
          confirmPassword: 'Password@123',
          role: 'TENANT',
        });
      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });
  });

  // 3. Properties & Search
  describe('Properties & Map Search', () => {
    it('GET /api/properties should return seeded rental properties', async () => {
      const res = await request(app).get('/api/properties');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.properties.length).toBeGreaterThan(0);
      testPropertyId = res.body.data.properties[0].id;
    });

    it('GET /api/properties?city=Bangalore should filter by city', async () => {
      const res = await request(app).get('/api/properties?city=Bangalore');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      res.body.data.properties.forEach((p: any) => {
        expect(p.city.toLowerCase()).toContain('bangalore');
      });
    });

    it('GET /api/properties/map with bounding box should return coordinates', async () => {
      const res = await request(app).get(
        '/api/properties/map?swLat=12.8&swLng=77.5&neLat=13.1&neLng=77.8'
      );
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.properties.length).toBeGreaterThan(0);
      const marker = res.body.data.properties[0];
      expect(marker.latitude).toBeDefined();
      expect(marker.longitude).toBeDefined();
    });

    it('GET /api/properties/:id should return complete property details', async () => {
      const res = await request(app).get(`/api/properties/${testPropertyId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.property.id).toBe(testPropertyId);
      expect(res.body.data.property.owner).toBeDefined();
      expect(res.body.data.property.amenities).toBeDefined();
    });
  });

  // 4. Visit Scheduling Workflow
  describe('Visit Scheduling & Inquiries', () => {
    it('GET /api/owner/visits should list owner visits', async () => {
      const res = await request(app)
        .get('/api/owner/visits')
        .set('Cookie', ownerCookie);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.visits)).toBe(true);
      if (res.body.data.visits.length > 0) {
        ownerVisitId = res.body.data.visits[0].id;
      }
    });

    it('PATCH /api/owner/visits/:id should allow owner to update their visit status', async () => {
      if (ownerVisitId) {
        const res = await request(app)
          .patch(`/api/owner/visits/${ownerVisitId}`)
          .set('Cookie', ownerCookie)
          .send({
            status: 'ACCEPTED',
            ownerNotes: 'Confirmed visit via automated test.',
          });
        expect(res.status).toBe(200);
        expect(res.body.data.visit.status).toBe('ACCEPTED');
      }
    });

    it('GET /api/tenant/visits should list tenant visits', async () => {
      const res = await request(app)
        .get('/api/tenant/visits')
        .set('Cookie', tenantCookie);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.visits)).toBe(true);
    });
  });

  // 5. Admin Dashboard & Moderation
  describe('Admin Control & Audit Logs', () => {
    it('GET /api/admin/overview should reject Tenant with 403', async () => {
      const res = await request(app)
        .get('/api/admin/overview')
        .set('Cookie', tenantCookie);
      expect(res.status).toBe(403);
    });

    it('GET /api/admin/overview should allow Admin and return platform stats', async () => {
      const res = await request(app)
        .get('/api/admin/overview')
        .set('Cookie', adminCookie);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalUsers).toBeGreaterThan(0);
      expect(res.body.data.totalProperties).toBeGreaterThan(0);
    });

    it('GET /api/admin/users should return paginated users list', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Cookie', adminCookie);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.users.length).toBeGreaterThan(0);
    });

    it('GET /api/admin/audit-logs should return recorded audit logs', async () => {
      const res = await request(app)
        .get('/api/admin/audit-logs')
        .set('Cookie', adminCookie);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.logs)).toBe(true);
    });
  });
});
