# Citation System - Visual Flow Guide

**Purpose**: Show EXACTLY how citations flow from detection → selection → display

---

## 📊 Complete Data Flow (End-to-End)

```
┌─────────────────────────────────────────────────────────────────────┐
│ USER ACTION: Student submits essay                                 │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ AI ANALYZES: Detects red flag (CLASS_BASED_ONLY)                   │
│                                                                     │
│ Finding: "Essay only discusses AP Biology class,                   │
│           no self-directed learning"                                │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ FEEDBACK GENERATION: Create suggestion (NO citations yet)          │
│                                                                     │
│ feedback = {                                                        │
│   problem: "Your essay focuses only on classroom learning.         │
│             Stanford wants to see learning beyond the classroom."   │
│                                                                     │
│   why_matters: "Stanford weighs Intellectual Vitality at 40%—      │
│                 their highest priority. Dean Shaw said: 'We want   │
│                 students who pursue learning for its own sake.'"    │
│                                                                     │
│   how_to_fix: "Add an example of learning you pursued outside      │
│                of class. This shows self-directed curiosity         │
│                (Stanford's #1 priority)."                           │
│ }                                                                   │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
╔═════════════════════════════════════════════════════════════════════╗
║ LAYER 1: CITATION TRIGGER DETECTION                                ║
║ File: citationTriggerDetector.ts                                   ║
╚═════════════════════════════════════════════════════════════════════╝
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ SCAN TEXT: Look for citation triggers                              │
│                                                                     │
│ Text: "Stanford weighs Intellectual Vitality at 40%..."            │
│                                                                     │
│ Pattern Match:                                                      │
│   ✓ Found "40%" → weight_claim trigger                            │
│   ✓ Found "highest priority" → severity_claim trigger             │
│   ✓ Found "Dean Shaw said" → authority_quote trigger              │
│   ✓ Found "Add an example" → technique_teaching trigger           │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ OUTPUT: List of triggers                                           │
│                                                                     │
│ triggers = [                                                        │
│   {                                                                 │
│     type: 'weight_claim',                                          │
│     location: 'why_matters',                                       │
│     anchor_text: '40%',                                            │
│     context: {                                                     │
│       college_id: 'stanford',                                      │
│       value_id: 'intellectual_vitality'                            │
│     }                                                              │
│   },                                                               │
│   {                                                                │
│     type: 'severity_claim',                                        │
│     location: 'why_matters',                                       │
│     anchor_text: 'highest priority',                               │
│     context: { college_id: 'stanford' }                            │
│   },                                                               │
│   {                                                                │
│     type: 'authority_quote',                                       │
│     location: 'why_matters',                                       │
│     anchor_text: 'Dean Shaw said',                                 │
│     context: { college_id: 'stanford' }                            │
│   },                                                               │
│   {                                                                │
│     type: 'technique_teaching',                                    │
│     location: 'how_to_fix',                                        │
│     anchor_text: 'Add an example',                                 │
│     context: {                                                     │
│       college_id: 'stanford',                                      │
│       issue_type: 'CLASS_BASED_ONLY'                               │
│     }                                                              │
│   }                                                                │
│ ]                                                                  │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
╔═════════════════════════════════════════════════════════════════════╗
║ LAYER 2: CITATION SELECTION                                        ║
║ File: provenanceCitationSelector.ts                                ║
╚═════════════════════════════════════════════════════════════════════╝
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ FOR EACH TRIGGER: Select best citations                            │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ TRIGGER #1: weight_claim (40%)                                     │
│                                                                     │
│ citationSelector.selectWeightProof('stanford', 'intellectual_vitality')
│                                                                     │
│ → Returns: Complete IV provenance with all sources                 │
│                                                                     │
│ Selected Citation:                                                  │
│   {                                                                 │
│     citation: {                                                     │
│       source_id: 'shaw_interview_2023_iv',                         │
│       type: 'dean_quote',                                          │
│       author: 'Richard Shaw',                                      │
│       quote: 'Intellectual vitality is our top priority...',       │
│       publication: 'Stanford Magazine',                            │
│       date: '2023-05'                                              │
│     },                                                             │
│     relevance: {                                                   │
│       score: 95,                                                   │
│       reason: 'Dean explicitly states IV as #1 priority',          │
│       use_for: 'prove_weight'                                      │
│     }                                                              │
│   }                                                                │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ TRIGGER #2: severity_claim (highest priority)                      │
│                                                                     │
│ citationSelector.selectCitationsForIssue({                         │
│   issue_detected: 'CLASS_BASED_ONLY',                             │
│   use_for: 'justify_severity',                                    │
│   college_id: 'stanford'                                           │
│ })                                                                 │
│                                                                     │
│ Algorithm:                                                          │
│   1. Get all 13 Stanford citations                                 │
│   2. Score each for relevance to CLASS_BASED_ONLY                  │
│                                                                     │
│      Citation A (Dean Shaw on IV):                                 │
│        - Issue match: 95/100 (mentions "self-directed")           │
│        - Authority: 100/100 (dean quote)                           │
│        - Recency: 75/100 (18 months old)                           │
│        - Specificity: 80/100 (specific quote)                      │
│        → TOTAL: 91/100 ⭐ TOP PICK                                 │
│                                                                     │
│      Citation B (Elite Pattern):                                   │
│        - Issue match: 100/100 (directly about self-directed)       │
│        - Authority: 50/100 (internal analysis)                     │
│        - Recency: 100/100 (recent)                                 │
│        - Specificity: 100/100 (has %)                              │
│        → TOTAL: 75/100 ⭐ SECOND PICK                              │
│                                                                     │
│   3. Return top 2 citations                                         │
│                                                                     │
│ Selected Citations: [Citation A, Citation B]                       │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ TRIGGER #3 & #4: Similar selection process...                      │
│ (Repeat for all triggers)                                          │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
╔═════════════════════════════════════════════════════════════════════╗
║ LAYER 3: CITATION ATTACHMENT & FORMATTING                          ║
║ File: citationAttacher.ts                                          ║
╚═════════════════════════════════════════════════════════════════════╝
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 1: Insert superscript numbers                                 │
│                                                                     │
│ Before:                                                             │
│ "Stanford weighs Intellectual Vitality at 40%—their highest        │
│  priority. Dean Shaw said: 'We want students who pursue            │
│  learning for its own sake.'"                                      │
│                                                                     │
│ After:                                                              │
│ "Stanford weighs Intellectual Vitality at 40%<sup>1</sup>—their    │
│  highest priority<sup>2</sup>. Dean Shaw said<sup>3</sup>: 'We     │
│  want students who pursue learning for its own sake.'"             │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 2: Format 3-level explanations for each citation              │
│                                                                     │
│ Citation #1 (40% weight):                                          │
│                                                                     │
│   LEVEL 1 (Simple):                                                │
│   "Stanford's dean said this is their 'top priority' + we counted  │
│    mentions across sources (3x more than any other)"               │
│                                                                     │
│   LEVEL 2 (Medium):                                                │
│   "Dean Richard Shaw (Dean of Admission, Stanford):                │
│    'Intellectual vitality is our top priority. We want students... │
│                                                                     │
│    We also analyzed 52 Stanford sources: IV mentioned 127x,        │
│    Character 83x, Impact 61x, Voice 42x.                           │
│                                                                     │
│    Ratio: 3:2:1.5:1 → 40% + 25% + 20% + 15% = 100%'                │
│                                                                     │
│   LEVEL 3 (Detailed):                                              │
│   [Full provenance with all sources, methodology, confidence...]   │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 3: Generate hover previews                                    │
│                                                                     │
│ Citation #1 hover:                                                  │
│   "Dean Shaw: 'Intellectual vitality is our top priority...'"      │
│                                                                     │
│ Citation #2 hover:                                                  │
│   "Dean Shaw explicitly ranks IV as #1 priority"                   │
│                                                                     │
│ Citation #3 hover:                                                  │
│   "Richard Shaw, Dean of Admission: 'We want students who...'"     │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ OUTPUT: Complete feedback with citations                           │
│                                                                     │
│ {                                                                   │
│   problem: "Your essay focuses only on classroom learning.         │
│             Stanford wants to see learning beyond the classroom.",  │
│                                                                     │
│   why_matters: "Stanford weighs Intellectual Vitality at           │
│                 40%<sup>1</sup>—their highest priority<sup>2</sup>.│
│                 Dean Shaw said<sup>3</sup>: 'We want students who  │
│                 pursue learning for its own sake.'",                │
│                                                                     │
│   how_to_fix: "Add an example<sup>4</sup> of learning you pursued  │
│                outside of class. This shows self-directed curiosity │
│                (Stanford's #1 priority<sup>1</sup>).",              │
│                                                                     │
│   citations: {                                                      │
│     1: {                                                            │
│       number: 1,                                                    │
│       hover_preview: "Dean Shaw: 'IV is our top priority...'",     │
│       expandable: {                                                 │
│         simple: "Stanford's dean said...",                          │
│         medium: "Dean Richard Shaw said...",                        │
│         detailed: "[Full provenance...]"                            │
│       }                                                             │
│     },                                                              │
│     2: { /* Citation #2 data */ },                                  │
│     3: { /* Citation #3 data */ },                                  │
│     4: { /* Citation #4 data */ }                                   │
│   }                                                                 │
│ }                                                                   │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
╔═════════════════════════════════════════════════════════════════════╗
║ FRONTEND DISPLAY                                                    ║
╚═════════════════════════════════════════════════════════════════════╝
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ USER SEES:                                                          │
│                                                                     │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ 🔴 CRITICAL ISSUE: Classroom-Bounded Learning                 │ │
│ │                                                                │ │
│ │ Your essay focuses only on classroom learning. Stanford wants │ │
│ │ to see learning beyond the classroom.                         │ │
│ │                                                                │ │
│ │ 💬 Why This Matters:                                          │ │
│ │ Stanford weighs Intellectual Vitality at 40%¹—their highest   │ │
│ │ priority². Dean Shaw said³: "We want students who pursue      │ │
│ │ learning for its own sake."                                   │ │
│ │                                                                │ │
│ │ 💡 How to Fix:                                                │ │
│ │ Add an example⁴ of learning you pursued outside of class.    │ │
│ │ This shows self-directed curiosity (Stanford's #1 priority¹). │ │
│ └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ USER HOVERS OVER ¹:                                                │
│                                                                     │
│ 💬 Popup appears:                                                   │
│ "Dean Shaw: 'Intellectual vitality is our top priority...'"        │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ USER CLICKS ¹:                                                     │
│                                                                     │
│ 📚 Expandable panel slides open:                                   │
│                                                                     │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ 📚 How We Know Stanford Weighs IV at 40%                      │ │
│ │                                                                │ │
│ │ ▼ SIMPLE EXPLANATION                                          │ │
│ │   Stanford's dean said this is their "top priority" + we     │ │
│ │   counted mentions across sources (3x more than others)       │ │
│ │                                                                │ │
│ │ ▼ DETAILED METHODOLOGY (click to expand)                      │ │
│ │   [Collapsed]                                                 │ │
│ │                                                                │ │
│ │ ▼ PRIMARY SOURCES                                             │ │
│ │                                                                │ │
│ │   🎤 Dean Richard Shaw                                        │ │
│ │      "Intellectual vitality is our top priority. We want...   │ │
│ │                                                                │ │
│ │      Source: Stanford Magazine, May 2023                      │ │
│ │      📎 [Read Full Interview →]                               │ │
│ │      ✓ Verified: December 1, 2024                             │ │
│ │                                                                │ │
│ │   📊 Stanford Common Data Set 2023-24                         │ │
│ │      Character/Personal Qualities: "Very Important"           │ │
│ │                                                                │ │
│ │      📎 [View CDS →]                                          │ │
│ │      ✓ Verified: December 1, 2024                             │ │
│ │                                                                │ │
│ │ ▼ CONFIDENCE LEVEL                                            │ │
│ │   Very High (90%+)                                            │ │
│ │   Reasoning: Direct dean quote + official CDS + quantitative  │ │
│ └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ RESULT: Student trusts the feedback                                │
│                                                                     │
│ ✅ Can see WHERE claim came from (Dean Shaw quote)                 │
│ ✅ Can understand HOW we calculated (methodology clear)            │
│ ✅ Can verify independently (URLs provided)                        │
│ ✅ Gets explanation at THEIR level (simple English)                │
│                                                                     │
│ → TRUST THROUGH TRANSPARENCY 🎯                                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Alternative Flow: Weight Proof Request

**When student explicitly asks "How do you know IV is 40%?"**

```
┌─────────────────────────────────────────────────────────────────────┐
│ USER ASKS: "How do you know Stanford weighs IV at 40%?"            │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ DIRECT PROVENANCE LOOKUP                                           │
│                                                                     │
│ citationSelector.selectWeightProof('stanford', 'intellectual_vitality')
│                                                                     │
│ → Returns complete IV provenance (no scoring needed, direct match) │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ DISPLAY: Full 3-level explanation                                  │
│                                                                     │
│ Level 1: "Dean Shaw said it's their top priority + we counted..."  │
│ Level 2: [Medium explanation with sources]                         │
│ Level 3: [Complete methodology + all sources + confidence]         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Decision Points

