# FORGE_DEBATES: Direct Path vs Rethink Path -- ChatHeader Redesign

**Date**: 2026-04-05
**Scope**: ChatHeader.tsx redesign to surface 7 required elements within 448px max panel width

---

## AGENT A (Direct Path) -- Compressed Design

### Layout
- **Two-row layout**: Row 1 = Avatar + Name + SessionBadge + icon-only action buttons. Row 2 = EssaySwitcher + CoachingModeBadge, left-aligned with `pl-[42px]`
- Estimated header height: ~92px (current ~52px)

### Components
- `SessionBadge`: shadcn Badge component, animated green dot for "live", "Archived" text for archived, ~52px wide
- `CoachingModeBadge`: shadcn Badge with per-mode color map, null-returns for `first_encounter`, ~60-80px wide
- `HeaderIconButton`: 32x32 icon-only button wrapped in Radix Tooltip, focus-visible ring
- `COACHING_MODE_DISPLAY` and `ESSAY_TYPE_LABELS` lookup maps

### Width Budget
- Row 1: Avatar(34) + gap(8) + Name(48) + flex-1 spacer + SessionBadge(52) + History(32) + Settings(32) = ~206px fixed, ~218px spacer
- Row 2: pl-42 + EssaySwitcher(flex-1) + gap(8) + CoachingBadge(80) = fits in ~382px

### Props
- All optional with defaults: `essayType='common_app'`, `sessionStatus='live'`, `coachingMode=undefined`, `onHistoryClick`, `onSettingsClick`, `onEssaySwitch`, `onClose`

---

## AGENT B (Rethink Path) -- Compressed Design

### Layout
- **Single-row layout**: Avatar + Name block (Luna + dynamic subtitle) + EssaySwitcher + labeled action buttons
- Estimated header height: ~54px (virtually unchanged)

### Key Decisions
- Session status and coaching mode ABSORBED into the subtitle line (replaces "essay coach")
- Status dot rendered inline (green=live, Archive icon=archived)
- Labeled action buttons: icon + "History", icon + "Settings" (26px tall)
- Vertical divider removed (saves 9px)
- AnimatePresence on subtitle for mode transitions
- Popover on EssaySwitcher for dropdown

### Width Budget
- Avatar(34) + gap(8) + Name(46) + gap(8) + EssaySwitcher(flex-1, ~174px) + gap(4) + Actions(~150px) = 424px

### Props
- `essayType` and `sessionStatus` REQUIRED, callbacks optional

---

## REALITY VERIFICATION FINDINGS

### Finding A-LAYOUT-1
**Severity**: concern
**Issue**: Agent A's two-row layout increases header from ~52px to ~92px. The ChatPanel.tsx (line 122) has an absolutely positioned cloud valley `h-56` (224px) at the bottom, plus the input area. A 40px taller header directly reduces the visible message area. In an 800px tall ChatWidget, this leaves only ~484px for messages (vs 524px currently). Functionally fine but the scrollable area shrinks noticeably.
**Impact**: Real cost but not blocking. Vertical real estate is premium in a chat panel.

### Finding A-LAYOUT-2
**Severity**: fragile
**Issue**: Agent A's Row 2 uses `pl-[42px]` to align under the name block. This magic number depends on Avatar(34px) + gap(8px) = 42px. If the avatar size ever changes (currently hardcoded `width: 34, height: 34` in CoachAvatar), the alignment breaks silently. No way to enforce this coupling declaratively.
**Impact**: Works now but creates invisible coupling.

### Finding A-ICONS-1
**Severity**: deviation
**Issue**: Agent A specifies icon-ONLY action buttons with tooltips. The requirement says "labeled" for History and Settings. Icon-only with tooltip is a common pattern but does not meet the spec. A tooltip requires hover/delay and is invisible on mobile.
**Impact**: Does not satisfy requirement #6 ("History button (labeled)") and #7 ("Settings button (labeled)").

### Finding B-SUBTITLE-1
**Severity**: concern
**Issue**: Agent B absorbs session status AND coaching mode into the subtitle line. But the subtitle can only show one thing at a time. When `sessionStatus='archived'` AND `coachingMode='iteration_deep'`, which wins? The design says archived wins, but then the coaching mode is invisible in archived sessions. For live sessions, the coaching mode replaces "essay coach" -- so the user never sees "essay coach" after the first encounter phase.
**Impact**: Acceptable tradeoff. The subtitle is small text (8.5px) that most users don't read closely. The coaching mode IS more useful than a static "essay coach" label.

