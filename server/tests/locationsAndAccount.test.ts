import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/db';

describe('HomeFinder — Location Hierarchy & Account Upgrade Tests', () => {
  let tenantCookie: string;
  let ownerCookie: string;
  let adminCookie: string;
  let createdPropertyId: string;

  beforeAll(async () => {
    // Authenticate Tenant
    const tenantLogin = await request(app)
      .post('/api/auth/login')
      .send({ emailOrPhone: 'rahul.mehta@homefinder.com', password: 'Tenant@123456' });
    tenantCookie = tenantLogin.headers['set-cookie']?.[0] || '';

    // Authenticate Owner
    const ownerLogin = await request(app)
      .post('/api/auth/login')
      .send({ emailOrPhone: 'rajesh.sharma@homefinder.com', password: 'Owner@123456' });
    ownerCookie = ownerLogin.headers['set-cookie']?.[0] || '';

    // Authenticate Admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ emailOrPhone: 'admin@homefinder.com', password: 'Admin@123456' });
    adminCookie = adminLogin.headers['set-cookie']?.[0] || '';
  });

  describe('1. India-Wide Location Hierarchy API', () => {
    it('GET /api/locations/states should return all 36 Indian States and Union Territories', async () => {
      const res = await request(app).get('/api/locations/states');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.states.length).toBe(36);

      const stateNames = res.body.data.states.map((s: any) => s.name);
      expect(stateNames).toContain('Maharashtra');
      expect(stateNames).toContain('Karnataka');
      expect(stateNames).toContain('Delhi');
      expect(stateNames).toContain('Uttar Pradesh');
      expect(stateNames).toContain('Tamil Nadu');
    });

    it('GET /api/locations/districts should return districts belonging to Maharashtra', async () => {
      const mh = await prisma.state.findUnique({ where: { code: 'MH' } });
      expect(mh).toBeDefined();

      const res = await request(app).get(`/api/locations/districts?stateId=${mh!.id}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.districts.length).toBeGreaterThan(5);

      const districtNames = res.body.data.districts.map((d: any) => d.name);
      expect(districtNames).toContain('Kolhapur');
      expect(districtNames).toContain('Nashik');
      expect(districtNames).toContain('Pune');
      expect(districtNames).toContain('Mumbai Suburban');
    });

    it('GET /api/locations/subdistricts should return talukas/tehsils for Kolhapur district', async () => {
      const mh = await prisma.state.findUnique({ where: { code: 'MH' } });
      const kolhapur = await prisma.district.findFirst({
        where: { stateId: mh!.id, name: 'Kolhapur' },
      });
      expect(kolhapur).toBeDefined();

      const res = await request(app).get(`/api/locations/subdistricts?districtId=${kolhapur!.id}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const subNames = res.body.data.subdistricts.map((s: any) => s.name);
      expect(subNames).toContain('Hatkanangale');
      expect(subNames).toContain('Karveer');
      expect(subNames).toContain('Shirol');
    });

    it('GET /api/locations/villages should return settlements including Ichalkaranji in Hatkanangale taluka', async () => {
      const hatkanangale = await prisma.subdistrict.findFirst({
        where: { name: 'Hatkanangale' },
      });
      expect(hatkanangale).toBeDefined();

      const res = await request(app).get(`/api/locations/villages?subdistrictId=${hatkanangale!.id}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const villageNames = res.body.data.villages.map((v: any) => v.name);
      expect(villageNames).toContain('Ichalkaranji');
      expect(villageNames).toContain('Hupari');
    });

    it('GET /api/locations/villages should return Musalgaon MIDC in Sinnar taluka, Nashik', async () => {
      const sinnar = await prisma.subdistrict.findFirst({
        where: { name: 'Sinnar' },
      });
      expect(sinnar).toBeDefined();

      const res = await request(app).get(`/api/locations/villages?subdistrictId=${sinnar!.id}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const villageNames = res.body.data.villages.map((v: any) => v.name);
      expect(villageNames).toContain('Musalgaon MIDC');
      expect(villageNames).toContain('Sinnar');
    });

    it('GET /api/locations/pincode/416115 should return accurate directory information', async () => {
      const res = await request(app).get('/api/locations/pincode/416115');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.records.length).toBeGreaterThan(0);
      expect(res.body.data.records[0].taluk).toBe('Hatkanangale');
      expect(res.body.data.records[0].districtName).toBe('Kolhapur');
    });

    it('GET /api/locations/search should search across levels with breadcrumbs', async () => {
      const res = await request(app).get('/api/locations/search?q=Nipani');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.results.length).toBeGreaterThan(0);

      const nipani = res.body.data.results.find((r: any) => r.name.includes('Nipani'));
      expect(nipani).toBeDefined();
      expect(nipani.breadcrumb).toContain('Belagavi');
    });
  });

  describe('2. Post Free Property with Cascading Location & Hierarchy Enforcement', () => {
    it('POST /api/properties should reject property if district does not belong to selected state', async () => {
      const mh = await prisma.state.findUnique({ where: { code: 'MH' } });
      const ka = await prisma.state.findUnique({ where: { code: 'KA' } });
      const belagavi = await prisma.district.findFirst({ where: { stateId: ka!.id, name: 'Belagavi' } });

      const res = await request(app)
        .post('/api/properties')
        .set('Cookie', ownerCookie)
        .send({
          title: 'Mismatch Test House 2 BHK',
          description: 'Testing administrative mismatch rejection for security.',
          propertyType: 'APARTMENT',
          address: 'Main Road',
          locality: 'Central',
          city: 'Belagavi',
          state: 'Maharashtra',
          postalCode: '591237',
          stateId: mh!.id, // State: Maharashtra
          districtId: belagavi!.id, // District: Belagavi (belongs to Karnataka)
          latitude: 16.36,
          longitude: 74.38,
          monthlyRent: 15000,
          securityDeposit: 30000,
          bedrooms: 2,
          bathrooms: 2,
          area: 950,
          furnishing: 'SEMI_FURNISHED',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('District does not belong to the selected State');
    });

    it('POST /api/properties should successfully persist property with verified LGD location IDs', async () => {
      const mh = await prisma.state.findUnique({ where: { code: 'MH' } });
      const kolhapur = await prisma.district.findFirst({ where: { stateId: mh!.id, name: 'Kolhapur' } });
      const hatkanangale = await prisma.subdistrict.findFirst({ where: { districtId: kolhapur!.id, name: 'Hatkanangale' } });
      const ichalkaranji = await prisma.village.findFirst({ where: { subdistrictId: hatkanangale!.id, name: 'Ichalkaranji' } });

      const res = await request(app)
        .post('/api/properties')
        .set('Cookie', ownerCookie)
        .send({
          title: 'Spacious 2 BHK in Ichalkaranji Textile Hub',
          description: 'Well-ventilated residential flat located in Jawahar Nagar, Ichalkaranji with parking.',
          propertyType: 'APARTMENT',
          address: 'Plot 45, Jawahar Nagar, Near Gandhi Camp',
          locality: 'Jawahar Nagar',
          city: 'Ichalkaranji',
          state: 'Maharashtra',
          postalCode: '416115',
          stateId: mh!.id,
          districtId: kolhapur!.id,
          subdistrictId: hatkanangale!.id,
          villageId: ichalkaranji!.id,
          latitude: 16.7005,
          longitude: 74.4623,
          monthlyRent: 14000,
          securityDeposit: 35000,
          bedrooms: 2,
          bathrooms: 2,
          area: 1050,
          furnishing: 'SEMI_FURNISHED',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.property.id).toBeDefined();
      expect(res.body.data.property.stateId).toBe(mh!.id);
      expect(res.body.data.property.districtId).toBe(kolhapur!.id);
      createdPropertyId = res.body.data.property.id;
    });

    it('GET /api/properties should filter listings by districtId', async () => {
      const mh = await prisma.state.findUnique({ where: { code: 'MH' } });
      const kolhapur = await prisma.district.findFirst({ where: { stateId: mh!.id, name: 'Kolhapur' } });

      const res = await request(app).get(`/api/properties?districtId=${kolhapur!.id}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.properties.length).toBeGreaterThan(0);
      expect(res.body.data.properties.some((p: any) => p.id === createdPropertyId)).toBe(true);
    });
  });

  describe('3. Clean Login & Role Authorization', () => {
    it('POST /api/auth/login should authenticate user and return role from backend without client choosing role', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ emailOrPhone: 'rajesh.sharma@homefinder.com', password: 'Owner@123456' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('OWNER');
    });

    it('POST /api/auth/login should correctly identify ADMIN role', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ emailOrPhone: 'admin@homefinder.com', password: 'Admin@123456' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('ADMIN');
    });
  });

  describe('4. Account & Profile Updates with Role Tampering Protection', () => {
    it('PATCH /api/auth/profile should update full name and phone number', async () => {
      const res = await request(app)
        .patch('/api/auth/profile')
        .set('Cookie', tenantCookie)
        .send({
          fullName: 'Rahul Mehta Updated',
          phone: '+919876543299',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.fullName).toBe('Rahul Mehta Updated');
    });

    it('PATCH /api/auth/profile must NOT allow user to escalate role to ADMIN', async () => {
      const res = await request(app)
        .patch('/api/auth/profile')
        .set('Cookie', tenantCookie)
        .send({
          fullName: 'Rahul Mehta Attacker',
          role: 'ADMIN', // Malicious attempt to escalate privileges
        });

      expect(res.status).toBe(200);
      // Role MUST remain unchanged as TENANT
      expect(res.body.data.user.role).toBe('TENANT');

      const dbUser = await prisma.user.findFirst({
        where: { email: 'rahul.mehta@homefinder.com' },
      });
      expect(dbUser?.role).toBe('TENANT');
    });

    it('POST /api/auth/change-password should reject incorrect current password', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', tenantCookie)
        .send({
          currentPassword: 'WrongPassword@999',
          newPassword: 'NewTenantPassword@123',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Current password is incorrect');
    });
  });
});
