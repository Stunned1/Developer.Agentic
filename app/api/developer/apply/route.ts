import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await req.json();

  // Upsert profile with is_developer = true
  const { error } = await supabase
    .from("profiles")
    .upsert(
      { id: user.id, display_name: name, is_developer: true },
      { onConflict: "id" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Ensure developer_profiles row exists for Stripe + agent listings
  await supabase
    .from("developer_profiles")
    .upsert({ id: user.id }, { onConflict: "id" });

  return NextResponse.json({ ok: true });
}
