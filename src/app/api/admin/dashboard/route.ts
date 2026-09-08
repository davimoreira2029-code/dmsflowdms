import { NextResponse } from "next/server";
import { requireRole, UnauthorizedError, ForbiddenError } from "@/server/guards/require-role";
import { getPlatformDashboard } from "@/server/services/platform-admin.service";

export async function GET() {
  try {
    await requireRole("SUPER_ADMIN");
    const stats = await getPlatformDashboard();
    return NextResponse.json({ success: true, data: stats, error: null, message: null });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json(
        { success: false, data: null, error: "UNAUTHORIZED", message: err.message },
        { status: 401 },
      );
    }
    if (err instanceof ForbiddenError) {
      return NextResponse.json(
        { success: false, data: null, error: "FORBIDDEN", message: err.message },
        { status: 403 },
      );
    }
    return NextResponse.json(
      { success: false, data: null, error: "INTERNAL_ERROR", message: "Erro ao carregar dashboard." },
      { status: 500 },
    );
  }
}
