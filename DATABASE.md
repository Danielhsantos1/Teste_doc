# DocDeck — Modelo de Dados Proposto

> Status: **Proposta para validação.** Nenhum schema Prisma ou migration foi criado
> ainda. Este documento descreve o modelo conceitual de entidades e relacionamentos
> que orientará o `packages/database/schema.prisma` na Fase 0.

## 1. Princípios

- **PostgreSQL** + **Prisma** como fonte única de verdade do schema.
- **Multi-tenant desde a primeira tabela**: toda entidade pertencente a um cliente
  tem `tenant_id` (FK obrigatória, indexada, nunca nula). Entidades verdadeiramente
  globais (ex.: catálogo de tipos de documento padrão do sistema, `Permission`) não
  carregam `tenant_id`, mas são a exceção documentada, não a regra.
- **Toda tabela de negócio tem**: `id` (uuid), `created_at`, `updated_at`,
  `created_by`/`updated_by` (quando aplicável), e soft-delete (`deleted_at`) em vez
  de `DELETE` físico para entidades com valor de auditoria (documentos, trabalhadores,
  empresas, contratos, análises de IA, logs).
- **Nenhuma migration apaga dados de produção sem proteção explícita** (guard manual
  documentado na PR que introduzir a migration destrutiva).
- Nomes de tabela em `snake_case` plural; nomes de model Prisma em `PascalCase`
  singular (convenção padrão Prisma).

## 2. Domínios de entidade

O modelo é organizado pelos mesmos domínios do briefing de produto. Abaixo, cada
grupo com suas entidades e o papel de cada uma — este é o dicionário de dados
conceitual, não o schema físico final (que será refinado durante a Fase 0 com
tipos, constraints e índices exatos).

### 2.1 Tenancy
| Entidade | Papel |
|---|---|
| `Tenant` | Cliente pagante (indústria) ou organização representada na plataforma |
| `TenantSettings` | Configurações por tenant (branding, domínio, preferências) |
| `TenantFeatureFlag` | Módulos habilitados por tenant (AI_COPILOT, SUPPLIER_PORTAL, ...) |
| `Subscription` | Assinatura ativa de um tenant a um `Plan` |
| `Plan` | Definição de plano comercial (franquia de documentos, preço, limites) |
| `Usage` | Métricas de consumo por tenant/período (documentos processados, análises de IA, storage) |

### 2.2 Usuários e acesso
| Entidade | Papel |
|---|---|
| `User` | Conta de usuário (pode ter acesso a múltiplos tenants via `UserTenantAccess`) |
| `UserTenantAccess` | Associação usuário↔tenant (+ unidade, quando aplicável) |
| `Role` | Papel (Super Admin, Admin do Tenant, Gestor, Analista, Segurança, Auditor, Operador, Fornecedor, Trabalhador) |
| `Permission` | Permissão granular (`recurso.ação`), catálogo global |
| `RolePermission` | Associação role↔permission |
| `UserRole` | Associação user↔role (escopada por tenant) |
| `Session` | Sessão ativa (para revogação e controle de dispositivos) |
| `AuditLog` | Trilha de auditoria genérica (quem, quando, ação, entidade, antes/depois) |

### 2.3 Empresas (contratadas)
| Entidade | Papel |
|---|---|
| `Company` | Empresa contratada gerida pelo tenant |
| `CompanyContact` | Contatos da empresa |
| `CompanyAddress` | Endereços da empresa |
| `CompanyStatus` | Histórico de status (ativo, suspenso, bloqueado) |
| `CompanyRisk` | Snapshot/histórico de risco calculado da empresa |

### 2.4 Prestadores/fornecedores
| Entidade | Papel |
|---|---|
| `Supplier` | Fornecedor/prestador de serviço (pode coincidir com `Company` em alguns casos — relação a refinar na Fase 1 conforme regra de negócio real) |
| `SupplierCategory` | Categoria/segmento do fornecedor |
| `SupplierStatus` | Histórico de status |
| `SupplierRisk` | Snapshot/histórico de Supplier Score |

