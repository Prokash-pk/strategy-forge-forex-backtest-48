
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    logStep("User authenticated", { userId: user.id, email: user.email });

    const { plan } = await req.json();
    logStep("Plan requested", { plan });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2023-10-16" 
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    }

    // Define pricing plans
    const planConfigs = {
      starter: {
        price_data: {
          currency: "sgd",
          product_data: { 
            name: "Stratyx Starter Plan",
            description: "5 saved strategies, 1-month historical data, Strategy Coach Lite"
          },
          unit_amount: 999, // $9.99 SGD
          recurring: { interval: "month" },
        },
        tier: "Starter"
      },
      pro: {
        price_data: {
          currency: "sgd", 
          product_data: { 
            name: "Stratyx Pro Plan",
            description: "20 strategies, 1-year historical data, Full Strategy Coach, Priority support"
          },
          unit_amount: 1999, // $19.99 SGD
          recurring: { interval: "month" },
        },
        tier: "Pro"
      },
      lifetime: {
        price_data: {
          currency: "sgd",
          product_data: { 
            name: "Stratyx Lifetime Plan",
            description: "All Pro features with lifetime access"
          },
          unit_amount: 3499, // $34.99 SGD one-time
        },
        tier: "Lifetime"
      }
    };

    const planConfig = planConfigs[plan as keyof typeof planConfigs];
    if (!planConfig) throw new Error("Invalid plan selected");

    const sessionConfig: any = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{
        price_data: planConfig.price_data,
        quantity: 1,
      }],
      mode: plan === "lifetime" ? "payment" : "subscription",
      success_url: `${req.headers.get("origin")}/?success=true&plan=${plan}`,
      cancel_url: `${req.headers.get("origin")}/?canceled=true`,
      metadata: {
        user_id: user.id,
        plan: planConfig.tier
      }
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);
    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
