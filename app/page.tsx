import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { Features } from "@/components/features";
import { Pricing } from "@/components/pricing";
import { FAQ } from "@/components/faq";
import { Footer } from "@/components/footer";
import { HomeworkModeHero } from "@/components/homework-mode-hero";

export default function Home() {
  return (
    <div className="min-h-dvh w-dvw flex flex-col">
      <Navbar />
      <main className="grow">
        <Hero />
        <HomeworkModeHero/>
        <Features />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
