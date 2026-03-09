/**
 * Description Scoring Service (SONNET-POWERED)
 *
 * LLM-powered scoring of activity descriptions with nuanced, research-backed assessment.
 * Evaluates HOW WELL the 150-character description presents the activity, independent
 * of the activity's inherent quality.
 *
 * CORE INSIGHT: Description quality is where students have the MOST CONTROL.
 * They can't change what they did, but they CAN change how they present it.
 * A Tier 4 activity with a 10/10 description beats a Tier 2 activity with a 3/10 description.
 *
 * SCORING DIMENSIONS (0-10 each, weighted average → total 0-10):
 *
 * 1. ROLE OWNERSHIP (0-10, weight: 25%) - Does the reader know exactly what THIS student did?
 *    - Foundation dimension — without role clarity, AOs can't evaluate anything else
 *    - Sara Harberson: "clear evidence of individual contribution" required for Tier 2+
 *
 * 2. EVIDENCE OF IMPACT (0-10, weight: 25%) - Is there clear cause-and-effect?
 *    - The tier differentiator. Harvard CDS: "demonstrated impact" rated Very Important
 *    - Separates "did stuff" from "made a difference"
 *
 * 3. DIFFERENTIATION SIGNAL (0-10, weight: 20%) - What makes THIS student stand out?
 *    - The 1,000-student test: uniqueness survives committee discussion
 *    - Unique details recalled 3-5x more than generic descriptions
 *
 * 4. ACTION PRECISION (0-10, weight: 15%) - How specific and powerful is the language?
 *    - Craft dimension — strong verbs shape first impressions in the 6-second scan
 *    - "Founded" vs "started" vs "helped start" creates different mental models
 *
 * 5. STRATEGIC QUANTIFICATION (0-10, weight: 15%) - Are numbers used meaningfully?
 *    - Supporting dimension — numbers add credibility and specificity
 *    - MIT research: specific numbers 2.4x more memorable than vague claims
 *
 * MODEL: Sonnet - This is where nuance matters most. Description quality requires
 * understanding context, detecting subtle issues (overclaiming, vague language),
 * and making calibrated judgments that Haiku cannot reliably make.
 *
 * PHILOSOPHY: This is a DIAGNOSTIC layer. We identify where the description stands
 * and what issues exist. The Teaching Layer provides the prescription for improvement.
 *
 * COST: ~$0.02-0.03 per activity (Sonnet for quality, worth it for accuracy)
 */

import { callClaude } from '@/lib/llm/claude';
// R7: Use robust parseClaudeJSON with jsonrepair fallback
import { tryParseClaudeJSON } from '../../../../commonAppWorkshop/utils/jsonParser';
import { writingPreAnalyzer, formatForActivityScoring, postLLMCalibrator } from '../../../../writingEngine';
import {
  DescriptionScore,
  DescriptionScoreBreakdown,
  DescriptionScoreComponent,
  DESCRIPTION_SCORE_LEVELS,
} from './types';
import { ApplicationPlatform, getDescriptionCharLimit, getPlatformName } from '../types';
import { resolveCategory } from './knowledge/categoryRegistry';

// ============================================================================
// TYPES
// ============================================================================

export interface DescriptionScoringInput {
  /** The activity description to score */
  description: string;
  /** Activity title for context */
  activityTitle: string;
  /** Activity type for context */
  activityType?: string;
  /** Position/role held (helps assess authenticity) */
  position?: string;
  /** Hours per week (helps assess if description matches investment) */
  hoursPerWeek?: number;
  /** Weeks per year (helps assess if description matches investment) */
  weeksPerYear?: number;
}

export interface DescriptionScoringResult {
  success: boolean;
  score?: DescriptionScore;
  error?: string;
  tokensUsed?: {
    input: number;
    output: number;
  };
}

export interface BatchDescriptionScoringInput {
  activities: DescriptionScoringInput[];
  /** Target platform — determines character limit context in scoring */
  targetPlatform?: ApplicationPlatform;
}

export interface BatchDescriptionScoringResult {
  success: boolean;
  scores?: DescriptionScore[];
  error?: string;
  tokensUsed?: {
    input: number;
    output: number;
  };
}

// ============================================================================
// PROMPTS - RESEARCH-BACKED RUBRIC
// ============================================================================

