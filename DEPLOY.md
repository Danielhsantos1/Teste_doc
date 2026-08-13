# Deploy real (Railway + Netlify) — sem instalar nada localmente

Este passo a passo gera um link público de verdade (com backend e banco
funcionando), sem precisar de Node/Postgres na sua máquina. O deploy roda nos
servidores da Railway e da Netlify — não no sandbox onde o Claude Code está
rodando, que tem a rede bloqueada para esses destinos.

Pré-requisito: os arquivos `apps/api/Dockerfile`, `railway.toml`,
`.dockerignore` e `netlify.toml` já estão neste branch, prontos para a
Railway e a Netlify usarem.

**Por que Railway para o backend?** A Netlify é ótima para o frontend
(Next.js), mas foi feita para sites estáticos + funções serverless, não para
um servidor persistente (NestJS) com um Postgres de verdade atrás. Forçar a
API para dentro de Netlify Functions exigiria reescrever como ela sobe,
aceitando cold starts e timeout de request — não vale a pena. Backend e
banco continuam na Railway; só o frontend muda para a Netlify.

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

## 2. Frontend (Netlify)

1. Crie uma conta em https://netlify.com (grátis).
2. **Add new site → Import an existing project** → conecte o GitHub e
   selecione `Danielhsantos1/Teste_doc`.
3. Selecione a branch `claude/docdeck-saas-architecture-5qhlk2`.
4. A Netlify deve detectar o `netlify.toml` na raiz automaticamente (comando
   de build e diretório de publicação já configurados nele — não precisa
   preencher esses campos manualmente). Se ela pedir para confirmar:
   - Build command: `npm install && npm run build --workspace=@docdeck/web`
   - Publish directory: `apps/web/.next`
5. Antes de clicar em deploy, vá em **Site configuration → Environment
   variables** (ou "Add environment variables" na própria tela de import) e
   adicione:
   - `NEXT_PUBLIC_API_URL` → a URL da API do Railway (passo 1.7), sem barra
     no final. Ex.: `https://docdeck-api-production.up.railway.app`
6. Deploy.
7. A Netlify entrega uma URL tipo `https://docdeck-xxx.netlify.app` — esse é
   o link para testar. (Dá pra apelidar o subdomínio em **Site
   configuration → Domain management**, se quiser algo mais legível.)

<sub>Prefere Vercel? O mesmo `apps/web` funciona lá sem nenhuma mudança —
basta importar o repo, setar Root Directory = `apps/web` e a mesma variável
`NEXT_PUBLIC_API_URL`.</sub>

## Login de demonstração

`admin@docdeck.demo` / `docdeck123`

## Se algo der errado

Me manda o log de erro (da Railway ou da Netlify, tem em ambos os
dashboards) que eu ajudo a resolver. Não consegui testar o build do Docker
de ponta a ponta neste sandbox (não tem Docker instalado aqui), mas validei
cada comando do Dockerfile individualmente: `npm ci`, `prisma generate` e o
build de produção (`tsc` + `node dist/main.js`) rodaram sem erro.
