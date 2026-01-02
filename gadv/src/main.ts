import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// import { createDatabaseIfNotExists } from './common/database/init';
import { AppDataSource } from './common/database/data-source';
import { seedAdminUser } from './common/database/seeders/AdminSeeder';
import { seedPermissions } from './common/database/seeders/PermissionsSeeder';
import { seedCaissePrincipale } from './common/database/seeders/CaisseSeeder';
import { seedNumerotations } from './common/database/seeders/NumerotationSeeder';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigModule } from '@nestjs/config';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { Request, Response } from 'express';
import * as dotenv from 'dotenv';
import { existsSync, mkdirSync } from 'fs';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

// Charger le fichier .env
dotenv.config();


async function bootstrap() {
  try {

    await AppDataSource.initialize();

    // Run migrations
    console.log('🔄 Running database migrations...');
    await AppDataSource.runMigrations();
    console.log('✅ Migrations completed successfully');

    await new Promise(resolve => setTimeout(resolve, 1000));


    try {
      await seedAdminUser(AppDataSource);
    } catch (error) {
      console.error('Error seeding admin user:', error);
    }

    try {
      await seedPermissions(AppDataSource);
    } catch (error) {
      console.error('Error seeding permissions:', error);
    }

    try {
      await seedCaissePrincipale(AppDataSource);
    } catch (error) {
      console.error('Error seeding caisse principale:', error);
    }

    try {
      await seedNumerotations(AppDataSource);
    } catch (error) {
      console.error('Error seeding numerotations:', error);
    }

    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    // Use global exception filter to catch multer errors
    app.useGlobalFilters(new AllExceptionsFilter());

    // Ensure uploads directory exists
    const uploadsDir = join(process.cwd(), 'uploads');
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true });
      console.log('Created uploads directory:', uploadsDir);
    }

    // Set global prefix for all routes
    app.setGlobalPrefix('api');

    // Enable validation pipe with French error messages
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const messages = errors.map((error) => {
          const constraints = error.constraints;
          if (constraints) {
            return Object.values(constraints)[0];
          }
          return 'Erreur de validation';
        });

        return new BadRequestException(messages);
      },
    }));

    // Handle CORS preflight requests
    app.use((req: Request, res: Response, next) => {
      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
        res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, X-Requested-With, Origin');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Max-Age', '86400'); // 24 hours
        return res.status(200).end();
      }

      next();
    });

    // Serve static files from uploads directory
    // In production, serve with /api/uploads/ prefix, in development with /uploads/
    const isProduction = process.env.NODE_ENV === 'production';
    const uploadsPrefix = isProduction ? '/api/uploads/' : '/uploads/';

    app.useStaticAssets(join(process.cwd(), 'uploads'), {
      prefix: uploadsPrefix,
    });

    // Configuration CORS - Allow both development and production
    const isDevelopment = process.env.NODE_ENV !== 'production';

    // Parse CORS origins from environment variable or use defaults
    const corsOriginsEnv = process.env.CORS_ORIGINS;
    const defaultOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'http://localhost:8080',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:8080',
    ];

    const allowedOrigins = corsOriginsEnv
      ? [...defaultOrigins, ...corsOriginsEnv.split(',').map(origin => origin.trim())]
      : defaultOrigins;


    app.enableCors({
      origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
          return callback(null, true);
        }

        // In development, be more permissive with localhost origins
        if (isDevelopment && origin && (
          origin.startsWith('http://localhost:') ||
          origin.startsWith('http://127.0.0.1:') ||
          origin.startsWith('https://localhost:') ||
          origin.startsWith('https://127.0.0.1:')
        )) {
          return callback(null, true);
        }

        // Check if origin is in allowed list
        if (allowedOrigins.indexOf(origin) !== -1) {
          return callback(null, true);
        } else {
          return callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-Requested-With', 'Origin'],
      exposedHeaders: ['Authorization'],
      optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
    });



    const port = process.env.PORT || 5000;
    await app.listen(port);
    console.log(`Application démarrée sur le port ${port}`);
  } catch (error) {
    console.error('Erreur lors du démarrage de l\'application:', error);
    process.exit(1);
  }
}
bootstrap();
