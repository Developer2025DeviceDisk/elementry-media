import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CsrfGuard } from './csrf.guard';
import { Environment } from '../../config/environment';

describe('CsrfGuard', () => {
  const guard = new CsrfGuard(new ConfigService({ APP_ORIGINS: ['https://shop.example.com'] }) as ConfigService<Environment, true>);
  const context = (method: string, token?: string, origin?: string) => ({
    switchToHttp: () => ({ getRequest: () => ({ method, session: { csrfToken: 'valid-token' }, get: (key: string) => key === 'origin' ? origin : token }) }),
  }) as ExecutionContext;
  it('allows safe reads', () => expect(guard.canActivate(context('GET'))).toBe(true));
  it('rejects absent, unequal-length and wrong tokens', () => {
    for (const token of [undefined, 'short', 'wrong-token']) expect(() => guard.canActivate(context('POST', token))).toThrow(ForbiddenException);
  });
  it('rejects untrusted origins even with a token', () => expect(() => guard.canActivate(context('POST', 'valid-token', 'https://evil.example'))).toThrow(ForbiddenException));
  it('accepts a matching token from the allowed origin', () => expect(guard.canActivate(context('POST', 'valid-token', 'https://shop.example.com'))).toBe(true));
});
