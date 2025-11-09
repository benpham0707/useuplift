# Careful Integration Plan: Replace Simple Narrative Workshop with AI-Powered System

## 🔍 Current State Analysis

### ExtracurricularModal.tsx (Lines 1-313)

**Structure**:
```tsx
<Dialog>
  <Tabs defaultValue="contribution">
    <Tab 1: "Contribution"> ✅ KEEP AS-IS
      - Portfolio contribution score
      - Commitment metrics (hours, duration)
      - Impact metrics
      - Breakdown accordion (4 scores)
    </Tab>

    <Tab 2: "Narrative Workshop"> ⚠️ REPLACE
      - Simple textarea (lines 242-267)
      - Basic rubric with 5 items (lines 57-119)
      - "Apply tip" buttons
      - Word count and simple score
    </Tab>
  </Tabs>
</Dialog>
```

**Current Narrative Tab Features** (lines 242-297):
1. **Draft textarea** - stores in React state
2. **Simple rubric** - `computeNarrativeRubric()` function with 5 hardcoded rules
3. **Weighted score** - basic calculation, no AI
4. **Suggestions** - static tips per rubric item
5. **"Apply tip" buttons** - append text to draft

**What's Missing**:
- No AI analysis
- No real-time issue detection
- No sophisticated coaching
- No undo/redo
- No autosave
- No draft versions

## ✅ What We'll Preserve

1. **Dialog structure** - Keep existing Dialog wrapper
2. **Tabs structure** - Keep 2-tab layout
3. **Contribution tab** - Don't touch it at all (lines 146-240)
4. **Tab styling** - Keep current TabsList/TabsTrigger styling
5. **Modal props** - Keep ExtracurricularModalProps interface

## 🔄 What We'll Replace

**Replace lines 242-297** (current Narrative tab content) with our ExtracurricularWorkshop component.

### Before (Current):
```tsx
<TabsContent value="narrative">
  <div className="grid grid-cols-1 lg:grid-cols-3">
    <Card> {/* Draft textarea */} </Card>
    <div> {/* Simple rubric cards */} </div>
  </div>
</TabsContent>
```

### After (New):
```tsx
<TabsContent value="narrative" className="mt-0 p-0">
  <ExtracurricularWorkshop
    entry={convertToExperienceEntry(activity)}
    onClose={() => onOpenChange(false)}
    onSave={handleSave}
  />
</TabsContent>
```

## 🛠️ Implementation Steps (Extremely Careful)

### Step 1: Create Helper Function to Convert ActivityItem → ExperienceEntry

```tsx
// Add to ExtracurricularModal.tsx
function convertToExperienceEntry(activity: ExtracurricularItem): ExperienceEntry {
  return {
    id: activity.id,
    user_id: activity.userId || 'unknown',
    title: activity.name,
    organization: activity.organization || '',
    role: activity.role || '',
    category: activity.category, // Should match 'leadership' | 'service' | etc.
    description_original: activity.applicationGuidance?.whyItMatters || '',
    hours_per_week: activity.scores.commitment.hoursPerWeek,
    weeks_per_year: activity.scores.commitment.weeksPerYear,
    start_date: activity.dateRange?.start || '',
    end_date: activity.dateRange?.end || 'Present',
    time_span: `${activity.dateRange?.start || ''} - ${activity.dateRange?.end || 'Present'}`,
    version: 1,
  };
}
```

### Step 2: Add Save Handler

```tsx
// Add to ExtracurricularModal component
const handleSave = (updatedEntry: ExperienceEntry) => {
  // Update activity with new description
  // This would typically update in your data store/database
  console.log('Saving updated description:', updatedEntry.description_original);

  // For now, we can update local state if needed
  // In production, this would call an API to persist changes
};
```

### Step 3: Import ExtracurricularWorkshop

```tsx
// Add to imports at top
import { ExtracurricularWorkshop } from './workshop/ExtracurricularWorkshop';
import { ExperienceEntry } from '@/core/types/experience';
```

### Step 4: Replace Narrative Tab Content

**DELETE lines 242-297** and replace with:

```tsx
<TabsContent value="narrative" className="mt-0 p-0 h-full">
  <div className="h-[80vh] overflow-hidden">
    <ExtracurricularWorkshop
      entry={convertToExperienceEntry(activity)}
      onClose={() => onOpenChange(false)}
      onSave={handleSave}
    />
  </div>
</TabsContent>
```

### Step 5: Remove Old Rubric Code

**DELETE lines 48-122** (old rubric computation functions) since we won't need them:
- `computeNarrativeRubric` function
- `RubricItem` type
- All related helper code

