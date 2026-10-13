import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { prisma } from './config/db';

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    // Verify database connectivity
    await prisma.$connect();
    console.log('✓ Successfully connected to HomeFinder database.');

    app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`🚀 HomeFinder API Server is running on port ${PORT}`);
      console.log(`📚 Swagger API Docs: http://localhost:${PORT}/api/docs`);
      console.log(`❤️  Health Check:     http://localhost:${PORT}/api/health`);
      console.log(`===============================================`);
    });
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
}

bootstrap();
