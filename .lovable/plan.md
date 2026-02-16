

## Fix: Prevent Blank Screen When Clerk Fails to Load

### Root Cause

The Clerk JS SDK is hosted on your custom domain `clerk.uplift-app.com`. In the Lovable preview environment, network requests to this domain are blocked (`ERR_TUNNEL_CONNECTION_FAILED`). When Clerk fails to load, it throws an unhandled promise rejection that crashes the entire React app, resulting in a blank white screen.

This affects ALL authenticated routes (Portfolio Scanner, PIQ Workshop, Settings, etc.), not just one page.

### Fix

**1. Add global unhandled rejection handler** in `src/App.tsx`

Catch the Clerk loading failure so it doesn't crash the React tree. Add a `useEffect` with a `window.addEventListener('unhandledrejection', ...)` that specifically catches Clerk's `failed_to_load_clerk_js` error code and suppresses the crash.

**2. Add an error boundary around ClerkProvider** in `src/App.tsx`

Wrap `ClerkProvider` in an error boundary component so that if Clerk fails to initialize, the app shows a friendly "Authentication unavailable" message instead of a blank screen. Users would see a retry button or a message explaining the situation.

**3. Create `src/components/ClerkErrorBoundary.tsx`** (new file)

A React error boundary that:
- Catches errors thrown by Clerk during initialization
- Renders a user-friendly fallback UI with a "Retry" button
- Logs the error for debugging

### Files to Change

| File | Action |
|------|--------|
| `src/components/ClerkErrorBoundary.tsx` | Create -- error boundary for Clerk failures |
| `src/App.tsx` | Modify -- wrap ClerkProvider with error boundary, add unhandled rejection handler |

### Important Note

This is a **network environment issue** in the Lovable preview. Your production app at `uplift-final-final-18698-62030.lovable.app` likely works fine since it can reach `clerk.uplift-app.com`. The fix ensures the app degrades gracefully instead of showing a blank screen when Clerk is unreachable.

