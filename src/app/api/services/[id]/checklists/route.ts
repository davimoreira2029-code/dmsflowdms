import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCompanyContext, NoCompanyContextError } from "@/server/guards/require-tenant-scope";
import { requirePermission } from "@/server/guards/require-permission";
import { UnauthorizedError, ForbiddenError } from "@/server/guards/require-role";
import {
  applyChecklistToService,
  TemplateNotFoundError,
  ServiceNotFoundForChecklistError,
} from "@/server/services/checklist.service";

const schema = z.object({ templateId: z.string().uuid() });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { companyId, userId } = await requireCompanyContext();
    await requirePermission("MANAGE_CHECKLISTS");

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, data: null, error: "VALIDATION_ERROR", message: "Informe o checklist." },
        { status: 400 },
      );
    }

    const serviceChecklist = await applyChecklistToService(
      params.id,
      companyId,
      parsed.data.templateId,
      userId,
    );

    return NextResponse.json({
      success: true,
      data: serviceChecklist,
      error: null,
      message: "Checklist aplicado ao serviço.",
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
    if (err instanceof ServiceNotFoundForChecklistError || err instanceof TemplateNotFoundError) {
      return NextResponse.json(
        { success: false, data: null, error: "NOT_FOUND", message: err.message },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { success: false, data: null, error: "INTERNAL_ERROR", message: "Erro ao aplicar checklist." },
      { status: 500 },
    );
  }
}
