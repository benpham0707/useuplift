import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import PlatformOverview from '@/components/PlatformOverview';
import IntelligentRoadmap from '@/components/IntelligentRoadmap';
import AICapabilities from '@/components/AICapabilities';
import SuccessMetrics from '@/components/SuccessMetrics';
import ComprehensiveTools from '@/components/ComprehensiveTools';
import Differentiation from '@/components/Differentiation';
import Pricing from '@/components/Pricing';
import FinalCTA from '@/components/FinalCTA';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (user) {
      navigate('/portfolio-scanner');
    }
  }, [user, loading, navigate]);
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>
        <HeroSection />
        <PlatformOverview />
        <IntelligentRoadmap />
        <AICapabilities />
        <SuccessMetrics />
        <ComprehensiveTools />
        <Differentiation />
        <Pricing />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
