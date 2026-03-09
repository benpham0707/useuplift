Research complete. Here is the full design for the three new registries, following the existing patterns exactly.

---

## Pattern Summary (from existing code)

- Registry class: `private Map<string, Manifest>`, singleton export, `register()` throws on duplicate, `getAll()`, `autoImport()` with glob pattern, `_reset()` for tests
- Manifests: self-register at module scope via `import { registry } from '../registry/...'` + `registry.register(manifest)` at bottom
- autoImport: scans directory for `*.{type}.ts` files, imports each, idempotent
- Types live in `src/workshop/shared/types.ts` (to be extended)

---

## 1. WritingStrategyRegistry

### File: `src/workshop/registry/strategyRegistry.ts`

```typescript
/**
 * Writing Strategy Registry — Self-registering writing strategy manifest system
 *
 * Strategies register themselves by calling strategyRegistry.register()
 * at module scope. The registry auto-discovers all *.strategy.ts files
 * in the strategies/ directory at startup.
 *
 * Usage:
 *   // In a strategy file (e.g., montage-technique.strategy.ts):
 *   import { strategyRegistry } from '../registry/strategyRegistry';
 *   strategyRegistry.register({ id: 'montage_technique', ... });
 *
 *   // To query:
 *   const s = strategyRegistry.getStrategy('zoom_lens');
 *   const forType = strategyRegistry.listByEssayType('personal_statement');
 */

import { StrategyManifest, WorkshopEssayType } from '../shared/types';

class WritingStrategyRegistry {
  private strategies = new Map<string, StrategyManifest>();
  private initialized = false;

  register(manifest: StrategyManifest): void {
    if (this.strategies.has(manifest.id)) {
      throw new Error(
        `[WritingStrategyRegistry] Duplicate strategy ID: '${manifest.id}'. Each strategy must have a unique ID.`
      );
    }
    this.strategies.set(manifest.id, manifest);
  }

  getStrategy(id: string): StrategyManifest | undefined {
    return this.strategies.get(id);
  }

  getAll(): StrategyManifest[] {
    return Array.from(this.strategies.values());
  }

  listByEssayType(essayType: WorkshopEssayType): StrategyManifest[] {
    return Array.from(this.strategies.values()).filter(s =>
      s.bestFor.includes(essayType)
    );
  }

  get size(): number {
    return this.strategies.size;
  }

  async autoImport(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    try {
      const fs = await import('fs');
      const path = await import('path');
      const strategiesDir = path.join(__dirname, '..', 'strategies');

      if (!fs.existsSync(strategiesDir)) return;

      const files = fs.readdirSync(strategiesDir).filter(
        f => f.endsWith('.strategy.ts') || f.endsWith('.strategy.js')
      );

      for (const file of files) {
        try {
          await import(path.join(strategiesDir, file));
        } catch (err) {
          console.error(`[WritingStrategyRegistry] Failed to import ${file}:`, err);
        }
      }
    } catch (err) {
      console.error('[WritingStrategyRegistry] Auto-import failed:', err);
    }
  }

  _reset(): void {
    this.strategies.clear();
    this.initialized = false;
  }
}

/** Singleton writing strategy registry */
export const strategyRegistry = new WritingStrategyRegistry();
```

### Type additions to `src/workshop/shared/types.ts`

```typescript
// ============================================================================
// WRITING STRATEGY MANIFEST
// ============================================================================

/** A teaching example demonstrating a writing strategy in action */
export interface StrategyExample {
  /** Short title identifying what this example shows */
  title: string;
  /** Brief excerpt from a real or illustrative essay */
  excerpt: string;
  /** Analysis explaining how the strategy is used in this excerpt */
  analysis: string;
}

/** Teaching content for a writing strategy */
export interface StrategyTeaching {
  /** Clear, jargon-free explanation of what this strategy is */
  explanation: string;
  /** When and why to use this strategy */
  howToUse: string;
  /** Common mistakes or misapplications to avoid */
  pitfalls: string[];
}

/** Detection signals for identifying this strategy in text */
export interface StrategyDetection {
  /** Language/structural signals that suggest this strategy is in use */
  signals: string[];
  /** Proportion of signals that must match (0-1) to flag the strategy as detected */
  threshold: number;
}

/** Defines a named writing strategy with teaching content and detection logic */
export interface StrategyManifest {
  /** Unique strategy ID, e.g. 'montage_technique' */
  id: string;

  /** Human-readable name */
  displayName: string;

  /** One-line description of the strategy */
  description: string;

  /** Which essay types this strategy is most effective for */
  bestFor: WorkshopEssayType[];

  /** How to detect whether this strategy is (or should be) applied */
  detection: StrategyDetection;

  /** Teaching content for this strategy */
  teaching: StrategyTeaching;

  /** Illustrative examples showing the strategy in action */
  examples: StrategyExample[];
}
```

### Manifest files

#### `src/workshop/strategies/montage-technique.strategy.ts`

```typescript
/**
 * Strategy: Montage Technique
 *
 * Juxtaposes distinct scenes or vignettes without linear connective tissue.
 * Each fragment illuminates a facet of the writer's identity, and the
 * accumulation creates meaning greater than any single scene.
 */

import { strategyRegistry } from '../registry/strategyRegistry';
import type { StrategyManifest } from '../shared/types';

const manifest: StrategyManifest = {
  id: 'montage_technique',
  displayName: 'Montage Technique',
  description: 'Juxtapose distinct scenes or vignettes so their accumulation reveals character.',

  bestFor: ['personal_statement', 'uc_piq', 'identity_background'],

  detection: {
    signals: [
      'Multiple scene breaks with white space or horizontal rule',
      'Three or more distinct temporal or spatial settings within 650 words',
      'No explicit transition between scenes (no "then", "after that", "next")',
      'Each paragraph functions as a self-contained unit',
      'Closing paragraph synthesizes or echoes the opening fragment',
    ],
    threshold: 0.6,
  },

  teaching: {
    explanation: `The montage technique assembles meaning the way a film editor cuts between shots — not through narrative continuity, but through resonance. You place three or four distinct moments side by side, and the reader's mind does the work of connecting them. The essay does not need to explain how the scenes relate; the juxtaposition IS the argument.`,

    howToUse: `Choose three to five moments that each capture a different facet of the same core truth about you. They don't need to be chronological. They don't need to be about the same activity. What links them is the underlying quality, question, or tension you are exploring. Open with your most visually specific scene. Close with one that recontextualizes the earlier fragments. Let white space do the work of transition. Trust the reader.`,

    pitfalls: [
      'Explaining the connection between scenes explicitly — the montage works only if the juxtaposition speaks for itself',
      'Choosing scenes that are too similar — they should illuminate different facets, not repeat the same point',
      'Using more than five scenes in 650 words — each needs enough space to land; three or four is optimal',
      'Weak closing that summarizes rather than resonates — the final fragment should feel like a revelation, not a recap',
      'Scenes that are chronologically sequential — montage is not a timeline, it is a collage',
    ],
  },

  examples: [
    {
      title: 'Three-scene identity montage',
      excerpt: `Age seven: I press my ear to the kitchen door and count the rising tones of my grandmother's Cantonese.
      
Age fourteen: I conjugate Spanish verbs in my head while my teacher speaks, a private translation loop running beneath the lesson.

Age seventeen: I type a Unicode character my phone doesn't recognize, then spend forty minutes building a font patch so it will.`,
      analysis: `Three scenes, zero connective tissue. Each reveals the same quality — an obsessive attention to systems of meaning — through a different domain (oral, written, digital). The essay never says "I love languages" or "I am a systems thinker." The scenes say it together, by accumulation.`,
    },
    {
      title: 'Before-and-after montage with tonal contrast',
      excerpt: `The trophy case had a light that buzzed. I used to count the bulbs — twelve, always twelve — while Coach talked about dedication.

The storage room where we kept the broken trophies had no light at all. I found that out the day I was cut.

The math team classroom has a window that faces east. I do my best work in the hour before anyone else arrives.`,
      analysis: `The three scenes form an arc without narrating it: pride, defeat, reinvention. The writer does not write "I learned resilience." Instead, the choice to end in the math classroom — a quiet, forward-facing space — enacts it. The detail of the east-facing window is the essay's thesis, disguised as an image.`,
    },
  ],
};

strategyRegistry.register(manifest);
```

#### `src/workshop/strategies/zoom-lens.strategy.ts`

```typescript
/**
 * Strategy: Zoom Lens
 *
 * Opens at narrative distance then progressively zooms into a single
 * charged micro-moment. Achieves intimacy by contrasting scale.
 */

import { strategyRegistry } from '../registry/strategyRegistry';
import type { StrategyManifest } from '../shared/types';

