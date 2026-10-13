import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';
import { Environment } from '../../config/environment';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  readonly client;
  readonly prefix: string;

  constructor(config: ConfigService<Environment, true>) {
    this.prefix = config.get('REDIS_PREFIX', { infer: true });
    this.client = createClient({
      url: config.get('REDIS_URL', { infer: true }),
      disableOfflineQueue: true,
      socket: { connectTimeout: 5000, reconnectStrategy: (retries) => Math.min(100 * 2 ** Math.min(retries, 5), 3000) },
    });
    this.client.on('error', () => this.logger.error('Redis connection error'));
  }

  async onModuleInit() {
    let timer: NodeJS.Timeout | undefined;
    try {
      await Promise.race([
        this.client.connect(),
        new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Redis startup timed out')), 10000); }),
      ]);
    } catch (error) {
      if (this.client.isOpen) await this.client.disconnect();
      throw error;
    } finally { clearTimeout(timer); }
  }

  async onModuleDestroy() { if (this.client.isOpen) await this.client.disconnect(); }
  key(suffix: string) { return `${this.prefix}${suffix}`; }
}
