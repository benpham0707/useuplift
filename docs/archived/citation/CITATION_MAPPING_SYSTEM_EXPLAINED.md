# Citation Mapping System - How It Works

**Question**: How does the system know what to connect sources to, when to cite, and how to do it?

**Answer**: Automatic citation mapping based on 3 core systems working together.

---

## 🧠 The 3-Part System

```
┌─────────────────┐
│  1. TRIGGERS    │ ──> When do we need a citation?
│  (Detection)    │
└─────────────────┘
         ↓
┌─────────────────┐
│  2. MAPPING     │ ──> Which citations are relevant?
│  (Selection)    │
└─────────────────┘
         ↓
┌─────────────────┐
│  3. PLACEMENT   │ ──> How/where do we show it?
│  (Display)      │
└─────────────────┘
```

---

## Part 1: TRIGGERS (When to Cite)

### The Rule: **Cite Anything That Needs Trust**

Our system automatically detects **5 trigger types** that require citations:

### Trigger Type 1: **Weight Claims**

**Pattern Detection**:
```typescript
// In any text output, detect weight mentions
const weightPattern = /(\d+)%/g;
const valuePattern = /(intellectual vitality|character|impact|voice)/gi;

// If we mention a percentage + value → CITE IT
if (text.match(weightPattern) && text.match(valuePattern)) {
  const citation = citationSelector.selectWeightProof(college_id, value_id);
  attachCitation(text, citation);
}
```

**Example Detection**:
```
Input: "Stanford weighs Intellectual Vitality at 40%"
       ↓
Detected: weight_claim
       ↓
Trigger: Attach IV weight provenance
       ↓
Output: "Stanford weighs Intellectual Vitality at 40%¹"
        + Citation #1 = Full IV provenance
```

---

### Trigger Type 2: **Severity/Importance Claims**

**Pattern Detection**:
```typescript
// Detect severity language
const severityKeywords = [
  'critical', 'crucial', 'essential', 'important',
  'matters most', 'priority', 'key'
];

if (feedback.severity === 'critical' || containsKeywords(text, severityKeywords)) {
  const citation = citationSelector.selectCitationsForIssue({
    issue_detected: issue_id,
    use_for: 'justify_severity'
  });
  attachCitation(text, citation);
}
```

**Example Detection**:
```
Input: "This is critical for Stanford"
       ↓
Detected: severity_claim
       ↓
Trigger: Why is it critical?
       ↓
Output: "This is critical for Stanford²"
        + Citation #2 = Dean Shaw quote or elite pattern data
```

---

### Trigger Type 3: **Elite Patterns (What Works)**

**Pattern Detection**:
```typescript
// Detect elite pattern references
const elitePatternIndicators = [
  /(\d+)% of (successful|high-scoring|admitted)/i,
  /most successful essays/i,
  /pattern analysis/i,
  /winning essays/i
];

if (text.match(elitePatternIndicators)) {
  const citation = citationSelector.selectCitationsForIssue({
    use_for: 'show_elite_pattern'
  });
  attachCitation(text, citation);
}
```

**Example Detection**:
```
Input: "87% of successful Stanford essays include self-directed learning"
       ↓
Detected: elite_pattern
       ↓
Trigger: Cite the research
       ↓
Output: "87% of successful Stanford essays include self-directed learning³"
        + Citation #3 = Internal analysis with methodology
```

---

### Trigger Type 4: **Problem Explanations (Red Flags)**

**Pattern Detection**:
```typescript
// When we detect a red flag and explain WHY it's a problem
if (redFlag.detected && feedback.includes('why_matters')) {
  const citation = citationSelector.selectCitationsForIssue({
    issue_detected: redFlag.type,
    use_for: 'explain_problem',
    context: {
      college_id: college_id,
      essay_type: essay_type
    }
  });
  attachCitation(feedback.why_matters, citation);
}
```

**Example Detection**:
```
Red Flag: CLASS_BASED_ONLY detected
Feedback: "Stanford wants to see learning beyond the classroom"
       ↓
Detected: problem_explanation
       ↓
Trigger: Why does Stanford want this?
       ↓
Output: "Stanford wants to see learning beyond the classroom⁴"
        + Citation #4 = Dean Shaw quote on self-directed learning
```

---

### Trigger Type 5: **Technique Teaching (How to Fix)**

**Pattern Detection**:
```typescript
// When we suggest a technique or improvement
const techniqueIndicators = [
  /try this/i,
  /add.*example/i,
  /shows?:/i,
  /demonstrates?/i,
  /technique/i
];

if (suggestion.how_to_fix && text.match(techniqueIndicators)) {
  const citation = citationSelector.selectCitationsForIssue({
    use_for: 'teach_technique'
  });
  attachCitation(suggestion.how_to_fix, citation);
}
```

