# The Forge: Implementation Blueprint Engine

## Target
$ARGUMENTS

---

## OVERVIEW

You are orchestrating an autonomous multi-agent pipeline that produces **implementation blueprints** — documents with enough concrete detail to start coding immediately. Not architecture diagrams. Not abstract plans. Actual type definitions, actual algorithms, actual integration code, and precise LLM call specifications.

The key question this pipeline answers is **"HOW do I build this?"** — not "WHAT should I build?"

The pipeline deeply researches the codebase, diagnoses quality/capability gaps with concrete evidence and before/after examples, designs two competing implementations with full detail, then reality-checks and synthesizes the best elements into a final blueprint.

**Run the full pipeline autonomously. Present the final blueprint when done.**

---

## IMPLEMENTATION DEPTH STANDARD (paste into every agent prompt)

> **Your output must pass the "start coding" test**: Could an engineer read any section and begin implementing WITHOUT asking "but how exactly?"
>
> **REJECT these in your output:**
> - Prompt hand-waving: "write a prompt that teaches X" without specifying what the prompt receives, what it must accomplish, what constraints it operates under, and what output format it produces
> - Type stubs: "add a type for X" → Instead, write the actual TypeScript interface with field-level comments
> - Abstract algorithms: "implement validation that checks X" → Instead, write the validation logic in pseudocode or TypeScript
> - Vague integration: "connect to the existing pipeline" → Instead, show the actual function call with real parameters from the real codebase
> - Architecture astronautics: "add a service layer" → Instead, show the service's core method with its actual logic
> - Infrastructure items: error handling, logging, monitoring, config, feature flags, type safety improvements, refactoring for cleanliness — do these during coding, never list them as blueprint items
>
> **REQUIRE these in your output:**
> - For every LLM call: model selection with rationale, caching strategy, cost estimate, prompt SPEC (what data goes in, what the prompt must accomplish, key constraints/instructions it needs, expected output format with example) — but NOT full prompt prose. Prompt writing is implementation work that requires iterative testing against real LLM output.
> - For every type change: actual TypeScript interface with comments explaining why each field exists
> - For every algorithm or decision logic: pseudocode or real TypeScript showing the branching/transformation logic
> - For every integration point: real function name, real file path, real parameter types from the actual codebase
> - For every quality improvement: concrete before/after examples showing what the output looks like today vs after implementation
> - For every cost claim: grounded in actual model pricing and realistic token estimates
>
> **Litmus test**: Read your output back. Everywhere you wrote "should" or "would" — did you also show HOW? If not, add the implementation detail. Exception: prompt prose — specify the spec, not the words.

---

## STEP 0: DEEP RESEARCH (you, the orchestrator)

Before spawning any agent, YOU deeply research the codebase. This is the FOUNDATION — quality here determines quality everywhere downstream.

**This is NOT a 200-word brief. It's a thorough investigation.**

1. **Read the target area thoroughly**: Not file names — actual code. Trace the data flow from input to output. Read function signatures, types, and how data transforms at each stage. Follow imports. Understand what each layer/service does and WHY.

2. **Map existing infrastructure**: What services, utilities, LLM call patterns, and architectural patterns already exist? What's been built that could be reused or composed? Pay special attention to:
   - Existing LLM call mechanisms (models, caching, prompt patterns)
   - Existing data structures and type hierarchies
   - Existing quality controls, validation, or filtering logic
   - Patterns from other parts of the codebase that solve similar problems

3. **Understand the cost model**: How much do current LLM calls cost? What caching is in place? What models are used where and why? What's the per-operation cost ceiling?

4. **Read relevant docs/plans**: Check PLAN.md, CLAUDE.md memory, docs/ for architectural context, design decisions, and constraints.

5. **Identify the user's quality bar**: If the user provided examples, exemplars, before/after comparisons, or quality descriptions — these define what "good" looks like. Extract them explicitly.

6. **Run the code mentally**: For the target area, trace a representative input through the entire pipeline. Note what each stage produces, where quality degrades, and where information is lost.

