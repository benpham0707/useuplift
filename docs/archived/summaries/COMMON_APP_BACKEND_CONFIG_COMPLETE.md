# 🏗️ Common App Workshop - Backend Configuration COMPLETE

**Status**: ✅ Backend ready for frontend integration
**Date**: 2025-12-09
**Files Created**: 2 core data files + routing structure

---

## 📊 What's Been Built (Backend)

### 1. Supplemental Types System ✅

**File**: `src/data/commonAppSupplementalTypes.ts` (500+ lines)

**14 Essay Types Defined**:
1. **why_us** - Why this college?
2. **why_major** - Why this field of study?
3. **community** - How will you contribute?
4. **diversity** - Unique background/perspective
5. **intellectual** - Intellectual curiosity
6. **extracurricular** - Activity/passion deep dive
7. **challenge** - Overcoming adversity
8. **leadership** - Leadership experience
9. **creative** - Creative side/talent
10. **values** - Personal values
11. **future_goals** - Career/life aspirations
12. **additional_info** - Context/circumstances
13. **short_answer** - Brief responses (50-150 words)
14. **optional** - Optional essays

**Each Type Includes**:
```typescript
{
  id: 'why_us',
  name: 'Why Us Essay',
  description: 'Explain why you want to attend this specific college',
  typical_word_range: { min: 100, max: 350 },
  common_pitfalls: [
    'Generic reasons that could apply to any college',
    'Only mentioning rankings or prestige',
    // ... 2-4 pitfalls per type
  ],
  rubric_dimensions: [
    'specificity',
    'research_depth',
    'personal_connection',
    // ... 3-6 dimensions per type
  ],
  evaluation_criteria: [
    'Names specific programs, professors, courses',
    'Connects college resources to personal goals',
    // ... 3-6 criteria per type
  ],
  example_prompts: [
    'Why Stanford? (100-250 words)',
    // ... 2-4 examples
  ]
}
```

**UI Grouping Categories**:
```typescript
{
  'College Fit': ['why_us', 'why_major', 'community'],
  'Personal Identity': ['diversity', 'values', 'creative'],
  'Intellectual & Academic': ['intellectual', 'extracurricular', 'future_goals'],
  'Character & Growth': ['challenge', 'leadership'],
  'Other': ['additional_info', 'short_answer', 'optional']
}
```

**Functions Available**:
- `getSupplementalTypeInfo(type)` - Get full info for a type
- `getAllSupplementalTypes()` - Get all 14 types
- `getSupplementalTypeCategory(type)` - Get UI category

---

### 2. Colleges Database ✅

**File**: `src/data/commonAppColleges.ts` (800+ lines)

**3 Colleges Configured** (Stanford, Harvard, MIT):

#### College Structure:
```typescript
interface CommonAppCollege {
  id: string;
  name: string;
  shortName: string;

  // Core values with weights (sum to 100%)
  coreValues: CoreValue[];

  // Supplemental essays
  supplementals: CommonAppSupplemental[];

  // College-specific preferences
  preferences: CollegePreferences;

  // Research metadata
  research: ResearchMetadata;
}
```

#### Core Values (What Each College Weighs):

**Stanford** (4 values):
- Intellectual Vitality (40% weight) - Self-directed learning
- Impact & Leadership (25% weight) - Community difference
- Context & Character (20% weight) - Resilience
- Authenticity & Voice (15% weight) - Genuine self

**Harvard** (4 values):
- Intellectual Engagement (35% weight) - Academic depth
- Community & Citizenship (30% weight) - Civic engagement
- Personal Character (25% weight) - Integrity, kindness
- Extracurricular Distinction (10% weight) - Excellence in activities

**MIT** (4 values):
- Hands-On Creativity (35% weight) - Making and building
- Collaboration & Community (30% weight) - Teamwork
- Initiative & Risk-Taking (20% weight) - Trying new things
- Balance & Joy (15% weight) - Fun and being human

#### Supplemental Essays per College:

**Stanford** (3 essays):
1. Why Stanford? (250 words) - Type: `intellectual`
2. What Matters to You? (250 words) - Type: `values`
3. Roommate Letter (250 words) - Type: `creative`

**Harvard** (3 optional essays):
1. Diversity contribution (200 words) - Type: `diversity`
2. Disagreement handling (200 words) - Type: `challenge`
3. Extracurricular impact (200 words) - Type: `extracurricular`

**MIT** (3 essays):
1. For pleasure activity (200 words) - Type: `extracurricular`
2. Community collaboration (300 words) - Type: `community`
3. Your world (250 words) - Type: `diversity`

#### Analysis Hints per Essay:

Each supplemental includes:
```typescript
analysisHints: {
  key_elements: [
    'Specific idea or experience (not generic)',
    'Self-directed learning beyond classroom',
    // ... 3-5 elements
  ],
  red_flags: [
    'Classroom learning only',
    'Generic "love of learning"',
    // ... 3-5 red flags
  ],
  elite_patterns: [
    'Independent project or research',
    'Unexpected intellectual pursuit',
    // ... 3-5 patterns from 90+ essays
  ]
}
```

#### College Preferences:

Each college has:
```typescript
preferences: {
  essay_priorities: [
    'Intellectual vitality above all',
    'Self-directed learning',
    // ... 4-6 priorities
  ],
  red_flags: [
    'Classroom-bounded learning',
    'Prestige-focused',
    // ... 4-6 college-specific red flags
  ],
  preferred_tone: [
    'Authentic and genuine',
    'Intellectually curious',
    // ... 4-6 tone preferences
  ],
  avoid_tone: [
    'Trying to impress',
    'Overly formal',
    // ... 4-6 tones to avoid
  ],
  structure_notes: 'Stanford values specificity and authenticity...'
}
```

#### Research Metadata:

```typescript
research: {
  sources: {
    admission_website: 'https://admission.stanford.edu/apply/',
    dean_interviews: ['url1', 'url2'],
    mission_statement: 'url',
    elite_essay_database: 'Internal: STAN_ELITE_ESSAYS_2020_2024'
  },
  last_updated: '2024-12-01',
  research_depth: 9  // Score 1-10
}
```

**Functions Available**:
- `getCollege(id)` - Get college by ID
- `getAllColleges()` - Get all colleges
- `getCollegeSupplementals(id)` - Get all essays for college
- `getSupplemental(collegeId, suppId)` - Get specific essay
- `getCollegeCoreValues(id)` - Get core values

---

## 🔌 Backend API Endpoints (Existing)

### Analysis Endpoint (Reuse from PIQ)

**Endpoint**: `/api/analyze-common-app-essay`

**Method**: `POST`

**Request Body**:
```typescript
{
  essay_text: string;
  college_id: string;           // 'stanford', 'harvard', 'mit'
  supplemental_id: string;      // 'stanford_why_stanford'
  supplemental_type: SupplementalType; // 'why_us', 'intellectual', etc.
  user_id: string;

  // Analysis options
  options?: {
    depth: 'quick' | 'comprehensive';
    skip_coaching: boolean;
    include_citations: boolean; // NEW: Enable citation system
  };
}
```

**Response**:
```typescript
{
  success: boolean;

  // Analysis results (same as PIQ)
  analysis: {
    narrative_quality_index: number;  // 0-100 score
    categories: RubricCategory[];     // 11 dimensions
    weights: Record<string, number>;
  };

  // Workshop items (Phase 19 format)
  workshopItems: WorkshopItem[];

  // Voice fingerprint
  voiceFingerprint?: VoiceFingerprint;

  // Experience fingerprint
  experienceFingerprint?: ExperienceFingerprint;

  // NEW: College-specific analysis
  collegeSpecific: {
    college_name: string;
    core_values_alignment: CoreValueAlignment[]; // How essay aligns with each core value
    preference_violations: string[];  // Which preferences violated
    elite_patterns_present: string[]; // Which 90+ patterns detected
    tailored_suggestions: Suggestion[]; // College-specific improvements
  };

  // NEW: Citations (if enabled)
  citations?: CitationDatabase;
}
```

