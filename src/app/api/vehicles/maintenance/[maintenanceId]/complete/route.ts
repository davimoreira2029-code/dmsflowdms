import { NextRequest, NextResponse } from "next/server";
import { requireCompanyContext, NoCompanyContextError } from "@/server/guards/require-tenant-scope";
import { requirePermission } from "@/server/guards/require-permission";
import { UnauthorizedError, ForbiddenError } from "@/server/guards/require-role";
import { completeMaintenance } from "@/server/services/vehicle.service";

export async function POST(_req: NextRequest, { params }: { params: { maintenanceId: string } }) {
  try {
    const { companyId } = await requireCompanyContext();
    await requirePermission("MANAGE_VEHICLES");

    const updated = await completeMaintenance(params.maintenanceId, companyId);
    return NextResponse.json({
      success: true,
      data: updated,
      error: null,
      message: "Manutenção concluída. Veículo disponível novamente.",
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
    return NextResponse.json(
      { success: false, data: null, error: "INTERNAL_ERROR", message: "Erro ao concluir manutenção." },
      { status: 500 },
    );
  }
}
