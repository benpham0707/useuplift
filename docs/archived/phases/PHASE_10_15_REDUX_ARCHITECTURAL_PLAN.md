# Phase 10-15 Redux: Multilayered Narrative Engine Architecture

**Date:** 2025-11-23
**Status:** In Progress (Phases 10-13 Complete, 14-15 Pending)
**Focus:** Architectural Decomposition & Qualitative Depth

---

## 1. The Core Philosophy: "System of Systems" (Context Over Prompts)
We identified a critical failure mode: **Prompt Overloading**. Trying to make a single "God Prompt" handle voice analysis, diagnosis, and creativity results in regression to the mean.

**The Solution:** A **Multilayered "System of Systems"**.
Instead of just engineering a better prompt string, we engineer a **Rich Context Pipeline**. Each layer produces a high-fidelity data artifact (a "Context Document") that serves as the *ground truth* for the next layer. The final generation is not "prompted" to be good; it is *informed* by a comprehensive dossier of analysis that makes quality inevitable.

---

## 2. Architectural Layers (The "Redux" Pipeline)

### Layer 1: Diagnosis (The "Doctor")
*   **Component:** `SymptomDiagnoser` (Phase 10-Redux)
*   **Output:** `SymptomDiagnosis` Object
*   **Logic:** Identifies the *exact* narrative weakness (e.g., "Passive Agency", "Abstract Noun Usage") before any fixing begins.
*   **Mechanism:** Dedicated LLM call.

### Layer 2: Contextualization (The "Librarian")
*   **Component:** `ContextAwareExampleInjector` (Phase 11-Redux)
*   **Output:** `TargetedExamples` Collection
*   **Logic:** Filters "Gold Standard" examples to match **BOTH** the Symptom AND the Student's Voice.
*   **Mechanism:** Deterministic selection logic.

### Layer 3: Identity (The "Stylist")
*   **Component:** `DynamicVoiceSampler` (Phase 13-Redux)
*   **Output:** `VoiceContext` (Fingerprint + Audio Samples)
*   **Logic:** Extracts actual sentence samples to use as "Style References" for few-shot transfer, preventing robotic mimicry.

### Layer 4: Assembly (The "Context Engine") - *Refined Phase 12*
*   **Component:** `SurgicalContextAssembler` (formerly PromptConstructor)
*   **Output:** **`SurgicalContextDocument`**
*   **Logic:** This layer does NOT just build a prompt string. It synthesizes all previous layers into a **Highly Specialized Context Document**.
*   **Content:**
    *   **Clinical Chart:** The specific diagnosis and prescription.
    *   **Style Guide:** The voice fingerprint + real samples.
    *   **Reference Library:** The exact examples needed.
    *   **Strategic Directive:** The specific divergent strategy to apply.
*   **Benefit:** The final LLM receives a "Case File" that gives it deep understanding, not just instructions.

### Layer 5: Rationale (The "Teacher") - *Pending Phase 14*
*   **Component:** `IndependentRationaleGenerator`
*   **Logic:** Rationale must be generated as a *teaching moment*, derived from narrative principles, not just a summary of the edit.
*   **Mechanism:** Chain-of-Thought generation where the "Why" is formulated *before* the "How" is finalized.

### Layer 6: Validation (The "Critic") - *Pending Phase 15*
*   **Component:** `OutputValidationLayer`
*   **Logic:** A post-processing filter that catches specific "bland" patterns (e.g., "training my brain", generic determination).
*   **Mechanism:** Regex + LLM Check. If failed, triggers a "High-Stakes Rewrite" with stricter constraints.

---

## 3. Implementation Status

| Phase | Component | Status | Notes |
| :--- | :--- | :--- | :--- |
| **10-Redux** | Symptom Diagnoser | ✅ Complete | Diagnostic layer active. |
| **11-Redux** | Example Injection | ✅ Complete | Context-aware selection active. |
| **12-Redux** | Context Assembler | 🔄 In Progress | Refactoring from "Prompt Constructor" to "Context Document Generator". |
| **13-Redux** | Voice Sampling | ✅ Complete | Style samples active. |
| **14-Redux** | Rationale Generator | ⏳ Pending | Next priority. |
| **15-Redux** | Validation Layer | ⏳ Pending | Next priority. |

---

## 4. Execution Plan

We will proceed by refactoring Layer 4 to generate the **Context Document** and then implementing Layers 5 & 6.

**Step 1: Refactor Layer 4 (Context Assembler)**
- Rename `promptConstructor.ts` to `contextAssembler.ts`.
- Output a structured markdown "Case File" instead of a raw prompt string.
- Ensure this document is rich, educational, and highly specific.

**Step 2: Implement Layer 5 (Rationale Generator)**
- Update the system to generate the "Teacher's Explanation" as a primary artifact.

**Step 3: Implement Layer 6 (Validation)**
- Build the "Blandness Filter" to catch generic outputs.
- Implement the retry loop.
