# Workshop Chat System Documentation

## Overview

The Workshop Chat System provides context-aware AI coaching for students improving their college application narratives. The chat has deep awareness of the student's portfolio, analysis results, teaching issues, version history, and reflection progress.

## Architecture

### Core Components

#### 1. **Context Aggregation** (`src/services/workshop/chatContext.ts`)
- **Purpose**: Builds comprehensive context about student's workshop session
- **Aggregates**:
  - Activity details (name, role, time commitment, portfolio scores)
  - Current draft state (text, word count, unsaved changes)
  - Analysis results (NQI score, rubric breakdown, authenticity, elite patterns)
  - Teaching issues (prioritized list with severity, examples, reflections)
  - Version history (improvement trends, timeline, best version)
  - Reflection progress (active prompts, completion %)
  - Generation insights (if available)

**Key Functions**:
```typescript
buildWorkshopChatContext(...): WorkshopChatContext
formatContextForLLM(context): string
```

#### 2. **Chat Service** (`src/services/workshop/chatService.ts`)
- **Purpose**: Handles conversational AI coaching with LLM
- **Capabilities**:
  - Context-aware responses using Claude Sonnet 4
  - Specialized functions (ask about issues, categories, next steps)
  - Reflection help and progress celebration
  - Action recommendations extraction
  - Conversation caching (in-memory)

**Key Functions**:
```typescript
sendChatMessage(request: ChatRequest): Promise<ChatResponse>
createWelcomeMessage(context): ChatMessage
getConversationStarters(context): string[]
askAboutIssue(issueId, context): Promise<ChatResponse>
celebrateAndAdvise(context): Promise<ChatResponse>
```

**System Prompt Strategy**:
- Establishes expert coach role with deep admissions knowledge
- Emphasizes teaching principles over copy-paste solutions
- Guides to reference specific data (scores, categories, issues)
- Encourages authenticity and student voice
- Provides actionable next steps

#### 3. **UI Component** (`src/components/portfolio/extracurricular/workshop/components/ContextualWorkshopChat.tsx`)
- **Purpose**: Chat interface with full workshop integration
- **Features**:
  - Auto-resizing textarea (1-4 lines)
  - Conversation starters based on context
  - Action recommendations (expand category, start reflection, regenerate)
  - Loading states with animations
  - Conversation caching per activity
  - Sticky positioning on desktop

**Props**:
```typescript
{
  activity: ExtracurricularItem
  currentDraft: string
  analysisResult: AnalysisResult | null
  teachingCoaching: TeachingCoachingOutput | null
  currentScore: number
  initialScore: number
  reflectionPromptsMap: Map<string, ReflectionPromptSet>
  reflectionAnswers: Record<string, Record<string, string>>

  // Optional actions
  onToggleCategory?: (categoryKey: string) => void
  onLoadReflectionPrompts?: (issueId: string) => void
  onTriggerReanalysis?: () => void
}
```

#### 4. **Workshop Integration** (`ExtracurricularWorkshopUnified.tsx`)
- **Layout**: Two-column grid (2/3 main + 1/3 chat on large screens)
- **Chat Position**: Sticky sidebar on the right
- **Responsive**: Stacks vertically on mobile

## Data Flow

```
User Question
    ↓
ContextualWorkshopChat
    ↓
buildWorkshopChatContext() → Aggregates all context
    ↓
sendChatMessage() → Formats prompt + calls Claude API
    ↓
formatContextForLLM() → Converts context to text block
    ↓
Claude Sonnet 4 → Generates response
    ↓
extractRecommendations() → Parses action suggestions
    ↓
Display response + recommendations
    ↓
User clicks recommendation → Triggers workshop action
```

## Context Structure

### WorkshopChatContext Interface

```typescript
{
  activity: {
    name, role, category, timeCommitment, duration
    portfolioScores, recommendedUse, whyItMatters
    descriptionAnalysis: { strengths, improvements }
  }

  currentState: {
    draft, wordCount, charCount
    hasUnsavedChanges, needsReanalysis
  }

  analysis: {
    nqi, initialNqi, delta, tier, label
    categories: [ { name, score, percentage, status, comments, suggestions } ]
    weakCategories: [ { name, score, gap } ]
    authenticity: { score, voiceType, redFlags, greenFlags }
    elitePatterns: { overallScore, tier, strengths, gaps }
  }

  teaching: {
    topIssues: [ { id, title, category, severity, fromDraft, problem, whyMatters } ]
    quickWins: [ { title, effort, impact } ]
    strategicGuidance: { strengths, criticalGaps, recommendedOrder }
  }

  history: {
    totalVersions, improvementTrend, nqiDelta, percentChange
    timeline: [ { version, timestamp, nqi, note } ]
    bestVersion: { nqi, timestamp }
  }

  reflection: {
    activeReflections: [ { issueId, issueTitle, prompts } ]
    completedCount, totalCount, completionPercentage
  }
}
```

## System Prompt

