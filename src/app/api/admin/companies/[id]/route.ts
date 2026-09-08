import { NextRequest, NextResponse } from "next/server";
import { requireRole, UnauthorizedError, ForbiddenError } from "@/server/guards/require-role";
import { getCompanyDetail } from "@/server/services/platform-admin.service";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole("SUPER_ADMIN");
    const company = await getCompanyDetail(params.id);
    if (!company) {
      return NextResponse.json(
        { success: false, data: null, error: "NOT_FOUND", message: "Empresa não encontrada." },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true, data: company, error: null, message: null });
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
      { success: false, data: null, error: "INTERNAL_ERROR", message: "Erro ao carregar empresa." },
      { status: 500 },
    );
  }
}
