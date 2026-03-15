// app/api/admin/me/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { verifyAdminApi } from "../../../lib/verifyadmin";

export async function GET() {
  const auth = await verifyAdminApi();
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({ name: (auth as any).name });
}
