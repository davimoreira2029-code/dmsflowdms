import { NextRequest, NextResponse } from "next/server";
import { requireCompanyContext, NoCompanyContextError } from "@/server/guards/require-tenant-scope";
import { requirePermission } from "@/server/guards/require-permission";
import { UnauthorizedError, ForbiddenError } from "@/server/guards/require-role";
import { getTaskDetail } from "@/server/services/task.service";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { companyId } = await requireCompanyContext();
    await requirePermission("READ");

    const task = await getTaskDetail(params.id, companyId);
    if (!task) {
      return NextResponse.json(
        { success: false, data: null, error: "NOT_FOUND", message: "Tarefa não encontrada." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: task, error: null, message: null });
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
      { success: false, data: null, error: "INTERNAL_ERROR", message: "Erro ao carregar tarefa." },
      { status: 500 },
    );
  }
}
