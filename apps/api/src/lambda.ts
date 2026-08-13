import "reflect-metadata";
import express from "express";
import serverlessHttp from "serverless-http";
import { NestFactory } from "@nestjs/core";
import { ExpressAdapter } from "@nestjs/platform-express";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";

// Entrypoint usado pela função serverless da Netlify (netlify/functions/api.js).
// Mantido separado do main.ts (que sobe um servidor HTTP tradicional para dev
// local/self-host) porque o modelo serverless não "escuta" uma porta — cada
// invocação da função recebe um evento e devolve uma resposta.
//
// O handler do Nest é construído uma única vez e reaproveitado entre
// invocações "quentes" da mesma instância da função, evitando recriar todo o
// módulo (Prisma, guards, etc.) a cada requisição.
let cachedHandler: ReturnType<typeof serverlessHttp> | undefined;

async function getHandler() {
  if (!cachedHandler) {
    const expressApp = express();
    const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), {
      cors: true,
    });
    app.setGlobalPrefix("api/v1");
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    cachedHandler = serverlessHttp(expressApp);
  }
  return cachedHandler;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const handler = async (event: any, context: any) => {
  const h = await getHandler();
  return h(event, context);
};
