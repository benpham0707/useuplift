# Circular Dependency Fix

## Problem
The production build was failing with `ReferenceError: Cannot access 'Se' before initialization` due to a circular dependency in the React Query implementation.

## Root Cause
The `usePIQEssay.ts` hook was importing `UC_PIQ_PROMPTS` from a component file (`PIQPromptSelector.tsx`), which created a circular dependency chain:
- `PIQWorkshop.tsx` → imports `usePIQEssay`
- `usePIQEssay.ts` → imports `UC_PIQ_PROMPTS` from component
- Component files → may import other hooks/utilities → circular reference

## Solution Applied

### 1. Simplified `usePIQEssay` Hook
**File:** `src/query/usePIQEssay.ts`

**Changes:**
- Removed import of `UC_PIQ_PROMPTS` from component file
- Removed `prefetchAdjacentPIQs` function (moved to parent)
- Hook now takes `promptText` as a parameter instead of looking it up
- Simplified to just handle the query, no prefetching logic

### 2. Updated `PIQCarouselNav` Component
**File:** `src/components/portfolio/piq/workshop/PIQCarouselNav.tsx`

**Changes:**
- Removed all React Query imports
- Added `onPrefetch` callback prop
- Component just calls the callback, parent handles prefetch logic

### 3. Updated `PIQWorkshop` Page
**File:** `src/pages/PIQWorkshop.tsx`

**Changes:**
- Passes `promptText` to `usePIQEssay` hook
- Implements prefetch logic inline in `onPrefetch` callback
- Has access to `UC_PIQ_PROMPTS`, `queryClient`, and all necessary imports

## Dependency Flow (Fixed)
```
PIQWorkshop.tsx
  ├─ imports UC_PIQ_PROMPTS (component)
  ├─ imports usePIQEssay (query hook)
  ├─ imports queryKeys (query utilities)
  └─ passes promptText to usePIQEssay

usePIQEssay.ts
  ├─ imports only React Query
  ├─ imports only loadPIQEssay (service)
  └─ NO component imports (breaks circular dependency)

PIQCarouselNav.tsx
  ├─ NO React Query imports
  └─ receives onPrefetch callback from parent
```

## Testing Steps

1. **Clear build cache:**
   ```bash
   rm -rf node_modules/.vite dist .vite
   ```

2. **Rebuild:**
   ```bash
   npm run build
   ```

3. **Test in production mode:**
   ```bash
   npm run preview
   ```

4. **Verify:**
   - Navigate to PIQ Workshop
   - No white screen
   - No "Cannot access 'Se'" errors in console
   - PIQ navigation works smoothly
   - Hover over next/prev buttons prefetches data

## Key Principle
**Never import component files from query hooks.** Query hooks should only import:
- React Query utilities
- Service/API functions
- Type definitions
- Other utility hooks (carefully)

Component files can import query hooks, but not vice versa.

