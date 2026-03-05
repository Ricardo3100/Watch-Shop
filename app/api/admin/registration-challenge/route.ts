import { generateRegistrationOptions } from "@simplewebauthn/server";
import { NextResponse } from "next/server";
import { getAdminCollection } from "../../../lib/admincollections";

export async function POST(req: Request) {
  // ✅ POST not GET
  const { name } = await req.json(); // ✅ now you can read the name

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
    userName: name || "admin", // ✅ use the name from the form
  });

  await admins.insertOne({
    email: "admin@local",
    name: name || "admin", // ✅ store the name too if you want
    credentials: [],
    currentChallenge: options.challenge,
    createdAt: new Date(),
  });

  return NextResponse.json(options);
}
