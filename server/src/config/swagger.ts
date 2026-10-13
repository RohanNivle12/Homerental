import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'HomeFinder API Documentation',
    version: '1.0.0',
    description: 'Production-ready REST API for HomeFinder Real Estate Rental Platform',
  },
  servers: [
    {
      url: 'http://localhost:5000/api',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'token',
      },
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        summary: 'Register a new Tenant or Property Owner account',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['fullName', 'email', 'password', 'confirmPassword', 'role'],
                properties: {
                  fullName: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  phone: { type: 'string' },
                  password: { type: 'string' },
                  confirmPassword: { type: 'string' },
                  role: { type: 'string', enum: ['TENANT', 'OWNER'] },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Registration successful' },
          400: { description: 'Validation failed' },
          409: { description: 'Email or phone already exists' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Login with email or phone',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['emailOrPhone', 'password'],
                properties: {
                  emailOrPhone: { type: 'string' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login successful' },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Get current authenticated user session',
        tags: ['Authentication'],
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: { description: 'User profile retrieved' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/properties': {
      get: {
        summary: 'Search & filter properties with pagination',
        tags: ['Properties'],
        parameters: [
          { name: 'city', in: 'query', schema: { type: 'string' } },
          { name: 'locality', in: 'query', schema: { type: 'string' } },
          { name: 'minRent', in: 'query', schema: { type: 'number' } },
          { name: 'maxRent', in: 'query', schema: { type: 'number' } },
          { name: 'bedrooms', in: 'query', schema: { type: 'string' } },
          { name: 'propertyType', in: 'query', schema: { type: 'string' } },
          { name: 'furnishing', in: 'query', schema: { type: 'string' } },
          { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['newest', 'rent_asc', 'rent_desc'] } },
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
        responses: {
          200: { description: 'Filtered properties list' },
        },
      },
      post: {
        summary: 'Create a new property listing (Owner/Admin)',
        tags: ['Properties'],
        security: [{ cookieAuth: [] }],
        responses: {
          201: { description: 'Property listing created' },
        },
      },
    },
    '/properties/map': {
      get: {
        summary: 'Get property map markers within a bounding box',
        tags: ['Properties'],
        parameters: [
          { name: 'neLat', in: 'query', required: true, schema: { type: 'number' } },
          { name: 'neLng', in: 'query', required: true, schema: { type: 'number' } },
          { name: 'swLat', in: 'query', required: true, schema: { type: 'number' } },
          { name: 'swLng', in: 'query', required: true, schema: { type: 'number' } },
        ],
        responses: {
          200: { description: 'Array of property map markers' },
        },
      },
    },
    '/properties/{id}': {
      get: {
        summary: 'Get complete property details by ID',
        tags: ['Properties'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Property details' },
          404: { description: 'Not found' },
        },
      },
    },
    '/admin/overview': {
      get: {
        summary: 'Get platform analytics overview',
        tags: ['Administration'],
        security: [{ cookieAuth: [] }],
        responses: {
          200: { description: 'Platform statistics' },
          403: { description: 'Forbidden (Admin role required)' },
        },
      },
    },
  },
};

export const setupSwagger = (app: Express): void => {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};
