# 📋 Lovable Implementation Prompts - Copy & Paste

**Instructions**: Copy each prompt exactly and send to Lovable one at a time. Wait for completion before moving to next part.

---

## Part 1: Data Files Setup (Copy Backend Data)

```
PART 1: CREATE BACKEND DATA FILES

Create these 2 files with the exact content I'll provide:

1. Create file: src/data/commonAppSupplementalTypes.ts
2. Create file: src/data/commonAppColleges.ts

I'll paste the full content for each file in follow-up messages.

These files contain:
- 14 supplemental essay types with pitfalls, criteria, and guidance
- 3 colleges (Stanford, Harvard, MIT) with core values, preferences, and research
- All helper functions for accessing this data

Just create the files exactly as provided - no modifications needed.
```

**After Lovable confirms**, paste the content of:
1. First: `src/data/commonAppSupplementalTypes.ts`
2. Second: `src/data/commonAppColleges.ts`

---

## Part 2: Database Schema (Supabase Tables)

```
PART 2: CREATE DATABASE TABLES IN SUPABASE

Create these 3 tables in our Supabase database:

1. TABLE: common_app_essays
   - Stores student essays for each college supplemental
   - One row per user per college per supplemental

2. TABLE: common_app_analysis_reports
   - Stores analysis results (NQI scores, rubric dimensions, workshop items)
   - Links to essays table

3. TABLE: common_app_versions
   - Stores version history for each essay
   - Tracks autosaves, milestones, and analysis versions

Here is the exact SQL to run:

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

CREATE INDEX idx_common_app_essays_user_college
  ON common_app_essays(user_id, college_id);

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
  college_specific_analysis JSONB,
  citations JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_common_app_analysis_user
  ON common_app_analysis_reports(user_id);

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

CREATE INDEX idx_common_app_versions_essay
  ON common_app_versions(essay_id);
```

Run this SQL in Supabase SQL Editor and confirm tables are created.
```

---

## Part 3: Clone PIQ Workshop Base

```
PART 3: CLONE PIQ WORKSHOP AS COMMON APP WORKSHOP

Goal: Create a perfect 1:1 clone of the PIQ Workshop for Common App.

Tasks:

1. CREATE NEW FILE: src/pages/CommonAppWorkshop.tsx
   - Copy ENTIRE contents from src/pages/PIQWorkshop.tsx
   - Rename component from PIQWorkshop to CommonAppWorkshop
   - Keep ALL functionality identical (state, database, analysis, chat)
   - Do NOT make any changes yet - just clone it

2. CREATE NEW FILE: src/components/portfolio/commonApp/workshop/CommonAppWorkshopIntegrated.tsx
   - Copy from src/components/portfolio/piq/workshop/PIQWorkshopIntegrated.tsx
   - Rename component to CommonAppWorkshopIntegrated
   - Keep all functionality identical

3. CREATE FOLDER: src/components/portfolio/commonApp/workshop/
   - This will hold all Common App workshop components

4. ADD ROUTE: Add to your routing configuration
   - Path: /common-app-workshop/:collegeId/:supplementalId
   - Component: CommonAppWorkshop

IMPORTANT:
- Do NOT modify the cloned code yet
- Keep everything identical to PIQ Workshop
- We'll make changes in next parts
- Just get a working clone first

Test: Navigate to /common-app-workshop/test/test and verify page loads without errors.
```

---

## Part 4: College Navigation Component

```
PART 4: CREATE COLLEGE NAVIGATION COMPONENT

Create a navigation component for switching between colleges and their supplementals.

CREATE FILE: src/components/portfolio/commonApp/workshop/CommonAppCollegeNav.tsx

Requirements:

1. STRUCTURE:
   - Previous/Next arrows to switch colleges
   - Center: Current college + supplemental name with dropdown
   - Dot indicators below (one dot per college, not per essay)

2. DROPDOWN CONTENT:
   When clicking college name, show dropdown with:
   - All supplemental essays for that college
   - Each essay shows: title, word count, type, status (complete/draft/not started)
   - Required vs optional badge
   - Click to navigate to that supplemental

