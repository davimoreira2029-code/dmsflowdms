# Testes — DMS FLOW

## Como rodar

```bash
npm test              # roda tudo uma vez
npx vitest             # modo watch
npx vitest run tests/permissions.test.ts   # um arquivo específico
```

## O que é testado e como

14 arquivos em `tests/`, 77 testes passando sem depender de banco de
dados — todos testam **funções puras** extraídas deliberadamente para
fora de qualquer código que importe Prisma (padrão estabelecido desde
a Fase 7, depois de um caso real onde uma função "pura" ainda dependia
de Prisma por estar no mesmo arquivo).

| Arquivo | O que testa |
|---|---|
| `permissions.test.ts` | Matriz de permissões por role |
| `date-range.test.ts` | Cálculo de período do dashboard |
| `service-filters.test.ts` | Filtro de listagem de serviços |
| `service-status-transitions.test.ts` | Máquina de estados de serviço |
| `checklist-rules.test.ts` | Bloqueio de finalização por item obrigatório |
| `tanatopraxia-rules.test.ts` | Validação de intervalo de horário |
| `vehicle-rules.test.ts` | Validação de KM (final >= inicial) |
| `inventory-rules.test.ts` | Cálculo de estoque, alerta de mínimo |
| `employee-rules.test.ts` | Mascaramento de CPF |
| `task-rules.test.ts` | Permissão de mudança de status de tarefa |
| `csv.test.ts` | Exportação CSV dos relatórios |
| `billing-rules.test.ts` | Cálculo de trial vencido/dias restantes |
| `rate-limit.test.ts` | Limite de tentativas de login/recuperação |
| `multi-tenancy.test.ts` | **Precisa de Postgres real** — isolamento entre empresas |

## Por que só 1 teste precisa de banco

Toda regra de negócio com lógica condicional relevante foi
deliberadamente extraída para um arquivo `*-rules.ts` sem import de
Prisma — isso permite testar a lógica sem precisar de infraestrutura.
As camadas de I/O (`*.service.ts`, rotas de API) fazem só orquestração
fina em cima dessas regras, então o risco residual sem cobertura é
baixo, mas real (erros de mapeamento Prisma, transações incorretas).

## O que NÃO é testado (honestidade sobre a lacuna)

- Testes de integração de API (chamar a rota HTTP de ponta a ponta).
- Testes de componente React (formulários, interações de UI).
- Testes end-to-end (Playwright/Cypress) do fluxo completo no navegador.
- O teste crítico de multi-tenancy só roda com Postgres real — nunca
  foi executado com sucesso neste ambiente de desenvolvimento (rede
  bloqueada para o binário do Prisma, ver `ARCHITECTURE.md`). Rodar
  localmente antes de considerar a aplicação pronta para produção:

```bash
docker compose up -d
npm run db:generate && npm run db:migrate:dev && npm run db:seed
npm test
```
