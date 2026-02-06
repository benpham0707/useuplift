

## Plan: Clear White Screen by Fixing Build Errors

### Goal
Fix all build errors so the app renders instead of showing a white screen. This is the minimum needed to unblock UI/UX work.

### Strategy
Fix 4 files. No `@ts-nocheck` needed -- we'll properly update the types.

---

### 1. Fix `src/services/commonAppWorkshop/types/collegeResearch.ts`

Three targeted changes to the type definitions:

**a) `CollegeEssayPrompt` (lines 109-132)** -- Make rigid fields optional and add new ones:
- `promptNumber`, `promptTitle`, `primaryAssessment`, `importance`, `importanceContext`, `rubric`, `dimensionalCriteria` become optional
- `wordCount` becomes optional
- Add `wordLimit?: number`
- Add `essayPattern?: string`, `whatItReveals?: string[]`, `requiredOrOptional?: string`
- Add `rubricCriteria?: Array<{...}>`, `promptSpecificRedFlags?: string[]`, `promptSpecificGreenFlags?: string[]`
- Add index signature `[key: string]: unknown`

**b) `CollegeGreenFlag.strength` (line 249)** -- Expand from `'exceptional' | 'strong' | 'positive'` to also include `'major' | 'moderate'`

**c) `CollegeRedFlag.evidence` and `CollegeGreenFlag.evidence` (lines 216-220, 258-263)** -- Add `context?: string` to evidence objects

**d) `CollegeSocraticQuestionBank` (lines 286-301)** -- Change all `CollegeSocraticQuestion[]` to `(string | CollegeSocraticQuestion)[]` to allow simple strings. Make `byPurpose` optional.

**e) `CollegeCoreValue.evidence` (lines 86-90)** -- Already has `context`, so no change needed.

### 2. Fix `src/hooks/useAuth.tsx` (line 44)

Replace the broken dynamic import `const { getToken } = await import('@clerk/clerk-react')` with using `useAuth` from Clerk:
- Import `useAuth as useClerkAuth` from `@clerk/clerk-react` at top
- Call `const { getToken } = useClerkAuth()` inside the component
- Use `getToken({ template: 'supabase' })` in the effect

### 3. Fix `src/query/useProfileId.ts` (line 14)

The hook calls `getAuthenticatedSupabaseClient()` with no arguments but it requires a token. Fix by:
- Import `useAuth` from `@clerk/clerk-react`
- Get the token and pass it to `getAuthenticatedSupabaseClient(token)`
- Use Clerk's `user.id` instead of `supabase.auth.getUser()`

### 4. Fix `src/components/RequireTermsAccepted.tsx` (lines 80, 92, 114)

Add type assertions (`as any`) on the 3 Supabase calls that reference `terms_accepted_at` since it exists in the DB but not in the auto-generated types:
- `.update({ terms_accepted_at: now } as any)` 
- `.select('terms_accepted_at' as any)`
- Access via `(updateData as any)?.terms_accepted_at`

### What This Fixes
- All `brown.ts` errors (wordLimit, context, strength, socratic strings) -- fixed by updated types
- All other college data files with similar patterns -- same type fixes apply
- Auth errors in useAuth, useProfileId, RequireTermsAccepted
- White screen caused by build failure

### Files NOT Changed
- No college data files modified (brown.ts, stanford.ts, etc. stay exactly as-is)
- No UI components changed
- No routing changes

