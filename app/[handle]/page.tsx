import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Globe, Twitter, Github } from "lucide-react";

export default async function DeveloperProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("developer_profiles")
    .select("id, display_name, bio, avatar_url, banner_url, website, twitter, github")
    .eq("handle", handle)
    .single();

  if (!profile) notFound();

  const { data: agents } = await supabase
    .from("agents")
    .select("id, name, tagline, category, agent_pricing ( model, price_usd, credits_per_run )")
    .eq("developer_id", profile.id)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-3xl mx-auto pb-16">
      {/* Banner */}
      <div className="w-full h-40 bg-gradient-to-br from-purple-900/40 to-white/5 rounded-b-2xl overflow-hidden">
        {profile.banner_url && (
          <img src={profile.banner_url} alt="" className="w-full h-full object-cover" />
        )}
      </div>

      {/* Avatar + info */}
      <div className="px-8">
        <div className="-mt-10 mb-4">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.display_name ?? ""} className="w-20 h-20 rounded-full border-4 border-[#0a0a0f] object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-full border-4 border-[#0a0a0f] bg-white/10 flex items-center justify-center text-2xl font-bold text-white/40">
              {profile.display_name?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
        </div>

        <h1 className="text-2xl font-bold">{profile.display_name ?? handle}</h1>
        {profile.bio && <p className="text-white/50 text-sm mt-1.5 max-w-lg">{profile.bio}</p>}

        {/* Social links */}
        <div className="flex items-center gap-4 mt-3">
          {profile.website && (
            <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white transition-colors">
              <Globe size={13} /> {profile.website.replace(/^https?:\/\//, "")}
            </a>
          )}
          {profile.twitter && (
            <a href={`https://twitter.com/${profile.twitter.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white transition-colors">
              <Twitter size={13} /> {profile.twitter}
            </a>
          )}
          {profile.github && (
            <a href={`https://github.com/${profile.github}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white transition-colors">
              <Github size={13} /> {profile.github}
            </a>
          )}
        </div>

        {/* Agents */}
        <div className="mt-10">
          <h2 className="text-sm font-medium text-white/50 uppercase tracking-widest mb-4">Agents</h2>
          {!agents?.length ? (
            <p className="text-white/20 text-sm">No published agents yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {agents.map((agent) => {
                const pricing = Array.isArray(agent.agent_pricing) ? agent.agent_pricing[0] : agent.agent_pricing;
                return (
                  <div key={agent.id} className="bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors rounded-xl p-5">
                    <p className="text-sm font-medium mb-1">{agent.name}</p>
                    <p className="text-xs text-white/40 mb-3 line-clamp-2">{agent.tagline}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/20 bg-white/5 px-2 py-0.5 rounded-full">{agent.category}</span>
                      {pricing && (
                        <span className="text-xs text-purple-400">
                          {pricing.model === "pay_per_run"
                            ? `${pricing.credits_per_run} credits/run`
                            : pricing.model === "subscription"
                            ? `$${pricing.price_usd}/mo`
                            : `$${pricing.price_usd}`}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
