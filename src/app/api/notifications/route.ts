import { NextRequest, NextResponse } from "next/server";
import { requireCompanyContext, NoCompanyContextError } from "@/server/guards/require-tenant-scope";
import { UnauthorizedError } from "@/server/guards/require-role";
import { listNotifications, countUnread } from "@/server/services/notification.service";

export async function GET(req: NextRequest) {
  try {
    const { companyId, userId } = await requireCompanyContext();

    const onlyUnread = req.nextUrl.searchParams.get("unread") === "1";
    const [notifications, unreadCount] = await Promise.all([
      listNotifications(companyId, userId, onlyUnread),
      countUnread(companyId, userId),
    ]);

    return NextResponse.json({
      success: true,
      data: { notifications, unreadCount },
      error: null,
      message: null,
    });
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
      { success: false, data: null, error: "INTERNAL_ERROR", message: "Erro ao carregar notificações." },
      { status: 500 },
    );
  }
}
