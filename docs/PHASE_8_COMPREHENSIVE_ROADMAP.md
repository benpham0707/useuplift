# Phase 8: The Surgical Editor & Narrative Workshop
## Comprehensive Design & Implementation Roadmap

**Date:** 2025-11-21
**Status:** Phase 8.1 & 8.2 Complete. Phase 8.3 (Backend Optimization) In Progress.
**Goal:** Transition from "Generative Rewriting" to "Surgical Coaching & Authentic Edits."

---

## 1. Strategic Context & Philosophy

### The Problem
1.  **Loss of Authorship:** Previous iterations rewrote entire paragraphs, removing the student's voice.
2.  **Generic output:** "Modes" (Journalist/Novelist) felt rigid and artificial.
3.  **Black Box:** Students received better text but didn't learn *why* it was better.
4.  **Disconnected Tools:** Analyzers detected issues, but the generator fixed them in isolation, ignoring the rubric.

### The Solution: "Insight-First" Architecture
We are building a **Narrative Workshop** powered by a **Surgical Editor**.
*   **Detection:** Analyzers pinpoint *specific quotes* that fail a rubric criterion.
*   **Education:** The UI explains *why* that quote is an issue (using the rubric).
*   **Solution:** The AI generates 2-3 *micro-edits* (sentence level) that fix the issue *without* changing the student's unique voice.
*   **Synergy:** Every edit is context-aware (Rubric + Voice + Theme).

---

## 2. User Experience (The Accordion UI)

The user interacts with a list of **Workshop Items** (Accordion Rows).

### The "Happy Path" Flow
1.  **Scan:** User sees a list of flagged issues (e.g., "Vague Achievement Claim" - Severity: High).
2.  **Expand:** User clicks the row. It expands to show:
    *   **The Quote:** "I worked hard to build the brand." (Highlighted in their essay).
    *   **The Analysis:** "This lacks selectivity metrics. Admissions officers need context to calibrate rigor."
    *   **The Strategy:** "Quantify the effort or describe the struggle."
3.  **Review Options:** User sees 3 generated options:
    *   *Option A (Metric Focus):* "I sent 500 cold emails..."
    *   *Option B (Sensory Focus):* "I slept on piles of unsold inventory..."
4.  **Apply:** User clicks "Apply Option A." The text updates instantly.
5.  **Chat (Optional):** User clicks "Discuss" to open the chat context for this specific item ("Can we make it sound less braggy?").

---

## 3. System Architecture & Data Flow

### A. The "Voice Fingerprint" (Identity Layer)
Before any generation happens, we must understand the student.
*   **Input:** Raw Essay Text.
*   **Process:** LLM analyzes tone, cadence, vocabulary complexity, and "authenticity markers" (slang, humor, quirks).
*   **Output:** `VoiceFingerprint` object.
*   **Usage:** Injected into *every* Surgical Editor prompt as a constraint.

### B. The Analyzer Synergy (Detection Layer)
Engine A (Analyzers) must be upgraded to return **Locators**.
*   **Old Way:** "Specificity Score: 6/10."
*   **New Way:**
    *   `issue`: "Vague Claim"
    *   `locator`: "I worked hard."
    *   `rubric_id`: "selectivity_metrics"
    *   `severity`: "high"

### C. The Surgical Editor (Generation Layer)
This is the new Engine B. It takes the `Locator` + `VoiceFingerprint` + `RubricGoal` and generates the fix.
*   **Prompt Logic:** "Fix [QUOTE] to satisfy [RUBRIC GOAL]. Keep the tone [VOICE FINGERPRINT]. Explain [RATIONALE]."

---

## 4. Technical Specifications (Data Structures)

### VoiceFingerprint
```typescript
interface VoiceFingerprint {
  tone: string; // "Earnest, self-deprecating"
  cadence: string; // "Short, punchy sentences"
  vocabulary: string; // "Simple, conversational"
  markers: string[]; // ["Uses dashes often", "Starts sentences with And"]
}
```

### WorkshopItem (The Accordion Contract)
```typescript
interface WorkshopItem {
  id: string;
  rubric_category: string; // "Selectivity"
  severity: 'critical' | 'warning' | 'optimization';
  quote: string; // "I worked hard"
  
  // Contextual Education
  problem: string; // "Lacks metrics."
  why_it_matters: string; // "Credibility signal."
  
  // The Fixes
  suggestions: Array<{
    text: string; // "I sent 500 emails."
    rationale: string; // "Adds quantification."
    type: 'metric' | 'sensory' | 'clarity';
  }>;
}
```

---

## 5. Implementation Roadmap

### Phase 8.1: The Foundation (Backend) - COMPLETE
1.  **Voice Fingerprint Service:** Built `VoiceFingerprintAnalyzer`.
2.  **Analyzer Locators:** Updated Analyzers to return specific quotes/indices via `DetectedLocator`.
3.  **Surgical Editor Service:** Built prompt engineering to generate `WorkshopItems`.

### Phase 8.2: The Orchestration (Middle Layer) - COMPLETE
1.  **Workshop Orchestrator:** Built `SurgicalOrchestrator` to tie it all together.
    *   Runs Voice Analysis.
    *   Scores with 13-dimension Rubric.
    *   Prioritizes top 5 issues.
    *   Generates surgical fixes.

### Phase 8.3: Backend Optimization & Originality (CURRENT)
*Goal: Ensure robustness, originality, and anti-plagiarism before UI build.*
1.  **Originality System:** Implement "Diversity Injection" (Random Narrative Strategies) to prevent repetitive output.
2.  **Anti-Plagiarism:** Implement checks to ensure unique metaphors and phrasings.
3.  **Design Docs:** Finalize API contracts and system design.

### Phase 8.4: The Frontend Integration (UI) - NEXT
1.  **Accordion Component:** Build the UI to render `WorkshopItem`.
2.  **API Integration:** Connect frontend to `src/app/api/workshop/analyze`.
3.  **Diff Viewer:** Visual component to show Original vs Suggested text.

---

## 6. Success Criteria
1.  **Authenticity:** The generated "fixes" are indistinguishable from the student's original style (verified by human check).
2.  **Precision:** The system identifies specific sentences, not general paragraphs.
3.  **Education:** The "Why" explanation is accurate to the Rubric.
4.  **Synergy:** The system correctly uses the "Voice Fingerprint" to constrain the "Surgical Editor."
5.  **Originality:** Repeated runs produce structurally diverse suggestions (no "mode collapse").
