import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-8 text-center">
      <div className="mb-3 text-xs font-medium tracking-widest text-purple-400 uppercase">
        Agentic Developer Portal
      </div>
      <h1 className="text-4xl font-bold mb-4 max-w-lg">
        Ship your AI agent to thousands of buyers
      </h1>
      <p className="text-white/40 text-sm max-w-sm mb-8">
        List your agent, set your pricing, and get paid — Stripe handles everything.
      </p>
      <div className="flex gap-3">
        <Link
          href="/login"
          className="bg-purple-600 hover:bg-purple-700 transition-colors text-white text-sm font-medium px-5 py-2.5 rounded-lg"
        >
          Get Started
        </Link>
        <a
          href="https://agentic.com"
          className="border border-white/10 hover:border-white/20 transition-colors text-white/60 hover:text-white text-sm font-medium px-5 py-2.5 rounded-lg"
        >
          Learn More
        </a>
      </div>
    </main>
  );
}