3. DATA SOURCE:
   Import from data files:
   ```typescript
   import { COMMON_APP_COLLEGES, getCollege, getCollegeSupplementals } from '@/data/commonAppColleges';
   ```

4. PROPS:
   ```typescript
   interface CommonAppCollegeNavProps {
     currentCollegeId: string;
     currentSupplementalId: string;
     onNavigate: (collegeId: string, supplementalId: string) => void;
     essayStatus?: Record<string, 'empty' | 'draft' | 'complete'>;
   }
   ```

5. VISUAL DESIGN:
   - Clone the style from PIQCarouselNav.tsx
   - Use gradient text for college/essay name (purple gradient)
   - Status badges: Green (complete), Amber (draft), Gray (not started)
   - Dropdown should show college logo (if available) and research depth

6. NAVIGATION LOGIC:
   - Previous/Next switches to different colleges
   - Dropdown switches supplementals within same college
   - Dots represent colleges (3 dots for Stanford/Harvard/MIT)
   - URL updates: /common-app-workshop/stanford/why_stanford

REFERENCE: Base this on PIQCarouselNav.tsx but enhance for 2-level navigation (college → supplemental).

Make it visually beautiful with smooth animations and clear hierarchy.
```

---

## Part 5: Update Main Workshop Page

```
PART 5: UPDATE COMMONAPPWORKSHOP.TSX WITH COLLEGE DATA

Update the cloned CommonAppWorkshop.tsx to use college data.

Changes to make:

1. ADD IMPORTS at top:
   ```typescript
   import { useParams } from 'react-router-dom';
   import { getCollege, getSupplemental } from '@/data/commonAppColleges';
   import { getSupplementalTypeInfo } from '@/data/commonAppSupplementalTypes';
   import { CommonAppCollegeNav } from '@/components/portfolio/commonApp/workshop/CommonAppCollegeNav';
   ```

2. REPLACE PROMPT STATE:
   Find where PIQ sets prompt, replace with:
   ```typescript
   const { collegeId, supplementalId } = useParams<{
     collegeId: string;
     supplementalId: string;
   }>();

   const currentCollege = getCollege(collegeId || 'stanford');
   const currentSupplemental = getSupplemental(
     collegeId || 'stanford',
     supplementalId || 'stanford_why_stanford'
   );
   const typeInfo = getSupplementalTypeInfo(currentSupplemental?.type || 'why_us');
   ```

3. UPDATE NAVIGATION:
   Replace PIQ navigation component with:
   ```typescript
   <CommonAppCollegeNav
     currentCollegeId={collegeId || 'stanford'}
     currentSupplementalId={supplementalId || 'stanford_why_stanford'}
     onNavigate={(newCollegeId, newSuppId) => {
       navigate(`/common-app-workshop/${newCollegeId}/${newSuppId}`);
     }}
     essayStatus={essayStatusMap}
   />
   ```

4. UPDATE HEADER:
   Show college name + supplemental title:
   ```typescript
   <h1>{currentCollege?.name}</h1>
   <h2>{currentSupplemental?.title}</h2>
   <p>{currentSupplemental?.wordLimit} words</p>
   ```

5. UPDATE ANALYSIS CALL:
   When calling analysis, pass college/supplemental context:
   ```typescript
   const result = await analyzeEssay(
     currentDraft,
     currentSupplemental?.title || '',
     currentSupplemental?.prompt || '',
     collegeId,
     supplementalId,
     currentSupplemental?.type
   );
   ```

6. UPDATE DATABASE LOADING:
   Load essay based on collegeId + supplementalId (not promptId).

IMPORTANT: Each college/supplemental combination should have its own independent data storage.

Test: Navigate to /common-app-workshop/stanford/stanford_why_stanford and verify it loads Stanford's data.
```

---

## Part 6: Core Values Display Card

```
PART 6: CREATE CORE VALUES CARD COMPONENT

