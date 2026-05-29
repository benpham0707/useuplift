# PARKED

**This module is not active in production.** It holds 19K lines of Phase 4–11 UX spec-implemented logic that will be adapted — not rendered directly — when we wire backend pipeline output into the Essay Workshop UI.

- **Production route:** `/annotation-v2-demo` renders `src/pages/AnnotationV2Demo.tsx`, which uses `src/components/annotation-v2/` (the polished UI). **This directory is NOT imported by that route.**
- **Sub-demo routes** (`/annotation-v2-demo/foundation`, `/loading`, `/bloom`, etc.) DO import this directory — keep them as reference/regression harnesses until we're done adapting.
- **When you're ready to wire:** read `ADAPTER_GUIDE.md` next to this file.
- **Don't delete** without first reading the adapter guide — the hooks and types are load-bearing for future wiring.

## What's safe to adopt (copy into production path)

- `tokens.ts` + `workshop.css` (6-tier color system, easings, typography)
- `types/profile.ts` + `types/navigation.ts` (shape contracts)
- `fixtures/` (sample essay + mock SSE timeline)
- Every `use*.ts` / `use*.tsx` hook — they're UI-agnostic

## What's reference-only (rebuild in your visual system)

- `.tsx` render components in `panel/`, `list/`, `click/`, `orientation/`, `bloom/`, `loading/`, `nav/`

## What's middle-ground

- `editor/` — adopt wholesale if switching to TipTap, skip otherwise (but reuse `sentenceMapping.ts` logic)
