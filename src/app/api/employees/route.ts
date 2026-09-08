import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCompanyContext, NoCompanyContextError } from "@/server/guards/require-tenant-scope";
import { requirePermission } from "@/server/guards/require-permission";
import { requireModule, ModuleNotContractedError } from "@/server/guards/require-module";
import { UnauthorizedError, ForbiddenError, requireAuth } from "@/server/guards/require-role";
import { hasPermission } from "@/server/permissions";
import { listEmployees, createEmployee } from "@/server/services/employee.service";

export async function GET(req: NextRequest) {
  try {
    const { companyId } = await requireCompanyContext();
    const user = await requireAuth();
    await requirePermission("READ");
    await requireModule(companyId, "EQUIPE");

    const canViewSensitiveData = hasPermission(user.role, "MANAGE_USERS");

    const params = req.nextUrl.searchParams;
    const statusParam = params.get("status");
    const status = statusParam === "ATIVO" || statusParam === "INATIVO" ? statusParam : undefined;

    const employees = await listEmployees(
      companyId,
      { search: params.get("search") ?? undefined, status },
      canViewSensitiveData,
    );

    return NextResponse.json({ success: true, data: employees, error: null, message: null });
  } catch (err) {
    return handleError(err);
  }
}

const createSchema = z.object({
  nome: z.string().min(1, "Informe o nome."),
  cpf: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  cargo: z.string().optional(),
  setor: z.string().optional(),
  turnoId: z.string().uuid().optional(),
  dataAdmissao: z.coerce.date().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { companyId } = await requireCompanyContext();
    await requirePermission("MANAGE_USERS");
    await requireModule(companyId, "EQUIPE");

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

    const employee = await createEmployee(companyId, parsed.data);
    return NextResponse.json({
      success: true,
      data: employee,
      error: null,
      message: "Funcionário cadastrado.",
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
