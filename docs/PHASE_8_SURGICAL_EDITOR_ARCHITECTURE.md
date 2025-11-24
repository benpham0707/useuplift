# Phase 8: The Insight-First Workshop Architecture

**Status:** Revised Architecture (Accordion UI Focused)
**Goal:** Power the "Narrative Workshop" Accordion UI with deep analysis, specific quotes, and surgical fix options.

---

## 1. The "Workshop Item" Structure

The backend will no longer just return a "New Essay." It will return a list of `WorkshopItem` objects, each mapping to one "Accordion Row" in the UI.

```typescript
interface WorkshopItem {
  id: string;
  
  // 1. The "What" (Identification)
  rubric_category: string; // e.g., "Selectivity & Context"
  severity: 'critical' | 'warning' | 'optimization';
  quote: string; // The exact text from the essay: "Civic Tech Challenge Finalist"
  
  // 2. The "Why" (Education & Context)
  problem_analysis: string; // "Without context, officers can't calibrate the rigor."
  impact_explanation: string; // "Selectivity metrics establish credibility."
  
  // 3. The "How" (Suggested Fix & Rationale)
  fix_strategy: string; // "Add acceptance rates or applicant pool sizes."
  
  // 4. The "Fix" (Surgical Generation)
  suggested_edits: Array<{
    text: string; // "Civic Tech Challenge Finalist (Top 10 of 1200)"
    rationale: string; // "Inline parenthetical is the cleanest way..."
    diff_highlight: string; // HTML/Markdown showing what changed
  }>;
}
```

---

## 2. The Holistic Synergy (Analyzer Integration)

Engine A (The Analyzers) acts as the "Detection Layer." It feeds the entire downstream process. We do not just generate generic feedback; we map specific analyzer findings to surgical edits.

### Data Flow: From Detection to Solution

**Step 1: Detection (The Analyzers)**
The `EssayOrchestrator` runs the full suite. Crucially, we update the analyzers to return **Locators** (specific quotes/indices), not just scores.

*   **Specificity Analyzer:** Instead of just `score: 6`, it returns:
    *   `issue`: "Vague Achievement Claim"
    *   `locator`: "I worked hard to build the brand."
    *   `context`: "Tier 1 Telling statement."
*   **Voice Analyzer:**
    *   `issue`: "Passive Voice"
    *   `locator`: "Mistakes were made by me."
*   **Narrative Arc Analyzer:**
    *   `issue`: "Summary Climax"
    *   `locator`: "I realized I was wrong."

**Step 2: Context Injection (The "Brain")**
Before generating a fix, we pull **Holistic Context** to ensure the fix is strategic.
*   **Voice Fingerprint:** (From `VoiceAnalyzer`) "Ensure the fix sounds humble and earnest."
*   **Topic/Theme:** (From `ThematicAnalyzer`) "Ensure the fix relates to the 'Mirror' motif."
*   **Student Profile:** (From `HolisticAnalyzer`) "Ensure the fix aligns with their 'Leadership' spike."

**Step 3: Surgical Execution (The "Hands")**
The `SurgicalEditor` receives this rich packet:
> "Fix the sentence 'I worked hard' (Locator). Make it specific (Goal). Keep it humble (Voice). Connect it to the Mirror motif (Theme)."

---

## 3. The Components (Backend)

### A. Voice Fingerprinting (The Identity Layer)
**Service:** `src/services/analysis/voiceFingerprint.ts`
- **Goal:** Ensure suggested edits sound like *the student*, not a generic AI.
- **Output:** `VoiceProfile` (Tone, cadence, complexity).
- **Usage:** Injected into the `SurgicalEditor` to constrain generation.

### B. The Surgical Editor (The Generation Layer)
**Service:** `src/services/generation/surgicalEditor.ts`
- **Goal:** Generate the `suggested_edits` array for a specific `quote`.
- **Prompt Logic:**
  - "Here is the quote."
  - "Here is the identified flaw."
  - "Here is the student's voice fingerprint."
  - **Task:** "Generate 2-3 micro-edits that fix the flaw while maintaining the voice. Explain WHY each edit works."

### C. The Workshop Orchestrator (The Controller)
**Service:** `src/services/orchestrator/workshopOrchestrator.ts`
- **Goal:** Run the diagnostics, identify the top 3-5 "Accordion Items", and call the Surgical Editor for each one.
- **Output:** The final JSON used by the frontend to render the workshop.

---

## 4. Implementation Roadmap

1.  **Voice Fingerprint:** Build the analyzer to capture the student's style.
2.  **Surgical Editor:** Build the generator that takes a specific quote + flaw and outputs the `WorkshopItem` structure.
3.  **Integration:** Connect Engine A (Diagnostics) to this new system so that a low "Specificity" score automatically triggers a "Surgical Edit" generation for the vague sentence.

---
**Note:** The "Chat Interface" will be built *on top* of this data structure later. When the user clicks "Apply" or wants to discuss a specific Accordion Item, the Chat System will load that item's context.
