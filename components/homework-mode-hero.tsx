import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Shield, Sparkles, Brain } from "lucide-react";
import Image from "next/image";

import chatgpt4kidsDemoAnimation from "@/static_assets/chatgpt4kids-demo-small.webp";

export function HomeworkModeHero() {
  return (
    <section className="py-12 md:py-24 lg:py-32 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto">
        <div className="grid gap-10 lg:grid-cols-[1fr_500px] lg:gap-10 xl:grid-cols-[1fr_600px]">
            
          <div className="flex flex-col items-center justify-center">
            <div className="flex flex-col items-start justify-center">
              <div className="relative rounded-lg shadow-xl">
                <Image
                  className="flex size-full object-cover rounded-lg overflow-hidden"
                  alt="ChatGPT for Kids interface showing a child-friendly AI conversation"
                  unoptimized // animated images are not optimizable by sharp/`next/image`
                  src={chatgpt4kidsDemoAnimation}
                  width={1200}
                  height={964}
                  fetchPriority="high"
                  loading="eager"
                  decoding="sync"
                  priority
                />
                <div className="absolute inset-0 border-[0.3px] rounded-lg bg-gradient-to-t from-primary/5 to-transparent flex items-end"></div>
              </div>
              <div className="px-3 mt-4">
                <p className="text-lg font-semibold">
                  Effective homework help for ages 3-14+
                </p>
                <p className="text-sm opacity-80">
                  Built from the ground up with children in mind
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex flex-col pt-3 lg:pt-3 space-y-4">
              <div className="space-y-6">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl w-full">
                  Homework Mode
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl mb-0 pb-0">
                  Don’t let your child use regular ChatGPT as a shortcut— copying homework robs them of essential learning and growth.
                </p>
                <p className="max-w-[600px] text-muted-foreground md:text-xl mt-0 pt-0">
                  <span className="font-semibold">
                    Instead, empower them with{" "}
                    <span className="tracking-[-0.048em] font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent pe-[1px]">
                      ChatGP<span className="tracking-[-0.07em]">T </span>fo
                      <span className="tracking-[-0.07em]">r </span>Kids
                    </span>
                  </span>{" "}
                  as a personal tutor that sparks curiosity, builds critical thinking, and unlocks real understanding.
                </p>
                <p className="max-w-[600px] text-muted-foreground md:text-xl mt-0 pt-0">
                  In homework mode, we never give answers straight out. We transform routine assignments into an interactive learning adventure—guiding your child step by step, deepening their knowledge, and inspiring a lifelong love of learning.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button asChild size="lg" className="px-8">
                  <Link href="#pricing">Get Started for Free!</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="#features">Learn More</Link>
                </Button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}