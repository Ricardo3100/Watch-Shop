import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { NextResponse } from "next/server";
import { getAdminCollection } from "../../../lib/admincollections";

export async function GET() {
  const admins = await getAdminCollection();
  const admin = await admins.findOne({});

  if (!admin || !admin.credentials?.length) {
    return NextResponse.json(
      { error: "No credentials registered" },
      { status: 400 },
    );
  }

  const options = await generateAuthenticationOptions({
    rpID: process.env.WEBAUTHN_RP_ID!,
    allowCredentials: admin.credentials.map((cred: any) => ({
      id: cred.credentialID,
      type: "public-key",
      transports: cred.transports,
    })),
    userVerification: "preferred",
  });

  await admins.updateOne(
    { _id: admin._id },
    { $set: { currentChallenge: options.challenge } },
  );

  return NextResponse.json(options);
}
