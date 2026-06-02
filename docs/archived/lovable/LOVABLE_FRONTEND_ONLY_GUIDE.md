# 🎨 Common App Workshop - Frontend Implementation Guide for Lovable

**100% Frontend-Only** - All backend handled, you build the UI!

---

## 🎯 What You're Building

A college supplemental essay workshop where students:
1. Select a college (Stanford, Harvard, MIT)
2. Select a supplemental essay for that college
3. Write their essay and get college-specific feedback
4. See core values alignment, preferences, and research-backed guidance

**Key Differentiator**: Every piece of feedback is tailored to the specific college's values and preferences.

---

## 📊 Backend is 100% Ready

### Data Files (Import and Use - Don't Modify)

**File 1**: `src/data/commonAppSupplementalTypes.ts`
- 14 essay types fully defined
- Import: `import { getSupplementalTypeInfo, SUPPLEMENTAL_TYPE_CATEGORIES } from '@/data/commonAppSupplementalTypes'`

**File 2**: `src/data/commonAppColleges.ts`
- 3 colleges (Stanford, Harvard, MIT) with full research
- Import: `import { getCollege, getCollegeSupplementals, getSupplemental, getCollegeCoreValues } from '@/data/commonAppColleges'`

**File 3**: `src/services/commonAppWorkshop/commonAppAnalysisService.ts`
- Analysis API (mocked for now, real endpoint ready)
- Import: `import { analyzeCommonAppEssay, MOCK_ANALYSIS_RESULT } from '@/services/commonAppWorkshop/commonAppAnalysisService'`

### What Data Looks Like

#### College Object:
```typescript
const stanford = getCollege('stanford');
{
  id: 'stanford',
  name: 'Stanford University',
  shortName: 'Stanford',

  coreValues: [
    {
      id: 'stanford_intellectual_vitality',
      name: 'Intellectual Vitality',
      weight: 40,  // Percentage (sum to 100)
      definition: 'Pursuing learning for its own sake...',
      how_to_demonstrate: ['Independent research', 'Self-directed learning', ...]
    },
    // 3 more values (weights: 25%, 20%, 15%)
  ],

  supplementals: [
    {
      id: 'stanford_why_stanford',
      title: 'Why Stanford?',
      prompt: 'The Stanford community is deeply curious...',
      wordLimit: 250,
      wordMin: 100,
      required: true,
      type: 'intellectual',  // Essay type
      analysisHints: {
        key_elements: ['Specific idea', 'Self-directed learning', ...],
        red_flags: ['Classroom learning only', 'Generic', ...],
        elite_patterns: ['Independent project', 'Cross-disciplinary', ...]
      }
    },
    // 2 more essays
  ],

  preferences: {
    essay_priorities: ['Intellectual vitality above all', ...],
    red_flags: ['Classroom-bounded learning', ...],
    preferred_tone: ['Authentic', 'Intellectually curious', ...],
    avoid_tone: ['Trying to impress', 'Overly formal', ...]
  },

  research: {
    sources: {
      admission_website: 'https://...',
      dean_interviews: ['url1', 'url2']
    },
    research_depth: 9  // 1-10 scale
  }
}
```

