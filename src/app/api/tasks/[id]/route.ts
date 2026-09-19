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

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { companyId } = await requireCompanyContext();
    await requireRole("ADMIN_EMPRESA", "SUPER_ADMIN");
    const { prisma } = await import("@/server/db");
    await prisma.task.delete({ where: { id: params.id, companyId } });
    return NextResponse.json({ success: true, data: null, error: null, message: "Tarefa excluida." });
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ success: false, data: null, error: "UNAUTHORIZED", message: (err as Error).message }, { status: 401 });
    if (err instanceof NoCompanyContextError || err instanceof ForbiddenError) return NextResponse.json({ success: false, data: null, error: "FORBIDDEN", message: (err as Error).message }, { status: 403 });
    return NextResponse.json({ success: false, data: null, error: "INTERNAL_ERROR", message: "Erro ao excluir." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { companyId } = await requireCompanyContext();
    await requireRole("ADMIN_EMPRESA", "SUPER_ADMIN");
    const { prisma } = await import("@/server/db");
    const body = await req.json();
    const task = await prisma.task.update({ where: { id: params.id, companyId }, data: { titulo: body.titulo, descricao: body.descricao, prioridade: body.prioridade, status: body.status } });
    return NextResponse.json({ success: true, data: task, error: null, message: null });
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ success: false, data: null, error: "UNAUTHORIZED", message: (err as Error).message }, { status: 401 });
    if (err instanceof NoCompanyContextError || err instanceof ForbiddenError) return NextResponse.json({ success: false, data: null, error: "FORBIDDEN", message: (err as Error).message }, { status: 403 });
    return NextResponse.json({ success: false, data: null, error: "INTERNAL_ERROR", message: "Erro ao atualizar." }, { status: 500 });
  }
}
