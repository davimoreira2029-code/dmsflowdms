import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCompanyContext, NoCompanyContextError } from "@/server/guards/require-tenant-scope";
import { requirePermission } from "@/server/guards/require-permission";
import { UnauthorizedError, ForbiddenError } from "@/server/guards/require-role";
import { hasPermission } from "@/server/permissions";
import {
  changeServiceStatus,
  ServiceNotFoundError,
  InvalidStatusTransitionError,
  ChecklistPendingError,
} from "@/server/services/service.service";

const schema = z.object({
  status: z.enum(["NOVO", "EM_PREPARACAO", "EM_ANDAMENTO", "AGUARDANDO", "FINALIZADO", "ARQUIVADO"]),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { companyId, userId, role } = await requireCompanyContext();
    await requirePermission("MANAGE_SERVICES");

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, data: null, error: "VALIDATION_ERROR", message: "Status inválido." },
        { status: 400 },
      );
    }

    const allowOverride = hasPermission(role, "MANAGE_CHECKLISTS");
    const updated = await changeServiceStatus(
      params.id,
      companyId,
      userId,
      parsed.data.status,
      allowOverride,
    );

    return NextResponse.json({ success: true, data: updated, error: null, message: "Status atualizado." });
  } catch (err) {
    if (err instanceof ChecklistPendingError) {
      return NextResponse.json(
        { success: false, data: null, error: "CHECKLIST_PENDING", message: err.message },
        { status: 409 },
      );
    }
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
    if (err instanceof ServiceNotFoundError) {
      return NextResponse.json(
        { success: false, data: null, error: "NOT_FOUND", message: err.message },
        { status: 404 },
      );
    }
    if (err instanceof InvalidStatusTransitionError) {
      return NextResponse.json(
        { success: false, data: null, error: "INVALID_TRANSITION", message: err.message },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { success: false, data: null, error: "INTERNAL_ERROR", message: "Erro ao alterar status." },
      { status: 500 },
    );
  }
}
