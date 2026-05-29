# Phase 10: Narrative Engine Deepening & Optimization
**Date:** 2025-11-22
**Status:** Planning
**Previous Phase:** Phase 9 (Narrative Engine Master Plan - Implemented)

---

## 1. Executive Summary
Phase 9 successfully introduced "Hyper-Specificity," "Power of 3," and "Anti-Vagueness," significantly improving the *quality* of surgical suggestions. We also implemented a "Dynamic Few-Shot" system with "Word Count Neutrality" enforcement.

While we must fix emerging edge cases like **Context Leaking**, our primary goal is to **deepen the qualitative excellence** of the writing. We want the system to not just be "correct" but to be a world-class storytelling partner that elevates the user's authentic voice with nuance, originality, and unique narrative power.

Key Themes for Phase 10:
1.  **Qualitative Deepening:** Elevating the "Soul" of the writing—more authentic, less formulaic.
2.  **Systemic Precision:** Fixing Context Leaking, Generic Rationales, and Locator issues.
3.  **Robust Architecture:** Moving from prompt-hacking to intelligent system design (Few-Shot Libraries, Voice Synthesis).

---

## 2. System Architecture & Current State

### A. Core Components
1.  **`surgicalEditor.ts`**: The generation engine.
    *   *Current Logic:* Uses `SURGICAL_EDITOR_SYSTEM_PROMPT` + `Dynamic Few-Shot Examples`.
    *   *Key Features:* Word Count Neutrality, 2+1 Strategy.
2.  **`surgicalOrchestrator.ts`**: The workflow manager.
    *   *Current Logic:* Holistic -> Rubric -> Locator -> Prioritization -> Editor (Batched).
    *   *Key Features:* High volume handling, diversity.
3.  **`locatorAnalyzers.ts`**: The bridge.
    *   *Current Logic:* Simple `indexOf` mapping.
    *   *Weakness:* Brittle matching.

### B. The "Dynamic Few-Shot" Strategy
We now inject specific "Gold Standard" examples based on the rubric category. This was a game-changer in Phase 9.
*   *Goal:* Expand this library to cover higher-order narrative concepts (e.g., "Pacing," "Voice modulation," "Subtext").

---

## 3. The Problems to Solve (Phase 10 Objectives)

### Objective A: Deepen Qualitative Writing (The "Soul" Upgrade)
*   **Problem:** Suggestions can still feel "AI-polished"—competent but lacking the raw, messy authenticity of a great writer.
*   **Solution:**
    *   **Expand `surgicalExamples.ts`:** Add sophisticated examples for nuanced categories like "Subtext," "Rhythm," and "Voice texture."
    *   **Voice-Specific Few-Shotting:** Instead of just passing the detected voice *description*, pass examples *matching that voice type* (e.g., if Voice is "Poetic," inject poetic examples; if "Punchy," inject punchy ones).
    *   **Anti-Imitation Protocol:** Explicitly instruct the model that Gold Standard examples are for **quality calibration only**.
        *   *Constraint:* "Do NOT copy the content, imagery, or specific metaphors from the examples. Use them only to understand the *level* of specificity and *type* of transformation required. Your output must be 100% original to the student's specific context."
        *   *Goal:* Inspire fresh, unique concepts that fit the user's narrative, avoiding any risk of plagiarism or repetitive "AI-isms" derived from the examples.

### Objective B: Systemic Precision (The "Mechanics" Fix)
*   **Problem 1: Context Leaking:** Suggestions rewrite surrounding text, causing redundancy.
    *   *Fix:* Boundary Enforcement (Input Masking).
*   **Problem 2: Generic Rationales:** "Why it matters" explains the *category* not the *fix*.
    *   *Fix:* Rationale Contextualization (Force citation of specific changes).
*   **Problem 3: Locator Precision:** Wrong sentence targeting.
    *   *Fix:* Fuzzy Locator Service.

---

## 4. Implementation Roadmap

### Step 1: Boundary Enforcement (The "Anti-Leak" Protocol)
*   **File:** `src/services/narrativeWorkshop/surgicalEditor.ts`
*   **Action:** Update prompt to rigorously define the "Edit Boundary" using delimiters: `[PRE-CONTEXT] ... [TARGET_START] Quote [TARGET_END] ... [POST-CONTEXT]`.

### Step 2: Qualitative Deepening (Voice-Aligned Few-Shot)
*   **File:** `src/services/narrativeWorkshop/surgicalExamples.ts` & `surgicalEditor.ts`
*   **Action:**
    1.  Tag existing examples with "Voice Types" (e.g., "Earnest," "Witty," "Poetic").
    2.  Update `getExamplesForCategory` to accept a `voiceType` parameter.
    3.  In `surgicalEditor`, pass the detected `voiceFingerprint.tone` to fetch voice-aligned examples.
    *   *Benefit:* The AI sees examples that match the *user's style*, not just the *problem type*.

### Step 3: Rationale Contextualization
*   **File:** `src/services/narrativeWorkshop/surgicalEditor.ts`
*   **Action:** Enforce "Cite your work" in rationales. "This anchors [abstract concept X] to [specific object Y]."

### Step 4: Fuzzy Locator Service
*   **File:** `src/services/narrativeWorkshop/analyzers/locatorAnalyzers.ts`
*   **Action:** Implement `findBestMatch(text, quote)` to robustly locate inexact quotes.

### Step 5: Library Expansion (Narrative Depth)
*   **File:** `src/services/narrativeWorkshop/surgicalExamples.ts`
*   **Action:** Add 10+ new "Gold Standard" examples focusing on:
    *   **Subtext:** Saying something by not saying it.
    *   **Pacing:** Using sentence length to control speed.
    *   **Texture:** Using "ugly" or "raw" details for authenticity.

---

## 5. Future Considerations (Phase 11+)
*   **User Intent Feedback:** Allow users to say "I didn't mean that."
*   **Style Mimicry 2.0:** Mathematical analysis of sentence rhythm.

---

## 6. Instructions for Next Session
"Open `docs/PHASE_10_NARRATIVE_ENGINE_DEEPENING.md`. Start with **Step 1: Boundary Enforcement** to stabilize the output. Then, immediately move to **Step 2: Qualitative Deepening** to implement the Voice-Aligned Few-Shot system."