const manifest: StrategyManifest = {
  id: 'zoom_lens',
  displayName: 'Zoom Lens',
  description: 'Open at distance and progressively narrow to one charged micro-moment.',

  bestFor: ['personal_statement', 'challenge_adversity', 'community', 'identity_background'],

  detection: {
    signals: [
      'Opening paragraph establishes broad context or pattern ("For three years...", "Every Saturday...")',
      'Second or third paragraph suddenly narrows to a single specific date, time, or moment',
      'Sensory detail density increases sharply in the second half of the essay',
      'Time slows — what takes one sentence at the start takes a paragraph later',
      'One moment is described in much greater granularity than the rest',
    ],
    threshold: 0.5,
  },

  teaching: {
    explanation: `The zoom lens essay establishes a wide frame — a pattern, a context, a recurring experience — then crashes into a single moment with extreme specificity. The contrast in scale creates emotional impact. The reader understands the stakes from the wide frame, then lives inside one crystallizing instant.`,

    howToUse: `Open with the general pattern: how often this happened, what it usually looked like, the emotional landscape. Then cut to one specific instance — a single morning, a single conversation, a single decision. Zoom in on the sensory details of that moment until time effectively slows. The reflection that follows carries the weight of both the single moment and the pattern it belongs to.`,

    pitfalls: [
      'Spending too long in the wide frame — the zoom should begin by paragraph two',
      'Forgetting to zoom all the way — stop at a single date, then a single hour, then a single breath if you can',
      'Using the same level of detail throughout — the contrast between wide and narrow IS the technique',
      'Zooming into a moment that is not sufficiently charged — the micro-moment must hold the essay\'s emotional weight',
      'Ending at the zoomed-in moment without pulling back — you need a brief final beat that re-establishes meaning',
    ],
  },

  examples: [
    {
      title: 'From pattern to crystallizing instant',
      excerpt: `Every Thursday for two years, I translated at my mother's doctor appointments. Insurance forms, medication instructions, discharge summaries — I had become fluent in the grammar of medical bureaucracy before I was fluent in chemistry.

Then came November 14th. The oncologist used the word "malignant" and paused, and I felt the three-second gap before my mother looked at me, and I understood that the next words I spoke would be the ones she would remember for the rest of her life.`,
      analysis: `The wide frame establishes the pattern (two years of translation) and the student's competence. The zoom lands on a single three-second pause — an almost absurdly compressed unit of time — which now carries the weight of everything that came before. "The next words I spoke" lands with enormous force because the wide frame earned it.`,
    },
    {
      title: 'Place-based zoom from community to corner',
      excerpt: `My neighborhood has forty-seven murals. I counted them one summer when I had nothing but time and a cheap camera.

But the one I kept coming back to was the unfinished one on Clement Street — three figures, no faces, a door that opened onto blank white wall. I would sit on the curb across from it and eat my lunch and wonder what the artist was afraid to paint.`,
      analysis: `Forty-seven murals narrows to one, then narrows further to a single door in a single mural. The zoom reveals character: this is someone who looks hard at incomplete things, who wonders about absence. All of that comes from the telescoping focus, not from the writer stating it.`,
    },
  ],
};

strategyRegistry.register(manifest);
```

#### `src/workshop/strategies/bracket-structure.strategy.ts`

```typescript
/**
 * Strategy: Bracket Structure
 *
 * Opens and closes with the same image, phrase, or scene — but the
 * second appearance carries new meaning earned by the essay's journey.
 */

import { strategyRegistry } from '../registry/strategyRegistry';
import type { StrategyManifest } from '../shared/types';

const manifest: StrategyManifest = {
  id: 'bracket_structure',
  displayName: 'Bracket Structure',
  description: 'Frame the essay by returning to the opening image at the close — but transformed.',

  bestFor: ['personal_statement', 'uc_piq', 'challenge_adversity', 'community'],

  detection: {
    signals: [
      'Closing paragraph echoes language or imagery from the opening paragraph',
      'Same physical object, place, or action appears at both ends of the essay',
      'Final line is a direct callback to the first sentence',
      'The repeated image uses subtly different language the second time',
      'Essay body explicitly changes the reader\'s understanding of the opening image',
    ],
    threshold: 0.4,
  },

  teaching: {
    explanation: `The bracket structure (sometimes called "bookending") opens and closes with the same image, scene, or phrase — but the return landing creates new meaning. The reader experiences the opening, travels through transformation or insight, and arrives at the identical frame with completely changed understanding. The ending is the same as the beginning, and nothing like it.`,

    howToUse: `Identify the image or moment you want to use as your bracket. Open with it in a way that raises a question or creates a mood. Build the body of the essay as a journey that answers that question or earns a different emotional relationship to that image. Close by returning to the same image — but now with the reader's understanding fundamentally changed. The second appearance should feel like a key turning in a lock.`,

    pitfalls: [
      'Making the return too literal — copying the opening word-for-word suggests the essay didn\'t move anywhere',
      'Leaving the reader to do all the recontextualization — give a small signal that you know the world has changed',
      'Choosing an opening image that cannot be transformed by the essay\'s journey',
      'Ending with "I realized that the X I had always known was really Y" — the bracket works by showing, not explaining the shift',
      'Using the bracket as a shortcut when the essay body hasn\'t actually earned the reframing',
    ],
  },

  examples: [
    {
      title: 'Object-based bracket: a broken metronome',
      excerpt: `Opening: The metronome on the piano had been broken since 1987. My grandmother said it kept perfect time; she just didn't need to hear it anymore.

[Essay body: learning that grandmother escaped Cambodia with nothing, that the metronome was one of three objects she brought, that "perfect time" was her private joke — it measured the beats of survival, not music.]

Closing: I wind the metronome now when I practice. It doesn't tick. But I understand, finally, what she meant about perfect time.`,
      analysis: `The broken metronome opens as a mysterious detail. After learning its history, the same object closes the essay completely transformed. "Perfect time" means something entirely different in the final line. The bracket has done its work: same words, opposite meaning.`,
    },
    {
      title: 'Action-based bracket: filling a form',
      excerpt: `Opening: I filled in the box marked "Race" by leaving it blank. I had done this on every form since I was twelve.

[Essay body: discovering family history across three countries, interviewing grandmother, finding that no single box held the answer.]

Closing: The next form I filled in, I wrote across the box in small letters: "See attached." I had finally found something true enough to submit.`,
      analysis: `The blank box opens as a small rebellion the reader doesn't fully understand. The essay earns the closing action — "see attached" — by making us understand what the blank was protecting and what would now fill it. Same gesture, opposite meaning.`,
    },
  ],
};

strategyRegistry.register(manifest);
```

#### `src/workshop/strategies/extended-metaphor.strategy.ts`

```typescript
/**
 * Strategy: Extended Metaphor
 *
 * Sustains a single metaphor or controlling image across the entire essay,
 * with each section adding a new dimension to the same comparison.
 */

import { strategyRegistry } from '../registry/strategyRegistry';
import type { StrategyManifest } from '../shared/types';

const manifest: StrategyManifest = {
  id: 'extended_metaphor',
  displayName: 'Extended Metaphor',
  description: 'Sustain one controlling image across the entire essay, adding new dimensions to it.',

  bestFor: ['personal_statement', 'intellectual_vitality', 'identity_background', 'uc_piq'],

  detection: {
    signals: [
      'Same tenor and vehicle appear in multiple paragraphs',
      'Vocabulary from a single conceptual domain (cooking, architecture, code, music) threads throughout',
      'Transitions reference the metaphor rather than narrative chronology',
      'The essay\'s reflective conclusion is expressed through the metaphorical frame',
      'Title or opening sentence establishes the metaphorical vehicle explicitly',
    ],
    threshold: 0.5,
  },

  teaching: {
    explanation: `An extended metaphor commits to one controlling comparison and develops it across the essay's full length. Each section discovers a new way the comparison holds — or a way it productively breaks down. The metaphor becomes a lens that lets the writer illuminate something personal through something concrete. The reader understands the subject better by understanding the vehicle.`,

    howToUse: `Choose a vehicle (the thing you're comparing to) that has genuine complexity — something you know well enough to find unexpected angles in. Establish it clearly early. Then, as the essay moves through its narrative or argument, keep returning to the vehicle and discovering new dimensions: where does the comparison extend? Where does it break? A metaphor that breaks interestingly is often more powerful than one that holds perfectly. The conclusion should circle back to the vehicle with a final insight about both the vehicle and yourself.`,

    pitfalls: [
      'Forcing the metaphor to work in every sentence — readers notice when comparisons strain; use it at key structural moments',
      'Choosing a vehicle too abstract to generate concrete imagery (e.g., "a journey" is a metaphor about metaphors)',
      'Explaining the metaphor too explicitly — "like a bridge, I connect people" — trust the comparison',
      'Losing the vehicle for three paragraphs and then forcing it back — the thread must be visible throughout',
      'Selecting a cliche vehicle: bridges, journeys, tapestries, puzzles, seeds. Choose something specific to your experience.',
    ],
  },

  examples: [
    {
      title: 'Code debugging as self-revision',
      excerpt: `My first program had forty-seven errors. The compiler, merciless as any editor, returned them all at once.

I learned to read error messages the way I now read my own drafts — not with dread, but with something like curiosity. Every segmentation fault told me exactly where my thinking had slipped. Every null pointer exception named the assumption I had made without checking.

The code compiles now. Most of it. The parts that still break are the interesting parts — the places where I'm still making assumptions I haven't named yet.`,
      analysis: `Code debugging becomes a metaphor for self-knowledge. The vehicle (compiler, error messages, segfaults) remains consistent across all three paragraphs. The shift from "merciless" to "curious" in paragraph two is the essay's growth arc. "Parts that still break" in the close transforms the vehicle from describing the past to describing the ongoing self.`,
    },
    {
      title: 'Sourdough starter as intellectual persistence',
      excerpt: `Sourdough starter requires daily feeding or it dies. Miss a day and you come back to a gray, deflated mass that smells like regret.

My Arabic study looked similar after my sophomore year — a gray, deflated journal with three weeks of missed entries. I almost threw it away.

I kept feeding both. The starter recovered; so did my Arabic. What I didn't expect was that both got stronger from the near-death: the bacteria more acidic, the vocabulary more precise. Neglect, it turns out, is useful if it doesn't kill you.`,
      analysis: `The sourdough starter (a remarkably specific and non-cliche vehicle) maps cleanly to the Arabic study without being explained. "Gray, deflated mass that smells like regret" does double duty — describing both the starter and the abandoned study. The close discovers a new dimension: near-death as catalyst. The metaphor has done what a good metaphor does — revealed something true that couldn't be said directly.`,
    },
  ],
};

