# Extracurricular Modal Integration Plan

## 🎯 Goal
Create an Extracurricular Modal with **Impressiveness** and **Narrative** tabs, exactly like the Recognition Modal, but adapted for extracurricular activities.

## 📊 Current Structure (Recognition)

```
RecognitionModal
├── Dialog wrapper
└── Tabs (2 tabs)
    ├── Tab 1: "Impressiveness"
    │   ├── Selectivity & Context card
    │   ├── Thematic Connection card
    │   ├── Causality & Impact card
    │   ├── Evidence & Specificity card
    │   └── Reflection & Growth card
    │
    └── Tab 2: "Narrative Fit"
        └── NarrativeFitWorkshop component
            ├── HeroSection
            ├── DraftEditor (textarea)
            ├── OverallScoreCard (big score display)
            └── RubricDimensionCards (expandable)
                └── IssueCards (with fix suggestions)
```

## 🎨 Target Structure (Extracurricular)

```
ExtracurricularModal
├── Dialog wrapper
└── Tabs (2 tabs)
    ├── Tab 1: "Impressiveness" [SIMPLER than Recognition]
    │   ├── Activity Overview card
    │   │   - Title, role, organization
    │   │   - Category badge (leadership, service, research, etc.)
    │   │   - Time commitment (hours/week, weeks/year)
    │   │   - Duration (start → end date)
    │   │
    │   ├── Impact Metrics card
    │   │   - People impacted
    │   │   - Funds raised
    │   │   - Projects completed
    │   │   - Leadership positions held
    │   │
    │   └── Context & Significance card
    │       - School-level vs. Regional vs. National scope
    │       - Selectivity (if applicable - like leadership positions)
    │       - Alignment with intended major
    │
    └── Tab 2: "Narrative" [MAIN FOCUS - our workshop]
        └── ExtracurricularWorkshop component ✅ BUILT
            ├── HeroSection (TODO)
            ├── DraftEditor (TODO)
            ├── OverallScoreCard (TODO)
            └── CategoryCards (TODO)
                └── IssueCards (TODO)
```

## ✅ What's Already Built

### Backend (100%)
- ✅ Analysis engine (`src/core/analysis/engine.ts`)
- ✅ Coaching system (`src/core/analysis/coaching/`)
- ✅ Issue detector with 6 issue types
- ✅ Structured output matching UI needs

### Frontend Workshop (30%)
- ✅ Types (`workshop/types.ts`)
- ✅ API service (`services/extracurricularAnalysis.ts`)
- ✅ Main workshop component (`workshop/ExtracurricularWorkshop.tsx`)
- ❌ 6 UI subcomponents (need to be built)

## 🚧 What Needs to be Built

### 1. Update Extracurricular Modal (HIGH PRIORITY)

File: `/src/components/portfolio/extracurricular/ExtracurricularModal.tsx`

**Current state**: Probably exists but needs tabs added

**Changes needed**:
```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExtracurricularWorkshop } from './workshop/ExtracurricularWorkshop';

// Inside modal:
<Tabs defaultValue="impressiveness">
  <TabsList>
    <TabsTrigger value="impressiveness">Impressiveness</TabsTrigger>
    <TabsTrigger value="narrative">Narrative</TabsTrigger>
  </TabsList>

  <TabsContent value="impressiveness">
    {/* Simpler than Recognition - just show basics */}
    <ActivityOverview entry={extracurricular} />
    <ImpactMetrics entry={extracurricular} />
    <ContextSignificance entry={extracurricular} />
  </TabsContent>

  <TabsContent value="narrative">
    <ExtracurricularWorkshop
      entry={extracurricular}
      onClose={() => setOpen(false)}
      onSave={handleSave}
    />
  </TabsContent>
</Tabs>
```

### 2. Create 6 Workshop UI Components

These are referenced in `ExtracurricularWorkshop.tsx` but don't exist yet:

#### A. HeroSection.tsx
```tsx
export const HeroSection: React.FC<{
  title: string;
  activity_category: string;
  onClose: () => void;
}> = ({ title, activity_category, onClose }) => {
  return (
    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <Badge className="mt-2">{activity_category}</Badge>
        </div>
        <Button variant="ghost" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};
```