**Example Detection**:
```
Suggestion: "Add a self-directed learning example. This shows curiosity."
       ↓
Detected: technique_teaching
       ↓
Trigger: Why does this technique work?
       ↓
Output: "This shows curiosity (Stanford's #1 priority⁵)"
        + Citation #5 = Dean Shaw on IV importance
```

---

## Part 2: MAPPING (Which Citations to Use)

Once a trigger fires, the **CitationSelector** automatically picks the BEST citations.

### The Selection Algorithm

```typescript
class CitationSelector {
  selectCitationsForIssue(context: CitationContext): SelectedCitation[] {
    // Step 1: Get all available citations for this college
    const allCitations = this.getAllCitations(context.college_id);

    // Step 2: Score each citation for THIS specific issue
    const scored = allCitations.map(citation => ({
      citation,
      relevance_score: this.scoreRelevance(citation, context),
      use_for: this.determineUse(citation, context)
    }));

    // Step 3: Sort by relevance, take top 3-5
    return scored
      .filter(item => item.relevance_score > 30) // Minimum threshold
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, topCount)
      .map((item, index) => this.formatCitation(item, index + 1));
  }
}
```

### Relevance Scoring (0-100)

**4 Factors**:

```typescript
scoreRelevance(citation, context) {
  let score = 0;

  // Factor 1: Issue Match (40 points)
  // Does this citation address the specific issue?
  score += scoreIssueMatch(citation, context.issue_detected) * 0.4;

  // Factor 2: Source Authority (30 points)
  // Dean quote (100) > CDS (90) > Website (80) > Analysis (50)
  score += scoreAuthority(citation.type) * 0.3;

  // Factor 3: Recency (20 points)
  // <6 months (100) > <1 year (90) > <2 years (60)
  score += scoreRecency(citation.date) * 0.2;

  // Factor 4: Specificity (10 points)
  // Has quote + numbers (100) > Has quote (50) > Generic (20)
  score += scoreSpecificity(citation) * 0.1;

  return Math.round(score);
}
```

### Example: Selecting Citations for CLASS_BASED_ONLY Issue

```typescript
// Context
const context = {
  issue_detected: 'CLASS_BASED_ONLY',
  severity: 'critical',
  college_id: 'stanford',
  essay_type: 'intellectual_vitality',
  our_feedback: {
    problem: 'Essay only discusses classroom learning',
    why_matters: 'Stanford weighs IV at 40%',
    how_to_fix: 'Add self-directed learning example'
  }
};

// Algorithm runs:
const allCitations = [
  // Citation A: Dean Shaw on IV
  {
    source_id: 'shaw_interview_2023_iv',
    type: 'dean_quote',
    quote: 'We want students who pursue learning for its own sake...',
    date: '2023-05',
  },

  // Citation B: CDS data
  {
    source_id: 'stanford_cds_2023',
    type: 'cds',
    finding: 'Character/Personal Qualities: Very Important',
    date: '2023-08',
  },

  // Citation C: Elite pattern analysis
  {
    source_id: 'elite_pattern_iv',
    type: 'internal_analysis',
    finding: '87% of successful essays show self-directed learning',
    date: '2024-11',
  },

  // ... 10 more citations
];

// Scoring:
Citation A (Dean Shaw):
  - Issue match: 95/100 (mentions "learning for its own sake" - perfect match)
  - Authority: 100/100 (dean quote = highest)
  - Recency: 75/100 (18 months old)
  - Specificity: 80/100 (specific quote)
  → TOTAL: 95*0.4 + 100*0.3 + 75*0.2 + 80*0.1 = 91

Citation B (CDS):
  - Issue match: 40/100 (related but not specific to classroom issue)
  - Authority: 90/100 (official data)
  - Recency: 75/100 (18 months old)
  - Specificity: 60/100 (data but not quote)
  → TOTAL: 40*0.4 + 90*0.3 + 75*0.2 + 60*0.1 = 58

Citation C (Elite Pattern):
  - Issue match: 100/100 (directly addresses self-directed learning)
  - Authority: 50/100 (internal analysis = lower authority)
  - Recency: 100/100 (1 month old)
  - Specificity: 100/100 (has percentage + concrete finding)
  → TOTAL: 100*0.4 + 50*0.3 + 100*0.2 + 100*0.1 = 75

// Result: Top 3 citations selected
1. Citation A (Dean Shaw) - Score: 91
2. Citation C (Elite Pattern) - Score: 75
3. Citation B (CDS) - Score: 58
```

---

### Issue-Specific Keyword Matching

