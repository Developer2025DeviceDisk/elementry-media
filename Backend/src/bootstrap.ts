import { BadRequestException, PayloadTooLargeException, UnsupportedMediaTypeException, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { json, urlencoded, Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import session from 'express-session';
import RedisStore from 'connect-redis';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { Environment } from './config/environment';
import { RedisService } from './infrastructure/redis/redis.service';
import { RateLimitMiddleware } from './common/security/rate-limit.middleware';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

export function configureApp(app: NestExpressApplication) {
  const config = app.get(ConfigService<Environment, true>);
  const redis = app.get(RedisService);
  const limiter = app.get(RateLimitMiddleware);
  const production = config.get('NODE_ENV') === 'production';
  const proxy = config.get('TRUST_PROXY', { infer: true });
  app.set('trust proxy', proxy ? proxy.split(',').map((value) => value.trim()) : false);
  app.disable('x-powered-by');
  app.useLogger(app.get(Logger));
  app.setGlobalPrefix('api/v1');
  app.use((req: Request, res: Response, next: NextFunction) => {
    req.id = randomUUID();
    res.setHeader('X-Request-Id', req.id);
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  app.use(helmet());
  app.enableCors({ origin: config.get('APP_ORIGINS', { infer: true }), credentials: true, methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'X-CSRF-Token'], exposedHeaders: ['X-Request-Id', 'Retry-After'], maxAge: 600 });
  // Limit before parsing bodies, loading sessions, or expensive password hashing.
  app.use(limiter.use.bind(limiter));
  app.use(json({ limit: '32kb' }));
  app.use(urlencoded({ extended: false, limit: '32kb' }));
  // Sanitize parser errors before Nest maps SyntaxError to an HTTP exception:
  // Node's JSON error message can include the submitted password/body.
  app.use((error: unknown, _req: Request, _res: Response, next: NextFunction) => {
    if (error && typeof error === 'object' && 'type' in error) {
      if (error.type === 'entity.parse.failed') return next(new BadRequestException('Invalid JSON body'));
      if (error.type === 'entity.too.large') return next(new PayloadTooLargeException('Request body too large'));
      if (error.type === 'encoding.unsupported' || error.type === 'charset.unsupported') return next(new UnsupportedMediaTypeException('Unsupported body encoding'));
    }
    next(error);
  });
  const sessionMiddleware = session({
    store: new RedisStore({ client: redis.client, prefix: redis.key('session:') }),
    name: production ? '__Host-sid' : 'sid',
    secret: config.get('SESSION_SECRET', { infer: true }),
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: { httpOnly: true, secure: production, sameSite: config.get('COOKIE_SAME_SITE', { infer: true }), path: '/', maxAge: config.get('SESSION_TTL_SECONDS', { infer: true }) * 1000 },
  });
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path === '/api/v1/health/live' || req.path === '/api/v1/health/ready') return next();
    sessionMiddleware(req, res, next);
  });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true, forbidUnknownValues: true, validationError: { target: false, value: false } }));
  app.useGlobalFilters(new HttpExceptionFilter());
}
