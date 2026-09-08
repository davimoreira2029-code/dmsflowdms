import { NextResponse } from "next/server";
import { requireRole, UnauthorizedError, ForbiddenError } from "@/server/guards/require-role";
import { listAllCompanies } from "@/server/services/platform-admin.service";

export async function GET() {
  try {
    await requireRole("SUPER_ADMIN");
    const companies = await listAllCompanies();
    return NextResponse.json({ success: true, data: companies, error: null, message: null });
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
      { success: false, data: null, error: "INTERNAL_ERROR", message: "Erro ao carregar empresas." },
      { status: 500 },
    );
  }
}
