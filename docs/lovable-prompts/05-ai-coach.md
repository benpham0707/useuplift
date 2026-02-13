# Prompt 5: Right Pane — AI Coach Chat

> Attach `00-context.md` with this prompt.

---

Build out the AI Coach chat in the right pane of the workshop.

## What to Reuse

We have an existing `ContextualWorkshopChat` component at `src/components/portfolio/extracurricular/workshop/components/ContextualWorkshopChat.tsx` that already supports both PIQ and extracurricular modes.

Reuse this component with `mode="extracurricular"`. It handles:
- Chat message history
- Sending messages to our AI backend
- Credit checking and deduction
- Conversation starters
- Auto-scrolling
- External message management

## What Changes for Activity Workshop

The coach needs to be contextualized with the Activity Workshop pipeline output instead of the single-entry analysis. When a student selects an activity via the carousel:

- The coach receives that activity's full teaching data as context
- It knows the student's story (archetype, spike, narrative threads)
- It can reference specific strengths, improvements, tier explanations
- It understands the portfolio holistically (not just one activity)

**Context to pass:**
- Current activity's celebration, tier, strengths, improvements, scoring, narrative guidance
- Student's archetype, story essence, spike area
- Target schools, intended major
- Constraint context (first-gen, work hours, rural)
- Portfolio-level coherence score and strategic direction

**Example student questions the coach should handle:**
- "Why is my research only Tier 2?"
- "How should I talk about my farm work in my MIT interview?"
- "Can you help me rewrite my description to fit 150 characters?"
- "What should I focus on improving first?"
- "How do my activities connect to each other?"

## Layout

- Sticky right pane (stays visible while left pane scrolls)
- Same chat UI as PIQ Workshop: message bubbles, input box, send button
- Conversation starters shown when chat is empty
- Context updates when switching activities (conversation history stays)
- Mobile: Floating chat button → opens bottom sheet/drawer
