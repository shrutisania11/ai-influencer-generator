import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-01-27.acacia" as any,
});

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") || "";

  let event: Stripe.Event;

  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error("Webhook secret not configured.");
    }
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error(`Webhook Signature Verification Failed: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  // Prefer service role key for admin RLS bypass in webhooks, otherwise fallback to anon key
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const planTier = session.metadata?.planTier;
    const creditsToAdd = parseInt(session.metadata?.creditsToAdd || "0", 10);

    if (userId && planTier && creditsToAdd > 0) {
      try {
        const { data: userData } = await supabase
          .from("users")
          .select("credits")
          .eq("id", userId)
          .single();

        const currentCredits = userData?.credits || 0;

        const { error } = await supabase
          .from("users")
          .update({
            subscription_tier: planTier,
            subscription_status: "active",
            credits: currentCredits + creditsToAdd,
            stripe_subscription_id: session.subscription as string,
            updated_at: new Date().toISOString()
          })
          .eq("id", userId);

        if (error) throw error;
        console.log(`[Webhook Success] Upgraded user ${userId} to ${planTier} and added ${creditsToAdd} credits.`);
      } catch (dbErr) {
        console.error("[Webhook Database Error]:", dbErr);
      }
    }
  }

  return NextResponse.json({ received: true });
}
