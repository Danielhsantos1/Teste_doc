# DocDeck

**Do documento à decisão.**

Inteligência operacional para gestão de terceiros: transforma documentos em dados,
dados em conformidade, conformidade em risco, e risco em decisão operacional.

## Status do projeto

Este repositório está em **fase de arquitetura**. Nenhum código de aplicação foi
implementado ainda — a etapa atual é a proposta e validação da arquitetura antes do
início da implementação (Fase 0), conforme o processo descrito abaixo.

## Documentação

| Documento | Conteúdo |
|---|---|
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Stack, arquitetura de alto nível, estrutura de pastas proposta, multi-tenancy, autenticação/RBAC, camada de IA, Risk/Rules/Decision Engine |
| [`DATABASE.md`](./DATABASE.md) | Modelo de dados conceitual: domínios de entidade, relacionamentos, estratégia multi-tenant no banco, retenção/LGPD |
| [`SECURITY.md`](./SECURITY.md) | Requisitos de segurança, isolamento de tenant, RBAC, proteção OWASP, segurança de IA, LGPD |
| [`ROADMAP.md`](./ROADMAP.md) | Fases técnicas (0–12), relação com o roadmap comercial do pitch deck, critério de aceite por fase |

## Processo de construção

O projeto segue um processo deliberado de fundação antes de implementação:

1. **Análise** do briefing de produto e do estado atual do repositório — concluída.
2. **Diagnóstico** e **proposta de arquitetura** — os quatro documentos acima.
3. **Validação** da arquitetura proposta antes de qualquer código ser escrito.
4. **Implementação incremental**, uma fase do `ROADMAP.md` por vez, sem pular etapas
   e sem quebrar o que já funciona.

Nenhuma funcionalidade é implementada com dados simulados fingindo ser reais, botões
sem implementação, ou integrações falsas. Se algo ainda não está implementado, isso
fica explícito na documentação e no código.

## Próximo passo

Validação de `ARCHITECTURE.md`, `DATABASE.md` e `SECURITY.md`. Após validação, a
implementação começa pela **Fase 0 — Foundation** (`ROADMAP.md`).
