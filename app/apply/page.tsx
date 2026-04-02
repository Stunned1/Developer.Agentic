import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ApplyForm from "@/components/ApplyForm";

export default async function ApplyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Not logged in — send to login, come back here after
  if (!user) redirect("/login?next=/apply");

  // Already a developer — send to dashboard
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_developer")
    .eq("id", user.id)
    .single();

  if (profile?.is_developer) redirect("/dashboard");

  return <ApplyForm />;
}