Assemble a **Research Dossier** (~800-1500 words) containing:
- Task description (from user, verbatim)
- **Complete data flow**: Input → [Stage A: does X, produces Y] → [Stage B: receives Y, does Z] → ... → Output
- **File inventory**: Every relevant file with its key functions, their signatures, and what they do
- **Infrastructure inventory**: Existing services, LLM patterns, utilities that could be leveraged
- **Current output examples**: What the system actually produces now — real or realistic examples
- **Quality bar**: What "good" looks like, from user's description or exemplars
- **Cost baseline**: Current per-operation costs, model usage, caching in place
- **Constraints**: Architectural rules, design principles, things that must be preserved

**This dossier + ALL relevant source files (actual code, not summaries) go to every agent.**

---

## STEP 1: DIAGNOSTIC DEEP DIVE (1 agent)

**Receives**: Research Dossier + ALL relevant source files

**Model**: Use `model: "opus"` — this is the foundation. Quality here determines everything downstream.

**Produces**: Diagnostic Report with four sections:

### Section 1: Current Reality Map
For each component/layer within scope:
```
- What the code actually does (trace the execution path with specific function names)
- What it produces (with CONCRETE output examples — construct realistic ones by reading the code)
- Where quality breaks down (with SPECIFIC examples showing the problem, not abstract claims)
- What information the system lacks that causes the quality gap
```

### Section 2: Quality Gaps (prioritized by impact)
```
For each gap:
- GAP-N: {one-line title}: {Current State} → {Target State}
- Evidence: {concrete example of current output showing the problem}
  AND: {concrete example of what target output looks like}
- Root cause: {WHY the gap exists — is it missing data? wrong model? bad prompt? wrong algorithm? missing infrastructure?}
- Impact: {what the user/student experiences because of this gap — be specific and visceral}
- Existing leverage: {what infrastructure already exists that could help close this gap?}
- Implementation complexity: trivial | moderate | significant
```

### Section 3: Infrastructure Inventory
```
For each relevant existing service/pattern:
- What it is: {name, file path, what it does}
- How it works: {key function signatures, data flow}
- Cost: {per-call cost if it involves LLM calls}
- Reuse potential for this task: {how it could serve the current goals}
- Adaptation needed: {what would need to change, if anything}
```

### Section 4: Constraints & Principles
```
- Hard constraints: {architectural rules from CLAUDE.md, cost limits, model capabilities}
- Design principles: {patterns the codebase follows — LLM-first design, layer separation, etc.}
- Preservation requirements: {what's working well that must not regress}
```

**Self-check**: For every quality gap, verify you included a CONCRETE before/after example. "Output is too generic" is not a gap description — "Output says 'could be more specific' instead of 'the transition from lab imagery to hospital imagery needs a shared sensory anchor'" IS a gap description.

---

## STEP 2: DUAL IMPLEMENTATION DESIGN (2 agents, PARALLEL)

Both receive: Research Dossier + source files + Diagnostic Report (all verbatim)

**Model**: Use `model: "opus"` for both — implementation design requires deep reasoning.

### Agent A — Direct Path
> For each quality gap, design the most **efficient, direct** implementation. Maximize reuse of existing infrastructure. Minimize new abstractions. Your philosophy: "We already have 80% of the machinery — here's how to wire up the last 20%."
>
> If a prompt change alone closes the gap, that's a STRENGTH of your approach, not a weakness. The simplest implementation that actually achieves the target quality is the best one.

### Agent B — Rethink Path
> For each quality gap, design an implementation that takes a **fundamentally different approach** than the obvious one. Challenge the problem framing. Ask:
> - What if the fix isn't where the gap appears — what if it's upstream?
> - What if a different LLM call structure would make the problem dissolve?
> - What if existing infrastructure can be used in an unexpected way?
> - What if the gap is actually a symptom of a deeper issue?
>
> Your value is NOT proposing bigger architecture. It's proposing a DIFFERENT ANGLE. A 20-line solution that reconceives the problem is exactly your role.

### Both agents MUST produce, for each quality gap:

```markdown
## GAP-N: {title} — {Current} → {Target}

### Before / After
- **Before** (current system output):
  {Concrete example of what the system produces now for a representative input}
- **After** (target system output):
  {Concrete example of what the system should produce after implementation}

### Implementation

#### LLM Calls (if any)
- **Model**: {specific model ID, e.g., claude-sonnet-4-5-20250929} — **Why**: {rationale for this model over alternatives}
- **Caching**: {strategy — e.g., cacheSystemPrompt: true, prompt caching prefix, etc.}
- **Cost**: ~${estimate}/call based on ~{N} input tokens, ~{N} output tokens
- **Prompt spec** (NOT full prompt prose — that's implementation work):
  - **Receives**: {what data the prompt gets — essay text, profile, prior analysis, etc.}
  - **Must accomplish**: {the specific task — e.g., "classify each answer into 6 gathering facets"}
  - **Key constraints**: {critical instructions that make the difference — e.g., "evaluate intent-effect RELATIONSHIP, not just presence/absence" or "score effectiveness-at-intent separately from general effectiveness"}
  - **Output format**: {JSON schema or structure the LLM must return}
- **Expected output** (example):
  ```json
  {Realistic example of what the LLM should return}
  ```

#### Type Definitions (if any)
```typescript
// {Why this type exists}
interface ExampleType {
  field1: string;      // {why this field}
  field2: number;      // {why this field}
  field3: SubType[];   // {why this field}
}
```

#### Algorithm / Logic (if any)
```typescript
// Core decision logic — not error handling, not logging, just the algorithm
function coreLogic(input: InputType): OutputType {
  // {step 1: what and why}
  const x = transform(input.data);

  // {step 2: what and why}
  if (condition) {
    return pathA(x);
  }

  // {step 3: what and why}
  return pathB(x);
}
```

#### Integration Points
- `{real/file/path.ts}` → `{realFunctionName}({actual, param, types})` → {what changes and why}
- `{real/file/path.ts}` → `{realFunctionName}({actual, param, types})` → {what changes and why}

#### Cost Impact
| Metric | Value |
|--------|-------|
| Per call | ~${N} |
| Per essay/operation | ~${N} |
| Delta from current | {+/-$N} |
| Caching savings | ~{N}% |

### Why This Approach
{2-4 sentences on the key insight driving this design. What makes this approach
 better than the obvious thing? What existing infrastructure does it leverage?}

### Trade-offs
{What you're giving up. What could go wrong. What you're betting on.}
```

### Both agents MUST verify:
- Every function name referenced actually exists in the codebase (grep to confirm)
- Every type referenced is compatible with actual type definitions
- Every file path is correct
- Cost estimates use real model pricing (~$3/$15 per MTok for Sonnet, ~$0.80/$4 for Haiku, etc.)
- Prompt specs are complete: inputs, goals, key constraints, and output format all specified

### Both agents MUST NOT:
- Produce abstract descriptions where implementation detail is required
- Reference functions/types/files that don't exist without acknowledging they're new
- Claim cost savings without showing the math
- Skip the before/after examples for any gap

---

## STEP 3: REALITY CHECK + BLUEPRINT ASSEMBLY (1 agent)

**Receives**: Everything from Steps 0-2 verbatim

**Model**: Use `model: "opus"` — this agent makes the final design decisions.

### Part 1: Reality Verification

For EVERY proposed change in BOTH designs, verify:

1. **Code path trace**: Follow the proposed change through real code paths. Does the function signature match? Do the types align? Are there downstream consumers that would break?

2. **Prompt spec audit**: Is the prompt spec complete enough to implement from? Does it specify what data goes in, what the prompt must accomplish, key constraints, and expected output format? Are the "key constraints" actually the ones that make the difference, or are they generic? Would following this spec plausibly produce the claimed output quality?

3. **Cost verification**: Check token estimates against realistic prompt lengths. Is the model selection justified? Does the caching strategy actually work with the prompt structure?

4. **Integration completeness**: Are there callers, consumers, or data flows the proposer missed? Grep for function names, type references, and import paths.

5. **Before/after plausibility**: Would the proposed implementation ACTUALLY produce the "after" example? Or is the proposer being optimistic about LLM output quality?

