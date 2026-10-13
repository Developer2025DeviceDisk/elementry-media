import { ConfigService } from '@nestjs/config';
import { HttpException, ServiceUnavailableException } from '@nestjs/common';
import { Request, Response } from 'express';
import { Environment } from '../../config/environment';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { RateLimitMiddleware } from './rate-limit.middleware';

describe('Redis rate limit', () => {
  const evaluate = jest.fn();
  const redis = { key: (key: string) => key, client: { eval: evaluate } } as unknown as RedisService;
  const config = new ConfigService({ AUTH_RATE_LIMIT_MAX: 2, RATE_LIMIT_MAX: 10, RATE_LIMIT_WINDOW_SECONDS: 60 }) as ConfigService<Environment, true>;
  const middleware = new RateLimitMiddleware(redis, config);
  const req = { path: '/api/v1/auth/login', method: 'POST', ip: '127.0.0.1' } as Request;
  const res = { setHeader: jest.fn() } as unknown as Response;
  it('returns 429 with retry information when quota is exhausted', async () => {
    evaluate.mockResolvedValue([3, 42]);
    const next = jest.fn();
    await middleware.use(req, res, next);
    expect((next.mock.calls[0][0] as HttpException).getStatus()).toBe(429);
    expect(res.setHeader).toHaveBeenCalledWith('Retry-After', 42);
  });
  it('fails closed when Redis is unavailable', async () => {
    evaluate.mockRejectedValue(new Error('offline'));
    const next = jest.fn();
    await middleware.use(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(ServiceUnavailableException));
  });
});
