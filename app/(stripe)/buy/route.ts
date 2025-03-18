import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { z } from "zod";

import { auth } from "@/app/(auth)/auth";
import { stripe } from "@/lib/stripe";
import { URL_NEW_CHAT } from "@/lib/urls";

// Docs:
// https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#revalidate
//
// >0: Ensure a layout or page is always dynamically rendered even if no Dynamic
// >APIs or uncached data fetches are discovered. This option changes the default
// >of fetch requests that do not set a cache option to 'no-store' but leaves fetch
// >requests that opt into 'force-cache' or use a positive revalidate as is.
export const revalidate = 0;
export const dynamic = "force-dynamic";
export const fetchCache = "only-no-store";

let PRICE_ID_BASIC_MONTHLY: string;
let PRICE_ID_ELITE_YEARLY: string;

if (
  process.env.STRIPE_SECRET_KEY &&
  process.env.STRIPE_SECRET_KEY.startsWith("sk_test_")
) {
  // test prices:
  PRICE_ID_BASIC_MONTHLY = "price_1R2ljkENa6u0U2g1BPduK4FP";
  PRICE_ID_ELITE_YEARLY = "price_1R2lkCENa6u0U2g1IIXeEzYi";
} else {
  // live:

  // (former: $24/mo)
  // PRICE_ID_BASIC_MONTHLY = "price_1R2m4FENa6u0U2g1yPjo50Lr";
  // (new: $9/mo)
  PRICE_ID_BASIC_MONTHLY = "price_1R3YWcENa6u0U2g1wohdJj2f";

  // (former: $149/year)
  // PRICE_ID_ELITE_YEARLY = "price_1R2m4FENa6u0U2g1658GrdQW";
  // (new: $55/year)
  PRICE_ID_ELITE_YEARLY = "price_1R3YXPENa6u0U2g1kliD0EJ5";
}

export async function GET(request: Request) {
  const authSession = await auth();

  if (!authSession || !authSession.user || !authSession.user.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const headersList = await headers();

  const origin = headersList.get("origin") ?? new URL(request.url).origin;
  console.log(`origin: ${origin}`);

  const plan = new URL(request.url).searchParams.get("plan");
  if (!plan) {
    return new Response("No plan provided", { status: 400 });
  }
  let priceId: string;
  switch (plan) {
    case "basic": {
      priceId = PRICE_ID_BASIC_MONTHLY;
      break;
    }
    case "elite": {
      priceId = PRICE_ID_ELITE_YEARLY;
      break;
    }
    default: {
      return new Response("Invalid plan", { status: 400 });
    }
  }

  try {
    const { c4k_user_id, c4k_user_email } = z
      .object({
        c4k_user_id: z.string().uuid().or(z.string().startsWith("test_")),
        c4k_user_email: z.string().email(),
      })
      .parse({
        c4k_user_id: authSession.user.id,
        c4k_user_email: authSession.user.email,
      });

    // Create Checkout Sessions from body params.
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      automatic_tax: { enabled: true },
      line_items: [
        {
          // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
          // price: "price_1R1kn0ENa6u0U2g1kzJwCKVg",
          price: priceId,
          quantity: 1,
        },
      ],
      // success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      success_url: `${origin}${URL_NEW_CHAT}`,
      cancel_url: `${origin}/?checkout_canceled=true`,

      client_reference_id: c4k_user_id,
      subscription_data: {
        // trial_period_days: 3,
        trial_period_days: 30,
        metadata: {
          c4k_user_id,
          c4k_user_email,
        },
      },
      customer_email: c4k_user_email,
      // customer: (async () => {
      //   const customer = await stripe.customers.create({
      //     email: c4k_user_email,
      //     metadata: {
      //       c4k_user_id,
      //     },
      //   });
      //   return customer.id;
      // })(),
    });
    if (!session.url) {
      throw new Error("No URL returned from Stripe");
    }
    return NextResponse.redirect(session.url, {
      status: 303,
      headers: {
        // needed?
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message },
      { status: err.statusCode || 500 }
    );
  }
}
