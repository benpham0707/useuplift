You are producing the **UX north star** for the Activity Workshop wrap-up. The plan named UX as the moat. Phase 4 has 7 weeks to ship it. This artifact is the design brief that prevents 7 weeks of unstyled shadcn cards (review finding A5 + B5).

## Read first (in order)

1. `docs/activity-workshop-wrap-up/01-MASTER-PLAN.md` §4 — UX overhaul spec
2. `docs/activity-workshop-wrap-up/work-logs/forge-plan-review.md` — findings A5 + B5 (UX context)
3. `tests/output/full-profile-14-harvard-2028-crochet.md` — the 3001-line markdown we're escaping
4. `docs/activity-workshop-wrap-up/exemplars/target-output.md` — IF WS-A is complete, this is what the UI must surface (read it; if missing, work from the plan's §2.1–§2.7 specs)
5. `/Users/tuepham/.claude/projects/-Users-tuepham-uplift-final-final-18698-62030/memory/premium-website-pipeline.md` — premium aesthetic references already collected
6. `.claude/commands/scroll-video-website.md` — adjacent premium-design knowledge

## Produce — three deliverables

### Deliverable 1: IA wireframe (`docs/activity-workshop-wrap-up/ux/north-star.md`)

Markdown-rendered hierarchy showing the 4-level disclosure tree:

```
Level 1 — Executive Brief (≤300 words, always visible top)
  ├─ Competitive verdict + confidence interval
  ├─ Top-3 strengths (cited to activities)
  └─ Top-3 actions (ranked, each with "Open" button)

Level 2 — Activity Tiles (collapsed grid below brief)
  └─ Per tile: tier badge | headline strength | 1 action | "View detail"

Level 3 — Activity Detail (drawer or route from L2)
  ├─ Full Stage 2 teaching
  ├─ Description rewrite variants (3 model sentences)
  ├─ Tier explanation with citations
  └─ "Why this tier?" expandable
       └─ Level 4 — Evidence panel (quoted text, deep teaching, research backing)

Sidebar — Always-on chat surface
  ├─ Elicitation prompts when active
  ├─ Advice-trace ledger ("We said X last time, now Y")
  └─ "What about X?" focused re-analysis input
```

For each level: what data renders, what actions exist, what loading/empty/error states look like. Testable: "Can a user reach Level 3 detail for activity 7 in ≤2 taps from Brief?"

### Deliverable 2: Visual reference library (`docs/activity-workshop-wrap-up/ux/references/`)

Gather screenshots/links/notes from:
- **type.ai** — best-in-class essay-writing UI
- **CollegeVine** — competitor with outcomes visibility
- **Notion AI / Linear** — premium SaaS feel
- **Stripe Atlas / Vercel** — premium onboarding/dashboard patterns
- **High-touch counselor decks** — search "college counselor portfolio review template" PDFs
- **Existing premium-website-pipeline assets** (per memory file) — any locked aesthetic to honor

For each reference:
- Screenshot or link
- 2-sentence note: "What we steal — what we don't"
- Specifically: typography hierarchy, color palette, density, action-orientation

Save manifest at `references/manifest.md` listing every reference with notes.

### Deliverable 3: Design brief (`docs/activity-workshop-wrap-up/ux/design-brief.md`, 1 page)

The one-pager a frontend engineer reads before writing code:
- **Tone**: 3 adjectives (e.g., "calm, decisive, premium" — NOT "playful, friendly, accessible")
- **Typography**: 1 display face, 1 body face, 1 mono — name actual fonts
- **Color**: primary + accent + neutral palette with hex codes
- **Density**: information-rich or sparse? Cite a reference.
- **Motion**: subtle or expressive? Examples.
- **Anti-patterns**: 5 things to never do ("never show a generic loading spinner — always show what's being analyzed by name")
- **The "feel" sentence**: "It should feel like ___" (one sentence)

## Quality bar

- IA wireframe is testable (state every navigation depth)
- Every reference has a "what we steal" note — curation, not just gathering
- Design brief is decisive — no "we could go either way"
- Banned words in design brief: "modern", "clean", "minimalist", "intuitive", "user-friendly". Be specific.

## Output structure

```
docs/activity-workshop-wrap-up/ux/
├── north-star.md          # IA wireframe + level-by-level spec
├── design-brief.md         # 1-page tone/color/type/anti-patterns
└── references/
    ├── manifest.md         # annotated list
    └── *.png / *.md        # screenshots or notes per reference
```

## Bonus

Static HTML prototype showing Brief + one Activity Tile expanded to Detail. No backend wiring. Stored at `docs/activity-workshop-wrap-up/ux/prototype/`. Becomes the visual contract for Phase 4 implementation.

Begin by reading the current output (file 3 above) and the target exemplar (file 4). The IA should faithfully surface the target exemplar's six sections, not invent new ones.
