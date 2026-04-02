import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardNav from "@/components/DashboardNav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("developer_profiles")
    .select("display_name, avatar_url, handle")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-screen">
      <DashboardNav profile={profile} />
      <main className="flex-1 ml-56 p-10">{children}</main>
    </div>
  );
}
