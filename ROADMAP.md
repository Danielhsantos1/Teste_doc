# DocDeck — Roadmap Técnico

> Status: nenhuma fase foi iniciada. O repositório está vazio; este roadmap começa a
> valer a partir da validação de `ARCHITECTURE.md`, `DATABASE.md` e `SECURITY.md`.

## 1. Relação com o roadmap comercial (Pitch Deck)

O pitch deck define marcos comerciais que o roadmap técnico precisa respeitar como
restrição de prazo:

| Marco comercial | Data | Implicação técnica |
|---|---|---|
| Nascimento | Ago/25 | Concepção — já concluída na forma deste briefing |
| Desenvolvimento, prospecção, beta testing | até Mai/26 | Fases 0–4 (Foundation → Risk Engine) precisam estar prontas |
| Lançamento (indústrias) | Mai/26 | Fases 0–5 utilizáveis em produção com early adopters (1–5 clientes) |
| Lançamento (prestadores) | Ago/26 | Fase 9 (Supplier Portal) e o modelo "prestador cadastrado com acesso gratuito" prontos |
| Consolidação / sprint comercial | Dez/26 | Fases 6–8 (Copilot, Auditor, Predictive Risk) e billing por franquia de documentos consolidados |

O modelo de cobrança do pitch (franquia de documentos: 50/$995, 100/$1.890,
250/$4.470, 500/$8.450, excedente a $21,90/documento; prestador cadastrado pela
indústria com acesso gratuito) é o caso de uso inicial do `Usage Metering` (Fase 0)
e do módulo de `Plan`/`Subscription` (`DATABASE.md` §2.1) — implementado de forma
genérica o bastante para não travar em outros modelos de cobrança futuros.

O diferencial competitivo declarado no pitch (SLA de análise até 24h, média 2h, com
validação automática, versus concorrência de 2–3 dias úteis sem IA) é o requisito de
performance que dimensiona a Fase 2 (Document Intelligence): o pipeline assíncrono
precisa ser rápido o bastante para sustentar esse SLA como vantagem competitiva real,
não apenas como número de marketing.

## 2. Regra de execução

Uma fase por vez. Ao final de cada fase: testar, corrigir, documentar, verificar
segurança, verificar banco, verificar UX, verificar performance, commit, checkpoint —
só então iniciar a próxima. Nenhuma fase começa antes da anterior estar em critério
de aceite (ver §4).

## 3. Fases

### Fase 0 — Foundation
Monorepo (Turborepo), `apps/web` e `apps/api` inicializados, `packages/database`
com Prisma schema inicial (a partir de `DATABASE.md`), autenticação, multi-tenancy
(incl. RLS), RBAC granular, design system base, CI/CD, ambientes, logging
estruturado, documentação inicial (README, CONTRIBUTING). Nenhuma funcionalidade de
negócio ainda — o objetivo é ter a espinha dorsal segura e testável.

### Fase 1 — Core DocDeck
Empresas, fornecedores, unidades, trabalhadores, contratos, documentos (upload e
visualização simples, sem IA ainda), controle de vencimentos, tarefas, dashboard
básico. Inclui o fluxo de onboarding de contratada/prestador descrito em
`ARCHITECTURE.md` §8. **Critério de saída da fase:** o sistema já funciona como SaaS
real (cadastro → documento → vencimento → tarefa), mesmo sem inteligência artificial.

### Fase 2 — Document Intelligence
OCR, classificação, extração, validação, confidence score, evidências, pipeline
assíncrono (fila de jobs), histórico de análise. **Critério de saída:** documento
deixa de ser apenas arquivo armazenado e passa a gerar dado estruturado confiável,
com SLA de análise mensurado.

### Fase 3 — Requirements + Rules Engine
Requisitos, atividades, matriz atividade↔requisito, Rules Engine versionado,
validações automáticas, workflows básicos. **Critério de saída:** o sistema responde
"o que é necessário para esta atividade", não apenas "quais documentos existem".

### Fase 4 — Risk Engine
Risk Score com fatores explicáveis, níveis (LOW/MEDIUM/HIGH/CRITICAL), risco por
empresa, trabalhador, contrato e unidade. **Critério de saída:** toda entidade
relevante tem um risco calculado e explicável, consultável via API.

### Fase 5 — Command Center
Control Tower, "o que precisa da minha atenção", alertas, ações prioritárias,
drill-down (dashboard → risco → empresa → contrato → trabalhador → documento →
evidência), dashboards por perfil (CEO, Gestor, SST, Auditor, Fornecedor).
**Este é o marco de lançamento para indústrias (Mai/26).**

### Fase 6 — AI Copilot
Chat contextual com acesso controlado aos dados do tenant, respostas no formato
Resposta/Evidências/Entidades relacionadas/Ações recomendadas, histórico de
conversa.

### Fase 7 — AI Auditor
Detecção de anomalias e inconsistências (duplicidade, CPF/CNPJ divergente, datas
incompatíveis, padrões atípicos), fila de revisão humana, nunca afirmação automática
de fraude.

