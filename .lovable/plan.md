

## Fix Build Errors in `collegeResearch.ts`

All build errors come from `brown.ts` (and likely other college data files) using fields and values that `collegeResearch.ts` doesn't define. The fix is entirely in the types file -- we do NOT touch `brown.ts` or any data files.

### Changes to `src/services/commonAppWorkshop/types/collegeResearch.ts`

**1. `CollegeEssayPrompt` (lines 109-132)**
- Make `promptNumber`, `promptTitle`, `primaryAssessment`, `importance`, `importanceContext`, `rubric`, `dimensionalCriteria` all optional
- Make `wordCount` optional
- Add `wordLimit?: number`
- Add `essayPattern?: string`, `whatItReveals?: string[]`, `requiredOrOptional?: string`
- Add `rubricCriteria?: Array<{ criterion: string; weight: number; excellent: string; adequate: string; weak: string }>`
- Add `promptSpecificRedFlags?: string[]`, `promptSpecificGreenFlags?: string[]`
- Add index signature `[key: string]: unknown`

**2. `CollegeRedFlag.evidence` (line 216-220)**
- Change from single object to `evidence: { source: string; quote: string; explanation: string; context?: string } | { source: string; quote: string; explanation: string; context?: string }[]`
- This allows both single evidence and arrays with context

**3. `CollegeGreenFlag.strength` (line 249)**
- Widen from `'exceptional' | 'strong' | 'positive'` to `string`

**4. `CollegeGreenFlag.evidence` (lines 258-263)**
- Add `context?: string` to evidence, same as RedFlag

**5. `CollegeSocraticQuestionBank` (lines 286-301)**
- Change all `CollegeSocraticQuestion[]` to `(string | CollegeSocraticQuestion)[]`
- Make `byPurpose` optional
- Make `byPrompt` and `byIssue` use `(string | CollegeSocraticQuestion)[]` too

**6. Add index signatures**
- Add `[key: string]: unknown` to `CollegeRedFlag` and `CollegeGreenFlag` for forward compatibility

### No other files changed
- `brown.ts` and all college data files stay exactly as-is
- No `@ts-nocheck` needed for this fix

