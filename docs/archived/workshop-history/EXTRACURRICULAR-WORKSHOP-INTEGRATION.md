# Extracurricular Workshop Integration Guide

## 🎯 Overview

We've built a comprehensive AI-powered coaching system for improving extracurricular narratives, modeled after the Recognition Narrative Fit Workshop. The system provides real-time feedback, issue detection, and guided improvements.

## ✅ What's Complete

### Backend (100% Complete)

1. **Analysis Engine** (`src/core/analysis/engine.ts`)
   - Feature extraction
   - Authenticity detection
   - 11-category rubric scoring
   - Adaptive weights by activity type
   - Quiet Excellence bonus
   - NQI calculation (0-100 scale)

2. **Coaching System** (`src/core/analysis/coaching/`)
   - **Issue Detector** (`issueDetector.ts`): Identifies specific, actionable issues
     - Voice & authenticity issues (essay-speak, passive voice, SAT words)
     - Specificity issues (missing numbers, no before/after)
     - Reflection issues (generic lessons, no growth)
     - Narrative issues (missing stakes, no turning point)
     - Initiative issues (unclear role, passive language)
   - **Coaching Index** (`index.ts`): Generates structured output for UI
     - Overall score and tier
     - Category-organized issues
     - Top 3 priorities
     - Issue counts

3. **Output Structure**
   ```typescript
   {
     overall: {
       narrative_quality_index: 28,
       score_tier: 'weak' | 'needs_work' | 'good' | 'strong' | 'excellent',
       total_issues: 6,
       issues_resolved: 0,
       quick_summary: "Major improvements needed..."
     },
     categories: [{
       category_name: "Specificity & Evidence",
       score: 2.0,
       diagnosis: "Critical: No clear specificity...",
       issues_count: 2,
       detected_issues: [{
         id: "unique-id",
         title: "Missing Concrete Numbers",
         from_draft: "I frequently worked...",
         problem: "Vague words leave readers guessing...",
         why_matters: "Specific numbers build credibility...",
         suggested_fixes: [{
           fix_text: "Replace 'many' with exact numbers...",
           why_this_works: "Exact numbers are credible...",
           teaching_example: "Weak: 'frequently.' Strong: 'Every Tuesday, 6-9pm'",
           apply_type: "replace" | "add" | "reframe" | "elicit"
         }]
       }]
     }],
     top_priorities: [...]
   }
   ```

### Frontend (70% Complete)

1. **Types** (`src/components/portfolio/extracurricular/workshop/types.ts`) ✅
   - DraftVersion interface
   - DetectedIssue interface
   - CategoryIssues interface
   - CoachingOutput interface
   - AnalysisResponse interface
   - WorkshopState interface

2. **API Service** (`src/services/extracurricularAnalysis.ts`) ✅
   - `analyzeExtracurricularEntry()`: Main API function
   - `analyzeExtracurricularDirect()`: Dev mode (direct TS import)
   - Environment-aware switching

3. **Main Workshop Component** (`ExtracurricularWorkshop.tsx`) ✅
   - Draft management with undo/redo
   - Autosave every 30 seconds
   - Real-time analysis (800ms debounce)
   - Issue state management
   - Fix application logic
   - Save & close workflow

## 🚧 What Needs to be Built

### UI Components (Need Implementation)

The following components are imported but need to be created:

1. **HeroSection.tsx**
   ```tsx
   interface HeroSectionProps {
     title: string;
     activity_category: string;
     onClose: () => void;
   }
   ```
   - Header with activity title
   - Category badge (leadership, service, research, etc.)
   - Close button

2. **DraftEditor.tsx**
   ```tsx
   interface DraftEditorProps {
     draft: string;
     onChange: (draft: string) => void;
     onManualSave: () => void;
     onUndo: () => void;
     onRedo: () => void;
     wordCount: number;
     targetWordCount: [number, number];
     canUndo: boolean;
     canRedo: boolean;
     isDirty: boolean;
     autosaved: boolean;
     isAnalyzing: boolean;
   }
   ```
   - Textarea for editing description
   - Word count display with target range (90-170 words)
   - Undo/redo buttons
   - Save button with dirty state indicator
   - "Autosaved" indicator
   - "Analyzing..." spinner

3. **OverallScoreCard.tsx**
   ```tsx
   interface OverallScoreCardProps {
     score: number;  // 0-100
     tier: 'excellent' | 'strong' | 'good' | 'needs_work' | 'weak';
     totalIssues: number;
     issuesResolved: number;
     quickSummary: string;
   }
   ```
   - Big score display (e.g., "2.0/10" from UI mockup)
   - Tier badge with color coding
   - Issues resolved counter (e.g., "0/6")
   - Quick summary text
   - "Address 6 more issues to improve your score →" link