### Finding B-SUBTITLE-2
**Severity**: weak
**Issue**: Agent B removes the static "essay coach" identity text entirely. For new users who haven't seen Luna before, the header would show "Luna" + dynamic mode text. The identity anchor ("this is an essay coach") is lost.
**Impact**: Minor -- the entire context of the application makes it clear this is an essay coach. The branding is environmental.

### Finding B-POPOVER-1
**Severity**: premature
**Issue**: Agent B adds a Popover from `@/components/ui/popover` to the EssaySwitcher for real essay selection. But the current implementation has NO essay list data, no selection handler, and no state management for which essay is active. The Popover would be an empty shell. The current button with a chevron already communicates "switchable."
**Impact**: The Popover adds complexity for zero current functionality. The button shape should be preserved and the Popover can be added when the essay switching feature is actually built.

### Finding SHARED-CONSUMERS-1
**Severity**: critical
**Issue**: ChatHeader has exactly 2 consumers that both use `<ChatHeader />` with zero props:
  - `ChatPanel.tsx` line 105: `<ChatHeader />`
  - `ChatWidget.tsx` line 31: `<ChatHeader />`
Both are zero-prop calls. ANY new required props will break both consumers. Agent B making `essayType` and `sessionStatus` required would cause TypeScript errors in both files.
**Impact**: All new props MUST be optional with sensible defaults to avoid breaking consumers.

### Finding SHARED-CONSUMERS-2
**Severity**: verified
**Issue**: ChatWidget.tsx at line 31 uses `<ChatHeader />`. The file is a demo/playground component (`max-w-2xl`, 800px height, "Awaiting Input" placeholder). It passes `isAnalyzing` and `onReset` to ChatInput but NOT to ChatHeader. ChatHeader redesign props will need defaults that work for this demo context.
**Impact**: The worktree versions (agent-aad54784, agent-af7a4873) of ChatWidget.tsx pass `isAnalyzing` and `onReset` to ChatHeader, but the main branch version does not. We must code against the main branch version.

### Finding SHARED-BUTTON-1
**Severity**: verified
**Issue**: The shadcn Button component (`src/components/ui/button.tsx`) wraps every button in a `ClickSpark` component that adds a purple spark animation on click. Using shadcn Button for header action buttons would add spark effects on every History/Settings click. This is likely undesired for utility buttons.
**Impact**: Action buttons should use plain `<button>` elements (like the existing `ActionButton` component does), NOT shadcn Button.

### Finding SHARED-TYPES-1
**Severity**: verified
**Issue**: Both `EssayType` and `CoachingMode` types are importable from `src/services/essayIntelligence/profileTypes.ts`. EssayType = `'common_app' | 'supplement' | 'piq'`. CoachingMode = `'first_encounter' | 'revision_response' | 'iteration_deep' | 'architecture' | 'polish'`. Both are string literal unions, stable, and appropriate for prop types.
**Impact**: No issues. Import path is clean.

### Finding SHARED-MOTION-1
**Severity**: verified
**Issue**: `AnimatePresence` is imported from `motion/react` (NOT `framer-motion`) across 10+ files in the codebase. The import `{ motion, AnimatePresence } from 'motion/react'` is the established pattern.
**Impact**: No issues. Both designs correctly reference the package.

### Finding SHARED-LUCIDE-1
**Severity**: verified
**Issue**: All five lucide-react icons referenced by both designs exist: `History`, `Settings`, `FileText`, `ChevronDown`, `Archive`. Verified in node_modules. The codebase already uses lucide-react extensively (25+ components).
**Impact**: No issues. All icons are available.

### Finding SHARED-SHADCN-1
**Severity**: verified
**Issue**: All referenced shadcn components exist: `Badge` (`src/components/ui/badge.tsx`), `Tooltip` (`src/components/ui/tooltip.tsx`), `Popover` (`src/components/ui/popover.tsx`), `Button` (`src/components/ui/button.tsx`). Badge has `default`, `secondary`, `destructive`, `outline` variants. Tooltip uses Radix `@radix-ui/react-tooltip`. Popover uses `@radix-ui/react-popover` with Portal.
**Impact**: All available and functional.

