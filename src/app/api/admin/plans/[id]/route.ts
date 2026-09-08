import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole, UnauthorizedError, ForbiddenError } from "@/server/guards/require-role";
import { updatePlan, PlanNotFoundError } from "@/server/services/billing.service";
import { recordAudit } from "@/server/services/audit.service";

const schema = z.object({
  precoCentavos: z.coerce.number().int().min(0).optional(),
  limiteUsuarios: z.coerce.number().int().min(1).optional(),
  ativo: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireRole("SUPER_ADMIN");

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, data: null, error: "VALIDATION_ERROR", message: "Dados inválidos." },
        { status: 400 },
      );
    }

    const plan = await updatePlan(params.id, parsed.data);

    await recordAudit({
      userId: admin.id,
      action: "ADMIN_PLAN_UPDATED",
      entity: "plans",
      entityId: plan.id,
      newData: parsed.data,
    });

    return NextResponse.json({ success: true, data: plan, error: null, message: "Plano atualizado." });
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
    if (err instanceof PlanNotFoundError) {
      return NextResponse.json(
        { success: false, data: null, error: "NOT_FOUND", message: err.message },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { success: false, data: null, error: "INTERNAL_ERROR", message: "Erro ao atualizar plano." },
      { status: 500 },
    );
  }
}
