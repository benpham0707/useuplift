# Phase 11: Unique Rationale & Distinction
**Objective:** Ensure every suggestion has a unique, specific "Why it matters" explanation derived from the *specific locator context*, preventing generic repetition across multiple insights within the same rubric category.

## The Problem
Currently, the system maps locators to Rubric Dimensions. If multiple locators fall under the same dimension (e.g., `show_dont_tell_craft`), they often inherit the generic rubric justification for that dimension, leading to repetitive "Why it matters" text.

## The Fix Strategy
1.  **Update `DetectedLocator` Interface:** Ensure `whyItMatters` is dynamically generated or contextualized *per instance*, not just per category.
2.  **Contextualize `whyItMatters` in `locatorAnalyzers.ts`:** When creating locators, instead of copying the generic `dim.evidence.justification`, we need to try to extract a more specific reason if available, or force the LLM to generate a specific reason during the analysis phase.
    *   *Correction:* The Rubric Scorer returns a single justification for the *whole* dimension. We need to break this down.
    *   *Approach:* In `surgicalEditor.ts`, we can use the LLM to *refine* the `whyItMatters` specifically for the quote being fixed, rather than relying solely on the upstream rubric justification.
3.  **Implementation:**
    *   Modify `buildSurgicalEditorPrompt` to ask the model to *evaluate the specific quote's weakness* as part of its chain-of-thought before generating suggestions, and use THAT specific weakness as the context for generating distinct rationales.
    *   Actually, the user says: "All the different analysis have the same 'why it matters' ... The system is categorizing all of them under the same rubric dimension and not properly distinctuallizing each one."
    *   **Solution:** We need to generate a *specific problem statement* for each locator. Since the Rubric Scorer gives us a list of quotes but only one justification, we need an intermediate step or an on-the-fly improvement in the Surgical Editor prompt to *re-diagnose* the specific quote.

## Steps
1.  **Modify `surgicalEditor.ts` Prompt:**
    *   Add an instruction: "First, analyze the specific quote provided. Identify EXACTLY why this specific snippet is weak (e.g., 'Generic verb usage', 'Lack of sensory detail', 'Abstract concept without anchor'). Do NOT just repeat the Rubric Category name."
    *   We won't output this analysis to the user directly in the JSON yet, but we will use it to frame the generation.
    *   Wait, the user complains about the "Why it matters" field in the output JSON. That comes from `issue.whyItMatters`.
    *   **Crucial Fix:** We need to *regenerate* or *refine* `whyItMatters` inside `generateSurgicalFixes`. The upstream `locatorAnalyzers.ts` just passes the generic one.
    *   We will add a new field to the LLM output: `specific_diagnosis`. We will use this to overwrite or append to the `problem` or `why_it_matters` field in the final `WorkshopItem`.

2.  **Test Plan:**
    *   Run a targeted test on a paragraph with multiple `show_dont_tell` issues.
    *   Verify that each insight has a *distinct* diagnosis.

## Action Items
- [ ] Update `SURGICAL_EDITOR_SYSTEM_PROMPT` to generate a `specific_diagnosis` for the quote.
- [ ] Update `generateSurgicalFixes` to use this new diagnosis to replace/enrich the generic `issue.problem` or `issue.whyItMatters`.
- [ ] Verify with a focused test.


