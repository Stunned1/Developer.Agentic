import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SettingsForm from "@/components/SettingsForm";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("developer_profiles")
    .select("handle, display_name, bio, avatar_url, banner_url, website, twitter, github")
    .eq("id", user.id)
    .single();

  return <SettingsForm initial={profile} email={user.email ?? ""} />;
}
