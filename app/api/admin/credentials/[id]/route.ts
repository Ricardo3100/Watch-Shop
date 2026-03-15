export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { verifyAdminApi } from "../../../../lib/verifyadmin";
import { getAdminCollection } from "../../../../lib/admincollections";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await verifyAdminApi();
  if (auth instanceof NextResponse) return auth;

  const { id } = params;

  const admins = await getAdminCollection();
  const admin = await admins.findOne({});

  if (!admin) {
    return NextResponse.json({ error: "Admin not found" }, { status: 404 });
  }

  // Safety check — never delete the last passkey
  // If you do, you are permanently locked out
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