const buildDescriptionScoringSystemPrompt = (charLimit: number, platformName: string): string => `You are an expert college admissions evaluator with deep experience reading thousands of activity descriptions. Your task is to DIAGNOSE the quality of activity descriptions—not prescribe fixes, just accurately assess where they stand.

CORE INSIGHT: Description quality is independent of activity quality. A Tier 4 activity can have a 10/10 description. A Tier 1 activity can have a 3/10 description. You are evaluating CRAFT, not the activity itself.

THE 6-SECOND TEST (How Admissions Officers Read):
- Seconds 1-2: Scan for role/title and time commitment
- Seconds 3-4: Skim description for differentiation signals
- Seconds 5-6: Decide if this adds to narrative or is noise

Great descriptions make the reader STOP and want to learn more. Weak descriptions get skipped.

═══════════════════════════════════════════════════════════════════════════════
SCORING RUBRIC (Each dimension 0-10, weighted average → total 0-10)
═══════════════════════════════════════════════════════════════════════════════

## DIMENSION 1: ROLE OWNERSHIP (0-10, WEIGHT: 25%)
**Core Question: Does the reader know exactly what THIS student did?**
**Why 25%:** Foundation dimension. Sara Harberson (former UPenn AO): "clear evidence of individual contribution" required for Tier 2+. Without role clarity, AOs can't evaluate anything else — it's the prerequisite for all other dimensions scoring well.

| Score | Criteria |
|-------|----------|
| 9-10  | Unmistakably clear ownership; reader can describe student's exact contribution in one sentence |
| 7-8   | Clear role with minor ambiguity; predominantly student-focused |
| 5-6   | Role discernible but mixed with organizational description |
| 3-4   | Vague role; hard to distinguish individual from team/org contribution |
| 1-2   | Almost entirely org-focused; student appears passive |
| 0     | No discernible individual contribution |

Diagnostic questions:
- Could you tell me exactly what this student did (not what the club/team did)?
- Is it clear THIS student did it, or could any member claim this?
- Does the description work for 1 person or 100 people equally?

Red flags: "We worked on...", "The team achieved...", "Our organization..."

## DIMENSION 2: EVIDENCE OF IMPACT (0-10, WEIGHT: 25%)
**Core Question: Is there clear cause-and-effect showing meaningful outcomes?**
**Why 25%:** The tier differentiator. Harvard CDS rates "demonstrated impact" as Very Important. This separates "did stuff" (Tier 4) from "made a difference" (Tier 2+). Without impact evidence, even great activities read as resume padding.

| Score | Criteria |
|-------|----------|
| 9-10  | Clear causal chain: specific action → measurable/observable outcome with external validation |
| 7-8   | Strong cause-effect with measurable outcome but less external validation |
| 5-6   | Impact claimed with some evidence but causation not airtight |
| 3-4   | Generic impact claims without specifics ("improved", "helped", "made difference") |
| 1-2   | Activity-focused with implied but unstated impact |
| 0     | No impact mentioned; purely describes what the activity is |

Red flags: "made a positive impact", "helped the community", "learned valuable skills"

## DIMENSION 3: DIFFERENTIATION SIGNAL (0-10, WEIGHT: 20%)
**Core Question: What did THIS student do that 1,000 others in the same activity didn't?**
**Why 20%:** Memorability factor. Research on recall in committee settings shows unique details are recalled 3-5x more than generic descriptions. This is what makes an application "stick" during deliberation.

| Score | Criteria |
|-------|----------|
| 9-10  | Uses language that could ONLY describe THIS person. Contains a "fingerprint moment" — a detail so specific no other applicant could write it |
| 7-8   | Mostly specific but 1-2 phrases could apply to anyone in this role |
| 5-6   | Mix of specific and generic. Shows knowledge but not personality |
| 3-4   | Mostly generic. Could be any club president / team member / volunteer |
| 1-2   | Completely interchangeable. Zero unique details |
| 0     | Template-like; indistinguishable from thousands of similar descriptions |

Differentiation signals:
- Created something new (methodology, program, resource, product)
- Achieved external recognition (publication, award, adoption by others)
- Solved a specific problem in a unique way
- Shows intellectual curiosity/initiative beyond assigned duties

EXAMPLE OF "FINGERPRINT MOMENT":
Instead of "Managed team of 15 volunteers" → "Recruited 15 volunteers from 3 different churches by personally pitching at Sunday services, then tracked retention through a spreadsheet I built after losing 5 volunteers in week 2"

## DIMENSION 4: ACTION PRECISION (0-10, WEIGHT: 15%)
**Core Question: How specific and powerful is the language?**
**Why 15%:** Craft dimension. Strong verbs shape first impressions in the 6-second AO scan. "Founded" vs "started" vs "helped start" creates fundamentally different mental models. Important but subordinate to substance (what you did and what resulted).

| Score | Criteria |
|-------|----------|
| 9-10  | Precise, vivid verbs conveying exact nature of work; every word earns its place |
| 7-8   | Strong action verbs with minor room for sharper language |
| 5-6   | Acceptable but somewhat generic verbs |
| 3-4   | Weak or passive language predominates |
| 1-2   | Passive or vague throughout |
| 0     | No action language; entirely passive/descriptive |

Verb hierarchy (highest to lowest):
- ELITE: designed, engineered, pioneered, negotiated, diagnosed, synthesized, architected
- GOOD: led, managed, directed, trained, analyzed, implemented, launched
- ACCEPTABLE: organized, coordinated, developed, created
- WEAK: worked on, handled, ran, supported
- POOR: participated, involved, assisted, helped, member of, part of

## DIMENSION 5: STRATEGIC QUANTIFICATION (0-10, WEIGHT: 15%)
**Core Question: Are numbers used meaningfully to demonstrate scale and significance?**
**Why 15%:** Supporting dimension. MIT research shows specific numbers are 2.4x more memorable than vague claims. Numbers add credibility but only matter when paired with context. A description can score high without numbers if other dimensions are exceptional.

| Score | Criteria |
|-------|----------|
| 9-10  | Multiple meaningful metrics with context demonstrating clear scale and significance |
| 7-8   | Strong quantification with good context; 1-2 metrics that clearly demonstrate impact |
| 5-6   | Numbers present but context unclear or significance modest |
| 3-4   | Numbers exist but trivial, potentially misleading, or vanity metrics |
| 1-2   | Minimal quantification; one throwaway number |
| 0     | No quantification at all |

Meaningful metrics: "$12K raised", "200 students served", "40% improvement", "3 publications"
Vanity metrics: "attended 10 meetings", "participated in 5 events", "team of 3"

Red flags: Numbers without context, inflated-sounding but small numbers

═══════════════════════════════════════════════════════════════════════════════
CALIBRATION EXAMPLES
═══════════════════════════════════════════════════════════════════════════════

### EXAMPLE 1: Math Tutoring (Same Activity, Different Quality Descriptions)

**Score: 2/10 (Poor)**
"Tutored students in math after school. Helped them with homework and prepared for tests. Made a positive impact on their grades."

- Role Ownership: 2/10 (vague, anyone could write this)
- Evidence of Impact: 2/10 ("positive impact" is meaningless)
- Differentiation: 1/10 (could describe any tutor ever)
- Action Precision: 2/10 ("tutored", "helped", "prepared" all weak)
- Quantification: 0/10 (none)
**Weighted Total: 2*0.25 + 2*0.25 + 1*0.20 + 2*0.15 + 0*0.15 = 1.5 → 2**

**Score: 5/10 (Average)**
"Tutored 15 students weekly in Algebra II and Pre-Calculus. Created practice problems and study guides. Students improved an average of one letter grade."

- Role Ownership: 6/10 (clear role but mixed with outcomes)
- Evidence of Impact: 4/10 (outcome mentioned but generic)
- Differentiation: 3/10 (slightly more specific but still generic)
- Action Precision: 5/10 ("tutored", "created" acceptable)
- Quantification: 5/10 (15 students, one letter grade — modest context)
**Weighted Total: 6*0.25 + 4*0.25 + 3*0.20 + 5*0.15 + 5*0.15 = 4.6 → 5**

**Score: 9/10 (Excellent)**
"Developed 'Visual Calculus' method for ADHD learners after noticing pattern confusion. Created 47 YouTube tutorials (23K views); approach adopted by 3 schools. 93% of my students now self-report math confidence."

- Role Ownership: 10/10 (unmistakably clear what THEY did)
- Evidence of Impact: 9/10 (clear cause-effect, external validation — adopted by schools)
- Differentiation: 10/10 (unique methodology, "fingerprint moment")
- Action Precision: 8/10 ("developed", "created" — strong but room for more vivid verbs)
- Quantification: 9/10 (47 tutorials, 23K views, 3 schools, 93% — meaningful with context)
**Weighted Total: 10*0.25 + 9*0.25 + 10*0.20 + 8*0.15 + 9*0.15 = 9.3 → 9**

### EXAMPLE 2: Hospital Volunteering

**Score: 1/10 (Very Poor)**
"Volunteered at local hospital helping patients and staff. Gained valuable experience in healthcare. Committed to serving others."

- Role Ownership: 1/10 (what did they actually DO?)
- Evidence of Impact: 0/10 (no outcomes at all)
- Differentiation: 0/10 (completely generic)
- Action Precision: 2/10 ("volunteered", "helping" passive)
- Quantification: 0/10 (none)
**Weighted Total: 1*0.25 + 0*0.25 + 0*0.20 + 2*0.15 + 0*0.15 = 0.6 → 1**

**Score: 8/10 (Very Good)**
"Redesigned patient check-in workflow after observing 40+ wait time complaints. Proposed new triage questionnaire—piloted program reduced average wait 22%. Presented findings to hospital board."

- Role Ownership: 10/10 (crystal clear individual contribution)
- Evidence of Impact: 9/10 (clear causation, measured outcome)
- Differentiation: 8/10 (unique initiative, external validation)
- Action Precision: 9/10 ("redesigned", "proposed", "piloted", "presented")
- Quantification: 6/10 (40+ complaints, 22% reduction — good but could add scale)
**Weighted Total: 10*0.25 + 9*0.25 + 8*0.20 + 9*0.15 + 6*0.15 = 8.6 → 8** (rounded down: minor room for stronger quantification)

### EXAMPLE 3: Student Government (Middle Ground)

**Score: 5/10 (Average)**
"Junior Class President. Organized homecoming, prom, and class events. Led meetings and managed budget of $3,000. Represented class at school board meetings."

- Role Ownership: 7/10 (clear role via title, but description is duty list)
- Evidence of Impact: 2/10 (events happened, but what was the outcome?)
- Differentiation: 2/10 (sounds like any class president)
- Action Precision: 5/10 ("organized", "led", "managed" acceptable but generic)
- Quantification: 5/10 ($3,000 provides some scale, but only one number)
**Weighted Total: 7*0.25 + 2*0.25 + 2*0.20 + 5*0.15 + 5*0.15 = 4.2 → 5** (rounded up: title gives credit)

### EXAMPLE 4: Research — JARGON vs VALUE (Critical Calibration)

IMPORTANT: Technical vocabulary is NOT the same as communicating value to an AO.
Listing tools/techniques without outcomes is the #1 research description mistake.
AOs don't care WHAT tools you used — they care WHAT you found/built/changed.

**Score: 5/10 (Jargon without outcome — should NOT score higher)**
"Used Python and pandas for data analysis on cancer genomics research dataset. Applied machine learning algorithms and statistical methods."

- Role Ownership: 5/10 (unclear what THIS student contributed vs lab's work)
- Evidence of Impact: 2/10 (no outcome — what did the analysis FIND?)
- Differentiation: 2/10 (any research intern could write this)
- Action Precision: 5/10 ("used", "applied" are generic — the tools don't make it specific)
- Quantification: 1/10 (no numbers at all)
**Weighted Total: 5*0.25 + 2*0.25 + 2*0.20 + 5*0.15 + 1*0.15 = 3.1 → 5** (generous — tool names give false impression of specificity)

**Score: 4/10 (Pure technique listing — even lower)**
"Implemented machine learning algorithms in TensorFlow. Conducted PCR, gel electrophoresis, and Western blot assays in molecular biology lab."

- Role Ownership: 3/10 (describes lab techniques, not student's contribution)
- Evidence of Impact: 1/10 (no outcomes, no results, no findings)
- Differentiation: 1/10 (every bio/CS research student lists these exact things)
- Action Precision: 6/10 ("implemented", "conducted" are decent verbs)
- Quantification: 0/10 (none)
**Weighted Total: 3*0.25 + 1*0.25 + 1*0.20 + 6*0.15 + 0*0.15 = 2.1 → 4** (verb quality saves it from lower, but substance is empty)

**Score: 8/10 (Technical + outcome — THIS is how research should score)**
"Built NLP pipeline processing 50K patient records; identified 3 novel symptom clusters; co-authored paper accepted to AMIA conference"

- Role Ownership: 9/10 (crystal clear — THEY built the pipeline and identified clusters)
- Evidence of Impact: 8/10 (50K records processed, novel findings, paper accepted)
- Differentiation: 8/10 (specific pipeline, specific findings, conference acceptance)
- Action Precision: 8/10 ("built", "identified", "co-authored" all strong)
- Quantification: 8/10 (50K, 3 clusters — meaningful with context)
**Weighted Total: 9*0.25 + 8*0.25 + 8*0.20 + 8*0.15 + 8*0.15 = 8.3 → 8**

**Score: 9/10 (Outcome-driven research with impact — highest tier)**
"Designed data visualization dashboard analyzing school air quality; used by 3 departments; reduced facility report generation time 60%; presented at county board"

- Role Ownership: 10/10 (unmistakable individual contribution)
- Evidence of Impact: 9/10 (adoption by departments, 60% time reduction, board presentation)
- Differentiation: 9/10 (specific project, specific impact, external adoption)
- Action Precision: 9/10 ("designed", "presented" — precise and powerful)
- Quantification: 9/10 (3 departments, 60% reduction — meaningful percentages with context)
**Weighted Total: 10*0.25 + 9*0.25 + 9*0.20 + 9*0.15 + 9*0.15 = 9.3 → 9**

KEY TAKEAWAY: Technical jargon (Python, TensorFlow, PCR, ML) earns 0 differentiation points.
OUTCOME is what scores: what you FOUND, what CHANGED, who USED it, what was ADOPTED.

═══════════════════════════════════════════════════════════════════════════════
ADDITIONAL DIAGNOSTIC CHECKS
═══════════════════════════════════════════════════════════════════════════════

## AUTHENTICITY CHECK
- Does language match apparent experience level?
- Are claims proportionate to time invested?
- Red flag: grandiose claims without evidence ("revolutionized", "transformed" without specifics)

## INFORMATION DENSITY & CHARACTER EFFICIENCY
The ${platformName} description field is ${charLimit} characters. Every character must earn its place.
AOs spend 8-15 seconds per activity (PrepScholar, Selingo). The description must be INSTANTLY scannable.${charLimit > 200 ? `

