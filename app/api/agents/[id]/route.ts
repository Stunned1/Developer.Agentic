import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/agents/[id] — edit a pending or rejected agent
export async function PATCH(req: Request, { params }: Params) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Confirm ownership and that it's editable
  const { data: existing } = await supabase
    .from("agents")
    .select("id, status, developer_id")
    .eq("id", id)
    .eq("developer_id", user.id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.status === "approved") {
    return NextResponse.json(
      { error: "Approved agents cannot be edited. Contact support." },
      { status: 403 }
    );
  }

  const body = await req.json();

  // Separate agent fields from endpoint/pricing fields
  const {
    endpoint_url, auth_token, custom_headers, webhook_url, avg_run_time,
    pricing_model, price_usd, credits_per_run,
    ...agentFields
  } = body;

  // Allowed agent columns only
  const agentUpdate: Record<string, unknown> = {};
  const allowed = ["name", "tagline", "category", "tags", "description", "required_inputs", "demo_url"];
  for (const key of allowed) {
    if (key in agentFields) agentUpdate[key] = agentFields[key];
  }

  // Reset to pending on re-submit
  if (Object.keys(agentUpdate).length) {
    agentUpdate.status = "pending";
    const { error } = await supabase.from("agents").update(agentUpdate).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update endpoint if provided
  if (endpoint_url || auth_token || custom_headers !== undefined || webhook_url || avg_run_time) {
    const endpointUpdate: Record<string, unknown> = {};
    if (endpoint_url)            endpointUpdate.endpoint_url    = endpoint_url;
    if (auth_token)              endpointUpdate.auth_token       = auth_token;
    if (custom_headers !== undefined) endpointUpdate.custom_headers = custom_headers;
    if (webhook_url !== undefined)    endpointUpdate.webhook_url    = webhook_url;
    if (avg_run_time)            endpointUpdate.avg_run_time     = avg_run_time;

    const { error } = await supabase.from("agent_endpoints").update(endpointUpdate).eq("agent_id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update pricing if provided
  if (pricing_model || price_usd !== undefined || credits_per_run !== undefined) {
    const pricingUpdate: Record<string, unknown> = {};
    if (pricing_model)              pricingUpdate.model           = pricing_model;
    if (price_usd !== undefined)    pricingUpdate.price_usd       = price_usd;
    if (credits_per_run !== undefined) pricingUpdate.credits_per_run = credits_per_run;

    const { error } = await supabase.from("agent_pricing").update(pricingUpdate).eq("agent_id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/agents/[id] — remove a listing
export async function DELETE(_req: Request, { params }: Params) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // RLS ensures only the owning developer can delete
  const { error } = await supabase
    .from("agents")
    .delete()
    .eq("id", id)
    .eq("developer_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
