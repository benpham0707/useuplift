# PIQ Narrative Scoring Architecture

**Status:** Design Phase - Ready for Implementation
**Date:** 2025-11-18

---

## 🎯 CORE PHILOSOPHY

**PIQ scores evaluate ESSAY NARRATIVE QUALITY, not portfolio credentials.**

Portfolio data (activities, GPA, etc.) helps:
- ✅ Recommend which PIQs to write (fit score)
- ✅ Suggest story ideas
- ✅ Provide context

Portfolio data does NOT:
- ❌ Dominate the PIQ score
- ❌ Let students score high without good writing
- ❌ Create circular dependency (portfolio → PIQ score → overall score)

---

## 📊 TWO-LAYER SYSTEM

### **Layer 1: Backend Analysis (In-Depth)**
**Purpose:** Comprehensive essay analysis with deep insights

**Input:**
```typescript
{
  essay_text: string;
  prompt_number: 1-8;
  user_context?: {
    // Optional context from portfolio for suggestions only
    activities?: Activity[];
    intended_major?: string;
    barriers?: string[];
  }
}
```

**Process:**
- Runs 13-dimension analysis using existing world-class analyzers
- Each dimension analyzed by specialized function (hybrid deterministic + LLM)
- Generates long-form insights, specific feedback, upgrade guidance

**Output:**
```typescript
{
  overall_score: number; // 0-110 (aligned with 110-point scale)
  tier: 'needs_growth' | 'developing' | 'competitive' | 'very_competitive' | 'highly_competitive' | 'elite';

  dimension_scores: {
    opening_hook: { score: number; weight: number; analysis: HookAnalysisResult };
    vulnerability: { score: number; weight: number; analysis: VulnerabilityAnalysis };
    specificity: { score: number; weight: number; analysis: SpecificityAnalysis };
    voice: { score: number; weight: number; analysis: VoiceAnalysis };
    narrative_arc: { score: number; weight: number; analysis: ArcAnalysis };
    transformative_impact: { score: number; weight: number; analysis: TransformationAnalysis };
    role_clarity: { score: number; weight: number; analysis: RoleAnalysis };
    initiative: { score: number; weight: number; analysis: InitiativeAnalysis };
    context: { score: number; weight: number; analysis: ContextAnalysis };
    reflection: { score: number; weight: number; analysis: ReflectionAnalysis };
    identity: { score: number; weight: number; analysis: IdentityAnalysis };
    craft: { score: number; weight: number; analysis: CraftAnalysis };
    fit: { score: number; weight: number; analysis: FitAnalysis };
  };

  strengths: Array<{ dimension: string; why: string; example: string }>;
  weaknesses: Array<{ dimension: string; why: string; how_to_fix: string }>;

  priority_improvements: Array<{
    dimension: string;
    current_score: number;
    potential_gain: number; // How many points you could gain
    effort_level: 'quick_win' | 'strategic' | 'deep_work';
    specific_guidance: string;
  }>;

  school_placement: {
    current_tier: string;
    schools: string[];
    next_tier: string;
    points_needed: number;
    how_to_get_there: string;
  };

  long_form_insights: {
    what_works: string; // Paragraph on strengths
    what_limits: string; // Paragraph on weaknesses
    transformation_opportunity: string; // Detailed upgrade path
    world_class_elevation: string; // How to reach elite level
  };
}
```

---

### **Layer 2: Frontend API (UI/UX Optimized)**
**Purpose:** Format analysis for frontend consumption, rank priorities

**Input:** Raw backend analysis output

**Process:**
- Ranks dimensions by improvement potential (biggest point gains first)
- Filters to top 3-5 most critical dimensions to show user
- Formats insights for different UI contexts:
  - Dashboard summary (1-2 sentences)
  - Detailed view (full analysis)
  - Quick wins (actionable next steps)
- Chooses most impactful quotes/examples
- Generates progress tracking data

**Output:**
```typescript
{
  summary: {
    score: number; // 0-110
    tier: string;
    one_sentence: string; // "Your essay is competitive for UC Davis. Focus on adding vulnerability."
    school_placement: string[];
  };

  top_priorities: Array<{
    dimension: string;
    score: string; // "6/10" (user-friendly format)
    issue: string; // "Your opening is generic"
    fix: string; // "Start with a specific moment instead"
    example: string; // "Instead of 'I've always loved science', try 'My hands shook as I...'"
    impact: string; // "Could add 8-12 points to your score"
  }>;

  strengths_to_leverage: Array<{
    dimension: string;
    what_works: string;
    how_to_use_it: string;
  }>;

  next_steps: {
    quick_wins: string[]; // 2-3 immediate changes (< 30 min)
    strategic_work: string[]; // Deeper revisions (2-4 hours)
    world_class_elevation: string; // Transformative changes
  };

  progress_tracking: {
    dimensions_strong: string[]; // Already good (7+/10)
    dimensions_adequate: string[]; // Okay but could improve (5-7/10)
    dimensions_weak: string[]; // Need work (<5/10)
    estimated_potential_score: number; // If you fix everything
  };
}
```

