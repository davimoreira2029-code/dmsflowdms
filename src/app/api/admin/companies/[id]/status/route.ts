import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole, UnauthorizedError, ForbiddenError } from "@/server/guards/require-role";
import { setCompanyStatus, CompanyNotFoundError } from "@/server/services/platform-admin.service";
import { recordAudit } from "@/server/services/audit.service";

const schema = z.object({ status: z.enum(["ACTIVE", "SUSPENDED"]) });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireRole("SUPER_ADMIN");

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, data: null, error: "VALIDATION_ERROR", message: "Status inválido." },
        { status: 400 },
      );
    }

    const company = await setCompanyStatus(params.id, parsed.data.status);

    await recordAudit({
      companyId: company.id,
      userId: admin.id,
      action: parsed.data.status === "SUSPENDED" ? "ADMIN_COMPANY_SUSPENDED" : "ADMIN_COMPANY_REACTIVATED",
      entity: "companies",
      entityId: company.id,
    });

    return NextResponse.json({
      success: true,
      data: company,
      error: null,
      message: parsed.data.status === "SUSPENDED" ? "Empresa bloqueada." : "Empresa reativada.",
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
    if (err instanceof CompanyNotFoundError) {
      return NextResponse.json(
        { success: false, data: null, error: "NOT_FOUND", message: err.message },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { success: false, data: null, error: "INTERNAL_ERROR", message: "Erro ao alterar status da empresa." },
      { status: 500 },
    );
  }
}
