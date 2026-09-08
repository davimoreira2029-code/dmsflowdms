import { NextRequest, NextResponse } from "next/server";
import { requireRole, ForbiddenError, UnauthorizedError } from "@/server/guards/require-role";
import { listPasswordResetRequests } from "@/server/services/password-reset.service";
import type { PasswordResetStatus } from "@prisma/client";

const VALID_STATUSES: PasswordResetStatus[] = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "COMPLETED",
  "EXPIRED",
  "CANCELED",
];

export async function GET(req: NextRequest) {
  try {
    await requireRole("SUPER_ADMIN");

    const statusParam = req.nextUrl.searchParams.get("status");
    const status =
      statusParam && VALID_STATUSES.includes(statusParam as PasswordResetStatus)
        ? (statusParam as PasswordResetStatus)
        : undefined;

    const requests = await listPasswordResetRequests(status);

    return NextResponse.json({ success: true, data: requests, error: null, message: null });
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
      { success: false, data: null, error: "INTERNAL_ERROR", message: "Erro ao carregar solicitações." },
      { status: 500 },
    );
  }
}