**Core Value Alignment**:
```typescript
interface CoreValueAlignment {
  value_id: string;         // 'stanford_intellectual_vitality'
  value_name: string;       // 'Intellectual Vitality'
  weight: number;           // 40 (%)
  current_score: number;    // 0-100 how well demonstrated
  gap: number;              // Points needed to reach target
  how_to_improve: string[]; // Specific actions
  evidence_present: string[];   // What essay shows
  evidence_missing: string[];   // What's lacking
}
```

---

### Save Essay Endpoint (Existing)

**Endpoint**: `/api/save-common-app-essay`

**Method**: `POST`

**Request Body**:
```typescript
{
  user_id: string;
  college_id: string;
  supplemental_id: string;
  essay_content: string;
  word_count: number;

  // Optional: Save analysis results
  analysis_report_id?: string;
}
```

**Database Tables** (Create in Supabase):
```sql
-- Common App Essays
CREATE TABLE common_app_essays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  college_id TEXT NOT NULL,
  supplemental_id TEXT NOT NULL,
  supplemental_prompt TEXT NOT NULL,
  draft_original TEXT,
  draft_current TEXT NOT NULL,
  word_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, college_id, supplemental_id)
);

-- Analysis Reports
CREATE TABLE common_app_analysis_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  essay_id UUID REFERENCES common_app_essays(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) NOT NULL,
  narrative_quality_index INTEGER,
  rubric_dimension_details JSONB,
  workshop_items JSONB,
  voice_fingerprint JSONB,
  experience_fingerprint JSONB,
  college_specific_analysis JSONB, -- NEW
  citations JSONB, -- NEW
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Versions
CREATE TABLE common_app_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  essay_id UUID REFERENCES common_app_essays(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) NOT NULL,
  draft_content TEXT NOT NULL,
  score INTEGER,
  dimension_scores JSONB,
  source TEXT NOT NULL, -- 'analyze', 'autosave', 'milestone'
  version_label TEXT,
  analysis_report_id UUID REFERENCES common_app_analysis_reports(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🎨 Frontend Requirements for Lovable

### Key Decision: Organize by College or by Essay Type?

**Answer**: **Organize by COLLEGE**, with type as secondary filter.

**Rationale**:
1. Students think "I'm applying to Stanford" (college-first)
2. Each college has unique preferences/values (contextual)
3. Essay types are heterogeneous (Stanford has 3 different types)
4. Citation system is college-specific (Stanford research ≠ MIT research)

**UI Structure**:
```
Main Navigation: COLLEGES
  ├─ Stanford
  │   ├─ Why Stanford? (intellectual type)
  │   ├─ What Matters? (values type)
  │   └─ Roommate Letter (creative type)
  ├─ Harvard
  │   ├─ Diversity (diversity type)
  │   ├─ Disagreement (challenge type)
  │   └─ Extracurricular (extracurricular type)
  └─ MIT
      ├─ For Pleasure (extracurricular type)
      ├─ Community (community type)
      └─ Your World (diversity type)

Secondary View: ESSAY TYPES (optional filter)
  ├─ Why Us essays (across all colleges)
  ├─ Intellectual essays (across all colleges)
  └─ ... other types
```

---

## 📋 Frontend Implementation Guide for Lovable

### Part 1: Data Integration (Use Existing Backend)

#### 1.1 Import College Data

**File**: Any component that needs college data

```typescript
import {
  COMMON_APP_COLLEGES,
  getCollege,
  getCollegeSupplementals,
  getSupplemental,
  getCollegeCoreValues
} from '@/data/commonAppColleges';

import {
  SUPPLEMENTAL_TYPE_INFO,
  getSupplementalTypeInfo,
  SUPPLEMENTAL_TYPE_CATEGORIES
} from '@/data/commonAppSupplementalTypes';