The chat uses a carefully crafted system prompt that:
1. **Establishes Expertise**: "You are a supportive, insightful essay coach with deep expertise in college admissions"
2. **Defines Role**: Answer questions, explain principles, suggest next steps, provide encouragement
3. **Sets Guidelines**:
   - Be specific (reference actual activity, scores, categories)
   - Teach, don't write (no complete rewrites)
   - Encourage authenticity (prioritize real voice)
   - Be concise (clear, actionable guidance)
   - Cite data (use specific scores and issues)
   - Celebrate progress (acknowledge improvements)
   - Suggest next steps (recommend which issue to tackle)
4. **Sets Boundaries**:
   - Never generate complete essay rewrites
   - Don't make up scores or data
   - Avoid generic advice
   - Don't overwhelm with all issues at once
   - Use warm, conversational tone

## Example Conversations

### Asking About Score
**User**: "Why is my score 68/100?"

**Chat Context Includes**:
- Current NQI: 68
- Weak categories: Specificity & Evidence (5/10), Narrative Arc (6/10)
- Top issues: "Missing Quantified Impact", "No Stakes or Tension"

**AI Response**:
> Your score of 68/100 puts you in the "good" tier - you have a solid foundation! The main opportunities for improvement are:
>
> 1. **Specificity & Evidence (5/10)**: Your narrative mentions you "helped many students" but doesn't include concrete numbers. Adding metrics like "tutored 7 students, meeting twice weekly" would boost credibility.
>
> 2. **Narrative Arc & Stakes (6/10)**: Your essay reads more like a summary than a story. Adding an obstacle (like "Three days before our event, the venue cancelled...") creates engagement.
>
> Fixing these two issues could push you to 75-80 range (strong tier). Want to start with specificity or narrative arc?

**Recommendations**:
- [Expand Category] Review Specificity & Evidence
- [Start Reflection] Reflect on: Missing Quantified Impact

### Asking For Next Steps
**User**: "What should I focus on next?"

**AI Response**:
> Based on your current score (68/100) and where you'll get the most impact, I recommend:
>
> **Priority 1: Add Specific Metrics** (Quick Win - 15 min, +3-5 points)
> - Your robotics team work mentions "helped build the robot" but no specifics
> - Add: hours per week (15?), weeks (38?), your exact role (vision system programmer?)
> - Include impact numbers: competitions won, accuracy improved from X% to Y%
>
> **Priority 2: Create Stakes** (30 min, +4-6 points)
> - Right now it's "We built a robot and competed." Where's the drama?
> - What almost went wrong? What was the deadline pressure?
> - Example: "Two days before regionals, our vision system failed 40% of test runs..."
>
> Start with the metrics (faster, high impact), then tackle stakes. Want help thinking through what numbers to include?

### Getting Reflection Help
**User**: "I'm stuck on the reflection prompt about impact"

**Chat sees**:
- Active reflection: "What specific, measurable outcomes resulted from your work?"
- Current draft mentions: "We raised money for the shelter"