#### Analysis Result Object:
```typescript
const result = await analyzeCommonAppEssay({
  essay_text: '...',
  college_id: 'stanford',
  supplemental_id: 'stanford_why_stanford',
  user_id: '...'
});

{
  success: true,

  // Standard NQI analysis
  analysis: {
    narrative_quality_index: 75,  // 0-100
    categories: [...],  // Rubric dimensions
    weights: {...}
  },

  // Workshop items (problems + suggestions)
  workshopItems: [...],

  // NEW: College-specific analysis
  collegeSpecific: {
    college_name: 'Stanford University',

    // Core value scores
    core_values_alignment: [
      {
        value_name: 'Intellectual Vitality',
        weight: 40,
        current_score: 72,  // How well demonstrated
        target_score: 85,
        gap: -13,  // Points needed
        how_to_improve: ['Show self-directed learning', ...],
        evidence_present: ['Mentions learning Python'],
        evidence_missing: ['No independent project']
      },
      // ... 3 more values
    ],

    overall_value_alignment: 76,  // Weighted average

    // Violations of college preferences
    preference_violations: [
      {
        what_violated: 'Classroom-bounded learning',
        where_in_essay: 'I learned Python in class',
        why_matters: 'Stanford values self-directed exploration',
        how_to_fix: 'Add independent project example',
        severity: 'major'
      }
    ],

    // Elite patterns from 90+ essays
    elite_patterns_missing: [
      {
        pattern_name: 'Self-Directed Project',
        description: 'Extending classroom into independent work',
        example_quote: 'After learning NLP, I built...',
        how_to_apply: 'Take classroom skill, apply to project'
      }
    ],

    // Type-specific analysis
    type_specific: {
      type: 'intellectual',
      criteria_met: ['Mentions academic interest'],
      criteria_missing: ['Self-directed learning', ...],
      pitfalls_present: ['Classroom learning only'],
      type_alignment_score: 65
    }
  }
}
```

---

## 🏗️ Components to Build

### 1. College Navigation (`CommonAppCollegeNav.tsx`)

**Location**: `src/components/portfolio/commonApp/workshop/CommonAppCollegeNav.tsx`

**Purpose**: Navigate between colleges and their supplementals

**UI Structure**:
```
[< Prev]  |  📍 Stanford: Why Stanford?  [▼]  |  [Next >]
             └─ Click opens dropdown
          ● ● ●  ← Dots for colleges (3 total)
```

**Props**:
```typescript
interface CommonAppCollegeNavProps {
  currentCollegeId: string;
  currentSupplementalId: string;
  onNavigate: (collegeId: string, supplementalId: string) => void;
  essayStatus?: Record<string, 'empty' | 'draft' | 'complete'>;
}
```

**Data to Use**:
```typescript
import { COMMON_APP_COLLEGES, getCollege } from '@/data/commonAppColleges';

// Get all colleges
const colleges = COMMON_APP_COLLEGES;  // Array of 3

// Get current college
const current = getCollege(currentCollegeId);

// Get supplementals for dropdown
const supplementals = current.supplementals;
```

**Dropdown Content**:
```
╔════════════════════════════════════════╗
║  Stanford Supplemental Essays         ║
╠════════════════════════════════════════╣
║  ✓ Why Stanford?           [Complete]  ║
║    250 words • Intellectual type       ║
║                                        ║
║  📝 What Matters to You?     [Draft]   ║
║    250 words • Values type             ║
║                                        ║
║  ○ Roommate Letter     [Not started]   ║
║    250 words • Creative type           ║
╚════════════════════════════════════════╝
```

**Visual Reference**: Clone from `src/components/portfolio/piq/workshop/PIQCarouselNav.tsx`

---

### 2. Core Values Card (`CoreValuesCard.tsx`)

**Location**: `src/components/portfolio/commonApp/workshop/CoreValuesCard.tsx`

**Purpose**: Show college's weighted values with student's alignment scores

**Props**:
```typescript
interface CoreValuesCardProps {
  collegeId: string;
  alignment?: Array<{
    value_name: string;
    weight: number;
    current_score: number;
    gap: number;
    how_to_improve: string[];
    evidence_present: string[];
    evidence_missing: string[];
  }>;
}
```

**Data to Use**:
```typescript
import { getCollegeCoreValues } from '@/data/commonAppColleges';

// Get values (shows even before analysis)
const values = getCollegeCoreValues('stanford');
// Returns: [{name, weight, definition, how_to_demonstrate}, ...]

// Get scores (after analysis)
const scores = analysisResult?.collegeSpecific?.core_values_alignment;
```

