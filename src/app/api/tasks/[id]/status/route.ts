import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCompanyContext, NoCompanyContextError } from "@/server/guards/require-tenant-scope";
import { requireAuth, UnauthorizedError, ForbiddenError } from "@/server/guards/require-role";
import { hasPermission } from "@/server/permissions";
import { changeTaskStatus, TaskNotFoundError, TaskStatusForbiddenError } from "@/server/services/task.service";

const schema = z.object({
  status: z.enum(["A_FAZER", "EM_ANDAMENTO", "CONCLUIDA", "CANCELADA"]),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { companyId, userId } = await requireCompanyContext();
    const user = await requireAuth();

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, data: null, error: "VALIDATION_ERROR", message: "Status inválido." },
        { status: 400 },
      );
    }

    const hasManagePermission = hasPermission(user.role, "MANAGE_TASKS");
    const task = await changeTaskStatus(params.id, companyId, userId, hasManagePermission, parsed.data.status);

    return NextResponse.json({ success: true, data: task, error: null, message: "Status atualizado." });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json(
        { success: false, data: null, error: "UNAUTHORIZED", message: err.message },
        { status: 401 },
      );
    }
    if (err instanceof NoCompanyContextError || err instanceof ForbiddenError || err instanceof TaskStatusForbiddenError) {
      return NextResponse.json(
        { success: false, data: null, error: "FORBIDDEN", message: err.message },
        { status: 403 },
      );
    }
    if (err instanceof TaskNotFoundError) {
      return NextResponse.json(
        { success: false, data: null, error: "NOT_FOUND", message: err.message },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { success: false, data: null, error: "INTERNAL_ERROR", message: "Erro ao alterar status." },
      { status: 500 },
    );
  }
}
