# Pipeline Data Research: Rich Data NOT Currently Surfaced in UI

> Research output for tasks #2, #3, #4 — builder agents use this to know exactly what data to pull.

---

## Overview

The pipeline produces **massive** rich data per activity that the UI currently discards. The `buildInsights()` function in `ActivityInsightsList.tsx` extracts only shallow fields (scores as numbers, flags as strings) while the pipeline produces detailed rationales, teaching explanations, citations, and references for every element.

**Key finding**: The three section components (`ScoreBreakdown`, `WhatsWorking`, `DescriptionOptimization`) currently receive **numbers and short strings only**. The pipeline has **paragraph-length explanations** for every score, every strength, and every improvement that are being thrown away.

---

## SECTION A: ScoreBreakdown

### What's Currently Shown

The `ScoreBreakdown` component (`sections/ScoreBreakdown.tsx`) receives:

```ts
// From ActivityInsightData (current)
activityScore: {
  total: number;
  breakdown: {
    tierAssessment: { score: number; weight: number };
    recognitionLevel: { score: number; weight: number };
    commitmentProgression: { score: number; weight: number };
    communityCharacter: { score: number; weight: number };
    leadershipImpact: { score: number; weight: number };
  };
};
descriptionScore: {
  total: number;
  breakdown: {
    specificity: { score: number };
    impactClarity: { score: number };
    authenticityVoice: { score: number };
    actionLanguage: { score: number };
    quantification: { score: number };
  };
};
combinedScore: number;
```

That's it — **just numbers**. No rationales, no tier explanations, no benchmarks.

### What the Pipeline Produces (NOT Surfaced)

#### A1. Activity Score Component Rationales

**Type path**: `scoring.activityScores[i].activityScore.breakdown.<component>.rationale`

Each of the 5 activity score components (`TierAssessmentComponent`, `RecognitionComponent`, `LeadershipComponent`, `CommunityCharacterComponent`, `CommitmentComponent`) extends `ActivityScoreComponent` which has:

```ts
// From scoring/types.ts — ActivityScoreComponent
interface ActivityScoreComponent {
  score: number;
  maxScore: 10;
  weight: number;
  weightedScore: number;
  rationale: string;  // <-- THIS IS NOT EXTRACTED
}
```

**Special fields on subcomponents (also not extracted):**
- `TierAssessmentComponent.tier` — the 1-4 tier number
- `RecognitionComponent.level` — 'international'|'national'|'state'|'regional'|'school'|'local'|'none'
- `LeadershipComponent.isApplicable`, `.role`, `.impactScope`
- `CommunityCharacterComponent.primaryTrait`, `.communityBenefit`, `.authenticitySignal`
- `CommitmentComponent.years`, `.showsProgression`, `.sustainedThroughJunior`

**E2E example** (Machine Learning Research — Tier Assessment rationale):
> "Co-authoring a paper submitted to an undergraduate journal places you in rare territory—most high schoolers who do 'research' are really shadowing or doing data entry. The fact that a professor added your name signals genuine intellectual contribution; faculty don't risk their reputation by adding ghost authors. Building a data pipeline for 50,000 patient records shows technical competence beyond typical high school CS projects. However, this is submitted (not yet published), and undergraduate journals are less competitive than peer-reviewed faculty journals..."

**E2E example** (Grocery Store — Community/Character rationale):
> "This activity screams resilience and maturity. Working 20 hours/week (1,040 hours/year) to support your family while maintaining grades shows extraordinary discipline and sacrifice..."

#### A2. Description Score Component Rationales

**Type path**: `scoring.activityScores[i].descriptionScore.breakdown.<component>.rationale`

Each of the 5 description score components (`DescriptionScoreComponent`) has:

```ts
// From scoring/types.ts — DescriptionScoreComponent
interface DescriptionScoreComponent {
  score: number;
  maxScore: number;
  rationale: string;  // <-- THIS IS NOT EXTRACTED
}
```

**E2E example** (Machine Learning Research — Role Ownership rationale):
> "Role is clear and individual contribution is well-defined: 'Built data pipeline processing 50,000 patient records' is unmistakably this student's work. Minor ambiguity: 'Worked with professor' is slightly passive, and the co-authorship claim needs clarification of contribution level."