**UI Layout**:
```
╔════════════════════════════════════════╗
║  Stanford's Core Values                ║
╠════════════════════════════════════════╣
║  📚 Intellectual Vitality      40%     ║
║     Current: 72/100  Gap: -13          ║
║     ████████████░░░░░░░░ 72%           ║
║     [Expand for details]               ║
║                                        ║
║  💡 Impact & Leadership        25%     ║
║     Current: 85/100  Gap: +0 ✓         ║
║     ████████████████░░░░ 85%           ║
║                                        ║
║  💪 Context & Character        20%     ║
║     Current: 68/100  Gap: -7           ║
║     ███████████░░░░░░░░░ 68%           ║
║                                        ║
║  ✨ Authenticity & Voice       15%     ║
║     Current: 90/100  Gap: +5 ✓         ║
║     ██████████████████░░ 90%           ║
╚════════════════════════════════════════╝
```

**Color Coding**:
- Green (85-100): Excellent
- Yellow (70-84): Good
- Red (<70): Needs work

**Expandable**: Click value to see:
- Full definition
- How to demonstrate
- Evidence present/missing
- Specific improvements

---

### 3. College Preferences Panel (`CollegePreferencesGuide.tsx`)

**Location**: `src/components/portfolio/commonApp/workshop/CollegePreferencesGuide.tsx`

**Purpose**: Show what this college loves/hates in essays

**Props**:
```typescript
interface CollegePreferencesGuideProps {
  collegeId: string;
  defaultExpanded?: boolean;
}
```

**Data to Use**:
```typescript
import { getCollege } from '@/data/commonAppColleges';

const college = getCollege(collegeId);
const prefs = college.preferences;

// Available:
prefs.essay_priorities  // Array: What they love
prefs.red_flags        // Array: What to avoid
prefs.preferred_tone   // Array: Good tones
prefs.avoid_tone       // Array: Bad tones
prefs.structure_notes  // String: Overall tips
```

**UI Layout**:
```
╔════════════════════════════════════════╗
║  Stanford Essay Preferences            ║
╠════════════════════════════════════════╣
║  ✅ WHAT STANFORD LOVES                ║
║  • Intellectual vitality above all     ║
║  • Self-directed learning              ║
║  • Specificity over generality         ║
║  • Authenticity over achievement       ║
║                                        ║
║  ❌ WHAT TO AVOID                      ║
║  • Classroom-bounded learning          ║
║  • Prestige-focused reasons            ║
║  • Generic reasons                     ║
║                                        ║
║  🎯 TONE                               ║
║  Prefer: Authentic, curious, reflective║
║  Avoid: Trying to impress, formal      ║
╚════════════════════════════════════════╝
```

---

### 4. Essay Type Guide (`EssayTypeGuide.tsx`)

**Location**: `src/components/portfolio/commonApp/workshop/EssayTypeGuide.tsx`

**Purpose**: Show type-specific guidance (what makes this type work)

**Props**:
```typescript
interface EssayTypeGuideProps {
  collegeId: string;
  supplementalId: string;
}
```

**Data to Use**:
```typescript
import { getSupplemental } from '@/data/commonAppColleges';
import { getSupplementalTypeInfo } from '@/data/commonAppSupplementalTypes';

const supp = getSupplemental(collegeId, supplementalId);
const typeInfo = getSupplementalTypeInfo(supp.type);

// Available:
typeInfo.name               // "Intellectual Curiosity"
typeInfo.description        // What this type is
typeInfo.common_pitfalls    // Array of pitfalls
typeInfo.evaluation_criteria // What's required

supp.analysisHints.key_elements     // Required for THIS essay
supp.analysisHints.red_flags        // Avoid for THIS essay
supp.analysisHints.elite_patterns   // 90+ patterns
```

**UI Layout**:
```
╔════════════════════════════════════════╗
║  "Why Stanford?" Essay Guide           ║
║  Type: Intellectual Curiosity          ║
╠════════════════════════════════════════╣
║  📖 REQUIRED ELEMENTS:                 ║
║  ✓ Specific idea or experience         ║
║  ✓ Self-directed learning              ║
║  ✓ Connection to Stanford              ║
║                                        ║
║  ⚠️  COMMON PITFALLS:                  ║
║  ✗ Classroom learning only             ║
║  ✗ Generic "love of learning"          ║
║                                        ║
║  🌟 ELITE PATTERNS (90+ essays):       ║
║  • Independent project/research        ║
║  • Cross-disciplinary connection       ║
║  • Specific Stanford resource          ║
║                                        ║
║  📊 Target: 100-250 words              ║
╚════════════════════════════════════════╝
```