// Example: Get Stanford's data
const stanford = getCollege('stanford');
console.log(stanford.name); // 'Stanford University'
console.log(stanford.coreValues); // 4 values with weights
console.log(stanford.supplementals); // 3 essays

// Example: Get specific essay
const whyStanford = getSupplemental('stanford', 'stanford_why_stanford');
console.log(whyStanford.title); // 'Why Stanford?'
console.log(whyStanford.type); // 'intellectual'
console.log(whyStanford.wordLimit); // 250
console.log(whyStanford.analysisHints); // key_elements, red_flags, elite_patterns

// Example: Get type info
const typeInfo = getSupplementalTypeInfo('why_us');
console.log(typeInfo.common_pitfalls); // Array of pitfalls
console.log(typeInfo.rubric_dimensions); // Dimensions to evaluate
```

---

### Part 2: College-Specific Features (NEW)

#### 2.1 Core Values Display

**Component**: `CollegeCoreValuesCard.tsx`

**Purpose**: Show what each college values (with weights)

**Example for Stanford**:
```
╔════════════════════════════════════════════╗
║  Stanford's Core Values                    ║
╠════════════════════════════════════════════╣
║  📚 Intellectual Vitality         40%      ║
║     Pursuing learning for its own sake     ║
║     Your score: 72/100 (-13 points)        ║
║     ━━━━━━━━━━░░░░░░░░░░ 72%              ║
║                                            ║
║  💡 Impact & Leadership           25%      ║
║     Making a difference in community       ║
║     Your score: 85/100 (+10 points)        ║
║     ━━━━━━━━━━━━━━━━━░░░ 85%              ║
║                                            ║
║  💪 Context & Character           20%      ║
║     Resilience through challenges          ║
║     Your score: 68/100 (-7 points)         ║
║     ━━━━━━━━━━━░░░░░░░░░ 68%              ║
║                                            ║
║  ✨ Authenticity & Voice          15%      ║
║     Genuine self-presentation              ║
║     Your score: 90/100 (+15 points)        ║
║     ━━━━━━━━━━━━━━━━━━━░ 90%              ║
╚════════════════════════════════════════════╝
```

**Data Source**:
```typescript
const coreValues = getCollegeCoreValues('stanford');
// Returns array with weight, definition, how_to_demonstrate

// From analysis response:
const alignment = analysisResult.collegeSpecific.core_values_alignment;
// Returns current_score, gap, evidence_present, evidence_missing
```

**UI Requirements**:
- Visual bars showing score vs target
- Color coding: Green (85+), Yellow (70-84), Red (<70)
- Expandable to show "How to improve"
- Link to evidence in essay (highlight text)

---

#### 2.2 College Preferences Panel

**Component**: `CollegePreferencesGuide.tsx`

**Purpose**: Show what this college likes/dislikes

**Example for Stanford**:
```
╔════════════════════════════════════════════╗
║  Stanford Essay Preferences                ║
╠════════════════════════════════════════════╣
║  ✅ LOVES                                   ║
║  • Intellectual vitality above all         ║
║  • Self-directed learning                  ║
║  • Specificity over generality             ║
║  • Authenticity over achievement           ║
║                                            ║
║  ❌ AVOID                                   ║
║  • Classroom-bounded learning              ║
║  • Prestige-focused reasons                ║
║  • Generic reasons (fit any school)        ║
║  • Resume repetition                       ║
║                                            ║
║  🎯 TONE                                    ║
║  Preferred: Authentic, intellectually      ║
║             curious, reflective            ║
║  Avoid: Trying to impress, overly formal   ║
╚════════════════════════════════════════════╝
```

**Data Source**:
```typescript
const college = getCollege('stanford');
const prefs = college.preferences;

