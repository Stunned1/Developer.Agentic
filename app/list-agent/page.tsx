import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ListAgentForm from "@/components/ListAgentForm";

export default async function ListAgentPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <ListAgentForm />;
}
