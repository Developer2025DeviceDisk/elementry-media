import { Controller, Get, Module, ServiceUnavailableException } from '@nestjs/common';
import { Public } from '../../common/security/access';
import { MongoDbService } from '../../infrastructure/mongodb/mongodb.service';
import { RedisService } from '../../infrastructure/redis/redis.service';

@Public()
@Controller('health')
class HealthController {
  constructor(private readonly mongo: MongoDbService, private readonly redis: RedisService) {}
  @Get('live') live() { return { status: 'ok' }; }
  @Get('ready') async ready() {
    let timeout: NodeJS.Timeout | undefined;
    try {
      await Promise.race([
        Promise.all([this.mongo.ping(), this.redis.client.ping()]),
        new Promise<never>((_, reject) => { timeout = setTimeout(() => reject(new Error('Readiness timed out')), 2000); }),
      ]);
      return { status: 'ok' };
    } catch { throw new ServiceUnavailableException('Dependencies unavailable'); }
    finally { clearTimeout(timeout); }
  }
}

@Module({ controllers: [HealthController] })
export class HealthModule {}