Produce a finding for each issue:
```
- Finding ID: {agent}-{gap}-{N}
- Severity: broken (won't work) | weak (works but won't achieve target quality) | incomplete (too vague to implement)
- Issue: {what's wrong — concrete, not abstract}
- Fix: {how to resolve — concrete, not abstract}
```

### Part 2: Forced-Choice Synthesis

For each quality gap, choose the better implementation:
```
Resolution options:
- direct: Agent A's implementation (with any fixes from verification)
- rethink: Agent B's implementation (with any fixes from verification)
- hybrid: Specific elements from each (CITE which parts from which agent)
- refined: Neither is sufficient — produce a better version drawing on insights from both
  (Must explain what both missed and why the refined version is better.
   The refined version must meet the SAME implementation depth standard.)
```

Justify each choice in 2-3 sentences. The justification must address implementation quality, not just architectural elegance.

### Part 3: Blueprint Assembly

Assemble the final blueprint. Resolve all integration conflicts between chosen implementations. Order items by dependency chain.

**Final quality gate**: Read every item in the blueprint. For each one, ask:
1. "Could I start coding this right now?" — If no, add the missing detail.
2. "Do the before/after examples demonstrate a real quality improvement?" — If no, improve them.
3. "Are the cost estimates grounded?" — If no, recalculate.

---

## OUTPUT FORMAT

Write **FORGE_PLAN.md** (the implementation blueprint):

```markdown
# Implementation Blueprint: {title}

{2-3 sentences describing what the system DOES differently after this is built.
 Focus on user-visible quality changes, not internal architecture.}

---

## Items

### 1. {Name}: {Current Behavior} → {Target Behavior}

**Before** (current):
{Concrete example of what the system produces now}

**After** (target):
{Concrete example of what the system will produce}

**Implementation**:

{THE MEAT. This section is LONG and SPECIFIC. It contains:
- LLM call specs: model, caching, cost, what data goes in, what the prompt must accomplish, key constraints, expected output format with example
- Actual TypeScript interfaces with field-level comments
- Actual algorithm logic in pseudocode or TypeScript
- Actual integration code showing how this connects to existing systems
- NOT full prompt prose — prompt writing is implementation work that needs iterative LLM testing

An engineer reading this section should be able to open their editor and start coding.}

**Integration points**:
- `{file:line}` — `{function}()` — {what changes}
- `{file:line}` — `{function}()` — {what changes}

**Cost**: ~${N}/call ({model}, {caching strategy}) | Delta: {+/-$N vs current}

**Source**: {direct | rethink | hybrid | refined} — {1-sentence rationale}

---

### 2. {Name}: {Current} → {Target}
...

---

## Execution Order

{Dependency-ordered. What must be built first? What does each item unlock?}

1. **Item N** (foundation) — enables Items X, Y
   - Verify: {how to confirm this step worked before moving on}
2. **Item M** (depends on N) — enables Items P, Q
   - Verify: {confirmation step}
...

## Cost Summary

| Item | Model | Calls/operation | $/operation | Delta from current |
|------|-------|-----------------|-------------|-------------------|
| 1. {name} | {model} | {N} | ${N} | {+/-$N} |
| ... | ... | ... | ... | ... |
| **Total** | | | **${N}** | **{+/-$N}** |

## Existing Infrastructure Leveraged

{What existing services, patterns, and utilities are reused and how.
 This demonstrates the implementation is grounded in the real codebase,
 not designed in a vacuum.}

## Open Questions

{Things that can ONLY be resolved during implementation. Acknowledged, not ignored.
 Each should note WHEN during implementation it will be resolved and HOW.}

## Rejected Approaches

{What was considered, what was wrong with it. Prevents re-litigating later.
 Include the key Adversary/verification findings that eliminated each approach.}
```

Also write **FORGE_DEBATES.md**: compressed record of both designs, verification findings, synthesis decisions with rationale, and key insights that emerged during the process.

---

## ORCHESTRATION RULES

