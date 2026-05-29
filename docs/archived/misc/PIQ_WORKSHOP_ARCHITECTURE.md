# PIQ WORKSHOP ARCHITECTURE

## Overview

Building a PIQ (Personal Insight Question) workshop system following the **exact same pattern** as the extracurricular workshop, but with PIQ-specific rubric dimensions and teaching examples.

## Architecture Pattern (from Extracurricular Workshop)

```
1. ANALYZER (LLM Call)
   ↓
   Returns: Rubric scores (11 dimensions) + Raw features

2. ISSUE DETECTOR (Logic)
   ↓
   Detects: DetectedIssue[] organized by dimension
   Each issue: { id, category, severity, title, from_draft, problem, why_matters, suggested_fixes[] }

3. ENRICHMENT (Logic + Corpus)
   ↓
   Adds: Teaching examples (weak→strong pairs), reflection prompts

4. PRIORITIZATION (Logic)
   ↓
   Selects: Top 3-5 issues based on severity + impact

5. UI DISPLAY
   ↓
   Shows: Accordion by dimension → Issues → "Fix in Chat" button
```

## PIQ-Specific Rubric Dimensions

### 1. **Opening Hook Quality** (Weight: 15%)
   - Measures: How effectively the opening grabs attention and sets up the essay
   - Scores: Hook type, effectiveness, literary techniques, promise delivery
   - Common Issues:
     * Generic/weak hooks (no tension, no intrigue)
     * Missing stakes
     * Disconnected from essay body
     * No sensory details or specificity
     * Manufactured "profound" openings

### 2. **Vulnerability & Authenticity** (Weight: 20%)
   - Measures: Emotional depth, risk-taking, defense mechanisms, transformation credibility
   - Scores: Vulnerability level (1-5), authenticity markers, manufactured red flags
   - Common Issues:
     * Level 1 vulnerability (generic acknowledgment)
     * Manufactured phrases ("this taught me that")
     * Defensive retreat (starts vulnerable, backs off)
     * Missing physical/sensory symptoms
     * No specific failures shown

