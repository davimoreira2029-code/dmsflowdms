import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, UnauthorizedError } from "@/server/guards/require-role";
import { completeForcedPasswordChange } from "@/server/services/password-reset.service";

const schema = z
  .object({
    currentTemporaryPassword: z.string().min(1),
    newPassword: z.string().min(8, "A nova senha deve ter ao menos 8 caracteres."),
    confirmNewPassword: z.string().min(1),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmNewPassword"],
  });

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: "VALIDATION_ERROR",
          message: parsed.error.errors[0]?.message ?? "Dados inválidos.",
        },
        { status: 400 },
      );
    }

    const ip = req.headers.get("x-forwarded-for") ?? undefined;
    const userAgent = req.headers.get("user-agent") ?? undefined;

    await completeForcedPasswordChange(
      user.id,
      parsed.data.currentTemporaryPassword,
      parsed.data.newPassword,
      { ip, userAgent },
    );

    return NextResponse.json({
      success: true,
      data: null,
      error: null,
      message: "Senha alterada com sucesso. Faça login novamente.",
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json(
        { success: false, data: null, error: "UNAUTHORIZED", message: err.message },
        { status: 401 },
      );
    }
    const message = err instanceof Error ? err.message : "Erro ao alterar senha.";
    return NextResponse.json(
      { success: false, data: null, error: "INTERNAL_ERROR", message },
      { status: 400 },
    );
  }
}