4. **CategoryCard.tsx**
   ```tsx
   interface CategoryCardProps {
     category: CategoryIssues;
     expanded: boolean;
     onToggle: () => void;
     onToggleIssue: (issueId: string) => void;
     onApplyFix: (issueId: string, fixText: string) => void;
     onNextSuggestion: (issueId: string) => void;
     onPrevSuggestion: (issueId: string) => void;
   }
   ```
   - Expandable card for each rubric category
   - Category name + score (e.g., "Selectivity & Context 0.0/10")
   - Diagnosis text (collapsed view)
   - Issue count (e.g., "1 issue to address")
   - Expand/collapse toggle
   - When expanded: shows IssueCard components

5. **IssueCard.tsx**
   ```tsx
   interface IssueCardProps {
     issue: DetectedIssue;
     onToggle: () => void;
     onApplyFix: (fixText: string) => void;
     onNextSuggestion: () => void;
     onPrevSuggestion: () => void;
   }
   ```
   - Issue title with severity icon (⚠️  critical/important/helpful)
   - "From Your Draft" section (quoted text)
   - "The Problem" explanation
   - "Why It Matters" context
   - "Suggested Fix" carousel (1 of 3)
     - Fix text
     - "Why This Works" explanation
     - Teaching example (if present)
     - Prev/Next buttons for carousel
   - "Apply This Edit" button

6. **WorkshopComplete.tsx**
   ```tsx
   interface WorkshopCompleteProps {
     initialScore: number;
     finalScore: number;
     issuesFixed: number;
     onContinueEditing: () => void;
     onSaveAndClose: () => void;
   }
   ```
   - Celebration screen when all issues resolved
   - Score improvement display
   - "Continue Editing" and "Save & Close" buttons

## 🔌 Integration Points

### 1. Extracurricular Modal

Update `ExtracurricularModal.tsx` to add "Workshop" tab:

```tsx
// Add to tab options
const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'workshop', label: 'Narrative Workshop' },  // NEW
  { id: 'context', label: 'Context' },
  // ...
];

// Render workshop when tab is active
{activeTab === 'workshop' && (
  <ExtracurricularWorkshop
    entry={extracurricular}
    onClose={onClose}
    onSave={handleSave}
  />
)}
```

### 2. Extracurricular Card

Add "Improve Narrative" button to card:

```tsx
<button
  onClick={() => openWorkshop(extracurricular.id)}
  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
>
  Improve Narrative →
</button>
```

### 3. Backend API Endpoint (Production)

When deploying, create API route at `/api/analyze/extracurricular`:

```typescript
// pages/api/analyze/extracurricular.ts
import { analyzeEntry } from '@/core/analysis/engine';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { entry, options } = req.body;

  try {
    const result = await analyzeEntry(entry, options);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
```

## 📋 Implementation Checklist

- [x] Backend analysis engine
- [x] Backend coaching system
- [x] Frontend types
- [x] API service
- [x] Main workshop component
- [ ] HeroSection component
- [ ] DraftEditor component
- [ ] OverallScoreCard component
- [ ] CategoryCard component
- [ ] IssueCard component
- [ ] WorkshopComplete component
- [ ] Wire up in ExtracurricularModal
- [ ] Add workshop button to ExtracurricularCard
- [ ] Create API endpoint (production)
- [ ] Test full flow end-to-end

## 🎨 Design Notes

- **Color Coding by Tier**:
  - Excellent (80+): Green
  - Strong (70-79): Blue
  - Good (60-69): Yellow
  - Needs Work (45-59): Orange
  - Weak (<45): Red

- **Issue Severity Icons**:
  - Critical: Red ⚠️
  - Important: Orange ⚠️
  - Helpful: Blue ℹ️

- **Word Count Target**: 90-170 words (Common App extracurricular description limit)

## 🚀 Next Steps

1. **Create the 6 UI components** listed above
2. **Wire up workshop in modal** - Add "Workshop" tab
3. **Test with real data** - Use actual extracurricular entries
4. **Polish UX** - Loading states, error handling, transitions
5. **Deploy API endpoint** - Create production API route

## 💡 Key Features

### For Students
- ✅ Real-time feedback as they type
- ✅ Specific, actionable suggestions
- ✅ Multiple fix options per issue
- ✅ Teaching examples in different contexts
- ✅ Progress tracking (issues resolved)
- ✅ Undo/redo support
- ✅ Autosave every 30 seconds

### For Developers
- ✅ Type-safe throughout
- ✅ Modular component structure
- ✅ Environment-aware API calls (dev vs. prod)
- ✅ Performance optimized (debounced analysis)
- ✅ Easy to extend with new issue types
- ✅ Matches existing Recognition workshop UX

---

**Status**: Backend complete, frontend 70% complete. Ready for UI component implementation!
