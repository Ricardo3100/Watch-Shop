export const runtime = "nodejs";

import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { NextResponse } from "next/server";
import { getAdminCollection } from "../../../lib/admincollections";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { Binary } from "mongodb";

/**
 * POST /api/admin/registration-verify
 * This endpoint verifies a WebAuthn **registration (passkey creation)** attempt for the admin panel.
 *
 * Flow:
 * 1. Admin initiates registration → server issues challenge (registration-challenge)
 * 2. Browser displays passkey creation popup (navigator.credentials.create)
 * 3. Registration response is sent here
 * 4. Server verifies response, stores credential in MongoDB
 */
export async function POST(req: Request) {
  // Parse the incoming registration response from the browser
  const body = await req.json();

  // Get MongoDB collection for admins
  const admins = await getAdminCollection();

  // For simplicity, we assume a single admin user
  const admin = await admins.findOne({});

  // If no admin or no challenge was issued, reject the request
  if (!admin || !admin.currentChallenge) {
    return NextResponse.json(
      { error: "No registration in progress" },
      { status: 400 },
    );
  }

  // 🔹 Optional: Check if credential already exists to prevent duplicates
  const credential = admin.credentials?.find(
    (cred: any) => cred.credentialID === body.id,
  );

  // If credential already exists, reject (or skip, depending on logic)
  if (credential) {
    return NextResponse.json(
      { error: "Credential already registered" },
      { status: 400 },
    );
  }

  try {
    // 🔹 Convert publicKey (from Mongo) to Uint8Array if needed (for verification)
    const publicKeyUint8 = new Uint8Array(
      (credential?.publicKey as Binary)?.buffer || [],
    );

    // 🔹 Convert incoming response fields from base64url to ArrayBuffer/Uint8Array
    // This is required by simplewebauthn for verification
    const authResponseForVerify = {
      ...body,
      rawId: isoBase64URL.toBuffer(body.rawId),
      response: {
        ...body.response,
        clientDataJSON: isoBase64URL.toBuffer(body.response.clientDataJSON),
        attestationObject: isoBase64URL.toBuffer(
          body.response.attestationObject,
        ),
      },
    };

    // 🔹 Verify registration using simplewebauthn
    const verification = await verifyRegistrationResponse({
      response: authResponseForVerify,
      expectedChallenge: admin.currentChallenge, // Must match server-issued challenge
      expectedOrigin: process.env.WEBAUTHN_ORIGIN!, // Must match your domain
      expectedRPID: process.env.WEBAUTHN_RP_ID!, // Your WebAuthn Relying Party ID
    });

    const { verified, registrationInfo } = verification;

    if (!verified || !registrationInfo) {
      return NextResponse.json(
        { error: "Registration verification failed" },
        { status: 400 },
      );
    }

    // 🔹 Extract credential info
    const { credentialPublicKey, credentialID, counter } = registrationInfo;

    // 🔹 Store the new credential in MongoDB for this admin
    await admins.updateOne(
      { _id: admin._id },
      {
        $push: {
          credentials: {
            credentialID, // Base64url string
            publicKey: credentialPublicKey, // Uint8Array
            counter, // Numeric counter starts at 0
            transports: body.response.transports || [], // optional device transports
          },
        },
        $unset: { currentChallenge: "" }, // clear challenge after registration
      },
    );

    // ✅ Registration successful
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Registration verify error FULL:", err);
    if (err instanceof Error) {
      console.error("Message:", err.message);
      console.error("Stack:", err.stack);
    }
    return NextResponse.json(
      { error: "Registration verification error" },
      { status: 500 },
    );
  }
}
