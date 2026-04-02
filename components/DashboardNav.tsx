"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, Settings, ExternalLink } from "lucide-react";

const NAV = [
  { href: "/dashboard",          label: "Overview",  icon: LayoutDashboard },
  { href: "/dashboard/agents",   label: "Agents",    icon: Package },
  { href: "/dashboard/settings", label: "Settings",  icon: Settings },
];

type Profile = { display_name: string | null; avatar_url: string | null; handle: string | null } | null;

export default function DashboardNav({ profile }: { profile: Profile }) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-[#0d0d14] border-r border-white/5 flex flex-col px-4 py-6">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-2 mb-8">
        <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center text-xs font-bold">A</div>
        <span className="text-sm font-semibold">Agentic</span>
        <span className="text-[10px] text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded-full ml-auto">Dev</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 flex-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                active ? "bg-white/8 text-white" : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon size={15} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Profile footer */}
      <div className="border-t border-white/5 pt-4 mt-4">
        <div className="flex items-center gap-2.5 px-2">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/50">
              {profile?.display_name?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{profile?.display_name ?? "Your Name"}</p>
            {profile?.handle && (
              <p className="text-[11px] text-white/30 truncate">@{profile.handle}</p>
            )}
          </div>
          {profile?.handle && (
            <Link href={`/${profile.handle}`} target="_blank" className="text-white/20 hover:text-white/60 transition-colors">
              <ExternalLink size={12} />
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}
