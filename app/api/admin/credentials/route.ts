export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { verifyAdminApi } from "../../../lib/verifyadmin";
import { getAdminCollection } from "../../../lib/admincollections";

export async function GET() {
  const auth = await verifyAdminApi();
  if (auth instanceof NextResponse) return auth;

  const admins = await getAdminCollection();
  const admin = await admins.findOne({});

  if (!admin) {
    return NextResponse.json({ error: "Admin not found" }, { status: 404 });
  }

  // Only return what the UI needs — never return publicKey or counter
  const credentials = (admin.credentials || []).map((cred: any) => ({
    credentialID: cred.credentialID,
    deviceName: cred.deviceName || "Unknown device",
    deviceEmoji: cred.deviceEmoji || "🔑",
    transports: cred.transports || [],
    aaguid: cred.aaguid || "",
    createdAt: cred.createdAt || null,
  }));

  return NextResponse.json({ credentials });
}
