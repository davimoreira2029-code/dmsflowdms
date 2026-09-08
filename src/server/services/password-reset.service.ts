import bcrypt from "bcryptjs";
import { prisma } from "@/server/db";
import { sendMail } from "@/server/mail";
import { recordAudit } from "@/server/services/audit.service";
import type { PasswordResetStatus } from "@prisma/client";

interface RequestContext {
  ip?: string | null;
  userAgent?: string | null;
}

/**
 * Usuário solicita recuperação. Nunca revela se o e-mail existe ou não —
 * a resposta ao cliente é sempre a mesma mensagem genérica, independente
 * do resultado interno.
 */
export async function createPasswordResetRequest(email: string, ctx: RequestContext) {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  // Não revela ao chamador se o usuário existe — o caller sempre mostra a
  // mesma mensagem genérica de sucesso.
  if (!user || user.status !== "ACTIVE") {
    return;
  }

  // Evita acumular solicitações pendentes duplicadas para o mesmo usuário.
  const existingPending = await prisma.passwordResetRequest.findFirst({
    where: { userId: user.id, status: "PENDING" },
  });
  if (existingPending) return;

  const request = await prisma.passwordResetRequest.create({
    data: {
      userId: user.id,
      companyId: user.companyId,
      requestedEmail: normalizedEmail,
      status: "PENDING",
    },
  });

  await recordAudit({
    companyId: user.companyId,
    userId: user.id,
    action: "PASSWORD_RESET_REQUESTED",
    entity: "password_reset_requests",
    entityId: request.id,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });

  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    await sendMail({
      to: adminEmail,
      subject: "DMS FLOW — Solicitação de recuperação de senha",
      text: [
        "Nova solicitação de recuperação de senha.",
        "",
        `Usuário: ${user.name}`,
        `E-mail: ${user.email}`,
        `Empresa: ${user.companyId ?? "—"}`,
        `Data: ${new Date().toLocaleString("pt-BR")}`,
        "Status: PENDENTE",
        "",
        `Abrir solicitação: ${process.env.APP_URL ?? ""}/admin/password-recovery/${request.id}`,
      ].join("\n"),
    });
  }

  return request;
}

/** Lista solicitações para o painel do Super Admin, com filtro opcional de status. */
export async function listPasswordResetRequests(status?: PasswordResetStatus) {
  return prisma.passwordResetRequest.findMany({
    where: status ? { status } : undefined,
    include: {
      user: { select: { id: true, name: true, email: true } },
      company: { select: { id: true, nomeFantasia: true } },
    },
    orderBy: { requestedAt: "desc" },
  });
}

export async function getPasswordResetRequest(id: string) {
  return prisma.passwordResetRequest.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, companyId: true } },
      company: { select: { id: true, nomeFantasia: true } },
    },
  });
}

/**
 * Super Admin aprova a solicitação e define uma senha temporária.
 * O usuário é obrigado a trocá-la no próximo login (must_change_password).
 * Sessões existentes são invalidadas via incremento de session_version.
 */
export async function approvePasswordResetRequest(
  requestId: string,
  temporaryPassword: string,
  adminId: string,
  ctx: RequestContext,
) {
  const request = await prisma.passwordResetRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new Error("Solicitação não encontrada.");
  if (request.status !== "PENDING") throw new Error("Esta solicitação já foi processada.");

  const passwordHash = await bcrypt.hash(temporaryPassword, 12);

  const [updatedUser] = await prisma.$transaction([
    prisma.user.update({
      where: { id: request.userId },
      data: {
        passwordHash,
        mustChangePassword: true,
        sessionVersion: { increment: 1 },
      },
    }),
    prisma.passwordResetRequest.update({
      where: { id: requestId },
      data: {
        status: "COMPLETED",
        processedAt: new Date(),
        processedById: adminId,
      },
    }),
  ]);

  await recordAudit({
    companyId: request.companyId,
    userId: adminId,
    action: "PASSWORD_RESET_COMPLETED",
    entity: "password_reset_requests",
    entityId: requestId,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
    // Nunca gravar a senha, hash ou token aqui.
    newData: { targetUserId: request.userId },
  });

  await sendMail({
    to: updatedUser.email,
    subject: "DMS FLOW — Seu acesso foi redefinido",
    text: [
      "Seu acesso ao DMS FLOW foi redefinido pelo administrador.",
      "",
      "Entre no sistema utilizando a nova senha fornecida pelo administrador.",
      "No primeiro acesso, você será solicitado a criar uma nova senha pessoal.",
      "",
      "Se você não solicitou essa alteração, entre em contato com o administrador da sua empresa.",
    ].join("\n"),
  });

  return updatedUser;
}

export async function rejectPasswordResetRequest(
  requestId: string,
  adminId: string,
  adminNotes: string | undefined,
  ctx: RequestContext,
) {
  const request = await prisma.passwordResetRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new Error("Solicitação não encontrada.");
  if (request.status !== "PENDING") throw new Error("Esta solicitação já foi processada.");

  await prisma.passwordResetRequest.update({
    where: { id: requestId },
    data: {
      status: "REJECTED",
      processedAt: new Date(),
      processedById: adminId,
      adminNotes,
    },
  });

  await recordAudit({
    companyId: request.companyId,
    userId: adminId,
    action: "PASSWORD_RESET_REJECTED",
    entity: "password_reset_requests",
    entityId: requestId,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

/** Usado em /change-password quando must_change_password === true. */
export async function completeForcedPasswordChange(
  userId: string,
  currentTemporaryPassword: string,
  newPassword: string,
  ctx: RequestContext,
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Usuário não encontrado.");

  const matches = await bcrypt.compare(currentTemporaryPassword, user.passwordHash);
  if (!matches) throw new Error("Senha temporária incorreta.");

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      mustChangePassword: false,
      sessionVersion: { increment: 1 },
    },
  });

  await recordAudit({
    companyId: user.companyId,
    userId: user.id,
    action: "PASSWORD_CHANGED_BY_USER",
    entity: "users",
    entityId: user.id,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
}
