# 🏡 HomeFinder — Full-Stack Zero-Brokerage Home Rental Platform

**HomeFinder** is a production-oriented, full-stack real-estate rental platform inspired by **NoBroker**. The application connects home seekers directly with verified homeowners with zero brokerage, provides interactive Google Maps geographic exploration with stored database coordinates, supports a complete visit scheduling and inquiry workflow, and includes role-based administration with moderation and audit logging.

---

## 🌟 Key Features

### 1. Tenant / Home Seeker
- **Zero-Brokerage Discovery**: Browse and search rental homes in Bangalore, Mumbai, Delhi, Gurgaon, and Hyderabad.
- **Multi-Criteria Search**: Filter homes by monthly rent, bedrooms (1–4+ BHK), property type, furnishing status, amenities, and verified owner status.
- **Interactive Google Maps**: Explore properties on Google Maps with real coordinates, custom markers, bounds panning, and synchronized card/marker highlighting. (Graceful fallback active if API key is not supplied).
- **Save Favorites**: Fast, optimistic bookmarking of properties to personal favorites.
- **Property Details & Gallery**: Multi-image carousel with thumbnails, detailed specifications, amenities grid, and neighborhood map.
- **Visit Scheduling**: Pick date and time slots online; automatic conflict detection and live status tracking (`PENDING`, `ACCEPTED`, `REJECTED`, `CANCELLED`).
- **Owner Inquiries**: Direct messaging system between tenants and homeowners.
- **Listing Reports**: Report misleading, fraudulent, or rented listings to platform administrators.
- **Tenant Dashboard**: Dedicated dashboard for visits, saved homes, inquiry history, notifications, and profile security.

### 2. Property Owner / Landlord
- **Free Property Listing Wizard**: 4-step wizard to create listings with title, description, address, amenities, and Cloudinary/local image upload.
- **Map Location Picker**: Search addresses via Google Places or drag the pin to pinpoint exact gate/entrance coordinates stored in the database.
- **Listing Management**: Switch listing status (`AVAILABLE`, `RENTED`, `PAUSED`, `DRAFT`), edit, or delete personal listings with strict IDOR ownership checks.
- **Appointment Manager**: Review incoming tenant visit requests with options to accept or decline with notes.
- **Inquiry Reply System**: Reply directly to prospective tenants.
- **Verified Landlord Badge**: Upload ID or property deed proofs for admin review to earn the Verified Landlord badge.

### 3. Administrator
- **Secure Admin Portal**: Dedicated dashboard with metrics (total users, tenants, owners, active properties, pending moderation, reported properties, and visits).
- **Listing Moderation**: Review, approve, or reject new properties with feedback.
- **User Management**: Search users across roles, activate or suspend offending accounts.
- **Property Report Moderation**: Investigate flagged properties with one-click listing takedown.
- **Owner Verification Workflow**: Inspect submitted identity documents and grant verified status.
- **Audit Logging**: Comprehensive audit trail recording actor, action, entity, IP address, and timestamps.
- **Swagger API Documentation**: Interactive OpenAPI 3.0 documentation served at `/api/docs`.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, `@googlemaps/js-api-loader`.
- **Backend**: Node.js, Express.js, TypeScript, Cookie-Parser, Helmet, CORS, Morgan, Express-Rate-Limit.
- **Database & ORM**: Prisma ORM with MySQL 8.0 (configured and running locally on PC) and PostgreSQL cloud deployment readiness.
- **Authentication**: JWT stored in secure `HTTP-only` cookies, bcrypt password hashing, and role-based middleware (`requireRole`).
- **Validation**: Zod (client-side and server-side).
- **Image Storage**: Cloudinary SDK with automatic local storage fallback (`/uploads`).
- **Maps**: Google Maps JavaScript API, Places API, and Geocoding with interactive coordinate fallback.
- **Testing**: Vitest & Supertest automated test suite (19 passing integration tests).

---

## 🔑 Demo Accounts (Pre-Seeded)

