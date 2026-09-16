import { NestFactory } from '@nestjs/core';
import { loadEnvFile } from 'node:process';

loadEnvFile();

async function bootstrap() {
  const { AppModule } = await import('./app.module.js');

  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
