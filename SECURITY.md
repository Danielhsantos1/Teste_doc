# DocDeck — Segurança e Privacidade (Proposta)

> Status: **Proposta para validação.** Descreve os requisitos de segurança que
> orientarão a implementação a partir da Fase 0. Nenhum controle abaixo está
> implementado ainda — este documento é a especificação, não um relatório de
> conformidade.

## 1. Por que segurança é requisito estrutural aqui

O DocDeck processa documentos com dados pessoais (potencialmente sensíveis: CPF,
ASO/dados de saúde ocupacional, dados de qualificação profissional) de trabalhadores
de terceiros, contratos entre empresas, e decisões que bloqueiam ou autorizam o
acesso de uma pessoa a uma atividade/local físico. Uma falha de isolamento entre
tenants ou uma decisão automatizada errada tem consequência real (trabalhista,
fiscal, de segurança física). Por isso, segurança precede performance e velocidade
na ordem de prioridade de decisão técnica do projeto (ver `ARCHITECTURE.md` e a
regra de decisão do briefing: segurança → confiabilidade → simplicidade →
manutenibilidade → performance → custo → velocidade).

## 2. Isolamento multi-tenant

- `tenant_id` nunca é aceito a partir do frontend/payload — sempre derivado do
  token de autenticação no backend.
- Defesa em duas camadas: filtro obrigatório na camada de aplicação (Prisma) +
  Row-Level Security no PostgreSQL (ver `DATABASE.md` §4). Um bug de aplicação
  isolado não deve ser suficiente para vazar dados entre tenants.
- Toda alteração de vínculo de tenant de um usuário é registrada em `AuditLog`.
- Testes de integração dedicados a tentar acessar dados de outro tenant fazem parte
  da suíte obrigatória antes de qualquer release (ver §9).

## 3. Autenticação e sessão

- Senhas: hashing com algoritmo de custo adaptativo (bcrypt/argon2), nunca texto
  puro, nunca reversível.
- Proteção contra força bruta: rate limiting por IP e por conta em endpoints de
  login/recuperação de senha, com backoff progressivo.
- Estrutura pronta para MFA (campo de configuração no `User`, fluxo de verificação
  ativável por feature flag) — não obrigatório no MVP, mas o schema e o fluxo de
  login já preveem o passo adicional.
- Controle de sessão: sessões revogáveis (`Session`), logout invalida o token/sessão
  correspondente, não apenas o client-side.
- Recuperação de senha via fluxo com token de uso único e expiração curta.

## 4. Autorização (RBAC granular)

- Nunca checagem de autorização por comparação direta de string de papel
  (`if user.role === 'admin'`). Toda ação sensível verifica uma permissão granular
  (`recurso.ação`) resolvida via `Role → RolePermission → Permission`.
- Toda rota de API passa por um guard central que resolve, nesta ordem:
  autenticação válida → tenant do usuário → permissão exigida pela rota →
  validação de payload. Nenhuma dessas checagens é responsabilidade do frontend.
- O frontend nunca é fonte de verdade para autorização — esconder um botão não
  substitui a checagem no backend.

## 5. Proteção de aplicação (OWASP)

- **Injeção SQL**: mitigada estruturalmente pelo uso de Prisma (queries
  parametrizadas); nenhuma query SQL raw concatenando input de usuário.
- **XSS**: sanitização de entrada/saída onde há renderização de conteúdo gerado por
  usuário (nomes, observações, campos extraídos de documentos exibidos na UI);
  React já escapa por padrão, mas conteúdo injetado via `dangerouslySetInnerHTML`
  é proibido salvo necessidade documentada e revisada.
- **CSRF**: proteção aplicável a fluxos baseados em cookie de sessão (a decidir
  entre JWT em header vs. cookie httpOnly na Fase 0 — se cookie, CSRF token
  obrigatório).
- **Rate limiting**: em endpoints de autenticação, upload e IA (que têm custo
  computacional/financeiro maior).
- **Validação de entrada**: todo payload de API validado (schema Zod/class-validator)
  antes de tocar qualquer lógica de domínio; uploads validados por tipo/tamanho
  antes de entrarem na fila de processamento.

## 6. Segredos e configuração

- Nenhum secret, API key ou credencial no código-fonte ou no frontend.
- Variáveis de ambiente/segredos geridos fora do Git (secret manager do provedor de
  infraestrutura), com rotação documentada.
- `.env` de exemplo (`*.env.example`) versionado sem valores reais.

