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

  // ── DEFENSIVE ENVIRONMENT VARIABLE STRATEGY ──
  // 1. Resolve naming variations and apply safe, rock-solid hardcoded fallbacks
  const resolvedRPName =
    process.env.WEB_AUTH_RP_NAME ||
    process.env.WEB_AUTHN_RP_NAME ||
    "En-Visioning Solutions Watch Shop";
  const resolvedRPID =
    process.env.WEB_AUTH_RP_ID ||
    process.env.WEB_AUTHN_RP_ID ||
    "watch-shop.en-visioningsolutions.com";

  // 2. Automatically trim off any accidental trailing slashes to keep the browser happy
  const cleanRPID = resolvedRPID.endsWith("/")
    ? resolvedRPID.slice(0, -1)
    : resolvedRPID;

  const options = await generateRegistrationOptions({
    rpName: resolvedRPName,
    rpID: cleanRPID,
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
