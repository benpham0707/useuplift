

## Enrich Story + Spike Expanded Views

### Overview

Add three new sections to existing expanded views and enhance existing content in `src/pages/ActivityWorkshop.tsx`. All new content is hard-coded mock data with comments.

### Changes

**1. Narrative Expanded View -- Enrich Narrative Threads + Add "How Your Activities Boost Each Other"**

**a) Expand Narrative Thread synergy text** (lines 2034-2048)

Replace the 3 thread objects with longer synergy text (3-4 sentences each) and add a `whyAdmissions` field rendered as italic text below synergy:

- "Building Access": synergy: "These activities form a coherent thread about creating opportunities where none existed. The CS Club creates infrastructure, the tutoring provides direct mentorship, and the ML research applies technical skills to access problems. Together, they show a student who doesn't just notice gaps -- they systematically build bridges across them. This isn't scattered volunteering; it's a deliberate mission." / whyAdmissions: "Admissions officers look for students who will build community on campus. This thread proves you already do that instinctively."
- "Technical Depth": synergy: "Shows progression from self-taught to university-validated technical skills. Starting a CS club required learning enough to teach others; the ML research required learning enough to contribute to real science. Each step built on the last, creating a clear upward trajectory. The arc from 'curious beginner' to 'research contributor' is exactly the growth story top schools want to see." / whyAdmissions: "Technical depth with a clear growth arc signals a student who will thrive in rigorous college coursework."
- "Work Ethic Under Constraint": synergy: "Demonstrates grit and time management that contextualizes all other achievements. Working 20+ hours per week while maintaining academics and extracurriculars isn't just impressive -- it reframes every other activity. The CS club wasn't built with free time and parental support; it was built in the margins. The research wasn't a summer hobby; it was squeezed between shifts." / whyAdmissions: "Context matters enormously in holistic review. This thread transforms 'good activities' into 'remarkable achievements given circumstances.'"

**b) Add "HOW YOUR ACTIVITIES BOOST EACH OTHER" section** (insert after the Narrative Threads block, before the "Explore all narrative threads" button, ~line 2050)

Section header: "HOW YOUR ACTIVITIES BOOST EACH OTHER" (uppercase tracking-wider, same style as other section headers)

Render 5 elevation pair cards. Each card has:
- A header row with "Activity A -> Activity B" text (using a literal arrow character) on the left and a colored strength badge on the right
- Badge colors: "transformative" = `bg-purple-500/20 text-purple-300 border-purple-500/30`, "strong" = `bg-green-500/20 text-green-300 border-green-500/30`, "moderate" = `bg-blue-500/20 text-blue-300 border-blue-500/30`
- A mechanism paragraph below (text-xs text-white/70)

Hard-coded mock data for 5 pairs:
1. "Grocery Store -> ML Research" [transformative]: "Research while working 20hrs/week retail transforms the research from 'expected for MIT applicant' to 'remarkable given constraints.' The grocery work isn't a distraction -- it's proof this student operates at a high level under real pressure."
2. "ML Research -> CS Club" [strong]: "The CS club could read as 'nice local initiative.' But the research proves legitimate technical chops -- they weren't just teaching basics, they were building toward research-level competency."
3. "Farm Work -> ML Research" [strong]: "The research topic (rural healthcare access) could seem random. But farm work establishes authentic rural experience -- this isn't a suburban student doing 'poverty tourism' research. They're analyzing problems they've lived."
4. "CS Club -> Math Tutor" [moderate]: "Combined with founding a CS club teaching 25 students, tutoring establishes a pattern: this student is a natural educator who seeks teaching opportunities across contexts."
5. "Math Tutor -> CS Club" [moderate]: "Both show teaching/mentorship in different contexts. Together they prove this isn't 'I helped my friends' -- it's a deliberate pattern of educational leadership."

**2. Spike Expanded View -- Add spike strength badge + "PORTFOLIO COHERENCE" section**

**a) Add spike strength badge next to title** (line 1863)

Change the title line from plain text to include a badge:
```
"Your Spike: Computer Science with Social Impact Focus" + Badge("Moderate", blue styling)
```
Badge uses: `text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 ml-2`

**b) Add "PORTFOLIO COHERENCE" section** (insert after Complementary Breadth, before the closing `</div>` of the spike view, ~line 1902)

Section header: "PORTFOLIO COHERENCE" (uppercase tracking-wider)

Content:
- A row with a circular progress ring and assessment badge
  - The ring: a 64x64px SVG circle with `stroke-dasharray` and `stroke-dashoffset` to show 78/100 progress. Background circle in white/10, progress arc in blue-400. "78" text centered inside the SVG
  - Next to it: "Strong" badge in `bg-green-500/20 text-green-300 border-green-500/30` and a label "out of 100"
- "What Ties It Together" paragraph: "Your activities are connected by a clear through-line: identifying resource gaps and building technical solutions to fill them. Whether it's creating a CS club where none existed, researching healthcare access in underserved areas, or tutoring students who lack academic support, you consistently find places where something is missing and build the bridge."
- "Activities to Better Integrate" sub-section with 1 card:
  - "Grocery Store Associate" -- "Reframe around problem-solving under constraint and operational systems thinking to connect it to your builder identity."

### What Stays the Same

- All existing expanded view structure and back navigation
- Score dashboard, tab bar, two-column workspace
- All other expanded views (memorable, priority) unchanged

### Technical Details

| Area | Detail |
|------|--------|
| File | `src/pages/ActivityWorkshop.tsx` only |
| Spike view changes | Add badge at line 1863, add ~40 lines for coherence section after line 1901 |
| Narrative view changes | Expand thread synergy data (~line 2034), add ~50 lines for elevation pairs before line 2051 |
| New imports | None needed -- all icons already imported |
| SVG ring | Inline SVG with `stroke-dasharray="251.2"` (2 * pi * 40) and `stroke-dashoffset` calculated as `251.2 * (1 - 0.78)` |
| All mock data | Commented with `// ---- Hard-coded mock data: ...` per project conventions |
| Lines added | ~100 total |

