import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCompanyContext, NoCompanyContextError } from "@/server/guards/require-tenant-scope";
import { requirePermission } from "@/server/guards/require-permission";
import { UnauthorizedError, ForbiddenError } from "@/server/guards/require-role";
import { createInventoryMovement, ProductNotFoundError } from "@/server/services/inventory.service";
import { NegativeStockError } from "@/server/services/inventory-rules";

const schema = z.object({
  tipo: z.enum(["ENTRADA", "SAIDA", "AJUSTE"]),
  quantidade: z.coerce.number().int().min(0, "Quantidade inválida."),
  motivo: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { companyId, userId } = await requireCompanyContext();
    await requirePermission("MANAGE_STOCK");

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

    const movement = await createInventoryMovement(params.id, companyId, userId, parsed.data);
    return NextResponse.json({
      success: true,
      data: movement,
      error: null,
      message: "Movimentação registrada.",
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
    if (err instanceof ProductNotFoundError) {
      return NextResponse.json(
        { success: false, data: null, error: "NOT_FOUND", message: err.message },
        { status: 404 },
      );
    }
    if (err instanceof NegativeStockError) {
      return NextResponse.json(
        { success: false, data: null, error: "NEGATIVE_STOCK", message: err.message },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { success: false, data: null, error: "INTERNAL_ERROR", message: "Erro ao registrar movimentação." },
      { status: 500 },
    );
  }
}