### 3. **Narrative Arc & Stakes** (Weight: 15%)
   - Measures: Story structure, tension, conflict, resolution
   - Scores: Arc pattern, stakes clarity, tension maintenance
   - Common Issues:
     * Flat arc (no conflict or tension)
     * Unclear stakes (reader doesn't know why it matters)
     * Missing turning point
     * Too neat/resolved (no ongoing complexity)
     * Summary instead of scene

### 4. **Specificity & Evidence** (Weight: 12%)
   - Measures: Concrete details, numbers, sensory information
   - Scores: Specificity level, quantified evidence, detail richness
   - Common Issues:
     * Generic statements ("I learned a lot")
     * Missing numbers/metrics
     * Vague descriptions
     * Abstract language without grounding
     * No sensory details

### 5. **Voice Integrity** (Weight: 12%)
   - Measures: Authentic student voice free from essay-speak
   - Scores: Voice authenticity, manufactured phrase count, conversational quality
   - Common Issues:
     * Essay-speak ("through this experience")
     * Passive voice
     * Vocabulary showing off
     * Sounding like AI/ChatGPT
     * Generic college essay voice

### 6. **Reflection & Insight** (Weight: 10%)
   - Measures: Depth of self-awareness, universal insights, meaning-making
   - Scores: Insight depth, transferability, belief shifts
   - Common Issues:
     * Generic lessons ("I learned teamwork")
     * No belief shift shown
     * Surface observations
     * Missing self-realization
     * Prescriptive takeaways instead of earned insights

### 7. **Identity & Self-Discovery** (Weight: 8%)
   - Measures: Identity exploration, core values, self-concept evolution
   - Scores: Identity complexity, coherence, evolution shown
   - Common Issues:
     * Missing identity thread
     * Inconsistent self-portrayal
     * No core values visible
     * Identity told, not shown
     * Superficial self-discovery

### 8. **Craft & Language Quality** (Weight: 5%)
   - Measures: Literary sophistication, sentence variety, imagery
   - Scores: Craft techniques, language sophistication, rhythm
   - Common Issues:
     * Monotone sentence rhythm
     * No dialogue or scene
     * Missing imagery
     * Weak verbs
     * Clichéd metaphors

### 9. **Thematic Coherence** (Weight: 3%)
   - Measures: How well all parts connect to central theme
   - Scores: Theme clarity, coherence, reinforcement
   - Common Issues:
     * Scattered themes
     * Disconnected paragraphs
     * Missing throughline
     * Forced connections
     * Theme drift

**Total Weight: 100%**

## Issue Detection Strategy

### Pattern-Based Detection (Like Extracurricular Workshop)

For each dimension, detect specific patterns:

#### Opening Hook Issues:
- `weak-hook-generic`: Generic opening with no tension
- `weak-hook-no-stakes`: Missing stakes/why it matters
- `weak-hook-disconnected`: Hook doesn't connect to essay body
- `weak-hook-manufactured`: Trying too hard to be profound
- `weak-hook-no-sensory`: Missing sensory details

#### Vulnerability Issues:
- `vuln-level-1-minimal`: Generic acknowledgment only
- `vuln-manufactured`: Fake vulnerability phrases
- `vuln-defensive-retreat`: Starts vulnerable, backs off
- `vuln-no-physical`: Missing physical symptoms/sensory
- `vuln-no-failure`: No specific failures shown
- `vuln-transformation-imposed`: Growth feels manufactured

#### Arc Issues:
- `arc-flat`: No conflict or tension
- `arc-unclear-stakes`: Stakes never clarified
- `arc-no-turning-point`: Missing moment of change
- `arc-too-neat`: Too resolved, no complexity
- `arc-summary-not-scene`: Telling instead of showing

(etc. for each dimension)

## Teaching Examples Corpus Structure

```typescript
interface PIQTeachingExample {
  id: string;
  issueType: string;                    // Maps to issue pattern (e.g., 'weak-hook-generic')
  dimension: string;                    // Rubric dimension
  weakExample: string;                  // Before (20-40 words)
  strongExample: string;                // After (30-60 words)
  explanation: string;                  // What changed and why
  diffHighlights: string[];             // Key improvements
  principle: string;                    // Transferable lesson
  essayContext?: string;                // Which PIQ prompt (e.g., "Leadership", "Creative")
}
```

### Example Teaching Examples:

**Opening Hook - Generic to Sensory Immersion:**
```
Weak: "As president of the robotics club, I faced many challenges."

Strong: "I threw up in the bathroom 20 minutes before our robotics presentation. My hands were shaking so badly I couldn't hold the remote control."

Explanation: The strong version uses physical symptoms (threw up, shaking hands) and specific timing (20 minutes before) to create immediate visceral engagement. Generic statements about "challenges" don't create tension.

Diff Highlights:
- Added physical symptoms (threw up, shaking)
- Added specific timing (20 minutes before)
- Removed generic "faced challenges"
- Created immediate stakes and tension

Principle: Physical vulnerability + specific timing > abstract challenges
```

**Vulnerability - Manufactured to Authentic:**
```
Weak: "Leading 80 students was scary, but I realized fear doesn't mean you're not a good leader. It means you care."

Strong: "I spent most of Tuesday crying in the supply closet, terrified I'd already failed everyone. My first team meeting: three seniors walked out. I can tell you the exact scuff marks on the floor where they stood, but not what I said that made them leave."

Explanation: The strong version shows vulnerability through specific actions (crying in closet) and fragmented memory (remembers scuff marks, not words), rather than neat lessons. Real shame creates selective memory.

Diff Highlights:
- Replaced neat lesson with specific failure
- Added fragmented memory (scuff marks vs words)
- Showed shame through what's NOT remembered
- Removed defensive "fear means you care"

Principle: Show failure + psychological truth > state lesson
```

**Arc - Summary to Scene:**
```
Weak: "I tried to resign but decided to keep going instead. I asked for feedback and things got better."

Strong: "Week three, I sent a resignation email to our advisor at 2 AM. Three paragraphs explaining why someone else would be better. Sat with my finger over 'send' for twenty minutes. Didn't send it. Not because I felt confident. Because resignation was just running away, and I'd been running my whole life."

Explanation: The strong version turns summary ("tried to resign") into a specific scene (2 AM email, finger over send, 20 minutes) and reveals the internal conflict (running away vs facing it).

Diff Highlights:
- Turned summary into specific scene (2 AM email)
- Added time detail (20 minutes hovering)
- Showed internal conflict (not confidence)
- Connected to larger pattern (been running my whole life)

Principle: Specific scene + internal conflict > summary of events
```

## Data Flow

```
USER SUBMITS PIQ ESSAY
  ↓
analyzeForPIQWorkshop(essayText, piqPromptType)
  ↓
STEP 1: LLM Analysis
  - Call opening hook analyzer
  - Call vulnerability analyzer
  - Call narrative arc analyzer
  - Combine into unified rubric scores
  ↓
STEP 2: Issue Detection
  - detectAllPIQIssues(essay, rubricScores)
  - Returns: DetectedIssue[] grouped by dimension
  ↓
STEP 3: Enrichment
  - enrichIssuesWithTeaching(issues)
  - Adds weak→strong examples from corpus
  - Generates reflection prompts
  ↓
STEP 4: Prioritization
  - prioritizeIssues(allIssues, maxIssues = 5)
  - Returns: Top 3-5 issues based on severity + impact
  ↓
STEP 5: Return Workshop Result
  {
    overallScore: number,           // NQI equivalent for PIQ
    scoreTier: string,              // "Excellent", "Strong", etc.
    dimensions: DimensionScore[],   // All 9 dimensions
    topIssues: WorkshopIssue[],     // 3-5 prioritized issues
    allIssues: WorkshopIssue[],     // Full list
    quickSummary: string
  }
```

## UI Integration

```
[PIQ Workshop Interface]

┌─────────────────────────────────────┐
│ Overall Score: 67/100 (Good)        │
│ "Strong opening and vulnerability,  │
│  but arc needs clearer stakes"      │
└─────────────────────────────────────┘

▼ Opening Hook Quality (7.5/10) ⚠ 2 issues
  ┌─────────────────────────────────┐
  │ ⚠ Critical: Hook Missing Stakes │
  │                                 │
  │ FROM YOUR DRAFT:                │
  │ "As president of robotics..."   │
  │                                 │
  │ THE PROBLEM:                    │
  │ Generic opening with no tension │
  │                                 │
  │ WHY IT MATTERS:                 │
  │ Readers skip past generic...    │
  │                                 │
  │ [View Example] [Fix in Chat] ─┐ │
  └─────────────────────────────────┘│
                                     │
                        Loads chat with:
                        - Full issue context
                        - Teaching examples
                        - Their draft text
                        - Specific fix strategies

▼ Vulnerability & Authenticity (6/10) ⚠ 1 issue
  ┌─────────────────────────────────┐
  │ 🔴 Critical: Manufactured       │
  │    Vulnerability                │
  └─────────────────────────────────┘

▼ Narrative Arc & Stakes (5.5/10) 🔴 3 issues
  ...
```

## Implementation Files

1. **`src/services/piq/types.ts`** - PIQ-specific types
2. **`src/services/piq/rubric.ts`** - PIQ rubric dimensions & weights
3. **`src/services/piq/issuePatterns.ts`** - Issue pattern definitions
4. **`src/services/piq/teachingExamples.ts`** - Weak→strong example corpus
5. **`src/services/piq/issueDetector.ts`** - Detects issues from analysis
6. **`src/services/piq/issueEnricher.ts`** - Adds teaching examples
7. **`src/services/piq/workshopAnalyzer.ts`** - Main orchestrator

## Next Steps

1. ✅ Define PIQ rubric dimensions (9 dimensions, weights)
2. Define issue patterns for each dimension
3. Build teaching examples corpus (50-100 examples)
4. Implement issue detector
5. Implement enrichment layer
6. Build unified PIQ workshop analyzer
7. Test end-to-end with real PIQ essays
