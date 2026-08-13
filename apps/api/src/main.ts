import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Usado apenas para rodar a API como servidor tradicional (dev local ou
  // self-host). Em produção na Netlify o entrypoint é apps/api/src/lambda.ts
  // (função serverless, sem porta escutando). API_PORT é a convenção do .env
  // local.
  const port = process.env.PORT ?? process.env.API_PORT ?? 4000;
  await app.listen(port, "0.0.0.0");
  // eslint-disable-next-line no-console
  console.log(`DocDeck API rodando em http://localhost:${port}/api/v1`);
}

bootstrap();
