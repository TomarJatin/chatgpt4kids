"use client";

import { Button } from "@/components/ui/button";

export default function Pricing() {
  return (
    <form
      method="POST"
      action="/api/stripe/checkout_sessions"
      className="flex flex-col items-center justify-center h-screen"
    >
      <input className="border" name="c4k_user_id" defaultValue="test_abc123" />
      <input
        className="border"
        name="c4k_user_email"
        defaultValue="test_1@chatgpt4kids.com"
      />
      <h1 className="text-4xl font-bold">Pricing</h1>
      <p>$12/month Basic</p>
      <Button type="submit">Checkout</Button>
    </form>
  );
}
