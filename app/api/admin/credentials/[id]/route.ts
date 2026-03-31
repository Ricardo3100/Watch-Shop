export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { verifyAdminApi } from "../../../../lib/verifyadmin";
import { getAdminCollection } from "../../../../lib/admincollections";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await verifyAdminApi();
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;

  const admins = await getAdminCollection();
  const admin = (await admins.findOne({})) as
    | import("@/types/admin").Admin
    | null;

  if (!admin) {
    return NextResponse.json({ error: "Admin not found" }, { status: 404 });
  }

  // Safety check — never delete the last passkey
  if (admin.credentials?.length <= 1) {
    return NextResponse.json(
      {
        error:
          "Cannot delete your only passkey. Register another device first.",
      },
      { status: 400 },
    );
  }

  await admins.updateOne(
    { _id: admin._id },
    { $pull: { credentials: { credentialID: id } } },
  );

  return NextResponse.json({ success: true });
}
