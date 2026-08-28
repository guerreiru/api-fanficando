import { NestFactory } from '@nestjs/core';
import { configureApp } from './common/http/configure-app';
import { AppModule } from './modules/app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