```typescript
const issueKeywordMap = {
  CLASS_BASED_ONLY: [
    'self-directed',
    'beyond classroom',
    'independent',
    'own sake',
    'outside',
    'explore',
    'curiosity'
  ],

  GENERIC_STATEMENTS: [
    'specific',
    'detail',
    'concrete',
    'example',
    'evidence'
  ],

  RESUME_REPETITION: [
    'why',
    'meaning',
    'reflection',
    'growth',
    'insight'
  ],

  LACKS_VOICE: [
    'authentic',
    'voice',
    'genuine',
    'personality',
    'unique'
  ],

  // ... more issue types
};

// Matching algorithm
function scoreIssueMatch(citation, issue) {
  const keywords = issueKeywordMap[issue];
  const citationText = `${citation.quote} ${citation.finding}`.toLowerCase();

  let matchScore = 0;
  for (const keyword of keywords) {
    if (citationText.includes(keyword)) {
      matchScore += 20; // Each keyword match = +20 points
    }
  }

  return Math.min(matchScore, 100);
}
```

---

## Part 3: PLACEMENT (How/Where to Show)

### Display Strategy

```typescript
interface CitationDisplay {
  // Where in the text
  anchor_text: string;          // The specific text to cite
  citation_number: number;      // Superscript number (1, 2, 3...)

  // What to show on hover
  hover_preview: string;        // Short version (1 sentence)

  // What to show on click
  expandable_content: {
    simple: string;             // Level 1 (tweet-length)
    medium: string;             // Level 2 (paragraph)
    detailed: {                 // Level 3 (full methodology)
      sources: ProvenanceSource[];
      methodology: string;
      confidence: string;
    };
  };
}
```

### Automatic Placement Rules

**Rule 1: Cite at First Mention**
```typescript
// First time we mention a weight → cite it
let ivMentioned = false;

function generateText(content) {
  if (content.includes('40%') && !ivMentioned) {
    content = content.replace('40%', '40%¹');
    attachCitation(1, ivProvenance);
    ivMentioned = true;
  }
  return content;
}
```

**Rule 2: Cite Claims, Not Facts**
```typescript
// Claim (needs citation): "Stanford weighs IV at 40%"
// Fact (no citation): "This essay is 500 words"

function needsCitation(statement) {
  const claimIndicators = [
    /weighs?.*\d+%/i,           // Weight claims
    /prioriti(ze|es)/i,          // Priority claims
    /most important/i,           // Importance claims
    /successful essays/i,        // Pattern claims
    /dean.*said/i,               // Authority claims
  ];

  return claimIndicators.some(pattern => statement.match(pattern));
}
```

**Rule 3: Progressive Disclosure**
```typescript
// Don't overwhelm—show citations progressively

function displayCitations(citations, context) {
  if (context.severity === 'critical') {
    return citations.slice(0, 5); // Show top 5 for critical issues
  } else if (context.severity === 'major') {
    return citations.slice(0, 3); // Show top 3 for major issues
  } else {
    return citations.slice(0, 2); // Show top 2 for minor issues
  }
}
```

---

## 🔧 Implementation: End-to-End Example

### Scenario: Student Gets Feedback on CLASS_BASED_ONLY Issue

```typescript
// Step 1: Red flag detected
const redFlag = {
  type: 'CLASS_BASED_ONLY',
  severity: 'critical',
  detected_in: 'essay_paragraph_2',
  evidence: 'Only mentions AP Biology class, no self-directed learning'
};

// Step 2: Generate feedback (without citations yet)
const feedback = {
  problem: 'Your essay focuses only on what you learned in AP Biology class. Stanford wants to see learning that goes beyond the classroom.',

  why_matters: 'Stanford weighs Intellectual Vitality at 40%—their highest priority. Dean Shaw said: "We want students who pursue learning for its own sake."',

  how_to_fix: 'Add an example of learning you pursued outside of class. This shows self-directed curiosity (Stanford\'s #1 priority).'
};

// Step 3: TRIGGERS fire
const triggers = detectCitationNeeds(feedback);
// Returns:
[
  { type: 'weight_claim', text: '40%', location: 'why_matters' },
  { type: 'authority_quote', text: 'Dean Shaw said', location: 'why_matters' },
  { type: 'severity', text: 'critical', location: 'problem' },
  { type: 'technique', text: 'Add an example', location: 'how_to_fix' }
]

// Step 4: MAPPING - Select citations for each trigger
const citationSelector = new CitationSelector();

const citations = {
  weight_claim: citationSelector.selectWeightProof('stanford', 'intellectual_vitality'),
  // Returns: IV weight provenance (Dean Shaw + CDS + frequency)

  authority_quote: citationSelector.selectCitationsForIssue({
    issue_detected: 'CLASS_BASED_ONLY',
    use_for: 'explain_problem',
    college_id: 'stanford'
  }),
  // Returns: Full Dean Shaw quote about self-directed learning

  elite_pattern: citationSelector.selectCitationsForIssue({
    use_for: 'show_elite_pattern',
    issue_detected: 'CLASS_BASED_ONLY'
  })
  // Returns: 87% elite pattern analysis
};

// Step 5: PLACEMENT - Attach citations to text
const feedbackWithCitations = {
  problem: 'Your essay focuses only on what you learned in AP Biology class. Stanford wants to see learning that goes beyond the classroom.',

  why_matters: 'Stanford weighs Intellectual Vitality at 40%¹—their highest priority. Dean Shaw said: "We want students who pursue learning for its own sake²."',

  how_to_fix: 'Add an example of learning you pursued outside of class³. This shows self-directed curiosity (Stanford\'s #1 priority¹).',

  citations: {
    '1': citations.weight_claim[0],      // IV weight provenance
    '2': citations.authority_quote[0],   // Dean Shaw full quote
    '3': citations.elite_pattern[0]      // 87% pattern
  }
};

// Step 6: Format for frontend display
const displayData = {
  feedback: feedbackWithCitations,

  citation_display: citations.map((cit, index) => ({
    number: index + 1,
    hover_text: cit.presentation.simplified_version,
    expandable: {
      simple: cit.presentation.simplified_version,
      detailed: cit.presentation.full_version
    }
  }))
};
```

