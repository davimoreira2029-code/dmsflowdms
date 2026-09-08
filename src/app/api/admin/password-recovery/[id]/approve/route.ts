import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole, ForbiddenError, UnauthorizedError } from "@/server/guards/require-role";
import { approvePasswordResetRequest } from "@/server/services/password-reset.service";

const schema = z.object({
  temporaryPassword: z.string().min(8, "A senha temporária deve ter ao menos 8 caracteres."),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireRole("SUPER_ADMIN");

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

    await approvePasswordResetRequest(params.id, parsed.data.temporaryPassword, admin.id, {
      ip,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: null,
      error: null,
      message: "Senha redefinida. O usuário deverá trocá-la no próximo login.",
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json(
        { success: false, data: null, error: "UNAUTHORIZED", message: err.message },
        { status: 401 },
      );
    }
    if (err instanceof ForbiddenError) {
      return NextResponse.json(
        { success: false, data: null, error: "FORBIDDEN", message: err.message },
        { status: 403 },
      );
    }
    const message = err instanceof Error ? err.message : "Erro ao aprovar solicitação.";
    return NextResponse.json(
      { success: false, data: null, error: "INTERNAL_ERROR", message },
      { status: 400 },
    );
  }
}
