import { NextRequest, NextResponse } from "next/server";
import { requireCompanyContext, NoCompanyContextError } from "@/server/guards/require-tenant-scope";
import { UnauthorizedError } from "@/server/guards/require-role";
import { markAsRead, NotificationNotFoundError } from "@/server/services/notification.service";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { companyId, userId } = await requireCompanyContext();

    const notification = await markAsRead(params.id, companyId, userId);
    return NextResponse.json({ success: true, data: notification, error: null, message: null });
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
    if (err instanceof NotificationNotFoundError) {
      return NextResponse.json(
        { success: false, data: null, error: "NOT_FOUND", message: err.message },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { success: false, data: null, error: "INTERNAL_ERROR", message: "Erro ao marcar como lida." },
      { status: 500 },
    );
  }
}
