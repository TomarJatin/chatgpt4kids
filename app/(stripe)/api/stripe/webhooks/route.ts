import { NextResponse } from "next/server";
import { headers } from "next/headers";

import type Stripe from "stripe";
import { z } from "zod";

import { updateUserStripeStatusPaid } from "@/lib/db/queries";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  let event;

  try {
    const hdrs = await headers();
    const stripeSignature = hdrs.get("stripe-signature");
    if (!stripeSignature) throw new Error("No stripe-signature found");

    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new Error("No stripe webhook secret found");

    const payload = await req.text();
    if (!payload) throw new Error("No payload found");

    event = stripe.webhooks.constructEvent(payload, stripeSignature, secret);
    // console.log("Stripe event:", event);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    // On error, log and return the error message.
    console.log(err);
    console.log(`Error message: ${errorMessage}`);
    return NextResponse.json(
      { message: `Webhook Error: ${errorMessage}` },
      { status: 400 }
    );
  }

  try {
    console.log("Event type:", event.type);
    switch (event.type) {
      case "checkout.session.completed": {
        const data = event.data.object;
        data.customer;
        console.log(`CheckoutSession status: ${data.payment_status}`);
        break;
      }
      //
      // Note: ignore `.created`, becuase they will have a status of 'incomplete', which is not useful for us to determine paid status.
      // as update `.updated` will always immediately follow `.created`.
      //
      // case "customer.subscription.created":
      //
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await handleSubscriptionStatusChange(event.data.object);
        break;
      }
      default: {
        console.error(`Unhandled event: ${event.type}`);
        // be graceful...
        // throw new Error(`Unhandled event: ${event.type}`);
      }
    }
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "Webhook handler failed" },
      { status: 500 }
    );
  }

  // Return a response to acknowledge receipt of the event.
  return NextResponse.json({ message: "Received" }, { status: 200 });
}

async function handleSubscriptionStatusChange(data: Stripe.Subscription) {
  const status = data.status;
  console.log("Subscription status change:", status, data);

  const { c4k_user_id } = z
    .object({ c4k_user_id: z.string().min(1) })
    .parse(data.metadata);

  await updateUserStripeStatusPaid({
    userId: c4k_user_id,
    stripeStatusPaid: status === "active",
  });
}
