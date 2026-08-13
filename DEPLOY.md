# Deploy real (Railway + Vercel) — sem instalar nada localmente

Este passo a passo gera um link público de verdade (com backend e banco
funcionando), sem precisar de Node/Postgres na sua máquina. O deploy roda nos
servidores da Railway e da Vercel — não no sandbox onde o Claude Code está
rodando, que tem a rede bloqueada para esses destinos.

Pré-requisito: os arquivos `apps/api/Dockerfile`, `railway.toml` e
`.dockerignore` já estão neste branch, prontos para a Railway usar.

## 1. Backend + banco (Railway)

1. Crie uma conta em https://railway.app (tem plano gratuito com limite de uso
   mensal).
2. **New Project → Deploy from GitHub repo** → autorize o GitHub e selecione
   `Danielhsantos1/Teste_doc`.
3. Quando pedir a branch, selecione `claude/docdeck-saas-architecture-5qhlk2`
   (ou a branch atual da PR).
4. A Railway deve detectar o `railway.toml` na raiz e usar
   `apps/api/Dockerfile` automaticamente. Se ela perguntar, confirme o
   Dockerfile.
5. No mesmo projeto: **+ New → Database → Add PostgreSQL**. Isso cria um
   Postgres gerenciado.
6. No serviço da API (o que veio do GitHub/Dockerfile), abra **Variables** e
   adicione:
   - `DATABASE_URL` → referencie a variável do Postgres que a Railway acabou
     de criar (ela costuma sugerir isso automaticamente ao digitar
     `DATABASE_URL`; se não sugerir, use a sintaxe de referência de variável
     de serviço da Railway, algo como `${{Postgres.DATABASE_URL}}`).
   - `JWT_SECRET` → uma string aleatória longa (ex.: gere com
     `openssl rand -hex 32` em qualquer terminal, ou use um gerador de senha
     online confiável).
   - `JWT_EXPIRES_IN` → `8h`
   - `AI_PROVIDER` → `anthropic`
   - `AI_MODEL` → `claude-sonnet-5`
   - `AI_API_KEY` → (opcional) sua chave da Anthropic, se quiser a análise de
     documentos por IA funcionando de verdade. Sem isso, o endpoint responde
     honestamente que a IA não está configurada.
7. Em **Settings** do serviço da API, gere um domínio público (a Railway
   oferece um `*.up.railway.app` gratuito). Anote essa URL.
8. Deploy. Acompanhe os logs — na primeira vez ele roda as migrations e o
   seed automaticamente (isso está no `CMD` do Dockerfile).
9. Teste abrindo `https://SEU-DOMINIO.up.railway.app/api/v1/health` no
   navegador — deve responder `{"status":"ok",...}`.

## 2. Frontend (Vercel)

1. Crie uma conta em https://vercel.com (grátis).
2. **Add New → Project** → importe o mesmo repositório
   `Danielhsantos1/Teste_doc`.
3. Selecione a branch `claude/docdeck-saas-architecture-5qhlk2`.
4. Em **Root Directory**, clique em "Edit" e escolha `apps/web`. O preset
   "Next.js" deve ser detectado automaticamente.
5. Em **Environment Variables**, adicione:
   - `NEXT_PUBLIC_API_URL` → a URL da API do Railway (passo 1.7), sem barra
     no final. Ex.: `https://docdeck-api-production.up.railway.app`
6. Deploy.
7. A Vercel te entrega uma URL tipo `https://docdeck-xxx.vercel.app` — esse é
   o link para testar.

## Login de demonstração

`admin@docdeck.demo` / `docdeck123`

## Se algo der errado

Me manda o log de erro (da Railway ou da Vercel, tem em ambos os
dashboards) que eu ajudo a resolver. Não consegui testar o build do Docker
de ponta a ponta neste sandbox (não tem Docker instalado aqui), mas validei
cada comando do Dockerfile individualmente: `npm ci`, `prisma generate` e o
build de produção (`tsc` + `node dist/main.js`) rodaram sem erro.