**E2E example** (Tutoring — Evidence of Impact rationale):
> "Zero impact evidence. Students 'come regularly' (attendance) but no outcomes mentioned. Did grades improve? Did students gain confidence? Pass tests? The word 'help' is the weakest possible impact claim—it's a verb that means 'I was present' without specifying results."

#### A3. Tier Explanation (from Stage 2 Teaching)

**Type path**: `stage2.teachingDelivered[i].teaching.tierExplanation`

```ts
// From types.ts — ActivityTeaching.tierExplanation
tierExplanation: {
  assignedTier: ActivityTier;
  explanation: CitedText;           // <-- NOT EXTRACTED
  benchmarksUsed: {                 // <-- NOT EXTRACTED
    tier: ActivityTier;
    benchmark: string;
    source: string;
    studentMeets: boolean;
    gap?: string | null;
    evidence?: string;
  }[];
  whatMakesThisTier: CitedText;     // <-- NOT EXTRACTED
  whatWouldChangeIt: CitedText;     // <-- NOT EXTRACTED
};
```

**E2E example** (Machine Learning Research — TIER section):
> **Tier explanation**: "This activity sits at Tier 3 because it demonstrates genuine research participation with tangible output (co-authored paper), but lacks the external validation that defines higher tiers..."
>
> **What makes this tier**: "You have the core elements of research credibility: (1) named technical contribution ('Built data pipeline'), (2) professional-scale work (50K records), (3) tangible output (co-authored paper). These three elements separate you from students who 'helped in a lab' without clear contribution."
>
> **To improve**: "To reach Tier 2: (1) Paper acceptance/publication in any peer-reviewed venue, OR (2) Conference poster presentation..., OR (3) Specific finding from your analysis that influenced a decision..."

#### A4. Activity Score Metadata

**Type path**: `scoring.activityScores[i].activityScore`

```ts
// From scoring/types.ts — ActivityScore (fields NOT extracted)
interface ActivityScore {
  total: number;
  breakdown: ActivityScoreBreakdown;
  tierJustification: string;              // <-- NOT EXTRACTED
  comparisonBenchmarks: {                 // <-- NOT EXTRACTED
    similarTo: string;
    above: string;
    below: string;
  };
  improvementPaths: string[];             // Already extracted
  overallRationale: string;               // <-- NOT EXTRACTED
}
```

#### A5. Description Score Metadata

**Type path**: `scoring.activityScores[i].descriptionScore`

```ts
// From scoring/types.ts — DescriptionScore (fields NOT extracted)
interface DescriptionScore {
  total: number;
  breakdown: DescriptionScoreBreakdown;
  strengths: string[];            // <-- NOT EXTRACTED
  improvements: string[];         // <-- NOT EXTRACTED
  overallRationale: string;       // <-- NOT EXTRACTED
  suggestedRewrite?: string;      // <-- NOT EXTRACTED
}
```

#### A6. Combined Score Rationale

**Type path**: `scoring.activityScores[i].combinedScore.rationale`

```ts
// From scoring/types.ts — ActivityScoreRubric.combinedScore
combinedScore: {
  total: number;
  formula: string;
  rationale: string;  // <-- NOT EXTRACTED
}
```

### Summary: What ScoreBreakdown Builder Needs to Add

| Data | Type Path from `ActivityWorkshopPipelineResult` | Field |
|------|-----------------------------------------------|-------|
| Activity score rationales (5) | `scoring.activityScores[i].activityScore.breakdown.<component>.rationale` | `string` |
| Activity tier number | `scoring.activityScores[i].activityScore.breakdown.tierAssessment.tier` | `1\|2\|3\|4` |
| Recognition level | `scoring.activityScores[i].activityScore.breakdown.recognitionLevel.level` | `string` |
| Leadership metadata | `scoring.activityScores[i].activityScore.breakdown.leadershipImpact.{isApplicable,role,impactScope}` | various |
| Character metadata | `scoring.activityScores[i].activityScore.breakdown.communityCharacter.{primaryTrait,communityBenefit,authenticitySignal}` | various |
| Commitment metadata | `scoring.activityScores[i].activityScore.breakdown.commitmentProgression.{years,showsProgression}` | various |
| Description score rationales (5) | `scoring.activityScores[i].descriptionScore.breakdown.<component>.rationale` | `string` |
| Tier explanation | `stage2.teachingDelivered[i].teaching.tierExplanation.{explanation,whatMakesThisTier,whatWouldChangeIt}` | `CitedText` |
| Tier benchmarks | `stage2.teachingDelivered[i].teaching.tierExplanation.benchmarksUsed[]` | array |
| Activity overallRationale | `scoring.activityScores[i].activityScore.overallRationale` | `string` |
| Activity tierJustification | `scoring.activityScores[i].activityScore.tierJustification` | `string` |
| Comparison benchmarks | `scoring.activityScores[i].activityScore.comparisonBenchmarks` | `{similarTo,above,below}` |
| Combined score rationale | `scoring.activityScores[i].combinedScore.rationale` | `string` |