Create a card that displays the college's core values with alignment scores.

CREATE FILE: src/components/portfolio/commonApp/workshop/CoreValuesCard.tsx

Purpose: Show what the college values most and how the essay aligns with each value.

Requirements:

1. DISPLAY FOR EACH CORE VALUE:
   - Value name (e.g., "Intellectual Vitality")
   - Weight percentage (e.g., "40%")
   - Definition (on hover or expand)
   - Student's current score (0-100)
   - Visual progress bar
   - Color coding: Green (85+), Yellow (70-84), Red (<70)
   - Gap to target (e.g., "-13 points")

2. DATA SOURCE:
   ```typescript
   import { getCollegeCoreValues } from '@/data/commonAppColleges';

   const coreValues = getCollegeCoreValues(collegeId);
   // Returns array of CoreValue objects with name, weight, definition
   ```

3. PROPS:
   ```typescript
   interface CoreValuesCardProps {
     collegeId: string;
     collegeName: string;
     alignment?: CoreValueAlignment[]; // From analysis results
     className?: string;
   }

   interface CoreValueAlignment {
     value_id: string;
     value_name: string;
     weight: number;
     current_score: number;
     gap: number;
     how_to_improve: string[];
     evidence_present: string[];
     evidence_missing: string[];
   }
   ```

4. LAYOUT EXAMPLE:
   ```
   ╔════════════════════════════════════════╗
   ║  Stanford's Core Values                ║
   ╠════════════════════════════════════════╣
   ║                                        ║
   ║  📚 Intellectual Vitality      40%    ║
   ║     Current: 72/100  (-13 points)     ║
   ║     ████████████░░░░░░░░ 72%          ║
   ║     [Expand to see how to improve]    ║
   ║                                        ║
   ║  💡 Impact & Leadership        25%    ║
   ║     Current: 85/100  (+10 points)     ║
   ║     ████████████████░░░░ 85%          ║
   ║     ✓ Well demonstrated                ║
   ║                                        ║
   ║  💪 Context & Character        20%    ║
   ║     Current: 68/100  (-7 points)      ║
   ║     ███████████░░░░░░░░░ 68%          ║
   ║                                        ║
   ║  ✨ Authenticity & Voice       15%    ║
   ║     Current: 90/100  (+15 points)     ║
   ║     ██████████████████░░ 90%          ║
   ║     ✓ Excellent                        ║
   ╚════════════════════════════════════════╝
   ```

5. EXPANDABLE SECTIONS:
   Click value to expand and show:
   - Full definition
   - How to demonstrate this value
   - Evidence present in essay
   - Evidence missing
   - Specific suggestions to improve

6. VISUAL DESIGN:
   - Use Card component from shadcn/ui
   - Progress bars with color gradients
   - Icons for each value (book, lightbulb, muscle, sparkles)
   - Smooth expand/collapse animations
   - Hover states for interactivity

7. PLACEHOLDER DATA:
   If no analysis results yet, show the values with "Not analyzed yet" state.

Make this visually impressive - it's a key differentiator showing college-specific intelligence.
```

---

## Part 7: College Preferences Panel

```
PART 7: CREATE COLLEGE PREFERENCES GUIDE PANEL

Create a panel showing what the college loves and hates in essays.

CREATE FILE: src/components/portfolio/commonApp/workshop/CollegePreferencesGuide.tsx

Purpose: Show students what this specific college values in essays (priorities, red flags, tone).

Requirements:

1. SECTIONS TO DISPLAY:
   - ✅ Essay Priorities (what college loves)
   - ❌ Red Flags (what to avoid)
   - 🎯 Preferred Tone
   - 🚫 Avoid Tone
   - 📝 Structure Notes

2. DATA SOURCE:
   ```typescript
   import { getCollege } from '@/data/commonAppColleges';

   const college = getCollege(collegeId);
   const preferences = college?.preferences;

   // preferences.essay_priorities - Array of strings
   // preferences.red_flags - Array of strings
   // preferences.preferred_tone - Array of strings
   // preferences.avoid_tone - Array of strings
   // preferences.structure_notes - String
   ```

