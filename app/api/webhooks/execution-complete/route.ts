import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Developer's server pings this when an async job finishes.
// Requires a shared secret in the Authorization header: Bearer <WEBHOOK_SECRET>
export async function POST(req: Request) {
  const secret = process.env.WEBHOOK_SECRET;
  const authHeader = req.headers.get("authorization");

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const { execution_id, result, status } = await req.json();

  if (!execution_id) {
    return NextResponse.json({ error: "Missing execution_id" }, { status: 400 });
  }

  const { error } = await supabase
    .from("executions")
    .update({
      status: status ?? "complete",
      result,
      completed_at: new Date().toISOString(),
    })
    .eq("id", execution_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Supabase Realtime will broadcast the update to subscribed buyers automatically

  return NextResponse.json({ ok: true });
}
