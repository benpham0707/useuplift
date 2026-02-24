import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Pause CSS animations when tab is hidden to save CPU/GPU
document.addEventListener('visibilitychange', () => {
  document.documentElement.classList.toggle('tab-hidden', document.hidden);
});

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
