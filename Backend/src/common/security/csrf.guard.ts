import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
import { Request } from 'express';
import { Environment } from '../../config/environment';

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly config: ConfigService<Environment, true>) {}
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return true;
    const origin = request.get('origin');
    if (origin && !this.config.get('APP_ORIGINS', { infer: true }).includes(origin)) throw new ForbiddenException('Origin not allowed');
    const supplied = request.get('x-csrf-token');
    const expected = request.session.csrfToken;
    if (!supplied || !expected || Buffer.byteLength(supplied) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) {
      throw new ForbiddenException('Invalid CSRF token');
    }
    return true;
  }
}