The database comes pre-seeded with verified test accounts across all three roles:

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@homefinder.com` | `Admin@123456` | Platform moderation, audit logs, user management |
| **Landlord (Bangalore)** | `rajesh.sharma@homefinder.com` | `Owner@123456` | Verified landlord with properties in Indiranagar & Koramangala |
| **Landlord (Mumbai)** | `priya.patel@homefinder.com` | `Owner@123456` | Verified landlord with properties in Bandra West & Powai |
| **Tenant (Bangalore)** | `rahul.mehta@homefinder.com` | `Tenant@123456` | Tenant with active scheduled visit and inquiry |
| **Tenant (Mumbai)** | `sneha.reddy@homefinder.com` | `Tenant@123456` | Tenant searching in Mumbai |

*(Quick demo login buttons are provided on the Sign In page for one-click testing)*

---

## 🚀 Windows PowerShell Quickstart

### 1. Prerequisites
- Node.js (v18+ or v24+)
- MySQL 8.0 (installed and running locally on port 3306)
- Git

### 2. Database Setup
The application is pre-configured for your local MySQL instance:
- Service: `MySQL80` (Running on port 3306)
- Database: `homefinder`
- Connection URL: `mysql://root:manager@localhost:3306/homefinder`

*(If your MySQL root password differs, update `DATABASE_URL` in `.env` and `server/.env`)*

### 3. Synchronize Schema & Seed Data
Run the following in PowerShell from `f:\Homerental`:
```powershell
# Sync database tables
npx --prefix server prisma db push --schema=server/prisma/schema.prisma

# Seed demo users, properties, and visits
npx --prefix server ts-node server/prisma/seed.ts
```

### 4. Run Development Servers
Open two terminal windows:

**Terminal 1 (Backend Server on Port 5000):**
```powershell
npm --prefix server run dev
```

**Terminal 2 (Frontend Client on Port 5173):**
```powershell
npm --prefix client run dev
```

Visit the application at: **`http://localhost:5173`**
Swagger API Documentation: **`http://localhost:5000/api/docs`**
API Health Check: **`http://localhost:5000/api/health`**

---

## 🧪 Automated Testing & Production Builds

### Run Backend Integration Tests
```powershell
npm --prefix server test
```
*Executes all 19 integration tests covering registration, login, JWT cookies, RBAC authorization, property filtering, bounding-box map endpoint, visit requests, conflict prevention, and admin moderation.*

### Run Production Builds
```powershell
# Compile Backend TypeScript
npm --prefix server run build

# Bundle Frontend Vite SPA
npm --prefix client run build
```

---

## 🌐 External Services Configuration

### Google Maps API (Optional)
The application works immediately out-of-the-box with an **Interactive Coordinates View** displaying real database coordinates. To enable satellite/street Google Maps:
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project and enable:
   - **Maps JavaScript API**
   - **Places API**
   - **Geocoding API**
3. Generate an API Key and restrict it by HTTP referrer (`http://localhost:5173/*`).
4. Add the key in `client/.env`:
   ```env
   VITE_GOOGLE_MAPS_API_KEY=AIzaSy...
   ```

### Cloudinary Image Storage (Optional)
If Cloudinary credentials are not provided, images uploaded by landlords are automatically saved locally into `server/uploads/` and served via `/uploads/`:
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## ☁️ Deployment Guide

### Deploying to Production:
1. **Database**: Use a managed cloud PostgreSQL or MySQL database (e.g. Neon.tech, Supabase, Railway, AWS RDS, or PlanetScale).
   - In `server/prisma/schema.prisma`, adjust `provider = "postgresql"` or `provider = "mysql"` to match your provider.
   - Run `npx prisma db push`.
2. **Backend**: Deploy `server/` to Render, Railway, or Heroku.
   - Set environment variables (`DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `NODE_ENV=production`).
   - Cookies automatically switch to `SameSite=Strict` and `Secure=true`.
3. **Frontend**: Deploy `client/` to Vercel, Netlify, or Cloudflare Pages.
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Set `VITE_API_URL` to your production backend URL (e.g., `https://api.yourdomain.com/api`).
