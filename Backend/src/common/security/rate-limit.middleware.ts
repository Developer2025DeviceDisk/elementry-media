import { Injectable, NestMiddleware, ServiceUnavailableException, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import { Request, Response, NextFunction } from 'express';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { Environment } from '../../config/environment';

// INCR and expiry must be atomic across API replicas.
export const RATE_SCRIPT = `
local hits = redis.call('INCR', KEYS[1])
if hits == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
return {hits, redis.call('TTL', KEYS[1])}
`;

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  constructor(private readonly redis: RedisService, private readonly config: ConfigService<Environment, true>) {}
  async use(req: Request, res: Response, next: NextFunction) {
    if (req.path === '/api/v1/health/live' || req.path === '/api/v1/health/ready') return next();
    let path: string;
    try { path = decodeURIComponent(req.path); }
    catch { return next(new HttpException('Invalid request path', HttpStatus.BAD_REQUEST)); }
    const auth = /^\/api\/v1\/auth\/(login|register)\/?$/i.test(path) && req.method === 'POST';
    const max = this.config.get(auth ? 'AUTH_RATE_LIMIT_MAX' : 'RATE_LIMIT_MAX', { infer: true });
    const window = this.config.get('RATE_LIMIT_WINDOW_SECONDS', { infer: true });
    const ip = createHash('sha256').update(req.ip || req.socket.remoteAddress || 'unknown').digest('hex');
    try {
      const [hits, ttl] = await this.redis.client.eval(RATE_SCRIPT, {
        keys: [this.redis.key(`rate:${auth ? 'auth' : 'global'}:${ip}`)], arguments: [String(window)],
      }) as number[];
      res.setHeader('RateLimit-Limit', max);
      res.setHeader('RateLimit-Remaining', Math.max(0, max - hits));
      res.setHeader('RateLimit-Reset', Math.max(1, ttl));
      if (hits > max) {
        res.setHeader('Retry-After', Math.max(1, ttl));
        return next(new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS));
      }
      next();
    } catch { next(new ServiceUnavailableException('Request protection unavailable')); }
  }
}
