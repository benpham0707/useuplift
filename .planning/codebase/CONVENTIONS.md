# Coding Conventions

**Analysis Date:** 2026-02-23

## Naming Patterns

**Files:**
- Services: `{domain}Service.ts` (e.g., `creditsService.ts`, `autosaveService.ts`)
- Analyzers: `{feature}Analyzer.ts` (e.g., `voiceStyleAnalyzer.ts`, `nuancedCapabilityAnalyzer.ts`)
- Orchestrators: `{domain}Orchestrator.ts` (e.g., `essayOrchestrator.js`, `narrativeWorkshopOrchestrator.ts`)
- Components: PascalCase (e.g., `ExtracurricularCard.tsx`, `ApplicationReview.tsx`)
- Test files: `test-{feature}-{description}.ts` (e.g., `test-major-resolution-comprehensive.ts`)
- Type definition files: `types.ts` or `types.d.ts` (co-located with implementation)

**Functions:**
- camelCase for all functions (e.g., `getCredits`, `analyzeEssay`, `deductCredits`)
- Async functions include context in name (e.g., `generateInsightDrivenOpenerAsync`, `generateFollowUpAsync`)
- Boolean predicates: `has*`, `can*`, `is*` (e.g., `hasEnoughCredits`, `canAnalyzeEssay`, `isDevModeActive`)
- Service methods: verb-noun pattern (e.g., `deductForEssayAnalysis`, `saveAutosaveVersion`)

**Variables:**
- camelCase for all variables (e.g., `currentBalance`, `studentProfile`, `essayAnalysis`)
- UPPER_SNAKE_CASE for constants (e.g., `CREDIT_COSTS`, `MAX_CONVERSATION_TURNS`, `OUTPUT_FILE`)

**Types:**
- PascalCase for interfaces and types (e.g., `CreditBalance`, `StudentProfile`, `NuancedCapabilityAnalysis`)
- Suffix patterns: `*Result`, `*Response`, `*Context`, `*Analysis`, `*Data` (e.g., `CreditDeductionResult`, `StudentResponse`)

**Components:**
- PascalCase for React components (e.g., `ExtracurricularCard`, `RequireVerified`)
- Props interfaces: `{ComponentName}Props` (e.g., `ExtracurricularCardProps`)

## Code Style

**Formatting:**
- No explicit formatter config found (Prettier not detected)
- Indentation: 2 spaces (observed in all files)
- Max line length: Not enforced (some lines exceed 200 characters)
- Semicolons: Used consistently
- Trailing commas: Used in multi-line arrays/objects

**Linting:**
- ESLint with TypeScript support via `typescript-eslint`
- Config: `eslint.config.js` (flat config format)
- Key rules:
  - `@typescript-eslint/no-unused-vars`: OFF (explicitly disabled)
  - React Hooks rules enabled via `eslint-plugin-react-hooks`
  - `react-refresh/only-export-components`: WARN (with constant export allowed)

**TypeScript Settings:**
- **NOT in strict mode** - `strict: false` in tsconfig
- `noImplicitAny: false` - `any` types allowed without warning
- `strictNullChecks: false` - null/undefined checking disabled
- `noUnusedLocals: false` - unused variables allowed
- `noUnusedParameters: false` - unused parameters allowed
- Path aliases: `@/*` maps to `./src/*`

## Import Organization

**Order:**
1. External libraries (Node.js built-ins, npm packages)
2. Internal modules (absolute imports using `@/` alias)
3. Relative imports from same directory
4. Type imports (when using `import type`)

**Example from `test-academic-advisor-live-e2e.ts`:**
```typescript
// 1. External - Node.js built-in
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// 2. Internal - project modules
import {
  generateInsightDrivenOpenerAsync,
  generateFollowUpAsync,
  // ...
} from '../src/services/portfolioStrategy/services/academicWorkshop/capability/conversational/insightDrivenAdvisor';

import {
  analyzeCapabilityNuanced,
  type NuancedCapabilityAnalysis,
} from '../src/services/portfolioStrategy/services/academicWorkshop/capability/nuancedCapabilityAnalyzer';

// 3. Type imports
import type { CourseRecord } from '../src/services/portfolioStrategy/services/academicHistoryAnalyzer';
```

**Path Aliases:**
- `@/*` - maps to `src/*` directory
- Used extensively for cleaner imports: `import { supabase } from '@/integrations/supabase/client'`

**Barrel Exports:**
- Services use `index.ts` files for re-exports
- Pattern: export both class and singleton instance

```typescript
// src/services/credits/index.ts
export {
  // Constants
  CREDIT_COSTS,

  // Types
  type CreditTransactionType,
  type CreditBalance,

  // Functions
  getCredits,
  deductCredits,
} from './creditsService';
```

## Error Handling

**Patterns:**
- Try-catch blocks with explicit error logging
- Return error objects rather than throwing (for API-like functions)
- Fallback to safe defaults (e.g., `return 0` instead of throwing)

