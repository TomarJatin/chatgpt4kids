import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export function Pricing() {
  const plans = [
    {
      api_plan_name: "basic",
      name: (
        <span>
          <span className="text-[28px]">Basic</span>{" "}
          <span className="font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            + <span className="-tracking-wider">3-day free trial</span>
          </span>
        </span>
      ),
      price: "$24",
      period: "/month",
      description: "Perfect for families just getting started with AI learning",
      features: [
        "Access for up to 3 children",
        "Age-appropriate content moderation",
        "Basic parental controls",
        "Weekly usage reports",
        "Email support",
      ],
      cta: <span>Start 3-day free trial</span>,
      popular: false,
    },
    {
      api_plan_name: "elite",
      name: (
        <span>
          <span className="text-[28px]">Elite</span>{" "}
          <span className="font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            + <span className="-tracking-wider">3-day free trial</span>
          </span>
        </span>
      ),
      price: "$149",
      period: "/year",
      description:
        "Our most popular plan for families committed to AI learning",
      features: [
        "Everything in Basic",
        "Priority support",
        "Advanced custom rules",
        "Detailed daily learning reports",
        "Educational resource library",
        "Personalized learning paths",
        "Save over 50% compared to monthly",
      ],
      cta: <span>Start Annual Plan (+ 3-day free trial)</span>,
      popular: true,
    },
  ];

  return (
    <section id="pricing" className="py-12 md:py-24">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-primary px-3 py-1 text-sm text-primary-foreground">
              Pricing
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
              Simple, Transparent Pricing
            </h2>
            <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Choose the plan that works best for your family. All plans include
              our core safety features.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8 mt-8">
          {plans.map((plan) => (
            <Card
              key={plan.api_plan_name}
              className={`flex flex-col ${plan.popular ? "border-primary shadow-lg" : "border-border"}`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 translate-x-2 -translate-y-2">
                  <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <CardDescription className="mt-2">
                  {plan.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="grow">
                <ul className="space-y-2 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="size-4 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  asChild
                >
                  {/* no Link, because this is a GET request for a stripe checkout */}
                  <a href={`/buy?plan=${plan.api_plan_name}`}>
                    {plan.cta}
                  </a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        <div className="mt-8 text-center text-sm text-muted-foreground">
          All plans come with a 30-day money-back guarantee. No questions asked.
        </div>
      </div>
    </section>
  );
}