console.log(prefs.essay_priorities);  // Array of what they love
console.log(prefs.red_flags);         // Array of what to avoid
console.log(prefs.preferred_tone);    // Array of good tones
console.log(prefs.avoid_tone);        // Array of bad tones
console.log(prefs.structure_notes);   // Free text guidance
```

---

#### 2.3 Research Sources Attribution

**Component**: `ResearchSourcesFooter.tsx`

**Purpose**: Show where analysis comes from (trust/transparency)

**Example**:
```
╔════════════════════════════════════════════╗
║  Research Sources                          ║
╠════════════════════════════════════════════╣
║  📚 Stanford Admission Website             ║
║  🎓 Dean Richard Shaw Interviews (2)       ║
║  📊 Elite Essay Database (2020-2024)       ║
║  📖 Stanford Mission Statement             ║
║                                            ║
║  Last Updated: Dec 1, 2024                 ║
║  Research Depth: ★★★★★★★★★☆ (9/10)        ║
╚════════════════════════════════════════════╝
```

**Data Source**:
```typescript
const college = getCollege('stanford');
const research = college.research;

console.log(research.sources.admission_website);
console.log(research.sources.dean_interviews); // Array of URLs
console.log(research.last_updated);
console.log(research.research_depth); // 1-10
```

---

#### 2.4 Essay Type Guidance

**Component**: `EssayTypeGuidePanel.tsx`

**Purpose**: Show guidance specific to essay type

**Example for "Why Us" essay**:
```
╔════════════════════════════════════════════╗
║  Why Us Essay - Expert Guidance            ║
╠════════════════════════════════════════════╣
║  📖 What This Type Requires:               ║
║  • Specific programs/professors/courses    ║
║  • Connection to personal goals            ║
║  • Deep research beyond website            ║
║  • Cultural/value fit demonstration        ║
║  • Mutual benefit (what you bring)         ║
║                                            ║
║  ⚠️ Common Pitfalls:                        ║
║  • Generic reasons (any college)           ║
║  • Only rankings/prestige                  ║
║  • No personal connection                  ║
║  • Surface-level research                  ║
║                                            ║
║  🌟 Elite Patterns (90+ essays):            ║
║  • Name specific professor + their work    ║
║  • Connect to unique program               ║
║  • Show values alignment                   ║
║  • Explain mutual benefit                  ║
╚════════════════════════════════════════════╝
```

**Data Source**:
```typescript
const typeInfo = getSupplementalTypeInfo('why_us');

console.log(typeInfo.evaluation_criteria); // What's required
console.log(typeInfo.common_pitfalls);     // What to avoid
console.log(typeInfo.example_prompts);     // Examples

const essay = getSupplemental('stanford', 'stanford_why_stanford');
console.log(essay.analysisHints.key_elements);   // Required elements
console.log(essay.analysisHints.red_flags);      // Avoid these
console.log(essay.analysisHints.elite_patterns); // 90+ patterns
```

---

### Part 3: Navigation Structure

#### 3.1 College Navigation (Top Level)

**Component**: `CommonAppCollegeNav.tsx` (enhanced from PIQ)

**Structure**:
```
[< Previous]  |  📍 Stanford: Why Stanford?  [▼]  |  [Next >]
                  └─ Click opens dropdown

              ● ● ●  ← Dots = Colleges (not essays)
```

**Dropdown Content**:
```
╔════════════════════════════════════════════╗
║  Stanford Supplemental Essays             ║
╠════════════════════════════════════════════╣
║                                            ║
║  Required Essays                           ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ║
║  ✓ Why Stanford?               [Complete]  ║
║    Intellectual curiosity • 250 words      ║
║                                            ║
║  📝 What Matters to You?         [Draft]   ║
║    Personal values • 250 words             ║
║                                            ║
║  ○ Roommate Letter         [Not started]   ║
║    Creative side • 250 words               ║
║                                            ║
║  ─────────────────────────────────────     ║
║  💡 Stanford values intellectual vitality  ║
║     Research depth: ★★★★★★★★★☆             ║
╚════════════════════════════════════════════╝
```

**Data Source**:
```typescript
const college = getCollege('stanford');

