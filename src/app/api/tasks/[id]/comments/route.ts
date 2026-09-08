import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCompanyContext, NoCompanyContextError } from "@/server/guards/require-tenant-scope";
import { requirePermission } from "@/server/guards/require-permission";
import { UnauthorizedError, ForbiddenError } from "@/server/guards/require-role";
import { addTaskComment, TaskNotFoundError } from "@/server/services/task.service";

const schema = z.object({ texto: z.string().min(1, "Escreva um comentário.") });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { companyId, userId } = await requireCompanyContext();
    await requirePermission("READ");

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, data: null, error: "VALIDATION_ERROR", message: "Comentário inválido." },
        { status: 400 },
      );
    }

    const comment = await addTaskComment(params.id, companyId, userId, parsed.data.texto);
    return NextResponse.json({ success: true, data: comment, error: null, message: "Comentário adicionado." });
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
    if (err instanceof TaskNotFoundError) {
      return NextResponse.json(
        { success: false, data: null, error: "NOT_FOUND", message: err.message },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { success: false, data: null, error: "INTERNAL_ERROR", message: "Erro ao comentar." },
      { status: 500 },
    );
  }
}