### Decision 1: Which Trigger Type?

```
Text Analysis
      ↓
Contains percentage? → weight_claim
Contains "critical"? → severity_claim
Contains "X% of successful"? → elite_pattern
Contains "Dean said"? → authority_quote
Contains "Add/Try"? → technique_teaching
```

### Decision 2: Which Citation to Use?

```
For weight_claim:
  → Use full provenance (all sources)

For severity_claim:
  → Score all citations for relevance
  → Pick highest scoring (usually dean quote)

For elite_pattern:
  → Filter for internal_analysis type
  → Pick most recent with highest specificity

For authority_quote:
  → Filter for dean_quote type
  → Pick exact match for context

For technique_teaching:
  → Score for teaching value
  → Pick citations that explain WHY technique works
```

### Decision 3: How Much Detail to Show?

```
Default: Level 1 (Simple)
  ↓
User hovers: Show preview
  ↓
User clicks: Expand to Level 2 (Medium)
  ↓
User clicks "Show full research": Expand to Level 3 (Detailed)
```

---

## 📊 Scoring Algorithm Visualization

```
CITATION RELEVANCE SCORE =
  (Issue Match × 0.4) +
  (Authority × 0.3) +
  (Recency × 0.2) +
  (Specificity × 0.1)

Example: Dean Shaw Quote for CLASS_BASED_ONLY

Issue Match:
  ├─ Quote contains "self-directed": +20
  ├─ Quote contains "beyond classroom": +20
  ├─ Quote contains "own sake": +20
  ├─ Quote contains "independent": +20
  └─ Total: 80/100 → 80 × 0.4 = 32 points

Authority:
  └─ Type: dean_quote = 100/100 → 100 × 0.3 = 30 points

Recency:
  └─ Date: 2023-05 (18 months) = 75/100 → 75 × 0.2 = 15 points

Specificity:
  ├─ Has specific quote: +50
  ├─ Quote length > 30 chars: +30
  └─ Total: 80/100 → 80 × 0.1 = 8 points

FINAL SCORE: 32 + 30 + 15 + 8 = 85/100 ⭐ HIGH RELEVANCE
```

