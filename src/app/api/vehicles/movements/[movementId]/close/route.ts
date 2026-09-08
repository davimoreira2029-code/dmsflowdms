import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCompanyContext, NoCompanyContextError } from "@/server/guards/require-tenant-scope";
import { requirePermission } from "@/server/guards/require-permission";
import { UnauthorizedError, ForbiddenError } from "@/server/guards/require-role";
import {
  closeVehicleMovement,
  MovementNotFoundError,
  InvalidKmRangeError,
  MovementAlreadyClosedError,
} from "@/server/services/vehicle.service";

const schema = z.object({
  kmFinal: z.coerce.number().int().min(0, "KM final inválido."),
});

export async function POST(req: NextRequest, { params }: { params: { movementId: string } }) {
  try {
    const { companyId } = await requireCompanyContext();
    await requirePermission("MANAGE_VEHICLES");

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

    const movement = await closeVehicleMovement(params.movementId, companyId, parsed.data.kmFinal);
    return NextResponse.json({
      success: true,
      data: movement,
      error: null,
      message: "Viagem encerrada.",
    });
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
    if (err instanceof MovementNotFoundError) {
      return NextResponse.json(
        { success: false, data: null, error: "NOT_FOUND", message: err.message },
        { status: 404 },
      );
    }
    if (err instanceof InvalidKmRangeError || err instanceof MovementAlreadyClosedError) {
      return NextResponse.json(
        { success: false, data: null, error: "INVALID_KM", message: err.message },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { success: false, data: null, error: "INTERNAL_ERROR", message: "Erro ao encerrar viagem." },
      { status: 500 },
    );
  }
}
