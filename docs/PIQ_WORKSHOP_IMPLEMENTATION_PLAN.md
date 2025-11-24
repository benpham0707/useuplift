# PIQ Workshop Implementation Plan

**Date**: 2025-11-14
**Goal**: Replicate extracurricular workshop UI/UX for UC PIQs (350w)
**Approach**: Copy & adapt existing workshop, swap backend analysis system

---

## ✅ CONFIRMED APPROACH

**Use the exact same UI/UX as extracurricular workshop**, but:
- Change backend to use Essay Analysis System (12-dimension rubric)
- Adapt for UC PIQ format (350 words, 8 prompts)
- Keep all existing UI components (Hero, Editor, Rubric Cards, Chat)

---

## 📊 CURRENT EXTRACURRICULAR WORKSHOP STRUCTURE

### Main Component: `ExtracurricularWorkshopUnified.tsx` (923 lines)

**3-Section Vertical Flow**:

#### 1. Hero Section (Lines ~330-455)
- **NQI Score Display**: Circle with score + tier label
- **Progress Metrics**: Issues resolved, word count
- **Score Delta**: Shows improvement from initial score
- **Status Badge**: Reader impression label

#### 2. Editor Section (Lines ~456-513)
- **Draft Textarea**: Live editing with auto-reanalysis (3s debounce)
- **Undo/Redo Buttons**: Version navigation
- **Save Button**: Commits new version
- **Word Count**: Real-time tracking
- **Version Info**: "Version X of Y"
- **Reanalysis Alert**: Shows when re-analyzing

#### 3. Rubric Categories (Lines ~515-800+)
- **11 Expandable Category Cards**
- Each card shows:
  - Category name + score (X/10)
  - Weight percentage
  - Progress bar
  - Expand/collapse chevron
- **When expanded**:
  - Teaching issues for that category
  - Fix strategies with examples
  - Reflection prompts (if available)
  - Quick wins/strategic moves

### Supporting Components

#### `WorkshopChatV3.tsx`
- Context-aware chat integrated in right sidebar (2-column layout)
- Pre-filled prompts based on analysis
- Action recommendations
- Conversation persistence

#### Backend Integration
- **Analysis Service**: `analyzeExtracurricularEntry()` from `@/services/workshopAnalysisService`
- **Returns**: `AnalysisResult` with 11-category scores
- **Teaching Transformer**: `transformAnalysisToCoaching()` converts analysis to teaching issues
- **Reflection Prompts**: `generateReflectionPromptsWithCache()` for deep questions

---

## 🎯 PIQ WORKSHOP ADAPTATION PLAN

### Step 1: Create PIQ Analysis Backend Route

**File to Create**: `src/services/piqAnalysisService.ts`

**Purpose**: Wrap Essay Analysis System to match extracurricular workshop interface

```typescript
// Similar interface to analyzeExtracurricularEntry but for PIQs
export async function analyzePIQEntry(
  text: string,
  piqPrompt: string,
  studentContext?: StudentContext,
  options?: AnalysisOptions
): Promise<PIQAnalysisResult>
```

**Implementation**:
1. Use Essay Analysis Engine (`src/core/essay/analysis/`)
2. Return 12-dimension scores (instead of 11)
3. Include scene/dialogue/interiority detection
4. Format to match `AnalysisResult` type structure

**Rubric Mapping**:

| Essay Rubric (12 dimensions) | Display in Workshop |
|------------------------------|---------------------|
| Opening Power & Scene Entry | Opening Strength |
| Narrative Arc, Stakes & Turn | Story Structure |
| Character Interiority & Vulnerability | Emotional Depth |
| Show-Don't-Tell Craft | Concrete Storytelling |
| Reflection & Meaning-Making | Insight Quality |
| Intellectual Vitality & Curiosity | Intellectual Engagement |
| Originality & Specificity of Voice | Voice Authenticity |
| Structure, Pacing & Coherence | Flow & Organization |
| Word Economy & Line-level Craft | Writing Quality |
| Context & Constraints Disclosure | Background Context |
| School/Program Fit | Future Connection |
| Ethical Awareness & Humility | Self-Awareness |

---

### Step 2: Create PIQ Teaching Transformer

**File to Create**: `src/services/piqTeachingTransformer.ts`

**Purpose**: Convert Essay Analysis results into teaching issues (same format as extracurricular)

**Key Differences**:
- Map 12 essay dimensions → teaching issues
- Include scene/dialogue/interiority-specific guidance
- Use essay-specific examples (not activity examples)
- Adapt reflection prompts for personal narratives

---

### Step 3: Create PIQ Workshop Component

**File to Create**: `src/components/portfolio/essay/PIQWorkshopUnified.tsx`

**Approach**: Copy `ExtracurricularWorkshopUnified.tsx` and adapt:

**Changes Needed**:

#### Props Interface:
```typescript
interface PIQWorkshopUnifiedProps {
  piq: {
    id: string;
    prompt: string; // UC PIQ prompt (1 of 8)
    text: string;
    studentContext?: {
      intendedMajor?: string;
      culturalBackground?: string;
      voicePreference?: 'concise' | 'warm' | 'understated';
    };
  };
}
```

#### State Changes:
- Replace `activity` references with `piq`
- Update word count tracking (target: 350w)
- Update placeholder text ("Write your response to this PIQ...")

#### Analysis Call:
```typescript
// Replace analyzeExtracurricularEntry with analyzePIQEntry
const result = await analyzePIQEntry(
  draft,
  piq.prompt,
  piq.studentContext,
  { depth: 'comprehensive', skip_coaching: false }
);
```

#### Display Changes:
- Title: "PIQ Quality Index (PQI)" instead of "NQI"
- Subtitle: Show UC PIQ prompt
- Rubric header: "12-Dimension Essay Rubric" instead of "11-Category Rubric"
- Expand all categories to map 12 dimensions

#### Additional Features:
- **Word limit indicator**: Warning at 340w, error at 351w
- **Prompt selector**: Dropdown to change which of 8 UC PIQ prompts
- **Scene/Dialogue/Interiority highlights**: Show detected elements in editor

---

### Step 4: Create PIQ Types

**File to Create**: `src/components/portfolio/essay/piq/types.ts`

**Copy from**: `src/components/portfolio/extracurricular/workshop/types.ts`

**Adaptations**:
- Add PIQ-specific fields (prompt, prompt_id)
- Add scene/dialogue/interiority types
- Update dimension IDs for 12-dimension rubric

---

### Step 5: Create PIQ Backend Types

**File to Create**: `src/components/portfolio/essay/piq/backendTypes.ts`

**Copy from**: `src/components/portfolio/extracurricular/workshop/backendTypes.ts`

**Adaptations**:
- Map essay rubric dimensions (12 instead of 11)
- Add scene/dialogue/interiority analysis types
- Add PIQ-specific analysis results

---

### Step 6: Integrate PIQ Workshop into App

**Files to Modify**:

#### 1. Add PIQ routes
`src/app/portfolio/essays/page.tsx` or similar

#### 2. Add PIQ data model
`src/core/types/essay.ts` (may already exist)

#### 3. Add navigation
Link from portfolio to PIQ workshop

---

## 🏗️ IMPLEMENTATION ORDER

### Phase 1: Backend Integration (Priority 1)

**Files to Create**:
1. ✅ `src/services/piqAnalysisService.ts` - Main analysis wrapper
2. ✅ `src/services/piqTeachingTransformer.ts` - Teaching issue converter
3. ✅ `src/components/portfolio/essay/piq/backendTypes.ts` - Type definitions

**Tasks**:
- [ ] Implement `analyzePIQEntry()` function
- [ ] Connect to Essay Analysis Engine
- [ ] Map 12-dimension rubric to teaching issues
- [ ] Test with sample PIQ (350w)
- [ ] Validate scene/dialogue/interiority detection

**Success Criteria**:
- ✅ Can analyze 350w PIQ and return 12-dimension scores
- ✅ Scene detection works (finds temporal/spatial anchors)
- ✅ Dialogue extraction works (finds quoted speech)
- ✅ Interiority detection works (finds emotion naming)
- ✅ Returns teaching issues in expected format

---

### Phase 2: Frontend Adaptation (Priority 2)

**Files to Create**:
1. ✅ `src/components/portfolio/essay/piq/types.ts` - Workshop types
2. ✅ `src/components/portfolio/essay/piq/PIQWorkshopUnified.tsx` - Main component
3. ✅ Supporting components (if needed, reuse extracurricular workshop components)

**Tasks**:
- [ ] Copy `ExtracurricularWorkshopUnified.tsx` → `PIQWorkshopUnified.tsx`
- [ ] Update props interface (activity → piq)
- [ ] Replace analysis call (analyzePIQEntry)
- [ ] Update display text (NQI → PQI, 11 → 12 dimensions)
- [ ] Add word limit indicator (350w max)
- [ ] Add UC PIQ prompt display
- [ ] Test UI with sample data

**Success Criteria**:
- ✅ Workshop renders with PIQ data
- ✅ Hero section shows PQI score
- ✅ Editor allows PIQ editing
- ✅ 12-dimension cards display correctly
- ✅ Word limit warnings work
- ✅ Chat integration functional

---

### Phase 3: Enhanced Features (Priority 3 - Optional)

**Additional Features to Add**:

#### 1. Prompt Selector
- Dropdown showing all 8 UC PIQ prompts
- Ability to switch prompt and re-analyze