3. PROPS:
   ```typescript
   interface CollegePreferencesGuideProps {
     collegeId: string;
     collegeName: string;
     className?: string;
     defaultExpanded?: boolean;
   }
   ```

4. LAYOUT EXAMPLE:
   ```
   ╔════════════════════════════════════════╗
   ║  Stanford Essay Preferences            ║
   ╠════════════════════════════════════════╣
   ║                                        ║
   ║  ✅ WHAT STANFORD LOVES                ║
   ║  • Intellectual vitality above all     ║
   ║  • Self-directed learning              ║
   ║  • Specificity over generality         ║
   ║  • Authenticity over achievement       ║
   ║  • Impact over titles                  ║
   ║                                        ║
   ║  ❌ WHAT TO AVOID                       ║
   ║  • Classroom-bounded learning          ║
   ║  • Prestige-focused reasons            ║
   ║  • Generic reasons (any top school)    ║
   ║  • Resume repetition                   ║
   ║  • Overly formal tone                  ║
   ║                                        ║
   ║  🎯 PREFERRED TONE                      ║
   ║  Authentic • Intellectually curious    ║
   ║  Reflective • Passionate • Thoughtful  ║
   ║                                        ║
   ║  🚫 AVOID TONE                          ║
   ║  Trying to impress • Overly formal     ║
   ║  Generic • Arrogant • Detached         ║
   ║                                        ║
   ║  📝 STRUCTURE TIPS                      ║
   ║  Stanford values specificity and       ║
   ║  authenticity. Show, don't tell. Use   ║
   ║  concrete examples over abstract.      ║
   ╚════════════════════════════════════════╝
   ```

5. VISUAL DESIGN:
   - Collapsible sections
   - Color coding: Green for loves, Red for avoid, Blue for tone
   - Checkmarks and X icons
   - Clean list formatting
   - Can be in sidebar or modal

6. COMPARISON FEATURE (BONUS):
   Add button "Compare with other colleges" that shows:
   - How Stanford differs from Harvard
   - Unique preferences per college
   - Overlapping values

This helps students understand each college's unique personality and what they're looking for.
```

---

## Part 8: Essay Type Guidance Component

```
PART 8: CREATE ESSAY TYPE GUIDANCE COMPONENT

Create a component that explains the specific essay type and what makes it work.

CREATE FILE: src/components/portfolio/commonApp/workshop/EssayTypeGuide.tsx

Purpose: Show type-specific guidance (pitfalls, criteria, elite patterns) for the current supplemental.

Requirements:

1. DATA SOURCE:
   ```typescript
   import { getSupplementalTypeInfo } from '@/data/commonAppSupplementalTypes';
   import { getSupplemental } from '@/data/commonAppColleges';

   const supplemental = getSupplemental(collegeId, supplementalId);
   const typeInfo = getSupplementalTypeInfo(supplemental.type);
   const analysisHints = supplemental.analysisHints;
   ```

2. PROPS:
   ```typescript
   interface EssayTypeGuideProps {
     collegeId: string;
     supplementalId: string;
     className?: string;
   }
   ```

3. SECTIONS TO SHOW:
   - Essay type name and description
   - Typical word range
   - Key elements required (from analysisHints.key_elements)
   - Common pitfalls (from both typeInfo and analysisHints.red_flags)
   - Elite patterns (from analysisHints.elite_patterns)
   - Evaluation criteria
   - Example prompts