---

## 🎓 Student Experience Journey

```
1. Student writes essay
         ↓
2. Receives feedback: "Stanford weighs IV at 40%¹"
         ↓
3. Thinks: "How do they know that?"
         ↓
4. Hovers over ¹: "Dean Shaw said it's their top priority..."
         ↓
5. Thinks: "Interesting, but I want more proof"
         ↓
6. Clicks ¹: Sees full explanation with dean quote + CDS + methodology
         ↓
7. Clicks "Read Full Interview": Goes to Stanford Magazine source
         ↓
8. Verifies independently: "Wow, this is legit!"
         ↓
9. TRUSTS the system: "They actually have real sources"
         ↓
10. Takes the feedback seriously and improves essay
         ↓
✅ BETTER ESSAY + TRUST IN SYSTEM
```

---

## 🚀 Summary

### The Complete Flow

1. **Student submits essay** → AI detects issues
2. **Feedback generated** → System scans for citation needs (triggers)
3. **Triggers detected** → 5 types: weight, severity, elite, authority, technique
4. **Citations selected** → Scored 0-100 for relevance, top picks chosen
5. **Text updated** → Superscripts inserted, 3-level explanations prepared
6. **Student sees feedback** → With citations ready to explore
7. **Student hovers/clicks** → Progressive disclosure of sources
8. **Student trusts system** → Can verify every claim independently

### Result

**Automatic + Intelligent + Student-Friendly = Trust** 🎯
