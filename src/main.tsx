import React, { lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { isPublicLaunchMode } from './config/launchMode'
import './index.css'

// Keep the public production bundle isolated from Clerk, Supabase, and all
// authenticated application modules. Local development loads the full app.
const App = lazy(() =>
  isPublicLaunchMode ? import('./PublicLaunchApp') : import('./App')
)

// Pause CSS animations when tab is hidden to save CPU/GPU
document.addEventListener('visibilitychange', () => {
  document.documentElement.classList.toggle('tab-hidden', document.hidden);
});

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Suspense fallback={null}>
      <App />
    </Suspense>
  </React.StrictMode>,
);
