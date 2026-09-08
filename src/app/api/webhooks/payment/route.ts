import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { confirmPaymentFromWebhook, InvalidWebhookSignatureError } from "@/server/services/billing.service";

/**
 * Endpoint público por natureza (o gateway de pagamento chama de fora),
 * mas NUNCA confia cegamente no payload — valida a assinatura contra
 * PAYMENT_GATEWAY_WEBHOOK_SECRET (item 31: "nunca considerar pagamento
 * confirmado apenas pelo frontend"). Sem cabeçalho válido, rejeita.
 *
 * Estrutura pronta para um provedor real — o formato exato do header de
 * assinatura (ex.: HMAC) muda por gateway; ajustar quando integrar.
 */
const schema = z.object({
  subscriptionId: z.string().uuid(),
  valorCentavos: z.number().int(),
  gatewayRef: z.string(),
  status: z.enum(["CONFIRMED", "FAILED"]),
});

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-webhook-signature") ?? "";

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, data: null, error: "VALIDATION_ERROR", message: "Payload inválido." },
      { status: 400 },
    );
  }

  try {
    const payment = await confirmPaymentFromWebhook(signature, parsed.data);
    return NextResponse.json({ success: true, data: { paymentId: payment.id }, error: null, message: null });
  } catch (err) {
    if (err instanceof InvalidWebhookSignatureError) {
      return NextResponse.json(
        { success: false, data: null, error: "INVALID_SIGNATURE", message: err.message },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { success: false, data: null, error: "INTERNAL_ERROR", message: "Erro ao processar webhook." },
      { status: 500 },
    );
  }
}
