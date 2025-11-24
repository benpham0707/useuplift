# Phase 9: Narrative Engine Master Plan & Quality Design

**Status:** Ready for Implementation
**Date:** 2025-11-22
**Previous Phase:** Phase 8 (Foundation Complete)
**Goal:** Elevate the "Surgical Editor" from *competent* to *elite*, focusing on hyper-specificity, deep sensory immersion, and absolute precision.

---

## 1. The Vision: "Deep Feel" Quality
Our goal is to generate suggestions that prove the writer has **lived** the experience. We are moving away from "generic sports narrative" descriptions toward **visceral, unique, and deeply grounded** writing.

### The "Generic vs. Elite" Contrast
*   **Level 1 (Bad):** "I worked really hard at practice."
*   **Level 2 (Current System):** "I showed up first and did extra reps when my legs were burning." (Better, but still generic).
*   **Level 3 (Target - Phase 9):** "The cold burn of my sore leg muscles sapped my strength as I continued to charge the tackling dummy."
    *   *Why it works:* Specific sensation ("cold burn"), specific anatomy ("sore leg muscles"), specific consequence ("sapped strength"), specific object ("tackling dummy").

---

## 2. System Architecture Overview

### Current Pipeline
1.  **Holistic Analysis:** Understands theme and voice.
2.  **Rubric Scoring (13-Dim):** Scores the essay (strict).
3.  **Locator Bridge:** Finds the specific text to fix.
4.  **Orchestrator:** Prioritizes issues.
5.  **Surgical Editor:** Generates options (Polished, Voice, Divergent).
6.  **Trimming Analyzer:** Suggests cuts/rewrites for fluff.

### Required Architecture Changes
We are not rebuilding the pipeline, but we are **retuning the engines** significantly.

---

## 3. Implementation Plan: The 3 Core Upgrades

### Upgrade 1: The "Hyper-Specificity" Protocol
**Problem:** The system uses "safe" descriptors (e.g., "sweat," "hard work," "burning legs") that could apply to *any* athlete.
**Solution:** Refine the `SurgicalEditor` system prompt to enforce a **"Texture & Object" Rule**.

*   **New Prompt Requirement:** "Never describe a feeling without anchoring it to a specific physical object or precise biological sensation."
*   **The "Zoom-In" Technique:** If the student mentions "practice," the AI must hallucinate (based on context) a *specific drill* or *specific equipment* (e.g., "the sled," "the tackling dummy," "the whiteboard").
*   **Complexity Injection:** Instead of "I felt tired," use "The air felt thin in my lungs."

### Upgrade 2: Focus on "The Power of 3"
**Problem:** Generating 5 issues dilutes the quality and overwhelms the user.
**Solution:**
1.  **Reduce Orchestrator Output:** Limit `prioritizedLocators` to exactly **3 items**.
2.  **Resource Reallocation:** Use the tokens saved from generating fewer items to generate *deeper, longer, and more thoughtful* rationales and options for the 3 that remain.
3.  **"Load More" Architecture:** Design the API to accept an `exclude_ids` array. If the user wants more, we re-run the locator prioritization excluding the top 3, fetching the next batch on demand.

### Upgrade 3: The "Anti-Vagueness" Hard Fork
**Problem:** The word "something" (e.g., "something deeper," "something more") is a crutch for undefined abstract concepts.
**Solution:**
1.  **Negative Constraint:** Add "something" to the `BANNED_TERMS` list in `surgicalEditor.ts` (context-aware check).
2.  **Positive Constraint:** If the model wants to use an abstract placeholder, it must instead use a **Bracketed Directive** telling the user *exactly* what memory to insert.
    *   *Bad:* "I felt something change inside me."
    *   *Good:* "I felt [specific emotion regarding the loss] harden into resolve."
    *   *Good:* "I realized that [specific memory of teammate's face] meant more than the scoreboard."

---

## 4. Detailed Component Specifications

### A. `src/services/narrativeWorkshop/surgicalEditor.ts`

**Revised System Prompt Strategy:**
*   **Role:** Shift from "Editor" to "Ghostwriter with a PhD in Sensory Details."
*   **Constraint Checklist:**
    1.  **No Generic Actions:** Ban "showed up," "worked hard," "gave it my all."
    2.  **Sensory Mandatory:** Every suggestion must appeal to at least one sense (Touch, Sound, Smell) using *unique* adjectives (e.g., "metallic taste," "cold burn," "scuffed leather").
    3.  **Length:** Suggestions must be substantive enough to paint the scene (not just 5 words), but precise (no fluff).

### B. `src/services/narrativeWorkshop/surgicalOrchestrator.ts`

**Logic Update:**
*   Change `prioritizeLocators` to slice `.slice(0, 3)` instead of 5.
*   Ensure the top 3 cover different *types* of issues (e.g., don't return 3 "Grammar" fixes; ensure we get at least one "Narrative Arc" or "Vulnerability" issue).

### C. `src/services/narrativeWorkshop/analyzers/trimmingAnalyzer.ts`

**Refinement:**
*   Ensure the "Coach" persona remains supportive.
*   Focus cuts on *removing obstacles to the sensory details*. Fluff obscures the "cold burn."

---

## 5. Test & Verification Protocol

We will validate these changes using the **Football Captain Essay** (`tests/test-football-captain.ts`) because it is the perfect candidate for "Generic -> Elite" transformation.

**Success Criteria:**
1.  **Zero "Something":** The word "something" appears 0 times in suggestions.
2.  **Zero Clichés:** No "legs burning," "gave 110%," "left it on the field."
3.  **High Specificity:** Suggestions contain words like "scuffed," "fluorescent," "metallic," "thud," "echo," "shiver."
4.  **Count:** Exactly 3 Workshop Items are returned.

---

## 6. Future-Proofing (The "Load More" Logic)

*In the future (Frontend integration)*:
*   The UI will render the 3 items.
*   A "Find More Issues" button will trigger a new backend call: `POST /analyze/more { exclude: [id1, id2, id3] }`.
*   The backend will re-run prioritization on the cached Locators and return the next 3.
*   *Note:* We do not need to build this endpoint *now*, but the backend logic should support the concept of "Top N" easily.

---

## 7. Ready for Next Chat

**Instruction for Engineer:**
"Open `PHASE_9_NARRATIVE_ENGINE_MASTER_PLAN.md`. Implement the 'Hyper-Specificity' prompt upgrades in `surgicalEditor.ts`, reduce the output to 3 items in `surgicalOrchestrator.ts`, and rigidly enforce the ban on 'something' and generic descriptors. Run `test-football-captain.ts` to verify the 'Deep Feel' quality."



