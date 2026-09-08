import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCompanyContext, NoCompanyContextError } from "@/server/guards/require-tenant-scope";
import { requirePermission } from "@/server/guards/require-permission";
import { requireModule, ModuleNotContractedError } from "@/server/guards/require-module";
import { UnauthorizedError, ForbiddenError } from "@/server/guards/require-role";
import {
  createTanatopraxiaRecord,
  listTanatopraxiaRecords,
  ServiceNotFoundError,
  InvalidTimeRangeError,
} from "@/server/services/tanatopraxia.service";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { companyId } = await requireCompanyContext();
    await requirePermission("READ");

    const records = await listTanatopraxiaRecords(params.id, companyId);
    return NextResponse.json({ success: true, data: records, error: null, message: null });
  } catch (err) {
    return handleError(err);
  }
}

const schema = z.object({
  tipo: z.enum(["NAO_REALIZAR", "REALIZAR_TANATOPRAXIA", "EMBALSAMAMENTO"]),
  responsavelId: z.string().uuid().optional(),
  data: z.coerce.date().optional(),
  horaInicio: z.string().optional(),
  horaFim: z.string().optional(),
  procedimentos: z.string().optional(),
  materiaisUtilizados: z.string().optional(),
  observacoes: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { companyId, userId } = await requireCompanyContext();
    await requirePermission("UPDATE");
    await requireModule(companyId, "GESTAO_FUNERARIA");

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
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

    const record = await createTanatopraxiaRecord(params.id, companyId, userId, parsed.data);

    return NextResponse.json({
      success: true,
      data: record,
      error: null,
      message: "Registro de tanatopraxia salvo.",
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
  if (err instanceof ServiceNotFoundError) {
    return NextResponse.json(
      { success: false, data: null, error: "NOT_FOUND", message: err.message },
      { status: 404 },
    );
  }
  if (err instanceof InvalidTimeRangeError) {
    return NextResponse.json(
      { success: false, data: null, error: "INVALID_TIME_RANGE", message: err.message },
      { status: 400 },
    );
  }
  return NextResponse.json(
    { success: false, data: null, error: "INTERNAL_ERROR", message: "Erro ao processar a requisição." },
    { status: 500 },
  );
}
