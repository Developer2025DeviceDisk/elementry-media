import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly pending = new Map<string, Promise<unknown>>();
  constructor(private readonly redis: RedisService) {}

  async remember<T>(key: string, ttl: number, loader: () => Promise<T>): Promise<T> {
    const cacheKey = this.redis.key(`cache:v1:${key}`);
    try {
      const value = await this.redis.client.get(cacheKey);
      if (value !== null) return JSON.parse(value) as T;
    } catch { this.logger.warn('Cache read failed; loading source'); }
    const current = this.pending.get(cacheKey);
    if (current) return current as Promise<T>;
    const promise = (async () => {
      const value = await loader();
      try {
        await this.redis.client.set(cacheKey, JSON.stringify(value), { EX: ttl + Math.floor(Math.random() * Math.max(1, ttl / 10)) });
      } catch { this.logger.warn('Cache write failed'); }
      return value;
    })();
    this.pending.set(cacheKey, promise);
    try { return await promise; } finally { this.pending.delete(cacheKey); }
  }

  async invalidate(key: string) { await this.redis.client.del(this.redis.key(`cache:v1:${key}`)); }
}
