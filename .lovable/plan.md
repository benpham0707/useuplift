

## Plan: Update Type Definitions to Match the Better Data Format

### Summary
The data files (brown.ts, etc.) use a **superior, more flexible, and more in-depth structure** that enables better teaching. The type definitions in `collegeResearch.ts` are outdated and restrictive. We will update the types to match the better data format.

### What Makes the Data Format Better

| Aspect | Old Type (Restrictive) | New Data (Better) |
|--------|------------------------|-------------------|
| Word count | `wordCount: { min, max }` | `wordLimit: number` (simpler) |
| Essay purpose | None | `whatItReveals: string[]` (teaching insight!) |
| Pattern classification | None | `essayPattern: string` (enables pattern-based teaching) |
| Required status | None | `requiredOrOptional` (important context) |
| Rubric format | Complex nested `RubricBand` objects | Cleaner `rubricCriteria[]` with weights |
| Prompt-specific flags | None | `promptSpecificRedFlags[]`, `promptSpecificGreenFlags[]` |
| Green flag strength | Only 3 values | 5 values including `'major'`, `'moderate'` |
| Evidence | No context field | Includes `context` for richer teaching |
| Socratic questions | Complex object required | Simple strings OR objects (flexible) |

### Files to Modify

#### 1. `src/services/commonAppWorkshop/types/collegeResearch.ts`

**CollegeEssayPrompt** - Make fields flexible to support both formats:
```typescript
export interface CollegeEssayPrompt {
  promptId: string;
  promptText: string;
  
  // Support BOTH word count formats
  wordCount?: { min: number; max: number };
  wordLimit?: number;  // ✅ ADD - simpler format
  
  // Make these optional (not all prompts need them)
  promptNumber?: number;
  promptTitle?: string;
  
  // ✅ ADD - Better teaching fields
  requiredOrOptional?: 'required' | 'optional' | string;
  essayPattern?: string;
  whatItReveals?: string[];
  
  // ✅ ADD - Better rubric format
  rubricCriteria?: Array<{
    criterion: string;
    weight: number;
    excellent: string;
    adequate: string;
    weak: string;
  }>;
  
  // ✅ ADD - Prompt-level flags
  promptSpecificRedFlags?: string[];
  promptSpecificGreenFlags?: string[];
  
  // Keep existing fields as optional
  primaryAssessment?: string;
  importance?: 'critical' | 'high' | 'medium';
  importanceContext?: string;
  rubric?: CollegeEssayRubric;
  dimensionalCriteria?: PromptDimensionalCriteria[];
}
```

**CollegeGreenFlag.strength** - Expand to include all values used in data:
```typescript
strength: 'exceptional' | 'strong' | 'positive' | 'major' | 'moderate';
```

**Evidence type** - Add context field:
```typescript
evidence: {
  source: string;
  quote: string;
  explanation: string;
  context?: string;  // ✅ ADD - optional context
};
```

**CollegeSocraticQuestion** - Allow both formats:
```typescript
// Allow simple strings OR full objects
export type CollegeSocraticQuestionItem = string | CollegeSocraticQuestion;

export interface CollegeSocraticQuestionBank {
  byPurpose?: { ... };  // Make optional
  byPrompt?: Record<string, CollegeSocraticQuestionItem[]>;
  byDimension?: Record<string, CollegeSocraticQuestionItem[]>;  // ✅ ADD
  byIssue?: Record<string, CollegeSocraticQuestionItem[]>;
}
```

#### 2. `src/components/RequireTermsAccepted.tsx`
- Use type assertions for `terms_accepted_at` since it exists in DB but not in auto-generated types
- This is a separate issue from the college research types

#### 3. `src/hooks/useAuth.tsx`
- Fix the `getToken` import to use the correct Clerk API

#### 4. `src/query/useProfileId.ts`
- Pass required token argument to `getAuthenticatedSupabaseClient()`

### What Will NOT Change
- **All college research content remains 100% intact**
- **All Dean Powell quotes, rubrics, and teaching material preserved**
- **All red flags, green flags, and Socratic questions preserved**
- **All specific Brown/Harvard/etc data files unchanged**

### Technical Approach

The changes are purely **additive** - we're making the types more flexible to accept what the data already provides:
- Making required fields optional
- Adding new optional fields
- Expanding union types to include more values
- Adding alternative type formats

This follows TypeScript best practices: types should describe what data CAN be, not enforce a single rigid format.

### Order of Implementation
1. Update `collegeResearch.ts` type definitions (fixes ~90% of errors)
2. Fix `RequireTermsAccepted.tsx` with type assertions
3. Fix `useAuth.tsx` with correct Clerk API usage
4. Fix `useProfileId.ts` with token parameter
5. Verify build succeeds
6. Spot-check that college data loads correctly

