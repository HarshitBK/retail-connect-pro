import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import PortalSelection from "@/components/home/PortalSelection";
import HowItWorks from "@/components/home/HowItWorks";
import JobCategories from "@/components/home/JobCategories";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <PortalSelection />
        <JobCategories />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
