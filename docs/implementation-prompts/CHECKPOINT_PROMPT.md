# Post-Cluster Checkpoint: Quality Validation, Rigidity Audit & Forward Propagation

> **Paste this prompt in the SAME chat after completing a cluster's implementation.**
> Replace `[CLUSTER_ID]` with the cluster you just completed (A, B, C, or D).

---

## COMPLETED CLUSTER: [CLUSTER_ID]

### Cluster Map
```
Cluster A: #1 Finding Lifecycle + #3 Bidirectional Connections  (Foundation types)
Cluster B: #2 Scoring Validation + #9 Continuous Phase + #4 Contradiction Mining  (Analysis consumers)
Cluster C: #7 Iterative L3.75 + #8 Adaptive Router  (Orchestration)
Cluster D: #5 L5 Annotations + #6 L6 Coaching + #10 Version Branching  (End consumers)
```

---

## PHASE 1: DID WE ACTUALLY SOLVE THE PROBLEM?

Each improvement exists because of a specific quality gap. Your job is to verify that the gap is CLOSED, not just that code was written.

### The Original Problems (verify the right one for your cluster)

**Cluster A problems:**
- **#1**: Mutators do all-or-nothing array replacement. A confirmed finding gets wiped if the paragraph is re-analyzed and the LLM phrases it differently. No merge, no evolution tracking. PLAN2's growth engine is impossible without this.
- **#3**: Connections only point forward (P1→P3). No backward links, no strength tracking. The router uses connections as PRIMARY signal but can only see forward references. A thematic callback from P5→P1 is invisible.

**Cluster B problems:**
- **#2**: L3.5 detects score clustering but doesn't correct it. Hard-coded phase thresholds create cliff effects. [U] labels have no confidence signal.
- **#9**: 5 discrete phases with hard boundaries. Same phase logic for a 150-word supplemental and an 800-word personal statement. No per-dimension phase awareness.
- **#4**: Crystallizer sees the complete profile but doesn't actively hunt for contradictions between L3 understanding and L3.5 scores. A paragraph rated "deeply earned" by L3 but scored 4/10 on earnedness doesn't trigger investigation.

**Cluster C problems:**
- **#7**: L3.75 runs once after the walk. No iterative refinement, no delta updates as deep dives complete. Understanding can't deepen through synthesis cycles.
- **#8**: 13 hard-coded routing rules. Token budgeting is fixed. Router can't adapt to what the current analysis step actually NEEDS.

**Cluster D problems:**
- **#5**: Annotations can be generic coaching wrapped in specific-sounding language. "Your sensory detail here effectively grounds the reader" doesn't teach anything the student doesn't already know.
- **#6**: Keyword detection can't distinguish "I disagree" from "I don't understand" from "I want to go deeper." No cognitive state inference, no session memory, no escalation awareness.
- **#10**: Linear version history only. Can't compare branches of revision or track how understanding evolved across versions.

### How to Verify

For each improvement in the completed cluster, do this:

**Step 1: Construct a concrete test scenario.** Not abstract — pick a specific essay situation and trace it through the implementation.

Examples for Cluster A:
- "The walk produces a finding F1 about voice quality in P1 (hypothesis). Three paragraphs later, the walk sees more voice evidence and produces F5 that deepens F1. Then the student edits P1. Re-analysis runs. Does F1 evolve into a new finding that incorporates the edit, or does the entire finding store get wiped and rebuilt from scratch?"
- "L2.5 (scout) finds a thematic echo from P0→P4. The walk later discovers it goes both ways — P4 also illuminates P0's meaning. Does the connection graph capture bidirectional semantics? Can the router see the backward link when assembling context for P0?"

Examples for Cluster B:
- "L3.5 scores Voice=7, Earnedness=7, Structure=7 for an essay where voice is clearly the strongest dimension. Does the anti-clustering mechanism detect this and force differentiation? HOW — through prompt calibration, not post-hoc formula?"
- "L3 says P2 has 'deeply earned emotional resonance' but L3.5 scores earnedness at 4/10. Does the contradiction mining system catch this? What happens with the contradiction — does it become a deepening opportunity?"

Examples for Cluster C:
- "After the walk completes and L3.75 synthesizes, a deep dive on voice reveals that the essay's voice authenticity is actually performed. Does L3.75 run again with this new information? Does the delta update change just the voice section, or does it recognize that voice authenticity affects the North Star?"
- "A deep dive prompt about narrative structure needs the voice map + connection graph + earned-ness findings as context. Does the router assemble these because they're relevant (adaptive), or because of a hard-coded rule?"