---

## 🔧 IMPLEMENTATION PLAN

### **Phase 1: Backend Analysis Layer**

**1.1: Create 13-Dimension Analysis Orchestrator**
- New file: `mcp-uplift-portfolio/src/tools/piq/analyzePIQEssay.ts`
- Orchestrates all 13 analyzers
- Calculates weighted scores based on PIQ prompt type
- Generates comprehensive output

**1.2: Leverage Existing Analyzers**
Already implemented (world-class quality):
- ✅ `openingHookAnalyzer_v5_hybrid.ts` → Dimension 1
- ✅ `vulnerabilityAnalyzer_v3.ts` → Dimension 2
- ✅ `vividnessAnalyzer.ts` → Part of Dimension 3
- ✅ (Check for other existing analyzers)

Need to implement:
- ⚠️ Specificity & Evidence analyzer (Dimension 3)
- ⚠️ Voice Integrity analyzer (Dimension 4)
- ⚠️ Narrative Arc & Stakes analyzer (Dimension 5)
- ⚠️ Transformative Impact analyzer (Dimension 6)
- ⚠️ Role Clarity analyzer (Dimension 7)
- ⚠️ Initiative & Leadership analyzer (Dimension 8)
- ⚠️ Context & Circumstances analyzer (Dimension 9)
- ⚠️ Reflection & Insight analyzer (Dimension 10)
- ⚠️ Identity & Self-Discovery analyzer (Dimension 11)
- ⚠️ Craft & Language Quality analyzer (Dimension 12)
- ⚠️ Fit & Trajectory analyzer (Dimension 13)

**1.3: Define Dimension Weights per PIQ**
Based on MERGED_13_DIMENSION_PIQ_RUBRIC.md:
```typescript
const DIMENSION_WEIGHTS = {
  1: { // PIQ 1 (Leadership)
    opening_hook: 0.09,
    vulnerability: 0.08,
    specificity: 0.10,
    voice: 0.08,
    narrative_arc: 0.08,
    transformative_impact: 0.10,
    role_clarity: 0.09,
    initiative: 0.10,
    context: 0.05,
    reflection: 0.09,
    identity: 0.05,
    craft: 0.06,
    fit: 0.05
  },
  // ... PIQ 2-8
};
```

---

### **Phase 2: Frontend API Layer**

**2.1: Create API Formatter**
- New file: `mcp-uplift-portfolio/src/tools/piq/formatForUI.ts`
- Takes backend analysis
- Ranks by improvement potential
- Filters top priorities
- Formats for UI consumption

**2.2: Implement Ranking Logic**
Priority ranking algorithm:
```typescript
function rankImprovementPriority(dimension_scores) {
  return dimensions
    .map(d => ({
      dimension: d.name,
      current_score: d.score,
      potential_gain: (10 - d.score) * d.weight, // Max points you could gain
      effort: estimateEffort(d), // Quick win vs deep work
    }))
    .sort((a, b) => b.potential_gain - a.potential_gain)
    .slice(0, 5); // Top 5 priorities
}
```

---

### **Phase 3: Refactor suggest_piq_prompts**

**Current (WRONG):** Scores PIQs based on portfolio

**New (RIGHT):** Recommends PIQs based on portfolio fit

```typescript
// NEW: suggest_piq_prompts should return FIT SCORE (how well your portfolio matches this PIQ)
// NOT narrative quality score (that comes from analyze_piq_essay)

interface PIQRecommendation {
  prompt_number: number;
  prompt_text: string;

  fit_score: number; // 0-110: How well your PORTFOLIO fits this PIQ
  fit_rationale: string; // Why this PIQ is good for you

  story_suggestions: string[]; // What to write about
  dimension_alignment: string[]; // Which dimensions you're likely strong in

  // REMOVED: essay_score (this comes from analyze_piq_essay after writing)
}
```

---

## 🎓 SCORING PHILOSOPHY

### **110-Point Scale Alignment**

**100-110: Elite Competitive**
- Top 3-5% of PIQ essays nationally
- 11-13 dimensions scoring 8-10/10
- Harvard, Yale, Princeton, Stanford, MIT competitive