#### 2. Narrative Element Highlights
- Highlight detected scenes in editor (temporal/spatial anchors)
- Highlight dialogue (quoted speech)
- Highlight interiority moments (emotion naming, inner debate)
- Color-coded overlays in textarea

#### 3. Target Score Setting
- Set target score (e.g., 80/100 for UCLA)
- Show gap to target
- Estimate iterations needed

#### 4. Generation Integration
- "Generate PIQ" button
- Angle selection interface (10 angles)
- Iterative improvement trigger
- Version comparison (side-by-side)

---

## 📋 DETAILED CHECKLIST

### Backend Tasks:
- [ ] Create `piqAnalysisService.ts`
  - [ ] Implement `analyzePIQEntry()` function
  - [ ] Connect to Essay Analysis Engine (`src/core/essay/analysis/`)
  - [ ] Handle 350w format validation
  - [ ] Include scene/dialogue/interiority detection
  - [ ] Return 12-dimension scores
  - [ ] Include evidence quotes

- [ ] Create `piqTeachingTransformer.ts`
  - [ ] Map 12 essay dimensions → teaching issues
  - [ ] Generate dimension-specific guidance
  - [ ] Create fix strategies
  - [ ] Generate reflection prompts
  - [ ] Prioritize issues by impact

- [ ] Create `backendTypes.ts`
  - [ ] Define PIQ-specific types
  - [ ] Map essay rubric types
  - [ ] Scene/dialogue/interiority types
  - [ ] Teaching issue types

- [ ] Test backend integration
  - [ ] Unit test `analyzePIQEntry()`
  - [ ] Test scene detection accuracy
  - [ ] Test dialogue extraction accuracy
  - [ ] Test interiority detection accuracy
  - [ ] Validate 12-dimension scoring

### Frontend Tasks:
- [ ] Create `types.ts`
  - [ ] Define PIQ workshop state
  - [ ] Define dimension types
  - [ ] Define issue types
  - [ ] Define version history types

- [ ] Create `PIQWorkshopUnified.tsx`
  - [ ] Copy base structure from extracurricular workshop
  - [ ] Update props interface
  - [ ] Replace analysis service call
  - [ ] Update state management
  - [ ] Adapt hero section (PQI display)
  - [ ] Adapt editor section (350w limit)
  - [ ] Adapt rubric section (12 dimensions)
  - [ ] Test with sample PIQ

- [ ] Integrate chat component
  - [ ] Adapt WorkshopChatV3 for PIQs
  - [ ] Update context builder
  - [ ] Create PIQ-specific prompts
  - [ ] Test action recommendations

- [ ] Add word limit features
  - [ ] Real-time word count
  - [ ] Warning at 340w (yellow)
  - [ ] Error at 351w (red, disable save)
  - [ ] Visual indicator in editor

- [ ] Add prompt display
  - [ ] Show current UC PIQ prompt
  - [ ] Format prompt nicely
  - [ ] (Optional) Dropdown to change prompt

### Integration Tasks:
- [ ] Add PIQ routes to app
- [ ] Create PIQ data model (if needed)
- [ ] Add navigation from portfolio
- [ ] Test full workflow (write → analyze → improve → save)

---

## 🎨 UI/UX SPECIFICATIONS

### Hero Section (PQI Display)

**Layout**: Same as extracurricular workshop

**Labels**:
- Title: "PIQ Quality Index (PQI)"
- Subtitle: "Based on 12-dimension essay rubric"
- Badge: Reader impression (e.g., "captivating_grounded")

**Tiers**:
- 85-100: Exceptional (green) - Harvard/Stanford/MIT level
- 75-84: Strong (blue) - Top UC competitive
- 65-74: Solid (yellow) - UCLA/Berkeley range
- 55-64: Developing (orange) - Needs polish
- <55: Needs Work (red) - Significant gaps

**Progress Metrics**:
- Issues Resolved: X/Y
- Word Count: X/350 (color-code based on limit)

---

### Editor Section

**Layout**: Same as extracurricular workshop

**Changes**:
- Placeholder: "Write your response to this PIQ prompt..."
- Word count: "X / 350 words" (vs no limit for extracurriculars)
- Warning states:
  - 340-350w: Yellow badge "Near limit"
  - 351+w: Red badge "Over limit" + disable save

**New Feature**: Prompt Display
```
┌─────────────────────────────────────────────────────────┐
│ UC PIQ Prompt:                                           │
│ "Describe an example of your leadership experience..."  │
└─────────────────────────────────────────────────────────┘
```

---

### Rubric Section

**Layout**: Same expandable cards

**Changes**:
- Title: "12-Dimension Essay Rubric"
- 12 cards (not 11)
- Dimension names from essay rubric

**Card Structure** (same):
- Dimension name + score (X/10)
- Weight percentage
- Progress bar (color-coded)
- Expand/collapse chevron

**Expanded Content** (same):
- Teaching issues
- Fix strategies
- Examples
- Reflection prompts
- Action buttons

