import { NextResponse } from "next/server";
import { requireCompanyContext, NoCompanyContextError } from "@/server/guards/require-tenant-scope";
import { UnauthorizedError } from "@/server/guards/require-role";
import { listEnabledModules } from "@/server/services/module.service";

export async function GET() {
  try {
    const { companyId } = await requireCompanyContext();
    const modules = await listEnabledModules(companyId);
    return NextResponse.json({ success: true, data: modules, error: null, message: null });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json(
        { success: false, data: null, error: "UNAUTHORIZED", message: err.message },
        { status: 401 },
      );
    }
    if (err instanceof NoCompanyContextError) {
      return NextResponse.json(
        { success: false, data: null, error: "FORBIDDEN", message: err.message },
        { status: 403 },
      );
    }
    return NextResponse.json(
      { success: false, data: null, error: "INTERNAL_ERROR", message: "Erro ao carregar módulos." },
      { status: 500 },
    );
  }
}
