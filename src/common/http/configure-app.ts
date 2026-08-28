import {
  INestApplication,
  RequestMethod,
  ValidationPipe,
} from '@nestjs/common';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { ApiExceptionFilter } from '../filters/api-exception.filter';

export function configureApp(app: INestApplication) {
  const config = app.get(ConfigService);
  const nodeEnv = config.get<string>('NODE_ENV', 'development');
  const origins = config.get<string[]>('ALLOWED_ORIGINS') ?? [];

  if (nodeEnv === 'production') {
    const http = app.getHttpAdapter().getInstance() as {
      set: (setting: string, value: number) => void;
    };
    http.set('trust proxy', 1);
  }

  app.use(helmet());
  app.use(cookieParser());
  app.setGlobalPrefix('api', {
    exclude: [{ path: '/', method: RequestMethod.GET }],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new ApiExceptionFilter());
  app.enableCors(buildCorsOptions(origins, nodeEnv));
}

function buildCorsOptions(origins: string[], nodeEnv: string): CorsOptions {
  return {
    origin:
      origins.length > 0 ? origins : nodeEnv === 'production' ? false : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };
}