**AI Response**:
> Let's break down what makes impact measurable for your fundraiser:
>
> **Think through these questions**:
> 1. How much money? (Don't say "a lot" - was it $500? $5,000? $15,000?)
> 2. How many people benefited? (200 families? 50 pets adopted?)
> 3. Before/after comparison? (Shelter had X capacity, now has Y?)
> 4. Your specific role in achieving this? (Did you personally recruit 12 volunteers? Design the marketing that brought 200 people?)
>
> Even if you don't have exact numbers, give your best estimate. "$5,000" is way more powerful than "significant funds." What numbers can you remember or estimate?

## Recommendations System

The chat can suggest actionable steps:

### Recommendation Types

#### 1. `expand_category`
Triggers: When AI mentions a specific rubric category
Action: Expands that category in the workshop UI
Example: "Review Specificity & Evidence to see detailed feedback"

#### 2. `start_reflection`
Triggers: When AI suggests working on a specific issue
Action: Loads reflection prompts for that issue
Example: "Reflect on: Missing Quantified Impact"

#### 3. `regenerate_draft`
Triggers: When AI mentions regenerating or trying different approaches
Action: Triggers re-analysis of current draft
Example: "Generate improved versions to see examples"

### Implementing Recommendations

```typescript
const handleRecommendationClick = (rec: ChatRecommendation) => {
  switch (rec.type) {
    case 'expand_category':
      onToggleCategory(rec.actionData.categoryKey)
      break
    case 'start_reflection':
      onLoadReflectionPrompts(rec.actionData.issueId)
      break
    case 'regenerate_draft':
      onTriggerReanalysis()
      break
  }
}
```

## Conversation Starters

The chat generates contextual starter questions based on:
- **Score tier**: "What should I focus on first?" (if < 70)
- **Improvement**: "Why did my score improve?" (if delta > 0)
- **Top issues**: "How do I fix [issue title]?"
- **Weak categories**: "Why is my [category] score low?"
- **Reflection progress**: "Help me answer the reflection questions" (if < 50% complete)
- **Generic**: "What makes a great college essay?", "How can I make my [category] activity stand out?"

## Performance & Caching

### Conversation Caching
- **Strategy**: In-memory Map keyed by activityId
- **Size Limit**: 50 conversations max, 20 messages per conversation
- **Eviction**: LRU (oldest entry removed when cache full)
- **Persistence**: None (resets on page refresh)

### Token Optimization
- **Context Formatting**: Concise text blocks (not verbose JSON)
- **History Limit**: Last 6 messages only included in subsequent calls
- **System Prompt Caching**: Reuses same system prompt across calls
- **Cost Tracking**: Each response includes usage stats and cost estimate

**Estimated Costs**:
- Average question: $0.003 - $0.008 per exchange
- Context size: ~1,500-3,000 input tokens
- Response size: ~300-800 output tokens

## Integration Points

### With Workshop Analysis
- Receives: `AnalysisResult`, `TeachingCoachingOutput`
- Uses: NQI score, rubric categories, teaching issues, authenticity, elite patterns

### With Reflection System
- Receives: `reflectionPromptsMap`, `reflectionAnswers`
- Uses: Active prompts, completion status, student answers
- Can trigger: Loading prompts for specific issues

### With Version History
- Receives: Activity ID (for fetching versions)
- Uses: Improvement trends, timeline, best version achieved
- Displays: Progress over time, delta comparisons

### With Generation System
- Receives: `RewriteCandidate[]` (if available)
- Uses: Style options, score estimates, improvements applied
- Can trigger: Regeneration via recommendations

## Testing

### Manual Testing Checklist
1. ✅ Chat loads with welcome message after analysis
2. ✅ Conversation starters appear on first message
3. ✅ Can send messages and receive responses
4. ✅ Recommendations appear when relevant
5. ✅ Clicking recommendations triggers correct actions
6. ✅ Conversation persists across category expansions
7. ✅ Loading states display correctly
8. ✅ Error handling works when backend unavailable

### Example Test Flow
```
1. Navigate to http://localhost:8081/portfolio-insights?tab=evidence
2. Click any extracurricular activity
3. Wait for analysis to complete
4. Chat appears on right side with welcome message
5. Click a conversation starter
6. Verify AI response is contextual
7. Click a recommendation
8. Verify correct workshop action happens
9. Ask follow-up question
10. Verify context is maintained
```

## Error Handling

### No Analysis Available
- **Symptom**: `analysisResult` is null
- **Behavior**: Chat disabled with message "Analyzing your essay..."
- **Resolution**: Wait for analysis to complete

### Backend Unavailable
- **Symptom**: API call fails
- **Behavior**: Error message in chat: "I'm having trouble connecting..."
- **Resolution**: Suggests running `npm run dev:full`

### Network Timeout
- **Symptom**: Request exceeds timeout
- **Behavior**: Retries automatically (via `callClaudeWithRetry`)
- **Resolution**: Max 3 retries, then returns error

## Future Enhancements

### Phase 2 Improvements
1. **Conversation Persistence**: Save to localStorage or backend
2. **Voice Options**: Allow student to choose tone (mentor, coach, curious_friend)
3. **Multi-Turn Reflection**: Chat guides through reflection prompts step-by-step
4. **Comparison Mode**: "How does my narrative compare to successful examples?"
5. **Progress Tracking**: Visual timeline of chat-driven improvements

### Phase 3 Advanced Features
1. **Proactive Suggestions**: Chat suggests next steps without being asked
2. **Smart Context**: Detects when student is stuck and offers targeted help
3. **Generation Integration**: Chat can trigger and explain generation results
4. **Collaborative Editing**: Chat highlights specific lines to edit
5. **Analytics**: Track which chat patterns lead to best improvements

## Troubleshooting

### Chat not appearing
- **Check**: Is analysis complete? (`analysisResult` not null)
- **Check**: Is component imported in `ExtracurricularWorkshopUnified.tsx`?
- **Check**: Browser console for errors

### Responses are generic
- **Check**: Is context building correctly? (console.log the context)
- **Check**: Is `formatContextForLLM` including all sections?
- **Check**: System prompt in `chatService.ts`

### Recommendations not working
- **Check**: Are callback props provided to `ContextualWorkshopChat`?
- **Check**: `onToggleCategory`, `onLoadReflectionPrompts`, `onTriggerReanalysis` defined?
- **Check**: Recommendation extraction regex patterns

### High costs
- **Check**: Token usage in console logs
- **Check**: Context size (should be < 3000 tokens)
- **Check**: Conversation history limit (max 6 messages)
- **Optimize**: Reduce context formatting verbosity

## API Reference

See full TypeScript definitions in:
- `/src/services/workshop/chatContext.ts`
- `/src/services/workshop/chatService.ts`
- `/src/components/portfolio/extracurricular/workshop/components/ContextualWorkshopChat.tsx`
