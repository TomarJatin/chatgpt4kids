import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Shield, Sparkles, Brain } from "lucide-react";

export function Hero() {
  return (
    <section className="py-12 md:py-24 lg:py-32 bg-gradient-to-b from-background to-muted/30">
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-6">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl">
                Learning Safely,
                <br />
                Exploring Freely
              </h1>
              <p className="max-w-[600px] text-muted-foreground md:text-xl">
                AI tools like ChatGPT are great for exploring information and
                tackling tasks, but they aren&apos;t always designed with
                children in mind.
                <span className="font-semibold">
                  {" "}
                  That&apos;s why we created ChatGPT For Kids
                </span>
                —a customized model that answers questions, sparks curiosity,
                and challenges young minds to learn more deeply, all in a safe
                and engaging way.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Button asChild size="lg" className="px-8">
                <Link href="#pricing">Get Started</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="#features">Learn More</Link>
              </Button>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Shield className="size-4 text-primary" />
                <span>Parent Controlled</span>
              </div>
              <div className="flex items-center gap-1">
                <Sparkles className="size-4 text-primary" />
                <span>Age Appropriate</span>
              </div>
              <div className="flex items-center gap-1">
                <Brain className="size-4 text-primary" />
                <span>Learning Focused</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="relative w-full h-[350px] md:h-[400px] lg:h-[500px] rounded-lg overflow-hidden shadow-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/placeholder.svg?height=500&width=600"
                alt="ChatGPT4Kids interface showing a child-friendly AI conversation"
                className="object-cover size-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                <div className="p-6 text-white">
                  <p className="text-lg font-medium">
                    Safe AI learning for ages 4-14
                  </p>
                  <p className="text-sm opacity-80">
                    Built from the ground up with children in mind
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