Examples for Cluster D:
- "The system has Finding F3 (confirmed, high coaching value) about how P2's metaphor is decorative rather than structural. Does the L5 annotation for P2 reference F3 specifically and teach the student something they couldn't see by re-reading?"
- "Student says 'I don't get what you mean about my voice shifting.' Previous turn explained voice shifts. Does the coaching system recognize confusion-about-specific-feedback vs general-confusion-about-voice? Does it try a different angle?"

**Step 2: Trace the scenario through actual code.** Read the functions, follow the data flow, verify the scenario produces the right outcome. Don't just check that functions exist — check that they'd actually produce the right result for this scenario.

**Step 3: Identify gaps.** Where does the trace break? What's missing? What produces a technically correct but qualitatively shallow result?

---

## PHASE 2: RIGIDITY AUDIT

This is the trap we keep falling into. The prompts say "LLM-first" but implementation creeps back toward determinism. Search for these specific patterns:

### 2A. The Smoking Guns

Search the code you wrote in this cluster for:

1. **Deterministic scoring formulas**: Any function that COMPUTES a score from other variables without LLM involvement. Search for arithmetic operations on scores, weighted averages, threshold comparisons that produce analytical judgments.
   - `score = weight * value` → ❌ (unless it's token budget math, which is infrastructure)
   - `if (score > 7) phase = 'Craft'` → ❌ (LLM should judge phase)
   - `if (tokens > MAX_BUDGET) truncate()` → ✅ (resource limit)

2. **Closed enums used for LLM perception**: Any enum or union type that constrains what the LLM can OBSERVE or DESCRIBE (not what the system uses for ROUTING).
   - `type ConnectionType = 'callback' | 'contrast' | ...` → ❌ if the LLM must choose from this list
   - `type RoutingTag = 'structural' | 'thematic' | ...` → ✅ if system assigns these for routing and LLM describes freely in prose

3. **Post-hoc filtering/trimming of LLM output**: Any code that removes, trims, or caps LLM-generated content to satisfy a ratio, quota, or pattern.
   - `findings.slice(0, MAX_PER_PARAGRAPH)` → ❌
   - `annotations.filter(a => !GENERIC_PATTERNS.test(a))` → ❌
   - `if (findings.length > 50) log.warn('unusual density')` → ✅ (diagnostic signal, not deletion)

4. **Regex/keyword quality checks**: Any pattern matching used to enforce output quality.
   - `if (/effectively|demonstrates|showcases/.test(text))` → ❌
   - Solve quality at the prompt layer, not detection layer

5. **Hard blocklists**: Any code that prevents certain outputs based on phase, type, or category.
   - `if (phase === 'Foundation') skip sentence-level annotations` → ❌
   - Prompt says "at Foundation, prioritize structural insights" → ✅

### 2B. The Subtle Traps

These are harder to spot:

1. **Formula disguised as "just a default"**: `const confidence = findings.filter(f => f.maturity === 'confirmed').length / findings.length` — looks like a simple calculation but it's replacing LLM judgment about how confident the system should be.

2. **Enum that claims to be "just routing" but actually limits perception**: If the LLM MUST assign one of your routing tags and can ONLY use those tags, you've built a closed taxonomy with extra steps. The LLM should describe freely in prose AND ALSO the system can assign routing tags.

3. **Implicit trimming via context window**: If you only send the "top 5 findings by coaching value" to a downstream prompt, you're trimming. Send all findings (or a representative summary) and let the LLM decide what's relevant.

4. **Determinism hiding in prompt construction**: If the code that BUILDS the prompt makes analytical decisions about what to include/exclude based on formulas, that's moving the rigidity from the output to the input. The LLM should see the full picture and make its own judgment about what matters.

5. **Keyword matching on LLM prose output**: `if (assessment.recommendedApproach.toLowerCase().includes('minimal'))` — the LLM might say "give them room to process" or "this turn doesn't need much." The keyword list can't catch novel phrasings. This is the same problem as `DESCRIBE_BACK_PATTERNS` regex — solving routing at the DETECTION layer. **Fix:** have the LLM produce an explicit routing tag (`responseIntensity: 'minimal'`) alongside its prose.

6. **Weighted reward formulas replacing convergence judgment**: `questionsResolved * 3.0 + findingsSuperseded * 2.5 + ...` — looks like "just tracking metrics" but the weights are arbitrary analytical judgments about what learning is worth. A formula can't know that 1 superseded finding might transform coaching while 3 resolved questions might be trivial. **Fix:** track raw metrics in an activity ledger, present them to the LLM as context, let the LLM judge convergence.

7. **Static guidance functions that duplicate LLM-driven dispatch**: `getPhaseGrowthGuidance()` with hardcoded `suggestedMaxDives` and `priorityDomains[]` per phase — this conflicts with L3.75's curated question queue which IS the dispatch priority. If both exist, they either agree (pointless) or disagree (harmful). **Fix:** fold phase context into the LLM's curation prompt.

8. **Keyword lists reverse-engineering LLM prose for routing**: `dimensionKeywords: { voice: ['voice', 'register', 'vocabulary', ...] }` used to match against the Reading Strategy prose — can't handle novel dimensions the LLM discovers. **Fix:** have the LLM produce `contextPriorities: string[]` as an explicit routing signal alongside the prose.

### 2C. The Design Principle: Explicit Routing Signals

When the system needs a routing signal from LLM output, have the LLM produce it explicitly as a tagged field — don't reverse-engineer it through keyword matching, threshold formulas, or weighted scoring.

The LLM already has the context to make these judgments. The system just needs to ask for them in a form it can route on:
- **Convergence**: L3.75 produces `selfAssessedConvergence` → primary stopping signal
- **Context ordering**: L3.75 produces `contextPriorities: string[]` → router ordering signal
- **Response intensity**: Stage 1.5 produces `responseIntensity: 'full' | 'brief' | 'minimal'` → Sonnet/Haiku routing
- **Re-read candidates**: L3.75 flags paragraphs directly → no confidence threshold gate
- **Analysis mode**: Impact classifier decides with phase context → no deterministic mapping function

This is Rule 7 across the entire system: **the LLM speaks to the system through routing tags it produces, not through prose the system keyword-matches.**

### 2D. How to Fix What You Find

For each rigidity violation:
1. Name it: what is the deterministic element?
2. Ask: "Is this an OPERATIONAL constraint (resource limit, bookkeeping) or an ANALYTICAL judgment?"
3. If analytical → move it to the LLM. Add it to the prompt, not the code.
4. If the system needs a routing signal from LLM output → add an explicit routing tag to the LLM's output schema (Rule 7).
5. If operational → keep it, but make sure it's clearly labeled as infrastructure.
6. Apply the fix, don't just flag it.

---

## PHASE 3: QUALITY DEPTH CHECK

This is about whether the implementation reaches the QUALITY CEILING, not just the quality floor.

### 3A. Prompt Quality Scenarios

For each LLM prompt you wrote, ask:

1. **"What would a lazy LLM produce from this prompt?"** If the prompt is well-designed, even a lazy response should be useful. If a lazy LLM would produce generic/templated output, the prompt needs stronger cognitive forcing functions.

2. **"What would this prompt produce for a GREAT essay vs a WEAK essay?"** The output should be qualitatively different — not just "higher scores" but fundamentally different insights. If the same template applies to both, the prompt isn't pushing deep enough.

3. **"Does this prompt enable Level 5 understanding?"** Reference the Understanding Hierarchy from PLAN2.md:
   - Level 1: Technique identification ("this uses imagery")
   - Level 2: Contextual function ("these sensory registers construct a world of transactions")
   - Level 3: Architectural comprehension ("the clash between P1's epistemology and P3's IS the tension")
   - Level 4: Epistemological insight ("the essay defines understanding as physical encounter")
   - Level 5: Meta-awareness ("the essay unknowingly performs the constraint it describes")

   Your prompt should be CAPABLE of eliciting Level 4-5. Not every essay warrants it, but the prompt should never be the ceiling.

### 3B. Teaching Quality (for prompts that produce student-facing output)

For any prompt that generates annotations, coaching responses, or feedback:

1. **The Teaching Test**: "Does this tell the student something they couldn't figure out by re-reading their essay carefully?" If not, it's assessment, not teaching.

2. **The Specificity Test**: Could this feedback apply to a different essay? If yes, it's generic. Real teaching is irreplaceable — it's about THIS paragraph, THIS moment, THIS student.

3. **The Transformation Test**: If the student followed this feedback, would the essay be meaningfully better? Or would it just be "correctly different"?

### 3C. Growth Engine Validity

Does this cluster's implementation actually enable the growth engine from PLAN2.md?

- Can findings accumulate maturity across growth cycles? (Cluster A)
- Can scores differentiate meaningfully? Can phases detect per-dimension progress? (Cluster B)
- Can synthesis deepen iteratively? Can the router adapt to what each pass needs? (Cluster C)
- Can annotations reference specific findings? Can coaching track cognitive state across turns? (Cluster D)

If the growth engine can't function with what you built, that's a blocker — fix it before moving forward.

---

## PHASE 4: PLAN2.md CONSOLIDATION

Brief and focused. Update PLAN2.md to reflect what was actually implemented:

1. Replace type sketches with actual implemented types where they diverged
2. Update architecture prose where the implementation taught you something the plan didn't anticipate
3. Add an Implementation Status section at the bottom tracking what's done, what's discovered, and what diverged from the original plan
4. Do NOT rewrite unaffected sections or add aspirational content

---

## PHASE 5: FORWARD PROPAGATION

The next cluster's prompts were written before this cluster was implemented. They contain assumptions that may now be wrong.

### What to Propagate (substance, not ceremony)

**DO propagate:**
- "We discovered that finding merge detection works best when the LLM sees the full prose of both findings, not just their claims — so the scoring prompt needs full findings in context, not ID references"
- "The connection graph uses `routingTags: string[]` not `type: ConnectionType` — update all references in downstream prompts"
- "Bidirectional connections revealed that some connections are genuinely asymmetric (setup→payoff is directional). The contradiction mining prompt should be aware that asymmetric connections are not contradictions"
- Actual type definitions that downstream prompts reference
- Edge cases discovered during implementation that downstream prompts don't account for

**DON'T propagate:**
- "All imports are correct" (not useful to downstream)
- "Type check passes" (not useful to downstream)
- Generic "things look good" confirmations

### Which Prompts to Update

```
After Cluster A → Update: IMPROVEMENT_2, IMPROVEMENT_4, IMPROVEMENT_9 (next cluster)
                  Quick-scan: IMPROVEMENT_5, 6, 7, 8, 10 (future clusters — flag stale refs only)
After Cluster B → Update: IMPROVEMENT_7, IMPROVEMENT_8
                  Quick-scan: IMPROVEMENT_5, 6, 10
After Cluster C → Update: IMPROVEMENT_5, IMPROVEMENT_6, IMPROVEMENT_10
After Cluster D → Final PLAN2.md consolidation only
```

For each prompt in the next cluster:
1. Add a "Context from Previous Implementation" section with actual types, discoveries, and watch-outs
2. Fix any type references that are now wrong
3. Add concrete examples from implementation (good patterns to follow, bad patterns discovered)
4. Flag conflicts between this cluster's decisions and the next prompt's assumptions

### Forward Propagation Quality Gate

After updating, verify for each next-cluster prompt:
- Every type it references matches the actual implementation
- Every assumption it makes about the data flow is still valid
- The implementation sequence accounts for what already exists in the codebase

---

## PHASE 6: BRAINSTORM & DEEPEN

Now that you've implemented this cluster and see how it actually works in practice, step back and think:

### 6A. What Did Implementation Teach Us?

- Were there moments where the implementation felt RIGHT — where the design naturally produced good results? What made those moments work?
- Were there moments where the implementation felt FORCED — where you had to bend the design to make it fit? What does that suggest about the design?
- Did any assumption in the prompt turn out to be wrong? What's the corrected understanding?

### 6B. Quality Ceiling Opportunities

- Now that the foundation is built, what ADDITIONAL capabilities become possible that weren't in the original prompt?
- Are there interactions between this cluster's improvements that create emergent value neither improvement has alone?
- What would make this cluster's output go from "correct" to "remarkably good"?

### 6C. Feed Forward Into Next Cluster's Design

- Based on what you learned, should any of the next cluster's prompts be restructured? Not just updated references, but fundamentally different approaches?
- Did you discover that a problem the next cluster is trying to solve is actually better solved at this layer? Or that this layer should provide something the next cluster needs that wasn't in the original design?

---

## OUTPUT

Don't produce a formatted report. Instead:

1. **Fix everything that needs fixing** (rigidity violations, quality gaps, broken scenarios). Show what you fixed and why.
2. **Update PLAN2.md** with actual implementation reality.
3. **Update the next cluster's prompts** with substantive discoveries.
4. **Share the 3-5 most important things you learned** that should shape how we approach the next cluster.
5. **Give a clear GO/NO-GO** for the next cluster. If no-go, say exactly what's blocking.

---

## THE SINGLE MOST IMPORTANT THING

Read the LLM-first design principles at `memory/feedback_llm-first-design.md` before you start. The #1 failure mode is implementing code that LOOKS flexible but actually sneaks determinism back in. Every function, every enum, every threshold — ask: "Is this tracking what the LLM produces, or pre-determining what it can produce?"

If the answer is "pre-determining," fix it. No exceptions. We've caught this pattern too many times to let it through again.