---

### 5. Cross-College Comparison (`CrossCollegeComparison.tsx`)

**Location**: `src/components/portfolio/commonApp/workshop/CrossCollegeComparison.tsx`

**Purpose**: Compare how different colleges approach same essay type

**Props**:
```typescript
interface CrossCollegeComparisonProps {
  currentType: SupplementalType;
  currentCollegeId: string;
  isOpen: boolean;
  onClose: () => void;
}
```

**Data to Use**:
```typescript
import { COMMON_APP_COLLEGES } from '@/data/commonAppColleges';

// Find colleges with this type
const withType = COMMON_APP_COLLEGES.filter(college =>
  college.supplementals.some(s => s.type === currentType)
);

// For each college, show:
// - Core value weights
// - Key priorities
// - Word limit
// - Unique angles
```

**UI Layout (Modal)**:
```
╔════════════════════════════════════════╗
║  "Intellectual" Essays - Comparison    ║
╠════════════════════════════════════════╣
║  Stanford (250 words)                  ║
║  • 40% Intellectual Vitality           ║
║  • Values: Self-directed exploration   ║
║  • Unique: Independent projects        ║
║  ────────────────────────────────────  ║
║  Harvard (200 words)                   ║
║  • 35% Intellectual Engagement         ║
║  • Values: Scholarly depth             ║
║  • Unique: Academic community          ║
║  ────────────────────────────────────  ║
║  MIT (200 words)                       ║
║  • 35% Hands-On Creativity             ║
║  • Values: Making and building         ║
║  • Unique: Technical projects          ║
║  ────────────────────────────────────  ║
║  💡 Don't reuse essays directly!        ║
║  Each college has unique priorities.   ║
╚════════════════════════════════════════╝
```

---

### 6. Main Workshop Page (`CommonAppWorkshop.tsx`)

**Location**: `src/pages/CommonAppWorkshop.tsx`

**Base**: Clone from `src/pages/PIQWorkshop.tsx`

**Key Changes**:
```typescript
import { useParams } from 'react-router-dom';
import { getCollege, getSupplemental } from '@/data/commonAppColleges';
import { analyzeCommonAppEssay } from '@/services/commonAppWorkshop/commonAppAnalysisService';

// Get college/supplemental from URL
const { collegeId, supplementalId } = useParams();
const college = getCollege(collegeId || 'stanford');
const supplemental = getSupplemental(collegeId, supplementalId);

// Update header
<h1>{college.name}</h1>
<h2>{supplemental.title}</h2>
<p>{supplemental.wordLimit} words</p>

// Update navigation
<CommonAppCollegeNav
  currentCollegeId={collegeId}
  currentSupplementalId={supplementalId}
  onNavigate={(cId, sId) => navigate(`/common-app-workshop/${cId}/${sId}`)}
/>

// Update analysis call
const result = await analyzeCommonAppEssay({
  essay_text: currentDraft,
  college_id: collegeId,
  supplemental_id: supplementalId,
  user_id: userId
});

// NEW: Display college-specific components
<CoreValuesCard
  collegeId={collegeId}
  alignment={result?.collegeSpecific?.core_values_alignment}
/>

<CollegePreferencesGuide
  collegeId={collegeId}
/>

<EssayTypeGuide
  collegeId={collegeId}
  supplementalId={supplementalId}
/>
```

**Layout Structure**:
```
┌──────────────────────────────────────┐
│  Navigation (college selector)       │
├─────────────────────┬────────────────┤
│  Left (2/3 width)   │  Right (1/3)   │
│  ─────────────────  │  ────────────  │
│  Core Values Card   │  Preferences   │
│  Essay Type Guide   │  Panel         │
│  Editor             │                │
│  Rubric Dimensions  │  Chat          │
└─────────────────────┴────────────────┘
```

---

## 🎨 Visual Design Standards

