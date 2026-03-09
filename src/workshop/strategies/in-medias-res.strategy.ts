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