### 2.5 Contratos
| Entidade | Papel |
|---|---|
| `Contract` | Contrato entre tenant e empresa/fornecedor |
| `ContractVersion` | Versionamento de alterações contratuais |
| `ContractRequirement` | Requisitos vinculados ao contrato (via Requirement Engine) |
| `ContractStatus` | Histórico de status |
| `ContractRisk` | Snapshot/histórico de risco do contrato |

### 2.6 Trabalhadores
| Entidade | Papel |
|---|---|
| `Worker` | Trabalhador vinculado a uma empresa/fornecedor |
| `WorkerDocument` | Documentos do trabalhador (liga a `Document`) |
| `WorkerQualification` | Qualificações formais |
| `WorkerTraining` | Treinamentos e validades (ex.: NR-35) |
| `WorkerAssignment` | Alocação em atividade/contrato/unidade |
| `WorkerAccess` | Autorizações de acesso físico (integração futura com catracas) |
| `WorkerRisk` | Snapshot/histórico de risco do trabalhador |

### 2.7 Documentos
| Entidade | Papel |
|---|---|
| `Document` | Documento (arquivo + metadados) |
| `DocumentVersion` | Versões do arquivo |
| `DocumentType` | Catálogo de tipos (ASO, NR-35, contrato social, ...) — global, com extensão por tenant |
| `DocumentRequirement` | Vínculo entre um requisito e o tipo de documento que o satisfaz |
| `DocumentValidation` | Resultado de validação (regra aplicada, resultado) |
| `DocumentExtraction` | Dados extraídos pela IA (estruturado) |
| `DocumentExpiration` | Controle de vencimento |
| `DocumentAudit` | Trilha de auditoria específica do documento |

### 2.8 Requisitos
| Entidade | Papel |
|---|---|
| `Requirement` | Requisito individual (ex.: "ASO compatível") |
| `RequirementSet` | Conjunto de requisitos aplicável a uma atividade/contrato |
| `RequirementRule` | Regra que determina quando um requisito se aplica |
| `RequirementException` | Exceção documentada a um requisito (com justificativa e aprovador) |

### 2.9 Atividades e locais
| Entidade | Papel |
|---|---|
| `Activity` | Atividade operacional (ex.: "trabalho em altura") |
| `ActivityRisk` | Fatores de risco associados à atividade |
| `ActivityRequirement` | Requisitos exigidos pela atividade |
| `Site` | Unidade/planta |
| `Area` | Área dentro de um site |
| `AccessPoint` | Ponto de acesso físico (portaria, catraca) |

### 2.10 Auditoria (processo)
| Entidade | Papel |
|---|---|
| `Audit` | Auditoria/fiscalização realizada |
| `AuditFinding` | Achado de auditoria |
| `CorrectiveAction` | Ação corretiva vinculada a um achado |
| `Evidence` | Evidência anexada (documento, foto, referência) |

### 2.11 IA
| Entidade | Papel |
|---|---|
| `AIAnalysis` | Registro genérico de uma execução de IA sobre uma entidade |
| `AIExtraction` | Dados extraídos de um documento |
| `AIClassification` | Classificação de tipo/categoria |
| `AIAnomaly` | Anomalia detectada pelo AI Auditor |
| `AIRecommendation` | Recomendação gerada (para Decision Engine ou Copilot) |
| `AIConversation` | Histórico de interação com o Copilot |

### 2.12 Notificações
| Entidade | Papel |
|---|---|
| `Notification` | Notificação individual enviada/gerada |
| `NotificationTemplate` | Modelo de mensagem |
| `NotificationRule` | Regra que dispara notificações a partir de eventos |

### 2.13 Workflow
| Entidade | Papel |
|---|---|
| `Task` | Tarefa acionável (ex.: "regularizar documento X") |
| `Workflow` | Definição de um fluxo (trigger → condition → action → approval) |
| `WorkflowStep` | Etapa de um workflow |
| `Approval` | Registro de aprovação/rejeição em uma etapa |

