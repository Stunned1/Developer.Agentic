import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// POST /api/stripe/connect — initiates Stripe Connect onboarding, returns { url }
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const admin = createAdminClient();

  // Check if developer already has a Stripe account
  const { data: profile } = await admin
    .from("developer_profiles")
    .select("stripe_account_id, stripe_onboarded")
    .eq("id", user.id)
    .single();

  if (profile?.stripe_onboarded) {
    return NextResponse.json({ error: "Already onboarded" }, { status: 400 });
  }

  let accountId = profile?.stripe_account_id;

  // Create a new Express account if we don't have one yet
  if (!accountId) {
    const accountRes = await fetch("https://api.stripe.com/v1/accounts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ type: "express" }),
    });

    const account = await accountRes.json();
    if (!accountRes.ok) {
      return NextResponse.json({ error: account.error?.message }, { status: 500 });
    }

    accountId = account.id;

    await admin
      .from("developer_profiles")
      .upsert({ id: user.id, stripe_account_id: accountId }, { onConflict: "id" });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:4000";

  // Generate onboarding link
  const linkRes = await fetch("https://api.stripe.com/v1/account_links", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      account: accountId,
      refresh_url: `${appUrl}/dashboard`,
      return_url: `${appUrl}/dashboard`,
      type: "account_onboarding",
    }),
  });

  const link = await linkRes.json();
  if (!linkRes.ok) {
    return NextResponse.json({ error: link.error?.message }, { status: 500 });
  }

  return NextResponse.json({ url: link.url });
}
