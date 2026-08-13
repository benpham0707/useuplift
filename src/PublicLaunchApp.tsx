import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ClickSparkGlobal from '@/components/ui/ClickSparkGlobal';
import Index from '@/pages/Index';
import Privacy from '@/pages/Privacy';
import Terms from '@/pages/Terms';

/**
 * Production-only public surface while Uplift is in development.
 *
 * This module intentionally has no Clerk, Supabase, or authenticated-product
 * imports. Loading the production landing page therefore cannot initialize an
 * auth session or fail because private application configuration is absent.
 */
const PublicLaunchApp = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <ClickSparkGlobal />
  </BrowserRouter>
);

export default PublicLaunchApp;
