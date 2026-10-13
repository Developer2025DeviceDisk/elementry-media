import { CacheService } from './cache.service';
import { RedisService } from './redis.service';

describe('CacheService', () => {
  const get = jest.fn();
  const set = jest.fn();
  const redis = { key: (key: string) => `test:${key}`, client: { get, set } } as unknown as RedisService;
  const cache = new CacheService(redis);
  beforeEach(() => { get.mockReset(); set.mockReset(); });
  it('serves hits without reading the database', async () => {
    get.mockResolvedValue('{"value":1}');
    const loader = jest.fn();
    expect(await cache.remember('key', 30, loader)).toEqual({ value: 1 });
    expect(loader).not.toHaveBeenCalled();
  });
  it('falls back to the source when Redis fails', async () => {
    get.mockRejectedValue(new Error('offline'));
    set.mockRejectedValue(new Error('offline'));
    expect(await cache.remember('key', 30, async () => ({ value: 2 }))).toEqual({ value: 2 });
  });
  it('coalesces concurrent cache misses within one instance', async () => {
    get.mockResolvedValue(null);
    const loader = jest.fn(async () => { await new Promise((resolve) => setTimeout(resolve, 10)); return 3; });
    expect(await Promise.all([cache.remember('key', 30, loader), cache.remember('key', 30, loader)])).toEqual([3, 3]);
    expect(loader).toHaveBeenCalledTimes(1);
  });
});
