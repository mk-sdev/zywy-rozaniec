import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({
    // origin: [
    //   'http://localhost:8081',
    //   'http://localhost:5173',
    //   'http://192.168.1.30:8081',
    // ],
    origin: true,
    credentials: true,
  });
  app.use(cookieParser());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((err) => {
  console.error('Application failed to start', err);
  process.exit(1);
});
