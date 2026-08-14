# Build a partir da raiz do monorepo (necessário para o npm workspaces
# resolver packages/database, packages/risk-engine e packages/ai).
# No Railway: dockerfilePath = apps/api/Dockerfile, build context = raiz.
FROM node:20-slim

# O motor do Prisma precisa de libssl para rodar; a imagem node:*-slim
# (Debian) não vem com OpenSSL instalado por padrão, o que faz a API
# quebrar silenciosamente ao iniciar (antes mesmo de escutar na porta,
# então o healthcheck nunca responde). ca-certificates junto para as
# chamadas HTTPS (ex.: packages/ai chamando a API da Anthropic).
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/risk-engine/package.json packages/risk-engine/package.json
COPY packages/ai/package.json packages/ai/package.json

# `prisma generate` só precisa de uma URL sintaticamente válida, não de uma
# conexão real — a DATABASE_URL de verdade é injetada em runtime pelo Railway.
ARG DATABASE_URL="postgresql://user:password@localhost:5432/placeholder"
ENV DATABASE_URL=$DATABASE_URL

COPY . .

RUN npm ci
RUN npx prisma generate --schema packages/database/prisma/schema.prisma
RUN npm run build --workspace=@docdeck/api

ENV NODE_ENV=production
EXPOSE 4000

# Aplica migrations, popula/atualiza a DEMO DATA (idempotente) e só então
# inicia a API. `prisma migrate deploy` é seguro para rodar a cada deploy —
# só aplica migrations pendentes.
CMD ["sh", "-c", "npx prisma migrate deploy --schema packages/database/prisma/schema.prisma && npx tsx packages/database/prisma/seed.ts && node apps/api/dist/main.js"]