**DELETE line 32** (draft state) since workshop manages its own draft:
```tsx
const [draft, setDraft] = React.useState<string>(''); // DELETE THIS
```

**DELETE lines 34-39** (draft useEffect) since workshop handles initialization:
```tsx
React.useEffect(() => {
  if (!activity) return;
  const seed = activity.applicationGuidance?.whyItMatters || '';
  setDraft(seed);
}, [activity]); // DELETE THIS ENTIRE EFFECT
```

### Step 6: Clean Up Imports

Remove unused imports after deletion:
```tsx
// REMOVE these if not used elsewhere:
import { Textarea } from '@/components/ui/textarea'; // Only used in old narrative tab
import { CheckCircle2 } from 'lucide-react'; // Only used in old narrative tab
```

Keep these (still used in Contribution tab):
```tsx
import { Gauge, Layers, Target, Info } from 'lucide-react'; // ✅ Keep
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'; // ✅ Keep
```

## 🧪 Testing Checklist

After making changes, verify:

### Contribution Tab (Must Still Work)
- [ ] Tab can be selected
- [ ] Portfolio contribution score displays correctly
- [ ] Commitment card shows hours/week and weeks/year
- [ ] Impact card shows score and metrics
- [ ] Breakdown accordion expands/collapses
- [ ] All 4 breakdown scores display

### Narrative Tab (New Workshop)
- [ ] Tab can be selected
- [ ] Workshop loads without errors
- [ ] Initial draft populated from activity data
- [ ] Analysis runs (check console for API calls)
- [ ] Draft editor appears with textarea
- [ ] Score card displays
- [ ] Category cards appear
- [ ] Can edit draft text
- [ ] Save & Close button works

### Modal Behavior
- [ ] Modal opens when clicking activity
- [ ] Close button (X) works
- [ ] Clicking outside closes modal
- [ ] No console errors

## 🚨 Risk Mitigation

**Backup First**:
```bash
cp src/components/portfolio/extracurricular/ExtracurricularModal.tsx \
   src/components/portfolio/extracurricular/ExtracurricularModal.tsx.backup
```

**Incremental Approach**:
1. Make changes in a new branch
2. Test each step individually
3. Commit after each successful test
4. Roll back if anything breaks

**Rollback Plan**:
If workshop doesn't work, we can temporarily keep both:
```tsx
<Tabs defaultValue="contribution">
  <TabsList className="grid grid-cols-3">
    <TabsTrigger value="contribution">Contribution</TabsTrigger>
    <TabsTrigger value="narrative-simple">Narrative (Simple)</TabsTrigger>
    <TabsTrigger value="narrative-ai">Narrative (AI Beta)</TabsTrigger>
  </TabsList>

  <TabsContent value="contribution">{/* Keep existing */}</TabsContent>
  <TabsContent value="narrative-simple">{/* Keep old workshop */}</TabsContent>
  <TabsContent value="narrative-ai"><ExtracurricularWorkshop /></TabsContent>
</Tabs>
```

## 📝 Code Changes Summary

| Line Range | Action | Reason |
|------------|--------|--------|
| 1-7 | ✅ Keep | Dialog imports needed |
| 8 | ✅ Keep | Tabs import needed |
| 9-15 | ⚠️ Review | Remove Textarea, CheckCircle2 if unused |
| 16 | ✅ Keep | ExtracurricularItem type |
| **ADD** | ➕ Add | `import { ExtracurricularWorkshop } from './workshop/ExtracurricularWorkshop'` |
| **ADD** | ➕ Add | `import { ExperienceEntry } from '@/core/types/experience'` |
| 18-29 | ✅ Keep | Props and getScoreColor helper |
| 31-39 | ❌ Delete | Old draft state and effect |
| 41-46 | ✅ Keep | Activity null check and score extraction |
| 48-122 | ❌ Delete | Old rubric computation |
| **ADD** | ➕ Add | `convertToExperienceEntry` helper function |
| **ADD** | ➕ Add | `handleSave` function |
| 124-144 | ✅ Keep | Dialog and Tabs structure |
| 146-240 | ✅ Keep | Contribution tab (UNTOUCHED) |
| 242-297 | ❌ Replace | Old narrative tab → ExtracurricularWorkshop |
| 298-313 | ✅ Keep | Closing tags |

## 🎯 Final Verification

Before committing, answer:
1. ✅ Does Contribution tab still work perfectly?
2. ✅ Does new Narrative tab load without errors?
3. ✅ Can users still access all old functionality?
4. ✅ Are there no console errors or warnings?
5. ✅ Does modal close properly?
6. ✅ Is data flowing correctly to workshop?

---

**Status**: Ready to implement with extreme caution. All risks identified and mitigated.