strategyRegistry.register(manifest);
```

#### `src/workshop/strategies/in-medias-res.strategy.ts`

```typescript
/**
 * Strategy: In Medias Res
 *
 * Drops the reader into the middle of action or high tension,
 * then supplies context. Maximizes immediate engagement by withholding
 * orientation until the reader is already invested.
 */

import { strategyRegistry } from '../registry/strategyRegistry';
import type { StrategyManifest } from '../shared/types';

const manifest: StrategyManifest = {
  id: 'in_medias_res',
  displayName: 'In Medias Res',
  description: 'Drop into the middle of a scene; supply context only after the reader is hooked.',

  bestFor: [
    'personal_statement',
    'challenge_adversity',
    'community',
    'why_us',
    'activity_to_essay',
  ],

  detection: {
    signals: [
      'First sentence contains an action verb in past tense with no orienting context',
      'Opening has no "I was..." or time-stamping preamble',
      'Names, places, or technical terms appear in the opening without introduction',
      'Second or third paragraph provides retrospective context for the opening scene',
      'Opening raises immediate questions that the essay then answers',
    ],
    threshold: 0.5,
  },

  teaching: {
    explanation: `In medias res (Latin: "into the middle of things") opens in the midst of action, with no preamble, no context, no "I would like to tell you about the time..." The reader arrives mid-scene and must orient themselves as the essay provides context. The disorientation is intentional: it creates a question ("what is happening?") and a reader who needs to read on to answer it.`,

    howToUse: `Find the most charged moment in your story — the instant of highest tension, most revealing choice, or most unexpected image. Open there, with no setup. Name the specifics: who is present, what is happening, what sensory detail anchors you in the scene. Do not explain. Let the reader be confused for one paragraph. Then begin supplying context naturally, as if answering the reader's implicit questions. By the time context arrives, the reader is already invested.`,

    pitfalls: [
      'Opening with a scene so confusing that the reader is lost rather than intrigued — one sentence of grounding (a name, a place, an object) prevents confusion',
      'Providing context too slowly — if the essay remains disorienting past paragraph two, the reader abandons',
      'Choosing a scene that is exciting but not revealing — the opening moment should tell us something essential about you, not just create action',
      'Starting in medias res then explaining what happened in linear order — the technique works when context is woven in, not dumped afterward',
      'Using in medias res as an excuse to skip providing any reflection — the essay still needs to mean something',
    ],
  },

  examples: [
    {
      title: 'Mid-crisis opening: robotics competition',
      excerpt: `The motor controller was overheating and we had forty seconds left.

I had rehearsed this exact scenario in my head for six months, building mental models of every failure mode. None of my models included the team lead leaving for the bathroom when the circuit fried.

So I made the call myself.`,
      analysis: `Zero setup. No "During my junior year, I was on the robotics team..." The reader arrives in a crisis and must piece together the context from the details. "Motor controller," "forty seconds," "circuit fried" tell us the domain without explanation. The short third sentence — "So I made the call myself." — is the essay's thesis, landing before we know enough to anticipate it.`,
    },
    {
      title: 'Mid-conversation opening: identity moment',
      excerpt: `"You don't look Indian," she said.

I had heard this before. What I hadn't decided yet was what to do with it.

That was the question I spent the next three years trying to answer — not "what do I look like?" but "who decides?"`,
      analysis: `Opens on dialogue mid-exchange, with no introduction to the speaker, context, or situation. The reader's immediate question ("who is she? what happened?") propels them into the essay. The pivot in paragraph three — "not what do I look like, but who decides?" — arrives as a revelation because the reader is already inside the experience.`,
    },
  ],
};

strategyRegistry.register(manifest);
```

---

## 2. EssayPatternRegistry

### File: `src/workshop/registry/patternRegistry.ts`

```typescript
/**
 * Pattern Registry — Self-registering essay pattern manifest system
 *
 * Patterns register themselves by calling patternRegistry.register()
 * at module scope. The registry auto-discovers all *.pattern.ts files
 * in the patterns/ directory at startup.
 *
 * Usage:
 *   // In a pattern file (e.g., action-opening.pattern.ts):
 *   import { patternRegistry } from '../registry/patternRegistry';
 *   patternRegistry.register({ id: 'action_opening', ... });
 *
 *   // To query:
 *   const p = patternRegistry.getPattern('action_opening');
 *   const openings = patternRegistry.listByCategory('opening');
 */

import { PatternManifest, PatternCategory } from '../shared/types';

class EssayPatternRegistry {
  private patterns = new Map<string, PatternManifest>();
  private initialized = false;

  register(manifest: PatternManifest): void {
    if (this.patterns.has(manifest.id)) {
      throw new Error(
        `[EssayPatternRegistry] Duplicate pattern ID: '${manifest.id}'. Each pattern must have a unique ID.`
      );
    }
    this.patterns.set(manifest.id, manifest);
  }

  getPattern(id: string): PatternManifest | undefined {
    return this.patterns.get(id);
  }

  getAll(): PatternManifest[] {
    return Array.from(this.patterns.values());
  }

  listByCategory(category: PatternCategory): PatternManifest[] {
    return Array.from(this.patterns.values()).filter(p => p.category === category);
  }

  /** Run all pattern detectors against text. Returns matched patterns. */
  detectAll(text: string): PatternManifest[] {
    return Array.from(this.patterns.values()).filter(p => {
      if (p.detection instanceof RegExp) {
        return p.detection.test(text);
      }
      return p.detection(text);
    });
  }

  /** Run only patterns in a given category against text. */
  detectByCategory(text: string, category: PatternCategory): PatternManifest[] {
    return this.listByCategory(category).filter(p => {
      if (p.detection instanceof RegExp) {
        return p.detection.test(text);
      }
      return p.detection(text);
    });
  }

  get size(): number {
    return this.patterns.size;
  }

  async autoImport(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    try {
      const fs = await import('fs');
      const path = await import('path');
      const patternsDir = path.join(__dirname, '..', 'patterns');

      if (!fs.existsSync(patternsDir)) return;

      const files = fs.readdirSync(patternsDir).filter(
        f => f.endsWith('.pattern.ts') || f.endsWith('.pattern.js')
      );

      for (const file of files) {
        try {
          await import(path.join(patternsDir, file));
        } catch (err) {
          console.error(`[EssayPatternRegistry] Failed to import ${file}:`, err);
        }
      }
    } catch (err) {
      console.error('[EssayPatternRegistry] Auto-import failed:', err);
    }
  }

  _reset(): void {
    this.patterns.clear();
    this.initialized = false;
  }
}

/** Singleton essay pattern registry */
export const patternRegistry = new EssayPatternRegistry();
```

### Type additions to `src/workshop/shared/types.ts`

```typescript
// ============================================================================
// ESSAY PATTERN MANIFEST
// ============================================================================

/** Which structural role the pattern plays */
export type PatternCategory = 'opening' | 'transition' | 'closing' | 'technique';

/** Before/after example demonstrating the pattern's transformation */
export interface PatternBeforeAfter {
  /** The weak or unimproved version */
  before: string;
  /** The improved version demonstrating the pattern */
  after: string;
}

/** Defines a detectable prose pattern with teaching content */
export interface PatternManifest {
  /** Unique pattern ID, e.g. 'action_opening' */
  id: string;

  /** Structural role of this pattern */
  category: PatternCategory;

  /** Human-readable name */
  displayName: string;

  /**
   * Detection logic. Either a RegExp tested against the full essay text,
   * or a function returning true if the pattern is present.
   * Receives the raw essay text as input.
   */
  detection: RegExp | ((text: string) => boolean);

  /** Teaching content: what the pattern is and how to apply it */
  teaching: string;

  /** A before/after demonstration of this pattern in action */
  beforeAfter: PatternBeforeAfter;
}
```

### Pattern manifest files

#### `src/workshop/patterns/action-opening.pattern.ts` (opening)

```typescript
/**
 * Pattern: Action Opening
 * Category: opening
 *
 * Opens with an immediate action verb in past tense with no preamble —
 * the scene begins without introduction.
 */

