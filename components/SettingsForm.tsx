"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Upload, Check, Globe, Twitter, Github } from "lucide-react";

type Profile = {
  handle: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  website: string | null;
  twitter: string | null;
  github: string | null;
} | null;

const input = "w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-purple-500/50 focus:outline-none transition-colors rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/25";

export default function SettingsForm({ initial, email }: { initial: Profile; email: string }) {
  const supabase = createClient();
  const avatarRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    handle:       initial?.handle       ?? "",
    display_name: initial?.display_name ?? "",
    bio:          initial?.bio          ?? "",
    avatar_url:   initial?.avatar_url   ?? "",
    banner_url:   initial?.banner_url   ?? "",
    website:      initial?.website      ?? "",
    twitter:      initial?.twitter      ?? "",
    github:       initial?.github       ?? "",
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<"avatar" | "banner" | null>(null);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setSaved(false);
  }

  async function uploadImage(file: File, type: "avatar" | "banner") {
    setUploading(type);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const ext = file.name.split(".").pop();
    const path = `${user.id}/${type}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("developer-assets")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(null);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("developer-assets")
      .getPublicUrl(path);

    set(`${type}_url`, publicUrl);
    setUploading(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/developer/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setSaved(true);
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to save");
    }
    setSaving(false);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-1">Brand Settings</h1>
      <p className="text-white/40 text-sm mb-8">How developers and buyers see you on Agentic.</p>

      <form onSubmit={handleSave} className="flex flex-col gap-8">

        {/* Banner */}
        <div>
          <p className="text-sm font-medium text-white mb-2">Banner</p>
          <div
            className="relative w-full h-32 rounded-xl border border-white/10 overflow-hidden bg-white/[0.03] cursor-pointer group"
            onClick={() => bannerRef.current?.click()}
          >
            {form.banner_url ? (
              <img src={form.banner_url} alt="Banner" className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center h-full text-white/20 text-xs gap-2">
                <Upload size={14} /> Upload banner
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white/60 text-xs gap-2">
              <Upload size={14} /> {uploading === "banner" ? "Uploading..." : "Change banner"}
            </div>
          </div>
          <input ref={bannerRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "banner")} />
        </div>

        {/* Avatar + name */}
        <div className="flex items-start gap-5">
          <div className="shrink-0">
            <p className="text-sm font-medium text-white mb-2">Avatar</p>
            <div
              className="w-20 h-20 rounded-full border border-white/10 overflow-hidden bg-white/[0.03] cursor-pointer group relative"
              onClick={() => avatarRef.current?.click()}
            >
              {form.avatar_url ? (
                <img src={form.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-white/20">
                  <Upload size={16} />
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Upload size={14} className="text-white/60" />
              </div>
            </div>
            <input ref={avatarRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "avatar")} />
          </div>

          <div className="flex-1 flex flex-col gap-4 pt-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-white">Display Name</label>
              <input className={input} placeholder="Your name or brand" value={form.display_name}
                onChange={(e) => set("display_name", e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-white">
                Handle <span className="text-white/30 font-normal text-xs">agentic.com/@handle</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">@</span>
                <input className={`${input} pl-8`} placeholder="yourhandle" value={form.handle}
                  onChange={(e) => set("handle", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} />
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-white">Bio</label>
          <textarea className={`${input} resize-none h-20`} placeholder="Tell buyers what you build..."
            value={form.bio} onChange={(e) => set("bio", e.target.value)} />
        </div>

        {/* Links */}
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-white">Links</p>
          <div className="relative">
            <Globe size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input className={`${input} pl-10`} placeholder="https://yoursite.com" value={form.website}
              onChange={(e) => set("website", e.target.value)} />
          </div>
          <div className="relative">
            <Twitter size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input className={`${input} pl-10`} placeholder="@twitter" value={form.twitter}
              onChange={(e) => set("twitter", e.target.value)} />
          </div>
          <div className="relative">
            <Github size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input className={`${input} pl-10`} placeholder="github username" value={form.github}
              onChange={(e) => set("github", e.target.value)} />
          </div>
        </div>

        {/* Email (read-only) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-white">Email <span className="text-white/30 font-normal text-xs">read-only</span></label>
          <input className={`${input} opacity-50 cursor-not-allowed`} value={email} readOnly />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 self-start bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition-colors text-white text-sm font-medium px-5 py-2.5 rounded-lg"
        >
          {saved ? <><Check size={15} /> Saved</> : saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
