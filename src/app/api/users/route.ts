import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/server/db";
import { requireCompanyContext, NoCompanyContextError } from "@/server/guards/require-tenant-scope";
import { requirePermission } from "@/server/guards/require-permission";
import { UnauthorizedError, ForbiddenError } from "@/server/guards/require-role";
import { recordAudit } from "@/server/services/audit.service";

export async function GET() {
  try {
    const { companyId } = await requireCompanyContext();
    await requirePermission("MANAGE_USERS");

    // companyId sempre vem da sessão — a listagem nunca vaza para outro tenant.
    const users = await prisma.user.findMany({
      where: { companyId },
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: users, error: null, message: null });
  } catch (err) {
    return handleError(err);
  }
}

const createSchema = z.object({
  name: z.string().min(1, "Informe o nome."),
  email: z.string().email("E-mail inválido."),
  role: z.enum(["ADMIN_EMPRESA", "GERENTE", "SUPERVISOR", "OPERACIONAL", "VISUALIZADOR"]),
  temporaryPassword: z.string().min(8, "A senha temporária deve ter ao menos 8 caracteres."),
});

export async function POST(req: NextRequest) {
  try {
    const { companyId, userId: creatorId } = await requireCompanyContext();
    await requirePermission("MANAGE_USERS");

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

    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (existing) {
      return NextResponse.json(
        { success: false, data: null, error: "EMAIL_IN_USE", message: "Já existe uma conta com este e-mail." },
        { status: 409 },
      );
    }

    // Verificar limite de usuarios do plano
    const userCount = await prisma.user.count({ where: { companyId, status: "ACTIVE" } });
    const subscription = await prisma.subscription.findFirst({ where: { companyId, status: "ACTIVE" }, include: { plan: true }, orderBy: { createdAt: "desc" } });
    const limite = subscription?.plan?.limiteUsuarios ?? 5;
    if (userCount >= limite) {
      return NextResponse.json({ success: false, data: null, error: "USER_LIMIT_REACHED", message: "Limite de " + limite + " usuarios atingido. Faca upgrade do seu plano para adicionar mais usuarios." }, { status: 403 });
    }
    const passwordHash = await bcrypt.hash(parsed.data.temporaryPassword, 12);

    const user = await prisma.user.create({
      data: {
        companyId,
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        role: parsed.data.role,
        mustChangePassword: true,
      },
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
    });

    await recordAudit({
      companyId,
      userId: creatorId,
      action: "USER_CREATED",
      entity: "users",
      entityId: user.id,
      newData: JSON.parse(JSON.stringify(user)),
    });

    return NextResponse.json({
      success: true,
      data: user,
      error: null,
      message: "Usuário criado. Ele deverá trocar a senha temporária no primeiro login.",
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
  return NextResponse.json(
    { success: false, data: null, error: "INTERNAL_ERROR", message: "Erro ao processar a requisição." },
    { status: 500 },
  );
}

