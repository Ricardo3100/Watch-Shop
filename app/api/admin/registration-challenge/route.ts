import { generateRegistrationOptions } from "@simplewebauthn/server";
import { NextResponse } from "next/server";
import { getAdminCollection } from "../../../lib/admincollections";
import { verifyAdminApi } from "../../../lib/verifyadmin";

export async function POST(req: Request) {
  // 🔐 Must be logged in to register a new passkey
  const auth = await verifyAdminApi();
  if (auth instanceof NextResponse) return auth;

  const { name } = await req.json();

  const admins = await getAdminCollection();
  const existingAdmin = await admins.findOne({});

  if (!existingAdmin) {
    return NextResponse.json(
      { error: "No admin account found" },
      { status: 400 },
    );
  }

  const options = await generateRegistrationOptions({
    rpName: process.env.WEBAUTHN_RP_NAME!,
    rpID: process.env.WEBAUTHN_RP_ID!,
    userID: new TextEncoder().encode("admin-id"),
    userName: name || "admin",
    excludeCredentials:
      existingAdmin.credentials?.map((cred: any) => ({
        id: cred.credentialID,
        type: "public-key",
      })) || [],
  });

  await admins.updateOne(
    { _id: existingAdmin._id },
    { $set: { currentChallenge: options.challenge } },
  );

  return NextResponse.json(options);
}
