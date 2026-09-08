import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCompanyContext, NoCompanyContextError } from "@/server/guards/require-tenant-scope";
import { requirePermission } from "@/server/guards/require-permission";
import { requireModule, ModuleNotContractedError } from "@/server/guards/require-module";
import { UnauthorizedError, ForbiddenError } from "@/server/guards/require-role";
import { getServiceDetail, updateService, ServiceNotFoundError } from "@/server/services/service.service";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { companyId } = await requireCompanyContext();
    await requirePermission("READ");
    await requireModule(companyId, "GESTAO_FUNERARIA");

    // findFirst com id + companyId juntos: registro de outra empresa
    // retorna null aqui, nunca um objeto — vira 404, nunca 403.
    const service = await getServiceDetail(params.id, companyId);
    if (!service) {
      return NextResponse.json(
        { success: false, data: null, error: "NOT_FOUND", message: "Serviço não encontrado." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: service, error: null, message: null });
  } catch (err) {
    return handleError(err);
  }
}

const updateSchema = z.object({
  tipo: z.string().min(1).optional(),
  data: z.coerce.date().optional(),
  hora: z.string().min(1).optional(),
  falecidoNome: z.string().min(1).optional(),
  responsavelId: z.string().uuid().nullable().optional(),
  local: z.string().optional(),
  destino: z.string().optional(),
  veiculoId: z.string().uuid().nullable().optional(),
  urnaId: z.string().uuid().nullable().optional(),
  ornamentacao: z.string().optional(),
  observacoes: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { companyId, userId } = await requireCompanyContext();
    await requirePermission("MANAGE_SERVICES");
    await requireModule(companyId, "GESTAO_FUNERARIA");

    const body = await req.json().catch(() => null);
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, data: null, error: "VALIDATION_ERROR", message: "Dados inválidos." },
        { status: 400 },
      );
    }

    const updated = await updateService(params.id, companyId, userId, parsed.data);

    return NextResponse.json({ success: true, data: updated, error: null, message: "Serviço atualizado." });
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
  if (err instanceof ModuleNotContractedError) {
    return NextResponse.json(
      { success: false, data: null, error: "MODULE_NOT_CONTRACTED", message: err.message },
      { status: 403 },
    );
  }
  if (err instanceof ServiceNotFoundError) {
    return NextResponse.json(
      { success: false, data: null, error: "NOT_FOUND", message: err.message },
      { status: 404 },
    );
  }
  return NextResponse.json(
    { success: false, data: null, error: "INTERNAL_ERROR", message: "Erro ao processar a requisição." },
    { status: 500 },
  );
}
