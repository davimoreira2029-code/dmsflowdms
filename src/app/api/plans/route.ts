import { NextResponse } from "next/server";
import { listActivePlans } from "@/server/services/billing.service";

export async function GET() {
  const plans = await listActivePlans();
  return NextResponse.json({ success: true, data: plans, error: null, message: null });
}
