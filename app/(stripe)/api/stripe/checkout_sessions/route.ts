import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { z } from "zod";

import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const { c4k_user_id, c4k_user_email } = z
      .object({
        c4k_user_id: z.string().uuid().or(z.string().startsWith("test_")),
        c4k_user_email: z.string().email(),
      })
      .parse({
        c4k_user_id: formData.get("c4k_user_id"),
        c4k_user_email: formData.get("c4k_user_email"),
      });

    const headersList = await headers();
    const origin = headersList.get("origin");
    if (!origin) throw new Error("No origin found");

    // Create Checkout Sessions from body params.
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      automatic_tax: { enabled: true },
      line_items: [
        {
          // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
          price: "price_1R1kn0ENa6u0U2g1kzJwCKVg",
          quantity: 1,
        },
      ],
      // success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      success_url: `${origin}/`,
      cancel_url: `${origin}/?canceled=true`,

      client_reference_id: c4k_user_id,
      subscription_data: {
        trial_period_days: 7,
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
    return NextResponse.redirect(session.url, 303);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message },
      { status: err.statusCode || 500 }
    );
  }
}
