# DocDeck

**Do documento à decisão.**

Inteligência operacional para gestão de terceiros: transforma documentos em dados,
dados em conformidade, conformidade em risco, e risco em decisão operacional.

## Status do projeto

Fase 0 (Foundation) e o início da Fase 1 (Core DocDeck) já estão implementados e
funcionando localmente: monorepo, banco multi-tenant, autenticação, RBAC granular,
Command Center, cadastro de contratadas com fluxo de confirmação, CLM (contratos),
Risk Engine explicável e Document Intelligence com IA real (Anthropic — requer
`AI_API_KEY` configurada; sem ela, o endpoint responde honestamente que a IA não
está configurada, em vez de simular uma análise). Ver `ROADMAP.md` para o que falta.

## Documentação

| Documento | Conteúdo |
|---|---|
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Stack, arquitetura de alto nível, estrutura de pastas, multi-tenancy, autenticação/RBAC, camada de IA, Risk/Rules/Decision Engine |
| [`DATABASE.md`](./DATABASE.md) | Modelo de dados conceitual: domínios de entidade, relacionamentos, estratégia multi-tenant no banco, retenção/LGPD |
| [`SECURITY.md`](./SECURITY.md) | Requisitos de segurança, isolamento de tenant, RBAC, proteção OWASP, segurança de IA, LGPD |
| [`ROADMAP.md`](./ROADMAP.md) | Fases técnicas (0–12), relação com o roadmap comercial do pitch deck, critério de aceite por fase, status atual |
| [`DEPLOY.md`](./DEPLOY.md) | Deploy real (Railway + Vercel) para gerar um link público, sem instalar nada localmente |

## Como rodar localmente

Pré-requisitos: Node.js 20+, PostgreSQL rodando localmente (ou acessível via
`DATABASE_URL`).

```bash
git clone https://github.com/Danielhsantos1/Teste_doc.git
cd Teste_doc
git checkout claude/docdeck-saas-architecture-5qhlk2   # enquanto a PR não for mergeada

cp .env.example .env
# edite .env: DATABASE_URL deve apontar para o seu Postgres local

npm install   # também builda packages/risk-engine e packages/ai (postinstall)

# cria o banco (ajuste o nome/usuário conforme o seu .env)
createdb docdeck   # ou: psql -c "CREATE DATABASE docdeck;"

npx prisma migrate deploy --schema packages/database/prisma/schema.prisma
npx tsx packages/database/prisma/seed.ts   # popula DEMO DATA

npm run dev   # sobe apps/web (:3000) e apps/api (:4000) juntos via Turborepo
```

Acesse `http://localhost:3000`. Login de demonstração:
`admin@docdeck.demo` / `docdeck123`.

Para habilitar a análise de documentos por IA de verdade, adicione ao `.env`:

```bash
AI_API_KEY=sk-ant-...   # chave da Anthropic
```

Sem essa variável, `POST /documents/:id/analyze` responde `503` de forma honesta —
nunca simula uma análise que não aconteceu.

## Processo de construção

O projeto segue um processo deliberado: nenhuma fase começa antes da anterior estar
em critério de aceite, e nenhuma funcionalidade é implementada com dados simulados
fingindo ser reais, botões sem implementação, ou integrações falsas. Se algo ainda
não está implementado, isso fica explícito na documentação, no código e na interface
(ex.: módulos MOB/MED/ENC aparecem na navegação mas ficam desabilitados até existir
funcionalidade real por trás).

## Próxima fase

Ver "Status atual" em `ROADMAP.md`.
