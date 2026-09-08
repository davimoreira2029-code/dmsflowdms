import { NextRequest, NextResponse } from "next/server";
import { requireRole, ForbiddenError, UnauthorizedError } from "@/server/guards/require-role";
import { getPasswordResetRequest } from "@/server/services/password-reset.service";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole("SUPER_ADMIN");

    const request = await getPasswordResetRequest(params.id);
    if (!request) {
      return NextResponse.json(
        { success: false, data: null, error: "NOT_FOUND", message: "Solicitação não encontrada." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: request, error: null, message: null });
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
    return NextResponse.json(
      { success: false, data: null, error: "INTERNAL_ERROR", message: "Erro ao carregar solicitação." },
      { status: 500 },
    );
  }
}