1. **Deep research is non-negotiable**: Step 0 should be thorough. Read the actual code. Trace the data flow. Understand the existing infrastructure. The quality of the Research Dossier determines the quality of everything downstream. Budget significant time here.

2. **Use Opus for all agents**: Implementation design requires deep reasoning. Pass `model: "opus"` to every agent spawn. The user has Claude Max — cost is not a constraint. Quality is.

3. **Verbatim passing**: Pass agent outputs verbatim between steps. Never summarize — agents need full context.

4. **Parallel Step 2**: Spawn both designers simultaneously.

5. **Agents read real code**: Include actual source files in agent prompts. Agents MUST grep/read to verify every function name, type, and file path they reference. Any reference to non-existent code must be flagged as "new — needs to be created."

6. **Implementation detail is mandatory**: If any agent output says "implement an algorithm that..." without showing the algorithm, or "add a type for X" without the interface — that output is INCOMPLETE. Exception: prompt prose is deliberately deferred to implementation. Agents should specify prompt SPECS (inputs, goals, constraints, output format) but not write full prompt text.

7. **No loops**: Blueprint ships with open questions documented. Don't iterate the forge — build and iterate the implementation.

8. **Track provenance**: Every blueprint item cites which agent's design it came from (direct/rethink/hybrid/refined).

9. **If iterating on an existing FORGE_PLAN.md**: Read it in Step 0. Pass it to the Diagnostician with instructions: "This is the previous plan. Identify what's strong (keep), what's weak (fix), what's missing (add), and what's too abstract (deepen)."

10. **Scope honesty**: If the task is too large for one blueprint, say so. Propose a phased breakdown where each phase has its own complete blueprint. Don't produce a shallow blueprint that covers everything — produce a deep blueprint that covers what can be covered well.

---

## AGENT COUNT: 4 ALWAYS

| Step | Role | Parallel? | Model |
|------|------|-----------|-------|
| 1 | Diagnostician | Sequential | opus |
| 2a | Direct Path Designer | Parallel with 2b | opus |
| 2b | Rethink Path Designer | Parallel with 2a | opus |
| 3 | Reality Checker + Blueprint Assembler | Sequential | opus |

Total: 4 agent spawns, 3 sequential rounds.

---

## WHAT MAKES THIS DIFFERENT FROM A PLAN

A **plan** says: "Modify buildParagraphPrompt() to inject student context."

A **blueprint** says:

> **L3.5 Analysis Pass: Generic Scoring → Intent-Effect Gap Diagnosis**
>
> **Before**: "P2S4 transitions from technical to personal. Effectiveness: 62."
> **After**: "P2S4 is supposed to connect the lab to the grandmother (student declared intent). The text jumps directly — no sensory or thematic link. Effectiveness at declared intent: 42. Effectiveness at general function: 58. The 16-point gap IS the teaching opportunity."
>
> **Implementation**:
> - New LLM call in `analysisPass.ts:142` via `buildParagraphPrompt()`
>   - **Model**: Sonnet (cacheSystemPrompt: true, ~$0.02/paragraph)
>   - **Receives**: paragraph text + accumulated understanding + StudentDeclaredContext for this paragraph
>   - **Must accomplish**: dual scoring — effectiveness-at-intent AND general effectiveness. The GAP between them is the primary output.
>   - **Key constraint**: "Score effectiveness-at-intent SEPARATELY from general effectiveness. A sentence can be a competent transition (58) but poor execution of stated goal (42). That gap is more valuable than either score alone."
>   - **Output format**: `{ intentScore: number, generalScore: number, gapAnalysis: string, teachingOpportunity: string }`
> - Injected as user-message section (not system prompt) to preserve ~$0.04 cache
> - `contextFormatters.ts` maps StudentDeclaredContext → per-layer injection, with different framing per layer
> - Integration: `analysisPass.ts` → `buildParagraphPrompt(para, profile, studentContext?)` — new optional param

The blueprint has the implementation logic, the data flow, the integration points, the cost model, and the key constraints that make the prompt work — without burning agent bandwidth writing full prompt prose that can only be calibrated during implementation.

**That's the difference. The forge produces implementation logic, not architecture descriptions.**
