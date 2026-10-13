import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { configureApp } from './bootstrap';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true, bodyParser: false });
  try {
    configureApp(app);
    app.enableShutdownHooks();
    await app.listen(app.get(ConfigService).getOrThrow<number>('PORT'), '0.0.0.0');
  } catch (error) {
    await app.close();
    throw error;
  }
}

void bootstrap().catch(() => { console.error('API startup failed. Check configuration and dependency availability.'); process.exitCode = 1; });
