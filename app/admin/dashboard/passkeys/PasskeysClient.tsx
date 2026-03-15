"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AiOutlineArrowLeft } from "react-icons/ai";
import { useRouter } from "next/navigation";

interface Credential {
  credentialID: string;
  deviceName: string;
  deviceEmoji: string;
  transports: string[];
  aaguid: string;
  createdAt: string | null;
}

export default function PasskeysClient() {
  const router = useRouter();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadCredentials() {
    const res = await fetch("/api/admin/credentials");
    if (!res.ok) {
      router.replace("/admin/login");
      return;
    }
    const data = await res.json();
    setCredentials(data.credentials || []);
  }

  useEffect(() => {
    loadCredentials();
  }, []);

  async function handleDelete(credentialID: string, deviceName: string) {
    if (!confirm(`Remove passkey for "${deviceName}"? This cannot be undone.`)) return;

    setLoading(true);
    setError("");

    const res = await fetch(
      `/api/admin/credentials/${encodeURIComponent(credentialID)}`,
      { method: "DELETE" }
    );

    const data = await res.json();

    if (res.ok) {
      setSuccess(`Passkey for "${deviceName}" removed`);
      await loadCredentials();
    } else {
      setError(data.error || "Failed to delete passkey");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-800 p-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 border-b border-gray-700 pb-4">
        <div>
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2 mb-2 text-gray-300 hover:text-white"
          >
            <AiOutlineArrowLeft />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-white">Passkeys</h1>
          <p className="text-gray-400 text-sm mt-1">
            {credentials.length} device{credentials.length !== 1 ? "s" : ""} registered
          </p>
        </div>
        <Link
          href="/admin/register"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium"
        >
          + Register New Device
        </Link>
      </div>

      {error && (
        <p role="alert" className="mb-4 text-red-400 bg-red-900/30 px-4 py-2 rounded">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="mb-4 text-green-400 bg-green-900/30 px-4 py-2 rounded">
          {success}
        </p>
      )}

      {/* Passkeys table */}
      <div className="bg-white rounded-lg overflow-hidden shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Device
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Registered
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Transports
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {credentials.map((cred) => (
              <tr key={cred.credentialID} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <span className="text-2xl mr-3">{cred.deviceEmoji}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {cred.deviceName}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {cred.createdAt
                    ? new Date(cred.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "Unknown"}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-1 flex-wrap">
                    {cred.transports.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {credentials.length > 1 ? (
                    <button
                      onClick={() => handleDelete(cred.credentialID, cred.deviceName)}
                      disabled={loading}
                      className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                    >
                      Remove
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400">
                      Last passkey — cannot remove
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {credentials.length === 0 && (
          <p className="text-center text-gray-500 py-10">
            No passkeys registered yet.
          </p>
        )}
      </div>

      {/* Safety notice */}
      <p className="mt-4 text-xs text-gray-500">
        ⚠️ Never remove your last passkey — you will be permanently locked out of the admin dashboard.
      </p>
    </div>
  );
}