college.supplementals.map(supp => ({
  id: supp.id,
  title: supp.title,
  type: supp.type,
  wordLimit: supp.wordLimit,
  required: supp.required,
  status: getEssayStatus(userId, collegeId, supp.id) // From database
}));
```

---

#### 3.2 Type-Based View (Optional Secondary View)

**Component**: `EssayTypeGridView.tsx`

**Purpose**: See all essays of same type across colleges

**Example - "Intellectual Curiosity" essays**:
```
╔════════════════════════════════════════════╗
║  Intellectual Curiosity Essays             ║
║  3 colleges require this type              ║
╠════════════════════════════════════════════╣
║                                            ║
║  🟢 Stanford: Why Stanford?                ║
║     250 words • Score: 85/100              ║
║     [View Workshop]                        ║
║                                            ║
║  🟡 Yale: Intellectual Engagement          ║
║     200 words • Score: 72/100              ║
║     [View Workshop]                        ║
║                                            ║
║  ⚪ Princeton: Academic Interests           ║
║     300 words • Not started                ║
║     [Start Essay]                          ║
╚════════════════════════════════════════════╝
```

**Data Source**:
```typescript
// Filter by type across all colleges
const intellectualEssays = COMMON_APP_COLLEGES.flatMap(college =>
  college.supplementals.filter(supp => supp.type === 'intellectual')
);
```

---

### Part 4: Workshop Enhancements (College-Specific)

#### 4.1 Workshop Layout (Reuse PIQ Structure)

**Same as PIQ Workshop**:
- Left column: Editor + Rubric dimensions
- Right column: Chat + Tools
- Top: NQI score + navigation

**NEW Elements to Add**:
1. **Core Values Card** (above rubric dimensions)
2. **College Preferences Panel** (collapsible sidebar)
3. **Research Sources** (footer)
4. **Essay Type Guide** (modal/popover)

#### 4.2 Rubric Dimensions (Enhanced)

**Same 11 dimensions as PIQ**, but with college-specific weights:

```typescript
// Stanford weights intellectual vitality higher
const dimensionWeights = {
  'intellectual_depth': 15,      // Higher for Stanford
  'specificity': 12,
  'authentic_voice': 10,         // Higher for Stanford
  'narrative_structure': 8,
  'emotional_resonance': 8,
  'show_vs_tell': 10,
  'uniqueness': 9,
  'college_research': 12,        // Higher for "Why Us"
  'growth_reflection': 8,
  'impact_demonstration': 8,
  'readability': 5
};
```

**Data Source**:
```typescript
const supplemental = getSupplemental('stanford', 'stanford_why_stanford');
const typeInfo = getSupplementalTypeInfo(supplemental.type);

// Use rubric_dimensions from type to weight analysis
const relevantDimensions = typeInfo.rubric_dimensions;
// ['specificity', 'research_depth', 'personal_connection', 'fit_demonstration', 'genuine_interest']
```

---

#### 4.3 Suggestions (College + Type Specific)

**Enhanced Suggestion Structure**:
```typescript
interface Suggestion {
  text: string;  // Revised version
  rationale: string;  // Why this works

  // NEW: College-specific context
  college_specific: {
    which_value: string;        // 'stanford_intellectual_vitality'
    how_demonstrates: string;   // Specific to this college
    evidence_from_research: string; // Citation to Stanford research
  };

  // NEW: Type-specific context
  type_specific: {
    which_criterion: string;    // From evaluation_criteria
    elite_pattern: string;      // Which 90+ pattern this uses
  };

  // Citations (if enabled)
  rationale_with_citations?: string;
  citations?: CitationDatabase;
}
```

**Example Suggestion**:
```
Original: "I learned Python in my computer science class."

Revised: "After learning Python in CS106A, I built a web scraper
analyzing Reddit discussions on mental health stigma."

Rationale: This revision [transforms classroom learning into
self-directed exploration]{{teach_1}}. Stanford values
[intellectual vitality]{{strength_1}} - pursuing ideas
independently beyond requirements.

