import { Global, Module } from '@nestjs/common';
import { MongoDbService } from './mongodb/mongodb.service';
import { RedisService } from './redis/redis.service';
import { CacheService } from './redis/cache.service';

@Global()
@Module({ providers: [MongoDbService, RedisService, CacheService], exports: [MongoDbService, RedisService, CacheService] })
export class InfrastructureModule {}
