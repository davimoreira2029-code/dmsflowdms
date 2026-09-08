import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { registerCompany, RegistrationError } from "@/server/services/company-registration.service";

const schema = z.object({
  razaoSocial: z.string().min(1, "Informe a razão social."),
  nomeFantasia: z.string().min(1, "Informe o nome fantasia."),
  cnpj: z.string().min(14, "CNPJ inválido."),
  telefone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email("E-mail da empresa inválido."),
  cep: z.string().optional(),
  endereco: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  adminNome: z.string().min(1, "Informe o nome do administrador."),
  adminEmail: z.string().email("E-mail do administrador inválido."),
  adminTelefone: z.string().optional(),
  adminSenha: z.string().min(8, "A senha deve ter ao menos 8 caracteres."),
});

export async function POST(req: NextRequest) {
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

  try {
    const { company } = await registerCompany(parsed.data);
    return NextResponse.json({
      success: true,
      data: { companyId: company.id },
      error: null,
      message: "Empresa criada com sucesso. Verifique seu e-mail para confirmar o cadastro.",
    });
  } catch (err) {
    if (err instanceof RegistrationError) {
      return NextResponse.json(
        { success: false, data: null, error: "REGISTRATION_ERROR", message: err.message },
        { status: 409 },
      );
    }
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: "INTERNAL_ERROR",
        message: "Não foi possível concluir o cadastro. Tente novamente.",
      },
      { status: 500 },
    );
  }
}
