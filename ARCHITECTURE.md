# DocDeck — Arquitetura Proposta

> Status: **Proposta para validação.** Nenhum código de aplicação foi escrito ainda.
> Este documento é o resultado das Etapas A–E do processo de fundação do produto:
> análise do briefing de produto, análise do estado atual do repositório (vazio),
> diagnóstico e proposta de arquitetura. A implementação (Fase 0 em diante, ver
> `ROADMAP.md`) só começa após a validação deste documento.

## 1. Contexto e diagnóstico

O repositório `Teste_doc` está vazio (sem commits, sem código). Não existe nenhuma
implementação prévia para preservar ou migrar — este é um projeto greenfield. A
arquitetura abaixo é, portanto, uma proposta a ser validada antes de qualquer
scaffolding, e não uma descrição de algo já construído.

Fontes usadas para esta proposta:

- Especificação funcional/estratégica completa fornecida (95 seções cobrindo produto,
  domínio, IA, segurança, UX e roadmap de construção).
- Pitch Deck (`Pitch_Deck__DocDeck.pdf`): mercado (~370 mil indústrias, prestadores em
  sua maioria com até 20 funcionários), problema (risco trabalhista/fiscal/civil por
  responsabilidade solidária, processos manuais, documentação inadequada), proposta de
  valor (SLA de análise até 24h/média 2h vs. concorrência de 2–3 dias úteis, minutas
  inteligentes), modelo de negócio (SaaS por franquia de documentos + portal gratuito
  para prestadores) e roadmap comercial (nascimento ago/25 → lançamento indústrias
  mai/26 → lançamento prestadores ago/26 → consolidação dez/26).
- Transcrição de áudio anexada (`Doc1.docx`, duas imagens de texto): descreve o fluxo
  de cadastro de contratada/prestador — dois pontos de entrada (via cadastro da
  contratada ou via criação de contrato) que convergem no mesmo fluxo; cadastro gera
  pendência automática de documentação obrigatória; credenciais só são criadas após
  confirmação de e-mail. Este comportamento é incorporado ao `Requisite Engine` e ao
  fluxo de onboarding descrito na Seção 8 abaixo.

## 2. Visão do produto

**Posicionamento:** inteligência operacional para gestão de terceiros.
**Frase central:** *Do documento à decisão.*

O produto transforma **documentos** em **dados**, que alimentam **conformidade**, que
alimenta **risco**, que alimenta **decisão operacional**. Não é um CRUD de documentos
nem um dashboard decorativo — é uma cadeia de motores (Document Intelligence →
Requirement Engine → Rules Engine → Risk Engine → Decision Engine) que um Command
Center e um Copilot expõem ao usuário.

## 3. Arquitetura de alto nível

```
                              DOCDECK
                                 |
                          WEB APPLICATION  (Next.js)
                                 |
                           API / BACKEND   (NestJS, modular monolith)
                                 |
        +--------------------+--------------------+--------------------+
        |                    |                    |                    |
   CORE DOMAIN            AI LAYER            RISK/RULES           INTEGRATIONS
   (companies,        (extraction,          (Requirement,        (adapters:
   suppliers,          classification,       Rules, Risk,         email, storage,
   workers,            confidence,           Decision Engine)     futuro: ERP,
   contracts,          evidence)                                  WhatsApp, gov APIs)
   documents)
        |                    |                    |
        +--------------------+--------------------+
                                 |
                         PostgreSQL (multi-tenant, RLS)
                                 |
                         Object Storage (documentos)
                                 |
                         Fila / Jobs assíncronos (OCR, IA, regras, risco)
                                 |
                         Event Bus (domain events)
```

Princípio arquitetural: **modular monolith** desde o dia 1, com fronteiras de domínio
rígidas (cada módulo do backend só acessa seus próprios repositórios/tabelas e expõe
uma interface de serviço para os demais). Isso permite extrair um módulo para
microserviço no futuro (ex.: AI Layer, Risk Engine) sem reescrever o domínio central.
Não introduzir microserviços, filas distribuídas entre serviços ou service mesh agora
— seria overengineering para o estágio atual (pré-lançamento, 1–5 clientes early
adopters segundo o roadmap comercial).

