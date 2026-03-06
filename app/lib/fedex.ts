// lib/fedex.ts

/**
 * This file does one job:
 * Ask FedEx for a temporary access token.
 *
 * Every FedEx API call needs this token.
 * Think of it like a visitor badge —
 * you get it at the front desk before
 * you can go anywhere in the building.
 *
 * The token expires after 1 hour.
 * We get a fresh one before each request.
 */

const FEDEX_API_URL = process.env.FEDEX_API_URL!;
const FEDEX_CLIENT_ID = process.env.FEDEX_CLIENT_ID!;
const FEDEX_CLIENT_SECRET = process.env.FEDEX_CLIENT_SECRET!;

export async function getFedExToken(): Promise<string> {
  const res = await fetch(`${FEDEX_API_URL}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    // FedEx auth uses form encoding, not JSON
    // This is different from most modern APIs
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: FEDEX_CLIENT_ID,
      client_secret: FEDEX_CLIENT_SECRET,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    console.error("FedEx auth failed:", error);
    throw new Error(`FedEx authentication failed: ${res.status}`);
  }

  const data = await res.json();

  // data.access_token is the visitor badge
  // Pass this into every FedEx API call
  return data.access_token;
}
