import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ClerkProvider } from '@clerk/clerk-react'
import { CLERK_PUBLISHABLE_KEY, checkClerkConfiguration } from './config/clerk'

// Check Clerk configuration before starting the app
const clerkConfig = checkClerkConfiguration();

if (!clerkConfig.isValid) {
  // In development, show a helpful error page instead of crashing
  if (import.meta.env.MODE === 'development') {
    const errorDiv = document.getElementById("root")!;
    errorDiv.innerHTML = `
      <div style="max-width: 800px; margin: 50px auto; padding: 20px; font-family: system-ui, sans-serif;">
        <h1 style="color: #dc2626;">Clerk Configuration Error</h1>
        <p style="color: #666; margin: 20px 0;"><strong>Error:</strong> ${clerkConfig.error}</p>
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 0; white-space: pre-wrap;">${clerkConfig.suggestion}</p>
        </div>
        <h2 style="margin-top: 40px;">Quick Setup:</h2>
        <ol style="line-height: 1.8;">
          <li>Go to <a href="https://dashboard.clerk.com" target="_blank">Clerk Dashboard</a></li>
          <li>Create a new development application</li>
          <li>Add <code>localhost:5173</code> to allowed domains</li>
          <li>Copy your development keys (pk_test_... and sk_test_...)</li>
          <li>Create <code>.env.local</code> file with your keys (see <code>.env.local.example</code>)</li>
          <li>Restart the dev server</li>
        </ol>
        <p style="margin-top: 20px;">
          <a href="/LOCAL_DEVELOPMENT_SETUP.md" style="color: #2563eb;">View detailed setup guide →</a>
        </p>
      </div>
    `;
    throw new Error(clerkConfig.error);
  } else {
    // In production, throw a proper error
    throw new Error("Clerk configuration error: " + clerkConfig.error);
  }
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} afterSignOutUrl="/">
      <App />
    </ClerkProvider>
  </React.StrictMode>,
);