---

### Chat Integration

**Layout**: Same right sidebar (or bottom panel, depending on viewport)

**Context Changes**:
- Include PIQ prompt
- Include 12-dimension scores
- Include scene/dialogue/interiority detection results
- Include word count status

**Pre-filled Prompts**:
- "Help me add a concrete scene to my opening"
- "How can I show vulnerability without being too emotional?"
- "My dialogue feels forced - how do I fix it?"
- "Help me deepen my reflection at the end"

---

## 🚀 ESTIMATED TIMELINE

### Phase 1: Backend Integration
- **Duration**: 2-3 days
- **Complexity**: Medium (need to understand Essay Analysis Engine)
- **Output**: Working `analyzePIQEntry()` function with 12-dimension results

### Phase 2: Frontend Adaptation
- **Duration**: 2-3 days
- **Complexity**: Low (copying existing workshop)
- **Output**: Functional PIQ workshop UI

### Phase 3: Enhanced Features (Optional)
- **Duration**: 2-3 days
- **Complexity**: Medium
- **Output**: Prompt selector, highlights, generation integration

**Total**: 4-6 days for core functionality (Phases 1-2)
**Total**: 6-9 days with enhanced features (Phase 3)

---

## ✅ SUCCESS CRITERIA

### Functional Requirements:
- ✅ Can load PIQ with prompt and text
- ✅ Can analyze PIQ and return 12-dimension scores
- ✅ Can edit PIQ in workshop (350w limit enforced)
- ✅ Can see teaching issues per dimension
- ✅ Can save versions and undo/redo
- ✅ Can chat about specific issues
- ✅ Scene/dialogue/interiority detection works
- ✅ Auto-reanalysis on text changes (3s debounce)

### Quality Requirements:
- ✅ UI matches extracurricular workshop (consistency)
- ✅ Analysis accuracy (scene detection ≥90%, dialogue ≥95%, interiority ≥90%)
- ✅ Response time < 5s for analysis
- ✅ No UI lag during editing
- ✅ Chat responses relevant to PIQ context

### User Experience Requirements:
- ✅ Clear indication of word limit (340w warning, 351w error)
- ✅ Smooth version navigation (undo/redo)
- ✅ Helpful teaching issues (actionable, specific)
- ✅ Chat provides context-aware coaching
- ✅ Visual feedback on score improvements

---

## 🎯 NEXT STEPS

### Immediate (Start Today):
1. ✅ **Read Essay Analysis Engine code** to understand interface
2. → **Create `piqAnalysisService.ts`** with stub function
3. → **Test Essay Analysis Engine** with sample 350w PIQ
4. → **Validate 12-dimension output** format

### Tomorrow:
1. → **Implement `piqTeachingTransformer.ts`**
2. → **Create `backendTypes.ts`** for PIQ workshop
3. → **Test backend integration** end-to-end

### Day 3:
1. → **Copy `PIQWorkshopUnified.tsx`** from extracurricular
2. → **Adapt props and state** for PIQ format
3. → **Update UI text** (NQI → PQI, 11 → 12)
4. → **Test with sample PIQ**

### Day 4:
1. → **Add word limit enforcement**
2. → **Add prompt display**
3. → **Integrate chat component**
4. → **Test full workflow**

### Day 5-6:
1. → **Polish UI/UX**
2. → **Add enhanced features** (optional)
3. → **User testing**
4. → **Bug fixes**

---

## 📚 REFERENCE FILES

### To Study:
- ✅ `src/components/portfolio/extracurricular/workshop/ExtracurricularWorkshopUnified.tsx` - Main workshop
- ✅ `src/services/workshopAnalysisService.ts` - Analysis service pattern
- → `src/core/essay/analysis/` - Essay analysis engine (need to explore)
- → `src/core/essay/rubrics/v1.0.1.ts` - 12-dimension rubric
- ✅ `src/components/portfolio/extracurricular/workshop/teachingTransformer.ts` - Teaching issue pattern

### To Copy:
- ✅ `ExtracurricularWorkshopUnified.tsx` → `PIQWorkshopUnified.tsx`
- ✅ `types.ts` → `piq/types.ts`
- ✅ `backendTypes.ts` → `piq/backendTypes.ts`
- ✅ All supporting components (can reuse most)

### To Create:
- → `src/services/piqAnalysisService.ts`
- → `src/services/piqTeachingTransformer.ts`
- → `src/components/portfolio/essay/piq/PIQWorkshopUnified.tsx`
- → `src/components/portfolio/essay/piq/types.ts`
- → `src/components/portfolio/essay/piq/backendTypes.ts`

---

**Status**: ✅ Plan Complete, Ready to Start Implementation
**Next**: Begin Phase 1 - Backend Integration
**Priority**: Create `piqAnalysisService.ts` first