NOTE: With ${charLimit} characters (${platformName}), you have MORE SPACE than Common App (150 chars).
This means students can include more detail, but should NOT pad with filler. The extra space should be used for:
- Deeper specificity about methods, outcomes, or progression
- Context that wouldn't fit in 150 chars (e.g., selectivity denominators, before/after metrics)
- Brief "why" clauses that show motivation
The rubric applies the same — information density STILL matters. More space ≠ more words. More space = more SUBSTANCE.` : ''}

Best format depends on the ACTIVITY TYPE. Identify the category, then apply its format:

**1. STEM/RESEARCH** (lab research, independent projects, science fairs, coding, engineering, math/CS competitions):
→ Technical specificity + output metrics. AOs at STEM schools know the hierarchy cold (Caltech: "we want to see you think like a scientist").
  FORMULA: [Method/Tool]; [scope/scale]; [output — paper, award, or product]; [external validation with selectivity denominator]

  **Lab/Mentored Research:**
  GOOD: "Under Dr. Chen, optimized CRISPR protocols for zebrafish gene editing; 50+ microinjections; results inform ongoing Parkinson's study"
  GOOD: "Performed LC-MS analysis on tumor samples; identified 3 dysregulated metabolic pathways; contributed data to 2 published studies"
  KEY: Specify YOUR technique + YOUR output (not lab's). Title goes in position field — description = what you actually DID.

  **Independent Research:**
  GOOD: "Designed longitudinal survey (n=300) studying teen social media anxiety; self-taught statistical analysis; published in peer-reviewed journal"
  KEY: Emphasize question formation + self-directed methodology. "Self-taught" = initiative signal.

  **Science Competitions** (hierarchy: STS/ISEF Grand Award > ISEF Category > STS Semifinalist > State Fair > Regional):
  GOOD: "Regeneron STS Scholar (top 40 of 1,949); developed protein-folding prediction algorithm; presented at National Academy of Sciences"
  GOOD: "ISEF 4th place Materials Science (of 1,800 global finalists); engineered biodegradable plastic from algae extract"
  KEY: ALWAYS include selectivity denominator — "top 40 of 1,949" transforms the claim. Without it, AOs can't gauge significance.

  **Math/CS Competitions** (hierarchy: USAMO/IMO > AIME > AMC Honor Roll; USACO Platinum > Gold > Silver):
  GOOD: "USAMO Qualifier (top 500 of 300K); AIME score 12/15; invited to Mathematical Olympiad Summer Program"
  GOOD: "USACO Platinum division; solved algorithmic problems in C++; ranked top 200 nationally in Dec contest"

  **Coding/Engineering Projects:**
  GOOD: "Developed iOS mental health app (CBT exercises + mood tracking); 2,500+ downloads, 4.8★; adopted by school wellness program"
  GOOD: "Engineered autonomous robot (Python/Arduino); 1st place regional VEX; completed tasks 30% faster than field average"
  KEY: Translate technical work into impact AOs understand — users, downloads, adoption, time/cost savings. GitHub stars matter only if 100+.

  **Publications in descriptions:** Use "published in [Journal]", "co-authored paper in [Journal]", "manuscript under review at [Journal]", or "submitted to [Journal]". First author > co-author > contributing.

  RED FLAGS: "Conducted research" with no specifics. "Assisted in Dr. Smith's lab" (what did YOU do?). Jargon overload without accessible translation (max 1-2 technical terms, rest plain language). "Learned Python, R, MATLAB, TensorFlow" (tools without output). "Revolutionary"/"groundbreaking" without evidence.

**2. LEADERSHIP/GOVERNMENT** (student council, club president, team captain, organization head):
→ What you CHANGED, not what you HELD. Lead with the delta, not the title.
  FORMULA: [How selected]; [what you changed]; [quantified result]
  GOOD: "SC President: created anonymous feedback app (400+ monthly submissions); first successful policy change in 3 yrs"
  GOOD: "Captain (elected by 20 teammates): redesigned training program; team improved 8th → 2nd in league"
  GOOD: "Founded Environmental Action Club (60 members); led campus plastic ban adopted by administration"
  KEY: "Elected by peers" > "appointed by coach/teacher". Progression arrows show growth: "member → VP → President"
  RED FLAG: Duty lists ("organized events, led meetings, managed budget") without outcomes. Sounds like ANY president.

**3. COMMUNITY SERVICE** (volunteering, tutoring, mentoring, nonprofit work):
→ Impact on OTHERS first. Show what changed for the people served, not what you learned.
  FORMULA: [Who you served + specificity]; [quantified outcome]; [sustainability evidence]
  GOOD: "Tutor 8 middle schoolers weekly; avg grades C+ → B+; created study guides now used schoolwide"
  GOOD: "Started visiting Mr. Chen at nursing home for class req; kept going 2 yrs after — he teaches me mahjong"
  GOOD: "Founded free SAT prep for low-income students; 45 students/yr; avg score increase 120 pts; program now in 3 schools"
  KEY: Sustained service (3+ yrs) >> one-time events. Local impact >> international voluntourism. Specific beneficiary details (age, context) >> "the community."
  RED FLAG: "Passionate about giving back" or "helped those in need" (generic virtue-signaling). Mission trips without follow-up.

**4. WORK/EMPLOYMENT** (paid jobs, family business, freelancing, entrepreneurship):
→ Scope + progression + one ownership detail. Show what the job REVEALED about you.
  FORMULA: [Scope/volume]; [progression or promotion]; [one specific initiative you owned]
  GOOD: "Processed 300+ transactions/shift; trained 5 new cashiers; created closing checklist reducing errors 40%"
  GOOD: "Shift lead (promoted in 3 mos); managed dinner service for 80-seat restaurant; coordinated 6-person kitchen team"
  GOOD: "Built lawn care business from scratch; 20 regular clients; hired 2 seasonal employees; $12K annual revenue"
  KEY: Shemmassian's "failed simulation effect" — specific details AOs can't easily imagine having done. Let hours/weeks fields handle time commitment; description handles WHAT you did.
  RED FLAG: "Worked as cashier at local grocery store" (no specifics). Apologetic tone about needing to work.

**5. FAMILY RESPONSIBILITIES** (caregiving, sibling care, translation, household management):
→ Specificity eliminates pity; competence reads as maturity. State facts, not feelings.
  FORMULA: [Specific responsibilities]; [scope/frequency]; [skills demonstrated]
  GOOD: "Primary caregiver for 3 siblings (ages 4-9); manage after-school routines, meals, homework; coordinate medical appointments"
  GOOD: "Family interpreter (Spanish/English) for medical, legal & school communications; navigate insurance systems; translate documents"
  KEY: Use the same confident fragment format as any other activity. Frame as SKILLS, not sacrifice. The hours fields (25 hrs/wk, 52 wk/yr) communicate necessity — description communicates competence.
  RED FLAG: "Had to take care of everyone because..." (victimhood framing). Vague "help out at home."

**6. ARTS/CREATIVE** (music, visual arts, theater, film, dance, creative writing):
→ Verifiable credentials + body of work. AOs can't evaluate artistic quality from text, so external validation is critical.
  FORMULA: [Medium + years]; [highest recognition/selectivity]; [output volume or audience]; [teaching if applicable]
  GOOD: "Cello (10 yrs); All-State Orchestra principal (selected from 2,400 auditions); solo recitals 3/yr; teach 5 students"
  GOOD: "Oil painting; Scholastic Gold Key (Regional); exhibited 3 juried galleries; 40+ works; $2K commission income"
  GOOD: "Wrote/directed short film; screened at 2 festivals (200+ submissions each); 50K YouTube views"
  KEY: Selectivity context transforms claims — "All-State (selected from 2,400)" >> "All-State". Juried exhibitions >> open shows. Teaching others = mastery signal.
  RED FLAG: "Through music, I found my voice" (save emotion for essays — description is your fact sheet). Years of lessons without performance/output metrics.

**7. ATHLETICS** (team sports, individual sports, club/recreational):
→ For non-recruited athletes: character + growth trajectory, not just stats. For recruited: stats + rankings.
  FORMULA (non-recruited): [Position + years]; [progression]; [leadership contribution]; [measurable team impact]
  FORMULA (recruited): [Stats/times/rankings]; [selection context]; [records/awards]
  GOOD: "Starting midfielder (3 yrs); led team in assists (12/season); captain-elected by teammates; team 8th → 2nd in league"
  GOOD: "JV (soph) → Varsity starter (jr) → Captain (sr); created offseason conditioning program; cut team injuries 60%"
  GOOD: "800m: 1:58 PR (top 5% state); 3x All-Conference; school record holder; 20 hrs/wk training"
  KEY: Growth arcs ("JV → Varsity → Captain") show character. Stats need denominators ("3rd of 180 competitors" >> "3rd place"). Practice hours establish commitment parity with other activities.
  RED FLAG: "Played varsity for three years" with no distinction. "Captain" without evidence of what changed.

**ALWAYS BAD (any activity type):**
  "I founded the first computer science club at my school and taught 25 students Python and web development."
  (Full sentences with articles/pronouns waste characters and sound generic — the "1,000 student test" fails if any student could write this exact description)

Reward: High info-per-character ratio, abbreviations (hrs/wk, yr, avg, &, /), semicolons separating distinct claims, context-appropriate personality signals, selectivity denominators, progression arrows, specific beneficiary details
Penalize: Complete sentences with articles/pronouns, redundancy with position/org fields, filler words, AI-generated resume bullets, duty lists without outcomes, emotional language in place of evidence, generic virtue-signaling

Character-efficiency red flags:
- Uses "I" or "my" (wastes 2-3 chars, starts should be verb-first)
- Spells out "and" when "&" works (wastes 2 chars each)
- Uses "more than" when "+" works (wastes 7 chars)
- Full sentences with subjects/articles when fragments would convey same info
- Restates role/title already captured in position field
- Description under ${Math.round(charLimit * 0.8)} chars when more impact info could be added
- Reads as "AI-generated resume bullet" with no personality (especially for character/family activities)
- "Passionate about" or "dedicated to" (wastes 15+ chars on claims instead of evidence)
- Missing selectivity context for competitions/awards (denominator problem)

## OVERCLAIMING DETECTION
- Claims that sound impressive but lack evidence
- Words like "revolutionary", "groundbreaking" without substantiation
- Misattribution of team/org accomplishments to individual

═══════════════════════════════════════════════════════════════════════════════
SCORE INTERPRETATION
═══════════════════════════════════════════════════════════════════════════════

| Range | Label    | What It Means |
|-------|----------|---------------|
| 9-10  | Elite    | Exceptional craft; stands out immediately; makes reader want to learn more |
| 7-8.9 | Strong   | Well-written; clear contribution and impact; minor room for improvement |
| 5-6.9 | Adequate | Acceptable but generic; tells the story but doesn't differentiate |
| 3-4.9 | Weak     | Significant issues; doesn't serve student well; needs substantial revision |
| 0-2.9 | Poor     | Major problems; may hurt application; needs complete rewrite |

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON)
═══════════════════════════════════════════════════════════════════════════════

{
  "total": <1-10, weighted average of dimensions: specificity*0.25 + impactClarity*0.25 + authenticityVoice*0.20 + actionLanguage*0.15 + quantification*0.15>,
  "breakdown": {
    "specificity": {
      "score": <0-10 for roleOwnership>,
      "maxScore": 10,
      "rationale": "<specific observation about role clarity>"
    },
    "impactClarity": {
      "score": <0-10>,
      "maxScore": 10,
      "rationale": "<specific observation about impact evidence>"
    },
    "actionLanguage": {
      "score": <0-10>,
      "maxScore": 10,
      "rationale": "<verbs identified and assessment>"
    },
    "quantification": {
      "score": <0-10>,
      "maxScore": 10,
      "rationale": "<numbers identified and whether meaningful>"
    },
    "authenticityVoice": {
      "score": <0-10>,
      "maxScore": 10,
      "rationale": "<differentiation assessment>"
    }
  },
  "strengths": ["<what the description does well>"],
  "improvements": ["<specific issues identified>"],
  "overallRationale": "<2-3 sentence diagnosis of where this description stands>",
  "diagnosticFlags": {
    "overclaiming": <true/false>,
    "underrepresenting": <true/false>,
    "genericLanguage": <true/false>,
    "missingOwnership": <true/false>,
    "poorCharacterEfficiency": <true/false — uses full sentences, articles, pronouns when fragments would be more efficient>
  }
}

NOTE: Map new dimensions to legacy field names:
- roleOwnership → specificity
- evidenceOfImpact → impactClarity
- actionPrecision → actionLanguage
- strategicQuantification → quantification
- differentiationSignal → authenticityVoice

Be precise, fair, and diagnostic. Your job is to accurately assess—the teaching layer handles improvement guidance.`;

