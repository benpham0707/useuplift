import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import { AuthProvider } from "@/hooks/useAuth";
import { FraudTrackingProvider } from "@/hooks/useFraudTracking";
import ClerkErrorBoundary from "@/components/ClerkErrorBoundary";
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
import DashboardHome from "./pages/DashboardHome";
import { ConfigError } from "@/components/ConfigError";
import { CLERK_PUBLISHABLE_KEY } from "@/config/clerk";
import { getSupabaseConfigErrors } from "@/integrations/supabase/config";

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

const App = () => {
  // Check for critical configuration errors
  const supabaseErrors = getSupabaseConfigErrors();
  const clerkError = !CLERK_PUBLISHABLE_KEY ? 'VITE_CLERK_PUBLISHABLE_KEY is not configured' : null;
  
  const allErrors = [...supabaseErrors, ...(clerkError ? [clerkError] : [])];
  
  // Show configuration error page if critical variables are missing
  if (allErrors.length > 0) {
    return (
      <ConfigError
        error="Critical environment variables are missing"
        details={allErrors}
      />
    );
  }
  
  return (
  <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FraudTrackingProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
            <Routes>
              {/* Public routes - keep website-style top navigation */}
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              
              {/* Marketing/demo pages - no auth required */}
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
              
              {/* Dashboard routes - authenticated app shell with left sidebar */}
              <Route path="/dashboard" element={<RequireVerified><RequireTermsAccepted><DashboardLayout /></RequireTermsAccepted></RequireVerified>}>
                <Route index element={<DashboardHome />} />
                <Route path="scanner" element={<PortfolioScanner />} />
                <Route path="insights" element={<PortfolioInsightsNew />} />
                <Route path="workshop" element={<PIQWorkshop />} />
                <Route path="workshop/:piqNumber" element={<PIQWorkshop />} />
                <Route path="activity-workshop" element={<ActivityWorkshop />} />
                <Route path="pricing" element={<Pricing />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              {/* Backward compatibility redirects for old routes */}
              <Route path="/portfolio-scanner" element={<Navigate to="/dashboard/scanner" replace />} />
              <Route path="/portfolio-insights" element={<Navigate to="/dashboard/insights" replace />} />
              <Route path="/piq-workshop" element={<Navigate to="/dashboard/workshop" replace />} />
              <Route path="/piq-workshop/:piqNumber" element={<Navigate to="/dashboard/workshop/:piqNumber" replace />} />
              <Route path="/activity-workshop" element={<Navigate to="/dashboard/activity-workshop" replace />} />
              <Route path="/pricing" element={<Navigate to="/dashboard/pricing" replace />} />
              <Route path="/settings" element={<Navigate to="/dashboard/settings" replace />} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <ClickSparkGlobal />
            <BugReportWidget />
          </BrowserRouter>
        </TooltipProvider>
      </FraudTrackingProvider>
    </AuthProvider>
  </QueryClientProvider>
  </ClerkProvider>
  );
};

export default App;
