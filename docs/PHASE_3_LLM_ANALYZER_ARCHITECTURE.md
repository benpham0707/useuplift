# Phase 3: LLM Analyzer Architecture & Design System

**Date**: 2025-11-19
**Status**: Active Development
**Context**: This document defines the "Gold Standard" architecture (v4) established during the *Initiative & Leadership* build. This architecture must be applied to all remaining 12 PIQ dimensions to ensure "Extracurricular Workshop" quality.

---

## 1. The v4 "Gold Standard" Architecture

We moved from simple regex matching (v1) to a sophisticated "Deep Reasoning" engine (v4). Every new analyzer must implement these four core components:

### A. Deep Reasoning Engine (The "Brain")
Instead of jumping to a score, the LLM must first output a `reasoning` object. This forces chain-of-thought analysis and prevents hallucinations.

**Required Fields:**
1.  **Context Analysis**: What was the status quo? (The friction/problem).
2.  **Action Analysis**: Was it reactive (assigned) or self-directed?
3.  **Impact Analysis**: Did it change a task, a system, or a culture?
4.  **Voice Analysis**: Is it robotic ("I realized") or authentic ("The boxes were stacked...")?

### B. Tiered Scoring (The "Ladder")
Scores are not arbitrary. They correspond to specific developmental stages. You must define these 4 tiers for *every* dimension:

| Tier | Score | Archetype | Description |
| :--- | :--- | :--- | :--- |
| **1** | 0-3 | **Participant** | Does the work assigned. Reactive. |
| **2** | 4-6 | **Contributor** | Improves efficiency. Takes ownership of tasks. |
| **3** | 7-8 | **Transformer** | Changes *systems*. Solves systemic gaps. Autodidactic. |
| **4** | 9-10 | **Visionary** | Changes *institutions/culture*. Intellectual risk. Elite voice. |

### C. Strategic Pivot (The "Coach")
Replace generic "quick wins" with a single, high-leverage **Strategic Pivot**.
- **Format**: "The Invisible Ceiling: [Identify the obstacle]. To reach [Next Tier], you need to [Specific Counter-factual Action]."
- **Goal**: Move the student *one* tier up. Don't ask a Participant to be a Visionary. Ask them to be a Contributor.

### D. Voice & Authenticity Guardrails
Explicitly penalize robotic templates.
- **Banned**: "I decided," "I founded," "I realized that leadership means..."
- **Rewarded**: Sensory details, specific scenes, vulnerability, showing failure.

---

## 2. Completed Analyzers

### A. Role Clarity & Ownership
**Definition**: Does the student understand their specific contribution relative to the group? Do they take ownership of outcomes, or just tasks?
*   **Tiers**: Passenger (0-3) → Task Owner (4-6) → Outcome Owner (7-8) → Culture Setter (9-10).

### B. Context & Circumstances
**Definition**: Does the essay provide context about obstacles, constraints, or unique circumstances? Shows resourcefulness while maintaining agency.
*   **Tiers**: Victim/Bystander (0-3) → Survivor (4-6) → Navigator (7-8) → Alchemist (9-10).

### C. Voice & Writing Style
**Definition**: Does this sound like a real person? Distinguishes authentic voice from "essay-speak" and AI generation.
*   **Tiers**: AI/Template (0-2) → Resume Prose (3-4) → Authentic (7-8) → Distinctive (9-10).

### D. Fit & Trajectory
**Definition**: Does the student have a clear "North Star"? Do their activities align with their stated goals? Is the "Why Major" argument convincing?
*   **Tiers**: Disconnect (0-3) → Interest (4-6) → Pursuit (7-8) → Alignment (9-10).

### E. Intellectual Vitality
**Definition**: Does the student demonstrate curiosity beyond the classroom? Do they "geek out" about ideas? Is learning self-directed or assigned?
*   **Tiers**: Student (0-3) → Learner (4-6) → Explorer (7-8) → Scholar (9-10).

---

## 3. Next Up: Community Impact Analyzer

**Definition**: Did the student make a tangible difference? Did they identify a specific need and address it? Does the impact last?

### Tiers (Draft)
1.  **Participant (0-3)**: "I volunteered." Passive participation. Hours logged. No specific beneficiary named. "I volunteered at the library."
2.  **Contributor (4-6)**: "I helped X group." Direct service. Clear beneficiary. Immediate but limited impact. "I tutored 5 students."
3.  **Leader (7-8)**: "I organized Y project." Scale. Mobilized others. Impact measured or clearly described. "I organized a book drive collecting 500 books."
4.  **Changemaker (9-10)**: "I changed the system." Legacy. Solved a root cause. Impact outlasts their presence. "I created a peer-tutoring system that the school adopted permanently."

### Key Warning Signs
- Focusing on hours served rather than outcomes.
- Vague "helping the community" statements.
- "Voluntourism" (brief, superficial trips).
- Lack of interaction with the people served.

---

## 4. Implementation Roadmap

| Sequence | Dimension | Status | Notes |
| :--- | :--- | :--- | :--- |
| 1 | **Initiative & Leadership** | ✅ **DONE** | Reference Implementation. |
| 2 | **Role Clarity & Ownership** | ✅ **DONE** | Focus on "We vs I". |
| 3 | **Context & Circumstances** | ✅ **DONE** | Focus on "Resourcefulness". |
| 4 | **Voice & Writing Style** | ✅ **DONE** | Focus on "Authenticity". |
| 5 | **Fit & Trajectory** | ✅ **DONE** | Focus on "Why Major?". |
| 6 | **Intellectual Vitality** | ✅ **DONE** | Focus on "Curiosity". |
| 7 | **Community Impact** | ⏳ **NEXT** | Focus on "Who benefitted?". |
| 8 | **Personal Growth** | ⏳ Pending | "What changed?". |
| 9-13 | *Remaining 5 Dimensions* | ⏳ Pending | Rebuild Phase 1 analyzers. |

---

## 5. Integration Guide

### How to Build the Next Analyzer
1.  **Copy**: `src/services/unified/features/fitTrajectoryAnalyzer_llm.ts`
2.  **Rename**: `src/services/unified/features/communityImpactAnalyzer_llm.ts`
3.  **Update Config**: Change `ANCHORS` and `TIERS`.
4.  **Update Prompt**: Modify `evaluator_prompts`.
5.  **Create Test**: Copy `test-fit-trajectory-llm.ts` -> `test-community-impact-llm.ts`.

### Critical Commandment
**NEVER REGRESS.** Every new analyzer must have:
- Structured JSON output
- `reasoning` object *before* score
- `strategic_pivot`
- 100% validation pass rate on test essays