### Fase 8 — Predictive Risk
Projeção de risco (ex.: risco atual 64 → projetado 78 em 30 dias), inicialmente
baseada em regras, arquitetada para evoluir a modelo estatístico/ML sem reescrever a
interface do Risk Engine.

### Fase 9 — Supplier Portal
Portal separado para fornecedores/prestadores: cadastro, envio de documentos,
acompanhamento de pendências, comunicação, sem acesso a dados de outros
fornecedores. **Este é o marco de lançamento para prestadores (Ago/26)**, incluindo
o acesso gratuito ao prestador cadastrado pela indústria, conforme modelo comercial.

### Fase 10 — DocDeck Field
Aplicativo mobile: QR Code, crachá, consulta de trabalhador/autorização, checklist,
auditoria de campo, evidência fotográfica, assinatura, funcionamento offline com
sincronização posterior.

### Fase 11 — Access Control
Integração com catracas e sistemas de controle de acesso físico: "este trabalhador
pode acessar este local agora?" com resposta ALLOWED/BLOCKED/RESTRICTED e motivo.

### Fase 12 — Enterprise
SSO, MFA obrigatório, SCIM, API marketplace, webhooks, integrações (ERP, RH,
Microsoft, Google, WhatsApp, APIs governamentais, BI), auditoria avançada, billing
enterprise, SLA formal, observabilidade avançada. **Alinhado ao período de
consolidação (Dez/26 em diante).**

## 4. Critério de aceite (aplicado a toda fase e toda funcionalidade)

Uma funcionalidade só é considerada pronta quando: frontend funciona; backend
funciona; banco funciona; permissões funcionam; estados de erro funcionam; loading
funciona; empty state funciona; validações funcionam; testes existem (unit para
Risk/Rules/Decision Engine e validações; integration para banco/API/auth/upload/
permissões; E2E para fluxos críticos); logs existem quando necessário; documentação
foi atualizada; build funciona.

## 5. Dados de demonstração

Ambiente demo com 10 empresas, 50 trabalhadores, 5 contratos, centenas de documentos
simulados em diferentes níveis de risco (incluindo vencidos e próximos do
vencimento), trabalhadores bloqueados, auditorias e pendências — sempre marcados
como `DEMO DATA` e nunca misturados a dados reais de tenant. Construído junto com a
Fase 1 (para viabilizar demonstração comercial já no early-adopter) e expandido nas
Fases 2–5 conforme os motores de IA/risco entram em operação.

## 6. Métricas de produto a instrumentar desde a Fase 1

Documentos processados, tempo médio de análise, taxa de aprovação/rejeição,
documentos vencidos/próximos do vencimento, trabalhadores bloqueados, fornecedores
críticos, tempo médio de regularização, riscos críticos, ações concluídas.

**North Star Metric proposta:** tempo entre "documento recebido" e "decisão
operacional" (documento → análise → validação → decisão). O objetivo de longo prazo
é reduzir esse tempo de forma mensurável — é também a métrica que valida o
diferencial de SLA declarado no pitch deck (24h/média 2h).

## 7. Status atual

**Fase 0 concluída; Fase 1 em andamento; partes das Fases 3, 4 e 12 adiantadas.**

- **Fase 0 (Foundation)**: monorepo (Turborepo), Prisma multi-tenant, autenticação
  JWT, RBAC granular, design system (tema claro + shell com sidebar/nav de módulos),
  CI ainda não configurado.
- **Fase 1 (Core DocDeck)**: empresas (contratadas), trabalhadores (colaboradores),
  contratos, documentos, Command Center, fluxo de onboarding de contratada
  (`ARCHITECTURE.md` §8) — implementados. Upload real de arquivo (hoje só texto
  colado) e o segundo ponto de entrada do onboarding (via criação de contrato) ainda
  faltam.
- **Fase 3 (Requirements + Rules Engine)**: adiantada parcialmente — pendência
  documental automática na confirmação de cadastro usa uma lista fixa de tipos
  obrigatórios como stand-in; o Requirement/Rules Engine completo ainda não existe.
- **Fase 4 (Risk Engine)**: `packages/risk-engine` implementado e testado (score,
  nível, fatores explicáveis), calculado ao vivo para Company 360. Falta aplicar o
  mesmo motor a Contract/Worker/Site e substituir os campos estáticos remanescentes.
- **Fase 6/2 (Document Intelligence)**: adapter de IA real (Anthropic) implementado
  em `packages/ai`, com human-in-the-loop por threshold de confiança. OCR real
  (extração automática de PDF/imagem) ainda não existe — o texto do documento é
  inserido manualmente como stand-in documentado.
- **Fase 12 (Enterprise)**: perfis de acesso (RBAC personalizado por tenant)
  adiantados; SSO, MFA, SCIM, webhooks e integrações externas ainda não.

Pendências estruturais antes de produção: Row-Level Security no Postgres (hoje o
isolamento é só via Prisma/aplicação), cookie httpOnly + CSRF (auth hoje usa
localStorage/sessionStorage), testes de integração/E2E, CI/CD.