## 7. Auditoria

- `AuditLog` genérico registra: quem, quando, ação, entidade afetada, valor
  anterior, valor novo, origem (IP quando aplicável), motivo (quando fornecido pelo
  usuário, ex.: revisão manual de documento).
- Logs de auditoria críticos (mudança de status de documento/trabalhador/contrato,
  mudanças de permissão, exclusões) não são apagáveis por rota de aplicação padrão.
- Toda decisão automatizada (Rules/Risk/Decision Engine) é auditável: qual regra,
  qual versão, qual confiança, qual evidência, quando (ver `ARCHITECTURE.md` §10 e
  a seção de explicabilidade abaixo).

## 8. IA e segurança

- A IA nunca é autoridade absoluta: toda saída carrega confidence score, evidência,
  modelo e versão de prompt/regra, e é revisável por humano.
- Auto-validação só ocorre acima de um threshold de confiança configurável por
  tenant; abaixo disso, vai para revisão humana obrigatória.
- A IA nunca altera dados críticos silenciosamente nem aprova algo que exige
  decisão humana sem uma regra explícita permitindo isso.
- Prompt injection é tratada como superfície de ataque real: conteúdo extraído de
  documentos ou digitado por usuários (incluindo perguntas ao Copilot) nunca é
  concatenado a instruções de sistema sem isolamento; o Copilot só executa leitura
  de dados via os mesmos serviços de domínio com as mesmas checagens de tenant/
  permissão do resto do sistema — nunca query direta e irrestrita ao banco.
- Upload de documentos passa por validação de tipo/tamanho e varredura antes de
  entrar no pipeline de IA, para reduzir superfície de ataque via arquivo malicioso.

## 9. Testes de segurança como parte da definição de pronto

Conforme critério de aceite do projeto (ver `ARCHITECTURE.md`/roadmap), nenhuma
funcionalidade que toque dados de tenant é considerada pronta sem:

- teste de isolamento de tenant (tentativa de acesso cruzado deve falhar);
- teste de autorização (usuário sem permissão deve receber 403, não 200 com dado
  vazio nem 404 que revele existência do recurso indevidamente);
- teste de validação de entrada (payloads malformados/maliciosos rejeitados).

## 10. LGPD

- **Finalidade**: cada dado pessoal coletado tem finalidade documentada (ex.: CPF do
  trabalhador para validação de documentos e controle de acesso).
- **Minimização**: coleta apenas o necessário para a finalidade declarada; campos
  sensíveis (dados de saúde ocupacional, quando presentes em ASO) recebem controle
  de acesso mais restrito que dados cadastrais gerais.
- **Controle de acesso**: RBAC granular também para dados pessoais (ex.: permissão
  específica para visualizar dados de saúde ocupacional, distinta de visualizar
  cadastro básico).
- **Rastreabilidade**: toda leitura/alteração de dado pessoal sensível é auditável.
- **Retenção**: política de retenção configurável por tenant, com expurgo/
  anonimização automatizável (job periódico, a implementar).
- **Direitos do titular**: estrutura para atender solicitação de acesso, correção,
  portabilidade (exportação) e exclusão/anonimização de dados de um titular
  (trabalhador), com fluxo de registro da solicitação e prazo de atendimento.
- LGPD não é tratada como um checkbox de aceite de termos — é um conjunto de
  controles técnicos (acesso, retenção, exportação, exclusão) que fazem parte do
  modelo de dados e do RBAC desde a Fase 0.

## 11. Backups e continuidade

- Backup regular do banco de dados e do object storage, com teste periódico de
  restauração (a documentar operacionalmente na Fase 0/12).
- Política de retenção de backup alinhada à política de retenção de dados por
  tenant.

## 12. Explicabilidade como controle de segurança/confiança

Toda decisão automatizada deve poder responder, sob demanda: por quê, baseado em
quê, qual documento, qual regra, qual versão da regra, quando foi analisado, qual
foi a confiança. Isso não é apenas requisito de produto (Seção 66 do briefing) — é
um controle de segurança: decisões que bloqueiam o acesso ou a operação de uma
pessoa precisam ser auditáveis e contestáveis.

## 13. Escopo ainda não coberto por este documento

Este documento cobre os controles previstos para a Fase 0–1. Tópicos de segurança
de fases posteriores (SSO/SCIM, integração com controle de acesso físico/catracas,
webhooks de integrações externas, API marketplace) serão detalhados quando essas
fases forem iniciadas, conforme `ROADMAP.md`.
