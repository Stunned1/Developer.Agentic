import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import StripeConnectButton from "@/components/StripeConnectButton";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("developer_profiles")
    .select("stripe_onboarded, display_name, handle, avatar_url")
    .eq("id", user.id)
    .single();

  const { data: agents } = await supabase
    .from("agents")
    .select("id, name, status, category, created_at")
    .order("created_at", { ascending: false });

  const approved = agents?.filter((a) => a.status === "approved").length ?? 0;
  const pending  = agents?.filter((a) => a.status === "pending").length ?? 0;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">
            {profile?.display_name ? `Hey, ${profile.display_name.split(" ")[0]}` : "Dashboard"}
          </h1>
          <p className="text-white/40 text-sm mt-0.5">{user.email}</p>
        </div>
        <Link
          href="/list-agent"
          className="bg-purple-600 hover:bg-purple-700 transition-colors text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          + List Agent
        </Link>
      </div>

      {/* Stripe banner */}
      {!profile?.stripe_onboarded && (
        <div className="bg-[#111118] border border-yellow-500/20 rounded-xl p-4 flex items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-sm font-medium text-yellow-400">Connect Stripe to receive payouts</p>
            <p className="text-xs text-white/40 mt-0.5">Required before your agents go live.</p>
          </div>
          <StripeConnectButton />
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: "Total Agents", value: agents?.length ?? 0 },
          { label: "Live",         value: approved },
          { label: "In Review",    value: pending },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white/[0.03] border border-white/5 rounded-xl px-5 py-4">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-white/40 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent agents */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-white/60">Recent Agents</p>
        <Link href="/dashboard/agents" className="text-xs text-purple-400 hover:underline">View all</Link>
      </div>
      <div className="flex flex-col gap-2">
        {!agents?.length ? (
          <div className="text-center py-12 text-white/20 text-sm border border-dashed border-white/10 rounded-xl">
            No agents yet.{" "}
            <Link href="/list-agent" className="text-purple-400 hover:underline">List your first →</Link>
          </div>
        ) : (
          agents.slice(0, 5).map((agent) => (
            <div key={agent.id} className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-xl px-5 py-3.5">
              <div>
                <p className="text-sm font-medium">{agent.name}</p>
                <p className="text-xs text-white/30 mt-0.5">{agent.category}</p>
              </div>
              <StatusBadge status={agent.status} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending:  "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    approved: "bg-green-500/10 text-green-400 border-green-500/20",
    rejected: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full border ${styles[status] ?? styles.pending}`}>
      {status}
    </span>
  );
}
