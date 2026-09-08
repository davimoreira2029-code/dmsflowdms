import { prisma } from "@/server/db";
import { isTrialExpired } from "@/server/services/billing-rules";

/**
 * Item 29: preços/planos SEMPRE configuráveis no banco, nunca fixos no
 * frontend. Esta função só popula os 4 planos iniciais (nome/limites) —
 * o Super Admin pode editar preço e recursos depois via
 * `updatePlan` (abaixo), sem precisar de deploy de código.
 */
export async function seedDefaultPlans() {
  const defaults = [
    { nome: "Starter", precoCentavos: 9900, limiteUsuarios: 5, features: ["GESTAO_FUNERARIA", "BALCAO_SERVICOS", "NOTIFICACOES"] },
    { nome: "Professional", precoCentavos: 19900, limiteUsuarios: 15, features: ["ESTOQUE", "VEICULOS", "RELATORIOS"] },
    { nome: "Business", precoCentavos: 39900, limiteUsuarios: 40, features: ["EQUIPE", "FINANCEIRO", "DOCUMENTOS"] },
    { nome: "Enterprise", precoCentavos: 79900, limiteUsuarios: 999, features: ["ASSOCIADOS", "DEPENDENTES", "GESTAO_PLANOS"] },
  ];

  for (const plan of defaults) {
    await prisma.plan.upsert({
      where: { nome: plan.nome },
      update: {},
      create: {
        nome: plan.nome,
        precoCentavos: plan.precoCentavos,
        limiteUsuarios: plan.limiteUsuarios,
        features: plan.features,
      },
    });
  }
}

export async function listActivePlans() {
  return prisma.plan.findMany({ where: { ativo: true }, orderBy: { precoCentavos: "asc" } });
}

export class PlanNotFoundError extends Error {
  constructor() {
    super("Plano não encontrado.");
  }
}

/** Super Admin edita preço/recursos sem precisar de deploy (item 29). */
export async function updatePlan(
  id: string,
  input: { precoCentavos?: number; limiteUsuarios?: number; features?: unknown; ativo?: boolean },
) {
  const plan = await prisma.plan.findUnique({ where: { id } });
  if (!plan) throw new PlanNotFoundError();

  return prisma.plan.update({ where: { id }, data: input as never });
}

/**
 * Cria a assinatura (item 31). NÃO processa pagamento real — só
 * registra a intenção. O status só vira ACTIVE quando o webhook do
 * gateway confirmar (ver `confirmPaymentFromWebhook`), nunca a partir
 * desta chamada direta do frontend.
 */
export async function createSubscription(companyId: string, planId: string) {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) throw new PlanNotFoundError();

  return prisma.subscription.create({
    data: { companyId, planId, status: "TRIAL" },
  });
}

export class InvalidWebhookSignatureError extends Error {
  constructor() {
    super("Assinatura do webhook inválida.");
  }
}

/**
 * Processa um evento vindo do gateway de pagamento. Estrutura pronta
 * para conectar a um provedor real depois (Fase futura) — por ora,
 * valida a assinatura contra PAYMENT_GATEWAY_WEBHOOK_SECRET e nunca
 * confia em confirmação de pagamento vinda direto do frontend (item 31).
 *
 * NÃO inventa integração bancária real — isso é intencional, conforme
 * combinado: a estrutura fica pronta, o provedor entra depois.
 */
export async function confirmPaymentFromWebhook(
  signature: string,
  payload: { subscriptionId: string; valorCentavos: number; gatewayRef: string; status: "CONFIRMED" | "FAILED" },
) {
  const expectedSecret = process.env.PAYMENT_GATEWAY_WEBHOOK_SECRET;
  if (!expectedSecret || signature !== expectedSecret) {
    throw new InvalidWebhookSignatureError();
  }

  const subscription = await prisma.subscription.findUnique({ where: { id: payload.subscriptionId } });
  if (!subscription) throw new Error("Assinatura não encontrada.");

  const payment = await prisma.payment.create({
    data: {
      subscriptionId: subscription.id,
      companyId: subscription.companyId,
      valorCentavos: payload.valorCentavos,
      status: payload.status,
      gatewayRef: payload.gatewayRef,
    },
  });

  await prisma.paymentEvent.create({
    data: {
      paymentId: payment.id,
      tipoEvento: payload.status === "CONFIRMED" ? "PAYMENT_CONFIRMED" : "PAYMENT_FAILED",
      payload: payload as never,
      processedAt: new Date(),
    },
  });

  if (payload.status === "CONFIRMED") {
    await prisma.$transaction([
      prisma.subscription.update({ where: { id: subscription.id }, data: { status: "ACTIVE" } }),
      prisma.company.update({ where: { id: subscription.companyId }, data: { status: "ACTIVE" } }),
    ]);
  }

  return payment;
}

/**
 * Marca empresas com trial vencido como EXPIRED. Preserva todos os
 * dados (item 30: "não excluir automaticamente") — só muda o status,
 * que bloqueia acesso via auth.ts. Chamado por uma rotina periódica
 * (cron externo ou chamada manual do Super Admin) — não há scheduler
 * embutido nesta fase.
 */
export async function expireOverdueTrials() {
  const now = new Date();
  const expiring = await prisma.company.findMany({
    where: { status: "TRIAL", trialEndsAt: { not: null } },
  });

  const toExpire = expiring.filter((c) => c.trialEndsAt && isTrialExpired(c.trialEndsAt, now));

  if (toExpire.length === 0) return 0;

  await prisma.company.updateMany({
    where: { id: { in: toExpire.map((c) => c.id) } },
    data: { status: "EXPIRED" },
  });

  return toExpire.length;
}