const buildDescriptionScoringPrompt = (input: DescriptionScoringInput): string => {
  const timeContext = input.hoursPerWeek && input.weeksPerYear
    ? `\nTIME INVESTMENT: ${input.hoursPerWeek} hrs/week, ${input.weeksPerYear} weeks/year`
    : '';

  // Inject KB AO expectations for field-specific scoring calibration
  const aoBlock = buildAOContextForDescriptionScoring(input.activityType, input.description, input.position);

  return `Score this activity description:

ACTIVITY: ${input.activityTitle}${input.activityType ? ` (${input.activityType})` : ''}${input.position ? `\nPOSITION: ${input.position}` : ''}${timeContext}${aoBlock}

DESCRIPTION (${input.description.length} characters):
"${input.description}"

Apply the rubric precisely. Provide your scoring in the JSON format specified.`;
};

/**
 * Build AO context block from KB for description scoring.
 * Helps Sonnet understand what AOs look for in this specific field.
 */
function buildAOContextForDescriptionScoring(activityType?: string, description?: string, role?: string): string {
  if (!activityType && !description) return '';

  const resolution = resolveCategory(description || activityType || '', activityType, role);
  if (!resolution || !resolution.category.aoExpectations) return '';

  const ao = resolution.category.aoExpectations;
  return `\nFIELD CONTEXT (${resolution.category.label}): AOs ask: "${ao.goldenQuestion}" | They look for: ${ao.whatRegisters.slice(0, 2).join('; ')} | Red flags: ${ao.whatAOsSeeThrough.slice(0, 2).join('; ')}`;
}