---

## SECTION B: WhatsWorking (Strengths)

### What's Currently Shown

The `WhatsWorking` component (`sections/WhatsWorking.tsx`) receives:

```ts
// From ActivityInsightData (current)
greenFlags: Array<{
  flag: string;          // Short name, e.g. "Early start (freshman/sophomore year)"
  strength: string;      // 'exceptional' | 'strong' | 'notable'
  evidence: string;      // Short evidence string from stage1
  admissionsValue: string; // Short admissions value from stage1
}>;
```

These come from **stage1 analysis** (`stage1.activities[id].greenFlags`) — they are SHORT strings from the classification stage. The component shows a strength meter + admissions value preview + expandable evidence quote.

### What the Pipeline Produces (NOT Surfaced)

#### B1. Strength Teaching (Stage 2 Deep Teaching)

**Type path**: `stage2.teachingDelivered[i].teaching.strengthTeaching[]`

```ts
// From types.ts — ActivityTeaching.strengthTeaching[]
strengthTeaching: {
  strength: string;                    // Name of the strength
  theProblem?: string;                 // What would be lost if not highlighted
  whyItMatters: CitedText & {          // DETAILED explanation — PARAGRAPH LENGTH
    psychology?: string;               // Psychology research backing
    research?: string;                 // Research backing
    quote?: string;                    // Expert quote
    quoteSource?: string;              // Quote source
  };
  howToLeverage: string;               // How to use in applications — PARAGRAPH
  inApplications: string;              // Where specifically to mention
  references?: DescriptionReference[]; // For frontend text highlighting
}[];
```

**E2E example** (Machine Learning Research — "Technical specificity in contribution description"):
> **whyItMatters**: "Most research descriptions say 'conducted research' or 'assisted professor' — both are red flags because they hide what the student actually DID. Your phrase 'Built data pipeline processing 50,000 patient records' passes the committee pitch test: an AO can tell the committee 'This student has real data engineering skills' with confidence. MIT admissions specifically looks for evidence that students can BUILD things, not just follow protocols. The verb 'built' + technical object 'data pipeline' + scale '50K records' creates a complete picture of capability."
>
> **howToLeverage**: "In essays discussing intellectual interests, describe a specific technical challenge you solved building this pipeline (data cleaning? privacy compliance? handling missing records?). In interviews, be ready to explain your pipeline architecture in 60 seconds to a non-technical audience — this demonstrates both technical depth AND communication skill."
>
> **REF**: `"Built data pipeline processing 50,000 patient records" [strength] technical ownership (MATCH)`

**E2E example** (Farm Work — "Authentic agricultural expertise"):
> **whyItMatters**: "MIT receives 10,000+ applications from students who built apps or robots. They receive maybe 50 from students who operate farm equipment and manage irrigation systems. This isn't just 'different' — it's RARE technical expertise..."
>
> **howToLeverage**: "Frame this as applied engineering and data science: irrigation management is fluid dynamics and resource optimization; yield tracking is data analysis..."

#### B2. Celebration References

**Type path**: `stage2.teachingDelivered[i].teaching.celebration.references[]`

```ts
// From types.ts — celebration
celebration?: {
  headline: string;
  strengths: string[];
  references?: DescriptionReference[];  // <-- NOT EXTRACTED
};

// DescriptionReference shape
interface DescriptionReference {
  quotedText: string;   // Exact substring from description
  type: 'strength' | 'issue' | 'context';
  label: string;        // Short label for tooltip
}
```

**E2E example** (Farm Work celebration references):
> REF: `"Drive equipment"` [strength] active technical verb (MATCH)
> REF: `"manage irrigation"` [strength] systems responsibility (MATCH)
> REF: `"keep records of harvest yields"` [strength] data management (MATCH)

### Current vs. Needed Mapping

