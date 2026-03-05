export const runtime = "nodejs";

import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { NextResponse } from "next/server";
import { getAdminCollection } from "../../../lib/admincollections";

export async function POST(req: Request) {
  const body = await req.json();

  const admins = await getAdminCollection();
  const admin = await admins.findOne({});

  if (!admin || !admin.currentChallenge) {
    return NextResponse.json(
      { error: "No registration in progress" },
      { status: 400 },
    );
  }

  const existingCredential = admin.credentials?.find(
    (cred: any) => cred.credentialID === body.id,
  );

  if (existingCredential) {
    return NextResponse.json(
      { error: "Credential already registered" },
      { status: 400 },
    );
  }

  try {
    const verification = await verifyRegistrationResponse({
      response: body, // ✅ pass body directly, v13 handles decoding
      expectedChallenge: admin.currentChallenge,
      expectedOrigin: process.env.WEBAUTHN_ORIGIN!,
      expectedRPID: process.env.WEBAUTHN_RP_ID!,
    });

    const { verified, registrationInfo } = verification;

    if (!verified || !registrationInfo) {
      return NextResponse.json(
        { error: "Registration verification failed" },
        { status: 400 },
      );
    }

    // ✅ v13 shape — credential is nested under registrationInfo.credential
    const { credential } = registrationInfo;

    await admins.updateOne(
      { _id: admin._id },
      {
        $push: {
          credentials: {
            credentialID: credential.id, // ✅ v13: credential.id
            publicKey: credential.publicKey, // ✅ v13: credential.publicKey
            counter: credential.counter, // ✅ v13: credential.counter
            transports: body.response.transports || [],
          },
        },
        $unset: { currentChallenge: "" },
      },
    );

    return NextResponse.json({ verified: true }); // ✅ matches what your client checks
  } catch (err) {
    console.error("Registration verify error:", err);
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
