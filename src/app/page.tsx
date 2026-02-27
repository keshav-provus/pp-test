
import AboutSection from "@/components/home_page/AboutSection";
import CTASection from "@/components/home_page/CTASection";
import FeaturesSection from "@/components/home_page/FeaturesSection";
import Footer from "@/components/home_page/Footer";
import HeroSection from "@/components/home_page/HeroSection";
import HowItWorksSection from "@/components/home_page/HowItWorksSection";
import Navbar from "@/components/home_page/Navbar";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#07090F] text-slate-100 font-sans selection:bg-blue-500/30">
      <Navbar />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <FeaturesSection />
        <AboutSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}