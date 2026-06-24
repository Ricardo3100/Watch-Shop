export const runtime = "nodejs";

import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { NextResponse } from "next/server";
import { getAdminCollection } from "../../../lib/admincollections";
import { Binary } from "mongodb";
import jwt from "jsonwebtoken";

/**
 * POST /api/admin/authentication-verify
 */
export async function POST(req: Request) {
  const body = await req.json();
  const admins = await getAdminCollection();

  const admin = (await admins.findOne({})) as
    | import("@/types/admin").Admin
    | null;

  if (!admin) {
    return NextResponse.json({ error: "No admin found" }, { status: 400 });
  }

  if (!admin.currentChallenge) {
    return NextResponse.json(
      { error: "No authentication in progress" },
      { status: 400 },
    );
  }

  const credential = admin.credentials.find(
    (cred) => cred.credentialID === body.id,
  );

  if (!credential) {
    return NextResponse.json(
      { error: "Credential not found" },
      { status: 400 },
    );
  }

  try {
    const publicKeyUint8 = new Uint8Array(
      (credential.publicKey as Binary).buffer,
    );

    // ── DEFENSIVE ENVIRONMENT VARIABLE STRATEGY ──
    // 1. Resolve naming variations between WEB_AUTH and WEBAUTHN
    const rawOrigin =
      process.env.WEB_AUTH_ORIGIN ||
      process.env.WEB_AUTH_ORIGIN ||
      "https://watch-shop.en-visioningsolutions.com";
    const rawRPID =
      process.env.WEB_AUTH_RP_ID ||
      process.env.WEB_AUTH_RP_ID ||
      "watch-shop.en-visioningsolutions.com";

    // 2. Automatically trim off trailing slashes to prevent library crashes
    const cleanOrigin = rawOrigin.trim().endsWith("/")
      ? rawOrigin.trim().slice(0, -1)
      : rawOrigin.trim();
    const cleanRPID = rawRPID.trim().endsWith("/")
      ? rawRPID.trim().slice(0, -1)
      : rawRPID.trim();

    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: admin.currentChallenge,
      expectedOrigin: cleanOrigin,
      expectedRPID: cleanRPID,
      credential: {
        id: credential.credentialID,
        publicKey: publicKeyUint8,
        counter: Number(credential.counter),
      },
    });

    const { verified, authenticationInfo } = verification;

    if (!verified) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 400 },
      );
    }

    await admins.updateOne(
      { _id: admin._id, "credentials.credentialID": credential.credentialID },
      {
        $set: { "credentials.$.counter": authenticationInfo.newCounter },
        $unset: { currentChallenge: "" },
      },
    );

    // 3. Safe fallback check for JWT Secret instead of crashing blindly with !
    const jwtSecret = process.env.ADMIN_JWT_SECRET;
    if (!jwtSecret) {
      console.error(
        "CRITICAL ERROR: ADMIN_JWT_SECRET environment variable is missing!",
      );
      return NextResponse.json(
        { error: "Internal server configuration error" },
        { status: 500 },
      );
    }

    const token = jwt.sign(
      {
        adminId: admin._id.toString(),
        role: "admin",
        name: admin.name || "Admin",
      },
      jwtSecret,
      { expiresIn: "2h" },
    );

    const response = NextResponse.json({ success: true });

    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 2, // 2 hours
    });

    return response;
  } catch (err) {
    console.error("Auth verify error:", err);
    return NextResponse.json(
      { error: "Authentication error" },
      { status: 500 },
    );
  }
}
