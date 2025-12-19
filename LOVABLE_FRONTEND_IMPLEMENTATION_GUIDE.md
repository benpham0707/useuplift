# 🎨 Common App Workshop - Frontend Implementation Guide for Lovable

**Target**: Clone PIQ Workshop → Adapt for Common App Supplemental Essays
**Approach**: Build incrementally in 5 parts, perfect each before moving to next
**Base Reference**: `/src/pages/PIQWorkshop.tsx` and `/src/components/portfolio/piq/workshop/`

---

## 📋 Table of Contents

- [Part 1: Clone PIQ Workshop Base](#part-1-clone-piq-workshop-base)
- [Part 2: College Navigation System](#part-2-college-navigation-system)
- [Part 3: Supplemental Workshop Pages](#part-3-supplemental-workshop-pages)
- [Part 4: Citation System Integration](#part-4-citation-system-integration)
- [Part 5: UX Adjustments by Essay Length](#part-5-ux-adjustments-by-essay-length)
- [Master Checklist](#master-checklist)

---

# Part 1: Clone PIQ Workshop Base

## 🎯 Goal
Create a perfect 1:1 clone of PIQ Workshop as `CommonAppWorkshop.tsx` before making any changes.

## 📁 Files to Create

### 1.1 Main Page Component

**File**: `src/pages/CommonAppWorkshop.tsx`

**Instructions**:
1. Copy entire contents of `src/pages/PIQWorkshop.tsx`
2. Rename component from `PIQWorkshop` to `CommonAppWorkshop`
3. Keep ALL functionality identical:
   - State management (draft, analysis, versions)
   - Database integration (autosave, version history)
   - Analysis phases (Phase 17, 18, 19)
   - Chat integration
   - Credits system
   - Version history drawer
   - Local recovery banner

**Key sections to preserve**:
```typescript
// ✅ Keep these sections EXACTLY as-is
- Authentication (Clerk integration)
- State management (40+ state variables)
- Database operations (save, load, version history)
- Analysis function (performFullAnalysis)
- Autosave system (AutosaveManager)
- All handlers (handleDraftChange, handleSave, etc.)
- UI rendering (NQI card, editor, rubric, chat)
```

### 1.2 Workshop Components (Direct Clones)

**Files to Clone** (create Common App versions):

| PIQ Component | Common App Clone | Location |
|---------------|------------------|----------|
| `PIQCarouselNav.tsx` | `CommonAppCollegeNav.tsx` | `src/components/portfolio/commonApp/workshop/` |
| `PIQWorkshopIntegrated.tsx` | `CommonAppWorkshopIntegrated.tsx` | `src/components/portfolio/commonApp/workshop/` |
| `VoiceFingerprintCard.tsx` | *(reuse as-is)* | Already shared |
| `ExperienceFingerprintCard.tsx` | *(reuse as-is)* | Already shared |
| `RandomizingScore.tsx` | *(reuse as-is)* | Already shared |

**Instructions for CommonAppCollegeNav.tsx**:
```typescript
// Clone from PIQCarouselNav.tsx
// At this stage: Keep structure identical, just rename types

interface CommonAppCollegeNavProps {
  currentCollegeId: string; // was: currentPromptId
  onCollegeChange?: (collegeId: string) => void; // was: onPromptChange
  useRoutes?: boolean;
  essayStatus?: Record<string, 'empty' | 'draft' | 'complete'>;
}

// Keep ALL visual elements:
// - Previous/Next arrows
// - Dropdown with gradient text
// - Dot indicators
// - Status badges (complete/draft/not started)
// - Tooltips
```

### 1.3 Reusable Components (No Changes Needed)

These components work for both PIQ and Common App:
- `EditorView.tsx` - Essay editor
- `RubricDimensionCard.tsx` - Dimension analysis cards
- `ContextualWorkshopChat.tsx` - AI coaching chat
- `VersionHistoryDrawer.tsx` - Version history sidebar
- `SaveStatusIndicator.tsx` - Autosave status
- `LocalRecoveryBanner.tsx` - Recovery from local storage
- `TeachingGuidanceCard.tsx` - Teaching overlays

## 🧪 Testing Part 1

**Verification checklist**:
- [ ] Page loads without errors
- [ ] Can type in editor
- [ ] All buttons render (Analyze, Save, Undo, Redo, History)
- [ ] State management works (draft changes tracked)
- [ ] Navigation component renders
- [ ] Chat component renders
- [ ] No console errors

**Test command**:
```bash
# Start dev server
npm run dev

# Navigate to test route
http://localhost:5173/common-app-workshop/test
```

---

# Part 2: College Navigation System

## 🎯 Goal
Replace PIQ prompt selection (8 prompts) with college selection (user's college list) + supplemental navigation.

## 📊 Data Structure

### 2.1 College Data Source

**Location**: New file `src/data/commonAppColleges.ts`

```typescript
export interface CommonAppCollege {
  id: string; // 'stanford', 'harvard', etc.
  name: string; // 'Stanford University'
  shortName: string; // 'Stanford'
  logo?: string; // URL to college logo
  supplementals: CommonAppSupplemental[];
}

export interface CommonAppSupplemental {
  id: string; // 'stanford_why_us'
  collegeId: string; // 'stanford'
  title: string; // 'Why Stanford? (100-250 words)'
  prompt: string; // Full prompt text
  wordLimit: number; // 250
  wordMin?: number; // 100
  required: boolean; // true/false
  category: 'why_us' | 'why_major' | 'community' | 'extracurricular' | 'intellectual' | 'additional';
}

// Example data structure:
export const COMMON_APP_COLLEGES: CommonAppCollege[] = [
  {
    id: 'stanford',
    name: 'Stanford University',
    shortName: 'Stanford',
    supplementals: [
      {
        id: 'stanford_why_us',
        collegeId: 'stanford',
        title: 'Why Stanford?',
        prompt: 'The Stanford community is deeply curious...',
        wordLimit: 250,
        wordMin: 100,
        required: true,
        category: 'why_us',
      },
      {
        id: 'stanford_intellectual',
        collegeId: 'stanford',
        title: 'Intellectual Vitality',
        prompt: 'Reflect on an idea or experience...',
        wordLimit: 250,
        required: true,
        category: 'intellectual',
      },
      // ... more supplementals
    ],
  },
  // ... more colleges
];
```

**IMPORTANT**: Start with 3-5 sample colleges for testing. Lovable should create placeholder data:
- Stanford (3 supplementals)
- Harvard (2 supplementals)
- MIT (3 supplementals)

### 2.2 Update Navigation Component

**File**: `src/components/portfolio/commonApp/workshop/CommonAppCollegeNav.tsx`

**Changes from PIQCarouselNav**:

```typescript
// BEFORE (PIQ):
const UC_PIQ_PROMPTS = [...]; // 8 fixed prompts
const currentPrompt = UC_PIQ_PROMPTS[currentIndex];

// AFTER (Common App):
const userColleges = COMMON_APP_COLLEGES; // Dynamic college list
const currentCollege = userColleges.find(c => c.id === currentCollegeId);
const currentSupplemental = currentCollege?.supplementals.find(s => s.id === currentSupplementalId);

// Navigation hierarchy:
// Level 1: College (Previous/Next buttons switch colleges)
// Level 2: Supplemental (Dropdown shows supplementals for current college)
```

**UI Structure**:
```
┌─────────────────────────────────────────────────────────────┐
│  [< Prev]  |  Stanford: Why Stanford?  [dropdown ▼]  |  [Next >]  │
│            └─ When clicked, shows all Stanford supps ─┘       │
└─────────────────────────────────────────────────────────────┘
            ● ● ● ● ●  ← Dots represent COLLEGES, not supps
```

**Dropdown content**:
```
┌──────────────────────────────────────────┐
│ Stanford Supplemental Essays            │
├──────────────────────────────────────────┤
│ ✓ Why Stanford? (100-250 words)     [Complete] │
│ 📝 Intellectual Vitality (250 words) [Draft]    │
│ ○ Community (100-250 words)         [Not started] │
└──────────────────────────────────────────┘
```

### 2.3 Routing Structure

**File**: Update `src/App.tsx` or routing config

```typescript
// Route pattern:
/common-app-workshop/:collegeId/:supplementalId

// Examples:
/common-app-workshop/stanford/why_us
/common-app-workshop/harvard/why_harvard
/common-app-workshop/mit/intellectual_community

// URL params map to:
const { collegeId, supplementalId } = useParams<{
  collegeId: string;
  supplementalId: string;
}>();
```

### 2.4 Update Main Page

**File**: `src/pages/CommonAppWorkshop.tsx`

```typescript
// CHANGES:
const { collegeId, supplementalId } = useParams<{
  collegeId?: string;
  supplementalId?: string;
}>();

// Find current college and supplemental
const currentCollege = COMMON_APP_COLLEGES.find(c => c.id === collegeId);
const currentSupplemental = currentCollege?.supplementals.find(s => s.id === supplementalId);

// Update navigation component props:
<CommonAppCollegeNav
  currentCollegeId={collegeId || 'stanford'}
  currentSupplementalId={supplementalId || 'why_us'}
  onNavigate={(newCollegeId, newSuppId) => {
    navigate(`/common-app-workshop/${newCollegeId}/${newSuppId}`);
  }}
  colleges={COMMON_APP_COLLEGES}
  essayStatus={/* load from database */}
/>

// Update analysis call to use supplemental prompt:
performFullAnalysis(
  currentDraft,
  currentSupplemental?.title || '',
  currentSupplemental?.prompt || ''
);
```

## 🧪 Testing Part 2

**Verification checklist**:
- [ ] Can navigate between colleges using arrows
- [ ] Can open dropdown and see all supplementals for current college
- [ ] Clicking supplemental navigates to correct URL
- [ ] Dot indicators show correct college (not supplemental)
- [ ] Status badges reflect essay completion state
- [ ] URL updates correctly: `/common-app-workshop/stanford/why_us`
- [ ] Page state persists when switching supplementals

**Test scenarios**:
1. Navigate Stanford → Harvard (should switch colleges)
2. Open dropdown, select different supplemental (should stay on same college)
3. Refresh page - should load correct college + supplemental
4. Write essay, switch to different supplemental, come back - should restore essay

---

# Part 3: Supplemental Workshop Pages

## 🎯 Goal
Ensure each supplemental essay gets its own isolated workshop with proper data persistence.

## 📦 Database Schema

### 3.1 Data Model

**Table**: `common_app_essays` (parallel to `piq_essays`)

```sql
CREATE TABLE common_app_essays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  college_id TEXT NOT NULL, -- 'stanford', 'harvard'
  supplemental_id TEXT NOT NULL, -- 'why_us', 'intellectual'
  supplemental_prompt TEXT NOT NULL,
  draft_original TEXT, -- First version
  draft_current TEXT NOT NULL, -- Latest version
  word_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one essay per user per supplemental
  UNIQUE(user_id, college_id, supplemental_id)
);

CREATE INDEX idx_common_app_essays_user_college
  ON common_app_essays(user_id, college_id);
```

**Table**: `common_app_analysis_reports` (parallel to `piq_analysis_reports`)

```sql
CREATE TABLE common_app_analysis_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  essay_id UUID REFERENCES common_app_essays(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) NOT NULL,

  -- Analysis results (JSON)
  narrative_quality_index INTEGER,
  rubric_dimension_details JSONB,
  workshop_items JSONB,
  voice_fingerprint JSONB,
  experience_fingerprint JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Table**: `common_app_versions` (parallel to `piq_versions`)

```sql
CREATE TABLE common_app_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  essay_id UUID REFERENCES common_app_essays(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) NOT NULL,

  draft_content TEXT NOT NULL,
  score INTEGER, -- NQI score (for analyze versions)
  dimension_scores JSONB, -- Rubric scores

  source TEXT NOT NULL, -- 'analyze', 'autosave', 'milestone'
  version_label TEXT, -- Optional label for milestones
  analysis_report_id UUID REFERENCES common_app_analysis_reports(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 Database Service

**File**: `src/services/commonAppWorkshop/commonAppDatabaseService.ts`

**Instructions**:
1. Clone from `src/services/piqWorkshop/piqDatabaseService.ts`
2. Replace all `piq_essays` → `common_app_essays`
3. Replace all `piq_analysis_reports` → `common_app_analysis_reports`
4. Replace all `piq_versions` → `common_app_versions`
5. Update function signatures:

```typescript
// BEFORE (PIQ):
export async function loadPIQEssay(
  token: string,
  userId: string,
  promptId: string, // 'piq1', 'piq2'
  promptText: string
): Promise<LoadPIQEssayResult>

// AFTER (Common App):
export async function loadCommonAppEssay(
  token: string,
  userId: string,
  collegeId: string, // 'stanford'
  supplementalId: string, // 'why_us'
  promptText: string
): Promise<LoadCommonAppEssayResult>
```

### 3.3 Unique Storage per Supplemental

**Key concept**: Each supplemental is completely independent.

```typescript
// Example storage keys:
// Stanford "Why Us" essay:
user_123 + stanford + why_us → essay_id_1

// Stanford "Intellectual" essay:
user_123 + stanford + intellectual → essay_id_2

// Harvard "Why Harvard" essay:
user_123 + harvard + why_harvard → essay_id_3

// Each has its own:
// - draft_current
// - analysis_report
// - version_history
// - chat_messages
```

### 3.4 Update Load/Save Logic

**File**: `src/pages/CommonAppWorkshop.tsx`

```typescript
// Load essay on mount
useEffect(() => {
  async function loadFromDatabase() {
    if (!userId || !collegeId || !supplementalId) return;

    const currentSupplemental = COMMON_APP_COLLEGES
      .find(c => c.id === collegeId)
      ?.supplementals.find(s => s.id === supplementalId);

    if (!currentSupplemental) return;

    // Reset state when switching supplementals
    setCurrentDraft('');
    setAnalysisResult(null);
    setDimensions([]);
    setDraftVersions([]);
    setCurrentEssayId(null);
    setChatMessages([]);

    setIsLoadingFromDatabase(true);

    try {
      const token = await getToken({ template: 'supabase' });
      if (!token) return;

      // Load specific supplemental
      const { success, essay, analysis } = await loadCommonAppEssay(
        token,
        userId,
        collegeId,
        supplementalId,
        currentSupplemental.prompt
      );

      if (success && essay) {
        setCurrentEssayId(essay.id);
        setCurrentDraft(essay.draft_current || essay.draft_original);

        if (analysis) {
          setAnalysisResult(analysis);
          // Transform to UI dimensions...
        }
      }
    } catch (error) {
      console.error('Failed to load essay:', error);
    } finally {
      setIsLoadingFromDatabase(false);
    }
  }

  loadFromDatabase();
}, [userId, collegeId, supplementalId]); // Re-run when switching
```

### 3.5 Autosave Configuration

**Update**: Autosave manager should track `collegeId + supplementalId`

```typescript
// Initialize autosave with unique identifier
const manager = new AutosaveManager({
  essayId: currentEssayId,
  userId,
  getToken: () => getToken({ template: 'supabase' }),
  promptText: currentSupplemental.prompt,
  promptId: `${collegeId}_${supplementalId}`, // Unique per supplemental
  onStatusChange: setAutosaveState,
  initialContent: currentDraft,
  config: {
    debounceMs: 5000,
    retryIntervalMs: 30000,
  },
});
```

## 🧪 Testing Part 3

**Verification checklist**:
- [ ] Each supplemental loads independently
- [ ] Writing on Stanford "Why Us" doesn't affect Stanford "Intellectual"
- [ ] Switching supplementals saves current work
- [ ] Version history is unique per supplemental
- [ ] Analysis results are unique per supplemental
- [ ] Chat history is unique per supplemental
- [ ] Autosave works correctly for each supplemental
- [ ] Refreshing page loads correct supplemental data

**Test scenarios**:
1. Write essay for Stanford "Why Us" → Switch to Stanford "Intellectual" → Come back → Should restore "Why Us" essay
2. Analyze Stanford "Why Us" (gets NQI 75) → Analyze Stanford "Intellectual" (gets NQI 82) → Both should maintain separate scores
3. Chat with coach about Stanford "Why Us" → Switch to Harvard "Why Harvard" → Chat should reset
4. Create 3 versions of Stanford "Why Us" → Version history should show only those 3

---

# Part 4: Citation System Integration

## 🎯 Goal
Integrate the holistic 3-type citation system (red highlight, green underline, purple box) into the Common App Workshop.

## 📚 Reference Documentation
- [CITATION_HOLISTIC_IMPLEMENTATION_COMPLETE.md](CITATION_HOLISTIC_IMPLEMENTATION_COMPLETE.md)
- Citation types: `src/services/commonAppWorkshop/types/citationTypes.ts`
- Citation formatter: `src/services/commonAppWorkshop/utils/citationFormatter.ts`
- Citation processor: `src/services/commonAppWorkshop/services/citationProcessor.ts`

## 🎨 Visual System

### 4.1 Citation Types

**3 Holistic Types**:

| Type | Visual Treatment | Where Used | Purpose |
|------|------------------|------------|---------|
| **Problem** | Red highlight (#FEE2E2 bg) | Original essay | Show what's wrong |
| **Strength** | Green underline (#10B981) | Revised essay | Show what's working + core values |
| **Teaching** | Purple box only (#8B5CF6) | Rationale text | Teach how to improve |

**Important**: Only 2 inline styles in essay text (red + green). Teaching citations appear in sidebar box only.

### 4.2 Backend Integration

**Update analysis service** to return citations in workshop items:

**File**: `src/services/commonAppWorkshop/commonAppAnalysisService.ts`

```typescript
// Analysis result includes citations
export interface AnalysisResult {
  // ... existing fields
  workshopItems: WorkshopItem[];
}

export interface WorkshopItem {
  id: string;
  quote: string; // Text from essay
  problem: string;
  why_it_matters: string;
  suggestions: Suggestion[];
  teaching: TeachingGuidance;
  rubric_category: string;

  // NEW: Citation support
  citations?: {
    problem_citation?: ProblemCitation; // Red highlight for quote
    strength_citation?: StrengthCitation; // Green underline for revision
    teaching_citations?: TeachingCitation[]; // Purple boxes in rationale
  };
}

export interface Suggestion {
  text: string; // Revised version
  rationale: string; // Why this revision works
  type: 'polished_original' | 'voice_amplifier';

  // NEW: Citations in rationale
  rationale_with_citations?: string; // "[transforms classroom learning]{{teach_1}}"
  citations?: CitationDatabase; // Map of cite_id → Citation object
}
```

### 4.3 Frontend Components

**Create citation rendering components**:

#### Component 1: CitedText

**File**: `src/components/portfolio/commonApp/workshop/citations/CitedText.tsx`

```typescript
import { UIReadyText, UIReadyCitation } from '@/services/commonAppWorkshop/types';

interface CitedTextProps {
  uiText: UIReadyText; // Formatted text with citation spans
  className?: string;
}

export function CitedText({ uiText, className }: CitedTextProps) {
  return (
    <div className={className}>
      {uiText.spans.map((span, idx) => {
        if (span.citation) {
          return <CitedSpan key={idx} span={span} />;
        }
        return <span key={idx}>{span.text}</span>;
      })}
    </div>
  );
}
```

#### Component 2: CitedSpan

**File**: Same file as above

```typescript
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface CitedSpanProps {
  span: UIReadyTextSpan;
}

function CitedSpan({ span }: CitedSpanProps) {
  const { citation, text } = span;
  const { styling, tooltip } = citation!;

  // Apply inline styling based on type
  let className = 'cited-text cursor-pointer transition-all';
  let style: React.CSSProperties = {};

  if (styling.inline_style === 'red_highlight') {
    className += ' problem-highlight';
    style.backgroundColor = styling.background_color; // #FEE2E2
    style.borderRadius = '2px';
    style.padding = '0 2px';
  } else if (styling.inline_style === 'green_underline') {
    className += ' strength-underline';
    style.borderBottom = `2px solid ${styling.underline_color}`; // #10B981
  }
  // teaching type has no inline styling!

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={className} style={style}>
          {text}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-sm">
        <CitationTooltip citation={citation!} />
      </TooltipContent>
    </Tooltip>
  );
}
```

#### Component 3: CitationTooltip

**File**: Same file as above

```typescript
function CitationTooltip({ citation }: { citation: UIReadyCitation }) {
  const { tooltip, styling } = citation;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-lg">{styling.icon_hint}</span>
        <h3 className="font-semibold">{tooltip.title}</h3>
      </div>
      <h4 className="text-sm text-muted-foreground">{tooltip.subtitle}</h4>
      <hr className="border-border" />
      <div className="text-sm">{tooltip.content}</div>
      {tooltip.context && (
        <div className="text-xs text-muted-foreground">{tooltip.context}</div>
      )}
      {tooltip.relevance && (
        <div className="text-xs bg-muted p-2 rounded">
          <strong>Why this matters:</strong> {tooltip.relevance}
        </div>
      )}
      {tooltip.footer && (
        <footer className="text-xs text-muted-foreground border-t pt-2">
          {tooltip.footer}
        </footer>
      )}
    </div>
  );
}
```

### 4.4 Integrate into Workshop Items

**File**: `src/components/portfolio/extracurricular/workshop/TeachingGuidanceCard.tsx` (or create Common App version)

```typescript
// In the suggestion display:
{suggestion.rationale_with_citations ? (
  <CitedText
    uiText={formatTextWithCitations(
      suggestion.rationale_with_citations,
      suggestion.citations,
      currentCollege.name
    )}
    className="text-sm text-muted-foreground"
  />
) : (
  <p className="text-sm text-muted-foreground">{suggestion.rationale}</p>
)}
```

### 4.5 CSS Styling

**File**: `src/index.css` or component-specific styles

```css
/* Problem citation - RED HIGHLIGHT */
.problem-highlight {
  background-color: #FEE2E2;
  border-radius: 2px;
  padding: 0 2px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.problem-highlight:hover {
  background-color: #FCA5A5;
}

/* Strength citation - GREEN UNDERLINE */
.strength-underline {
  border-bottom: 2px solid #10B981;
  cursor: pointer;
  transition: border-color 0.2s;
}

.strength-underline:hover {
  border-color: #059669;
}

/* Teaching citation - NO INLINE STYLE */
/* (Only shows in citation box sidebar if implemented) */

/* Tooltip styling */
.cited-text {
  display: inline;
  position: relative;
}
```

### 4.6 Citation Box Sidebar (Optional Enhancement)

**File**: `src/components/portfolio/commonApp/workshop/citations/CitationBox.tsx`

```typescript
// Shows all citations used in current supplemental
interface CitationBoxProps {
  citations: Citation[];
  collegeName: string;
}

export function CitationBox({ citations, collegeName }: CitationBoxProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Research Citations</h3>
      {citations.map((citation) => {
        const uiReady = formatCitation(citation, collegeName);
        return (
          <div
            key={citation.id}
            className="p-2 rounded border-l-4 text-xs"
            style={{ borderLeftColor: uiReady.styling.box_indicator_color }}
          >
            <div className="flex items-center gap-1 mb-1">
              <span>{uiReady.styling.icon_hint}</span>
              <strong>{uiReady.tooltip.title}</strong>
            </div>
            <p className="text-muted-foreground">{uiReady.tooltip.content}</p>
          </div>
        );
      })}
    </div>
  );
}
```

## 🧪 Testing Part 4

**Verification checklist**:
- [ ] Red highlights appear on problems in original essay
- [ ] Green underlines appear on strengths in revised version
- [ ] Purple teaching citations appear in rationale (no inline style)
- [ ] Hovering citation shows tooltip with research details
- [ ] Tooltip includes icon, title, subtitle, content, relevance, footer
- [ ] Visual hierarchy is clear (only 2 inline colors)
- [ ] Citations work for all colleges (dynamically replace college name)
- [ ] Mobile responsive (tooltips don't overflow)

**Test scenarios**:
1. Load analysis with citations → Hover over red highlight → Should show problem tooltip
2. View suggestion rationale with teaching citations → Should show purple indicators
3. Switch colleges → Citations should update with new college name
4. Long tooltip content → Should wrap correctly and not overflow screen

---

# Part 5: UX Adjustments by Essay Length

## 🎯 Goal
Adapt workshop UI/UX based on supplemental essay word limits (50 words vs 650 words require different layouts).

## 📏 Essay Length Categories

| Category | Word Limit | Examples | Layout Adjustments |
|----------|------------|----------|-------------------|
| **Micro** | 10-50 words | "List activities", "One word" | Compact, single panel |
| **Short** | 50-150 words | "Why major?", "Favorite book" | Vertical layout, smaller cards |
| **Medium** | 150-350 words | "Why us?", "Intellectual curiosity" | Standard layout (PIQ clone) |
| **Long** | 350-650 words | Personal statement, "Tell us more" | Full workshop (PIQ clone) |

## 🎨 Layout Variations

### 5.1 Detect Essay Length

**File**: `src/pages/CommonAppWorkshop.tsx`

```typescript
// Determine layout mode based on word limit
const getLayoutMode = (wordLimit: number): 'micro' | 'short' | 'medium' | 'long' => {
  if (wordLimit <= 50) return 'micro';
  if (wordLimit <= 150) return 'short';
  if (wordLimit <= 350) return 'medium';
  return 'long';
};

const layoutMode = getLayoutMode(currentSupplemental?.wordLimit || 250);
```

### 5.2 Micro Layout (10-50 words)

**Use case**: "List 5 activities", "One word to describe you"

**Layout**:
```
┌─────────────────────────────────────┐
│  Stanford: List 5 Activities        │
├─────────────────────────────────────┤
│  ┌───────────────┐                  │
│  │ Word count:   │   [Analyze]     │
│  │ 12 / 50       │                  │
│  │               │                  │
│  │ [Text input]  │                  │
│  └───────────────┘                  │
│                                     │
│  Quick Tips:                        │
│  • Use active verbs                 │
│  • Be specific                      │
└─────────────────────────────────────┘
```

**Adjustments**:
- Hide rubric dimensions (not useful for 50 words)
- Hide NQI score card (overkill)
- Hide version history (minimal editing)
- Show simplified coach (single text box)
- Single-column layout

### 5.3 Short Layout (50-150 words)

**Use case**: "Why this major?" (100 words), "Favorite book?" (150 words)

**Layout**:
```
┌──────────────────────┬─────────────┐
│  Editor (left)       │  Coach      │
│  + Mini rubric       │  (right)    │
│  (3-4 dimensions)    │             │
└──────────────────────┴─────────────┘
```

**Adjustments**:
- Compact NQI card (smaller)
- Show only top 3-4 rubric dimensions
- Vertical stacking on mobile
- Simplified teaching guidance (fewer examples)

### 5.4 Medium Layout (150-350 words)

**Use case**: "Why Stanford?" (250 words), Standard PIQ (350 words)

**Layout**: **Same as PIQ Workshop** (perfect reference!)

```
┌────────────────────┬─────────────┐
│  NQI Card (top)    │             │
├────────────────────┼─────────────┤
│  Editor (left)     │  Coach      │
│  Rubric (left)     │  (right)    │
└────────────────────┴─────────────┘
```

**Adjustments**: None - use PIQ layout as-is!

### 5.5 Long Layout (350-650 words)

**Use case**: Common App main essay (650 words), "Tell us more" (500 words)

**Layout**: **Enhanced version of PIQ Workshop**

```
┌──────────────────────────────────────┐
│  NQI Card + Progress Bar + Overview  │
├───────────────────┬──────────────────┤
│  Editor           │  Coach + Tools   │
│  (collapsible)    │  - Chat          │
├───────────────────┤  - Voice print   │
│  Rubric (12 dims) │  - Experience    │
│  (collapsible     │  - Citations     │
│   sections)       │                  │
└───────────────────┴──────────────────┘
```

**Adjustments**:
- Expandable sections (collapse dimensions by status)
- Enhanced navigation (scroll to dimension)
- More detailed teaching guidance
- Narrative overview section
- Version comparison tool

## 🔧 Implementation

### 5.6 Conditional Rendering

**File**: `src/pages/CommonAppWorkshop.tsx`

```typescript
// Render different layouts based on mode
return (
  <div className="min-h-screen bg-background">
    <Navigation />

    {/* College navigation - always visible */}
    <CommonAppCollegeNav {...navProps} />

    {/* Layout-specific rendering */}
    {layoutMode === 'micro' && <MicroLayout {...workshopProps} />}
    {layoutMode === 'short' && <ShortLayout {...workshopProps} />}
    {layoutMode === 'medium' && <MediumLayout {...workshopProps} />}
    {layoutMode === 'long' && <LongLayout {...workshopProps} />}
  </div>
);
```

### 5.7 Layout Components

**File**: `src/components/portfolio/commonApp/workshop/layouts/`

Create 4 layout components:
- `MicroLayout.tsx` - Minimal for 10-50 words
- `ShortLayout.tsx` - Compact for 50-150 words
- `MediumLayout.tsx` - Standard PIQ clone for 150-350 words
- `LongLayout.tsx` - Enhanced for 350-650 words

**Example - MediumLayout.tsx**:
```typescript
// This should be IDENTICAL to current PIQWorkshop layout
export function MediumLayout(props: WorkshopLayoutProps) {
  return (
    <>
      {/* NQI Card */}
      <Card className="nqi-card">...</Card>

      {/* 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Editor + Rubric */}
        <div className="space-y-6">
          <EditorView {...editorProps} />
          {dimensions.map(d => <RubricDimensionCard {...d} />)}
        </div>

        {/* Right: Chat */}
        <div>
          <ContextualWorkshopChat {...chatProps} />
        </div>
      </div>
    </>
  );
}
```

## 🧪 Testing Part 5

**Verification checklist**:
- [ ] Micro essays (≤50 words) show simplified layout
- [ ] Short essays (50-150) show compact layout
- [ ] Medium essays (150-350) show PIQ clone layout
- [ ] Long essays (350-650) show enhanced layout
- [ ] Layout switches correctly when changing supplementals
- [ ] All functionality works in each layout mode
- [ ] Mobile responsive for all layouts

**Test scenarios**:
1. Create test supplementals with different word limits: 25, 100, 250, 500
2. Navigate through all 4 → Each should render correct layout
3. Write essay in long layout, switch to short layout → Should adapt
4. Analyze essay in each layout → Analysis should complete successfully

---

# Master Checklist

## Part 1: Clone PIQ Workshop Base
- [ ] Create `src/pages/CommonAppWorkshop.tsx` (exact clone)
- [ ] Create `src/components/portfolio/commonApp/workshop/CommonAppCollegeNav.tsx`
- [ ] Create `src/components/portfolio/commonApp/workshop/CommonAppWorkshopIntegrated.tsx`
- [ ] Test: Page loads without errors
- [ ] Test: All PIQ functionality works (analyze, save, chat, versions)
- [ ] **Deploy Part 1 for testing before proceeding**

## Part 2: College Navigation System
- [ ] Create `src/data/commonAppColleges.ts` with sample colleges
- [ ] Update `CommonAppCollegeNav.tsx` with 2-level navigation
- [ ] Add routing: `/common-app-workshop/:collegeId/:supplementalId`
- [ ] Update main page to load college/supplemental from URL
- [ ] Test: Navigate between colleges
- [ ] Test: Navigate between supplementals within college
- [ ] Test: URL updates correctly
- [ ] Test: Dot indicators represent colleges
- [ ] **Deploy Part 2 for testing before proceeding**

## Part 3: Supplemental Workshop Pages
- [ ] Create database schema for Common App essays
- [ ] Create `src/services/commonAppWorkshop/commonAppDatabaseService.ts`
- [ ] Update load/save logic for unique supplementals
- [ ] Configure autosave per supplemental
- [ ] Test: Each supplemental loads independently
- [ ] Test: Switching saves current work
- [ ] Test: Version history is unique per supplemental
- [ ] Test: Analysis is unique per supplemental
- [ ] **Deploy Part 3 for testing before proceeding**

## Part 4: Citation System Integration
- [ ] Create `src/components/portfolio/commonApp/workshop/citations/CitedText.tsx`
- [ ] Create `CitedSpan.tsx` and `CitationTooltip.tsx`
- [ ] Add CSS for red highlight, green underline, purple box
- [ ] Integrate citations into suggestion rationales
- [ ] (Optional) Create `CitationBox.tsx` sidebar
- [ ] Test: Red highlights appear on problems
- [ ] Test: Green underlines appear on strengths
- [ ] Test: Purple teaching citations work
- [ ] Test: Tooltips show correct content
- [ ] **Deploy Part 4 for testing before proceeding**

## Part 5: UX Adjustments by Essay Length
- [ ] Create layout detection logic (`getLayoutMode`)
- [ ] Create `src/components/portfolio/commonApp/workshop/layouts/MicroLayout.tsx`
- [ ] Create `ShortLayout.tsx`
- [ ] Create `MediumLayout.tsx` (PIQ clone)
- [ ] Create `LongLayout.tsx` (enhanced)
- [ ] Add conditional rendering in main page
- [ ] Test: Micro essays show simplified layout
- [ ] Test: Short essays show compact layout
- [ ] Test: Medium essays show PIQ clone
- [ ] Test: Long essays show enhanced layout
- [ ] **Deploy Part 5 for final testing**

## Final Integration Testing
- [ ] Test full flow: Navigate colleges → Write essay → Analyze → Review citations → Switch supplemental → Resume work
- [ ] Test on mobile devices (all layouts responsive)
- [ ] Test with real college data (10+ colleges, 30+ supplementals)
- [ ] Load test: Save/load 50+ essays
- [ ] Performance: Analysis completes in < 3 minutes
- [ ] Accessibility: Keyboard navigation works
- [ ] Browser compatibility: Chrome, Safari, Firefox
- [ ] **Production deployment ready**

---

## 🎨 Visual Design Consistency

**Maintain PIQ Workshop design language**:
- Gradient text for headings (purple gradient)
- Card-based layout with shadows
- Smooth transitions and animations
- Dark mode support
- Status badges (complete/draft/not started)
- Color system:
  - Purple primary (#8B5CF6)
  - Green success (#10B981)
  - Red critical (#EF4444)
  - Amber warning (#F59E0B)

**Typography**:
- Headings: Inter font, bold weights
- Body: Inter font, regular weight
- Code/essays: Monospace font in editor

**Spacing**:
- Consistent gap-6 between major sections
- Card padding: p-6
- Section margins: space-y-6

---

## 📱 Responsive Design Requirements

**Breakpoints**:
- Mobile: < 640px (single column)
- Tablet: 640px - 1024px (adaptive)
- Desktop: > 1024px (2-column layout)

**Mobile-specific**:
- College navigation: Horizontal scroll with arrows
- Dropdown: Full-width popover
- Editor: Full-width, stacks above rubric
- Chat: Collapsible panel
- NQI card: Compact version

---

## 🚀 Performance Targets

**Page load**:
- Initial render: < 1 second
- Database load: < 2 seconds
- Route navigation: Instant (< 100ms)

**Analysis**:
- Phase 17 results: < 90 seconds
- Phase 18 validation: < 60 seconds
- Phase 19 teaching: < 60 seconds
- Total: < 3 minutes

**Autosave**:
- Debounce: 5 seconds after typing stops
- Save operation: < 500ms
- Background (non-blocking)

---

## 📝 Code Quality Standards

**TypeScript**:
- Strict mode enabled
- No `any` types (use proper interfaces)
- Props interfaces for all components
- Return types for all functions

**React Best Practices**:
- Use hooks (useState, useEffect, useCallback, useMemo)
- Avoid prop drilling (use context if needed)
- Memoize expensive computations
- Clean up effects (return cleanup functions)

**Error Handling**:
- Try-catch for all async operations
- User-friendly error messages
- Console logging for debugging
- Graceful degradation (show cached data if server fails)

---

## 🔐 Security Considerations

**Authentication**:
- All database operations require valid Clerk token
- Verify user_id matches token claims
- No exposed API keys in frontend

**Data Privacy**:
- Essays are user-scoped (can only access own essays)
- No sharing between users
- Secure deletion (ON DELETE CASCADE)

**Input Validation**:
- Sanitize essay content before save
- Validate word limits (prevent exceeding)
- Prevent XSS in citation tooltips (escape HTML)

---

## 📚 Documentation to Create

**For each part, create**:
1. Component README (what it does, props, usage)
2. Service documentation (functions, parameters, returns)
3. Testing guide (how to test manually + automated)
4. Troubleshooting guide (common issues + solutions)

---

## 🎯 Success Criteria

**Part 1**: Perfect PIQ clone loads and all features work
**Part 2**: College navigation works with multi-level hierarchy
**Part 3**: Each supplemental has independent data persistence
**Part 4**: Citations render correctly with proper visual hierarchy
**Part 5**: All 4 layout modes work correctly by essay length

**Overall**: User can navigate colleges, write supplementals, get analysis with citations, save work, and resume later - all with excellent UX.

---

**END OF IMPLEMENTATION GUIDE**

**Next Steps for Lovable**:
1. Start with Part 1 (perfect clone)
2. Test thoroughly before moving to Part 2
3. Deploy each part incrementally
4. Report any blockers or questions
5. Request user approval before proceeding to next part
