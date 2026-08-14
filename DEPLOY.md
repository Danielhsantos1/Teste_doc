# Deploy real (Neon + Netlify) — sem instalar nada localmente

Este passo a passo gera um link público de verdade (com backend e banco
funcionando), sem precisar de Node/Postgres na sua máquina. O deploy roda nos
servidores da Neon e da Netlify — não no sandbox onde o Claude Code está
rodando, que tem a rede bloqueada para esses destinos.

Ferramentas usadas, de propósito: **GitHub** (código + build), **Neon**
(Postgres) e **Netlify** (frontend e backend). Nenhuma outra plataforma é
necessária, e é **um único site** na Netlify — frontend e backend juntos.

**Como front e backend rodam no mesmo site?** O frontend (`apps/web`,
Next.js) é publicado normalmente. O backend (`apps/api`, NestJS) roda como
uma [Netlify Function](https://docs.netlify.com/functions/overview/) dentro
do mesmo site — o app Nest inteiro empacotado numa função serverless que só
liga quando chega uma requisição em `/api/*` (ver `netlify.toml` na raiz).
Como estão no mesmo domínio, nem precisa configurar CORS nem apontar uma URL
de API separada.

Pré-requisito: `netlify.toml` (raiz), `apps/api/src/lambda.ts` e
`apps/api/netlify/functions/api.js` já estão neste branch.

## 1. Banco de dados (Neon)

1. Crie uma conta em https://neon.tech (tem plano gratuito).
2. **Create a project** → dê um nome (ex.: `docdeck`) e escolha uma região
   próxima do Brasil (ex.: `us-east`).
3. No painel do projeto, clique em **Connect** para ver a connection string.
   A Neon mostra a versão **pooled** por padrão (o host tem `-pooler` nele):
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

## 2. Site na Netlify (frontend + backend juntos)

Se você já tem um site importado deste repositório (ex.: `docdeck-v1`), use
esse mesmo — não precisa criar um novo. Se ainda não tem:

1. Crie uma conta em https://netlify.com (grátis) — pode entrar com GitHub.
2. **Add new project → Import an existing project** → conecte o GitHub e
   selecione `Danielhsantos1/Teste_doc`.
3. Selecione a branch `claude/docdeck-saas-architecture-5qhlk2`.
4. **Não** mexa em Base directory — deixe em branco/raiz. A Netlify detecta
   o `netlify.toml` da raiz automaticamente.
5. Em **Site configuration → Environment variables**, adicione:
   - `DATABASE_URL` → a connection string **pooled** da Neon (passo 1.4).
   - `DIRECT_URL` → a connection string **direta** da Neon (passo 1.4).
   - `JWT_SECRET` → uma string aleatória longa (gere com
     `openssl rand -hex 32` em qualquer terminal, ou um gerador de senha
     online confiável).
   - `JWT_EXPIRES_IN` → `8h`
   - `AI_PROVIDER` → `anthropic`
   - `AI_MODEL` → `claude-sonnet-5`
   - `AI_API_KEY` → (opcional) sua chave da Anthropic, se quiser a análise
     de documentos por IA funcionando de verdade. Sem isso, o endpoint
     responde honestamente que a IA não está configurada.
   - `NEXT_PUBLIC_API_URL` → deixe **vazio** (ou nem crie essa variável) —
     sem ela, o frontend chama a API no mesmo domínio automaticamente.
6. Se o site já existia com um deploy antigo, force um nova deploy com
   **cache limpo** depois de salvar as variáveis: **Deploys → Trigger
   deploy → Clear cache and deploy site**. Isso é importante porque a
   Netlify guarda cache de builds anteriores.
7. O site também precisa estar **público** (não "Private") pra funcionar
   pra qualquer visitante — confira em **Site configuration → General →
   visibility**, ou no aviso preto no topo do site ("Go live or manage
   access") se ele aparecer.
8. Acompanhe o deploy em **Deploys → (deploy em andamento) → Deploy log** —
   a primeira vez demora um pouco mais, porque roda as migrations e o seed
   do banco antes de publicar.
9. Teste abrindo `https://SEU-SITE.netlify.app/api/v1/health` — deve
   responder `{"status":"ok",...}`. Depois teste o login normal em
   `https://SEU-SITE.netlify.app/login`.

## Login de demonstração

`admin@docdeck.demo` / `docdeck123`

## Quando algo mudar no código

Cada `git push` na branch conectada dispara um novo deploy automático — não
precisa fazer nada manual.

## Se algo der errado

Me manda o log de erro (aba **Deploys → deploy → Deploy log**) que eu ajudo
a resolver. Validei localmente a cadeia de build inteira (migrations, seed,
build da API e build do frontend, na mesma ordem que roda na Netlify) e o
boot completo da função serverless — não consegui testar o deploy real na
Netlify em si, porque este sandbox não tem acesso de rede até lá.