---

## FORCED-CHOICE SYNTHESIS

### Layout Strategy: RETHINK (refined)
Agent B's single-row layout wins decisively. Zero vertical cost (54px vs 92px) is critical for a chat panel where every pixel of message area matters. The two-row approach (Agent A) is a 77% height increase for information that fits cleanly in a single row.

**Refinement**: Keep the single-row structure but preserve the existing visual grid spacing. Don't remove the vertical divider entirely -- it costs only 9px and provides a clean break between identity and navigation.

### Session Status Display: RETHINK
Agent B's approach of absorbing status into the subtitle is the right call at 448px. A separate 52px badge (Agent A) consumes 12% of the row for information that is almost always "live." The subtitle naturally accommodates both states and the green dot provides at-a-glance status.

### Coaching Mode Display: HYBRID
Neither design is ideal. Agent A's separate badge is too expensive (60-80px). Agent B's subtitle absorption works but makes the mode invisible when archived. **Decision**: Show coaching mode in the subtitle for live sessions (replacing "essay coach" with mode text). For archived sessions, show "Archived" in the subtitle. This is Agent B's approach, with the refinement that `first_encounter` shows "essay coach" as the default subtitle (preserving the identity text for new users).

### Action Buttons: RETHINK (refined)
Agent B's labeled buttons are correct per the requirements (labeled = text visible, not just tooltip). **Refinement**: Use compact labels -- `icon + "History"` and `icon + "Settings"` at 12px font, keeping buttons around 60-68px wide each. Use plain `<button>` elements (NOT shadcn Button, due to ClickSpark -- Finding SHARED-BUTTON-1).

