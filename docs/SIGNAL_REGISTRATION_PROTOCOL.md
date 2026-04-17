# Signal Registration Protocol

**Version:** 1.0 — 2026-04-17
**Status:** Binding from Round 8 forward.
**Purpose:** Prevent the "inventory-not-capability" drift identified in audit finding D3-H1.

---

## 0 — Why this exists

The Round 7 audit found that 7b and 7c signal machinery landed in prompts only. No code path gated behavior, routed coaching, or demanded follow-up on them. "Did Sonnet happen to read it this turn" was the sole determinant of impact.

Round 8 is not allowed to compound that pattern. Every new signal added from Round 8 onward MUST register via the protocol below, which forces the author to declare (a) the consumer, (b) the gate, and (c) the audit key at build time.

---

## 1 — Required declaration

Every signal declares itself via `registerSignal`:

```ts
// src/services/essayIntelligence/signalRegistry.ts (new file, ships with Round 8)

import type { EssayProfile } from './profileTypes';
import type { StudentFacing } from './revisionPlanning/types';

export interface SignalDefinition<T = unknown> {
  name: string;                        // unique, snake_case
  addedIn: string;                     // round marker: 'round7a', 'round8', 'round9'
  registryKey: string;                 // EssayProfile dotted path: 'claimEarnednessMap', 'aoFirstRead.archetypePositioning'

  // Reader — how to extract the signal value from a profile
  read: (profile: EssayProfile) => T | null;

  // Consumer — MUST be a structural one, not "Sonnet reads it in the prompt"
  consumer: SignalConsumer;

  // Gate — when is this signal salient? Empty = always
  gate?: (profile: EssayProfile, value: T) => boolean;

  // Audit key — path under profile.signalAudit for utilization tracking
  auditKey: string;

  // Translator (required when consumer === 'revision_planner')
  translator?: (value: T, ctx: TranslationContext) => StudentFacing;
}

export type SignalConsumer =
  | 'revision_planner'       // Round 8: feeds RevisionPriority generation
  | 'coaching_router'        // Routes coach to specific technique deployment
  | 'analysis_gate'          // Gates whether a downstream layer runs (e.g., skip L5 if signal clean)
  | 'persona_adaptation'     // Modifies Luna persona tone/directness
  | 'reanalysis_trigger'     // Triggers focused/comprehensive reanalysis
  | 'internal_only';         // Rare escape hatch — requires doc + Lead approval
```

**"internal_only" is the only permitted value for a signal with no external consumer.** Use is explicitly reviewed and documented per-instance.

---

## 2 — Registration site

```ts
// src/services/essayIntelligence/signalRegistry.ts

export const SIGNAL_REGISTRY = new Map<string, SignalDefinition>();

export function registerSignal<T>(def: SignalDefinition<T>): void {
  if (SIGNAL_REGISTRY.has(def.name)) {
    throw new Error(`[SignalRegistry] duplicate: ${def.name}`);
  }
  validateDefinition(def);  // see §5
  SIGNAL_REGISTRY.set(def.name, def);
}

// Consumption API
export function getSignal(name: string): SignalDefinition | undefined {
  return SIGNAL_REGISTRY.get(name);
}

export function listSignalsForConsumer(consumer: SignalConsumer): SignalDefinition[] {
  return Array.from(SIGNAL_REGISTRY.values()).filter(s => s.consumer === consumer);
}

export function auditSignalUtilization(profile: EssayProfile): SignalUtilizationReport {
  // Reads profile.signalAudit, reports per-signal utilization rate
  // (how often planner/router/gate actually acted on it)
}
```

Signals register at module import time in a single bootstrap file:

```ts
// src/services/essayIntelligence/signalBootstrap.ts — imported once at orchestrator init

import { registerSignal } from './signalRegistry';

// Round 7a signals
registerSignal({
  name: 'revision_intelligence_persistent_findings',
  addedIn: 'round7a',
  registryKey: 'revisionIntelligence.persistentFindings',
  read: p => p.revisionIntelligence?.persistentFindings ?? null,
  consumer: 'revision_planner',
  gate: (p, v) => v.length >= 2,  // only salient when finding persists ≥2 sessions
  auditKey: 'round7a.persistentFindings',
  translator: (v, ctx) => ({
    oneLine: `You've addressed this ${ctx.sessions} times without it landing: ${v[0].oneLineDescription}`,
    whatToTry: v[0].suggestedMove ?? 'Try a different angle this time',
  }),
});

// Round 7b, 7c signals follow the same pattern
// Round 8 planner's own signals (e.g. plan_address_detection) also register

