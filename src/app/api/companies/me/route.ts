import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { requireCompanyContext, NoCompanyContextError } from "@/server/guards/require-tenant-scope";
import { UnauthorizedError, ForbiddenError } from "@/server/guards/require-role";
import { recordAudit } from "@/server/services/audit.service";

export async function GET() {
  try {
    const { companyId } = await requireCompanyContext();

    // Busca por id sozinho é segura aqui porque companyId já vem da
    // sessão do próprio usuário — ele só pode pedir a própria empresa.
    const company = await prisma.company.findUnique({ where: { id: companyId } });

    return NextResponse.json({ success: true, data: company, error: null, message: null });
  } catch (err) {
    return handleError(err);
  }
}

const updateSchema = z.object({
  nomeFantasia: z.string().min(1).optional(),
  telefone: z.string().optional(),
  whatsapp: z.string().optional(),
  cep: z.string().optional(),
  endereco: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  // Guardado como data URI (base64) — decisão do MVP, documentada em
  // DATABASE.md: evita depender de storage S3 (item 37, ainda não
  // implementado) só para o caso de uso de logo. Limite generoso o
  // bastante para um logo comprimido, pequeno o bastante para não virar
  // um problema de tamanho de linha no Postgres.
  logoUrl: z.string().max(700_000, "Imagem muito grande. Use um arquivo menor.").optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const { companyId, role, userId } = await requireCompanyContext();

    if (role !== "ADMIN_EMPRESA") {
      throw new ForbiddenError();
    }

    const body = await req.json().catch(() => null);
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, data: null, error: "VALIDATION_ERROR", message: "Dados inválidos." },
        { status: 400 },
      );
    }

    const before = await prisma.company.findUnique({ where: { id: companyId } });

    const updated = await prisma.company.update({
      where: { id: companyId },
      data: parsed.data,
    });

    const redact = (c: typeof before) =>
      c ? { ...JSON.parse(JSON.stringify(c)), logoUrl: c.logoUrl ? "[logo definido]" : null } : undefined;

    await recordAudit({
      companyId,
      userId,
      action: "COMPANY_UPDATED",
      entity: "companies",
      entityId: companyId,
      oldData: redact(before),
      newData: redact(updated),
    });

    return NextResponse.json({ success: true, data: updated, error: null, message: "Empresa atualizada." });
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
