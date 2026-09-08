import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCompanyContext, NoCompanyContextError } from "@/server/guards/require-tenant-scope";
import { requirePermission } from "@/server/guards/require-permission";
import { UnauthorizedError, ForbiddenError } from "@/server/guards/require-role";
import {
  updateChecklistItemStatus,
  ChecklistItemNotFoundError,
} from "@/server/services/checklist.service";

const schema = z.object({
  status: z.enum(["PENDENTE", "CONCLUIDO", "NAO_APLICAVEL"]),
});

export async function POST(req: NextRequest, { params }: { params: { itemId: string } }) {
  try {
    const { companyId, userId } = await requireCompanyContext();
    // UPDATE é a permissão mais ampla que cobre OPERACIONAL — quem
    // executa o checklist no dia a dia não precisa de MANAGE_CHECKLISTS.
    await requirePermission("UPDATE");

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, data: null, error: "VALIDATION_ERROR", message: "Status inválido." },
        { status: 400 },
      );
    }

    const updated = await updateChecklistItemStatus(params.itemId, companyId, userId, parsed.data.status);

    return NextResponse.json({ success: true, data: updated, error: null, message: null });
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
    if (err instanceof ChecklistItemNotFoundError) {
      return NextResponse.json(
        { success: false, data: null, error: "NOT_FOUND", message: err.message },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { success: false, data: null, error: "INTERNAL_ERROR", message: "Erro ao atualizar item." },
      { status: 500 },
    );
  }
}