**90-99: Highly Competitive**
- Top 10-15% of PIQ essays
- 9-11 dimensions scoring 7-10/10
- UC Berkeley, UCLA, Northwestern, Duke competitive

**80-89: Very Competitive**
- Top 20-25% of PIQ essays
- 7-9 dimensions scoring 6-10/10
- UC San Diego, Michigan, UNC competitive

**70-79: Competitive**
- Top 35-40% of PIQ essays
- 5-7 dimensions scoring 5-10/10
- UC Davis, UC Irvine, BU competitive

**60-69: Developing**
- Shows potential but needs strengthening
- 3-5 dimensions scoring 4-10/10
- UC Riverside, UC Merced, state schools

**<60: Needs Growth**
- Requires significant revision
- <3 dimensions scoring above 5/10
- Specific actionable guidance provided

---

## 📝 EXAMPLE FLOW

### **Step 1: Get PIQ Recommendations (Portfolio-Based)**
```typescript
const recommendations = await suggest_piq_prompts({ user_id: 'abc123' });

// Returns:
{
  recommendations: [
    {
      prompt_number: 4,
      fit_score: 85, // Your first-gen + family story fits PIQ 4 well
      fit_rationale: "You have significant educational barriers (first-gen, family responsibilities) that would make a compelling PIQ 4. Your story has depth.",
      story_suggestions: ["Balancing family responsibilities while taking 9 APs", ...]
    },
    ...
  ]
}
```

### **Step 2: Student Writes Essay**
Student writes PIQ 4 about their experience.

### **Step 3: Analyze Essay (Narrative-Based)**
```typescript
const analysis = await analyze_piq_essay({
  essay_text: "My hands shook as I dialed the number...",
  prompt_number: 4,
  user_context: { /* optional */ }
});

// Returns:
{
  overall_score: 74, // Based on ESSAY QUALITY, not portfolio
  tier: 'competitive',

  dimension_scores: {
    opening_hook: { score: 8.5, analysis: { hook_type: 'vulnerability_first', ... } },
    vulnerability: { score: 7.0, analysis: { vulnerability_level: 3, ... } },
    specificity: { score: 6.0, ... }, // Could use more concrete details
    ...
  },

  priority_improvements: [
    {
      dimension: 'specificity',
      current_score: 6.0,
      potential_gain: 12, // Could add 12 points if you add specifics
      effort_level: 'strategic',
      specific_guidance: "Add numbers: How many hours/week? How many family members? What exactly did you sacrifice?"
    },
    ...
  ]
}
```

### **Step 4: Format for UI**
```typescript
const uiData = await format_piq_for_ui(analysis);

// Returns:
{
  summary: {
    score: 74,
    tier: 'competitive',
    one_sentence: "Your essay is competitive for UC Davis and UC Irvine. Add specific details to reach UC San Diego level.",
    school_placement: ['UC Davis', 'UC Irvine', 'BU', 'Wisconsin']
  },

  top_priorities: [
    {
      dimension: 'Specificity & Evidence',
      score: '6/10',
      issue: 'You mention family responsibilities but don't quantify',
      fix: 'Add concrete numbers and details',
      example: 'Instead of "I help my family a lot", try "I care for my two younger siblings 15 hours/week while my parents work night shifts"',
      impact: 'Could add 10-12 points'
    },
    ...
  ]
}
```

---

## 🚀 BENEFITS OF THIS ARCHITECTURE

### **For Students:**
✅ Understand exactly what makes their essay strong/weak
✅ Get actionable feedback they can actually use
✅ See clear path from current level to next tier
✅ Can improve essay through better writing, not just better resume

### **For System:**
✅ No circular dependency (portfolio doesn't inflate PIQ score)
✅ Scores reflect essay quality, not credentials
✅ Leverages world-class existing analyzers
✅ Two-layer architecture separates concerns (analysis vs UI formatting)

### **For Development:**
✅ Backend layer focuses on depth and accuracy
✅ Frontend layer optimizes for UX
✅ Can improve each layer independently
✅ Extensible: Add new dimensions or analyzers easily

---

## 📋 NEXT STEPS

1. ✅ Design architecture (this document)
2. ⚠️ Audit existing analyzers (which 13 dimensions are already implemented?)
3. ⚠️ Implement missing dimension analyzers
4. ⚠️ Create orchestrator (`analyzePIQEssay.ts`)
5. ⚠️ Create frontend formatter (`formatForUI.ts`)
6. ⚠️ Refactor `suggest_piq_prompts` to remove essay scoring
7. ⚠️ Test with real student essays
8. ⚠️ Validate scores match expected tiers

---

**Philosophy:** Help students improve their essays through better storytelling, not better resumes.
