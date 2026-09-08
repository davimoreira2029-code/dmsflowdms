import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCompanyContext, NoCompanyContextError } from "@/server/guards/require-tenant-scope";
import { requirePermission } from "@/server/guards/require-permission";
import { requireModule, ModuleNotContractedError } from "@/server/guards/require-module";
import { UnauthorizedError, ForbiddenError } from "@/server/guards/require-role";
import { listProducts, createProduct } from "@/server/services/inventory.service";

export async function GET() {
  try {
    const { companyId } = await requireCompanyContext();
    await requirePermission("READ");
    await requireModule(companyId, "ESTOQUE");

    const products = await listProducts(companyId);
    return NextResponse.json({ success: true, data: products, error: null, message: null });
  } catch (err) {
    return handleError(err);
  }
}

const CATEGORIAS = [
  "URNAS",
  "MATERIAIS",
  "EPIS",
  "PRODUTOS_LABORATORIAIS",
  "ORNAMENTACAO",
  "LIMPEZA",
  "OUTROS",
] as const;

const createSchema = z.object({
  nome: z.string().min(1, "Informe o nome do produto."),
  categoria: z.enum(CATEGORIAS),
  codigo: z.string().optional(),
  unidade: z.string().optional(),
  quantidade: z.coerce.number().int().min(0).optional(),
  estoqueMinimo: z.coerce.number().int().min(0).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { companyId } = await requireCompanyContext();
    await requirePermission("MANAGE_STOCK");
    await requireModule(companyId, "ESTOQUE");

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

    const product = await createProduct(companyId, parsed.data);
    return NextResponse.json({
      success: true,
      data: product,
      error: null,
      message: "Produto cadastrado.",
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
