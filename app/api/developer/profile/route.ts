import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { handle, display_name, bio, avatar_url, banner_url, website, twitter, github } = await req.json();

  // Check handle uniqueness if changed
  if (handle) {
    const { data: existing } = await supabase
      .from("developer_profiles")
      .select("id")
      .eq("handle", handle)
      .neq("id", user.id)
      .single();

    if (existing) {
      return NextResponse.json({ error: "That handle is already taken." }, { status: 409 });
    }
  }

  // Update developer_profiles
  const { error: devError } = await supabase
    .from("developer_profiles")
    .upsert(
      { id: user.id, handle, display_name, bio, avatar_url, banner_url, website, twitter, github },
      { onConflict: "id" }
    );

  if (devError) {
    return NextResponse.json({ error: devError.message }, { status: 500 });
  }

  // Also update profiles table so name shows everywhere
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(
      { id: user.id, display_name, avatar_url },
      { onConflict: "id" }
    );

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
