import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole, ForbiddenError, UnauthorizedError } from "@/server/guards/require-role";
import { rejectPasswordResetRequest } from "@/server/services/password-reset.service";

const schema = z.object({
  adminNotes: z.string().max(500).optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireRole("SUPER_ADMIN");

    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, data: null, error: "VALIDATION_ERROR", message: "Dados inválidos." },
        { status: 400 },
      );
    }

    const ip = req.headers.get("x-forwarded-for") ?? undefined;
    const userAgent = req.headers.get("user-agent") ?? undefined;

    await rejectPasswordResetRequest(params.id, admin.id, parsed.data.adminNotes, { ip, userAgent });

    return NextResponse.json({
      success: true,
      data: null,
      error: null,
      message: "Solicitação rejeitada.",
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
    const message = err instanceof Error ? err.message : "Erro ao rejeitar solicitação.";
    return NextResponse.json(
      { success: false, data: null, error: "INTERNAL_ERROR", message },
      { status: 400 },
    );
  }
}
