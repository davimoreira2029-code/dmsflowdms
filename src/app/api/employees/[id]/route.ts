import { NextRequest, NextResponse } from "next/server";
import { requireCompanyContext, NoCompanyContextError } from "@/server/guards/require-tenant-scope";
import { requirePermission } from "@/server/guards/require-permission";
import { UnauthorizedError, ForbiddenError, requireAuth } from "@/server/guards/require-role";
import { hasPermission } from "@/server/permissions";
import { getEmployeeDetail } from "@/server/services/employee.service";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { companyId } = await requireCompanyContext();
    const user = await requireAuth();
    await requirePermission("READ");

    const canViewSensitiveData = hasPermission(user.role, "MANAGE_USERS");
    const employee = await getEmployeeDetail(params.id, companyId, canViewSensitiveData);

    if (!employee) {
      return NextResponse.json(
        { success: false, data: null, error: "NOT_FOUND", message: "Funcionário não encontrado." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: employee, error: null, message: null });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json(
        { success: false, data: null, error: "UNAUTHORIZED", message: err.message },
        { status: 401 },
      );
    }
    if (err instanceof NoCompanyContextError || err instanceof ForbiddenError) {
      return NextResponse.json(
        { success: false, data: null, error: "FORBIDDEN", message: err.message },
        { status: 403 },
      );
    }
    return NextResponse.json(
      { success: false, data: null, error: "INTERNAL_ERROR", message: "Erro ao carregar funcionário." },
      { status: 500 },
    );
  }
}