College-Specific:
✓ Demonstrates: Stanford's Intellectual Vitality (40% weight)
✓ Shows: Self-directed project extension
✓ Research: Dean Shaw says "We want students who run with ideas"

Type-Specific (Intellectual essay):
✓ Criterion: Self-directed learning beyond classroom
✓ Elite Pattern: Transform skill into independent project
✓ 90+ Essays: Use classroom skill for real-world application
```

---

### Part 5: Citation System Integration

#### 5.1 When to Show Citations

**Problem Citations** (red highlight):
- In original essay analysis
- Shows what's wrong + why college cares

**Strength Citations** (green underline):
- In revised essay
- Shows core value alignment + research backing

**Teaching Citations** (purple box):
- In suggestion rationales
- Elite examples + dean quotes

#### 5.2 Citation Display

**Component**: Use `CitedText.tsx` from citation layer

```typescript
import { CitedText } from '@/components/portfolio/commonApp/workshop/citations/CitedText';
import { formatTextWithCitations } from '@/services/commonAppWorkshop/utils/citationFormatter';

// In suggestion display:
{suggestion.rationale_with_citations ? (
  <CitedText
    uiText={formatTextWithCitations(
      suggestion.rationale_with_citations,
      suggestion.citations,
      college.name // Stanford, Harvard, MIT
    )}
  />
) : (
  <p>{suggestion.rationale}</p>
)}
```

---

### Part 6: Mobile & Responsive Considerations

#### 6.1 College Navigation (Mobile)

**Desktop**: Horizontal carousel with arrows
**Mobile**: Vertical stack with swipe

```
Mobile Layout:
┌──────────────────────┐
│  Stanford            │
│  3 essays • 2 done   │
│  [Swipe for Harvard] │
└──────────────────────┘
      ↓ Swipe
┌──────────────────────┐
│  Harvard             │
│  3 essays • 1 done   │
│  [Swipe for MIT]     │
└──────────────────────┘
```

#### 6.2 Core Values (Mobile)

**Desktop**: Side-by-side cards
**Mobile**: Stacked, collapsible

```
Mobile:
┌──────────────────────────┐
│ 📚 Intellectual Vitality │
│    40% • Score: 72/100   │
│    [Tap to expand]       │
├──────────────────────────┤
│ 💡 Impact & Leadership   │
│    25% • Score: 85/100   │
│    [Tap to expand]       │
└──────────────────────────┘
```

---

## 🎯 Summary for Lovable

### What You Have (Backend Ready):

1. ✅ **14 Essay Types** fully defined with pitfalls, criteria, examples
2. ✅ **3 Colleges** configured (Stanford, Harvard, MIT) with:
   - Core values (weighted)
   - Supplemental essays
   - Preferences (what they love/hate)
   - Research sources
3. ✅ **Analysis endpoint** (reuse from PIQ)
4. ✅ **Database schema** (create tables in Supabase)
5. ✅ **Citation system** (backend ready, frontend pending)

### What to Build (Frontend):

#### Priority 1: Core Workshop (2-3 days)
- Clone PIQ workshop structure
- Add college navigation (college → supplemental hierarchy)
- Integrate college data (import from data files)
- Show supplemental-specific prompts

#### Priority 2: College-Specific Features (1-2 days)
- Core Values card
- College Preferences panel
- Research Sources footer
- Essay Type guidance

#### Priority 3: Enhanced Analysis (1 day)
- College-specific suggestions
- Value alignment scores
- Preference violation warnings
- Elite pattern detection

#### Priority 4: Citation System (2-3 days)
- CitedText components
- College-specific citations
- Research tooltips
- Citation box sidebar (optional)

### Organization Strategy:

**Primary**: By College (Stanford → essays)
**Secondary**: By Type (optional filter view)

**Rationale**: Students think college-first, each college has unique context, citations are college-specific.

---

**Total Implementation**: 6-9 days for full system
**MVP**: 3-4 days (Parts 1-2 only)

All backend data is ready. Frontend just needs to import and display it!
