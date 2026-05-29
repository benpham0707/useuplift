# Phase 7: Narrative Refinement & Integration Architecture

**Current Status:** 
Engine B (`NarrativeGenerator`) produces high-quality scenes ("Hook", "Pivot") with strong sensory details (Tier 5).

**User Feedback:**
*   **Prioritize Quality:** "Auto-pick" is secondary. The core value is deep, nuanced guidance and writing quality.
*   **Cohesion Matters:** We must ensure details connect (themes/motifs) and the essay isn't just disjointed scenes.
*   **Originality is Key:** Avoid repetitive tropes (e.g., "The leader admitting they don't know"). Ensure variety in sentence structure and thematic approach to prevent plagiarism flags.

---

## 1. Narrative Cohesion (The "Stitcher") - **PRIORITY 1**

**The Problem:** Generating isolated "Lego blocks" risks fragmentation. A "baking" hook needs to connect to a "baking" reflection.

**The Solution:** `GlobalNarrativeContext`
Every generation request must be aware of the *whole* essay's thematic DNA.

### Revised `GenerationRequest` Interface
```typescript
interface GenerationRequest {
  focusArea: 'hook' | 'pivot' | ...;
  
  // NEW: Global Context to ensure cohesion
  globalContext?: {
    currentTheme?: string; // e.g., "Organized Chaos"
    recurringMotifs?: string[]; // e.g., ["The smell of burnt sugar", "Fluorescent lights"]
    endingInsight?: string; // Ensure the hook sets up this ending
  };
}
```

**Workflow:**
1.  **Extraction:** Before generating, identify the "Spine" (or let the user pick a Motif).
2.  **Injection:** Pass this motif to the generator.
3.  **Constraint:** "Your new scene MUST include a subtle reference to [Motif X]."

---

## 2. Radical Originality (The "Style Engine") - **PRIORITY 2**

**The Problem:** The model converges on "Safe Tier 5" writing (vulnerability tropes).

**The Solution:** `StyleVariant` Parameter.
We will randomly or strategically assign a "Narrative Mode" to force variety.

### Narrative Modes (The "DNA" of the Scene)
1.  **The Journalist (Hemingway-esque):**
    *   *Focus:* Facts, short sentences, high impact.
    *   *Prompt:* "Write like a reporter. Minimal adjectives. Focus on the action."
2.  **The Philosopher (Internal):**
    *   *Focus:* Mental shifts, connections, metaphor.
    *   *Prompt:* "Focus on the internal monologue. Connect the external event to an internal belief."
3.  **The Cinematographer (Visual):**
    *   *Focus:* Light, motion, texture, angles.
    *   *Prompt:* "Describe the scene as if through a camera lens. Focus on lighting and blocking."
4.  **The Novelist (Character):**
    *   *Focus:* Dialogue, interaction, facial expressions.
    *   *Prompt:* "Focus on the tension between characters. Use dialogue to reveal subtext."

**Implementation:**
Update `NarrativeGenerator` to accept `styleVariant` and inject specific prompt instructions.

---

## 3. The "Auto-Focus" Helper (Secondary)

**Goal:** A helper tool, not the main driver. It suggests valid entry points for the workshop.

### Logic Map (Draft)
*   **Input:** `EssayAnalysisResult`
*   **Output:** `RecommendedFocus[]`

| Diagnostic Signal | Condition | Recommended Focus Area | Directive Strategy |
| :--- | :--- | :--- | :--- |
| `opening_hook.score` | `< 7.0` | `hook` | "Replace generic opening with 'In Medias Res' scene." |
| `narrative_arc.climax_quality` | `weak` / `summary` | `pivot_moment` | "Convert summary of success into a specific scene of struggle." |
| `primary_dimensions.score` | `< 6.0` | `growth_development` | "Connect the initial interest to current expertise (The Montage)." |
| `voice.score` | `< 5.0` | `full_rewrite` (Segment) | "Elevate voice to Tier 5 using Sensory Details." |

---

## 4. Immediate Next Steps for Engineer

1.  **Update `NarrativeGenerator`**: 
    *   Add `globalContext` (Motifs/Themes) to the prompt builder.
    *   Add `styleVariant` (Journalist/Philosopher/etc.) to the prompt builder.
2.  **Refine Prompts**: Ensure `styleVariant` actually changes the sentence structure, not just the content.
3.  **Test Originality**: Run batch tests to ensure the same input produces *different* outputs based on the Style Variant.
4.  **Build "The Stitcher"**: (Future) Logic to weave these parts together.
