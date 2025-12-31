import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { json, urlencoded } from 'express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

async function bootstrap() {
<<<<<<< HEAD
  const app = await NestFactory.create(AppModule);
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  const configService = app.get(ConfigService);
  const port = configService.get('PORT') || 8000;

  app.setGlobalPrefix('api');

  // Increase payload limit
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // CORS
  const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://18.60.109.68:5173',
    'http://manindra-devops.s3-website.ap-south-2.amazonaws.com',
    'https://d2oivjm33gyjn0.cloudfront.net',
    configService.get('FRONTEND_URL')
  ].filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      // Allow if in list or if development (assuming 'development' is default check)
      // The string checking logic from original: allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development'
      // We can replicate that.
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        console.log('Blocked by CORS (permissive mode):', origin);
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
=======
  try {
    const app = await NestFactory.create(AppModule);
    app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

    const configService = app.get(ConfigService);
    const port = configService.get('PORT') || 8000;

    app.setGlobalPrefix('api');

    app.use(json({ limit: '50mb' }));
    app.use(urlencoded({ extended: true, limit: '50mb' }));

    app.enableCors({
      origin: (origin, callback) => {
        const allowedOrigins = [
          'http://localhost:5173',
          'http://127.0.0.1:5173',
          'http://localhost:5174',
          'http://127.0.0.1:5174',
          configService.get('FRONTEND_URL'),
        ];
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, true);
        }
      },
      credentials: true,
    });

    await app.listen(port, '0.0.0.0');
    console.log(`Application is running on: ${await app.getUrl()}`);
  } catch (err) {
    console.error('SERVER BOOTSTRAP ERROR:', err);
  }
>>>>>>> ba977d1 (fix: resolve online status race condition, add active orders endpoint, impl api logging)
}
bootstrap();
