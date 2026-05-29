# Phase 8: Comprehensive Handoff & Design Specification

**Status:** Backend Analysis Complete. Optimization & UI Pending.
**Date:** 2025-11-21
**Purpose:** This document serves as the **single source of truth** for the next engineering session. It outlines the current system state, the corrected design requirements for generation, and the plan for the Frontend UI.

---

## 1. Current System State (Backend)

We have successfully built the core backend pipeline (`src/services/narrativeWorkshop/surgicalOrchestrator.ts`), which performs:
1.  **Holistic Analysis:** Understands the essay's theme and narrative arc.
2.  **Voice Fingerprinting:** Captures the student's unique tone (e.g., "Intellectually curious," "Rhetorical questions").
3.  **Rubric Scoring (13-Dim):** accurately scores the essay (e.g., ~48/100 for the test essay).
4.  **Locator Bridge:** Identifies specific quotes that trigger rubric issues.
5.  **Surgical Editor:** Generates 3 options for each issue.

**Current Codebase Status:**
*   The `surgicalEditor.ts` was recently updated to enforce "Mandatory Narrative Strategies" (Randomized Diversity).
*   **CRITICAL ISSUE:** This randomization forced the model to abandon good ideas present in the original text (e.g., the "3 economists walk into a bar" hook was lost because the model was forced to use "Sensory Anchor").

---

## 2. The "Hybrid Generation" Strategy (New Requirement)

We must **revert** the pure randomization approach. The goal is to **polish** the student's ideas, not replace them entirely.

### The Rule of 2+1
For every "Surgical Fix," the system must generate 3 options following this strict pattern:

1.  **Option 1: The Polished Original (Faithful)**
    *   **Goal:** Keep the student's exact concept, imagery, and intent. Fix *only* the specific rubric issue (e.g., clarity, word economy, punchiness).
    *   *Example:* If they mention "Schumpeter, Knight, and Kirzner," KEEP THEM. Just make the sentence flow better or hook sharper.
    *   *Prompt Instruction:* "Refine the existing concept. Do not change the core imagery or references. Optimize for impact and flow."

2.  **Option 2: The Voice Amplifier (Faithful + Stylized)**
    *   **Goal:** Lean hard into the student's `VoiceFingerprint`. If they are "witty and academic," make it *more* witty and academic.
    *   *Example:* "Three economists walk into a theory..." (Playful academic).
    *   *Prompt Instruction:* "Amplify the student's unique voice markers. Make it sound MORE like them."

3.  **Option 3: The Divergent Path (Creative/Wildcard)**
    *   **Goal:** Offer a completely different narrative approach (The "Narrative Strategy" injection).
    *   *Example:* Drop the economists. Start with the "Sensory Anchor" of the club meeting.
    *   *Prompt Instruction:* "Try a distinct narrative strategy (e.g., In Media Res) to solve the problem from a new angle."

### Implementation Plan for Next Chat
*   **Task:** Modify `surgicalEditor.ts` to use this `2+1` prompting structure instead of 3 random strategies.
*   **Result:** Users get safe, helpful improvements to their *actual ideas* (Options 1 & 2) but also see a creative alternative (Option 3) if they want to pivot.

---

## 3. Anti-Plagiarism & Originality Design

To prevent users from getting the same suggestions:

1.  **Contextual Anchoring:**
    *   Because Options 1 & 2 are anchored to the *student's original text*, they will naturally be unique to that student. (User A's "Polished Original" will differ from User B's because their inputs differ).
    *   This solves the majority of the "repetition" risk naturally.

2.  **Divergent Randomization (Option 3 Only):**
    *   Only Option 3 will use the randomized `NarrativeStrategy` pool.
    *   This ensures the "creative alternative" rotates and doesn't get stale.

3.  **The "AI-ism" Filter (Implemented):**
    *   Continue to enforce the ban list: `['tapestry', 'realm', 'unwavering', 'delve']`.

---

## 4. Frontend Design (Accordion UI)

Once the backend generation logic is fixed, we will build the UI.

### Component Structure
*   **Path:** `src/components/workshop/WorkshopAccordion.tsx`
*   **Data Source:** `POST /api/workshop/analyze`

### Visual Hierarchy
1.  **Accordion Row:**
    *   **Badge:** [Critical] (Red)
    *   **Title:** "Opening Hook"
    *   **Quote:** "In Classic Views on Entrepreneurship..."
2.  **Expanded Content:**
    *   **The Issue:** "This opening is too abstract. It cites sources instead of setting a scene." (Rubric Feedback).
    *   **The "Why":** "Admissions officers need to see *you* in the story, not just your reading list."
3.  **Suggestion Cards (Horizontal Scroll):**
    *   **Card 1 (Polished):** "Refines your specific Schumpeter reference."
    *   **Card 2 (Voice):** "Playful take on your economist theory."
    *   **Card 3 (Divergent):** "New approach: Starts with the club meeting."

---

## 5. Roadmap for Next Engineer

### Step 1: Fix the Generation Logic (Backend)
1.  Open `src/services/narrativeWorkshop/surgicalEditor.ts`.
2.  **Remove** the logic that forces 3 random strategies.
3.  **Implement** the `2+1` logic (Polished, Voice, Divergent).
4.  **Verify** by running the test on the Leadership essay. Ensure the "3 economists" hook (or similar faithful version) reappears in Options 1 or 2.

### Step 2: Build the UI (Frontend)
1.  Create `WorkshopAccordion` using Shadcn.
2.  Mock it first using `PHASE_8_TEST_OUTPUT.json`.
3.  Connect to the real API.

### Step 3: Final Polish
1.  Verify "Word Economy" (rationales shouldn't be essays).
2.  Verify "Show Don't Tell" (rationales shouldn't use "I realized").


