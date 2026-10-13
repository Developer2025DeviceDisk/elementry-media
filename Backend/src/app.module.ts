import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { Environment, validateEnvironment } from './config/environment';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProductsModule } from './modules/products/products.module';
import { HealthModule } from './modules/health/health.module';
import { AccountModule } from './modules/account/account.module';
import { CsrfGuard } from './common/security/csrf.guard';
import { SessionGuard } from './common/security/session.guard';
import { RateLimitMiddleware } from './common/security/rate-limit.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true, validate: validateEnvironment }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Environment, true>) => ({ pinoHttp: {
        level: config.get('LOG_LEVEL', { infer: true }),
        // Do not log headers, cookies, bodies, query strings or raw error messages.
        serializers: {
          req: (req: { id: string; method: string }) => ({ id: req.id, method: req.method }),
          res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
          err: (err: { type?: string }) => ({ type: err.type ?? 'Error' }),
        },
      } }),
    }),
    InfrastructureModule, AuthModule, ProductsModule, HealthModule, AccountModule,
  ],
  providers: [RateLimitMiddleware, { provide: APP_GUARD, useClass: CsrfGuard }, { provide: APP_GUARD, useClass: SessionGuard }],
})
export class AppModule {}
