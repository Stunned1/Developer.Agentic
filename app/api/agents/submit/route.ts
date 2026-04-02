import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Ensure developer_profiles row exists
  await supabase
    .from("developer_profiles")
    .upsert({ id: user.id }, { onConflict: "id" });

  const body = await req.json();
  const {
    name, tagline, category, tags, description, required_inputs, demo_url,
    endpoint_url, auth_token, custom_headers, webhook_url, avg_run_time,
    pricing_model, price_usd, credits_per_run,
  } = body;

  // Insert agent
  const { data: agent, error: agentError } = await supabase
    .from("agents")
    .insert({
      developer_id: user.id,
      name,
      tagline,
      category,
      tags,
      description,
      required_inputs,
      demo_url,
      status: "pending",
    })
    .select("id")
    .single();

  if (agentError || !agent) {
    return NextResponse.json({ error: agentError?.message ?? "Failed to create agent" }, { status: 500 });
  }

  // Insert endpoint config
  const { error: endpointError } = await supabase
    .from("agent_endpoints")
    .insert({
      agent_id: agent.id,
      endpoint_url,
      auth_token,
      custom_headers: custom_headers ?? null,
      webhook_url: webhook_url || null,
      avg_run_time,
    });

  if (endpointError) {
    return NextResponse.json({ error: endpointError.message }, { status: 500 });
  }

  // Insert pricing
  const { error: pricingError } = await supabase
    .from("agent_pricing")
    .insert({
      agent_id: agent.id,
      model: pricing_model,
      price_usd: price_usd ?? null,
      credits_per_run: credits_per_run ?? null,
    });

  if (pricingError) {
    return NextResponse.json({ error: pricingError.message }, { status: 500 });
  }

  return NextResponse.json({ id: agent.id }, { status: 201 });
}