#### B. DraftEditor.tsx
```tsx
export const DraftEditor: React.FC<{
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
}> = (props) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <h2>Your Draft</h2>
          <div className="flex gap-2">
            <Button disabled={!props.canUndo} onClick={props.onUndo}>
              <Undo className="h-4 w-4" />
            </Button>
            <Button disabled={!props.canRedo} onClick={props.onRedo}>
              <Redo className="h-4 w-4" />
            </Button>
            <Button onClick={props.onManualSave} disabled={!props.isDirty}>
              Save
            </Button>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {props.wordCount} words (target: {props.targetWordCount[0]}-{props.targetWordCount[1]})
          {props.autosaved && <span className="ml-2">✓ Autosaved</span>}
          {props.isAnalyzing && <span className="ml-2">🔄 Analyzing...</span>}
        </div>
      </CardHeader>
      <CardContent>
        <Textarea
          value={props.draft}
          onChange={(e) => props.onChange(e.target.value)}
          rows={8}
          placeholder="Describe your activity..."
        />
      </CardContent>
    </Card>
  );
};
```

#### C. OverallScoreCard.tsx
```tsx
export const OverallScoreCard: React.FC<{
  score: number;  // 0-100
  tier: 'excellent' | 'strong' | 'good' | 'needs_work' | 'weak';
  totalIssues: number;
  issuesResolved: number;
  quickSummary: string;
}> = ({ score, tier, totalIssues, issuesResolved, quickSummary }) => {
  const tierColors = {
    excellent: 'text-green-600',
    strong: 'text-blue-600',
    good: 'text-yellow-600',
    needs_work: 'text-orange-600',
    weak: 'text-red-600',
  };

  return (
    <Card className="border-l-4" style={{ borderLeftColor: tierColors[tier] }}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm text-muted-foreground">OVERALL NARRATIVE QUALITY</h3>
            <div className={`text-6xl font-bold ${tierColors[tier]}`}>
              {(score / 10).toFixed(1)} <span className="text-2xl">/10</span>
            </div>
            <div className="text-sm mt-2">
              Issues Resolved: {issuesResolved}/{totalIssues}
            </div>
          </div>
          <div>
            <Badge className={tierColors[tier]}>{tier.replace('_', ' ')}</Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-4">{quickSummary}</p>
        {totalIssues > issuesResolved && (
          <Button variant="link" className="mt-2 p-0">
            Address {totalIssues - issuesResolved} more issues to improve your score →
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
```

#### D. CategoryCard.tsx
```tsx
export const CategoryCard: React.FC<{
  category: CategoryIssues;
  expanded: boolean;
  onToggle: () => void;
  onToggleIssue: (issueId: string) => void;
  onApplyFix: (issueId: string, fixText: string) => void;
  onNextSuggestion: (issueId: string) => void;
  onPrevSuggestion: (issueId: string) => void;
}> = ({ category, expanded, onToggle, ...issueHandlers }) => {
  const scoreColor = category.score >= 7.5 ? 'text-green-600' :
                     category.score >= 5 ? 'text-yellow-600' : 'text-red-600';

  return (
    <Card>
      <CardHeader onClick={onToggle} className="cursor-pointer hover:bg-muted/50">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold">{category.category_name}</h3>
            <p className="text-sm text-muted-foreground">{category.diagnosis}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`text-2xl font-bold ${scoreColor}`}>
              {category.score.toFixed(1)}/10
            </div>
            <Badge variant="outline">{category.issues_count} issue(s)</Badge>
            <ChevronDown className={expanded ? 'rotate-180' : ''} />
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-4">
          {category.detected_issues.map(issue => (
            <IssueCard
              key={issue.id}
              issue={issue}
              onToggle={() => issueHandlers.onToggleIssue(issue.id)}
              onApplyFix={(fixText) => issueHandlers.onApplyFix(issue.id, fixText)}
              onNextSuggestion={() => issueHandlers.onNextSuggestion(issue.id)}
              onPrevSuggestion={() => issueHandlers.onPrevSuggestion(issue.id)}
            />
          ))}
        </CardContent>
      )}
    </Card>
  );
};
```

