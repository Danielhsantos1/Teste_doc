# Deploy real (Neon + Netlify) — sem instalar nada localmente

Este passo a passo gera um link público de verdade (com backend e banco
funcionando), sem precisar de Node/Postgres na sua máquina. O deploy roda nos
servidores da Neon e da Netlify — não no sandbox onde o Claude Code está
rodando, que tem a rede bloqueada para esses destinos.

Ferramentas usadas, de propósito: **GitHub** (código + build), **Neon**
(Postgres) e **Netlify** (frontend e backend). Nenhuma outra plataforma é
necessária.

**Como o backend roda sem um servidor "sempre ligado"?** A API (NestJS) é
empacotada como uma [Netlify Function](https://docs.netlify.com/functions/overview/)
— o código Nest inteiro dentro de uma função serverless que só liga quando
chega uma requisição. `apps/api/src/lambda.ts` é o entrypoint disso;
`apps/api/netlify.toml` configura o site. Isso significa dois sites na
Netlify a partir do mesmo repositório: um para `apps/web` (frontend) e outro
para `apps/api` (backend).

Pré-requisito: os arquivos `apps/api/netlify.toml`, `apps/api/netlify/functions/api.js`
e `netlify.toml` (raiz, do frontend) já estão neste branch.

## 1. Banco de dados (Neon)

1. Crie uma conta em https://neon.tech (tem plano gratuito).
2. **Create a project** → dê um nome (ex.: `docdeck`) e escolha uma região
   próxima do Brasil (ex.: `us-east` costuma ser a mais próxima disponível no
   free tier).
3. No painel do projeto, clique em **Connect** para ver a connection string.
   A Neon mostra a versão **pooled** por padrão (o host tem `-pooler` nele),
   algo como:
   `postgresql://usuario:senha@ep-xxxxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require`
4. Você vai precisar de **duas** variáveis (o schema do Prisma já está
   preparado pra isso):
   - `DATABASE_URL` → a connection string **pooled** (com `-pooler`), usada
     pela aplicação em runtime — importante em ambiente serverless, onde
     cada invocação pode abrir uma conexão nova.
   - `DIRECT_URL` → a mesma connection string, mas **sem** `-pooler` no
     host (ex.: `ep-xxxxx.us-east-2.aws.neon.tech` em vez de
     `ep-xxxxx-pooler...`). Usada só pelas migrations do Prisma, que
     precisam de uma conexão direta — atrás do pooler (modo "transaction"),
     os locks que o `prisma migrate` usa não funcionam de forma confiável.
   Guarde as duas num lugar seguro por enquanto (têm a senha do banco).

## 2. Backend (Netlify — site 1: `apps/api`)

1. Crie uma conta em https://netlify.com (grátis) — pode entrar direto com
   GitHub.
2. **Add new site → Import an existing project** → conecte o GitHub e
   selecione `Danielhsantos1/Teste_doc`.
3. Selecione a branch `claude/docdeck-saas-architecture-5qhlk2`.
4. Em **Site settings → Build & deploy → Build settings**, defina:
   - **Base directory**: `apps/api`
   - (comando e diretório de publicação não precisam ser preenchidos à mão —
     a Netlify lê `apps/api/netlify.toml` automaticamente por causa do Base
     directory)
5. Antes (ou logo depois) do primeiro deploy, vá em **Site configuration →
   Environment variables** e adicione:
   - `DATABASE_URL` → a connection string **pooled** da Neon (passo 1.4).
   - `DIRECT_URL` → a connection string **direta** da Neon (passo 1.4, sem
     `-pooler` no host).
   - `JWT_SECRET` → uma string aleatória longa (gere com
     `openssl rand -hex 32` em qualquer terminal, ou um gerador de senha
     online confiável).
   - `JWT_EXPIRES_IN` → `8h`
   - `AI_PROVIDER` → `anthropic`
   - `AI_MODEL` → `claude-sonnet-5`
   - `AI_API_KEY` → (opcional) sua chave da Anthropic, se quiser a análise de
     documentos por IA funcionando de verdade. Sem isso, o endpoint responde
     honestamente que a IA não está configurada.
6. Deploy. O build roda as migrations e o seed (dados de demonstração)
   automaticamente antes de publicar a função — acompanhe em **Deploys →
   (o deploy em andamento) → Deploy log**.
7. Depois do deploy, a Netlify dá uma URL tipo
   `https://docdeck-api-xxxx.netlify.app`. Teste abrindo
   `https://SEU-SITE-DA-API.netlify.app/api/v1/health` no navegador — deve
   responder `{"status":"ok",...}`.

## 3. Frontend (Netlify — site 2: `apps/web`)

1. No mesmo painel da Netlify, **Add new site → Import an existing
   project** de novo → mesmo repositório `Danielhsantos1/Teste_doc`.
2. Selecione a branch `claude/docdeck-saas-architecture-5qhlk2`.
3. **Não** defina Base directory desta vez — deixe em branco (a raiz do
   repo). A Netlify detecta o `netlify.toml` da raiz automaticamente:
   - Build command: `npm install && npm run build --workspace=@docdeck/web`
   - Publish directory: `apps/web/.next`
4. Antes de fazer o deploy, em **Site configuration → Environment
   variables**, adicione:
   - `NEXT_PUBLIC_API_URL` → a URL do site da API criado no passo 2.7, sem
     barra no final. Ex.: `https://docdeck-api-xxxx.netlify.app`
5. Deploy.
6. A Netlify entrega uma URL tipo `https://docdeck-xxx.netlify.app` — esse é
   o link para testar. (Dá pra apelidar o subdomínio em **Site
   configuration → Domain management**, se quiser algo mais legível.)

## Login de demonstração

`admin@docdeck.demo` / `docdeck123`

## Quando algo mudar no código

Cada `git push` na branch conectada dispara um novo deploy automático nos
dois sites da Netlify (rebuilda o front, e no site da API roda de novo
`prisma migrate deploy` + build da função). Não precisa fazer nada manual.

## Se algo der errado

Me manda o log de erro (aba **Deploys → deploy → Deploy log** de qualquer um
dos dois sites na Netlify) que eu ajudo a resolver. Não consegui testar o
deploy de ponta a ponta neste sandbox (sem acesso de rede à Neon/Netlify),
mas validei localmente: `npm run build --workspace=@docdeck/api` (que
compila `apps/api/src/lambda.ts`, o entrypoint da função) e o build de
produção do frontend rodam sem erro.
