import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCompanyContext, NoCompanyContextError } from "@/server/guards/require-tenant-scope";
import { requirePermission } from "@/server/guards/require-permission";
import { UnauthorizedError, ForbiddenError } from "@/server/guards/require-role";
import { listTasks, createTask } from "@/server/services/task.service";

export async function GET(req: NextRequest) {
  try {
    const { companyId } = await requireCompanyContext();
    await requirePermission("READ");

    const params = req.nextUrl.searchParams;
    const statusParam = params.get("status");
    const status = ["A_FAZER", "EM_ANDAMENTO", "CONCLUIDA", "CANCELADA"].includes(statusParam ?? "")
      ? (statusParam as "A_FAZER" | "EM_ANDAMENTO" | "CONCLUIDA" | "CANCELADA")
      : undefined;

    const tasks = await listTasks(companyId, {
      status,
      responsavelId: params.get("responsavelId") ?? undefined,
    });

    return NextResponse.json({ success: true, data: tasks, error: null, message: null });
  } catch (err) {
    return handleError(err);
  }
}

const createSchema = z.object({
  titulo: z.string().min(1, "Informe o título."),
  descricao: z.string().optional(),
  responsavelId: z.string().uuid().optional(),
  prioridade: z.enum(["BAIXA", "NORMAL", "ALTA", "URGENTE"]).optional(),
  dataInicio: z.coerce.date().optional(),
  prazo: z.coerce.date().optional(),
  servicoId: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { companyId, userId } = await requireCompanyContext();
    await requirePermission("CREATE");

    const body = await req.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: "VALIDATION_ERROR",
          message: parsed.error.errors[0]?.message ?? "Dados inválidos.",
        },
        { status: 400 },
      );
    }

    const task = await createTask(companyId, userId, parsed.data);
    return NextResponse.json({ success: true, data: task, error: null, message: "Tarefa criada." });
  } catch (err) {
    return handleError(err);
  }
}

function handleError(err: unknown) {
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
    { success: false, data: null, error: "INTERNAL_ERROR", message: "Erro ao processar a requisição." },
    { status: 500 },
  );
}
