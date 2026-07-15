import { Footer } from "@/components/home/Footer";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { HeroSection } from "@/components/home/HeroSection";
import { LeadershipSection } from "@/components/home/LeadershipSection";
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
      <LeadershipSection />
      <TeamSection />
      <Footer />
      <ScrollToTop />
    </main>
  );
}
