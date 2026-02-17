

## Drill-Down Interaction Pattern for Overview Tab

### Overview

Add a state-driven drill-down system to the Overview tab. Clicking certain sections replaces the tab content area with an expanded detail view. The score dashboard and tab bar remain visible. A "Back to Overview" link returns to the compact dashboard. All expanded view content is hard-coded mock data.

### New State

```text
expandedSection: string | null   -- null = compact dashboard, "spike" | "memorable" | "priority" | "narrative" = expanded view
expandedStrengths: number | null -- index of expanded strength bullet (inline toggle)
expandedOpps: number | null      -- index of expanded opportunity bullet (inline toggle)
```

### New Import

Add `ArrowRight` from lucide-react (already imported: `ArrowLeft`).

### Changes to Existing Sections (when expandedSection is null)

**3 Insight Cards** -- add click handler + hover affordance + arrow icon:
- Each card wraps in a `cursor-pointer hover:brightness-110 hover:scale-[1.01] transition-all duration-200` container
- Add `onClick={() => setExpandedSection('spike' | 'memorable' | 'priority')}` to each card's outer div
- Add a small `ArrowRight` icon (h-3 w-3, text-white/40) in the bottom-right corner of each card
- The existing carousel arrows need `e.stopPropagation()` so clicking them doesn't trigger drill-down

**Portfolio Narrative** -- add click handler:
- Wrap the narrative blockquote area in a clickable div with `cursor-pointer hover:brightness-110 transition-all duration-200`
- `onClick={() => setExpandedSection('narrative')}` on the outer wrapper
- Add a small `ArrowRight` icon after the narrative text
- The edit/variant controls need `e.stopPropagation()`

**Key Strengths bullets** -- inline expand on click:
- Each bullet becomes clickable with `cursor-pointer`
- On click, toggle `expandedStrengths` to show/hide 1-2 sentences of extra context below that bullet
- Use `transition-all duration-200` with `max-height` for slide-down animation
- Hard-coded extra context for each:
  - "Pioneer initiative...": "You founded the CS Club with no existing infrastructure, budget, or faculty sponsor. This kind of zero-to-one initiative is exactly what admissions committees at top schools look for."
  - "Clear CS spike...": "Your progression from self-teaching to ML research shows a sustained, deepening engagement with CS. The social impact angle makes it distinctive from typical CS applicants."
  - "Authentic first-gen...": "Being first-gen isn't just a demographic checkbox -- your activities authentically demonstrate how this background shaped your drive to build access and opportunity."

**Opportunities bullets** -- same inline expand pattern:
  - "Limited external recognition": "Your achievements are real but lack third-party validation. Competitions, publications, or community awards would give admissions committees concrete evidence to advocate for you."
  - "Some activities feel disconnected...": "The grocery store and farm jobs are valuable work experiences but their descriptions don't connect to your CS/social impact narrative. Reframe them to show transferable skills."

**Strategic Direction** -- add "See Full Action Plan" link:
- Add a `cursor-pointer` link at the bottom: "See Full Action Plan -->" styled as `text-xs text-blue-400 hover:text-blue-300` that sets `activeTab` to "action-plan"
- Note: Since Tabs uses `defaultValue` not `value`, we need to switch to controlled mode by changing to `value={activeTab}` and `onValueChange={setActiveTab}` with `activeTab` state initialized to `"overview"`

### Tab Controlled Mode

Change the `Tabs` component from `defaultValue="overview"` to `value={activeTab} onValueChange={(v) => { setActiveTab(v); setExpandedSection(null); }}`. Add `activeTab` state (default "overview"). This enables programmatic tab switching from "See Full Action Plan" links. Also reset `expandedSection` when switching tabs.

### Transition Wrapper

The entire `TabsContent value="overview"` content area will be wrapped in a conditional:

```text
if expandedSection is null:
  render compact dashboard (current content) with fade-in
else:
  render expanded detail view for that section with slide-in-from-right
```

Use CSS transitions: the compact view gets `animate-fade-in` and expanded views get a `translate-x` + opacity transition via inline styles or a simple wrapper div with `transition-all duration-300`.

### Expanded View: Spike (expandedSection === 'spike')

All content below is hard-coded mock data.

- "Back to Overview" link: `ArrowLeft` icon + text, `cursor-pointer text-white/60 hover:text-white text-sm`, onClick resets `expandedSection` to null
- Title: "Your Spike: Computer Science with Social Impact Focus" (text-lg font-bold)
- Two side-by-side cards (grid-cols-1 md:grid-cols-2):
  - "Depth": "Founded CS club from zero infrastructure, progressed to ML research -- shows sustained technical deepening over 2+ years"
  - "What Makes It Stand Out": "First-gen student building STEM access while working 20hrs/week -- most CS spikes come from resource-rich environments"
- "Supporting Activities" section with 3 small cards:
  - Card 1: "CS Club Founder" / "Demonstrates initiative and technical leadership from scratch" / "Elevates spike by showing you create infrastructure, not just use it"
  - Card 2: "ML Research Assistant" / "Validates technical depth through university-level work" / "Elevates spike by adding academic rigor to self-taught foundation"
  - Card 3: "Math Tutor" / "Teaching pattern reinforces mission of building access" / "Elevates spike by showing multiplier effect -- you don't just learn, you teach"
