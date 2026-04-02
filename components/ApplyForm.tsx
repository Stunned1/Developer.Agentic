"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";

export default function ApplyForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", what_building: "", agree: false });

  function set(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.agree) return setError("You must agree to the developer terms.");
    setLoading(true);
    setError(null);

    const res = await fetch("/api/developer/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, what_building: form.what_building }),
    });

    if (res.ok) {
      router.push("/dashboard");
    } else {
      const data = await res.json();
      setError(data.error ?? "Something went wrong");
      setLoading(false);
    }
  }

  const input = "w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-purple-500/50 focus:outline-none transition-colors rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/25";

  return (
    <main className="flex items-center justify-center min-h-screen px-8">
      <div className="w-full max-w-md">
        <div className="w-10 h-10 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mb-6">
          <Zap size={18} className="text-purple-400" />
        </div>
        <h1 className="text-2xl font-bold mb-1">Become a Developer</h1>
        <p className="text-white/40 text-sm mb-8">
          List your AI agents on the Agentic marketplace and get paid.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-white">Your name</label>
            <input
              className={input}
              placeholder="Jane Smith"
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-white">What are you building?</label>
            <textarea
              className={`${input} resize-none h-24`}
              placeholder="Describe the agent(s) you plan to list..."
              required
              value={form.what_building}
              onChange={(e) => set("what_building", e.target.value)}
            />
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 accent-purple-500"
              checked={form.agree}
              onChange={(e) => set("agree", e.target.checked)}
            />
            <span className="text-sm text-white/50">
              I agree to the{" "}
              <a href="/terms" className="text-purple-400 hover:underline">
                developer terms
              </a>{" "}
              and understand that all agents are subject to review before going live.
            </span>
          </label>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition-colors text-white text-sm font-medium px-5 py-2.5 rounded-lg"
          >
            {loading ? "Activating..." : "Activate Developer Access"}
          </button>
        </form>
      </div>
    </main>
  );
}
