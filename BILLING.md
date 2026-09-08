# Billing — DMS FLOW

## Estrutura (schema, Fase 2)

`plans` → `subscriptions` → `payments` → `payment_events`.
Preço, limite de usuários e recursos de cada plano vivem no banco
(`plans.preco_centavos`, nunca hardcoded no frontend — conferido em
`app/(public)/planos/page.tsx`).

## Planos padrão (seed)

Starter (R$99), Professional (R$199), Business (R$399), Enterprise
(R$799) — criados por `seedDefaultPlans()`
(`server/services/billing.service.ts`). Super Admin edita preço e
recursos via `updatePlan()` sem precisar de deploy de código (a API
para isso ainda não tem tela própria no painel admin — a função existe,
falta só o formulário).

## Trial

7 dias, sem cartão. `daysRemainingInTrial`/`isTrialExpired`
(`server/services/billing-rules.ts`) são funções puras, testadas
(`tests/billing-rules.test.ts`).

- Durante o trial: banner "termina em X dias" no topo do app.
- Trial vencido (`company.status = EXPIRED`): login continua permitido,
  mas o app inteiro é substituído por uma tela de "escolha um plano" —
  nenhum dado é apagado.
- Empresa suspensa/cancelada pelo Super Admin (`SUSPENDED`/`CANCELED`):
  bloqueio mais forte — login recusado, sessões ativas derrubadas.

## Fluxo de assinatura

```
Empresa escolhe plano → POST /api/companies/me/subscribe
  → cria Subscription (status TRIAL)
  → aguarda confirmação do gateway via webhook
  → POST /api/webhooks/payment (valida assinatura, nunca confia no frontend)
  → se CONFIRMED: Subscription vira ACTIVE, Company vira ACTIVE
```

## O que NÃO existe (intencional, não esquecido)

Nenhum gateway de pagamento real está integrado — nem Stripe, nem
PagSeguro, nem nenhum provedor brasileiro. A estrutura está pronta e
testada; conectar a um provedor real é uma decisão de negócio (qual
provedor, taxas, etc.) que cabe a quem for operar a plataforma, não
uma escolha técnica que eu devesse tomar sozinho.