4. LAYOUT EXAMPLE:
   ```
   ╔════════════════════════════════════════╗
   ║  "Why Us" Essay Guide                  ║
   ║  Intellectual Curiosity Type           ║
   ╠════════════════════════════════════════╣
   ║                                        ║
   ║  📖 WHAT THIS ESSAY NEEDS:             ║
   ║  ✓ Specific idea or experience         ║
   ║  ✓ Self-directed learning beyond class ║
   ║  ✓ Genuine intellectual curiosity      ║
   ║  ✓ Connection to Stanford resources    ║
   ║                                        ║
   ║  ⚠️  COMMON PITFALLS TO AVOID:          ║
   ║  ✗ Classroom learning only             ║
   ║  ✗ Generic "love of learning"          ║
   ║  ✗ No Stanford-specific connection     ║
   ║  ✗ Prestige-focused reasons            ║
   ║                                        ║
   ║  🌟 ELITE PATTERNS (90+ scores):        ║
   ║  • Independent project or research     ║
   ║  • Unexpected intellectual pursuit     ║
   ║  • Cross-disciplinary connection       ║
   ║  • Specific Stanford professor/program ║
   ║                                        ║
   ║  📊 TYPICAL LENGTH: 100-250 words      ║
   ╚════════════════════════════════════════╝
   ```

5. DISPLAY OPTIONS:
   - Can be collapsible card above editor
   - Can be modal/popover triggered by info icon
   - Can be sidebar panel
   - Should be accessible while writing

6. VISUAL DESIGN:
   - Icons for each section
   - Color coding (green for good, red for bad, gold for elite)
   - Checkmarks and X marks
   - Badge showing essay type
   - Clean, scannable layout

This gives students a roadmap for what makes this specific type of essay successful.
```

---

## Part 9: Cross-College Comparison Feature

```
PART 9: CREATE CROSS-COLLEGE COMPARISON COMPONENT

Create a component that shows how different colleges value the same essay type differently.

CREATE FILE: src/components/portfolio/commonApp/workshop/CrossCollegeComparison.tsx

Purpose: When working on an essay type (like "Why Us"), show how Stanford vs Harvard vs MIT differ in what they value.

Requirements:

1. TRIGGER:
   Button in workshop: "See how other colleges approach this essay type"

2. DISPLAY:
   Modal or slide-out panel showing side-by-side comparison

3. DATA SOURCE:
   ```typescript
   import { COMMON_APP_COLLEGES } from '@/data/commonAppColleges';

   // Find all colleges that have this essay type
   const collegesWithType = COMMON_APP_COLLEGES.filter(college =>
     college.supplementals.some(supp => supp.type === currentType)
   );
   ```

4. COMPARISON TABLE:
   ```
   ╔═══════════════════════════════════════════════════╗
   ║  "Why Us" Essay - College Comparison             ║
   ╠═══════════════════════════════════════════════════╣
   ║                                                   ║
   ║  College    | What They Value Most                ║
   ║  ──────────────────────────────────────────────  ║
   ║  Stanford   | • Intellectual vitality (40%)      ║
   ║             | • Self-directed exploration        ║
   ║             | • Specificity over prestige        ║
   ║             | Word limit: 100-250                ║
   ║             |                                    ║
   ║  Harvard    | • Intellectual engagement (35%)    ║
   ║             | • Community contribution (30%)     ║
   ║             | • Scholarly depth                  ║
   ║             | Word limit: 150-200                ║
   ║             |                                    ║
   ║  MIT        | • Hands-on creativity (35%)        ║
   ║             | • Collaboration (30%)              ║
   ║             | • Making and building              ║
   ║             | Word limit: 200-300                ║
   ║  ──────────────────────────────────────────────  ║
   ║                                                   ║
   ║  💡 KEY INSIGHT:                                   ║
   ║  While all three want "Why Us" essays,           ║
   ║  Stanford prioritizes intellectual vitality,     ║
   ║  Harvard emphasizes community, and MIT wants     ║
   ║  to see hands-on making. Tailor accordingly!     ║
   ╚═══════════════════════════════════════════════════╝
   ```

5. HIGHLIGHT DIFFERENCES:
   - Color code unique priorities per college
   - Show weight percentages for core values
   - Note word count differences
   - Highlight tone differences
   - Show unique red flags per college

