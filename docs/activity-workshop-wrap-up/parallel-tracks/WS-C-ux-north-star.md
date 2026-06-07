# WS-C: UX North Star

> **Purpose**: Produce the IA wireframe + visual reference library that anchors Phase 1.5 (UX prototype) and Phase 4 (UX overhaul). Without it, 7 weeks of Phase 4 builds unstyled shadcn cards.
> **Owner**: Tue (with frontend-design subagent — `document-skills:frontend-design` skill is available)
> **Estimated time**: 2–3 days
> **Output location**: `docs/activity-workshop-wrap-up/ux/north-star.md` + asset folder

---

## Paste this prompt into a fresh session

You are producing the **UX north star** for the Activity Workshop wrap-up. The plan named UX as the moat. Phase 4 has 7 weeks to ship it. This artifact is the design brief that prevents 7 weeks of unstyled cards.

### What to read first

1. `docs/activity-workshop-wrap-up/01-MASTER-PLAN.md` §4 — UX overhaul spec
2. `docs/activity-workshop-wrap-up/work-logs/forge-plan-review.md` — review finding B5 + A5
3. `tests/output/full-profile-14-harvard-2028-crochet.md` — the 3001-line markdown we're escaping
4. `docs/activity-workshop-wrap-up/exemplars/target-output.md` — IF WS-A is complete, this is what the UI must surface
5. Memory: `premium-website-pipeline.md` — premium aesthetic references already gathered
6. `.claude/commands/scroll-video-website.md` — adjacent premium-design knowledge

### What to produce

Three deliverables:

#### 1. Information Architecture wireframe (`ux/north-star.md`)

ASCII or markdown-rendered hierarchy showing the 4-level disclosure tree:

```
Level 1 — Executive Brief (≤300 words, always visible top)
  ├─ Competitive verdict + confidence
  ├─ Top-3 strengths (cited)
  └─ Top-3 actions (ranked, with "Open" button per action)

Level 2 — Activity Tiles (collapsed grid below brief)
  └─ Per tile: tier badge | headline strength | 1 action | "View detail" tap

Level 3 — Activity Detail (drawer/route from Level 2)
  ├─ Full Stage 2 teaching
  ├─ Description rewrite variants (3 model sentences)
  ├─ Tier explanation with citations
  └─ "Why this tier?" expandable
       └─ Level 4 — Evidence panel (quoted text, deep teaching, research backing)

Sidebar — Always-on chat surface
  ├─ Elicitation prompts when active
  ├─ Advice-trace ledger
  └─ "What about X?" focused re-analysis input
```

For each level: what data renders, what actions are available, what the loading/empty/error state looks like.

#### 2. Visual reference library (`ux/references/`)

Gather screenshots/links/notes from:
- **type.ai** — best-in-class essay writing UI (you cited it in memory)
- **CollegeVine** — competitor with outcomes visibility
- **Notion AI / Linear** — premium SaaS feel
- **Stripe Atlas / Vercel** — premium onboarding/dashboard patterns
- **High-touch counselor decks** — search for "college counselor portfolio review template" PDFs
- **Your own premium-website-pipeline assets** — if any aesthetic is already locked in

For each reference, capture:
- Screenshot or link
- 2-sentence note: "What we steal from this — what we don't"
- Specifically: typography hierarchy, color palette, density, action-orientation

Save as a manifest in `ux/references/manifest.md` listing all references with notes.

#### 3. Design brief (1-page, `ux/design-brief.md`)

The one-pager a designer/frontend engineer reads before writing code. Sections:
- **Tone**: 3 adjectives (e.g., "calm, decisive, premium" — not "playful, friendly, accessible")
- **Typography**: 1 display face, 1 body face, 1 mono face — name actual fonts
- **Color**: primary + accent + neutral palette (with hex codes if possible)
- **Density**: information-rich or sparse? Cite a reference.
- **Motion**: subtle or expressive? Examples.
- **Anti-patterns**: 5 things to never do ("never show a generic loading spinner — always show what's being analyzed by name")
- **The "feel" sentence**: "It should feel like ___" (one sentence)

### Quality bar

- IA wireframe must be testable: "Can a user reach Level 3 detail for activity 7 in ≤2 taps from Brief?"
- Every reference has a "what we steal" note — gathering is not the deliverable; curation is
- Design brief is decisive — no "we could go either way"
- Avoid "modern, clean, minimalist" generic UI vocabulary — those words are banned

### Output structure

```
docs/activity-workshop-wrap-up/ux/
├── north-star.md          (IA wireframe + level-by-level spec)
├── design-brief.md         (1-page tone/color/type)
└── references/
    ├── manifest.md         (annotated list)
    └── *.png / *.md        (screenshots or notes per reference)
```

### Bonus: clickable prototype

If time and tool allow: produce a static HTML prototype showing the Brief + one Activity Tile expanded to Detail. No backend wiring needed. Stored at `docs/activity-workshop-wrap-up/ux/prototype/`. This becomes the visual contract for Phase 4.

---

## Status

- [ ] Started
- [ ] References gathered
- [ ] IA wireframe drafted
- [ ] Design brief written
- [ ] Reviewed against `counselor-gap.md` waves
- [ ] Prototype shipped (bonus)
- [ ] Committed
