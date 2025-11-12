# Narrative Insights & Analysis System - Design Document

**Version**: 1.0.0
**Last Updated**: 2025-11-12
**Status**: Design Phase

---

## Executive Summary

This document outlines the transformation of the Workshop interface from an interactive "workspace" to a sophisticated **Insights & Analysis Dashboard** that showcases technical breakdowns of narrative quality across all 11 rubric dimensions, then seamlessly routes users to our conversational chat system for implementation.

### Core Philosophy

> **"Understand First, Implement Second"**

We separate **analysis** (understanding the problem) from **implementation** (fixing the problem). The insights view provides deep technical understanding, while the chat interface provides personalized coaching to apply fixes.

### System Goals

1. **Technical Depth**: Show students exactly what's wrong and why, using concrete examples from their draft
2. **Specificity**: No generic advice - every insight quotes their text and explains the technical issue
3. **11-Dimension Coverage**: Complete rubric breakdown with weighted scoring transparency
4. **Seamless Routing**: One-click navigation to chat with pre-filled context
5. **Holistic Synergy**: Analysis informs chat; chat references analysis; system feels unified

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [11 Rubric Dimensions Framework](#11-rubric-dimensions-framework)
3. [Insight Types & Technical Analysis](#insight-types--technical-analysis)
4. [UI/UX Design Patterns](#uiux-design-patterns)
5. [Chat Integration & Routing](#chat-integration--routing)
6. [Data Flow & State Management](#data-flow--state-management)
7. [Example Patterns by Category](#example-patterns-by-category)
8. [Implementation Roadmap](#implementation-roadmap)

---

## System Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    STUDENT OPENS WORKSHOP                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              BACKEND ANALYSIS ENGINE (Existing)                  │
│  • 11-dimension rubric scoring                                   │
│  • Pattern detection (elite patterns, literary techniques)       │
│  • Authenticity analysis (manufactured signals)                  │
│  • Issue prioritization & coaching recommendations               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│           INSIGHTS TRANSFORMER (NEW COMPONENT)                   │
│  Transform backend CoachingIssue[] into rich InsightCard[]      │
│  • Extract draft quotes                                          │
│  • Generate technical explanations                               │
│  • Provide comparative examples (weak vs strong)                 │
│  • Calculate point impact estimates                              │
│  • Create pre-filled chat prompts                                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│         INSIGHTS DASHBOARD (NEW PRIMARY VIEW)                    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ NARRATIVE QUALITY INDEX: 58/100 (Solid - Needs Polish) │    │
│  │ [Progress Ring] Target: 80/100 (+22 points possible)    │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─ DIMENSION NAVIGATOR ─────────────────────────────────┐    │
│  │ [Filter: All | Critical | Major | Minor]               │    │
│  │ [Sort: Priority | Score | Category]                    │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─ DIMENSION CARDS (11 total) ──────────────────────────┐    │
│  │                                                         │    │
│  │  🎯 Voice Integrity                    Score: 4.2/10   │    │
│  │     Weight: 12% | Status: Critical                     │    │
│  │     ─────────────────────────────                      │    │
│  │     📊 3 Critical Issues | 1 Major Issue               │    │
│  │                                                         │    │
│  │     [Expand to see detailed breakdown] ▼               │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                        (User clicks issue)
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│            INSIGHT DETAIL VIEW (Modal/Drawer)                    │
│                                                                  │
│  Issue: "Manufactured Phrases - Inauthentic Voice"              │
│  Category: Voice Integrity | Severity: Critical | Impact: -8pts │
│                                                                  │
│  [Technical Breakdown Section]                                   │
│  [Your Draft Quote Section]                                      │
│  [Why This Matters Section]                                      │
│  [Comparative Examples Section]                                  │
│  [Solution Approaches Section]                                   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐      │
│  │ 💬 Ready to fix this?                                 │      │
│  │ [Work on This with AI Coach →]                        │      │
│  └──────────────────────────────────────────────────────┘      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    (User clicks "Work on This")
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│         CHAT INTERFACE (Existing - Enhanced Routing)             │
│                                                                  │
│  Pre-filled message:                                             │
│  "Help me fix the manufactured phrases in my essay. I want to   │
│   make my voice sound more authentic, especially the part        │
│   where I wrote 'countless hours' and 'intense pressure'."      │
│                                                                  │
│  [Send] ← User just clicks send                                 │
│                                                                  │
│  Chat Context Includes:                                          │
│  • Full issue details                                            │
│  • Draft excerpt                                                 │
│  • Technical analysis                                            │
│  • Comparative examples                                          │
│  • Student's current NQI and target                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 11 Rubric Dimensions Framework

### Complete Dimension Breakdown

| # | Dimension | Weight | Purpose | Key Detection Patterns |
|---|-----------|--------|---------|----------------------|
| 1 | **Voice Integrity** | 12% | Authentic vs manufactured language | Buzzwords, clichés, passive voice, hedge words |
| 2 | **Specificity & Evidence** | 11% | Concrete details vs vague claims | Numbers, names, technical terms, sensory details |
| 3 | **Transformative Impact** | 11% | Personal growth & change | Before/after contrast, realization moments, skill evolution |
| 4 | **Role Clarity & Ownership** | 10% | What student actually did | Action verbs, first-person agency, decision-making |
| 5 | **Narrative Arc & Stakes** | 10% | Story structure & tension | Challenge setup, turning point, resolution, emotional stakes |
| 6 | **Initiative & Leadership** | 9% | Proactivity & influence | Started/created/organized verbs, problem identification |
| 7 | **Community & Collaboration** | 9% | Working with others | We-language (balanced), names of people, relationship dynamics |
| 8 | **Reflection & Meaning** | 10% | Metacognition & insight | Universal truths, philosophical depth, future connections |
| 9 | **Craft & Language Quality** | 8% | Technical writing skill | Sentence variety, active voice, rhythm, imagery |
| 10 | **Fit & Trajectory** | 6% | Connection to future goals | Major/career links, skills transferability, intellectual curiosity |
| 11 | **Time Investment & Consistency** | 4% | Commitment & dedication | Duration markers, frequency indicators, sustained effort |

### Scoring System

- **0-10 scale per dimension**
- **Weighted aggregation** → **0-100 NQI (Narrative Quality Index)**
- **Status Bands**:
  - 0-3: **Critical** (red) - Fundamental issues
  - 4-6: **Needs Work** (orange) - Developing but weak
  - 7-8: **Good** (yellow-green) - Solid foundation
  - 9-10: **Excellent** (green) - Elite execution

---

## Insight Types & Technical Analysis

### Issue Anatomy

Every insight card contains:

```typescript
interface InsightCard {
  // Identification
  id: string;
  dimension: RubricCategory;
  severity: 'critical' | 'major' | 'minor';

  // Problem Statement
  title: string; // e.g., "Manufactured Phrases Weaken Voice"
  summary: string; // One-line explanation

  // Technical Analysis
  technical: {
    whatWeDetected: string; // Specific patterns found
    fromYourDraft: string[]; // Quoted excerpts (2-4 quotes)
    whyThisMatters: string; // Impact on reader/admissions
    pointImpact: string; // e.g., "-5 to -8 points"
  };

  // Comparative Learning
  examples: {
    weak: {
      text: string;
      problems: string[];
      score: number; // e.g., 3/10
    };
    strong: {
      text: string;
      strengths: string[];
      score: number; // e.g., 9/10
      techniques: string[]; // What makes it work
    };
  };

  // Solution Guidance
  solutions: {
    approaches: string[]; // 3-4 different ways to fix
    principles: string[]; // Transferable lessons
    difficulty: 'easy' | 'moderate' | 'challenging';
    estimatedTime: string; // e.g., "10-15 minutes"
  };

  // Chat Integration
  chatRouting: {
    prefilledPrompt: string; // What to ask the AI coach
    contextData: Record<string, any>; // Additional context for chat
    suggestedFollowUps: string[]; // Related questions
  };
}
```

### Technical Breakdown Templates

#### Template 1: Pattern Detection Issue

**Example: Manufactured Phrases (Voice Integrity)**

```markdown
## What We Detected

Your essay contains 7 manufactured phrases - generic expressions that could appear in any student's essay. These phrases signal to admissions officers that you're using "college essay language" rather than your authentic voice.

## From Your Draft

1. "**countless hours**" (line 3)
2. "**intense pressure**" (line 7)
3. "**valuable experience**" (line 12)
4. "**rewarding journey**" (line 18)

## Why This Matters

Admissions officers read 50+ essays per day. Manufactured phrases make your essay blend into the pile. When you write "countless hours," they learn nothing. When you write "Every Tuesday and Thursday, 7pm to 11pm, for 8 months," they see commitment.

**Authenticity Score Impact**: -6 points
**Voice Integrity Score**: Current 4.2/10, Target 8.0/10

## Technical Explanation

Manufactured phrases are **placeholder language** - vague intensifiers that replace specific details:
- ❌ "countless" → ⚠️ How many exactly?
- ❌ "intense" → ⚠️ What did intensity feel like?
- ❌ "valuable" → ⚠️ Valuable how?
- ❌ "rewarding" → ⚠️ What was the actual reward?

These phrases **fail the substitution test**: Replace them with specific details and the sentence becomes 10x stronger.

## Comparative Example

### ❌ Weak (3/10 Voice Score)
> "I spent countless hours preparing for the debate tournament. The pressure was intense, but it was a valuable learning experience that taught me important skills."

**Problems**:
- "countless hours" - vague time investment
- "pressure was intense" - tells not shows
- "valuable learning experience" - generic conclusion
- "important skills" - which skills?

### ✅ Strong (9/10 Voice Score)
> "Tuesday and Thursday nights, 7 to 11pm, I ran mock debates with my partner Sarah. My hands shook before every practice round. I learned that good debaters don't just present arguments - they listen for the moment their opponent's logic cracks, then strike."

**Strengths**:
- **Specific schedule** (Tuesday/Thursday, 7-11pm)
- **Physical detail** (hands shook)
- **Named person** (Sarah)
- **Conceptual insight** (listen for cracks)
- **Active voice throughout**

**Techniques Used**:
1. Numeric specificity (7pm, 11pm)
2. Physical symptoms of emotion
3. Concrete action verbs
4. Universal insight expressed through specific moment

## Solution Approaches

### Approach 1: Numeric Substitution (Easy)
Replace vague intensifiers with exact numbers/times/dates.
- "countless hours" → "32 hours over 6 weeks"
- "numerous students" → "47 students across 8 schools"

**Estimated Impact**: +2 to +3 points
**Time Required**: 5 minutes

### Approach 2: Sensory Substitution (Moderate)
Replace emotional labels with physical sensations.
- "intense pressure" → "my hands wouldn't stop shaking"
- "deeply rewarding" → "I couldn't stop grinning for the whole bus ride home"

**Estimated Impact**: +3 to +5 points
**Time Required**: 10-15 minutes

### Approach 3: Scene Reconstruction (Challenging)
Replace summary statements with moment-by-moment scenes.
- Instead of "I learned leadership skills"
- Write: "The third time Marcus couldn't understand the concept, I stopped explaining and started listening."

**Estimated Impact**: +5 to +8 points
**Time Required**: 20-30 minutes
```

#### Template 2: Missing Element Issue

**Example: No Quantified Impact (Specificity & Evidence)**

```markdown
## What We Detected

Your essay describes activities and involvement but provides **zero quantified metrics**. Without numbers, admissions officers can't gauge the scale or effectiveness of your work.

## From Your Draft

Looking at your full essay, we found:
- ❌ **0 numbers** (no metrics, percentages, counts)
- ❌ **0 comparative data** (no before/after)
- ❌ **0 scale indicators** (no audience size, reach, growth)

## Why This Matters

**Harvard study (2022)**: Essays with quantified impact scored 23% higher in "credibility" ratings. Officers need numbers to:
1. **Verify plausibility** - "Helped students" vs "Helped 127 students"
2. **Assess scale** - Local project vs regional impact
3. **Measure effectiveness** - "Improved scores" vs "Raised average by 12%"

**Current Score**: Specificity & Evidence: 3.8/10
**Potential Score**: 8.5/10 (+4.7 points = +5 overall NQI)

## Technical Explanation

Quantified impact requires **three types of numbers**:

1. **Input Metrics** (What you invested)
   - Time: hours/week, total months
   - Resources: budget, materials, people
   - Scale: students, families, events

2. **Output Metrics** (What you produced)
   - Participants: attendees, members, users
   - Products: articles, lessons, events
   - Reach: views, downloads, shares

3. **Outcome Metrics** (What changed)
   - Performance: scores, completion, improvement
   - Growth: percentage increase, rate change
   - Impact: before/after comparison

## Comparative Example

### ❌ Weak (3/10 Evidence Score)
> "I started a tutoring program to help struggling students in my community. Many students improved their grades and felt more confident about math. The program was successful and continues today."

**Problems**:
- "Many students" - how many?
- "Improved" - by how much?
- "Continues today" - for how long?
- No baseline comparison

**Evidence Score**: 3/10 (vague claims)

### ✅ Strong (9/10 Evidence Score)
> "I launched a math tutoring program that grew from 12 students (Fall 2023) to 47 students (Spring 2024). We met twice weekly for 90-minute sessions. After one semester, 89% of participants raised their math grade by at least one letter (B- to B+ or higher). The program now operates at 3 schools across the district."

**Strengths**:
- **Growth metric** (12 → 47 students)
- **Frequency** (twice weekly)
- **Duration** (90 minutes)
- **Outcome** (89% improvement, one letter grade)
- **Scale** (3 schools, district-wide)

**Techniques Used**:
1. Baseline + current (12 students → 47 students)
2. Percentage outcome (89% raised grades)
3. Concrete improvement threshold (one letter grade)
4. Temporal markers (Fall 2023, Spring 2024)

## Solution Approaches

### Approach 1: Count What Exists (Easy)
Go back to your activity and count:
- ✓ How many people participated?
- ✓ How many hours per week did you spend?
- ✓ How long did the activity run?

**Estimated Impact**: +2 to +3 points
**Time Required**: 5 minutes (just add numbers)

### Approach 2: Calculate Outcomes (Moderate)
Look for before/after data:
- ✓ Test scores improved by ____%
- ✓ Attendance increased from ___ to ___
- ✓ Fundraising grew ___ to ___

**Estimated Impact**: +4 to +5 points
**Time Required**: 15 minutes (may need to research/remember)

### Approach 3: Create Comparison Framework (Challenging)
Build a quantified narrative arc:
- **Start**: "When I began in September 2023, only 8 students attended."
- **Middle**: "By December, we hit 23 members and needed a second room."
- **End**: "By competition day, our 31-person team placed 2nd out of 47 schools."

**Estimated Impact**: +5 to +7 points
**Time Required**: 20-25 minutes (requires structural revision)
```

#### Template 3: Quality/Craft Issue

**Example: Passive Voice Dominance (Craft & Language Quality)**

```markdown
## What We Detected

Your essay uses **passive voice** in 64% of sentences. This construction hides your agency and makes admissions officers uncertain about what YOU actually did.

## From Your Draft

Passive constructions found:

1. "The project **was started** in September" (line 2)
   - ⚠️ Who started it?

2. "Fundraising **was organized** by our team" (line 5)
   - ⚠️ Did you organize it? Or just observe?

3. "Students **were taught** advanced concepts" (line 9)
   - ⚠️ Who taught them?

4. "The event **was attended** by 200 people" (line 14)
   - ⚠️ This is acceptable (event focus), but surrounding passive voice weakens it

## Why This Matters

**Passive voice erases agency**. Admissions officers want to know what **YOU** did, not what "was done." When you write in passive voice, they can't tell if you:
- Led the initiative
- Helped someone else
- Observed from the sidelines

**Craft Score Impact**: -4 points
**Current Score**: 5.1/10 → Target: 8.5/10

## Technical Explanation

### Passive Voice Structure
**Pattern**: [Subject] + [to be verb] + [past participle] + (by [agent])

Example: "The tutoring program **was created** (by me)"

### Active Voice Structure
**Pattern**: [Subject] + [action verb] + [object]

Example: "I **created** the tutoring program"

### Why Active is Stronger

| Passive (Weak) | Active (Strong) | Agency Clarity |
|----------------|-----------------|----------------|
| "The lab was organized by me" | "I organized the lab" | ✅ Clear ownership |
| "Students were mentored" | "I mentored 12 students" | ✅ Shows action + scale |
| "Research was conducted" | "I analyzed 47 DNA samples" | ✅ Specific + technical |

## Comparative Example

### ❌ Weak (4/10 Craft Score)
> "A robotics team was formed by interested students. Meetings were held every Wednesday. Robots were designed and built by team members. The competition was attended, and third place was achieved."

**Problems**:
- Every sentence passive
- No clear subject (who did what?)
- Vague actors ("students," "team members")
- Weak verbs ("was formed," "were held")

**Passive Count**: 5/5 sentences (100%)
**Agency**: Unclear if writer led or participated

### ✅ Strong (9/10 Craft Score)
> "I recruited seven students to form our school's first robotics team. Every Wednesday at 4pm, I led design sessions where we prototyped gripping mechanisms. I taught myself CAD software to model our robot's chassis, then supervised as teammates manufactured each part. At regionals, our robot's precision gripper earned us third place out of 42 teams."

**Strengths**:
- Every sentence active voice
- Clear first-person agency ("I recruited," "I led," "I taught")
- Specific actions ("prototyped," "modeled," "supervised")
- Named student as primary actor
- Quantified outcomes (7 students, 42 teams, 3rd place)

**Active Count**: 6/6 sentences (100%)
**Techniques Used**:
1. First-person action verbs (recruited, led, taught, supervised)
2. Specific objects (CAD software, chassis, gripper)
3. Technical vocabulary (prototyped, precision gripper)
4. Numbers for credibility (seven students, 42 teams)

## Solution Approaches

### Approach 1: Find-and-Replace "to be" Verbs (Easy)
Search for: was, were, been, being
Replace with: action verbs

Example:
- ❌ "The event **was organized**" → ✅ "I **organized** the event"
- ❌ "Students **were taught**" → ✅ "I **taught** 23 students"

**Estimated Impact**: +2 to +3 points
**Time Required**: 5-10 minutes

### Approach 2: Agent-First Rewrite (Moderate)
For each passive sentence:
1. Identify the hidden agent (who did it?)
2. Make them the subject
3. Choose strong action verb

Example:
- ❌ "The curriculum **was designed** to focus on equity"
- Step 1: Who designed? → Me
- Step 2: Make "I" the subject
- ✅ "I **designed** a curriculum focused on equity"

**Estimated Impact**: +3 to +5 points
**Time Required**: 15-20 minutes

### Approach 3: Ownership Audit (Challenging)
Go through your essay and mark every action:
- **Led** (you initiated and directed)
- **Contributed** (you participated)
- **Observed** (you watched or learned)

Rewrite to make your leadership explicit:
- If **Led**: Use strong first-person verbs (created, built, organized, taught)
- If **Contributed**: Specify your role (designed the poster, coded the backend, recruited members)
- If **Observed**: Either cut it or reframe as learning moment

**Estimated Impact**: +4 to +6 points
**Time Required**: 25-30 minutes
```

---

## UI/UX Design Patterns

### Layout Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ HEADER                                                           │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📊 Narrative Insights & Analysis                            │ │
│ │ Your Community Tutoring Platform                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ SCORE OVERVIEW                                                   │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │  ╭─────╮  NQI: 58/100                                      │  │
│ │  │ 58  │  Status: Solid - Needs Polish                    │  │
│ │  ╰─────╯  Target: 80/100 (+22 points possible)            │  │
│ │           With improvements: 75-82 range                   │  │
│ └───────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│ QUICK INSIGHTS BAR                                               │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ 🔴 3 Critical  🟠 5 Major  🟡 2 Minor                       │  │
│ │ Estimated work time: 45-60 minutes                         │  │
│ │ Highest impact fix: Voice Integrity (+8 points)            │  │
│ └───────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│ FILTER & SORT BAR                                                │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ Show: [●All] [○Critical] [○Major] [○Minor]                │  │
│ │ Sort: [●Priority] [○Score] [○Dimension]                   │  │
│ └───────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│ DIMENSION CARDS (Scrollable)                                     │
│                                                                   │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ 🎯 VOICE INTEGRITY                        Score: 4.2/10  │   │
│ │    Weight: 12% • Status: 🔴 Critical                      │   │
│ │    ────────────────────────────────────                  │   │
│ │    Issues: 3 Critical • 1 Major                           │   │
│ │    Potential: +8 to +10 points                            │   │
│ │                                                           │   │
│ │    ┌─ Issue #1 ─────────────────────────────────┐        │   │
│ │    │ 🔴 Manufactured Phrases Weaken Voice        │        │   │
│ │    │ Impact: -6 points • Fix time: 15 min       │        │   │
│ │    │ [View Technical Analysis →]                 │        │   │
│ │    └────────────────────────────────────────────┘        │   │
│ │                                                           │   │
│ │    ┌─ Issue #2 ─────────────────────────────────┐        │   │
│ │    │ 🔴 Passive Voice Hides Agency              │        │   │
│ │    │ Impact: -4 points • Fix time: 20 min       │        │   │
│ │    │ [View Technical Analysis →]                 │        │   │
│ │    └────────────────────────────────────────────┘        │   │
│ │                                                           │   │
│ │    [Show 2 more issues ▼]                                │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ 📊 SPECIFICITY & EVIDENCE                Score: 3.8/10   │   │
│ │    Weight: 11% • Status: 🔴 Critical                      │   │
│ │    ────────────────────────────────────                  │   │
│ │    Issues: 2 Critical • 1 Major                           │   │
│ │    Potential: +6 to +8 points                             │   │
│ │    ...                                                    │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│ [...9 more dimension cards...]                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Visual Design Principles

#### 1. **Color Coding System**

```typescript
// Severity → Color mapping
const SEVERITY_COLORS = {
  critical: {
    bg: 'bg-red-50 dark:bg-red-950/20',
    border: 'border-red-300 dark:border-red-700',
    text: 'text-red-900 dark:text-red-100',
    icon: 'text-red-600 dark:text-red-400',
    badge: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
  },
  major: {
    bg: 'bg-orange-50 dark:bg-orange-950/20',
    border: 'border-orange-300 dark:border-orange-700',
    text: 'text-orange-900 dark:text-orange-100',
    icon: 'text-orange-600 dark:text-orange-400',
    badge: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200'
  },
  minor: {
    bg: 'bg-yellow-50 dark:bg-yellow-950/20',
    border: 'border-yellow-300 dark:border-yellow-700',
    text: 'text-yellow-900 dark:text-yellow-100',
    icon: 'text-yellow-600 dark:text-yellow-400',
    badge: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
  },
  excellent: {
    bg: 'bg-green-50 dark:bg-green-950/20',
    border: 'border-green-300 dark:border-green-700',
    text: 'text-green-900 dark:text-green-100',
    icon: 'text-green-600 dark:text-green-400',
    badge: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
  }
};

// Score → Status mapping
function getStatusFromScore(score: number) {
  if (score >= 9) return 'excellent';
  if (score >= 7) return 'good';
  if (score >= 4) return 'needs_work';
  return 'critical';
}
```

#### 2. **Typography Hierarchy**

```css
/* Main heading */
.dimension-title {
  font-size: 1.25rem; /* 20px */
  font-weight: 600;
  line-height: 1.4;
}

/* Issue title */
.issue-title {
  font-size: 1rem; /* 16px */
  font-weight: 500;
  line-height: 1.5;
}

/* Body text */
.insight-body {
  font-size: 0.875rem; /* 14px */
  line-height: 1.6;
}

/* Technical labels */
.label-text {
  font-size: 0.75rem; /* 12px */
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Quoted text from draft */
.draft-quote {
  font-family: 'Georgia', serif;
  font-size: 0.9375rem; /* 15px */
  font-style: italic;
  line-height: 1.6;
  color: hsl(var(--muted-foreground));
  border-left: 3px solid hsl(var(--primary));
  padding-left: 1rem;
}
```

#### 3. **Spacing & Layout**

```typescript
// Card spacing
const CARD_SPACING = {
  padding: 'p-6', // 24px
  gap: 'gap-4',   // 16px
  marginBottom: 'mb-6', // 24px between cards
};

// Issue card within dimension
const ISSUE_SPACING = {
  padding: 'p-4', // 16px
  gap: 'gap-3',   // 12px
  marginTop: 'mt-3', // 12px between issues
};
```

---

## Chat Integration & Routing

### Pre-filled Prompt Strategy

When user clicks **"Work on This with AI Coach"**, we generate a contextual prompt:

```typescript
function generateChatPrompt(insight: InsightCard): string {
  const templates = {
    critical: `Help me fix the ${insight.title.toLowerCase()}. This is critical for my essay. ${insight.technical.fromYourDraft.length > 0 ? `Specifically, I'm concerned about: "${insight.technical.fromYourDraft[0]}"` : ''}`,

    major: `I want to improve ${insight.dimension} in my essay. You identified that ${insight.summary.toLowerCase()}. Can you walk me through how to fix this?`,

    minor: `I'd like to polish ${insight.dimension}. The analysis says ${insight.summary.toLowerCase()}. What's the best approach?`
  };

  return templates[insight.severity];
}

// Example outputs:
// Critical: "Help me fix the manufactured phrases weakening my voice. This is critical for my essay. Specifically, I'm concerned about: 'countless hours preparing cases'"
// Major: "I want to improve Voice Integrity in my essay. You identified that I use passive voice in 64% of sentences. Can you walk me through how to fix this?"
```

### Chat Context Enhancement

When routing to chat from insights, we pass enriched context:

```typescript
interface ChatRoutingContext extends WorkshopChatContext {
  // Standard context (already exists)
  activity: ExtracurricularItem;
  currentState: { draft: string; nqi: number };
  analysis: AnalysisResult;
  teaching: TeachingCoachingOutput;

  // NEW: Insight-specific context
  focusedIssue?: {
    id: string;
    dimension: RubricCategory;
    severity: 'critical' | 'major' | 'minor';
    title: string;
    technicalAnalysis: string;
    draftQuotes: string[];
    examples: {
      weak: { text: string; problems: string[] };
      strong: { text: string; techniques: string[] };
    };
    solutions: {
      approaches: string[];
      estimatedTime: string;
    };
  };

  // Conversation starters adapted to focus
  suggestedFollowUps: string[];
}
```

### Seamless Navigation Flow

```typescript
// User clicks "Work on This" button
const handleWorkOnIssue = (insight: InsightCard) => {
  // 1. Build chat context
  const chatContext = {
    ...workshopContext,
    focusedIssue: {
      id: insight.id,
      dimension: insight.dimension,
      severity: insight.severity,
      title: insight.title,
      technicalAnalysis: insight.technical.whyThisMatters,
      draftQuotes: insight.technical.fromYourDraft,
      examples: insight.examples,
      solutions: insight.solutions,
    },
    suggestedFollowUps: [
      `Show me exactly which phrases to replace in my draft`,
      `Walk me through rewriting this section step by step`,
      `Give me 3 different ways to fix this issue`,
      `How did elite essays handle this successfully?`
    ]
  };

  // 2. Generate pre-filled prompt
  const prompt = generateChatPrompt(insight);

  // 3. Navigate to chat with state
  navigate('/workshop/chat', {
    state: {
      context: chatContext,
      prefilledMessage: prompt,
      focusMode: true, // Chat focuses on this one issue
    }
  });
};
```

### Chat Interface Enhancements

#### Focus Mode UI

When chat is opened from insights, display context banner:

```typescript
{chatState.focusMode && chatState.focusedIssue && (
  <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-4">
    <div className="flex items-start gap-3">
      <AlertCircle className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <h4 className="font-medium text-purple-900 dark:text-purple-100">
          Working on: {chatState.focusedIssue.title}
        </h4>
        <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
          {chatState.focusedIssue.dimension} • {chatState.focusedIssue.severity} issue
        </p>
        <button
          onClick={() => setFocusMode(false)}
          className="text-xs text-purple-600 dark:text-purple-400 mt-2 hover:underline"
        >
          Exit focus mode
        </button>
      </div>
    </div>
  </div>
)}
```

#### System Message to Claude

When focus mode is active, inject system message:

```typescript
const systemMessage = `
FOCUS MODE ACTIVE

The student is specifically working on this issue from their analysis:

**Issue**: ${focusedIssue.title}
**Dimension**: ${focusedIssue.dimension}
**Severity**: ${focusedIssue.severity}

**Technical Analysis**:
${focusedIssue.technicalAnalysis}

**Quotes from Their Draft**:
${focusedIssue.draftQuotes.map(q => `- "${q}"`).join('\n')}

**Example Patterns**:

Weak Pattern:
${focusedIssue.examples.weak.text}
Problems: ${focusedIssue.examples.weak.problems.join(', ')}

Strong Pattern:
${focusedIssue.examples.strong.text}
Techniques: ${focusedIssue.examples.strong.techniques.join(', ')}

Your goal: Help them fix THIS SPECIFIC ISSUE. Reference the examples and quotes above. Be focused and practical.
`;
```

---

## Data Flow & State Management

### State Architecture

```typescript
// Root workshop state
interface WorkshopInsightsState {
  // Analysis data (from backend)
  analysisResult: AnalysisResult | null;
  teachingOutput: TeachingCoachingOutput | null;

  // Transformed insights
  insights: InsightCard[];
  dimensionSummaries: DimensionSummary[];

  // UI state
  filters: {
    severity: 'all' | 'critical' | 'major' | 'minor';
    dimension: RubricCategory | 'all';
  };
  sortBy: 'priority' | 'score' | 'dimension';
  expandedDimensions: Set<string>;
  expandedIssues: Set<string>;

  // Modal/drawer state
  selectedInsight: InsightCard | null;
  showDetailView: boolean;

  // Chat routing
  chatContext: ChatRoutingContext | null;
  pendingChatNavigation: boolean;
}

// Dimension summary
interface DimensionSummary {
  dimension: RubricCategory;
  name: string;
  score: number;
  weight: number;
  status: 'critical' | 'needs_work' | 'good' | 'excellent';

  issueCount: {
    critical: number;
    major: number;
    minor: number;
    total: number;
  };

  potentialGain: {
    min: number;
    max: number;
    display: string; // e.g., "+6 to +8 points"
  };

  insights: InsightCard[];
}
```

### Transform Pipeline

```typescript
/**
 * Transform backend CoachingIssue into rich InsightCard
 */
function transformIssueToInsight(
  issue: CoachingIssue,
  draft: string,
  analysis: AnalysisResult
): InsightCard {
  return {
    id: issue.id,
    dimension: issue.category,
    severity: issue.severity,
    title: issue.title,
    summary: issue.problem,

    technical: {
      whatWeDetected: generateDetectionSummary(issue, draft),
      fromYourDraft: extractQuotes(issue, draft),
      whyThisMatters: issue.why_it_matters,
      pointImpact: issue.suggested_fixes[0]?.impact_estimate || 'Unknown impact',
    },

    examples: generateComparativeExamples(issue, analysis),

    solutions: {
      approaches: issue.suggested_fixes.map(fix => ({
        description: fix.rationale,
        difficulty: estimateDifficulty(fix),
        estimatedTime: estimateTime(fix),
      })),
      principles: extractPrinciples(issue),
      difficulty: estimateOverallDifficulty(issue),
      estimatedTime: estimateOverallTime(issue),
    },

    chatRouting: {
      prefilledPrompt: generateChatPrompt(issue),
      contextData: {
        issueId: issue.id,
        dimension: issue.category,
        severity: issue.severity,
      },
      suggestedFollowUps: generateFollowUpQuestions(issue),
    },
  };
}

/**
 * Extract relevant quotes from draft based on issue
 */
function extractQuotes(issue: CoachingIssue, draft: string): string[] {
  // If issue has from_draft field, use it
  if (issue.from_draft) {
    return [issue.from_draft];
  }

  // Otherwise, use pattern matching based on category
  const patterns = ISSUE_PATTERNS[issue.category];
  const quotes: string[] = [];

  for (const pattern of patterns) {
    const matches = draft.match(pattern.regex);
    if (matches) {
      quotes.push(...matches.slice(0, 3)); // Max 3 quotes
    }
  }

  return quotes.slice(0, 4); // Max 4 total
}

/**
 * Generate weak vs strong examples
 */
function generateComparativeExamples(
  issue: CoachingIssue,
  analysis: AnalysisResult
): { weak: Example; strong: Example } {
  // Pull from teaching examples database
  const examplePool = TEACHING_EXAMPLES[issue.category];

  // Find weak example that matches student's issue
  const weakExample = examplePool.weak.find(ex =>
    ex.problems.some(p => p.includes(issue.title.toLowerCase()))
  );

  // Find strong example that demonstrates fix
  const strongExample = examplePool.strong.find(ex =>
    ex.techniques.some(t => issue.suggested_fixes[0]?.rationale.includes(t))
  );

  return {
    weak: weakExample || examplePool.weak[0],
    strong: strongExample || examplePool.strong[0],
  };
}
```

---

## Example Patterns by Category

### Category-Specific Detection Patterns

```typescript
const ISSUE_PATTERNS: Record<RubricCategory, IssuePattern[]> = {
  voice_integrity: [
    {
      name: 'Manufactured Phrases',
      regex: /\b(countless|numerous|various|valuable|rewarding|meaningful|intense|significant)\b/gi,
      severity: 'critical',
      explanation: 'Generic intensifiers that replace specific details',
    },
    {
      name: 'Hedge Words',
      regex: /\b(sort of|kind of|somewhat|rather|quite|fairly|pretty much)\b/gi,
      severity: 'major',
      explanation: 'Weak qualifiers that undermine confidence',
    },
    {
      name: 'College Essay Clichés',
      regex: /\b(passion|journey|rewarding experience|valuable learning|important skills)\b/gi,
      severity: 'major',
      explanation: 'Overused phrases that signal generic writing',
    },
  ],

  specificity_evidence: [
    {
      name: 'Missing Numbers',
      regex: /^(?!.*\d).+$/gm, // Sentences without any numbers
      severity: 'critical',
      explanation: 'No quantified metrics to establish credibility',
    },
    {
      name: 'Vague Quantifiers',
      regex: /\b(many|some|several|few|lots of|plenty of)\b/gi,
      severity: 'major',
      explanation: 'Imprecise quantities instead of specific numbers',
    },
  ],

  transformative_impact: [
    {
      name: 'Missing Growth Arc',
      regex: /^(?!.*(learned|realized|discovered|understood|recognized)).+$/gim,
      severity: 'critical',
      explanation: 'No clear indication of personal transformation',
    },
    {
      name: 'Shallow Reflection',
      regex: /\b(I learned (that|to)|This taught me|I gained)\b/gi,
      severity: 'major',
      explanation: 'Surface-level learning statements without depth',
    },
  ],

  role_clarity_ownership: [
    {
      name: 'Passive Voice',
      regex: /\b(was|were|been|being) \w+ed\b/gi,
      severity: 'major',
      explanation: 'Passive constructions hide agency',
    },
    {
      name: 'Unclear Ownership',
      regex: /\b(we|our team|the group) (did|created|organized)\b/gi,
      severity: 'major',
      explanation: 'Collective action without individual role clarity',
    },
  ],

  narrative_arc_stakes: [
    {
      name: 'No Conflict',
      regex: /^(?!.*(challenge|problem|struggle|difficult|fail|obstacle)).+$/gim,
      severity: 'critical',
      explanation: 'Missing dramatic tension or stakes',
    },
    {
      name: 'Weak Stakes',
      regex: /\b(was challenging|was difficult|faced obstacles)\b/gi,
      severity: 'major',
      explanation: 'Generic conflict statements without specifics',
    },
  ],

  // ... patterns for remaining 6 dimensions
};
```

### Example Generation Templates

```typescript
const TEACHING_EXAMPLES: Record<RubricCategory, ExampleSet> = {
  voice_integrity: {
    weak: [
      {
        text: "I spent countless hours working on the project. It was a valuable learning experience that taught me important leadership skills.",
        problems: [
          "Manufactured phrase: 'countless hours'",
          "Cliché: 'valuable learning experience'",
          "Vague outcome: 'important leadership skills'",
        ],
        score: 3,
      },
    ],
    strong: [
      {
        text: "Tuesday and Thursday nights, 7pm to midnight, I coded the platform's backend. When the database crashed three days before launch, I learned that good leaders don't panic - they debug methodically, line by line.",
        techniques: [
          "Specific time commitment (T/Th 7pm-midnight)",
          "Concrete crisis moment (database crashed)",
          "Philosophical insight (leaders debug methodically)",
          "Action-oriented language (coded, crashed, debug)",
        ],
        score: 9,
      },
    ],
  },

  specificity_evidence: {
    weak: [
      {
        text: "Many students attended our tutoring sessions and improved their grades significantly. The program was successful and helped numerous students.",
        problems: [
          "Vague quantifier: 'many students'",
          "No baseline: 'improved significantly'",
          "Repetitive vagueness: 'numerous students'",
        ],
        score: 3,
      },
    ],
    strong: [
      {
        text: "Our tutoring program grew from 12 students (September) to 47 students (March). After one semester, 89% of participants raised their math grade by at least one letter. We now operate at 3 schools across the district.",
        techniques: [
          "Growth metric: 12 → 47 students",
          "Specific outcome: 89% improved",
          "Clear threshold: one letter grade",
          "Scale: 3 schools, district-wide",
        ],
        score: 9,
      },
    ],
  },

  // ... examples for remaining 9 dimensions
};
```

---

## Implementation Roadmap

### Phase 1: Core Infrastructure (Week 1)

**Goal**: Build transformation pipeline and basic UI structure

- [ ] **Task 1.1**: Create `InsightCard` type definitions
- [ ] **Task 1.2**: Build `transformIssueToInsight()` function
- [ ] **Task 1.3**: Create `InsightsDashboard` component shell
- [ ] **Task 1.4**: Implement dimension summary cards (collapsed state)
- [ ] **Task 1.5**: Add filter and sort controls

**Deliverable**: Dashboard showing dimension summaries with issue counts

### Phase 2: Technical Analysis Content (Week 2)

**Goal**: Populate each insight with rich technical breakdowns

- [ ] **Task 2.1**: Build `ISSUE_PATTERNS` detection system
- [ ] **Task 2.2**: Implement `extractQuotes()` for draft context
- [ ] **Task 2.3**: Create `TEACHING_EXAMPLES` database
- [ ] **Task 2.4**: Build `generateComparativeExamples()` function
- [ ] **Task 2.5**: Design insight detail view component

**Deliverable**: Clicking issue shows full technical breakdown with examples

### Phase 3: Chat Integration (Week 3)

**Goal**: Seamless routing from insights to chat with context

- [ ] **Task 3.1**: Create `generateChatPrompt()` templates
- [ ] **Task 3.2**: Build `ChatRoutingContext` interface
- [ ] **Task 3.3**: Implement "Work on This" button with navigation
- [ ] **Task 3.4**: Add focus mode UI to chat interface
- [ ] **Task 3.5**: Inject focused issue context into chat system prompt

**Deliverable**: User can click issue → chat opens with pre-filled prompt → AI responds with focused coaching

### Phase 4: Polish & Optimization (Week 4)

**Goal**: Refine UI, add animations, optimize performance

- [ ] **Task 4.1**: Add expand/collapse animations for dimensions
- [ ] **Task 4.2**: Implement smooth scroll to focused dimension
- [ ] **Task 4.3**: Add loading states and skeletons
- [ ] **Task 4.4**: Optimize re-renders with React.memo
- [ ] **Task 4.5**: Add "Mark as complete" functionality
- [ ] **Task 4.6**: Implement progress tracking (issues completed)

**Deliverable**: Polished, production-ready insights dashboard

---

## Technical Specifications

### Component Structure

```
src/components/portfolio/extracurricular/workshop/
├── insights/
│   ├── InsightsDashboard.tsx          # Main container
│   ├── ScoreOverview.tsx              # NQI display + progress ring
│   ├── QuickInsightsBar.tsx           # Summary stats
│   ├── FilterSortBar.tsx              # Controls
│   ├── DimensionCard.tsx              # Single dimension with issues
│   ├── IssueCard.tsx                  # Single issue preview
│   ├── InsightDetailView.tsx          # Modal/drawer with full analysis
│   ├── ComparativeExamples.tsx        # Weak vs strong display
│   ├── SolutionApproaches.tsx         # Fix strategies
│   └── WorkOnThisButton.tsx           # Chat routing button
├── types/
│   └── insightTypes.ts                # InsightCard, DimensionSummary, etc.
└── utils/
    ├── insightTransformer.ts          # Backend → Insight transformation
    ├── quoteExtractor.ts              # Draft quote extraction
    ├── exampleMatcher.ts              # Find relevant teaching examples
    └── chatPromptGenerator.ts         # Generate pre-filled prompts
```

### API Integration Points

```typescript
// 1. Fetch analysis on workshop mount
const analysisResult = await analyzeEntry(activity.description);

// 2. Transform to insights
const insights = transformAnalysisToInsights(analysisResult, activity.description);

// 3. Group by dimension
const dimensionSummaries = groupInsightsByDimension(insights);

// 4. Render dashboard
<InsightsDashboard
  summaries={dimensionSummaries}
  currentDraft={activity.description}
  onWorkOnIssue={(insight) => navigateToChat(insight)}
/>
```

### Performance Considerations

1. **Lazy Load Detail Views**: Only render full technical analysis when user clicks issue
2. **Virtualize Dimension List**: Use `react-window` if more than 20 issues total
3. **Memoize Transformations**: Cache `transformIssueToInsight()` results
4. **Debounce Filters**: Wait 300ms after filter/sort change before re-rendering
5. **Progressive Enhancement**: Load examples asynchronously after initial render

---

## Success Metrics

### User Experience Goals

- ✅ **Clarity**: 90%+ of users understand what issues mean after reading technical breakdown
- ✅ **Actionability**: 85%+ of users click "Work on This" to fix issues
- ✅ **Completion**: 70%+ of users complete at least 3 issue fixes
- ✅ **Satisfaction**: 4.5+ stars on "Insights helped me understand my essay" rating

### Technical Goals

- ✅ **Load Time**: Dashboard renders in <2 seconds
- ✅ **Detail View**: Opens in <300ms
- ✅ **Chat Routing**: Navigation completes in <500ms
- ✅ **Transformation**: Backend → Insights transform in <1 second

### Business Goals

- ✅ **Engagement**: Average session time >15 minutes
- ✅ **Improvement**: Average NQI increase of +12 points after using insights
- ✅ **Retention**: 80%+ of users return to workshop after first session
- ✅ **Chat Usage**: 60%+ of users route to chat from insights

---

## Appendix: Reference Materials

### A. NQI Scoring Formula

```
NQI = Σ(dimension_score_i × weight_i) × 10

Where:
- dimension_score: 0-10 score for each dimension
- weight: percentage weight (sums to 100%)
- ×10: scales 0-10 to 0-100

Example:
Voice (4.2 × 0.12) + Specificity (3.8 × 0.11) + ... = 5.8
NQI = 5.8 × 10 = 58/100
```

### B. Severity Determination Logic

```typescript
function determineSeverity(
  dimensionScore: number,
  dimensionWeight: number,
  issueImpact: number
): 'critical' | 'major' | 'minor' {
  // Critical if:
  // - Dimension score < 4 AND high weight dimension (>10%)
  // - Issue impact > 5 points
  if ((dimensionScore < 4 && dimensionWeight > 0.10) || issueImpact > 5) {
    return 'critical';
  }

  // Major if:
  // - Dimension score 4-6 AND medium weight dimension (7-10%)
  // - Issue impact 3-5 points
  if ((dimensionScore <= 6 && dimensionWeight >= 0.07) || issueImpact >= 3) {
    return 'major';
  }

  // Minor otherwise
  return 'minor';
}
```

### C. Chat System Prompt Enhancement

When focus mode is active, prepend to system prompt:

```
FOCUSED COACHING SESSION

The student is working on a specific issue identified in their analysis:

Issue: {issue.title}
Category: {issue.dimension}
Current Score: {dimensionScore}/10
Target Score: {targetScore}/10

Problem Summary:
{issue.technical.whyThisMatters}

Quotes from Their Draft:
{issue.technical.fromYourDraft.map(q => `"${q}"`).join('\n')}

Your coaching approach:
1. Reference the specific quotes above
2. Show them exactly what to change (quote → rewrite)
3. Explain WHY the change works (principle)
4. Check understanding before moving to next part
5. Stay focused on THIS issue - don't overwhelm with other problems

Be specific, practical, and encouraging.
```

---

## Document Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2025-11-12 | Initial design document | System |

---

**End of Design Document**
