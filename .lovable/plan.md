

## Visual Variety for Spike Expanded View

### Overview

Break the visual monotony of the Spike expanded view by mixing presentation styles: flowing text with accent borders for analytical paragraphs, horizontal rows with dividers for structured lists, a larger progress ring for scores, and amber-bordered cards for action items. Only keep glass cards for distinct category items (Complementary Breadth).

### Changes

**1. Depth + What Makes It Stand Out (lines 1868-1877) -- Cards to blockquote paragraphs**

Replace the 2-column card grid with two full-width stacked blockquote-style paragraphs:
- Remove `grid grid-cols-1 md:grid-cols-2 gap-3` wrapper and the two `rounded-xl border bg-white/15` card divs
- Each becomes a `border-l-4 pl-4 py-2 mb-3` block (no box, no background)
- "Depth" gets `border-l-teal-400`, "What Makes It Stand Out" gets `border-l-purple-400`
- Expand mock text to 3-4 sentences each:
  - Depth: "Founded CS club from zero infrastructure, progressed to ML research -- shows sustained technical deepening over 2+ years. You didn't just join existing programs; you created the foundation others now build on. The progression from teaching yourself to teach others, then to contributing at a university level, demonstrates exactly the kind of intellectual trajectory top schools look for. This isn't a checkbox activity -- it's a genuine arc of deepening mastery."
  - What Makes It Stand Out: "First-gen student building STEM access while working 20hrs/week -- most CS spikes come from resource-rich environments. Your spike stands out precisely because it was built under constraints that would stop most applicants. While other CS applicants had summer camps, tutors, and school resources, you built your own. That context transforms a 'good CS profile' into a genuinely distinctive one that admissions officers will remember."

**2. Supporting Activities (lines 1878-1893) -- Card grid to horizontal rows**

Replace the 3-column card grid with horizontal rows separated by dividers:
- Remove `grid grid-cols-1 md:grid-cols-3 gap-3` and the card divs
- Each activity becomes a horizontal flex row: bold name on left (flex-shrink-0, w-[140px]), support text in middle (flex-1), italic elevation on right (flex-shrink-0, max-w-[240px])
- `divide-y divide-white/10` on the container for subtle divider lines
- Each row gets `py-3` padding
- Expand "support" text to 2 sentences each:
  - CS Club Founder: "Demonstrates initiative and technical leadership from scratch. Building something from nothing -- no budget, no faculty sponsor, no precedent -- is the strongest possible evidence of entrepreneurial drive."
  - ML Research Assistant: "Validates technical depth through university-level work. Moving from self-taught to contributing real research proves your skills are genuine, not just hobbyist-level."
  - Math Tutor: "Teaching pattern reinforces mission of building access. The fact that you seek out teaching roles in multiple contexts shows this isn't resume padding -- it's a core part of who you are."

**3. Complementary Breadth (lines 1895-1906) -- Keep as-is**

No changes. Glass card style is appropriate for distinct category items.

**4. Portfolio Coherence (lines 1908-1935) -- Larger ring + amber action cards**

- **Ring**: Change SVG from `width="64" height="64"` to `width="80" height="80"`. Move "Strong" badge directly below the ring (centered) instead of beside it. Remove "out of 100" label or make it part of the badge area below ring.
- **What Ties It Together**: Give the paragraph more breathing room -- `text-sm` instead of `text-xs`, `leading-relaxed`, `mt-3`
- **Activities to Better Integrate card**: Replace `border-white/20 bg-white/10` with `border-l-4 border-l-amber-400 bg-amber-500/5 border border-amber-500/20` to signal "action needed" visually (matching the opportunities amber style)

### What Stays the Same

- Back navigation, title with Moderate badge
- All other expanded views (memorable, priority, narrative) unchanged
- Score dashboard, tab bar, two-column workspace

### Technical Details

| Area | Detail |
|------|--------|
| File | `src/pages/ActivityWorkshop.tsx` only |
| Lines modified | 1868-1877 (depth/standout), 1878-1893 (supporting activities), 1912-1933 (coherence) |
| Lines added | ~15 net (longer mock text, row layout slightly more verbose) |
| No new imports | All styling is Tailwind classes |
| Mock data comments | All blocks retain `// ---- Hard-coded mock data: ...` comments |

