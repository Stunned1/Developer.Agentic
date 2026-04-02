"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}${next}` },
    });
    setLoading(false);
    if (!error) setSent(true);
  }

  if (sent) {
    return (
      <div className="text-center max-w-sm">
        <div className="w-12 h-12 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-4">
          <span className="text-purple-400 text-lg">✉</span>
        </div>
        <h2 className="text-lg font-semibold mb-2">Check your email</h2>
        <p className="text-white/40 text-sm">We sent a magic link to {email}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-bold mb-1">Sign in</h1>
      <p className="text-white/40 text-sm mb-8">We'll send you a magic link.</p>
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-purple-500/50 focus:outline-none transition-colors rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/25"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition-colors text-white text-sm font-medium px-5 py-2.5 rounded-lg"
        >
          {loading ? "Sending..." : "Send Magic Link"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex items-center justify-center min-h-screen px-8">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
