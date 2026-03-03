export const runtime = "nodejs";

import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { NextResponse } from "next/server";
import { getAdminCollection } from "../../lib/admincollections";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { Binary } from "mongodb";

export async function POST(req: Request) {
  const body = await req.json();
  const admins = await getAdminCollection();
  const admin = await admins.findOne({});

  if (!admin || !admin.currentChallenge) {
    return NextResponse.json(
      { error: "No authentication in progress" },
      { status: 400 },
    );
  }

  // Find the credential stored for this admin
  const credential = admin.credentials.find(
    (cred: any) => cred.credentialID === body.id,
  );

  if (!credential) {
    return NextResponse.json(
      { error: "Credential not found" },
      { status: 400 },
    );
  }

  try {
    // ---- DEBUG INFO ----
    console.log("BODY ID:", body.id);
    console.log("Stored credentialID:", credential.credentialID);
    console.log("Counter:", credential.counter);
    console.log("PublicKey Mongo Binary:", credential.publicKey);
    // -------------------

    // Convert Mongo Binary publicKey to Uint8Array
    const publicKeyUint8 = new Uint8Array(
      (credential.publicKey as Binary).buffer,
    );

    // Convert credentialID to buffer
    const credentialIDBuffer = isoBase64URL.toBuffer(credential.credentialID);

    // Convert the incoming response fields to ArrayBuffers
    // 🔹 Convert the incoming WebAuthn fields from base64url to ArrayBuffer/Uint8Array
    const authResponseForVerify = {
      ...body,
      rawId: isoBase64URL.toBuffer(body.rawId), // rawId must be a buffer
      response: {
        ...body.response,
        clientDataJSON: isoBase64URL.toBuffer(body.response.clientDataJSON),
        authenticatorData: isoBase64URL.toBuffer(
          body.response.authenticatorData,
        ),
        signature: isoBase64URL.toBuffer(body.response.signature),
      },
    };

    // 🔹 Use this converted object when calling verifyAuthenticationResponse
    const verification = await verifyAuthenticationResponse({
      response: authResponseForVerify, // <-- NOT body
      expectedChallenge: admin.currentChallenge,
      expectedOrigin: process.env.WEBAUTHN_ORIGIN!,
      expectedRPID: process.env.WEBAUTHN_RP_ID!,
      authenticator: {
        credentialID: isoBase64URL.toBuffer(credential.credentialID),
        credentialPublicKey: new Uint8Array(
          (credential.publicKey as Binary).buffer,
        ),
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

    // Update counter in MongoDB
    await admins.updateOne(
      { _id: admin._id, "credentials.credentialID": credential.credentialID },
      {
        $set: { "credentials.$.counter": authenticationInfo.newCounter },
        $unset: { currentChallenge: "" },
      },
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Auth verify error FULL:", err);
    if (err instanceof Error) {
      console.error("Message:", err.message);
      console.error("Stack:", err.stack);
    }
    return NextResponse.json(
      { error: "Authentication error" },
      { status: 500 },
    );
  }
}