**Current `buildInsights()` maps**:
```ts
// From stage1.activities[id].greenFlags (SHALLOW)
greenFlags: (s1?.greenFlags ?? []).map((f) => ({
  flag: f.flag,           // "Early start (freshman/sophomore year)"
  strength: f.strength,   // "strong"
  evidence: f.evidence,   // SHORT string
  admissionsValue: f.admissionsValue, // SHORT string
}))
```

**Should ALSO map** (from stage2 teaching):
```ts
// From stage2.teachingDelivered[i].teaching.strengthTeaching[] (DEEP)
strengthTeaching: (teaching?.strengthTeaching ?? []).map((st) => ({
  strength: st.strength,
  whyItMatters: st.whyItMatters?.text ?? '',
  psychology: st.whyItMatters?.psychology,
  research: st.whyItMatters?.research,
  quote: st.whyItMatters?.quote,
  quoteSource: st.whyItMatters?.quoteSource,
  howToLeverage: st.howToLeverage,
  inApplications: st.inApplications,
  references: st.references ?? [],
}))
```

### Summary: What WhatsWorking Builder Needs to Add

| Data | Type Path from `ActivityWorkshopPipelineResult` | Field |
|------|-----------------------------------------------|-------|
| Strength name | `stage2.teachingDelivered[i].teaching.strengthTeaching[j].strength` | `string` |
| Detailed "Why" explanation | `stage2.teachingDelivered[i].teaching.strengthTeaching[j].whyItMatters.text` | `string` (paragraph) |
| Psychology backing | `stage2.teachingDelivered[i].teaching.strengthTeaching[j].whyItMatters.psychology` | `string?` |
| Research backing | `stage2.teachingDelivered[i].teaching.strengthTeaching[j].whyItMatters.research` | `string?` |
| Expert quote | `stage2.teachingDelivered[i].teaching.strengthTeaching[j].whyItMatters.quote` | `string?` |
| Quote source | `stage2.teachingDelivered[i].teaching.strengthTeaching[j].whyItMatters.quoteSource` | `string?` |
| How to leverage | `stage2.teachingDelivered[i].teaching.strengthTeaching[j].howToLeverage` | `string` (paragraph) |
| Where in applications | `stage2.teachingDelivered[i].teaching.strengthTeaching[j].inApplications` | `string` |
| Text references | `stage2.teachingDelivered[i].teaching.strengthTeaching[j].references[]` | `DescriptionReference[]` |
| Celebration text refs | `stage2.teachingDelivered[i].teaching.celebration.references[]` | `DescriptionReference[]` |

---

## SECTION C: DescriptionOptimization (Improvements)

### What's Currently Shown

The `DescriptionOptimization` component (`sections/DescriptionOptimization.tsx`) receives:

```ts
// From ActivityInsightData (current)
descriptionOptimization: {
  original: string;
  optimized: string;
  originalCharCount: number;
  optimizedCharCount: number;
  changes: Array<{ change: string; reason: string }>;
} | null;
```

The improvement items in the "Next Steps" section receive:

```ts
improvementTeaching: Array<{
  issue: string;        // Short issue name
  howToFix: string;     // Fix instruction
  exampleBefore: string;
  exampleAfter: string;
  priority: string;     // 'high' | 'medium' | 'low'
}>;
```

### What the Pipeline Produces (NOT Surfaced)

#### C1. Deep "Why" Explanation on Each Improvement

**Type path**: `stage2.teachingDelivered[i].teaching.improvementTeaching[j].whyItMatters`

```ts
// From types.ts — improvementTeaching[]
improvementTeaching: {
  issue: string;
  whyItMatters: CitedText & {           // <-- NOT EXTRACTED (PARAGRAPH-LENGTH)
    psychology?: string;                // Psychology backing
    research?: string;                  // Research backing
    quote?: string;                     // Expert quote
    quoteSource?: string;               // Quote source
  };
  howToFix: string;
  exampleBefore: string;
  exampleAfter: string;
  transformationAnalysis?: string;      // <-- NOT EXTRACTED
  priority: 'high' | 'medium' | 'low';
  references?: DescriptionReference[];  // <-- NOT EXTRACTED
}[];
```