#### E. IssueCard.tsx (Most Complex)
```tsx
export const IssueCard: React.FC<{
  issue: DetectedIssue;
  onToggle: () => void;
  onApplyFix: (fixText: string) => void;
  onNextSuggestion: () => void;
  onPrevSuggestion: () => void;
}> = ({ issue, onToggle, onApplyFix, onNextSuggestion, onPrevSuggestion }) => {
  const currentFix = issue.suggested_fixes[issue.currentSuggestionIndex];
  const severityIcon = issue.severity === 'critical' ? '🔴' :
                       issue.severity === 'important' ? '🟠' : '🔵';

  return (
    <Card className={issue.status === 'fixed' ? 'opacity-60' : ''}>
      <CardHeader onClick={onToggle} className="cursor-pointer">
        <div className="flex justify-between">
          <div className="flex items-center gap-2">
            <span>{severityIcon}</span>
            <h4 className="font-medium">{issue.title}</h4>
          </div>
          <ChevronDown className={issue.expanded ? 'rotate-180' : ''} />
        </div>
      </CardHeader>

      {issue.expanded && (
        <CardContent className="space-y-4">
          {/* From Your Draft */}
          <div>
            <h5 className="text-sm font-medium mb-1">From Your Draft</h5>
            <blockquote className="border-l-4 border-muted pl-3 italic text-sm">
              "{issue.from_draft}"
            </blockquote>
          </div>

          {/* The Problem */}
          <div>
            <h5 className="text-sm font-medium text-red-600 mb-1">The Problem</h5>
            <p className="text-sm">{issue.problem}</p>
          </div>

          {/* Why It Matters */}
          <div>
            <h5 className="text-sm font-medium text-blue-600 mb-1">Why It Matters</h5>
            <p className="text-sm">{issue.why_matters}</p>
          </div>

          {/* Suggested Fix (Carousel) */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h5 className="text-sm font-medium text-green-600">Suggested Fix</h5>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={onPrevSuggestion}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground">
                  {issue.currentSuggestionIndex + 1} of {issue.suggested_fixes.length}
                </span>
                <Button size="sm" variant="ghost" onClick={onNextSuggestion}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium">{currentFix.fix_text}</p>

              <div>
                <h6 className="text-xs font-medium text-muted-foreground">Why This Works</h6>
                <p className="text-xs">{currentFix.why_this_works}</p>
              </div>

              {currentFix.teaching_example && (
                <div>
                  <h6 className="text-xs font-medium text-muted-foreground">Example</h6>
                  <p className="text-xs italic">{currentFix.teaching_example}</p>
                </div>
              )}

              <Button
                onClick={() => onApplyFix(currentFix.fix_text)}
                className="w-full mt-2"
                size="sm"
              >
                ✨ Apply This Edit
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
```

#### F. WorkshopComplete.tsx
```tsx
export const WorkshopComplete: React.FC<{
  initialScore: number;
  finalScore: number;
  issuesFixed: number;
  onContinueEditing: () => void;
  onSaveAndClose: () => void;
}> = ({ initialScore, finalScore, issuesFixed, onContinueEditing, onSaveAndClose }) => {
  const improvement = finalScore - initialScore;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <Card className="max-w-2xl text-center p-12">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-4xl font-bold mb-4">Workshop Complete!</h1>
        <p className="text-lg text-muted-foreground mb-8">
          You've addressed all {issuesFixed} issues.
        </p>

        <div className="flex justify-center gap-8 mb-8">
          <div>
            <div className="text-3xl font-bold text-red-600">{initialScore}/100</div>
            <div className="text-sm text-muted-foreground">Initial</div>
          </div>
          <div className="text-3xl">→</div>
          <div>
            <div className="text-3xl font-bold text-green-600">{finalScore}/100</div>
            <div className="text-sm text-muted-foreground">Final</div>
          </div>
        </div>

        {improvement > 0 && (
          <Badge className="text-lg py-2 px-4 mb-8">
            +{improvement.toFixed(1)} points improvement!
          </Badge>
        )}

        <div className="flex gap-4 justify-center">
          <Button variant="outline" onClick={onContinueEditing}>
            Continue Editing
          </Button>
          <Button onClick={onSaveAndClose}>
            Save & Close
          </Button>
        </div>
      </Card>
    </div>
  );
};
```

### 3. Simple Impressiveness Tab Components

Create 3 simple components for the Impressiveness tab:

**ActivityOverview.tsx**: Show basic info (title, role, category, time commitment)
**ImpactMetrics.tsx**: Show quantitative metrics if available
**ContextSignificance.tsx**: Show scope and alignment

These are much simpler than Recognition because extracurriculars don't have complex selectivity/prestige scoring.

## 🎯 Implementation Priority

1. **HIGH**: Create the 6 workshop UI components (copy from Recognition components and adapt)
2. **HIGH**: Update ExtracurricularModal to add tabs
3. **MEDIUM**: Create 3 simple Impressiveness tab components
4. **LOW**: Polish and error handling

## 📝 Next Immediate Steps

1. Copy `RecognitionModal.tsx` structure to `ExtracurricularModal.tsx`
2. Create `workshop/` folder for the 6 components
3. Copy and adapt Recognition's `HeroSection`, `DraftEditor`, etc.
4. Wire up API calls
5. Test end-to-end

---

**Status**: Backend 100% complete. Frontend 30% complete. Need to build 9 UI components total (6 workshop + 3 impressiveness).