- "Complementary Breadth" section with 1 card:
  - Area: "Community Leadership" / Tags: "Grocery Store", "Farm Work" / Why: "Shows work ethic and real-world responsibility that grounds the technical spike in lived experience"

### Expanded View: Memorable (expandedSection === 'memorable')

All content below is hard-coded mock data.

- Back link (same pattern)
- Title: "What Sets You Apart"
- Highlighted quote block (bg-white/15, border-l-4 border-l-amber-400, italic): "First-gen student who turns resource scarcity into technical solutions"
- "Your Differentiators" bullet list (3 items):
  - "First-gen student who builds infrastructure, not just participates"
  - "Technical depth validated by university research partnership"
  - "Teaching pattern across multiple contexts shows multiplier mindset"
- "Your Strengths" bullet list (3 items):
  - "Authentic narrative rooted in personal experience"
  - "Clear progression from self-teaching to formal research"
  - "Every activity connects to a larger mission"
- "School Types That Fit" row of tag chips: "Research Universities", "Liberal Arts Colleges", "Tech-Forward Schools", "Schools Valuing Diversity"
- Competitive assessment paragraph: "Your profile is most competitive at schools that value initiative and authentic narratives over polished pedigree. Research universities will appreciate the ML work; liberal arts colleges will value the community-building angle. Your biggest gap is external validation -- competitions or publications would move you from 'promising' to 'proven'."

### Expanded View: Priority (expandedSection === 'priority')

All content below is hard-coded mock data.

- Back link
- Title: "Your Top Priorities"
- 3 immediate action cards (rounded-xl, bg-white/15, border, p-4):
  - Card 1: Bold title: "Quantify CS Club impact with specific metrics" / Impact: "Adding numbers (e.g., '12 members recruited, 3 workshops hosted, partnered with local library') transforms a good activity into a great one. Admissions officers need concrete evidence." / Tag: "CS Club"
  - Card 2: Bold title: "Strengthen research narrative with publication or presentation" / Impact: "Publishing your ML healthcare research or presenting at a student symposium adds third-party validation. This is the single highest-ROI action for your profile." / Tag: "ML Research"
  - Card 3: Bold title: "Rewrite work experience descriptions to connect to CS mission" / Impact: "Your grocery and farm jobs show grit, but currently read as disconnected. Frame them as 'problem-solving under resource constraints' to reinforce your core narrative." / Tag: "Work Experience"
- "Coming Up (1-3 Months)" section with 2 items:
  - "Apply to USACO or a regional hackathon" / Deadline: "Within 6 weeks"
  - "Draft a blog post or GitHub README documenting your CS Club's journey" / Deadline: "Within 8 weeks"
- "See Full Action Plan" button: styled as a `cursor-pointer` link/button that sets `activeTab` to "action-plan"

### Expanded View: Narrative (expandedSection === 'narrative')

All content below is hard-coded mock data.

- Back link
- Title: "Your Portfolio Story"
- Full pitch paragraph (the current narrative variant, editable with regenerate -- reuse existing narrative state/controls)
- "What Makes You Unique" paragraph: "You don't come from a school with a robotics lab or a CS department. You come from a school where you ARE the CS department. That's not a disadvantage -- it's your most compelling story. Every admissions reader will remember the student who built something from nothing."
- "Why Colleges Should Care" paragraph: "Colleges aren't just admitting a student -- they're admitting someone who will build communities on their campus. Your track record proves you don't wait for programs to exist; you create them. That's exactly the kind of student who thrives in college environments."
- "Character Traits" row of colored tag chips: "Resilient" (green), "Innovative" (blue), "Resourceful" (amber), "Builder" (purple)
- "Narrative Threads Preview" -- 2-3 cards:
  - Thread 1: "Building Access" / Tags: "CS Club", "Math Tutor", "ML Research" / "These activities form a coherent thread about creating opportunities where none existed"
  - Thread 2: "Technical Depth" / Tags: "CS Club", "ML Research" / "Shows progression from self-taught to university-validated technical skills"
  - Thread 3: "Work Ethic Under Constraint" / Tags: "Grocery Store", "Farm Work" / "Demonstrates grit and time management that contextualizes all other achievements"
- "Explore all narrative threads" button that sets `activeTab` to "your-story"

### What Stays the Same

- Score dashboard + expansion panel above tabs (always visible)
- Tab bar (always visible)
- Two-column workspace below
- All editor, chat, version history, credits logic

### Technical Details

| Area | Detail |
|------|--------|
| File | `src/pages/ActivityWorkshop.tsx` only |
| New state | `expandedSection`, `expandedStrengths`, `expandedOpps`, plus changing `Tabs` to controlled with `activeTab` |
| New import | `ArrowRight` from lucide-react |
| Tabs change | `defaultValue` to `value={activeTab} onValueChange={...}` for programmatic switching |
| Transition | Compact view: `animate-fade-in`. Expanded views: wrapper div with `transition-all duration-300` using opacity + translateX |
| e.stopPropagation | On carousel arrows and edit controls inside clickable cards/narrative |
| All mock data | Commented with `// ---- Hard-coded mock data: ...` per project conventions |
| Lines added | ~250-300 lines (4 expanded views + inline expand data + state) |
| Lines modified | ~30 lines (add click handlers, hover classes, arrow icons to existing sections) |