**E2E example** (Machine Learning Research — "Missing impact statement"):
> **whyItMatters**: "Here's what happens in the admissions committee room: An AO reads your description and thinks 'Okay, this student can do research. But SO WHAT?' Research isn't valuable because you did it — it's valuable because it DISCOVERED something or CHANGED something. Right now, your description proves capability but not impact. The 8-minute read test: If an AO spends 8 seconds on this activity, they learn you built a pipeline and wrote a paper. They don't learn whether your work MATTERED."
>
> **REF**: `"Worked with professor on NLP project analyzing rural healthcare access patterns"` [issue] missing outcome (MATCH)

**E2E example** (Grocery Store — "Missing quantifiable impact metrics"):
> **whyItMatters**: "When an AO reads 'Train new employees,' they think: 'How many? Over what period? What was the result?' Without numbers, they can't assess SCALE. Did you train 2 people or 20? Were they successful?..."
>
> **REF**: `"Train new employees"` [issue] no scale/outcome (MATCH)

**E2E example** (Farm Work — "Undersold technical expertise"):
> **whyItMatters**: "The word 'Help' triggers the 'minimal contribution' assumption. AOs read 'help on family farm' and picture occasional chores, not operating $150K equipment or managing irrigation for 40+ acres..."

#### C2. Transformation Analysis

**Type path**: `stage2.teachingDelivered[i].teaching.improvementTeaching[j].transformationAnalysis`

This field explains WHY the before→after transformation works. It's currently `undefined` in the E2E output (the pipeline generates it inconsistently), but when present it adds value.

#### C3. References for Description Highlighting

**Type path**: `stage2.teachingDelivered[i].teaching.improvementTeaching[j].references[]`

```ts
interface DescriptionReference {
  quotedText: string;   // Exact substring to highlight
  type: 'strength' | 'issue' | 'context';
  label: string;        // Tooltip text
}
```

**E2E examples**:
> REF: `"Worked with professor"` [issue] passive opening (MATCH)
> REF: `"analyzing rural healthcare access patterns"` [issue] vague focus (MATCH)
> REF: `"Help on family farm"` [issue] undersells role (MATCH)
> REF: `"Train new employees"` [issue] no scale/outcome (MATCH)

These are meant for **inline highlighting** in the description text — the frontend could underline/highlight the exact substring with a tooltip showing the label.

#### C4. Alternative Description Versions

**Type path**: `stage2.teachingDelivered[i].teaching.descriptionOptimization.alternativeVersions`

```ts
descriptionOptimization: {
  originalDescription: string;
  optimizedDescription: string;
  characterCount: number;
  changesExplained: { change: string; reason: string }[];
  alternativeVersions?: string[];   // <-- NOT EXTRACTED
};
```

#### C5. Recommended Description with Per-Change Explanation (from E2E)

The E2E output shows extremely detailed per-change explanations in the "RECOMMENDED DESCRIPTION" section. These map to `changesExplained[]` which IS being extracted. However, the change-by-change rationales in the E2E are much richer than simple `{ change, reason }` — they contain full paragraphs. The actual data in `changesExplained` captures this.

### Summary: What DescriptionOptimization Builder Needs to Add

| Data | Type Path from `ActivityWorkshopPipelineResult` | Field |
|------|-----------------------------------------------|-------|
| Deep "Why" per issue | `stage2.teachingDelivered[i].teaching.improvementTeaching[j].whyItMatters.text` | `string` (paragraph) |
| Psychology backing | `stage2.teachingDelivered[i].teaching.improvementTeaching[j].whyItMatters.psychology` | `string?` |
| Research backing | `stage2.teachingDelivered[i].teaching.improvementTeaching[j].whyItMatters.research` | `string?` |
| Expert quote | `stage2.teachingDelivered[i].teaching.improvementTeaching[j].whyItMatters.quote` | `string?` |
| Quote source | `stage2.teachingDelivered[i].teaching.improvementTeaching[j].whyItMatters.quoteSource` | `string?` |
| Transformation analysis | `stage2.teachingDelivered[i].teaching.improvementTeaching[j].transformationAnalysis` | `string?` |
| Issue text references | `stage2.teachingDelivered[i].teaching.improvementTeaching[j].references[]` | `DescriptionReference[]` |
| Alternative descriptions | `stage2.teachingDelivered[i].teaching.descriptionOptimization.alternativeVersions` | `string[]?` |

---

## EXACT CODE CHANGES NEEDED

### Step 1: Update `ActivityInsightData` interface (in `ActivityInsightCard.tsx`)

Add these fields:

```ts
// === NEW: Score rationales (Section A) ===
activityScoreRationales: {
  tierAssessment: { rationale: string; tier: 1|2|3|4 };
  recognitionLevel: { rationale: string; level: string };
  leadershipImpact: { rationale: string; isApplicable: boolean; role: string; impactScope: string };
  communityCharacter: { rationale: string; primaryTrait: string; authenticitySignal: string };
  commitmentProgression: { rationale: string; years: number; showsProgression: boolean };
} | null;
descriptionScoreRationales: {
  specificity: { rationale: string };
  impactClarity: { rationale: string };
  authenticityVoice: { rationale: string };
  actionLanguage: { rationale: string };
  quantification: { rationale: string };
} | null;
tierExplanation: {
  explanation: string;
  whatMakesThisTier: string;
  whatWouldChangeIt: string;
  benchmarks: Array<{ tier: number; benchmark: string; source: string; studentMeets: boolean; gap?: string; evidence?: string }>;
} | null;
activityOverallRationale: string;
descriptionOverallRationale: string;
combinedScoreRationale: string;
comparisonBenchmarks: { similarTo: string; above: string; below: string } | null;

// === NEW: Deep strength teaching (Section B) ===
strengthTeaching: Array<{
  strength: string;
  whyItMatters: string;
  psychology?: string;
  research?: string;
  quote?: string;
  quoteSource?: string;
  howToLeverage: string;
  inApplications: string;
  references: Array<{ quotedText: string; type: string; label: string }>;
}>;
celebrationReferences: Array<{ quotedText: string; type: string; label: string }>;

// === NEW: Deep improvement teaching (Section C) ===
// Update existing improvementTeaching to include:
improvementTeaching: Array<{
  issue: string;
  whyItMatters: string;          // NEW — paragraph explanation
  whyItMattersPsychology?: string; // NEW
  whyItMattersResearch?: string;   // NEW
  whyItMattersQuote?: string;      // NEW
  whyItMattersQuoteSource?: string; // NEW
  howToFix: string;
  exampleBefore: string;
  exampleAfter: string;
  transformationAnalysis?: string;  // NEW
  priority: string;
  references: Array<{ quotedText: string; type: string; label: string }>; // NEW
}>;
alternativeDescriptions: string[];  // NEW
```

### Step 2: Update `buildInsights()` (in `ActivityInsightsList.tsx`)

Add extraction logic for the new fields:

```ts
// Score rationales (from scoring data)
const fullActivityScore = scoreData?.activityScore;
const fullDescScore = scoreData?.descriptionScore;

const activityScoreRationales = fullActivityScore ? {
  tierAssessment: {
    rationale: fullActivityScore.breakdown.tierAssessment.rationale,
    tier: fullActivityScore.breakdown.tierAssessment.tier,
  },
  recognitionLevel: {
    rationale: fullActivityScore.breakdown.recognitionLevel.rationale,
    level: fullActivityScore.breakdown.recognitionLevel.level,
  },
  leadershipImpact: {
    rationale: fullActivityScore.breakdown.leadershipImpact.rationale,
    isApplicable: fullActivityScore.breakdown.leadershipImpact.isApplicable,
    role: fullActivityScore.breakdown.leadershipImpact.role,
    impactScope: fullActivityScore.breakdown.leadershipImpact.impactScope,
  },
  communityCharacter: {
    rationale: fullActivityScore.breakdown.communityCharacter.rationale,
    primaryTrait: fullActivityScore.breakdown.communityCharacter.primaryTrait,
    authenticitySignal: fullActivityScore.breakdown.communityCharacter.authenticitySignal,
  },
  commitmentProgression: {
    rationale: fullActivityScore.breakdown.commitmentProgression.rationale,
    years: fullActivityScore.breakdown.commitmentProgression.years,
    showsProgression: fullActivityScore.breakdown.commitmentProgression.showsProgression,
  },
} : null;

const descriptionScoreRationales = fullDescScore ? {
  specificity: { rationale: fullDescScore.breakdown.specificity.rationale },
  impactClarity: { rationale: fullDescScore.breakdown.impactClarity.rationale },
  authenticityVoice: { rationale: fullDescScore.breakdown.authenticityVoice.rationale },
  actionLanguage: { rationale: fullDescScore.breakdown.actionLanguage.rationale },
  quantification: { rationale: fullDescScore.breakdown.quantification.rationale },
} : null;

// Tier explanation (from stage2 teaching)
const tierExplanation = teaching?.tierExplanation ? {
  explanation: teaching.tierExplanation.explanation?.text ?? '',
  whatMakesThisTier: teaching.tierExplanation.whatMakesThisTier?.text ?? '',
  whatWouldChangeIt: teaching.tierExplanation.whatWouldChangeIt?.text ?? '',
  benchmarks: (teaching.tierExplanation.benchmarksUsed ?? []).map(b => ({
    tier: b.tier,
    benchmark: b.benchmark,
    source: b.source,
    studentMeets: b.studentMeets,
    gap: b.gap ?? undefined,
    evidence: b.evidence,
  })),
} : null;

// Deep strength teaching (from stage2)
const strengthTeaching = (teaching?.strengthTeaching ?? []).map((st) => ({
  strength: st.strength,
  whyItMatters: st.whyItMatters?.text ?? '',
  psychology: st.whyItMatters?.psychology,
  research: st.whyItMatters?.research,
  quote: st.whyItMatters?.quote,
  quoteSource: st.whyItMatters?.quoteSource,
  howToLeverage: st.howToLeverage ?? '',
  inApplications: st.inApplications ?? '',
  references: (st.references ?? []).map(r => ({
    quotedText: r.quotedText,
    type: r.type,
    label: r.label,
  })),
}));

// Celebration references
const celebrationReferences = (teaching?.celebration?.references ?? []).map(r => ({
  quotedText: r.quotedText,
  type: r.type,
  label: r.label,
}));

// Deep improvement teaching (update existing mapping)
improvementTeaching: (teaching?.improvementTeaching ?? []).map((imp) => ({
  issue: imp.issue,
  whyItMatters: imp.whyItMatters?.text ?? '',
  whyItMattersPsychology: imp.whyItMatters?.psychology,
  whyItMattersResearch: imp.whyItMatters?.research,
  whyItMattersQuote: imp.whyItMatters?.quote,
  whyItMattersQuoteSource: imp.whyItMatters?.quoteSource,
  howToFix: imp.howToFix,
  exampleBefore: imp.exampleBefore,
  exampleAfter: imp.exampleAfter,
  transformationAnalysis: imp.transformationAnalysis,
  priority: imp.priority,
  references: (imp.references ?? []).map(r => ({
    quotedText: r.quotedText,
    type: r.type,
    label: r.label,
  })),
})),

// Alternative descriptions
alternativeDescriptions: teaching?.descriptionOptimization?.alternativeVersions ?? [],
```

### Step 3: Update Section Component Props

**ScoreBreakdown**: Add `activityScoreRationales`, `descriptionScoreRationales`, `tierExplanation`, `comparisonBenchmarks` to props. Show rationale text when user expands each dimension bar.

**WhatsWorking**: Add `strengthTeaching[]` to props. Render deep teaching data (why, leverage, references) instead of/alongside the shallow stage1 green flags.

**DescriptionOptimization**: Add `whyItMatters`, `references[]`, `transformationAnalysis`, `alternativeDescriptions` to the improvement items. Show "Why this matters" expandable section per issue. Use `references[]` for inline highlighting in the description text.

---

## KEY INSIGHT: Two Layers of Data

The pipeline produces TWO layers of data for strengths and improvements:

1. **Stage 1 (Analysis)**: Short classifications — `greenFlags[].flag/strength/evidence/admissionsValue` and `descriptionQuality.issues/strengths`. These are what's currently surfaced.

2. **Stage 2 (Teaching)**: Deep teaching — `strengthTeaching[].whyItMatters/howToLeverage` and `improvementTeaching[].whyItMatters/references`. These are the **rich data** that should be surfaced.

The stage1 data is useful for **collapsed/summary** views. The stage2 data should be shown in **expanded/detail** views. The builder agents should design their components to gracefully show both layers.

---

## FILE OWNERSHIP MAP (for builder agents)

| File | Owner |
|------|-------|
| `ActivityInsightCard.tsx` (interface changes) | All builders coordinate |
| `ActivityInsightsList.tsx` (`buildInsights()` changes) | All builders coordinate |
| `sections/ScoreBreakdown.tsx` | Task #2 builder |
| `sections/WhatsWorking.tsx` | Task #3 builder |
| `sections/DescriptionOptimization.tsx` | Task #4 builder |
| `scoring/types.ts` | Read-only (do NOT modify) |
| `types.ts` | Read-only (do NOT modify) |
