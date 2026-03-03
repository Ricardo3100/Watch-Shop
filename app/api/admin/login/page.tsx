"use client";

import { startAuthentication } from "@simplewebauthn/browser";

export default function AdminLogin() {
  async function handleLogin() {
    // 1️⃣ Get challenge
    const res = await fetch("/api/admin/authentication-challenge");
    const options = await res.json();

    // 2️⃣ Trigger passkey
    const authResponse = await startAuthentication(options);

    // 3️⃣ Send to verify
    const verifyRes = await fetch("/api/admin/authentication-verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(authResponse),
    });

    const result = await verifyRes.json();

    console.log(result);
    alert(JSON.stringify(result));
  }

  return (
    <div>
      <h1>Admin Login</h1>
      <button onClick={handleLogin}>Login with Passkey</button>
    </div>
  );
}