const buildBatchDescriptionScoringPrompt = (inputs: DescriptionScoringInput[]): string => {
  const activitiesText = inputs
    .map((input, index) => {
      const timeContext = input.hoursPerWeek && input.weeksPerYear
        ? `\nTime: ${input.hoursPerWeek} hrs/week, ${input.weeksPerYear} weeks/year`
        : '';
      return `
ACTIVITY ${index + 1}: ${input.activityTitle}${input.activityType ? ` (${input.activityType})` : ''}${input.position ? `\nPosition: ${input.position}` : ''}${timeContext}
Description (${input.description.length} chars): "${input.description}"`;
    })
    .join('\n\n');

  return `Score these ${inputs.length} activity descriptions:

${activitiesText}

Apply the rubric precisely to EACH activity. Each dimension is 0-10. Total = weighted average (specificity*0.25 + impactClarity*0.25 + authenticityVoice*0.20 + actionLanguage*0.15 + quantification*0.15). Provide your scoring for ALL activities in this JSON format:
{
  "scores": [
    {
      "activityIndex": 1,
      "total": <1-10, weighted average>,
      "breakdown": {
        "specificity": { "score": <0-10>, "maxScore": 10, "rationale": "..." },
        "impactClarity": { "score": <0-10>, "maxScore": 10, "rationale": "..." },
        "actionLanguage": { "score": <0-10>, "maxScore": 10, "rationale": "..." },
        "quantification": { "score": <0-10>, "maxScore": 10, "rationale": "..." },
        "authenticityVoice": { "score": <0-10>, "maxScore": 10, "rationale": "..." }
      },
      "strengths": ["..."],
      "improvements": ["..."],
      "overallRationale": "...",
      "diagnosticFlags": { "overclaiming": false, "underrepresenting": false, "genericLanguage": true, "missingOwnership": false, "poorCharacterEfficiency": false }
    },
    ... (one for each activity)
  ]
}`;
};

