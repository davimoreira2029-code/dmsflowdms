import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCompanyContext, NoCompanyContextError } from "@/server/guards/require-tenant-scope";
import { requirePermission } from "@/server/guards/require-permission";
import { UnauthorizedError, ForbiddenError } from "@/server/guards/require-role";
import { createChecklistTemplate, listChecklistTemplates } from "@/server/services/checklist.service";

export async function GET() {
  try {
    const { companyId } = await requireCompanyContext();
    await requirePermission("READ");

    const templates = await listChecklistTemplates(companyId);
    return NextResponse.json({ success: true, data: templates, error: null, message: null });
  } catch (err) {
    return handleError(err);
  }
}

const itemSchema = z.object({
  descricao: z.string().min(1),
  ordem: z.number().int().min(0),
  obrigatorio: z.boolean(),
});

const createSchema = z.object({
  nome: z.string().min(1, "Informe o nome do checklist."),
  descricao: z.string().optional(),
  categoria: z.string().optional(),
  itens: z.array(itemSchema).min(1, "Adicione ao menos um item."),
});

export async function POST(req: NextRequest) {
  try {
    const { companyId } = await requireCompanyContext();
    await requirePermission("MANAGE_CHECKLISTS");

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

    const template = await createChecklistTemplate(companyId, parsed.data);

    return NextResponse.json({
      success: true,
      data: template,
      error: null,
      message: "Checklist criado com sucesso.",
    });
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