6. REUSABILITY INDICATOR:
   Show which colleges the student is applying to and indicate if they can reuse/adapt this essay:
   ```
   📋 You're applying to: Stanford, Harvard

   ⚠️  Don't reuse this essay directly!
   - Different word limits (250 vs 200)
   - Different value emphasis
   - Different tone preferences

   ✓ BUT you can adapt the core content by:
   1. Emphasizing community for Harvard
   2. Shortening by 50 words
   3. Adding collaborative angle
   ```

7. ACTION BUTTONS:
   - "Apply this to Harvard" (navigates to Harvard version)
   - "See full Stanford preferences"
   - "Close comparison"

This helps students understand college-specific nuances and avoid generic essays.
```

---

## Part 10: Integration & Testing

```
PART 10: INTEGRATE ALL COMPONENTS AND TEST

Integrate all new components into CommonAppWorkshop.tsx and test the full flow.

Tasks:

1. UPDATE LAYOUT in CommonAppWorkshop.tsx:
   ```typescript
   <div className="workshop-layout">
     {/* Header */}
     <CommonAppCollegeNav {...navProps} />

     {/* Main Content */}
     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
       {/* Left Column - 2/3 width */}
       <div className="lg:col-span-2">
         {/* Core Values Card */}
         <CoreValuesCard
           collegeId={collegeId}
           collegeName={currentCollege.name}
           alignment={analysisResult?.collegeSpecific?.core_values_alignment}
         />

         {/* Essay Type Guide */}
         <EssayTypeGuide
           collegeId={collegeId}
           supplementalId={supplementalId}
         />

         {/* Editor */}
         <EditorView {...editorProps} />

         {/* Rubric Dimensions */}
         {dimensions.map(d => <RubricDimensionCard {...d} />)}
       </div>

       {/* Right Column - 1/3 width */}
       <div className="lg:col-span-1">
         {/* College Preferences */}
         <CollegePreferencesGuide
           collegeId={collegeId}
           collegeName={currentCollege.name}
         />

         {/* Chat */}
         <ContextualWorkshopChat {...chatProps} />
       </div>
     </div>

     {/* Cross-College Comparison Modal */}
     <CrossCollegeComparison
       currentType={currentSupplemental.type}
       currentCollegeId={collegeId}
       isOpen={showComparison}
       onClose={() => setShowComparison(false)}
     />
   </div>
   ```

2. ADD COMPARISON BUTTON:
   In the workshop header, add:
   ```typescript
   <Button
     variant="outline"
     onClick={() => setShowComparison(true)}
   >
     Compare Colleges
   </Button>
   ```

3. TEST CHECKLIST:
   ✓ Navigate to /common-app-workshop/stanford/stanford_why_stanford
   ✓ Core Values card displays Stanford's 4 values
   ✓ College Preferences shows Stanford's loves/hates
   ✓ Essay Type Guide shows intellectual type guidance
   ✓ Navigate to different college (Harvard)
   ✓ All data updates to Harvard's values/preferences
   ✓ Navigate to different supplemental within same college
   ✓ Data persists when switching back
   ✓ Click "Compare Colleges" button
   ✓ Modal shows comparison across colleges
   ✓ All components responsive on mobile

4. STYLING POLISH:
   - Ensure consistent spacing (gap-6)
   - Smooth transitions when switching colleges
   - Loading states while fetching data
   - Error states for missing data
   - Empty states for not-yet-analyzed essays