## 3. Relacionamentos-chave

```
Tenant 1—N Company, Supplier, Contract, Worker, Document, Site, Audit, ...

Company 1—N CompanyContact, CompanyAddress, CompanyStatus
Company 1—N Worker
Company N—N Contract (via ContractParty, a modelar na Fase 0)

Supplier 1—N Worker
Supplier 1—N SupplierStatus, SupplierRisk

Contract 1—N ContractVersion, ContractRequirement, ContractStatus, ContractRisk
Contract N—N Worker (via WorkerAssignment)

Worker 1—N WorkerDocument, WorkerQualification, WorkerTraining,
            WorkerAssignment, WorkerAccess, WorkerRisk

Document 1—N DocumentVersion, DocumentValidation, DocumentExtraction, DocumentAudit
Document N—1 DocumentType
Document N—1 DocumentExpiration (ou 1—1)

Activity N—N Requirement (via ActivityRequirement)
RequirementSet 1—N Requirement
RequirementSet N—1 Activity | Contract

Audit 1—N AuditFinding
AuditFinding 1—N CorrectiveAction, Evidence

AIAnalysis N—1 (entidade polimórfica: Document | Worker | Company | Contract)
```

A relação `Company` ↔ `Supplier` será decidida na Fase 1 com base na regra de
negócio real (uma mesma empresa pode ser simultaneamente "contratada" em um
contrato e "fornecedora" cadastrada — a modelagem final evita duplicar a mesma
pessoa jurídica em duas tabelas quando isso não for necessário).

## 4. Estratégia multi-tenant no banco

Duas camadas de proteção, não uma:

1. **Aplicação**: toda query Prisma passa por um `PrismaService` estendido que injeta
   `tenant_id` automaticamente a partir do contexto de request (nunca do payload do
   cliente).
2. **Banco**: **Row-Level Security (RLS)** nas tabelas com `tenant_id`, com a policy
   comparando contra uma variável de sessão (`SET app.current_tenant_id`) setada no
   início de cada transação/request. Isso garante que, mesmo em caso de bug na
   camada de aplicação (ex.: um `findMany` sem filtro), o banco recusa o vazamento.

## 5. Índices e performance

- Índice composto `(tenant_id, id)` (ou `tenant_id` como primeira coluna de todo
  índice relevante) em todas as tabelas de negócio.
- Índices dedicados para os campos mais consultados no Command Center: status de
  documento + data de vencimento, risk_score, status de trabalhador/empresa/contrato.
- Full-text/trigram search (`pg_trgm`) para a busca global (empresas, trabalhadores,
  contratos, documentos) antes de introduzir um motor de busca externo.

## 6. Retenção e LGPD

- Campos de dado pessoal sensível (documentos de identificação, CPF) marcados no
  schema com comentário/anotação para permitir auditoria automatizada de onde dados
  pessoais residem.
- Soft-delete + política de retenção configurável por tenant (a implementar como
  job periódico na Fase 1/12), com suporte a exclusão/anonimização mediante
  solicitação do titular.
- `AuditLog` e `DocumentAudit` não são apagáveis por rotas de aplicação padrão
  (somente por processo administrativo documentado).

## 7. Migrations

- Toda alteração de schema é uma migration Prisma versionada e commitada — nunca
  alteração manual direta no banco.
- Migrations destrutivas (`DROP COLUMN`, `DROP TABLE`, truncamento) exigem revisão
  explícita e não rodam automaticamente em produção sem confirmação documentada na PR.

## 8. Próximo passo

Este dicionário conceitual será convertido em `packages/database/schema.prisma` na
Fase 0, junto com o script de seed de dados de demonstração (claramente marcados como
`DEMO DATA`, nunca misturados a dados reais) descrito no `ROADMAP.md`.