// Round 9+ adds its signals in this same file (or in a per-round bootstrap
// that's imported here). NEVER adds by writing directly to EssayProfile.
```

---

## 3 — Build-time enforcement

### 3.1 Lint: no un-registered signal reads

**Script:** `scripts/check-signal-usage.sh` (or AST variant via ts-morph).

Finds every read of `profile.X.Y` where `X` is in a whitelist of "signal fields" (7a/7b/7c + future) and asserts that the read happens **through** `getSignal(name).read(profile)`, not via direct property access.

Violations fail CI.

Whitelist is declared once:

```ts
// scripts/signal-field-whitelist.json
[
  "revisionHistory",
  "revisionIntelligence",
  "voiceEvolution",
  "claimEarnednessMap",
  "rhetoricalInventory",
  "archetypeDistanceProfile",
  "aoFirstRead.archetypePositioning",
  "metadata.latestRevisionPlanId"
]
```

Exceptions (profileManager + signalRegistry internals) are explicit allowlist entries.

### 3.2 Lint: all registered signals have at least one consumer invocation

If `registerSignal({ name: 'foo' })` exists but no file consumes it via `getSignal('foo')` or `listSignalsForConsumer(...)`, CI warns (not error, because consumers can be added in later rounds). After 2 rounds of no-consumer, the warning becomes an error.

### 3.3 Lint: translator required when consumer === 'revision_planner'

Validated in `validateDefinition(def)` at registration time. Runtime throw if violated; test in `tests/unit/signal-registry-validation.test.ts`.

---

## 4 — Runtime audit loop

### 4.1 `signalAudit` on EssayProfile

```ts
interface SignalAudit {
  signalsReferenced: Array<{
    signalName: string;
    consumer: SignalConsumer;
    referencedAt: string;       // ISO 8601
    referencedIn: string;       // 'revision_planner' | 'coach_turn_{N}' | 'analysis_gate_l5'
    actedOn: boolean;           // did the consumer change behavior based on the signal?
  }>;
  lastAuditAt: string;
}
```

Each consumer logs to `signalAudit.signalsReferenced` when it reads a signal. `actedOn` distinguishes "I saw the signal" from "I changed behavior because of it."

### 4.2 Utilization metric

```ts
interface SignalUtilizationReport {
  perSignal: Record<string, {
    referenceCount: number;
    actedOnCount: number;
    utilizationRate: number;     // actedOn / references
  }>;
  inventorySignals: string[];    // signals where utilizationRate < 0.1 over last N sessions
  capabilitySignals: string[];   // signals where utilizationRate > 0.5
}
```

Consumed by:
- Admin dashboard (are 7b signals actually driving behavior?)
- Post-round audits (D3-H1-style "inventory not capability" detection)
- Sunset decisions (if a signal sits at <5% utilization for 3 months, propose deprecation)

---

## 5 — Validation at registration

```ts
function validateDefinition<T>(def: SignalDefinition<T>): void {
  if (!def.name || !/^[a-z][a-z0-9_]*$/.test(def.name)) {
    throw new Error(`signal name must be snake_case: ${def.name}`);
  }
  if (def.consumer === 'revision_planner' && !def.translator) {
    throw new Error(`signal '${def.name}' with consumer=revision_planner MUST declare a translator`);
  }
  if (def.consumer === 'internal_only') {
    console.warn(`[SignalRegistry] '${def.name}' registered as internal_only — requires Lead approval`);
  }
  if (!def.auditKey.startsWith(def.addedIn)) {
    throw new Error(`auditKey must be prefixed with addedIn: '${def.addedIn}.${def.name}'`);
  }
}
```

---

## 6 — Adding a new signal (Round 9+ recipe)

The following is the **only** path to add a signal:

1. Define the signal's payload type in `profileTypes.ts`.
2. Add the field to `EssayProfile` through a coordinator method (`applyXSignal` — per the coordinator-discipline rule in [ROUND_7_HARDENING_PLAN.md §5](./ROUND_7_HARDENING_PLAN.md)).
3. Register via `registerSignal(...)` in `signalBootstrap.ts` (or a `round9Bootstrap.ts` imported by it).
4. Choose a consumer. Name a specific code path (planner priority, coach router branch, analysis gate) that acts on the signal.
5. If consumer is `revision_planner`, declare a translator.
6. Write: unit test for the translator (if present); integration test demonstrating the consumer acting on the signal.
7. Add to `scripts/signal-field-whitelist.json`.

If any step is skipped, CI fails. There is no undocumented path to add a signal.

---

## 7 — Retiring a signal

If a signal's `utilizationRate < 0.05` over 3 months AND no consumer references it:

1. Author of the proposal-to-retire opens a `chore/retire-signal-X` branch.
2. Removes the `registerSignal` call.
3. Removes the field from `EssayProfile` via a coordinator method (`clearXSignal`).
4. Adds a migration to drop the JSONB field from `profile_cache` on existing rows (or leaves it dormant if still queryable elsewhere — judgment call).
5. Removes from whitelist.

---

## 8 — Grandfathering (Round 7 signals)

Round 7a/7b/7c signals pre-date this protocol. They are grandfathered in the `signalBootstrap.ts` with retroactive registrations as part of the Round 8 PR. This both:

- Gives the audit utilization report a full data set from Round 8 onward.
- Exercises the protocol on existing signals (if registration fails for a 7b signal, something is structurally off and we want to know before shipping Round 9).

Retroactive registrations happen in the **Round 8 PR**, not in the P0 hardening PR — P0 is scoped to the 6 foundation fixes.

---

## 9 — Open questions (resolve before Round 8 opens)

1. **AST vs grep for lint?** AST catches `Object.assign(profile, ...)` disguises; grep is simpler. Recommendation: grep first (ships with Round 8), AST upgrade in Round 9 if grep produces false-negatives.
2. **Signal versioning.** When a signal's payload shape changes, do we bump the `name` or track a `version`? Recommendation: `name` changes (clean break, forces re-register + re-translate). Old signal deprecated through §7.
3. **Consumer type enum vs string.** Enum prevents typos; string is flexible for new consumer categories. Recommendation: enum; add new categories via PR review.

---

*This protocol is what prevents "we landed another signal and nobody noticed no one reads it" from recurring.*
