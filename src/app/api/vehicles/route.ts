import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCompanyContext, NoCompanyContextError } from "@/server/guards/require-tenant-scope";
import { requirePermission } from "@/server/guards/require-permission";
import { requireModule, ModuleNotContractedError } from "@/server/guards/require-module";
import { UnauthorizedError, ForbiddenError } from "@/server/guards/require-role";
import { listVehicles, createVehicle } from "@/server/services/vehicle.service";

export async function GET() {
  try {
    const { companyId } = await requireCompanyContext();
    await requirePermission("READ");
    await requireModule(companyId, "VEICULOS");

    const vehicles = await listVehicles(companyId);
    return NextResponse.json({ success: true, data: vehicles, error: null, message: null });
  } catch (err) {
    return handleError(err);
  }
}

const createSchema = z.object({
  placa: z.string().min(1, "Informe a placa."),
  marca: z.string().optional(),
  modelo: z.string().optional(),
  ano: z.coerce.number().int().optional(),
  kmAtual: z.coerce.number().int().min(0).optional(),
  responsavelId: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { companyId } = await requireCompanyContext();
    await requirePermission("MANAGE_VEHICLES");
    await requireModule(companyId, "VEICULOS");

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

    const vehicle = await createVehicle(companyId, parsed.data);
    return NextResponse.json({
      success: true,
      data: vehicle,
      error: null,
      message: "Veículo cadastrado.",
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
