import AnnouncementBar from '@/components/AnnouncementBar';
import HeroSection from '@/components/HeroSection';
import UniversityBacked from '@/components/UniversityBacked';
import PIQShowcase from '@/components/landing/PIQShowcase';
import ExpertiseSection from '@/components/landing/ExpertiseSection';
import AICoachPreview from '@/components/landing/AICoachPreview';
import ComingSoonSection from '@/components/landing/ComingSoonSection';
import Testimonials from '@/components/Testimonials';
import TrustSection from '@/components/TrustSection';
import FAQ from '@/components/FAQ';
import FinalCTA from '@/components/FinalCTA';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <AnnouncementBar />
      <main className="flex-1">
        <HeroSection />
        <UniversityBacked />
        <PIQShowcase />
        <ExpertiseSection />
        <AICoachPreview />
        <ComingSoonSection />
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
