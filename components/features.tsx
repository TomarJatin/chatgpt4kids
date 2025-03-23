import React from "react";
import { Sparkles, Folder, ListChecks, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Define the props interface
interface GradientIconProps {
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  sizeClass?: string;
}

function GradientIcon({ Icon, sizeClass = "w-10 h-10 md:w-12 md:h-12" }: GradientIconProps) {
  const gradientId = React.useMemo(
    () => `gradient-${Math.random().toString(36).substring(2, 15)}`,
    []
  );

  return (
    <svg className={sizeClass} viewBox="0 0 24 24">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#06b6d4" /> 
          <stop offset="100%" stopColor="#2563eb" /> 
        </linearGradient>
      </defs>
      <Icon stroke={`url(#${gradientId})`} fill="none" />
    </svg>
  );
}

export function Features() {
  const features = [
    {
      icon: <GradientIcon Icon={Sparkles} />,
      title: "Customized to your child's age",
      description: (
        <span>
          We offer pre-defined modes for all age ranges:{" "}
          <span className="whitespace-nowrap">3-5</span>,{" "}
          <span className="whitespace-nowrap">6-9</span>,{" "}
          <span className="whitespace-nowrap">10-13</span>, and{" "}
          <span className="whitespace-nowrap">14+</span> — each with their own
          customized reading level, age-appropriate content moderation, and
          level of difficulty to help your children learn and grow!
        </span>
      ),
    },
    {
      icon: <GradientIcon Icon={Folder} />,
      title: "Daily Usage Report",
      description:
        "Get insights into what your child is learning, their favorite topics, and time spent exploring.",
    },
    {
      icon: <GradientIcon Icon={ListChecks} />,
      title: "Custom Rules",
      description:
        "Set your own guidelines to shape how the AI responds, ensuring a personalized and safe experience for your child.",
    },
    {
      icon: <GradientIcon Icon={Users} />,
      title: "Supports up to 3 children under one subscription",
      description: "Each child has their own account and learning profile.",
    },
  ];

  return (
    <section id="features" className="py-12 md:py-24 bg-muted/30">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
              Built for Children, Controlled by Parents
            </h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              We use state-of-the-art models from companies like OpenAI and
              Anthropic (Claude), but instead we&apos;ve built it from the
              ground up to be safe and customized for children.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8 mt-12">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="border-2 border-muted relative shadow-md min-h-[300px] pb-12"
            >
              <CardHeader>
                <div className="mb-2">{feature.icon}</div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="pb-12 flex-1">
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>

              {/* <div className="absolute bottom-3 left-3 bg-secondary text-secondary-foreground text-xs font-medium uppercase tracking-wider py-1 px-2 rounded shadow-sm">
                Coming Soon
              </div> */}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}