5. PERFORMANCE:
   - Memoize college data (doesn't change)
   - Debounce autosave
   - Lazy load comparison modal
   - Optimize re-renders

TEST SCENARIOS:
1. New user: Navigate to Stanford → See empty state → Start writing → Analyze
2. Existing user: Navigate to Stanford → Load saved essay → Continue editing
3. Switch colleges: Stanford → Harvard → All data updates correctly
4. Switch supplementals: Stanford "Why Us" → "What Matters" → Independent data
5. Compare: Click compare → See all 3 colleges → Navigate to different college

CONFIRM:
- All new components render correctly
- Data updates when switching colleges/supplementals
- No console errors
- Mobile responsive
- Looks visually polished
```

---

## Part 11: Polish & Error Handling

```
PART 11: ADD POLISH, ERROR HANDLING, AND EDGE CASES

Final polish to make the system production-ready.

Tasks:

1. LOADING STATES:
   Add loading spinners/skeletons for:
   - College data loading
   - Essay loading from database
   - Analysis in progress
   - Switching between colleges

2. ERROR HANDLING:
   Handle edge cases:
   - Invalid college ID in URL → Redirect to Stanford
   - Invalid supplemental ID → Redirect to first supplemental
   - Database connection error → Show retry button
   - Analysis API failure → Show error with retry
   - Missing data → Graceful fallback

3. EMPTY STATES:
   Design empty states for:
   - No essay written yet → "Start writing your [essay name]"
   - No analysis yet → "Write at least 50 words to analyze"
   - No saved versions → "Your version history will appear here"

4. AUTOSAVE INDICATOR:
   Show autosave status:
   - "Saving..." (spinner)
   - "Saved" (checkmark)
   - "Error saving" (retry button)

5. WORD COUNT WARNINGS:
   - Show word count in real-time
   - Yellow warning when approaching limit (90%)
   - Red warning when exceeding limit
   - Gray when under minimum

6. MOBILE OPTIMIZATIONS:
   - Collapsible panels on mobile
   - Swipe gestures for college navigation
   - Bottom sheet for comparison modal
   - Sticky editor on mobile

7. KEYBOARD SHORTCUTS:
   - Cmd/Ctrl + S: Save
   - Cmd/Ctrl + Z: Undo
   - Cmd/Ctrl + Shift + Z: Redo
   - Cmd/Ctrl + K: Open comparison

8. TOOLTIPS:
   Add helpful tooltips:
   - Core value weights: "Why this percentage?"
   - Research depth score: "Based on X sources"
   - Essay type: "What is a 'Why Us' essay?"
   - Red flags: "Why avoid this?"

9. ACCESSIBILITY:
   - Proper ARIA labels
   - Keyboard navigation
   - Focus management
   - Screen reader support
   - Color contrast compliance

10. ANALYTICS TRACKING:
    Track key events:
    - College switched
    - Supplemental viewed
    - Analysis started
    - Comparison viewed
    - Essay saved

TESTING CHECKLIST:
✓ Try invalid URL: /common-app-workshop/invalid/invalid
✓ Disconnect internet, try to save
✓ Write 300 words in 250-word essay (warning shows)
✓ Try on mobile device
✓ Try with screen reader
✓ Try all keyboard shortcuts
✓ Check all tooltips display
✓ Verify autosave works
✓ Check version history
✓ Test error recovery

Make sure everything feels smooth, responsive, and production-ready!
```

---

## Summary: 11 Parts Total

**Copy-paste these prompts to Lovable in order:**

1. ✅ Data Files Setup (paste backend data)
2. ✅ Database Schema (run SQL)
3. ✅ Clone PIQ Workshop Base
4. ✅ College Navigation Component
5. ✅ Update Main Workshop Page
6. ✅ Core Values Display Card
7. ✅ College Preferences Panel
8. ✅ Essay Type Guidance Component
9. ✅ Cross-College Comparison Feature
10. ✅ Integration & Testing
11. ✅ Polish & Error Handling

**Estimated Time**:
- Parts 1-3: 1 day
- Parts 4-6: 1 day
- Parts 7-9: 1 day
- Parts 10-11: 1 day

**Total: 4 days for complete system**

---

## How to Use These Prompts

1. **Start with Part 1**: Copy the entire Part 1 prompt and paste to Lovable
2. **Wait for completion**: Let Lovable finish before moving on
3. **Verify it works**: Test what was built
4. **Move to Part 2**: Once verified, paste Part 2
5. **Repeat**: Continue through all 11 parts

**Each part is complete and self-contained - no need to add context!**
