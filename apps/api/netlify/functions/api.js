// Ponte fina para a função serverless: só existe porque a Netlify precisa
// achar o handler dentro de netlify/functions/. A lógica de verdade (o app
// NestJS inteiro) mora em apps/api/src/lambda.ts e é compilada pelo `tsc`
// (etapa de build do apps/api) para apps/api/dist/lambda.js ANTES deste
// arquivo ser empacotado — isso é o que faz o decorator metadata do NestJS
// funcionar aqui: o bundler de função da Netlify usa esbuild, que não
// suporta emitDecoratorMetadata, então precisamos entregar JS já compilado
// pelo tsc em vez de deixar a Netlify transpilar o TypeScript com decorators
// diretamente.
exports.handler = require("../../dist/lambda.js").handler;
