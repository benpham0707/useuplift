import AnnouncementBar from '@/components/AnnouncementBar';
import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import UniversityBacked from '@/components/UniversityBacked';
import EmpathySection from '@/components/EmpathySection';
import HowItWorks from '@/components/HowItWorks';
import Features from '@/components/Features';
import AlternativePaths from '@/components/AlternativePaths';
import TargetAudience from '@/components/TargetAudience';
import Testimonials from '@/components/Testimonials';
import TrustSection from '@/components/TrustSection';
import FAQ from '@/components/FAQ';
import FinalCTA from '@/components/FinalCTA';
import Footer from '@/components/Footer';

const Index = () => {
  // Allow logged-in users to view landing page while keeping authenticated navbar
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <AnnouncementBar />
      <Navigation />
      <main className="flex-1">
        <HeroSection />
        <UniversityBacked />
        <EmpathySection />
        <HowItWorks />
        <Features />
        <AlternativePaths />
        <TargetAudience />
        <Testimonials />
        <TrustSection />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
