"use client";

import { useState } from "react";

const REASONS = [
  { value: "changed_mind", label: "I changed my mind" },
  { value: "not_as_described", label: "Item not as described" },
  { value: "ordering_mistake", label: "Ordering mistake" },
  { value: "not_arrived", label: "Order never arrived" },
  { value: "other", label: "Other" },
];

export default function RefundRequestForm({
  orderId,
  token,
}: {
  orderId: string;
  token: string;
}) {
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit() {
    if (!reason) return;

    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/refund-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, token, reason, note }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong");
      }

      setStatus("success");
    } catch (err: any) {
      setErrorMessage(err.message);
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        style={{
          fontFamily: "Arial, sans-serif",
          maxWidth: 600,
          margin: "80px auto",
          padding: "0 20px",
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: "bold" }}>
          Request received ✅
        </h1>
        <p style={{ color: "#666" }}>
          We have received your refund request and will review it shortly.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        maxWidth: 600,
        margin: "80px auto",
        padding: "0 20px",
      }}
    >
      <h1 style={{ fontSize: 24, fontWeight: "bold", marginBottom: 8 }}>
        Request a refund
      </h1>
      <p style={{ color: "#666", marginBottom: 32 }}>
        Please tell us why you would like a refund and we will get back to you.
      </p>

      <label style={{ display: "block", fontWeight: "bold", marginBottom: 8 }}>
        Reason <span style={{ color: "red" }}>*</span>
      </label>
      <select
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        style={{
          width: "100%",
          padding: "10px 12px",
          marginBottom: 24,
          border: "1px solid #ddd",
          borderRadius: 4,
          fontSize: 15,
        }}
      >
        <option value="">Select a reason...</option>
        {REASONS.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>

      <label style={{ display: "block", fontWeight: "bold", marginBottom: 8 }}>
        Additional notes (optional)
      </label>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={4}
        placeholder="Any extra details that might help us..."
        style={{
          width: "100%",
          padding: "10px 12px",
          marginBottom: 24,
          border: "1px solid #ddd",
          borderRadius: 4,
          fontSize: 15,
          resize: "vertical",
          boxSizing: "border-box",
        }}
      />

      {status === "error" && (
        <p style={{ color: "red", marginBottom: 16 }}>{errorMessage}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!reason || status === "loading"}
        style={{
          backgroundColor: reason ? "#000" : "#ccc",
          color: "#fff",
          padding: "12px 24px",
          border: "none",
          borderRadius: 4,
          fontSize: 15,
          cursor: reason ? "pointer" : "not-allowed",
        }}
      >
        {status === "loading" ? "Submitting..." : "Submit request"}
      </button>
    </div>
  );
}
