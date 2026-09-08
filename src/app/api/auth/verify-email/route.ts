import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyEmailToken, InvalidVerificationTokenError } from "@/server/services/company-registration.service";

const schema = z.object({ token: z.string().min(1) });

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, data: null, error: "VALIDATION_ERROR", message: "Token não informado." },
      { status: 400 },
    );
  }

  try {
    await verifyEmailToken(parsed.data.token);
    return NextResponse.json({
      success: true,
      data: null,
      error: null,
      message: "E-mail confirmado com sucesso.",
    });
  } catch (err) {
    if (err instanceof InvalidVerificationTokenError) {
      return NextResponse.json(
        { success: false, data: null, error: "INVALID_TOKEN", message: err.message },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { success: false, data: null, error: "INTERNAL_ERROR", message: "Erro ao confirmar e-mail." },
      { status: 500 },
    );
  }
}
