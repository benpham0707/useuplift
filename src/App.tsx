import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
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
import Pricing from "./pages/Pricing";
import PIQWorkshop from "./pages/PIQWorkshop";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/portfolio-scanner" element={<RequireVerified><RequireTermsAccepted><PortfolioScanner /></RequireTermsAccepted></RequireVerified>} />
            <Route path="/portfolio-insights" element={<RequireVerified><RequireTermsAccepted><PortfolioInsightsNew /></RequireTermsAccepted></RequireVerified>} />
            <Route path="/extracurricular-optimizer" element={<ExtracurricularOptimizer />} />
            <Route path="/academic-planner" element={<AcademicPlanner />} />
            <Route path="/project-incubation" element={<ProjectIncubationHub />} />
            <Route path="/project-incubation/foundation" element={<ProjectFoundation />} />
            <Route path="/project-incubation/foundation/metrics" element={<ProjectFoundation />} />
            <Route path="/project-incubation/foundation/timeline" element={<ProjectFoundation />} />
            <Route path="/project-incubation/foundation/impact" element={<ProjectFoundation />} />
            <Route path="/project-incubation/projects" element={<ProjectManagement />} />
            <Route path="/project-incubation/discovery" element={<ProjectDiscovery />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/test-teaching-unit" element={<TestTeachingUnit />} />
            <Route path="/test-simple" element={<TestTeachingUnitSimple />} />
            <Route path="/workshop-demo" element={<WorkshopDemo />} />
            <Route path="/piq-workshop" element={<RequireVerified><RequireTermsAccepted><PIQWorkshop /></RequireTermsAccepted></RequireVerified>} />
            <Route path="/piq-workshop/:piqNumber" element={<RequireVerified><RequireTermsAccepted><PIQWorkshop /></RequireTermsAccepted></RequireVerified>} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/settings" element={<RequireVerified><RequireTermsAccepted><Settings /></RequireTermsAccepted></RequireVerified>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ClickSparkGlobal />
          <BugReportWidget />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