## 4. Stack tecnológica

### Frontend (`apps/web`)
- **Next.js** (App Router) + **React** + **TypeScript**
- **Tailwind CSS** + **shadcn/ui** — design system próprio construído sobre esses
  primitivos (ver `docs/DESIGN_SYSTEM.md`, a ser criado na Fase 0)
- **TanStack Query** para data fetching/cache do lado cliente
- **React Hook Form** + **Zod** para formulários e validação client-side
- **Recharts** para visualizações (uso deliberadamente comedido — ver regra "zero
  poluição" no briefing)
- **Lucide Icons**

### Backend (`apps/api`)
- **NestJS** + **TypeScript**, arquitetura modular (um módulo Nest por domínio:
  `companies`, `suppliers`, `workers`, `contracts`, `documents`, `requirements`,
  `risk`, `audits`, `tasks`, `ai`, `notifications`, `workflow`)
- REST versionada (`/api/v1/...`) documentada via OpenAPI/Swagger
- Validação de entrada com `class-validator`/`class-transformer` (padrão NestJS) +
  Zod compartilhado com o frontend via `packages/types` para contratos de payload
- Tratamento de erros centralizado (`ExceptionFilter` global, formato de erro
  padronizado) e logging estruturado (pino ou winston, JSON)

### Dados
- **PostgreSQL** como banco primário
- **Prisma** como ORM (migrations versionadas, schema único fonte-da-verdade)
- **Object Storage** compatível S3 para documentos (arquivo original + versões)
- Índice de busca full-text/vetorial (Postgres `pg_trgm`/`pgvector` inicialmente —
  evita introduzir um serviço de busca dedicado antes de haver necessidade real)

### Processamento assíncrono
- Fila de jobs (BullMQ sobre Redis é a escolha recomendada por já ser padrão no
  ecossistema Node/Nest) para: OCR, extração por IA, validação de regras, cálculo de
  risco, envio de notificações
- Cada etapa do pipeline de documento é um job idempotente e observável

### IA
- Camada de IA isolada em `packages/ai`, com um `AIProviderAdapter` (para permitir
  troca/combinação de provedores de LLM/OCR sem acoplar o domínio a um fornecedor
  específico)
- Toda saída de IA é persistida como `AIAnalysis`/`AIExtraction` com confidence score,
  evidência e versão do prompt/modelo (ver Seção 7)

### Infraestrutura
- Monorepo gerenciado com **Turborepo** (build cache, orquestração de tasks entre
  `apps/*` e `packages/*`)
- Containers (Docker) para API, workers e banco local de desenvolvimento
- CI/CD (GitHub Actions): lint, typecheck, testes, build, migrations em ambiente de
  staging antes de produção
- Ambientes: `local`, `staging`, `production`, com variáveis de ambiente e secrets
  fora do código-fonte (nunca em `.env` versionado)

## 5. Estrutura de pastas proposta

```
/apps
  /web                  → Next.js (app administrativo + portal do fornecedor)
  /api                  → NestJS (API REST modular)

/packages
  /ui                   → Design system (componentes compartilhados sobre shadcn/ui)
  /config               → eslint/tsconfig/tailwind config compartilhados
  /types                → contratos TypeScript/Zod compartilhados entre web e api
  /database             → Prisma schema, migrations, seed scripts
  /security             → utilitários de auth, RBAC, criptografia, auditoria
  /ai                    → AI Layer: adapters de extração, classificação, confidence
  /risk-engine          → motor de risco (puro, sem dependência de HTTP/DB direta)
  /rules-engine         → motor de regras versionado
  /workflow-engine       → motor de workflow (trigger → condition → action → approval)

/docs                   → ARCHITECTURE.md, DATABASE.md, SECURITY.md, ROADMAP.md, ...
/infrastructure         → Docker, IaC, pipelines de CI/CD
```

Regra estrutural: **Risk Engine, Rules Engine e Decision Engine são pacotes puros**
(sem I/O direto), testáveis isoladamente e reutilizáveis por qualquer módulo do
backend (e futuramente por workers assíncronos ou funções serverless). Lógica de
negócio nunca vive em `page.tsx`, componentes React ou controllers HTTP.

## 6. Multi-tenancy

Hierarquia de escopo:

```
Grupo (opcional, grupos empresariais)
  └─ Tenant (cliente pagante — uma indústria ou, futuramente, um grande prestador)
       └─ Unidade (site/planta)
            └─ Área
                 └─ Operação/Atividade
```

Regras não-negociáveis (ver `SECURITY.md` para detalhamento):

- Toda entidade pertencente a um tenant carrega `tenant_id`.
- `tenant_id` **nunca** é aceito vindo do frontend/payload — é sempre derivado do
  contexto de autenticação (token) no backend.
- Isolamento reforçado em duas camadas: (1) todo repositório Prisma injeta
  `tenant_id` automaticamente via um middleware/extension de query; (2) **Row-Level
  Security (RLS)** no PostgreSQL como segunda barreira, configurando a sessão de
  banco com o `tenant_id` corrente a cada requisição. A defesa em profundidade é
  deliberada: um bug de aplicação não deve conseguir, sozinho, vazar dados entre
  tenants.
- Usuários com acesso a múltiplas unidades/tenants (ex.: consultorias, grupos
  empresariais) são modelados via uma tabela de associação `UserTenantAccess`, não
  duplicando o usuário.
- Alterações de tenant (criação, suspensão, mudança de plano) são auditadas
  (`AuditLog`).

## 7. Autenticação, autorização e RBAC

- Autenticação via sessão/JWT (NestJS + Passport), com estrutura pronta para MFA
  (campo `mfaEnabled`/`mfaSecret` no `User`, fluxo de verificação a ser ativado por
  feature flag) e para SSO/SCIM na Fase 12 (Enterprise).
- **RBAC com permissões granulares**, nunca checagem por string de papel isolada
  (`if user.role === 'admin'` é proibido pelo briefing). Modelo:
  `User → UserRole → Role → RolePermission → Permission`, permissões no formato
  `recurso.ação` (`companies.read`, `documents.approve`, `risk.manage`, ...).
- Papéis iniciais (seed, não hardcoded na lógica): Super Admin, Admin do Tenant,
  Gestor, Analista, Segurança, Auditor, Operador, Fornecedor, Trabalhador.
- Toda rota de API verifica: autenticação → tenant do usuário → permissão granular
  → validação de payload, nessa ordem, num guard/middleware centralizado (não
  espalhado por controller).

## 8. Fluxo de onboarding (Company/Supplier) — a partir da transcrição de áudio

A transcrição descreve um requisito específico de UX/domínio que incorporamos ao
`Requisite Engine` e ao módulo de cadastro:

1. Existem **dois pontos de entrada** para o cadastro de uma contratada: (a) a partir
   da tela de "supridoras/contratadas" (cadastro direto) e (b) a partir da criação de
   um novo contrato (botão que abre um mini-fluxo de cadastro da contratada dentro do
   próprio processo de contrato). **Ambos convergem para o mesmo fluxo de cadastro** —
   não deve haver duas implementações divergentes.
2. O sistema deve diferenciar: uma tela mostra apenas os dados do contrato; a outra
   mostra os dados da contratada. Internamente, os dois botões alimentam o mesmo
   conjunto de informações e o mesmo processo (contratada e contrato são entidades
   relacionadas, não duplicadas).
3. Ao confirmar o cadastro (após **confirmação de e-mail**), o sistema:
   - registra o cadastro da empresa;
   - cria as credenciais de acesso **somente depois** da confirmação;
   - abre o cadastro **já com a pendência das documentações obrigatórias**
     associadas (via `DocumentRequirement`/`RequirementSet`), sem exigir um fluxo
     manual separado para isso.
4. Esse comportamento é um caso de uso direto do **Requisite Engine** (Seção 23 do
   briefing): atividade/contrato define requisitos → requisitos geram pendências
   automáticas no cadastro da entidade correspondente.

Este fluxo será detalhado como caso de uso na Fase 1 (Core DocDeck) e não é
implementado nesta etapa — está registrado aqui para não se perder entre a captura do
requisito e a fase em que ele será construído.

## 9. Camada de IA (Document Intelligence)

Pipeline assíncrono, nunca bloqueando a UI:

```
Upload → Queue → OCR Worker → AI Extraction Worker → Validation Worker
       → Risk Worker → Notification Worker
```

Cada etapa grava progresso consultável pelo frontend (polling ou websocket, decidido
na Fase 2). Toda saída de IA é armazenada com:

```
confidence_score, evidence (documento + página/campo), timestamp,
model, prompt/rule version, reviewer (quando revisado por humano)
```

**Regra estrutural:** a IA nunca é autoridade absoluta. A cadeia é sempre
`AI interpretation + Evidence + Rule + Confidence = Decision`, nunca `AI says X →
X is true`. Threshold de confiança para auto-validação é configurável por tenant
(`AIConfig`); abaixo do threshold, o item vai para fila de revisão humana
(human-in-the-loop, Seção 65 do briefing).

## 10. Risk Engine, Rules Engine, Decision Engine

Três motores desacoplados da interface, em `packages/risk-engine`,
`packages/rules-engine` e o Decision Engine como camada de composição:

- **Rules Engine**: regras versionadas e armazenadas (não hardcoded), formato
  `IF condition THEN action`, avaliadas contra eventos de domínio.
- **Risk Engine**: recebe sinais (`document_expired`, `training_expired`,
  `missing_requirement`, ...) e produz `risk_score` (0–100, faixas LOW/MEDIUM/
  HIGH/CRITICAL), sempre com `risk_factors` explicáveis — nunca só o número.
- **Decision Engine**: combina regras + risco + requisitos para produzir um estado
  (`APPROVED`, `APPROVED_WITH_WARNING`, `PENDING`, `BLOCKED`, `EXPIRED`,
  `UNDER_REVIEW`), sempre com razões legíveis por humano.

Todos os três são unit-testáveis sem banco de dados nem HTTP — dependência mínima é
o requisito arquitetural que permite reuso futuro em workers, jobs agendados ou
avaliação em lote.

## 11. Copilot e Auditor de IA

- **AI Copilot**: acesso controlado (por tenant e por permissão) aos dados via as
  mesmas queries/serviços do domínio — nunca acesso direto e irrestrito ao banco.
  Toda resposta segue o formato Resposta → Evidências → Entidades relacionadas →
  Ações recomendadas.
- **AI Auditor**: roda como job assíncrono (não em tempo real na UI), gera
  `AIAnomaly` com severidade, confiança, evidência e status de revisão. Nunca afirma
  fraude — usa linguagem de "padrão atípico, recomenda-se revisão".

## 12. Observabilidade, performance e escala

- Logs estruturados (JSON) correlacionados por `request_id`/`tenant_id`.
- Métricas e health checks desde a Fase 0 (endpoint `/health`, métricas básicas de
  fila e latência de API).
- Paginação obrigatória em toda listagem; nenhuma tela carrega coleções não
  paginadas no browser.
- Arquitetura pensada para tenants heterogêneos (de 10 a 100.000 trabalhadores no
  mesmo produto): índices compostos por `tenant_id`, queries sempre escopadas por
  tenant primeiro.

## 13. Feature flags e planos SaaS

- Feature flags por tenant desde a Fase 0 (tabela `TenantFeatureFlag` ou serviço
  equivalente), permitindo ativar módulos como `AI_COPILOT`, `AI_AUDITOR`,
  `PREDICTIVE_RISK`, `SUPPLIER_PORTAL` por cliente.
- Modelo de planos inspirado no pitch deck (franquia de documentos: 50/100/250/500
  documentos + excedente por documento avulso, portal do prestador gratuito), mas
  **não fixado no schema** — `Plan`/`Subscription`/`Usage` são genéricos o bastante
  para suportar outros modelos de cobrança no futuro (por trabalhador, por unidade,
  por módulo de IA).

## 14. O que esta etapa NÃO inclui

Conforme o processo definido no briefing (Etapa F): este documento é a proposta de
arquitetura. Nenhum monorepo, schema Prisma, endpoint ou tela foi implementado nesta
etapa. A implementação começa pela Fase 0 (Foundation) somente após validação — ver
`ROADMAP.md`.
