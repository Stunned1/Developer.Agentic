import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { agent_id, inputs } = await req.json();

  // Use admin client to read endpoint config — bypasses RLS so buyers can trigger execution
  // without ever seeing the auth token (it stays server-side)
  const admin = createAdminClient();
  const { data: endpoint, error: endpointError } = await admin
    .from("agent_endpoints")
    .select("endpoint_url, auth_token, custom_headers, webhook_url")
    .eq("agent_id", agent_id)
    .single();

  if (endpointError || !endpoint) {
    return NextResponse.json({ error: "Agent endpoint not found" }, { status: 404 });
  }

  // Create execution record
  const { data: execution, error: execError } = await supabase
    .from("executions")
    .insert({ agent_id, buyer_id: user.id, status: "running", inputs })
    .select("id")
    .single();

  if (execError || !execution) {
    return NextResponse.json({ error: "Failed to create execution" }, { status: 500 });
  }

  // If async (webhook configured), return execution ID immediately
  if (endpoint.webhook_url) {
    // Fire-and-forget forward to developer endpoint
    fetch(endpoint.endpoint_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${endpoint.auth_token}`,
        ...(endpoint.custom_headers ?? {}),
        "X-Agentic-Execution-Id": execution.id,
        "X-Agentic-Webhook-Url": `${process.env.NEXT_PUBLIC_SUPABASE_URL}/api/webhooks/execution-complete`,
      },
      body: JSON.stringify({ execution_id: execution.id, inputs }),
    }).catch(() => {});

    return NextResponse.json({ execution_id: execution.id, async: true });
  }

  // Synchronous execution
  try {
    const devRes = await fetch(endpoint.endpoint_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${endpoint.auth_token}`,
        ...(endpoint.custom_headers ?? {}),
      },
      body: JSON.stringify({ execution_id: execution.id, inputs }),
    });

    const result = await devRes.json();

    await supabase
      .from("executions")
      .update({ status: "complete", result, completed_at: new Date().toISOString() })
      .eq("id", execution.id);

    return NextResponse.json({ execution_id: execution.id, result });
  } catch {
    await supabase
      .from("executions")
      .update({ status: "failed" })
      .eq("id", execution.id);

    return NextResponse.json({ error: "Execution failed" }, { status: 502 });
  }
}
