"use client";

import { useState } from "react";

export default function StripeConnectButton() {
  const [loading, setLoading] = useState(false);

  async function handleConnect() {
    setLoading(true);
    const res = await fetch("/api/stripe/connect", { method: "POST" });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleConnect}
      disabled={loading}
      className="shrink-0 bg-[#635BFF] hover:bg-[#5851e6] disabled:opacity-50 transition-colors text-white text-xs font-medium px-4 py-2 rounded-lg"
    >
      {loading ? "Redirecting..." : "Connect Stripe"}
    </button>
  );
}
