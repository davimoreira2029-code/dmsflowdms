import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createPasswordResetRequest } from "@/server/services/password-reset.service";
import { forgotPasswordRateLimiter } from "@/server/rate-limit";

const schema = z.object({
  email: z.string().email(),
});

const GENERIC_MESSAGE =
  "Recebemos sua solicitação. Por segurança, ela foi encaminhada ao administrador do sistema. Aguarde a liberação de um novo acesso.";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, data: null, error: "VALIDATION_ERROR", message: "Informe um e-mail válido." },
      { status: 400 },
    );
  }

  const ip = req.headers.get("x-forwarded-for") ?? undefined;
  const userAgent = req.headers.get("user-agent") ?? undefined;

  // Item 8/12: rate limiting — no máximo 3 solicitações por e-mail a
  // cada hora, evitando spam de e-mail para o administrador e para o
  // dono da conta. Resposta continua a MESMA genérica quando bloqueado
  // (nunca revela que o limite foi atingido) — mantém a garantia de
  // não confirmar/negar existência de conta.
  if (forgotPasswordRateLimiter.check(parsed.data.email.toLowerCase().trim(), 3, 60 * 60 * 1000)) {
    await createPasswordResetRequest(parsed.data.email, { ip, userAgent });
  }

  return NextResponse.json({
    success: true,
    data: null,
    error: null,
    message: GENERIC_MESSAGE,
  });
}