import { patternRegistry } from '../registry/patternRegistry';
import type { PatternManifest } from '../shared/types';

const manifest: PatternManifest = {
  id: 'action_opening',
  category: 'opening',
  displayName: 'Action Opening',

  // Detects: essay beginning with a strong action verb in past tense,
  // no orienting "I was" or "It was" preamble
  detection: (text: string): boolean => {
    const firstSentence = text.split(/[.!?]/)[0]?.trim() ?? '';
    // Must start with capital letter then action verb (past tense or continuous)
    const actionStart = /^[A-Z][a-z]*(ed|ing)\b/.test(firstSentence);
    // OR start with a strong verb pattern: Verb + noun
    const verbFirst = /^(The|A|An)?\s*[A-Z][a-z]+\s+(sat|stood|walked|ran|grabbed|heard|felt|watched|held|saw|found|realized|pressed|pulled|pushed|opened|closed|turned|reached|picked|dropped|carried)\b/i.test(firstSentence);
    // Must NOT be a weak opener pattern
    const notWeak = !/^(I have always|Growing up|Ever since|Throughout|In today|Webster)/i.test(firstSentence);
    return (actionStart || verbFirst) && notWeak;
  },

  teaching: `An action opening drops the reader directly into motion — no setup, no context, no "I would like to tell you." The first sentence contains a verb doing real work. This creates immediate forward momentum and signals to the reader that something is happening. The context arrives later, after the reader is already inside the scene. Strong action openings name something specific: a person, an object, an action, a sound. They do not name a feeling or an abstraction.`,

  beforeAfter: {
    before: `I have always been passionate about building things. Ever since I was young, I loved taking apart my toys to see how they worked. This led me to robotics, where I learned important lessons about teamwork and persistence.`,
    after: `The motor controller fried at T-minus forty seconds. I had three options, two of which would disqualify us, and one of which I hadn't tested. I chose the untested one.`,
  },
};

patternRegistry.register(manifest);
```

#### `src/workshop/patterns/dialogue-opening.pattern.ts` (opening)

```typescript
/**
 * Pattern: Dialogue Opening
 * Category: opening
 *
 * Opens with spoken words — either a direct quote or an overheard exchange.
 * Creates immediacy by putting a human voice before any narrative setup.
 */

import { patternRegistry } from '../registry/patternRegistry';
import type { PatternManifest } from '../shared/types';

