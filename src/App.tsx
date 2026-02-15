import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import { AuthProvider } from "@/hooks/useAuth";
import { FraudTrackingProvider } from "@/hooks/useFraudTracking";
import ClickSparkGlobal from "@/components/ui/ClickSparkGlobal";
import BugReportWidget from "@/components/BugReportWidget";
import Index from "./pages/Index";
import PortfolioScanner from "./pages/PortfolioScanner";
import ExtracurricularOptimizer from "./pages/ExtracurricularOptimizer";
import AcademicPlanner from "./pages/AcademicPlanner";
import ProjectIncubationHub from "./pages/ProjectIncubationHub";
import ProjectFoundation from "./pages/ProjectFoundation";
import ProjectManagement from "./pages/ProjectManagement";
import ProjectDiscovery from "./pages/ProjectDiscovery";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import PortfolioInsightsNew from "./pages/PortfolioInsightsNew";
import VerifyEmail from "./pages/VerifyEmail";
import ResetPassword from "./pages/ResetPassword";
import RequireVerified from "@/components/RequireVerified";
import RequireTermsAccepted from "@/components/RequireTermsAccepted";
import TestTeachingUnit from "./pages/TestTeachingUnit";
import TestTeachingUnitSimple from "./pages/TestTeachingUnitSimple";
import WorkshopDemo from "./pages/WorkshopDemo";
import ActivityWorkshop from "./pages/ActivityWorkshop";
import Pricing from "./pages/Pricing";
import PIQWorkshop from "./pages/PIQWorkshop";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Settings from "./pages/Settings";
import DashboardLayout from "./layouts/DashboardLayout";
import { CLERK_PUBLISHABLE_KEY, hasClerkKey } from "@/config/clerk";
import { ConfigError } from "@/components/ConfigError";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />

      {/* Marketing/demo pages */}
      <Route path="/extracurricular-optimizer" element={<ExtracurricularOptimizer />} />
      <Route path="/academic-planner" element={<AcademicPlanner />} />
      <Route path="/project-incubation" element={<ProjectIncubationHub />} />
      <Route path="/project-incubation/foundation" element={<ProjectFoundation />} />
      <Route path="/project-incubation/foundation/metrics" element={<ProjectFoundation />} />
      <Route path="/project-incubation/foundation/timeline" element={<ProjectFoundation />} />
      <Route path="/project-incubation/foundation/impact" element={<ProjectFoundation />} />
      <Route path="/project-incubation/projects" element={<ProjectManagement />} />
      <Route path="/project-incubation/discovery" element={<ProjectDiscovery />} />

      {/* Test/demo routes */}
      <Route path="/test-teaching-unit" element={<TestTeachingUnit />} />
      <Route path="/test-simple" element={<TestTeachingUnitSimple />} />
      <Route path="/workshop-demo" element={<WorkshopDemo />} />
      <Route path="/activity-workshop/:sessionId" element={<ActivityWorkshop />} />

      {/* Dashboard routes */}
      <Route element={<RequireVerified><RequireTermsAccepted><DashboardLayout /></RequireTermsAccepted></RequireVerified>}>
        <Route path="/portfolio-scanner" element={<PortfolioScanner />} />
        <Route path="/portfolio-insights" element={<PortfolioInsightsNew />} />
        <Route path="/piq-workshop" element={<PIQWorkshop />} />
        <Route path="/piq-workshop/:piqNumber" element={<PIQWorkshop />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
    <ClickSparkGlobal />
    <BugReportWidget />
  </BrowserRouter>
);

const App = () => {
  // If Clerk key is missing even after fallback, show in-app error instead of crashing
  if (!hasClerkKey()) {
    return (
      <ConfigError
        error="Authentication configuration is missing"
        details={['VITE_CLERK_PUBLISHABLE_KEY is not configured']}
      />
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} afterSignOutUrl="/">
        <AuthProvider>
          <FraudTrackingProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <AppRoutes />
            </TooltipProvider>
          </FraudTrackingProvider>
        </AuthProvider>
      </ClerkProvider>
    </QueryClientProvider>
  );
};

export default App;
