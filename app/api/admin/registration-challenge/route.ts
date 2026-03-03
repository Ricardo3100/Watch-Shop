import { generateRegistrationOptions } from "@simplewebauthn/server";
import { NextResponse } from "next/server";
import { getAdminCollection } from "../../../lib/admincollections";

export async function GET() {
  const admins = await getAdminCollection();
  const existingAdmin = await admins.findOne({});

  if (existingAdmin) {
    return NextResponse.json(
      { error: "Admin already registered" },
      { status: 400 },
    );
  }

  const options = await generateRegistrationOptions({
    rpName: process.env.WEBAUTHN_RP_NAME!,
    rpID: process.env.WEBAUTHN_RP_ID!,
    userID: new TextEncoder().encode("admin-id"),
    userName: "admin",
  });
// inserts into the database the 
// challenge and the email of the admin, 
// so that it can be used later to verify the registration response
  await admins.insertOne({
    email: "admin@local",
    credentials: [],
    currentChallenge: options.challenge,
    createdAt: new Date(),
  });

  return NextResponse.json(options);
}
