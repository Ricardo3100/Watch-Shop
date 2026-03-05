"use client";

import { startAuthentication } from "@simplewebauthn/browser";
import { useState } from "react";

export default function AdminLoginClient() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    try {
      setLoading(true);
      setError("");

      // 1️⃣ Get challenge
      const res = await fetch("/api/admin/authentication-challenge");
      if (!res.ok) throw new Error("Failed to get challenge");

      const options = await res.json();

      // 2️⃣ Trigger passkey
      const authResponse = await startAuthentication(options);

      // 3️⃣ Send to verify
      const verifyRes = await fetch("/api/admin/authentication-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authResponse),
      });

      if (!verifyRes.ok) {
        const err = await verifyRes.json();
        throw new Error(err.error || "Authentication failed");
      }

      const result = await verifyRes.json();

      if (result.success) {
        window.location.href = "/admin/dashboard";
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">Admin Login</h1>

      <button
        onClick={handleLogin}
        disabled={loading}
        className="bg-black text-white px-6 py-2 rounded"
      >
        {loading ? "Authenticating..." : "Login with Passkey"}
      </button>

      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}
