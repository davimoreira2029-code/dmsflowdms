import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCompanyContext, NoCompanyContextError } from "@/server/guards/require-tenant-scope";
import { requirePermission } from "@/server/guards/require-permission";
import { UnauthorizedError, ForbiddenError } from "@/server/guards/require-role";
import { listShifts, createShift } from "@/server/services/shift.service";

export async function GET() {
  try {
    const { companyId } = await requireCompanyContext();
    await requirePermission("READ");

    const shifts = await listShifts(companyId);
    return NextResponse.json({ success: true, data: shifts, error: null, message: null });
  } catch (err) {
    return handleError(err);
  }
}

const schema = z.object({
  nome: z.string().min(1, "Informe o nome do turno."),
  horaInicio: z.string().min(1, "Informe o horário inicial."),
  horaFim: z.string().min(1, "Informe o horário final."),
  diasSemana: z.array(z.enum(["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"])).min(1, "Selecione ao menos um dia."),
});

export async function POST(req: NextRequest) {
  try {
    const { companyId } = await requireCompanyContext();
    await requirePermission("MANAGE_USERS");

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

    const shift = await createShift(companyId, parsed.data);
    return NextResponse.json({ success: true, data: shift, error: null, message: "Turno cadastrado." });
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