const manifest: PatternManifest = {
  id: 'dialogue_opening',
  category: 'opening',
  displayName: 'Dialogue Opening',

  // Detects: essay starting with a quotation mark (straight or curly)
  detection: /^[\s\n]*[""'\u201C\u2018]/,

  teaching: `A dialogue opening places a human voice before any narrative scaffolding. The reader hears someone speak before they know who is speaking, where they are, or what the situation is — which creates immediate intrigue. Dialogue openings work best when the spoken words are surprising, revealing, or ambiguous. The words should raise a question the essay then spends its length answering. Avoid dialogue that merely states a situation; the words must do more than inform.`,

  beforeAfter: {
    before: `My grandmother and I have always had a complicated relationship. She grew up in a very different time and culture, so we often disagreed about how I should live my life. One day she said something that changed my perspective.`,
    after: `"You don't look Indian," she said, and paused, as if waiting to see what I would do with that.

I didn't know yet. That was the problem — and the beginning of three years of trying to find out.`,
  },
};

patternRegistry.register(manifest);
```

#### `src/workshop/patterns/question-opening.pattern.ts` (opening)

```typescript
/**
 * Pattern: Question Opening
 * Category: opening
 *
 * Opens with a question the essay then implicitly or explicitly answers.
 * Works best with non-rhetorical, genuinely surprising questions.
 */

import { patternRegistry } from '../registry/patternRegistry';
import type { PatternManifest } from '../shared/types';

const manifest: PatternManifest = {
  id: 'question_opening',
  category: 'opening',
  displayName: 'Question Opening',

  detection: (text: string): boolean => {
    const firstSentence = text.split(/[.!]/)[0]?.trim() ?? '';
    // Question ending with ? as the first sentence
    if (!firstSentence.endsWith('?')) return false;
    // Not a cliche rhetorical question pattern
    const notCliche = !/^(What does it mean to|Have you ever wondered|Why do|What is the meaning)/i.test(firstSentence);
    // Reasonably short — questions under 20 words are more powerful
    const wordCount = firstSentence.split(/\s+/).length;
    return notCliche && wordCount <= 25;
  },

  teaching: `A question opening works when the question is genuinely surprising — when the reader could not have predicted it and is now curious about the answer. The question should be specific, not philosophical in a generic way. "What is leadership?" is weak. "How do you teach someone to quit?" is strong. The essay that follows is the answer. The question must be honest, not rhetorical — you must actually be working toward an answer, not using the question as a device to say something you already know.`,

  beforeAfter: {
    before: `What does it mean to be a leader? This is a question I have thought about a lot during my time as student body president. Leadership, I have come to believe, is about serving others.`,
    after: `How do you teach someone to quit?

My coach spent three practices on it. Not quitting school, not quitting the team — quitting a bad habit mid-competition. The habit of finishing a dive wrong because the wrong finish is more comfortable than the right one.`,
  },
};

patternRegistry.register(manifest);
```

#### `src/workshop/patterns/pivot-transition.pattern.ts` (transition)

```typescript
/**
 * Pattern: Pivot Transition
 * Category: transition
 *
 * Uses a single pivot word or image to change the essay's direction
 * without an explicit transition sentence.
 */

import { patternRegistry } from '../registry/patternRegistry';
import type { PatternManifest } from '../shared/types';

const manifest: PatternManifest = {
  id: 'pivot_transition',
  category: 'transition',
  displayName: 'Pivot Transition',

  detection: (text: string): boolean => {
    // Detect implicit pivots: paragraphs starting with a single short sentence
    // that does not begin with a transition word but clearly shifts direction
    const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
    const TRANSITION_WORDS = ['However', 'Moreover', 'Furthermore', 'Additionally', 'Nevertheless', 'Consequently', 'Therefore', 'Meanwhile'];
    
    let pivotFound = false;
    for (let i = 1; i < paragraphs.length; i++) {
      const firstSentence = paragraphs[i].split(/[.!?]/)[0]?.trim() ?? '';
      const wordCount = firstSentence.split(/\s+/).length;
      const noExplicitTransition = !TRANSITION_WORDS.some(t => firstSentence.startsWith(t));
      // Short sentence (under 8 words) that starts a paragraph = likely pivot
      if (wordCount <= 8 && wordCount >= 2 && noExplicitTransition) {
        pivotFound = true;
        break;
      }
    }
    return pivotFound;
  },

  teaching: `A pivot transition changes the essay's direction without announcing the change. Instead of "However, I began to see things differently," the paragraph simply begins with the different thing. A pivot is often a short, declarative sentence that reorients the reader mid-essay. It trusts the reader to follow the turn without a signpost. Effective pivot transitions use the final image of one paragraph and the opening image of the next to create resonance — the ending of one becomes the launch point of the next.`,

  beforeAfter: {
    before: `I had always thought of coding as a solitary activity. I would sit alone for hours, working through problems by myself. However, when I joined the robotics team, I began to see things differently. I learned that collaboration was actually an important part of the process.`,
    after: `I had always thought of coding as a solitary activity. Hours alone, a problem, a screen.

Then Maya joined the team.

She debugged by talking out loud — narrating every assumption, every wrong turn. Within a week, I was doing it too. Within a month, our error rate dropped by half.`,
  },
};

patternRegistry.register(manifest);
```

#### `src/workshop/patterns/echo-transition.pattern.ts` (transition)

```typescript
/**
 * Pattern: Echo Transition
 * Category: transition
 *
 * Opens a new paragraph with a word or phrase from the previous paragraph's
 * final sentence, creating a verbal bridge between sections.
 */

import { patternRegistry } from '../registry/patternRegistry';
import type { PatternManifest } from '../shared/types';

const manifest: PatternManifest = {
  id: 'echo_transition',
  category: 'transition',
  displayName: 'Echo Transition',

  detection: (text: string): boolean => {
    const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
    if (paragraphs.length < 2) return false;

    for (let i = 1; i < paragraphs.length; i++) {
      const prevParagraph = paragraphs[i - 1];
      const currParagraph = paragraphs[i];

      // Get last sentence of previous paragraph
      const prevSentences = prevParagraph.split(/[.!?]/).filter(s => s.trim().length > 0);
      const lastSentence = prevSentences[prevSentences.length - 1]?.toLowerCase() ?? '';

      // Get first sentence of current paragraph
      const firstSentence = currParagraph.split(/[.!?]/)[0]?.toLowerCase() ?? '';

      // Extract significant words (length > 4, not common stop words)
      const stopWords = new Set(['that', 'this', 'with', 'have', 'from', 'they', 'were', 'been', 'when', 'what', 'which', 'will', 'your', 'more', 'also', 'into', 'then', 'than', 'some', 'would', 'could', 'should']);
      const prevWords = lastSentence.split(/\s+/).filter(w => w.length > 4 && !stopWords.has(w));
      const currWords = new Set(firstSentence.split(/\s+/));

      const hasEcho = prevWords.some(w => currWords.has(w));
      if (hasEcho) return true;
    }
    return false;
  },

  teaching: `An echo transition carries a word or image forward from the end of one paragraph into the beginning of the next, creating a verbal bridge without explicit transition language. The repeated word lands differently in its new context — the reader's understanding of it has shifted. Echo transitions create cohesion at the sentence level rather than the structural level. They suggest that the essay is thinking, not just moving from point to point.`,

  beforeAfter: {
    before: `That day in the clinic, I understood what it meant to translate not just words, but fear. My mother's hands were shaking.

Furthermore, this experience made me want to become a doctor. I realized that medicine required both technical knowledge and human connection.`,
    after: `That day in the clinic, I understood what it meant to translate not just words, but fear. My mother's hands were shaking.

Fear, I was learning, had its own vocabulary. The doctor spoke in probabilities; my mother heard certainties. My job was to find the space between them.`,
  },
};

patternRegistry.register(manifest);
```

#### `src/workshop/patterns/image-closing.pattern.ts` (closing)

```typescript
/**
 * Pattern: Image Closing
 * Category: closing
 *
 * Closes the essay with a concrete image rather than an explicit statement
 * of theme, lesson, or aspiration. The image carries the meaning.
 */

import { patternRegistry } from '../registry/patternRegistry';
import type { PatternManifest } from '../shared/types';

const manifest: PatternManifest = {
  id: 'image_closing',
  category: 'closing',
  displayName: 'Image Closing',

  detection: (text: string): boolean => {
    const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
    const lastParagraph = paragraphs[paragraphs.length - 1] ?? '';
    
    // Image closing: last paragraph does NOT contain cliche closing phrases
    const weakClosings = [
      /I have learned/i, /this experience taught me/i, /I look forward to/i,
      /in conclusion/i, /I am excited to/i, /I hope to/i, /my goal is/i,
      /I plan to/i, /as I continue/i, /I know that/i
    ];
    const hasWeakClosing = weakClosings.some(re => re.test(lastParagraph));
    
    // And contains sensory or concrete imagery
    const SENSORY_WORDS = ['light', 'sound', 'smell', 'touch', 'taste', 'dark', 'warm', 'cold', 'bright', 'quiet', 'loud', 'rough', 'smooth', 'sharp', 'soft'];
    const hasSensory = SENSORY_WORDS.some(w => lastParagraph.toLowerCase().includes(w));
    
    return !hasWeakClosing && hasSensory;
  },

  teaching: `An image closing ends the essay on a concrete sensory detail rather than an explicit statement of meaning. The image resonates with everything that came before and carries the emotional weight of the essay without naming it. Trust the reader to feel what the image means. The best closing images are ones that seem small but contain multitudes — a detail that has been transformed by the essay's journey. Do not end with "I learned" or "I hope." End with what you saw, heard, felt, or held.`,

  beforeAfter: {
    before: `In conclusion, this experience taught me the importance of perseverance and community. I learned that no one succeeds alone. I look forward to continuing to grow as a leader and to contributing to a community that shares my values at college.`,
    after: `That evening, I found my grandmother's red thread in the bottom of my bag — the one she had pressed into my hand at the airport. I had no idea what to do with it. I still don't. But I keep it.`,
  },
};

patternRegistry.register(manifest);
```

#### `src/workshop/patterns/callback-closing.pattern.ts` (closing)

```typescript
/**
 * Pattern: Callback Closing
 * Category: closing
 *
 * Final paragraph returns to a word, image, or scene from the opening,
 * completing the bracket structure.
 */

import { patternRegistry } from '../registry/patternRegistry';
import type { PatternManifest } from '../shared/types';

const manifest: PatternManifest = {
  id: 'callback_closing',
  category: 'closing',
  displayName: 'Callback Closing',

  detection: (text: string): boolean => {
    const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
    if (paragraphs.length < 3) return false;

    const openingParagraph = paragraphs[0].toLowerCase();
    const closingParagraph = paragraphs[paragraphs.length - 1].toLowerCase();

    // Extract significant words from opening
    const stopWords = new Set(['that', 'this', 'with', 'have', 'from', 'they', 'were', 'been', 'when', 'what', 'which', 'will', 'your', 'more', 'also', 'into', 'then', 'than', 'some', 'would', 'could', 'should', 'about', 'these', 'those', 'there', 'their', 'after', 'before']);
    const openingWords = openingParagraph.split(/\s+/).filter(w => w.length > 5 && !stopWords.has(w));
    const closingText = closingParagraph;

    // Check if 2+ significant opening words appear in closing
    const matches = openingWords.filter(w => closingText.includes(w));
    return matches.length >= 2;
  },

  teaching: `A callback closing returns to a word, image, or scene from the essay's opening — completing the bracket and signaling that the essay has arrived somewhere. The callback works because the reader now understands the opening differently; the repeated image is transformed by everything that came between. To write a callback closing: identify your most potent opening image, write your essay, and in the final paragraph, return to that image with subtly different language. The shift in meaning should feel earned, not announced.`,

  beforeAfter: {
    before: `Ultimately, I have grown enormously from this experience. My time with the robotics team taught me to be more collaborative, more resilient, and more creative. I am grateful for every challenge we faced together and excited to bring these lessons with me.`,
    after: `The motor controller still sits on my desk. I've replaced it — we won regionals with its successor — but I kept this one. I think about the forty seconds sometimes. About the choice I made before I knew I was capable of making it.

The untested option worked. Most of the time, it does.`,
  },
};

patternRegistry.register(manifest);
```

#### `src/workshop/patterns/forward-look-closing.pattern.ts` (closing)

```typescript
/**
 * Pattern: Forward Look Closing
 * Category: closing
 *
 * Ends with the writer looking ahead — but in a specific, grounded way
 * that grows from the essay's content, not in a generic "I hope to" way.
 */

import { patternRegistry } from '../registry/patternRegistry';
import type { PatternManifest } from '../shared/types';

const manifest: PatternManifest = {
  id: 'forward_look_closing',
  category: 'closing',
  displayName: 'Forward Look Closing',

  detection: (text: string): boolean => {
    const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
    const lastParagraph = paragraphs[paragraphs.length - 1] ?? '';
    
    // Detect forward-looking language
    const forwardPatterns = [
      /\b(next|now I|still|from here|what comes next|the question now)\b/i,
      /\b(I want to|I intend to|I am going to|I will)\b/i,
      /\b(unanswered|unfinished|not yet|still learning|still figuring)\b/i,
    ];
    const hasForwardLook = forwardPatterns.some(re => re.test(lastParagraph));
    
    // Must NOT be generic
    const genericPatterns = [
      /I look forward to contributing/i,
      /I am excited to be part of/i,
      /I hope to make a difference/i,
      /I plan to use these skills/i,
    ];
    const isGeneric = genericPatterns.some(re => re.test(lastParagraph));
    
    return hasForwardLook && !isGeneric;
  },

  teaching: `A forward look closing ends by gesturing toward what comes next — but specifically, not generically. The difference is grounding: "I want to study neuroscience" is generic; "I want to understand what happens in the three seconds before a wrong answer feels like the right one" is specific and grows from the essay's content. The best forward look closings pose an unanswered question, name a specific next step, or describe an ongoing state of becoming. They suggest the writer is not finished with this subject — which is what a college reader wants to believe.`,

  beforeAfter: {
    before: `I look forward to bringing these experiences and lessons to college. I am excited to contribute to the community and to continue growing as a student and leader. I know that the skills I have developed will serve me well.`,
    after: `I still don't know what the right word is. Not in English, not in Tagalog. I've checked both dictionaries and the answer isn't there.

What I know is that the search itself has become my project. I want to study linguistics because I think the missing word is not a gap — it's a data point about what English and Tagalog each chose not to see.`,
  },
};

patternRegistry.register(manifest);
```

#### `src/workshop/patterns/anaphora-technique.pattern.ts` (technique)

```typescript
/**
 * Pattern: Anaphora Technique
 * Category: technique
 *
 * Repetition of a word or phrase at the start of successive sentences
 * or clauses. Creates rhythm, emphasis, and cumulative emotional force.
 */

import { patternRegistry } from '../registry/patternRegistry';
import type { PatternManifest } from '../shared/types';

const manifest: PatternManifest = {
  id: 'anaphora_technique',
  category: 'technique',
  displayName: 'Anaphora',

  detection: (text: string): boolean => {
    const sentences = text.split(/[.!?]/).map(s => s.trim()).filter(s => s.length > 0);
    
    // Look for 3+ consecutive sentences starting with the same word or 2-word phrase
    for (let i = 0; i <= sentences.length - 3; i++) {
      const s1 = sentences[i].split(/\s+/).slice(0, 2).join(' ').toLowerCase();
      const s2 = sentences[i + 1].split(/\s+/).slice(0, 2).join(' ').toLowerCase();
      const s3 = sentences[i + 2].split(/\s+/).slice(0, 2).join(' ').toLowerCase();
      
      // First word match
      const firstWords = [s1.split(' ')[0], s2.split(' ')[0], s3.split(' ')[0]];
      if (firstWords[0] === firstWords[1] && firstWords[1] === firstWords[2] && firstWords[0].length > 1) {
        return true;
      }
      // Two-word phrase match
      if (s1 === s2 && s2 === s3 && s1.length > 3) {
        return true;
      }
    }
    return false;
  },

  teaching: `Anaphora repeats a word or phrase at the beginning of successive sentences or clauses. The repetition creates rhythm, emphasis, and cumulative force — each iteration adds weight to the next. Anaphora works best when the repeated element is short and the content of each clause genuinely adds something new. It is a technique that announces itself; use it intentionally and sparingly (one instance per essay, at a moment of high emotional or intellectual intensity). The power comes from the accumulation: the third instance lands harder than the first.`,

  beforeAfter: {
    before: `I thought about my grandmother every day while I was at the competition. I also thought about everything she had taught me about patience. The value of persistence was another thing she had shared with me.`,
    after: `I thought about my grandmother's hands. I thought about the forty years she spent perfecting the same three cuts. I thought about how she called it practice, not work, and what the difference was.`,
  },
};

patternRegistry.register(manifest);
```

#### `src/workshop/patterns/fragment-emphasis.pattern.ts` (technique)

```typescript
/**
 * Pattern: Fragment for Emphasis
 * Category: technique
 *
 * A deliberate sentence fragment used to create a rhythmic punch,
 * emphasize a single idea, or simulate the abruptness of a realization.
 */

import { patternRegistry } from '../registry/patternRegistry';
import type { PatternManifest } from '../shared/types';

const manifest: PatternManifest = {
  id: 'fragment_emphasis',
  category: 'technique',
  displayName: 'Fragment for Emphasis',

  detection: (text: string): boolean => {
    const sentences = text.split(/[.!?]/).map(s => s.trim()).filter(s => s.length > 0);
    
    // A fragment: 1-4 words, no verb, standalone sentence
    // We approximate by looking for very short sentences adjacent to normal ones
    for (let i = 0; i < sentences.length; i++) {
      const words = sentences[i].split(/\s+/).filter(w => w.length > 0);
      if (words.length >= 1 && words.length <= 4) {
        // Adjacent to a longer sentence
        const prevLen = i > 0 ? (sentences[i - 1].split(/\s+/).length) : 0;
        const nextLen = i < sentences.length - 1 ? (sentences[i + 1].split(/\s+/).length) : 0;
        if (prevLen > 8 || nextLen > 8) {
          return true;
        }
      }
    }
    return false;
  },

  teaching: `A deliberate sentence fragment — used sparingly — creates a rhythmic punch that a complete sentence cannot achieve. Fragments work because they break the reader's expectation of grammatical completion. The abrupt stop forces emphasis. A fragment after a long, flowing sentence creates contrast (long-long-short pattern). A fragment in dialogue can simulate the bluntness of thought or speech. The rule: one fragment per essay, maximum. More than one, and the technique becomes noise. The fragment must be doing real work — naming something essential, landing a discovery, or creating a moment of stillness. "Not yet." or "She didn't." or "Three months." can carry enormous weight in the right position.`,

  beforeAfter: {
    before: `After all of the hard work and long nights we spent preparing for the competition, we finally received the results. Unfortunately, we did not win, but it was still an important experience for me.`,
    after: `We had spent six months preparing. Late nights, revised schematics, three prototypes that didn't work.

We didn't win.

But in the debrief — listening to the team explain what we should have done differently — I realized I was finally thinking like an engineer. Not a student. An engineer.`,
  },
};

patternRegistry.register(manifest);
```

---

## 3. QualitySignalRegistry

### File: `src/workshop/registry/signalRegistry.ts`

```typescript
/**
 * Quality Signal Registry — Self-registering quality signal manifest system
 *
 * Signals register themselves by calling signalRegistry.register()
 * at module scope. The registry auto-discovers all *.signal.ts files
 * in the signals/ directory at startup.
 *
 * Each signal computes a 0-1 score from extracted features and feeds
 * into one or more dimension scores via the hybridScoringPipeline.
 *
 * Usage:
 *   // In a signal file (e.g., show-dont-tell.signal.ts):
 *   import { signalRegistry } from '../registry/signalRegistry';
 *   signalRegistry.register({ id: 'show_dont_tell', ... });
 *
 *   // To query:
 *   const s = signalRegistry.getSignal('show_dont_tell');
 *   const forDim = signalRegistry.listByDimension('narrative_craft_storytelling');
 */

import { QualitySignalManifest } from '../shared/types';

class QualitySignalRegistry {
  private signals = new Map<string, QualitySignalManifest>();
  private initialized = false;

  register(manifest: QualitySignalManifest): void {
    if (this.signals.has(manifest.id)) {
      throw new Error(
        `[QualitySignalRegistry] Duplicate signal ID: '${manifest.id}'. Each signal must have a unique ID.`
      );
    }
    this.signals.set(manifest.id, manifest);
  }

  getSignal(id: string): QualitySignalManifest | undefined {
    return this.signals.get(id);
  }

  getAll(): QualitySignalManifest[] {
    return Array.from(this.signals.values());
  }

  listByDimension(dimensionId: string): QualitySignalManifest[] {
    return Array.from(this.signals.values()).filter(s => s.dimensionId === dimensionId);
  }

  /** Compute all signals for a given dimension and return weighted average (0-100) */
  computeForDimension(
    dimensionId: string,
    features: import('../shared/types').ExtractedFeatures,
    text: string
  ): number {
    const signals = this.listByDimension(dimensionId);
    if (signals.length === 0) return 0;

    const totalWeight = signals.reduce((s, sig) => s + sig.weight, 0);
    if (totalWeight === 0) return 0;

    const weightedSum = signals.reduce((sum, sig) => {
      const raw = sig.compute(features, text);
      const clamped = Math.max(0, Math.min(1, raw));
      return sum + clamped * sig.weight;
    }, 0);

    return Math.round((weightedSum / totalWeight) * 100);
  }

  get size(): number {
    return this.signals.size;
  }

  async autoImport(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    try {
      const fs = await import('fs');
      const path = await import('path');
      const signalsDir = path.join(__dirname, '..', 'signals');

      if (!fs.existsSync(signalsDir)) return;

      const files = fs.readdirSync(signalsDir).filter(
        f => f.endsWith('.signal.ts') || f.endsWith('.signal.js')
      );

      for (const file of files) {
        try {
          await import(path.join(signalsDir, file));
        } catch (err) {
          console.error(`[QualitySignalRegistry] Failed to import ${file}:`, err);
        }
      }
    } catch (err) {
      console.error('[QualitySignalRegistry] Auto-import failed:', err);
    }
  }

  _reset(): void {
    this.signals.clear();
    this.initialized = false;
  }
}

/** Singleton quality signal registry */
export const signalRegistry = new QualitySignalRegistry();
```

### Type addition to `src/workshop/shared/types.ts`

```typescript
// ============================================================================
// QUALITY SIGNAL MANIFEST
// ============================================================================

/** Defines a single computable quality signal that feeds a dimension's score */
export interface QualitySignalManifest {
  /** Unique signal ID, e.g. 'show_dont_tell' */
  id: string;

  /** Which dimension this signal feeds into */
  dimensionId: string;

  /** Human-readable signal name */
  displayName: string;

  /**
   * Compute function: takes extracted features and raw text,
   * returns a value between 0.0 and 1.0 (clamped by registry).
   * Higher = better quality on this signal.
   */
  compute: (features: ExtractedFeatures, text: string) => number;

  /**
   * Weight of this signal within its dimension's signal set.
   * Used by computeForDimension to produce a weighted average.
   * Does not need to sum to any particular value across all signals —
   * relative weighting only within a dimension's signal group.
   */
  weight: number;
}
```

### Signal manifest files (15 signals)

I'll organize these by dimension for clarity. Each is a separate file in `src/workshop/signals/`.

#### Thematic depth signals

**`thematic-depth.signal.ts`** — `thematic_depth_reflection` dimension

```typescript
import { signalRegistry } from '../registry/signalRegistry';
import type { QualitySignalManifest } from '../shared/types';

// Signal: thematic-depth — reflection language density
const thematicDepth: QualitySignalManifest = {
  id: 'thematic_depth',
  dimensionId: 'thematic_depth_reflection',
  displayName: 'Thematic Depth',
  weight: 1.5,
  compute: (features) => {
    // Reflection markers + counterpoints + non-cliche growth language
    const base = Math.min(1, features.reflectionMarkerCount / 4);
    const counterBonus = Math.min(0.3, features.counterpointCount * 0.1);
    const clichePenalty = Math.min(0.4, features.clicheCount * 0.1);
    return Math.max(0, base + counterBonus - clichePenalty);
  },
};

// Signal: insight-depth — complexity of reasoning (clause depth proxy)
const insightDepth: QualitySignalManifest = {
  id: 'insight_depth',
  dimensionId: 'thematic_depth_reflection',
  displayName: 'Insight Depth',
  weight: 1.0,
  compute: (features) => {
    // Higher clause depth + complex vocabulary = deeper reasoning
    const clauseScore = Math.min(1, (features.clauseDepthAvg - 1) / 1.5);
    const vocabScore = Math.min(1, (features.vocabularyRichness - 0.4) / 0.3);
    return (clauseScore * 0.6) + (vocabScore * 0.4);
  },
};

// Signal: insight-uniqueness — non-generic reflection
const insightUniqueness: QualitySignalManifest = {
  id: 'insight_uniqueness',
  dimensionId: 'thematic_depth_reflection',
  displayName: 'Insight Uniqueness',
  weight: 1.2,
  compute: (features, text) => {
    // Penalize generic "I learned that" + reward specific claim language
    const genericPenalty = Math.min(0.5, features.fillerPhraseCount * 0.1);
    const specificBonus = Math.min(0.6, features.claimCount * 0.15);
    const bannedPenalty = Math.min(0.3, features.bannedTermCount * 0.05);
    return Math.max(0, 0.4 + specificBonus - genericPenalty - bannedPenalty);
  },
};

signalRegistry.register(thematicDepth);
signalRegistry.register(insightDepth);
signalRegistry.register(insightUniqueness);
```

#### Narrative craft signals

**`narrative-craft.signal.ts`** — `narrative_craft_storytelling` dimension

```typescript
import { signalRegistry } from '../registry/signalRegistry';
import type { QualitySignalManifest } from '../shared/types';

// Signal: show-dont-tell — sensory detail vs emotion word ratio
const showDontTell: QualitySignalManifest = {
  id: 'show_dont_tell',
  dimensionId: 'narrative_craft_storytelling',
  displayName: 'Show Don\'t Tell',
  weight: 2.0,
  compute: (features) => {
    const sensoryDensity = features.sensoryDetailCount / Math.max(features.wordCount / 100, 1);
    const emotionDensity = features.emotionWordCount / Math.max(features.wordCount / 100, 1);
    // Good ratio: high sensory + low direct emotion (showing vs telling)
    const sensoryScore = Math.min(0.6, sensoryDensity * 0.2);
    const tellPenalty = Math.min(0.3, emotionDensity * 0.08);
    const sceneBonus = features.hasOpeningScene ? 0.2 : 0;
    const dialogueBonus = features.hasDialogue ? 0.15 : 0;
    return Math.min(1, sensoryScore + sceneBonus + dialogueBonus - tellPenalty);
  },
};

// Signal: concrete-detail-density — specificity of imagery
const concreteDetailDensity: QualitySignalManifest = {
  id: 'concrete_detail_density',
  dimensionId: 'narrative_craft_storytelling',
  displayName: 'Concrete Detail Density',
  weight: 1.5,
  compute: (features, text) => {
    // Proxy: numbers, proper nouns, sensory words all indicate concrete detail
    const numbers = (text.match(/\b\d+\b/g) || []).length;
    const properNouns = (text.match(/\b[A-Z][a-z]{2,}\b/g) || []).length;
    const density = (numbers + properNouns + features.sensoryDetailCount) / Math.max(features.wordCount / 50, 1);
    return Math.min(1, density * 0.3);
  },
};

signalRegistry.register(showDontTell);
signalRegistry.register(concreteDetailDensity);
```

#### Originality/voice signals

**`originality-voice.signal.ts`** — `originality_voice_authenticity` dimension

```typescript
import { signalRegistry } from '../registry/signalRegistry';
import type { QualitySignalManifest } from '../shared/types';

// Signal: thematic-originality — non-generic subject matter
const thematicOriginality: QualitySignalManifest = {
  id: 'thematic_originality',
  dimensionId: 'originality_voice_authenticity',
  displayName: 'Thematic Originality',
  weight: 1.5,
  compute: (features) => {
    // Lower cliche count + lower banned term count = more original
    const clichePenalty = Math.min(0.6, features.clicheCount * 0.12);
    const bannedPenalty = Math.min(0.3, features.bannedTermCount * 0.06);
    return Math.max(0, 0.7 - clichePenalty - bannedPenalty);
  },
};

// Signal: voice-consistency — consistent register across the essay
const voiceConsistency: QualitySignalManifest = {
  id: 'voice_consistency',
  dimensionId: 'originality_voice_authenticity',
  displayName: 'Voice Consistency',
  weight: 1.2,
  compute: (features) => {
    // Formality score near mid-range (0.35-0.65) = consistent personal voice
    // Very formal or very informal suggests inconsistency in personal essays
    const formalityDeviation = Math.abs(features.formalityScore - 0.45);
    const formalityScore = Math.max(0, 1 - formalityDeviation * 2);
    // Contraction rate signals authentic voice (not too formal, not too casual)
    const contractionScore = Math.min(1, features.contractionRate * 2);
    return (formalityScore * 0.6) + (contractionScore * 0.4);
  },
};

signalRegistry.register(thematicOriginality);
signalRegistry.register(voiceConsistency);
```

#### Growth/transformation signals

**`growth-arc.signal.ts`** — `growth_transformation_arc` dimension

```typescript
import { signalRegistry } from '../registry/signalRegistry';
import type { QualitySignalManifest } from '../shared/types';

// Signal: character-revelation — shows change through action/behavior
const characterRevelation: QualitySignalManifest = {
  id: 'character_revelation',
  dimensionId: 'growth_transformation_arc',
  displayName: 'Character Revelation',
  weight: 1.5,
  compute: (features) => {
    // Growth language + reflection + dialogue = character revealed through behavior
    const growthScore = Math.min(0.4, features.growthLanguageCount * 0.08);
    const reflectionScore = Math.min(0.3, features.reflectionMarkerCount * 0.06);
    const behaviorScore = features.hasDialogue ? 0.2 : 0;
    const sceneScore = features.hasOpeningScene ? 0.15 : 0;
    return Math.min(1, growthScore + reflectionScore + behaviorScore + sceneScore);
  },
};

// Signal: growth-arc — evidence of before/after transformation
const growthArc: QualitySignalManifest = {
  id: 'growth_arc',
  dimensionId: 'growth_transformation_arc',
  displayName: 'Growth Arc',
  weight: 1.8,
  compute: (features, text) => {
    // Before/after language signals arc
    const beforeAfterPatterns = [
      /\b(used to|before|once I|when I was|had been)\b/gi,
      /\b(now I|I now|no longer|since then|after that)\b/gi,
    ];
    const beforeCount = (text.match(beforeAfterPatterns[0]) || []).length;
    const afterCount = (text.match(beforeAfterPatterns[1]) || []).length;
    // Both before AND after language = genuine arc
    const arcScore = beforeCount > 0 && afterCount > 0
      ? Math.min(0.8, (beforeCount + afterCount) * 0.1)
      : Math.min(0.3, (beforeCount + afterCount) * 0.05);
    const growthBonus = Math.min(0.2, features.growthLanguageCount * 0.04);
    return Math.min(1, arcScore + growthBonus);
  },
};

signalRegistry.register(characterRevelation);
signalRegistry.register(growthArc);
```

#### Opening/closing signals

**`opening-closing.signal.ts`** — feeds `opening_hook_engagement` and `closing_impact_resolution`

```typescript
import { signalRegistry } from '../registry/signalRegistry';
import type { QualitySignalManifest } from '../shared/types';

// Signal: opening-impact — strength of first paragraph
const openingImpact: QualitySignalManifest = {
  id: 'opening_impact',
  dimensionId: 'opening_hook_engagement',
  displayName: 'Opening Impact',
  weight: 2.0,
  compute: (features, text) => {
    const firstParagraph = text.split(/\n\s*\n/)[0] ?? '';
    const firstSentence = firstParagraph.split(/[.!?]/)[0] ?? '';
    
    let score = 0.3; // baseline
    
    // Scene in opening
    if (features.hasOpeningScene) score += 0.25;
    
    // Dialogue in opening
    if (/^[""'\u201C\u2018]/.test(firstSentence.trim())) score += 0.2;
    
    // Action verb in opening
    if (/\b(walked|ran|sat|stood|grabbed|opened|turned|felt|saw|heard|realized|pressed)\b/i.test(firstSentence)) score += 0.15;
    
    // Short punchy first sentence
    const firstWords = firstSentence.trim().split(/\s+/).length;
    if (firstWords <= 10 && firstWords >= 3) score += 0.1;
    
    // Weak opening penalty
    if (/^(I have always|Growing up|Ever since|Throughout|In today)/i.test(firstSentence.trim())) score = 0.1;
    
    return Math.min(1, score);
  },
};

// Signal: closing-resonance — strength of final paragraph
const closingResonance: QualitySignalManifest = {
  id: 'closing_resonance',
  dimensionId: 'closing_impact_resolution',
  displayName: 'Closing Resonance',
  weight: 2.0,
  compute: (features, text) => {
    const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
    const lastParagraph = paragraphs[paragraphs.length - 1] ?? '';
    
    let score = 0.3; // baseline
    
    // Penalize generic closings
    const genericClosings = ['I look forward to', 'in conclusion', 'I am excited to', 'I hope to', 'I plan to', 'this experience taught me', 'I have learned that'];
    const isGeneric = genericClosings.some(g => lastParagraph.toLowerCase().includes(g.toLowerCase()));
    if (isGeneric) return 0.1;
    
    // Reward callback to opening
    const openingParagraph = paragraphs[0] ?? '';
    const openWords = openingParagraph.toLowerCase().split(/\s+/).filter(w => w.length > 5);
    const closeWords = new Set(lastParagraph.toLowerCase().split(/\s+/));
    const callbackCount = openWords.filter(w => closeWords.has(w)).length;
    if (callbackCount >= 2) score += 0.3;
    
    // Reward concrete imagery in closing
    const SENSORY_WORDS = ['light', 'sound', 'warm', 'cold', 'bright', 'quiet', 'rough', 'smooth', 'dark', 'sharp'];
    if (SENSORY_WORDS.some(w => lastParagraph.toLowerCase().includes(w))) score += 0.2;
    
    // Reward short, punchy final sentence
    const sentences = lastParagraph.split(/[.!?]/).filter(s => s.trim().length > 0);
    const lastSentence = sentences[sentences.length - 1]?.trim() ?? '';
    if (lastSentence.split(/\s+/).length <= 8) score += 0.1;
    
    return Math.min(1, score);
  },
};

signalRegistry.register(openingImpact);
signalRegistry.register(closingResonance);
```

#### Structure/transition signals

**`structure-signals.signal.ts`** — feeds `structural_coherence` dimension

```typescript
import { signalRegistry } from '../registry/signalRegistry';
import type { QualitySignalManifest } from '../shared/types';

// Signal: transition-quality — sophistication of paragraph-to-paragraph flow
const transitionQuality: QualitySignalManifest = {
  id: 'transition_quality',
  dimensionId: 'structural_coherence',
  displayName: 'Transition Quality',
  weight: 1.5,
  compute: (features, text) => {
    const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
    if (paragraphs.length < 2) return 0.5;
    
    const WEAK_TRANSITIONS = new Set(['however', 'furthermore', 'moreover', 'additionally', 'in conclusion', 'in summary', 'therefore', 'thus']);
    
    let sophisticatedTransitions = 0;
    let weakTransitions = 0;
    
    for (let i = 1; i < paragraphs.length; i++) {
      const firstWord = paragraphs[i].split(/\s+/)[0]?.toLowerCase() ?? '';
      const firstTwoWords = paragraphs[i].split(/\s+/).slice(0, 2).join(' ').toLowerCase();
      
      if (WEAK_TRANSITIONS.has(firstWord) || WEAK_TRANSITIONS.has(firstTwoWords)) {
        weakTransitions++;
      } else {
        // Check for echo/pivot pattern: significant word from previous paragraph
        const prevWords = new Set(paragraphs[i - 1].toLowerCase().split(/\s+/).filter(w => w.length > 5));
        const currStart = paragraphs[i].toLowerCase().split(/\s+/).slice(0, 5);
        const hasEcho = currStart.some(w => prevWords.has(w));
        if (hasEcho) sophisticatedTransitions++;
      }
    }
    
    const total = paragraphs.length - 1;
    const weakRatio = weakTransitions / total;
    const sophisticatedRatio = sophisticatedTransitions / total;
    
    return Math.max(0, Math.min(1, 0.5 + sophisticatedRatio * 0.5 - weakRatio * 0.3));
  },
};

signalRegistry.register(transitionQuality);
```

#### Word economy/precision signals

**`word-precision.signal.ts`** — feeds `word_economy_craft` dimension

```typescript
import { signalRegistry } from '../registry/signalRegistry';
import type { QualitySignalManifest } from '../shared/types';

// Signal: word-precision — active voice, low filler, concrete diction
const wordPrecision: QualitySignalManifest = {
  id: 'word_precision',
  dimensionId: 'word_economy_craft',
  displayName: 'Word Precision',
  weight: 2.0,
  compute: (features) => {
    const fillerPenalty = Math.min(0.4, features.fillerPhraseCount * 0.08);
    const passivePenalty = Math.min(0.3, features.passiveVoiceRatio * 0.5);
    const bannedPenalty = Math.min(0.2, features.bannedTermCount * 0.04);
    const vocabBonus = Math.min(0.3, (features.vocabularyRichness - 0.4) * 0.6);
    return Math.max(0, 0.6 + vocabBonus - fillerPenalty - passivePenalty - bannedPenalty);
  },
};

signalRegistry.register(wordPrecision);
```

#### Sentence rhythm signal

**`sentence-rhythm.signal.ts`** — feeds `tonal_sophistication` dimension

```typescript
import { signalRegistry } from '../registry/signalRegistry';
import type { QualitySignalManifest } from '../shared/types';

// Signal: sentence-rhythm — variety and intentionality of sentence length patterns
const sentenceRhythm: QualitySignalManifest = {
  id: 'sentence_rhythm',
  dimensionId: 'tonal_sophistication',
  displayName: 'Sentence Rhythm',
  weight: 1.8,
  compute: (features) => {
    // Good rhythm: high sentence variety + mix of short and long
    const varietyScore = features.sentenceVarietyScore; // 0-1
    // Ideal: some short (punch) AND some long (flow)
    const hasShortAndLong = features.shortSentenceRatio > 0.1 && features.longSentenceRatio > 0.1;
    const mixBonus = hasShortAndLong ? 0.2 : 0;
    // Penalty for extremely uniform sentence lengths
    const monotonyPenalty = features.sentenceLengthVariance < 5 ? 0.15 : 0;
    return Math.min(1, varietyScore * 0.8 + mixBonus - monotonyPenalty);
  },
};

signalRegistry.register(sentenceRhythm);
```

#### Emotional resonance signal

**`vulnerability.signal.ts`** — feeds `emotional_resonance_vulnerability` dimension

```typescript
import { signalRegistry } from '../registry/signalRegistry';
import type { QualitySignalManifest } from '../shared/types';

// Signal: vulnerability-calibration — appropriate emotional disclosure
const vulnerabilityCalibration: QualitySignalManifest = {
  id: 'vulnerability_calibration',
  dimensionId: 'emotional_resonance_vulnerability',
  displayName: 'Vulnerability Calibration',
  weight: 2.0,
  compute: (features, text) => {
    // Some vulnerability markers = good (authentic)
    // Too many = overwrought
    // Zero = guarded
    const markers = features.vulnerabilityMarkerCount;
    
    if (markers === 0) return 0.2; // Guarded, no emotional disclosure
    if (markers >= 1 && markers <= 4) return 0.8; // Calibrated vulnerability
    if (markers >= 5 && markers <= 8) return 0.6; // Slightly overwrought
    return 0.3; // Too much — reads as manipulative or performative
  },
};

signalRegistry.register(vulnerabilityCalibration);
```

---

## Summary of New Type Additions to `src/workshop/shared/types.ts`

The following interfaces need to be added:

1. `StrategyExample` — example for strategy manifests
2. `StrategyTeaching` — teaching content structure
3. `StrategyDetection` — detection signals + threshold
4. `StrategyManifest` — the full strategy manifest
5. `PatternCategory` — `'opening' | 'transition' | 'closing' | 'technique'`
6. `PatternBeforeAfter` — before/after examples
7. `PatternManifest` — the full pattern manifest (with union `detection: RegExp | ((text: string) => boolean)`)
8. `QualitySignalManifest` — the signal manifest with `compute` function

## New Registry Index Update

`src/workshop/registry/index.ts` should be updated to also export the three new registries:

```typescript
export { commandRegistry } from './commandRegistry';
export { dimensionRegistry } from './dimensionRegistry';
export { essayProfileRegistry } from './essayProfileRegistry';
export { strategyRegistry } from './strategyRegistry';
export { patternRegistry } from './patternRegistry';
export { signalRegistry } from './signalRegistry';
```

## Directory structure for new manifest files

```
src/workshop/
  strategies/
    montage-technique.strategy.ts
    zoom-lens.strategy.ts
    bracket-structure.strategy.ts
    extended-metaphor.strategy.ts
    in-medias-res.strategy.ts
  patterns/
    action-opening.pattern.ts
    dialogue-opening.pattern.ts
    question-opening.pattern.ts
    pivot-transition.pattern.ts
    echo-transition.pattern.ts
    image-closing.pattern.ts
    callback-closing.pattern.ts
    forward-look-closing.pattern.ts
    anaphora-technique.pattern.ts
    fragment-emphasis.pattern.ts
  signals/
    thematic-depth.signal.ts   (3 signals: thematic_depth, insight_depth, insight_uniqueness)
    narrative-craft.signal.ts  (2 signals: show_dont_tell, concrete_detail_density)
    originality-voice.signal.ts (2 signals: thematic_originality, voice_consistency)
    growth-arc.signal.ts        (2 signals: character_revelation, growth_arc)
    opening-closing.signal.ts   (2 signals: opening_impact, closing_resonance)
    structure-signals.signal.ts (1 signal: transition_quality)
    word-precision.signal.ts    (1 signal: word_precision)
    sentence-rhythm.signal.ts   (1 signal: sentence_rhythm)
    vulnerability.signal.ts     (1 signal: vulnerability_calibration)
```

Total: 15 signals, 10 patterns, 5 strategies. All follow the self-registering singleton pattern exactly as the existing registries.