---

## 📊 Data Flow Diagram

```
User writes essay
       ↓
AI analyzes essay → Detects red flags
       ↓
For each red flag:
       ↓
┌──────────────────────────────────────────┐
│ TRIGGER DETECTION                        │
│ - Weight claim? (40%)                    │
│ - Severity claim? (critical)             │
│ - Elite pattern? (87%)                   │
│ - Problem explanation?                   │
│ - Technique teaching?                    │
└──────────────────────────────────────────┘
       ↓
┌──────────────────────────────────────────┐
│ CITATION MAPPING                         │
│ CitationSelector.selectCitationsForIssue │
│                                          │
│ Input: {                                 │
│   issue: 'CLASS_BASED_ONLY',            │
│   college: 'stanford',                   │
│   use_for: 'explain_problem'            │
│ }                                        │
│                                          │
│ Algorithm:                               │
│ 1. Get all Stanford citations (13)      │
│ 2. Score each for relevance (0-100)     │
│ 3. Sort by score                         │
│ 4. Return top 3-5                        │
└──────────────────────────────────────────┘
       ↓
┌──────────────────────────────────────────┐
│ CITATION PLACEMENT                       │
│                                          │
│ Original text:                           │
│ "Stanford weighs IV at 40%"              │
│                                          │
│ With citation:                           │
│ "Stanford weighs IV at 40%¹"             │
│                                          │
│ + Citation data for superscript ¹       │
└──────────────────────────────────────────┘
       ↓
Frontend displays:
- Feedback with superscript numbers
- Hover shows preview
- Click shows full provenance
```

---

## 🎯 Summary: The Complete Flow

### 1. WHEN to Cite (Triggers)
✅ Weight claims (40%, 25%, etc.)
✅ Severity/importance claims (critical, matters most)
✅ Elite patterns (87% of successful essays)
✅ Problem explanations (why it's an issue)
✅ Technique teaching (how to fix)

### 2. WHICH Citations to Use (Mapping)
✅ Score all citations for relevance (0-100)
✅ Factors: Issue match (40%) + Authority (30%) + Recency (20%) + Specificity (10%)
✅ Select top 3-5 most relevant
✅ Match issue keywords (CLASS_BASED_ONLY → "self-directed", "beyond classroom")

### 3. HOW to Display (Placement)
✅ Superscript numbers (non-intrusive)
✅ First mention only (don't repeat)
✅ Progressive disclosure (simple → medium → detailed)
✅ Hover for preview, click for full

---

## 💡 Why This Works

### For Students:
- **Automatic**: They don't have to ask "how do you know?"—citations are already there
- **Context-aware**: Citations match THEIR specific issue, not generic
- **Trustworthy**: Can verify every claim independently

### For the System:
- **Scalable**: Add new colleges/citations without changing code
- **Intelligent**: Best citations automatically selected
- **Maintainable**: Update sources in one place, propagates everywhere

### For Developers:
- **Declarative**: Define triggers + citations, system handles mapping
- **Data-driven**: No hard-coded citation assignments
- **Extensible**: Easy to add new trigger types or citation uses

---

## 🔑 Key Innovation

**Old way**:
- Hard-code citations: "If essay is about Stanford IV, show citation #42"
- Breaks when you add new citations or colleges
- Not context-aware

**Our way**:
- Detect citation needs automatically (triggers)
- Score citations dynamically for THIS student's issue
- Select best matches in real-time
- Works for any college, any issue, any context

**Result**: Smart, scalable, student-friendly citation system that builds trust through radical transparency. 🎯
