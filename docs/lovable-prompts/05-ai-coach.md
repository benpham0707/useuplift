# Prompt 5: Right Pane — AI Coach Chat

> Attach [00-context.md](./00-context.md) with this prompt.

**Prev**: [04 — Insights Tab](./04-insights-tab.md) | **Next**: [06 — Polish & States](./06-polish-states.md)

---

Build out the AI Coach chat in the right pane of the split-pane layout from [Prompt 02](./02-split-pane-layout.md).

## What to Reuse
> [See component details and full props interface in context](./00-context.md#ai-coach-chat-reuse-directly)

We have an existing `ContextualWorkshopChat` component at `src/components/portfolio/extracurricular/workshop/components/ContextualWorkshopChat.tsx` that already handles chat messages, AI backend communication, credit checking, conversation starters, and auto-scrolling.

Reuse this component with `mode="extracurricular"`. It already supports this mode.

## What the Coach Knows
> Context assembled from: `stage2.teachingDelivered[].teaching` (current activity), `stage0.narrativeIdentity` (student identity), `stage0.contextualFactors` (constraints), `finalNarrative` (portfolio narrative), `scoring.activityScores[]` (scores) — [see all types in context](./00-context.md#pipeline-output-reference)

When a student selects an activity, the coach receives that activity's full analysis as context:
- The celebration, tier, strengths, improvements, scoring, and narrative guidance
- The student's archetype, story essence, spike area
- Target schools, intended major
- Constraint context (first-gen, work hours, rural)
- Portfolio-level coherence and strategic direction

This means the coach can answer questions like:
- "Why is my research only Tier 2?"
- "How should I talk about my farm work in my MIT interview?"
- "Can you help me rewrite my description to fit 150 characters?"
- "What should I focus on improving first?"
- "How do my activities connect to each other?"

## Layout

- Sticky right pane (stays visible while left pane scrolls)
- Same chat UI as the PIQ Workshop: message bubbles, input box, send button
- Conversation starters shown when chat is empty
- Context updates when switching activities (conversation history stays)
- Mobile: floating chat button → opens bottom sheet/drawer
