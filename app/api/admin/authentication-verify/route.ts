export const runtime = "nodejs";

import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { NextResponse } from "next/server";
import { getAdminCollection } from "../../../lib/admincollections";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { Binary } from "mongodb";

/**
 * POST /api/admin/authentication-verify
 * This endpoint verifies a WebAuthn passkey authentication attempt for the admin panel.
 *
 * Flow:
 * 1. Receive authentication response from browser (navigator.credentials.get)
 * 2. Lookup admin and credential in MongoDB
 * 3. Convert credential data into the format expected by @simplewebauthn/server
 * 4. Verify authentication response
 * 5. Update counter in MongoDB
 * 6. Return success/failure to client
 */
export async function POST(req: Request) {
  // Parse JSON body sent from browser
  const body = await req.json();

  // Get MongoDB collection for admins
  const admins = await getAdminCollection();

  // Get the admin user (assuming single admin for simplicity)
  const admin = await admins.findOne({});

  // If no admin or no authentication challenge in progress, reject
  if (!admin || !admin.currentChallenge) {
    return NextResponse.json(
      { error: "No authentication in progress" },
      { status: 400 },
    );
  }

  // 🔹 Find the stored credential matching the incoming credential ID
  const credential = admin.credentials.find(
    (cred: any) => cred.credentialID === body.id, // ID is base64url string
  );

  // If credential not found, reject
  if (!credential) {
    return NextResponse.json(
      { error: "Credential not found" },
      { status: 400 },
    );
  }

  try {
    // 🔹 Convert the stored publicKey (Mongo Binary) to Uint8Array for verification
    const publicKeyUint8 = new Uint8Array(
      (credential.publicKey as Binary).buffer,
    );

    // 🔹 Verify the authentication response using @simplewebauthn/server
    const verification = await verifyAuthenticationResponse({
      response: body, // Browser response (rawId, clientDataJSON, signature, etc.)
      expectedChallenge: admin.currentChallenge, // Challenge issued during login
      expectedOrigin: process.env.WEBAUTHN_ORIGIN!, // Must match your domain
      expectedRPID: process.env.WEBAUTHN_RP_ID!, // Must match your WebAuthn Relying Party ID
      credential: {
        // v10+: Use 'credential' instead of 'authenticator'
        id: credential.credentialID, // Base64url string stored in Mongo
        publicKey: publicKeyUint8, // Converted Uint8Array
        counter: Number(credential.counter), // Numeric counter to prevent replay
      },
    });

    const { verified, authenticationInfo } = verification;

    // If verification failed, return 400
    if (!verified) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 400 },
      );
    }

    // 🔹 Update the stored counter and clear the challenge
    // This prevents replay attacks with the same credential signature
    await admins.updateOne(
      { _id: admin._id, "credentials.credentialID": credential.credentialID },
      {
        $set: { "credentials.$.counter": authenticationInfo.newCounter },
        $unset: { currentChallenge: "" },
      },
    );

    // ✅ Authentication succeeded
    return NextResponse.json({ success: true });
  } catch (err) {
    // Log error for debugging
    console.error("Auth verify error:", err);

    // Return generic error to client
    return NextResponse.json(
      { error: "Authentication error" },
      { status: 500 },
    );
  }
}
