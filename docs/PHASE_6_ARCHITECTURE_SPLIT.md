# Phase 6: The Great Split (Analysis vs. Generation)

**Context:**
We have successfully built and validated the **Analysis Engine** (Phase 5). It reliably identifies tiers, scores, and specific issues ("Blind Spots", "Initiative Gaps"). However, when we ask the *Analyzer* to also provide *Examples* or *Rewrites*, the quality suffers. The examples feel "robotic," "passive," and lack true literary craft (Tier 5).

**The Strategic Shift:**
To achieve "God Mode" results, we must **decouple** Analysis from Generation. We will treat them as two distinct, high-powered engines rather than one multitasking engine.

---

## 1. The New Architecture

### Engine A: The Diagnostic (Analysis)
*   **Goal:** Pure rigorous evaluation. Truth-seeking.
*   **Mindset:** The "Senior Admissions Officer" who spots every flaw but doesn't necessarily write the fix for you.
*   **Output:** Data, Scores, Tiers, *Abstract* Strategic Directions (e.g., "You need to show a scene of negotiation here," not writing the scene itself).
*   **Efficiency:** Prompts focused purely on reasoning and validation. Less compute spent on generating prose.

### Engine B: The Alchemist (Narrative Generation)
*   **Goal:** Pure creative synthesis. Storytelling.
*   **Mindset:** The "World-Class Ghostwriter" or "Writing Coach" who takes the strategy and breathes life into it.
*   **Input:**
    1.  Original Essay (The raw material).
    2.  Diagnostic Output (The blueprint: "Focus on Archetype X," "Fix Blind Spot Y").
*   **Output:**
    *   "Golden Version" paragraphs.
    *   "Show, Don't Tell" rewrites of specific weak points.
    *   Alternative Opening Hooks based on the identified Archetype.

---

## 2. Technical Roadmap (Next Session)

### Step 1: Refactor Analyzers (Strip Generation)
*   **Task:** Modify `*_llm.ts` prompts (Voice, Initiative, Role, etc.).
*   **Action:** Remove `writer_prompts` and `evidence_rewrite` requests from the *Analysis* prompts.
*   **Focus:** Instead of asking "Rewrite this sentence," ask "Identify the specific *narrative beat* that is missing." (e.g., "Missing the moment of decision").

### Step 2: Build the Narrative Generator Service
*   **New Service:** `src/services/generation/narrativeGenerator.ts`
*   **Input Interface:**
    ```typescript
    interface GenerationRequest {
      originalText: string;
      analysisContext: EssayAnalysisResult; // The full diagnostic report
      focusArea: 'hook' | 'pivot_moment' | 'reflection' | 'full_rewrite';
      targetArchetype?: string; // From Holistic Analysis
    }
    ```
*   **Prompt Strategy:**
    *   Inject the *Voice Style* analysis to emulate (or elevate) the student's natural voice.
    *   Inject the *Blind Spots* to explicitly avoid them in the generation.
    *   Use "Few-Shot Prompting" with the *Golden Dataset* (Elite examples) to teach the model what Tier 5 writing actually looks like.

### Step 3: The "Reference Example" Workflow
*   **User Experience:**
    1.  User submits essay.
    2.  **System:** Runs Analysis (Engine A) -> Returns "Overview & Insights".
    3.  **User:** Clicks "See how to fix this" on a specific card (e.g., "Weak Initiative").
    4.  **System:** Runs Generation (Engine B) -> Generates a specific, high-quality example *based on their own story* but elevated to the next tier.

---

## 3. Design Principles for Generation

1.  **Separation of Concerns:** The Analyzer judges. The Generator creates.
2.  **Context-Aware:** The Generator *must* know the Analyzer's verdict. It's not just "improving grammar"; it's "fixing the Initiative Gap identified in Section 3."
3.  **Style Transfer:** The Generator should respect the valid parts of the student's voice (as identified by `VoiceStyleAnalyzer`) while pruning the "robotic" elements.

## 4. Immediate Next Steps

1.  **Create `src/services/generation/` directory.**
2.  **Design `NarrativeGenerator` class.**
3.  **Refine Analyzer prompts** to stop generating low-quality "Quick Wins" and instead output high-quality "Strategic Directives."

