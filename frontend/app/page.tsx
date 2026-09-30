import { LandingNav } from "@/components/landing/LandingNav";
import { LandingHero } from "@/components/landing/LandingHero";
import { MechanismFlow } from "@/components/landing/MechanismFlow";
import { SecuritySection } from "@/components/landing/SecuritySection";
import { FinalCta } from "@/components/landing/FinalCta";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <LandingNav />
      <main className="flex-1">
        <LandingHero />
        <MechanismFlow />
        <SecuritySection />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
