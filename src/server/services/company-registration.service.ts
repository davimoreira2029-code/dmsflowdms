import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/server/db";
import { sendMail } from "@/server/mail";
import { recordAudit } from "@/server/services/audit.service";
import { grantDefaultModules } from "@/server/services/module.service";

export interface RegisterCompanyInput {
  // Empresa
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  telefone?: string;
  whatsapp?: string;
  email: string;
  cep?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  // Administrador
  adminNome: string;
  adminEmail: string;
  adminTelefone?: string;
  adminSenha: string;
}

const TRIAL_DAYS = 7;
const EMAIL_TOKEN_TTL_HOURS = 48;

export class RegistrationError extends Error {}

/**
 * Cadastro público de empresa (item 9). Cria a empresa em TRIAL, o
 * usuário ADMIN_EMPRESA, e dispara e-mail de confirmação — tudo numa
 * transação para nunca deixar empresa órfã sem administrador.
 *
 * DECISÃO: e-mail não confirmado NÃO bloqueia login. O trial de 7 dias
 * já cria pressão suficiente para conversão; bloquear login antes da
 * confirmação adicionaria fricção sem ganho de segurança relevante no
 * MVP. Revisitar na Fase 5 se o negócio pedir o contrário.
 */
export async function registerCompany(input: RegisterCompanyInput) {
  const existingCompany = await prisma.company.findUnique({ where: { cnpj: input.cnpj } });
  if (existingCompany) {
    throw new RegistrationError("Já existe uma empresa cadastrada com este CNPJ.");
  }

  const existingUser = await prisma.user.findUnique({ where: { email: input.adminEmail } });
  if (existingUser) {
    throw new RegistrationError("Já existe uma conta com este e-mail.");
  }

  const passwordHash = await bcrypt.hash(input.adminSenha, 12);
  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  const { company, admin } = await prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: {
        razaoSocial: input.razaoSocial,
        nomeFantasia: input.nomeFantasia,
        cnpj: input.cnpj,
        telefone: input.telefone,
        whatsapp: input.whatsapp,
        email: input.email,
        cep: input.cep,
        endereco: input.endereco,
        numero: input.numero,
        complemento: input.complemento,
        bairro: input.bairro,
        cidade: input.cidade,
        estado: input.estado,
        status: "TRIAL",
        trialEndsAt,
      },
    });

    const admin = await tx.user.create({
      data: {
        companyId: company.id,
        name: input.adminNome,
        email: input.adminEmail,
        passwordHash,
        role: "ADMIN_EMPRESA",
      },
    });

    return { company, admin };
  });

  await recordAudit({
    companyId: company.id,
    userId: admin.id,
    action: "COMPANY_CREATED",
    entity: "companies",
    entityId: company.id,
  });
  await recordAudit({
    companyId: company.id,
    userId: admin.id,
    action: "USER_CREATED",
    entity: "users",
    entityId: admin.id,
  });

  await grantDefaultModules(company.id);

  await sendEmailVerificationToken(admin.id, admin.email);

  return { company, admin };
}

async function sendEmailVerificationToken(userId: string, email: string) {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  await prisma.emailVerificationToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + EMAIL_TOKEN_TTL_HOURS * 60 * 60 * 1000),
    },
  });

  const confirmUrl = `${process.env.APP_URL ?? ""}/confirmar-email?token=${rawToken}`;

  await sendMail({
    to: email,
    subject: "DMS FLOW — Confirme seu e-mail",
    text: [
      "Bem-vindo ao DMS FLOW!",
      "",
      "Confirme seu e-mail clicando no link abaixo:",
      confirmUrl,
      "",
      `Este link expira em ${EMAIL_TOKEN_TTL_HOURS} horas.`,
    ].join("\n"),
  });
}

export class InvalidVerificationTokenError extends Error {
  constructor() {
    super("Link de confirmação inválido ou expirado.");
  }
}

/** Confirma o e-mail a partir do token recebido por link. Uso único. */
export async function verifyEmailToken(rawToken: string) {
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  const token = await prisma.emailVerificationToken.findUnique({ where: { tokenHash } });
  if (!token || token.usedAt || token.expiresAt < new Date()) {
    throw new InvalidVerificationTokenError();
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: token.userId },
      data: { emailVerifiedAt: new Date() },
    }),
    prisma.emailVerificationToken.update({
      where: { id: token.id },
      data: { usedAt: new Date() },
    }),
  ]);

  await recordAudit({
    userId: token.userId,
    action: "EMAIL_VERIFIED",
    entity: "users",
    entityId: token.userId,
  });
}
