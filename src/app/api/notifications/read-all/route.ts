import { NextResponse } from "next/server";
import { requireCompanyContext, NoCompanyContextError } from "@/server/guards/require-tenant-scope";
import { UnauthorizedError } from "@/server/guards/require-role";
import { markAllAsRead } from "@/server/services/notification.service";

export async function POST() {
  try {
    const { companyId, userId } = await requireCompanyContext();
    await markAllAsRead(companyId, userId);
    return NextResponse.json({ success: true, data: null, error: null, message: "Todas marcadas como lidas." });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json(
        { success: false, data: null, error: "UNAUTHORIZED", message: err.message },
        { status: 401 },
      );
    }
    if (err instanceof NoCompanyContextError) {
      return NextResponse.json(
        { success: false, data: null, error: "FORBIDDEN", message: err.message },
        { status: 403 },
      );
    }
    return NextResponse.json(
      { success: false, data: null, error: "INTERNAL_ERROR", message: "Erro ao marcar notificações." },
      { status: 500 },
    );
  }
}
