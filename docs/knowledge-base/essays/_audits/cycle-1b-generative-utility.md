# Cycle 1b — Generative-Utility Test (the G2-upgraded "can the system actually USE it" gate)

> Triggered by the directive: "make sure these findings are specific and deep enough that our
> system can actually utilize them to better its generation of guidance, improvements, and
> examples." Method: blind A/B. For a fresh weak passage / student question, generate
> guidance + improvement + example **with** a KB entry (TREATMENT) vs **without** it, on a strong
> base model (Opus, told not to sandbag the baseline). An independent BLIND judge (no access to
> the entries or the key) picks the more expert output. Reconciled against a hidden key.

## Results

**Craft cluster (E3 reflection/meaning-making, after deepening with worked examples + mechanics + transfer):**
TREATMENT won **1 of 4**; the no-KB baseline won 3 of 4, including the only clear-margin result
(P3 de-bow — the entry-grounded rewrite actually *re-bowed* the ending). → **No demonstrable lift.**

**Fact cluster (E1 post-SFFA identity, E2 AI policy):**
TREATMENT won **4 of 4** (2 clear, 2 slight); baseline won 0. Treatment won *clearly* exactly where
the answer hinged on current, specific, verbatim-quotable facts (SFFA ruling language; Yale/Brown
actual AI-policy text) and *slightly* where the base model's general knowledge was already decent.

## The finding (load-bearing, reshapes the loop)

**Over a strong base model, the KB's value-add is concentrated in VERIFIED, CURRENT, SPECIFIC FACTS
(and, by the same logic, cross-domain dot-connecting) — NOT in re-teaching craft the model already
commands.** Generic reflection craft (so-what ladder, de-bow, uncommon-connection) is saturated in a
frontier model's training; restating it adds nothing and can distract. Current policy/legal/school
specifics are where the base model is outdated, hedged, or wrong — and where the KB wins clearly.

**Critical dependency:** the fact entries win *because they are verified*. A confidently-specific but
WRONG fact would backfire (worse than a hedge — the judge explicitly flagged that). So verification
isn't bureaucracy; it is the precondition that makes confident specificity safe and valuable. The
Cycle-1 audit's 13/13 live re-check is what licenses the treatment's confidence.

Caveat: small N (4+4); margins slight on 2 fact wins. But the pattern is clean and the judge's
mechanism-level reasoning is consistent across all 8.

## Loop corrections (adopted)

1. **Reweight sourcing toward verified-current-specific FACTS + cross-domain CONNECTIONS.** This is
   where "the breadth of many experts" actually beats both a base model and a time-pressed counselor.
   Prioritize: current policy (testing, AI, SFFA), school-specific intelligence, data/figures, prompts.
2. **Craft entries must clear a higher bar.** A craft entry counts ONLY if it beats the base model —
   i.e. it encodes something the model does NOT already command: a named non-obvious framework, a
   verified REAL before/after, calibration to documented AO behavior, or a school/context-specific
   craft nuance. Generic craft is PRUNED (it's distracting noise). The E3 cluster is demoted to
   "candidate" pending upgrade-or-prune against this bar.
3. **G2 becomes a per-entry gate.** An entry counts toward the win condition only if it passes the
   generative-utility test (clear lift over the no-KB baseline). This gives the win condition real
   teeth and directly enforces "applicable/utilizable."
4. **Test the dot-connecting edge (G5) next** — by the same logic it should show large lift (a base
   model won't spontaneously connect cross-domain facts); confirm empirically before relying on it.