### Colors:
- **Green** (85-100): `#10B981` - Excellent
- **Yellow** (70-84): `#F59E0B` - Good
- **Red** (<70): `#EF4444` - Needs work
- **Purple**: `#8B5CF6` - Primary brand
- **Gray**: Neutral elements

### Typography:
- Headings: Inter font, bold
- Body: Inter font, regular
- Code/essays: Monospace

### Spacing:
- Between major sections: `gap-6` (24px)
- Card padding: `p-6` (24px)
- Tight spacing: `gap-2` (8px)

### Components:
- Use shadcn/ui: Card, Button, Badge, etc.
- Smooth transitions: `transition-all duration-200`
- Hover states on interactive elements
- Loading skeletons for async data

---

## 📱 Responsive Design

### Breakpoints:
- **Mobile**: < 640px - Single column, collapsible panels
- **Tablet**: 640px - 1024px - Adaptive layout
- **Desktop**: > 1024px - Full 2-column layout

### Mobile Optimizations:
- College nav: Horizontal scroll with arrows
- Core values: Stack vertically, collapsible
- Preferences: Collapsible accordion
- Comparison: Bottom sheet modal
- Editor: Full width, sticky on scroll

---

## 🧪 Testing Guide

### Test Data Available:
```typescript
import { MOCK_ANALYSIS_RESULT } from '@/services/commonAppWorkshop/commonAppAnalysisService';

// Use for development without calling API
const result = MOCK_ANALYSIS_RESULT;
```

### Test Scenarios:
1. **Navigate colleges**: Stanford → Harvard → MIT
2. **Navigate supplementals**: "Why Stanford?" → "What Matters?" → "Roommate"
3. **Analysis flow**: Write essay → Analyze → See results
4. **Empty states**: No essay, no analysis
5. **Mobile**: Test all components on small screen

### URL Patterns:
- `/common-app-workshop/stanford/stanford_why_stanford`
- `/common-app-workshop/harvard/harvard_optional_1`
- `/common-app-workshop/mit/mit_community`

---

## ✅ Implementation Checklist

### Phase 1: Foundation (Day 1)
- [ ] Clone PIQ Workshop to `CommonAppWorkshop.tsx`
- [ ] Create `CommonAppCollegeNav.tsx`
- [ ] Add routing: `/common-app-workshop/:collegeId/:supplementalId`
- [ ] Test navigation works

### Phase 2: College Features (Day 2)
- [ ] Create `CoreValuesCard.tsx`
- [ ] Create `CollegePreferencesGuide.tsx`
- [ ] Create `EssayTypeGuide.tsx`
- [ ] Test data displays correctly

### Phase 3: Comparison & Polish (Day 3)
- [ ] Create `CrossCollegeComparison.tsx`
- [ ] Integrate all components into main page
- [ ] Add loading states
- [ ] Add error handling
- [ ] Mobile responsive

### Phase 4: Testing (Day 4)
- [ ] Test all colleges (Stanford, Harvard, MIT)
- [ ] Test all supplementals (9 total)
- [ ] Test on mobile
- [ ] Test empty states
- [ ] Performance optimization

---

## 🎯 Success Criteria

### Functionality:
- ✅ Can navigate between colleges
- ✅ Can navigate between supplementals within college
- ✅ Core values display with scores
- ✅ Preferences show college-specific guidance
- ✅ Essay type guide shows requirements
- ✅ Comparison modal works
- ✅ All data loads correctly

### Visual:
- ✅ Matches design system (shadcn/ui)
- ✅ Smooth animations
- ✅ Mobile responsive
- ✅ Loading states
- ✅ Error states
- ✅ Empty states

### Performance:
- ✅ Fast navigation (<100ms)
- ✅ Smooth scrolling
- ✅ No layout shifts
- ✅ Optimized re-renders

---

## 🚀 You're Ready!

**Everything you need**:
- ✅ Backend data files (import and use)
- ✅ Mock analysis service (for development)
- ✅ Component specifications
- ✅ Visual designs
- ✅ Test data

**Just build the UI - all backend logic is handled!**

Start with Phase 1 (Foundation) and work through each phase. Each component is independent and can be built/tested separately.

Good luck! 🎨