### Essay Switcher: HYBRID
Keep the existing crafted visual shape from the current ChatHeader (it's carefully designed with gradients and shadows). Add typed props (`essayType: EssayType`). Keep the lucide FileText icon from Agent B instead of the custom SVG document glyph (simpler, consistent with codebase). Do NOT add Popover yet (Finding B-POPOVER-1 -- premature).

### Props Interface: DIRECT (refined)
Agent A's all-optional approach is correct per Finding SHARED-CONSUMERS-1. Both consumers call `<ChatHeader />` with zero props. All new props must be optional with defaults.

### Divider: HYBRID
Keep the vertical divider (contra Agent B's removal) but only between the identity block and the essay switcher. It costs 9px and provides visual structure. Remove the divider that Agent A doesn't mention (between action cluster items).

---

## Rejected Approaches

1. **Two-row layout** (Agent A): 40px vertical cost for separating elements that fit in one row. Chat panels need message area real estate.

2. **Icon-only action buttons** (Agent A): Requirements explicitly say "labeled." Tooltips are not labels -- they require hover and are invisible on mobile.

3. **Popover on EssaySwitcher** (Agent B): No essay list data exists yet. The button shape already communicates interactivity. Add Popover when essay switching is implemented.

4. **Required props** (Agent B): Would break both existing consumers that call `<ChatHeader />` with zero props.

5. **Remove vertical divider** (Agent B): The 9px cost is trivial and the visual separation between identity and navigation areas is worth it.

6. **shadcn Button for actions** (both indirectly): ClickSpark animation on utility buttons is inappropriate.

7. **Custom SVG document glyph** (current implementation): The handcrafted 10x10 SVG doc icon works but lucide FileText is simpler, matches codebase conventions, and is easier to maintain.

8. **Full ClickSpark-wrapped shadcn Badge** for session/coaching mode: Badges are display-only, not interactive. Using shadcn Badge is fine (no ClickSpark) but the extra div wrapper and variant system add weight for simple text display.

---
---

# FORGE_DEBATES Round 2: Progress Pulse + Cloud Avatar

**Date**: 2026-04-05
**Scope**: Adding essay progress tracking and cloud avatar to ChatHeader within 448px `max-w-md` panel
**User requirements** (quoted):
- "intuitive like from 72 -> 78 or points they're collecting"
- "keeps track of how much they have done and changed"
- "offers a suggested score improvement that our system think they will see"
- Makes them "engaged" and "evokes emotion"
- Shows "where their college is at right now like around T20 colleges level"

---

## AGENT A (Direct Path) -- Compressed Design

### Progress Pulse
- Separate pill element (~68px) between divider and essay switcher
- Phase short label (FND/ARC/CRT/POL/DST) + colored dot + momentum arrow
- Popover expansion: 240x180px with progress arc SVG, effectiveness band, competitive tier, momentum label
- `BAND_TO_TIER` map: masterful->Ivy/Elite, strong->Highly Selective, functional->Selective, developing->Competitive
- Momentum heuristic: `(transformativeCount*10 + significantCount*5 + moderateCount*2) / totalEdits`
- Props: `{ phase, avgEffectiveness, editStats, hasAnalysis }`

### Cloud Avatar
- SVG-based cloud path with filter blur
- Two dot-eyes with 4 mood states (idle/thinking/happy/listening)
- Happy blush (ellipse), breathing + bobbing via framer-motion
- Same 34px footprint, status dot preserved
- ~65 lines

### Trade-offs Acknowledged
- Pill consumes 68px, squeezing EssaySwitcher from ~166px to ~88px
- Phase abbreviations (FND, CRT) not immediately intuitive
- SVG path cloud untested at 34px

---

## AGENT B (Rethink Path) -- Compressed Design

### Progress = Cloud State (NO separate element)
- Cloud avatar IS the progress indicator -- no new width consumed
- `computeCloudState(vitals)` pure function maps EssayVitals to 14 visual parameters (hue, saturation, lightness, density, drift, wisps, glow, breathing range, sparkle)
- 5 phase atmospheres: foundation(gray-lavender) -> distinction(luminous gold-violet)
- Vitality modifies saturation/lightness, editing injects energy, transformative edits sparkle

### Cloud Avatar
- CSS-based: 3 overlapping `rounded-full` divs with radial gradients + blur(0.5px)
- Floating wisp particles (0-4 based on phase)
- NO face/eyes -- personality through physics (drift, density, color)

### Phase Subtitle
- Replaces "ESSAY COACH" with phase name in AnimatePresence crossfade

### Expansion
- Click cloud -> header expands by 28px showing transformative insight text
- No popover -- in-flow expansion

### Trade-offs Acknowledged
- 0px new width (all embedded)
- Cloud as data viz may be too subtle for students to notice
- No explicit score numbers or college tier labels
- No face -- personality through physics alone

---

## REALITY VERIFICATION FINDINGS

### Finding TYPES-1: ImprovementPhaseLevel EXISTS
**Severity**: verified
`profileTypes.ts:87`: `'foundation' | 'architecture' | 'craft' | 'polish' | 'distinction'`. Both designs reference correctly.

### Finding TYPES-2: EffectivenessBand EXISTS, BAND_TO_TIER does NOT
**Severity**: verified
`effectivenessBands.ts` has 6 bands (masterful/exceptional/strong/functional/developing/problematic) with `toEffectivenessBand()` converter. Agent A's `BAND_TO_TIER` is a novel mapping -- no code connects essay effectiveness to college tiers. However, `tierCalibration.ts` uses the same 6-tier hierarchy (Ivy/Elite -> Accessible) for academics, so the naming convention exists. The mapping is new but conceptually consistent.

### Finding TYPES-3: No pre-computed avgEffectiveness
**Severity**: concern
`ParagraphScoreMatrix.paragraphs[i].scores.effectiveness` exists (0-100 per paragraph) but no aggregate. Must be computed: `sum(paragraphs[i].scores.effectiveness) / paragraphs.length`. Both designs assume this value exists as a prop -- it must be derived.

### Finding TYPES-4: Edit stats exist in VersionTracker
**Severity**: verified
`StalenessAccumulator` in `versionTracker.ts:70-78` has `transformativeCount`, `significantCount`, `moderateCount`, `totalEdits`. Also serialized in `ProfileIndex.accumulatedStaleness` (`profileTypes.ts:1400-1408`). Agent A's momentum formula is viable.

### Finding TYPES-5: ImprovementPhase is richer than either design assumed
**Severity**: verified
`ImprovementPhase` (`profileTypes.ts:1428-1477`) has: `level`, `reasoning`, `focusAreas[]`, `deferredAreas[]`, `readinessAssessment` (LLM prose), `dimensionPhases[]`, `coachingLens`, `transition`, `nearBoundary`. The `readinessAssessment` is especially useful for the popover -- LLM-generated prose about how close the essay is to the next level.

### Finding AVATAR-1: Codebase uses CSS clouds, not SVG
**Severity**: verified
`ChatPanel.tsx:127-173` renders decorative clouds using overlapping `rounded-full` divs with blur. This is the established cloud technique. Agent B's approach matches this pattern. Agent A's SVG path is a novel technique with no precedent.

### Finding LAYOUT-1: 68px pill is too wide
**Severity**: concern
With Items 1-6 layout: Avatar(34) + Name(46) + Divider(9) + EssaySwitcher(flex-1) + Actions(129) = 218px fixed. EssaySwitcher gets ~206px. Adding 68px pill -> EssaySwitcher shrinks to ~138px. "Common App" needs ~125px minimum (icon+label+chevron+padding). Technically fits but is uncomfortable. A 48px badge is safer.

### Finding DATA-FLOW-1: No essay data flows to ChatHeader today
**Severity**: critical
ChatHeader takes ZERO props. Both designs require backend integration to surface EssayProfile data to the frontend. This is infrastructure work independent of the visual design.

### Finding POPOVER-1: shadcn Popover works via Portal
**Severity**: verified
`components/ui/popover.tsx` wraps Radix popover with Portal rendering. Zero layout impact on the header row. Enter/exit animations built in.

### Finding SCORE-PHILOSOPHY-1: effectivenessBands.ts discourages raw numbers
**Severity**: tension
The effectivenessBands module comment says: "a score of 71 vs 73 carries zero signal given LLM variance of 8-15 points." Showing `78` in the badge contradicts this philosophy. However, the user explicitly requested "72 -> 78" style display. User requirement wins -- the band context is provided in the popover to ground the number.

---

## FORCED-CHOICE SYNTHESIS (6 key decisions)

### 1. Score Display: HYBRID -- Explicit badge (Agent A) + ambient cloud (Agent B)

**Winner**: Agent A's explicit approach, refined to 48px badge.

**Why**: The user's words are unambiguous: "intuitive like from 72 -> 78", "where their college is at." This is a request for NUMBERS. Agent B's ambient approach (cloud saturation shifts) is elegant engineering but invisible to students. A 17-year-old seeing a slightly more saturated lavender cloud will not think "my essay improved 6 points." They will think "that's a purple blob."

**Refinement**: Badge shows `78 +6` (48px) instead of Agent A's full pill with phase abbreviation (68px). Phase moves to subtitle (from Agent B). The cloud color shift (Agent B) is a SECONDARY reinforcement: the number is what drives emotional engagement, the cloud vibe is subconscious atmospherics.

**Width math**: 48px badge + 8px gap = 56px. EssaySwitcher shrinks from ~182px to ~126px. Still fits "Common App" (~125px). Tight but workable.

### 2. College Tier: POPOVER detail (Agent A), not border tint (Agent B)

**Winner**: Agent A's explicit text, in a popover.

**Why**: "where their college is at right now like around T20 colleges level" -- this requires TEXT. "Your essay is competitive at Highly Selective schools (Northwestern, UCLA, UC Berkeley)" is the answer. A subtle border tint (Agent B) communicates nothing to a student who doesn't know the color-to-tier mapping.

**Refinement**: Use the SAME tier names as `tierCalibration.ts` (Ivy/Elite, Highly Selective, Very Selective, Selective, Competitive, Accessible) for cross-product consistency. The popover shows tier + school examples + band description.

### 3. Cloud Shape: CSS overlapping divs (Agent B)

**Winner**: Agent B.

**Why**: The codebase already uses this technique for the cloud valley in `ChatPanel.tsx:127-173`. `rounded-full` divs with `blur(0.5px)` and radial gradients are a proven pattern here. Agent A's SVG path is novel with no precedent. Consistency and maintainability favor Agent B.

### 4. Expansion: POPOVER (Agent A)

**Winner**: Agent A.

**Why**: Agent B's 28px header row expansion pushes all chat messages down on every click. In a chat interface, layout shifts are disruptive -- the user's scroll position changes. A Popover renders via Portal with zero layout impact. The shadcn Popover (`components/ui/popover.tsx`) is ready to use with enter/exit animations.

### 5. Cloud Personality: HYBRID -- Dot eyes (Agent A) + phase color (Agent B)

**Winner**: Two dot-eyes from Agent A. Phase-driven coloring from Agent B. No blush, no wisps.

**Why**: At 34px, Agent B's faceless cloud is indistinguishable from the decorative clouds in the chat valley. Two 2.5px dot-eyes are the minimum viable personality -- they transform a "blob" into a "character." Agent A's 4 mood states (idle/thinking/happy/listening) are over-specified -- simplified to 2: default (neutral) and thinking (dots shift Y during analysis).

Agent B's phase colors ARE used -- the cloud body shifts from gray-lavender (foundation) to gold-violet (distinction). This is the ambient layer that reinforces the explicit score.

Agent A's blush, wisp particles, and happy state are cut. At 34px these details are noise, not signal.

### 6. Subtitle: DYNAMIC phase name (Agent B), already in Items 1-6

**Winner**: Agent B, extended.

**Why**: Items 1-6 already implemented Agent B's dynamic subtitle. For Progress Pulse, the priority chain extends: `archived > coaching_mode > improvement_phase > "essay coach"`. When no coaching mode is active, the subtitle shows "craft phase" / "polishing" / "distinction". Foundation shows "essay coach" (calling out "foundation phase" to a new user is confusing -- it is the default state).

---

## Summary of Design Decisions

| Aspect | Agent A | Agent B | Decision |
|--------|---------|---------|----------|
| Score display | 68px pill with phase abbrev | Cloud color only | **HYBRID**: 48px number badge + cloud color |
| College tier | Text label in popover | Border tint | **Agent A**: Text in popover |
| Momentum | Popover detail | Cloud energy/drift | **HYBRID**: Popover text + cloud is secondary |
| Cloud shape | SVG path | CSS rounded-full divs | **Agent B**: CSS (matches codebase) |
| Cloud face | Dot eyes + blush + 4 moods | No face (physics only) | **HYBRID**: Dot eyes, 2 moods, no blush |
| Expansion | Popover (Portal) | Header row +28px | **Agent A**: Popover (no layout shift) |
| Subtitle | Static "essay coach" | Dynamic phase name | **Agent B**: Dynamic (from Items 1-6) |
| Phase display | Abbreviations (FND/CRT) | Subtitle text | **Agent B**: Full words in subtitle |

---

## Rejected Approaches

1. **Ambient-only progress (Agent B)**: User explicitly requested numbers ("72 -> 78"), college tier labels ("around T20 level"), and visible tracking. Ambient cloud color shifts are invisible to most users and fail all three requirements.

2. **68px progress pill (Agent A)**: Consumes too much width. EssaySwitcher drops to ~88px (Agent A's own measurement), making "Common App" + icon + chevron uncomfortable. 48px badge is the better compromise.

3. **SVG path cloud (Agent A)**: No precedent in codebase. The chat panel's cloud valley uses CSS `rounded-full` divs -- proven technique. SVG path requires custom drawing, filter tuning, and may alias differently across screens.

4. **Header row expansion (Agent B)**: Layout shift in a scrollable chat panel is disruptive. Every expansion pushes messages down and changes the user's scroll position. Portal-rendered Popover has zero layout cost.

5. **Full progress arc SVG (Agent A)**: A radial arc visualization for 5 data points is over-engineered. Text layout in a popover is more informative and 10x easier to maintain.

6. **Faceless cloud (Agent B)**: At 34px in a panel that already has decorative clouds (the valley), a faceless cloud blends in rather than standing out as a character. Two dot-eyes are the minimum viable identity.

7. **Phase abbreviations (Agent A)**: FND/ARC/CRT/POL/DST require learning. Full words in the subtitle and popover are immediately readable.

8. **Wisp particles (Agent B)**: At 34px, 1-4 floating wisps of 1-2px are visual noise. The phase color shift communicates the same information more clearly.

9. **4 mood states (Agent A)**: Idle/thinking/happy/listening is over-specified for 2.5px dots. Reduced to 2: neutral and thinking (slight Y offset during analysis). Happy and listening are not distinguishable at this scale.

10. **Raw 0-100 score display**: The effectivenessBands module was designed to avoid false precision ("71 vs 73 carries zero signal"). However, the user explicitly requested "72 -> 78" style feedback. The number drives emotional engagement ("I improved!") even if the precision is technically imperfect. The popover provides band context to ground the number honestly.