// ============================================================================
// SERVICE
// ============================================================================

export class DescriptionScoringService {
  /**
   * Score a single activity description using Sonnet for nuanced assessment
   */
  async scoreDescription(input: DescriptionScoringInput, targetPlatform?: ApplicationPlatform): Promise<DescriptionScoringResult> {
    try {
      const charLimit = getDescriptionCharLimit(targetPlatform);
      const platformName = getPlatformName(targetPlatform);

      // Pre-LLM: Computational writing signal enrichment
      const preAnalysis = writingPreAnalyzer.analyze(input.description);
      const enrichmentBlock = preAnalysis ? formatForActivityScoring(preAnalysis) : null;

      // Build user prompt with optional writing signals injected AFTER cached sections
      const baseUserPrompt = buildDescriptionScoringPrompt(input);
      const enrichedUserPrompt = enrichmentBlock
        ? `${enrichmentBlock.content}\n\nCOMPUTATIONAL WRITING SIGNALS:\nUse these objective signals to calibrate your scoring. For example, if AI Risk is HIGH, be more skeptical of polished language. If compression ratio is low, the description may be repetitive.\n\n${baseUserPrompt}`
        : baseUserPrompt;

      const response = await callClaude(
        enrichedUserPrompt,
        {
          model: 'claude-sonnet-4-5-20250929', // Sonnet 4.5 for nuanced description assessment
          systemPrompt: buildDescriptionScoringSystemPrompt(charLimit, platformName),
          cacheSystemPrompt: true, // Enable Anthropic prompt caching
          temperature: 0.15, // Low temperature for scoring consistency
          maxTokens: 1500,
        }
      );

      if (!response.content) {
        return {
          success: false,
          error: 'Failed to get response from Claude',
        };
      }

      // Parse JSON response
      const parsed = this.parseScoreResponse(response.content);
      if (!parsed) {
        return {
          success: false,
          error: 'Failed to parse scoring response',
        };
      }

      // Clamp all scores to valid ranges (safety net for LLM output)
      parsed.total = Math.max(1, Math.min(10, Math.round(parsed.total * 10) / 10));
      if (parsed.breakdown) {
        for (const key of Object.keys(parsed.breakdown)) {
          const component = parsed.breakdown[key as keyof DescriptionScoreBreakdown];
          if (component && typeof component.score === 'number') {
            component.score = Math.max(0, Math.min(10, Math.round(component.score * 10) / 10));
          }
        }
      }

      // Post-LLM calibration (constraint satisfaction + revision priorities)
      if (parsed && preAnalysis) {
        // Map parsed breakdown fields → calibration dimension names
        const scores: Record<string, number> = {
          role_ownership: parsed.breakdown.specificity.score,
          evidence_of_impact: parsed.breakdown.impactClarity.score,
          differentiation_signal: parsed.breakdown.authenticityVoice.score,
          action_precision: parsed.breakdown.actionLanguage.score,
          strategic_quantification: parsed.breakdown.quantification.score,
        };
        const weights: Record<string, number> = {
          role_ownership: 0.25,
          evidence_of_impact: 0.25,
          differentiation_signal: 0.20,
          action_precision: 0.15,
          strategic_quantification: 0.15,
        };
        const calibration = postLLMCalibrator.calibrate(
          scores,
          weights,
          'experience',
          input.description.length,
        );
        if (calibration.hasAdjustments && calibration.adjustedScores) {
          console.log('[DescriptionScoring] Constraint calibration applied:', calibration.constraintCheck.violations_found, 'violations fixed');

          // Apply adjusted scores back to parsed breakdown
          // Calibration keys → parsed breakdown fields:
          //   role_ownership → specificity
          //   evidence_of_impact → impactClarity
          //   differentiation_signal → authenticityVoice
          //   action_precision → actionLanguage
          //   strategic_quantification → quantification
          const adj = calibration.adjustedScores;
          if (adj.role_ownership !== undefined) parsed.breakdown.specificity.score = adj.role_ownership;
          if (adj.evidence_of_impact !== undefined) parsed.breakdown.impactClarity.score = adj.evidence_of_impact;
          if (adj.differentiation_signal !== undefined) parsed.breakdown.authenticityVoice.score = adj.differentiation_signal;
          if (adj.action_precision !== undefined) parsed.breakdown.actionLanguage.score = adj.action_precision;
          if (adj.strategic_quantification !== undefined) parsed.breakdown.quantification.score = adj.strategic_quantification;

          // Recalculate total from adjusted breakdown scores using weights
          const recalculatedTotal =
            parsed.breakdown.specificity.score * 0.25 +
            parsed.breakdown.impactClarity.score * 0.25 +
            parsed.breakdown.authenticityVoice.score * 0.20 +
            parsed.breakdown.actionLanguage.score * 0.15 +
            parsed.breakdown.quantification.score * 0.15;

          parsed.total = Math.max(1, Math.min(10, Math.round(recalculatedTotal * 10) / 10));
        }
      }

      return {
        success: true,
        score: parsed,
        tokensUsed: {
          input: response.usage.input_tokens,
          output: response.usage.output_tokens,
        },
      };
    } catch (error) {
      console.error('[DescriptionScoringService] Error scoring description:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Score multiple activity descriptions in a single API call
   * More efficient for portfolios with many activities
   */
  async scoreDescriptionsBatch(
    input: BatchDescriptionScoringInput
  ): Promise<BatchDescriptionScoringResult> {
    if (input.activities.length === 0) {
      return { success: true, scores: [] };
    }

    const charLimit = getDescriptionCharLimit(input.targetPlatform);
    const platformName = getPlatformName(input.targetPlatform);

    // For single activity, use the single method
    if (input.activities.length === 1) {
      const result = await this.scoreDescription(input.activities[0], input.targetPlatform);
      return {
        success: result.success,
        scores: result.score ? [result.score] : undefined,
        error: result.error,
        tokensUsed: result.tokensUsed,
      };
    }

    try {
      // Pre-LLM: Computational writing signal enrichment for batch
      const batchSignals = input.activities
        .map((a, idx) => {
          const analysis = writingPreAnalyzer.analyze(a.description);
          if (!analysis) return null;
          const block = formatForActivityScoring(analysis);
          return `Activity ${idx + 1} (${a.activityTitle}): ${block.content}`;
        })
        .filter(Boolean)
        .join('\n');

      const batchEnrichmentPrefix = batchSignals
        ? `COMPUTATIONAL WRITING SIGNALS:\n${batchSignals}\n\nUse these objective signals to calibrate your scoring. For example, if AI Risk is HIGH, be more skeptical of polished language. If compression ratio is low, the description may be repetitive.\n\n`
        : '';

      // Scale maxTokens with activity count: ~1000 tokens per description score output
      const batchMaxTokens = Math.min(12000, input.activities.length * 1500 + 1000);
      const baseBatchPrompt = buildBatchDescriptionScoringPrompt(input.activities);
      const response = await callClaude(
        batchEnrichmentPrefix + baseBatchPrompt,
        {
          model: 'claude-sonnet-4-5-20250929', // Sonnet 4.5 for nuanced description assessment
          systemPrompt: buildDescriptionScoringSystemPrompt(charLimit, platformName),
          cacheSystemPrompt: true, // Enable Anthropic prompt caching — 90% cost reduction on cache hits
          temperature: 0.15, // Low temperature for scoring consistency
          maxTokens: batchMaxTokens,
          timeoutMs: 240000, // 4 min — matches activityScoringService; default 120s was causing timeouts
        }
      );

      if (!response.content) {
        return {
          success: false,
          error: 'Failed to get response from Claude',
        };
      }

      // Parse batch JSON response
      const parsed = this.parseBatchScoreResponse(response.content, input.activities.length);
      if (!parsed) {
        return {
          success: false,
          error: 'Failed to parse batch scoring response',
        };
      }

      return {
        success: true,
        scores: parsed,
        tokensUsed: {
          input: response.usage.input_tokens,
          output: response.usage.output_tokens,
        },
      };
    } catch (error) {
      console.error('[DescriptionScoringService] Error scoring descriptions batch:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Parse single score response from LLM
   */
  private parseScoreResponse(content: string): DescriptionScore | null {
    try {
      // R7: Use robust parseClaudeJSON with jsonrepair fallback
      const data = tryParseClaudeJSON<Record<string, unknown>>(content, 'DescriptionScoringService');
      if (!data) return null;

      // Validate and normalize the response
      return this.normalizeScoreData(data);
    } catch (error) {
      console.error('[DescriptionScoringService] Parse error:', error);
      return null;
    }
  }

  /**
   * Parse batch score response from LLM
   * Uses activityIndex from LLM output to correctly order results,
   * falling back to sequential order if activityIndex is missing.
   */
  parseBatchScoreResponse(content: string, expectedCount: number): DescriptionScore[] | null {
    try {
      // R7: Use robust parseClaudeJSON with jsonrepair fallback
      const data = tryParseClaudeJSON<Record<string, unknown>>(content, 'DescriptionScoringService.batch');
      if (!data) return null;

      if (!data.scores || !Array.isArray(data.scores)) {
        console.error('[DescriptionScoringService] Invalid batch response structure');
        return null;
      }

      // Try to use activityIndex for correct ordering
      const hasActivityIndex = data.scores.every(
        (s: Record<string, unknown>) => typeof s?.activityIndex === 'number'
      );

      if (hasActivityIndex) {
        // Place scores by activityIndex (1-based from LLM)
        const scores: DescriptionScore[] = new Array(expectedCount);
        for (const scoreData of data.scores as Record<string, unknown>[]) {
          const idx = (scoreData.activityIndex as number) - 1;
          if (idx >= 0 && idx < expectedCount) {
            const normalized = this.normalizeScoreData(scoreData);
            if (normalized) {
              scores[idx] = normalized;
            }
          }
        }

        const filledCount = scores.filter(Boolean).length;
        if (filledCount !== expectedCount) {
          console.warn(
            `[DescriptionScoringService] Expected ${expectedCount} scores, got ${filledCount} (by activityIndex)`
          );
        }

        return scores;
      }

      // Fallback: sequential ordering
      const scores: DescriptionScore[] = new Array(expectedCount);
      let placed = 0;
      for (const scoreData of data.scores) {
        if (placed >= expectedCount) break;
        const normalized = this.normalizeScoreData(scoreData);
        if (normalized) {
          scores[placed] = normalized;
          placed++;
        }
      }

      if (placed !== expectedCount) {
        console.warn(
          `[DescriptionScoringService] Expected ${expectedCount} scores, got ${placed}`
        );
      }

      return scores;
    } catch (error) {
      console.error('[DescriptionScoringService] Batch parse error:', error);
      return null;
    }
  }

  /**
   * Normalize and validate score data from LLM response
   * Maps new dimension names to legacy field names for compatibility
   */
  private normalizeScoreData(data: unknown): DescriptionScore | null {
    if (!data || typeof data !== 'object') return null;

    const d = data as Record<string, unknown>;

    // Validate required fields
    if (typeof d.total !== 'number' || !d.breakdown) {
      return null;
    }

    const breakdown = d.breakdown as Record<string, unknown>;

    // Helper to normalize a component — all dimensions now 0-10
    const normalizeComponent = (comp: unknown, maxScore: number): DescriptionScoreComponent => {
      if (!comp || typeof comp !== 'object') {
        return { score: 0, maxScore, rationale: 'Unable to assess' };
      }
      const c = comp as Record<string, unknown>;
      return {
        score: Math.min(maxScore, Math.max(0, Number(c.score) || 0)),
        maxScore,
        rationale: String(c.rationale || 'No rationale provided'),
      };
    };

    // Build normalized breakdown — all dimensions 0-10
    const normalizedBreakdown: DescriptionScoreBreakdown = {
      specificity: normalizeComponent(breakdown.specificity, 10),        // Role Ownership (25%)
      impactClarity: normalizeComponent(breakdown.impactClarity, 10),    // Evidence of Impact (25%)
      actionLanguage: normalizeComponent(breakdown.actionLanguage, 10),  // Action Precision (15%)
      quantification: normalizeComponent(breakdown.quantification, 10),  // Strategic Quantification (15%)
      authenticityVoice: normalizeComponent(breakdown.authenticityVoice, 10), // Differentiation Signal (20%)
    };

    // Calculate weighted total from components
    // Weights: Role Ownership 25% + Evidence of Impact 25% + Differentiation 20% + Action Precision 15% + Quantification 15% = 100%
    const calculatedTotal =
      normalizedBreakdown.specificity.score * 0.25 +        // Role Ownership
      normalizedBreakdown.impactClarity.score * 0.25 +      // Evidence of Impact
      normalizedBreakdown.authenticityVoice.score * 0.20 +  // Differentiation Signal
      normalizedBreakdown.actionLanguage.score * 0.15 +     // Action Precision
      normalizedBreakdown.quantification.score * 0.15;      // Strategic Quantification

    // Use calculated total
    const total = Math.round(calculatedTotal * 10) / 10; // Round to 1 decimal

    return {
      total: Math.min(10, Math.max(1, total)),
      breakdown: normalizedBreakdown,
      strengths: Array.isArray(d.strengths) ? d.strengths.map(String) : [],
      improvements: Array.isArray(d.improvements) ? d.improvements.map(String) : [],
      overallRationale: String(d.overallRationale || this.generateRationale(total)),
      suggestedRewrite: d.suggestedRewrite ? String(d.suggestedRewrite) : undefined,
    };
  }

  /**
   * Generate a fallback rationale based on score
   */
  private generateRationale(score: number): string {
    const roundedScore = Math.round(score);
    const levelKey = Math.min(10, Math.max(1, roundedScore)) as keyof typeof DESCRIPTION_SCORE_LEVELS;
    return `This description scores ${score}/10. ${DESCRIPTION_SCORE_LEVELS[levelKey] || 'See component breakdowns for details.'}`;
  }

  /**
   * Get score level description for display
   */
  getScoreLevelDescription(score: number): string {
    const levelKey = Math.min(10, Math.max(1, Math.round(score))) as keyof typeof DESCRIPTION_SCORE_LEVELS;
    return DESCRIPTION_SCORE_LEVELS[levelKey] || 'Unknown';
  }

  /**
   * Get interpretation label for a score
   */
  getScoreInterpretation(score: number): 'elite' | 'strong' | 'adequate' | 'weak' | 'poor' {
    if (score >= 9) return 'elite';
    if (score >= 7) return 'strong';
    if (score >= 5) return 'adequate';
    if (score >= 3) return 'weak';
    return 'poor';
  }
}

// Export singleton
export const descriptionScoringService = new DescriptionScoringService();
