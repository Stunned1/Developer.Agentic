import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// Stripe signs every webhook — verify before trusting the payload
async function verifyStripeSignature(body: string, signature: string, secret: string) {
  const encoder = new TextEncoder();
  const parts = signature.split(",").reduce<Record<string, string>>((acc, part) => {
    const [k, v] = part.split("=");
    acc[k] = v;
    return acc;
  }, {});

  const timestamp = parts["t"];
  const expectedSig = parts["v1"];
  if (!timestamp || !expectedSig) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const data = encoder.encode(`${timestamp}.${body}`);
  const sigBuffer = await crypto.subtle.sign("HMAC", key, data);
  const computed = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return computed === expectedSig;
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const body = await req.text();
  const valid = await verifyStripeSignature(body, signature, secret);
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body);

  if (event.type === "account.updated") {
    const account = event.data.object;
    // Mark onboarded when charges are enabled (KYC complete)
    if (account.charges_enabled) {
      const admin = createAdminClient();
      await admin
        .from("developer_profiles")
        .update({ stripe_onboarded: true })
        .eq("stripe_account_id", account.id);
    }
  }

  return NextResponse.json({ received: true });
}