**Example from `creditsService.ts`:**
```typescript
export async function getCredits(userId: string, token?: string): Promise<number> {
  try {
    const client = token ? getAuthenticatedClient(token) : supabase;

    const { data, error } = await client
      .from('profiles')
      .select('credits')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      return 0; // Safe fallback instead of throwing
    }

    const credits = Number(data?.credits ?? 0);
    return Number.isFinite(credits) ? credits : 0;
  } catch (err) {
    return 0; // Catch-all fallback
  }
}
```

**Atomic Operations:**
- Credit deductions use read-then-update pattern to check balance first
- Window events dispatched for UI updates: `window.dispatchEvent(new CustomEvent('credits:updated'))`

**Retry Logic:**
- Tests implement exponential backoff with configurable retries
- Detect retryable errors (500, 502, 503, "overloaded", "Internal server error")

## Logging

**Framework:** Console-based (no structured logging library)

**Patterns:**
- Service prefixes: `console.log('[MyService] Operation...')`
- Errors logged with `console.error('[MyService] Failed:', error)`
- Development mode logging: `console.log('🔧 Development routes:', ...)`
- Emoji indicators: ✅ (success), ❌ (error), 🚀 (start), 📝 (step)

**Example from `routes.ts`:**
```typescript
console.log('🔧 Development routes:', isDevModeActive ? 'ENABLED' : 'DISABLED');
console.log('   NODE_ENV:', process.env.NODE_ENV);
console.log('   ALLOW_DEV_AUTH:', process.env.ALLOW_DEV_AUTH || 'not set');
```

## Comments

**When to Comment:**
- File-level docblocks explaining purpose
- Complex algorithms or business logic
- Security warnings and critical notes
- Type clarifications when TypeScript inference insufficient

**JSDoc/TSDoc:**
- Used for public API functions
- Documents parameters, return types, and purpose
- Example:

```typescript
/**
 * Deduct credits from user's balance and log the transaction
 * Uses atomic update to prevent race conditions
 *
 * @param userId - Clerk user ID
 * @param amount - Number of credits to deduct
 * @param type - Type of transaction
 * @param description - Description for the transaction log
 * @param token - Clerk JWT token (REQUIRED for authenticated update)
 */
export async function deductCredits(
  userId: string,
  amount: number,
  type: CreditTransactionType,
  description: string,
  token: string
): Promise<CreditDeductionResult> {
  // ...
}
```

**Section Headers:**
- Use comment blocks with `=====` separators for major sections:

```typescript
// ============================================================================
// CONSTANTS
// ============================================================================

export const CREDIT_COSTS = {
  ESSAY_ANALYSIS: 5,
  CHAT_MESSAGE: 1,
} as const;
```

## Function Design

**Size:** No strict limit enforced (functions range from 5 to 200+ lines)

**Parameters:**
- Optional parameters use `?` suffix
- Common pattern: `(required1, required2, optional?)` order
- Options objects for functions with many parameters

**Return Values:**
- Async functions return `Promise<T>`
- Result objects for operations that can fail:
  ```typescript
  interface CreditDeductionResult {
    success: boolean;
    newBalance: number;
    error?: string;
  }
  ```
- Direct values for safe operations (e.g., getters return `number` with fallback)

**Barrel Export Pattern:**
```typescript
// index.ts exports both implementation and types
export * from './types';
export { EssayOrchestrator } from './essayOrchestrator';
export { HolisticAnalyzer } from './holisticAnalyzer';
```

## Module Design

**Exports:**
- Named exports preferred over default exports
- Services export both class and instance:
  ```typescript
  export class CreditsService { /* ... */ }
  export const creditsService = new CreditsService();
  ```

**Barrel Files:**
- Used extensively: `index.ts` in every service directory
- Re-export types and implementations together
- Example from `src/services/orchestrator/index.ts`:
  ```typescript
  export * from './types';
  export { EssayOrchestrator } from './essayOrchestrator';
  export { HolisticAnalyzer } from './holisticAnalyzer';
  ```

## React/Component Conventions

**Component Structure:**
- Functional components with hooks
- Props interface defined above component
- State managed with `useState`

**Example:**
```typescript
interface ExtracurricularCardProps {
  activity: ExtracurricularItem;
  onViewAnalysis?: () => void;
}

export const ExtracurricularCard: React.FC<ExtracurricularCardProps> = ({
  activity,
  onViewAnalysis
}) => {
  const [expanded, setExpanded] = useState(false);
  // ...
};
```

**Import Pattern:**
```typescript
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
```

## Type Safety Approach

**Current State:**
- TypeScript NOT in strict mode
- `any` types allowed and used when needed
- Null checks not enforced
- Pragmatic over purist: flexibility prioritized over strict type safety

**Type Definitions:**
- Co-located with implementation (same directory)
- Both `types.ts` and `types.d.ts` files present (inconsistent)
- Interfaces preferred for object shapes
- Type aliases for unions and utility types

---

*Convention analysis: 2026-02-23*
