import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCompanyContext, NoCompanyContextError } from "@/server/guards/require-tenant-scope";
import { requirePermission } from "@/server/guards/require-permission";
import { requireModule, ModuleNotContractedError } from "@/server/guards/require-module";
import { UnauthorizedError, ForbiddenError } from "@/server/guards/require-role";
import { listServices, createService, type ServiceStatusValue } from "@/server/services/service.service";

const STATUS_VALUES: ServiceStatusValue[] = [
  "NOVO",
  "EM_PREPARACAO",
  "EM_ANDAMENTO",
  "AGUARDANDO",
  "FINALIZADO",
  "ARQUIVADO",
];

export async function GET(req: NextRequest) {
  try {
    const { companyId } = await requireCompanyContext();
    await requirePermission("READ");
    await requireModule(companyId, "GESTAO_FUNERARIA");

    const params = req.nextUrl.searchParams;
    const statusParam = params.get("status");
    const status = STATUS_VALUES.includes(statusParam as ServiceStatusValue)
      ? (statusParam as ServiceStatusValue)
      : undefined;

    const services = await listServices(companyId, {
      status,
      search: params.get("search") ?? undefined,
      dataInicio: params.get("dataInicio") ? new Date(params.get("dataInicio")!) : undefined,
      dataFim: params.get("dataFim") ? new Date(params.get("dataFim")!) : undefined,
    });

    return NextResponse.json({ success: true, data: services, error: null, message: null });
  } catch (err) {
    return handleError(err);
  }
}

const createSchema = z.object({
  tipo: z.string().min(1, "Informe o tipo de serviço."),
  data: z.coerce.date({ errorMap: () => ({ message: "Data inválida." }) }),
  hora: z.string().min(1, "Informe o horário."),
  falecidoNome: z.string().min(1, "Informe o nome do registro."),
  responsavelId: z.string().uuid().optional(),
  local: z.string().optional(),
  destino: z.string().optional(),
  veiculoId: z.string().uuid().optional(),
  urnaId: z.string().uuid().optional(),
  ornamentacao: z.string().optional(),
  observacoes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { companyId, userId } = await requireCompanyContext();
    await requirePermission("MANAGE_SERVICES");
    await requireModule(companyId, "GESTAO_FUNERARIA");

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

    const service = await createService(companyId, userId, parsed.data);

    return NextResponse.json({
      success: true,
      data: service,
      error: null,
      message: "Serviço criado com sucesso.",
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
  if (err instanceof ModuleNotContractedError) {
    return NextResponse.json(
      { success: false, data: null, error: "MODULE_NOT_CONTRACTED", message: err.message },
      { status: 403 },
    );
  }
  return NextResponse.json(
    { success: false, data: null, error: "INTERNAL_ERROR", message: "Erro ao processar a requisição." },
    { status: 500 },
  );
}
