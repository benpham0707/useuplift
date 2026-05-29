# Phase 7: UI Requirements & Implementation Guide

**Status:** Living Document
**Goal:** Bridge the gap between Backend Logic (Engine B) and the Frontend User Experience.

## 1. The "Workshop" Interface (Narrative Refinement)

The Workshop is where the user "fixes" specific parts of their essay. It is no longer a simple "Regenerate" button. It is a cockpit for creativity.

### A. The "Mode Selector" (Style Engine)
**Backend Capability:** `styleVariant` ('journalist', 'philosopher', 'cinematographer', 'novelist')
**UI Need:**
- **Component:** A segmented control or dropdown menu labeled "Narrative Lens".
- **Options:**
  - 🖊️ **Standard** (Balanced, "The Alchemist" Default)
  - 📰 **The Journalist** (Facts, Action, Short Sentences - *Good for "Action" essays*)
  - 🧠 **The Philosopher** (Internal, Metaphorical - *Good for "Reflection" essays*)
  - 🎥 **The Cinematographer** (Visual, Sensory - *Good for "Hooks"*)
  - 🎭 **The Novelist** (Dialogue, Tension - *Good for "Pivot Moments"*)
- **UX Hint:** Show a small tooltip explaining *why* to use each. "Use Journalist to make your action scenes punchier."

### B. The "Idea Injection" Input (Freshness Engine)
**Backend Capability:** `contentPivot` / `newInsight` (New implementation)
**UI Need:**
- **Problem:** Sometimes the writing is fine, but the *idea* is boring ("I worked hard").
- **Solution:** An optional input field: *"What specific moment or realization should this focus on?"*
- **Interaction:**
  - **"Surprise Me" Button:** Uses `HolisticAnalyzer` candidates (Spine/Spike) to suggest a new angle.
  - **Text Input:** User types: "Actually, focus on the moment I dropped the tray."
- **Logic:** If this field is populated, pass it to `NarrativeGenerator` as the `specificDirective`.

### C. The "Stitcher" Visualization (Cohesion)
**Backend Capability:** `globalContext.recurringMotifs`
**UI Need:**
- **Display:** A "Narrative DNA" sidebar or header.
- **Elements:**
  - **Core Theme:** Display the extracted theme (e.g., "Organized Chaos").
  - **Motif Chips:** Display extracted motifs (e.g., "Burnt Sugar", "Ticking Clock").
- **Action:** User can *click* a motif to "Force Include" it in the next generation.
  - *Backend:* Adds the clicked motif to `globalContext.recurringMotifs` in the request.

### D. The "Focus" Dashboard (Auto-Focus)
**Backend Capability:** `FocusRecommender`
**UI Need:**
- **Display:** Instead of a generic list of errors, show "Recommended Moves".
- **Cards:**
  - **🚨 Critical:** "Fix the Hook" (Score < 7). *Action: Open Hook Generator.*
  - **⚠️ Improvement:** "Deepen the Reflection" (Weak Insight). *Action: Open Reflection Editor.*
  - **✨ Polish:** "Enhance Voice" (Passive). *Action: Apply 'Journalist' Mode.*

---

## 2. Missing / Future UI Opportunities

Based on the "Fresh Ideas" requirement, we are currently missing:

1.  **"The Ideation Sandbox":**
    - Before writing a full scene, we might need a "Brainstorming" step.
    - **UI:** A chat-like interface where the user says "I want to write about baking," and the system returns 3 *angles* (The Scientist Baker, The Community Baker, The Perfectionist).
    - *Status:* Needs a new `BrainstormingGenerator` service if we go this deep.

2.  **"Diff View" for Styles:**
    - When generating 3 options (Journalist vs Philosopher), don't just stack them.
    - **UI:** Show them side-by-side or with highlighted differences to teach the user *how* the style changed the text.

3.  **"Blind Spot" Warning:**
    - If a user types a cliché in the "Idea Injection" box (e.g., "I want to say I'm a hard worker"), the UI should warn them *before* generating.
    - **UI:** Real-time feedback: "⚠️ 'Hard work' is a common theme. Can you be more specific? e.g., 'Obsessive attention to detail'?"

