import { AiShowcase } from "@/features/home/ai-showcase";
import { ClosingCta } from "@/features/home/closing-cta";
import { DoctorsSection } from "@/features/home/doctors-section";
import { HeroSection } from "@/features/home/hero-section";
import { HowItWorks } from "@/features/home/how-it-works";
import { TestimonialsSection } from "@/features/home/testimonials-section";
import { TreatmentsSection } from "@/features/home/treatments-section";
import { TrustStrip } from "@/features/home/trust-strip";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <TrustStrip />
      <HowItWorks />
      <AiShowcase />
      <TreatmentsSection />
      <DoctorsSection />
      <TestimonialsSection />
      <ClosingCta />
    </>
  );
}
