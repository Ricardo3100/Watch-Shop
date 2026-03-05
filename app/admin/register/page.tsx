"use client";

import { useState } from "react";
import { startRegistration } from "@simplewebauthn/browser";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    try {
      setLoading(true);

      // 1️⃣ Get registration challenge
      const challengeRes = await fetch("/api/admin/registration-challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const options = await challengeRes.json();

      // 2️⃣ Start WebAuthn registration
      const credential = await startRegistration(options);

      // 3️⃣ Send credential to verification route
      const verifyRes = await fetch("/api/admin/registration-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credential),
      });

      const verifyData = await verifyRes.json();

      if (verifyData.verified) {
        alert("Registration successful!");
      } else {
        alert("Registration failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10">
      <h1 className="text-2xl text-center font-bold mb-4">Register Admin</h1>

      <input
        type="text"
        placeholder="Enter your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border align-middle p-2 mr-4"
      />

      <button
        onClick={handleRegister}
        disabled={loading}
        className="bg-black text-white px-4 py-2"
      >
        {loading ? "Registering..." : "Register with Passkey"}
      </button>
    </div>
  );
}
