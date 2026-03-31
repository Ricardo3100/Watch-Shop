export const runtime = "nodejs";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { Binary } from "mongodb";

import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { NextResponse } from "next/server";
import { getAdminCollection } from "../../../lib/admincollections";
import { lookupDevice, formatAaguid } from "../../../lib/aaguid";

export async function POST(req: Request) {
  const body = await req.json();

  const admins = await getAdminCollection();
  const admin = (await admins.findOne({})) as
    | import("@/types/admin").Admin
    | null;

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
      response: body,
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

    const { credential, aaguid } = registrationInfo;
    const transports = body.response.transports || [];

    // Format AAGUID bytes into UUID string and look up device name
    const aaguidBytes = isoBase64URL.toBuffer(aaguid);
    const aaguidString = formatAaguid(aaguidBytes);
    const device = lookupDevice(aaguidString, transports);

    await admins.updateOne(
      { _id: admin._id },
      {
        $push: {
          credentials: {
            
            credentialID: credential.id,
            publicKey: new Binary(credential.publicKey),
            counter: credential.counter,
            transports,
            aaguid: aaguidString,
            deviceName: device.name,
            deviceEmoji: device.emoji,
            createdAt: new Date(),
          },
        },
        $unset: { currentChallenge: "" },
      },
    );

    return NextResponse.json({ verified: true });
  } catch (err) {
    console.error("Registration verify error:", err);
    return NextResponse.json(
      { error: "Registration verification error" },
      { status: 500 },
    );
  }
}
