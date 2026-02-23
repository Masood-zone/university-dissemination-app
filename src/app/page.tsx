import { Footer } from "@/components/home/Footer";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { HeroSection } from "@/components/home/HeroSection";
import { Navbar } from "@/components/home/Navbar";
import { ScrollToTop } from "@/components/home/ScrollToTop";
import { StatsSection } from "@/components/home/StatsSection";
import { TeamSection } from "@/components/home/TeamSection";

export default function HomePage() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <TeamSection />
      <Footer />
      <ScrollToTop />
    </main>
  );
}
