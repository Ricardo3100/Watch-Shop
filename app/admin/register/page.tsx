"use client";

import { useState } from "react";
import { startRegistration } from "@simplewebauthn/browser";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    try {
      setLoading(true);

      // 1️⃣ Get registration challenge options from the actual challenge route folder
      const challengeRes = await fetch("/api/admin/registration-challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!challengeRes.ok) {
        throw new Error(
          `Server returned status ${challengeRes.status} on options generation.`,
        );
      }

      const options = await challengeRes.json();

      // 2️⃣ Start WebAuthn registration (Triggers native Touch ID/Face ID/Windows Hello)
      const credential = await startRegistration(options);

      // 3️⃣ Send credential to your verification route folder
      const verifyRes = await fetch("/api/admin/registration-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credential),
      });

      if (!verifyRes.ok) {
        throw new Error(
          `Server returned status ${verifyRes.status} on verification.`,
        );
      }

      const verifyData = await verifyRes.json();

      if (verifyData.verified) {
        alert("Registration successful!");
        setName(""); // Clear input on success
      } else {
        alert("Registration failed verification on the server.");
      }
    } catch (err) {
      console.error("Passkey registration workflow error:", err);
      alert(
        "Something went wrong during passkey generation. Check the browser console.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 max-w-md mx-auto">
      <h1 className="text-2xl text-center font-bold mb-4">
        Register Admin Passkey
      </h1>

      <div className="flex flex-col gap-4">
        <div>
          {/* Accessible label for screen readers */}
          <label
            htmlFor="admin-name"
            className="block text-sm font-medium mb-1"
          >
            Admin Name / Device Label
          </label>
          <input
            id="admin-name"
            type="text"
            placeholder="e.g., MacBook TouchID, YubiKey"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border p-2 w-full rounded"
          />
        </div>

        <button
          onClick={handleRegister}
          disabled={loading || !name.trim()}
          className="bg-black text-white px-4 py-2 rounded font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Registering..." : "Register with Passkey"}
        </button>
      </div>
    </div>
  );
}
