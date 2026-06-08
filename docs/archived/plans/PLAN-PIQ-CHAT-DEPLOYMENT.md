# Plan: PIQ Chat Deployment & Integration

## Executive Summary

**Goal**: Complete deployment and integration of the world-class AI Essay Coach with PIQ Workshop frontend

**Current State**:
- ✅ Backend services built (piqChatService.ts, piqChatContext.ts)
- ✅ Chat UI component ready (ContextualWorkshopChat.tsx)
- ✅ PIQWorkshop component already integrates chat (lines 1609-1628)
- ✅ Two-step validation system deployed (Phase 17 + Phase 18)
- ✅ Test results: 94% pass rate across 15 scenarios

**What's Missing**:
1. **Supabase Edge Function**: Deploy PIQ chat backend API endpoint
2. **API Integration**: Connect frontend service to Supabase edge function
3. **Testing**: Comprehensive end-to-end testing of chat flow
4. **Version History**: Pass version history to chat context for better coaching
5. **Database Persistence**: Optional - save chat conversations to database

---

## Architecture Review

### Current Data Flow

```
User types message in ContextualWorkshopChat
    ↓
handleSendMessage() calls sendPIQChatMessage()
    ↓
buildPIQChatContext() gathers:
  - PIQ prompt metadata
  - Current draft & word count
  - 12-dimension analysis
  - Workshop items
  - Voice fingerprint
  - Experience fingerprint
  - Quality anchors
    ↓
callClaude() sends to Anthropic API directly
    ↓
Response returns with coaching message
    ↓
UI displays message with recommendations
```

### Problem

The current implementation calls `callClaude()` directly from the frontend, which:
- ❌ Exposes API keys in client code
- ❌ No rate limiting or cost controls
- ❌ No request logging or monitoring
- ❌ Can't enforce authentication

### Solution

Deploy Supabase Edge Function that:
- ✅ Secures API keys server-side
- ✅ Enforces authentication (RLS policies)
- ✅ Enables rate limiting & cost tracking
- ✅ Provides centralized logging
- ✅ Matches architecture of workshop-analysis

---

## Phase 1: Deploy PIQ Chat Edge Function

### Step 1.1: Create Edge Function Structure

**File**: `supabase/functions/piq-chat/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Import PIQ chat logic (we'll adapt from frontend)
import { buildPIQChatContext, formatPIQContextForLLM } from './piqChatContext.ts';
import { SYSTEM_PROMPT, buildUserPrompt } from './piqChatService.ts';

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request
    const {
      userMessage,
      essayText,
      promptId,
      promptText,
      promptTitle,
      analysisResult,
      conversationHistory,
      options
    } = await req.json();

    // Validate inputs
    if (!userMessage || !essayText || !promptId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build context
    const context = buildPIQChatContext(
      promptId,
      promptText,
      promptTitle,
      essayText,
      analysisResult,
      options || {}
    );

    // Format for LLM
    const contextBlock = formatPIQContextForLLM(context);
    const conversationContext = buildConversationContext(conversationHistory || []);
    const fullUserPrompt = buildUserPrompt(userMessage, contextBlock, conversationContext);

    // Call Anthropic
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: options?.maxTokens || 500,
        temperature: options?.temperature || 0.7,
        system: [
          {
            type: 'text',
            text: SYSTEM_PROMPT,
            cache_control: { type: 'ephemeral' }
          }
        ],
        messages: [
          {
            role: 'user',
            content: fullUserPrompt
          }
        ]
      })
    });

    const result = await response.json();

    // Return response
    return new Response(
      JSON.stringify({
        message: {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: result.content[0].text,
          timestamp: Date.now()
        },
        usage: {
          inputTokens: result.usage.input_tokens,
          outputTokens: result.usage.output_tokens,
          cost: calculateCost(result.usage)
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('PIQ Chat Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

### Step 1.2: Port Context & Service Logic

**Files to create**:
- `supabase/functions/piq-chat/piqChatContext.ts` - Port from frontend
- `supabase/functions/piq-chat/piqChatService.ts` - Port system prompt & helpers
- `supabase/functions/piq-chat/_shared/corsHeaders.ts` - CORS configuration

**Key differences from frontend**:
- Use Deno imports instead of Node.js
- Direct Anthropic API calls instead of lib/llm/claude
- Server-side error handling
- Request logging

### Step 1.3: Deploy Edge Function

```bash
# Deploy with JWT verification
supabase functions deploy piq-chat

# Or deploy without JWT for testing
supabase functions deploy piq-chat --no-verify-jwt
```

**Verification**:
```bash
# Test with curl
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/piq-chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "userMessage": "How can I improve my opening?",
    "essayText": "I built my first PC at 16...",
    "promptId": "piq1",
    "promptText": "Describe an example of your leadership experience...",
    "promptTitle": "Leadership & Impact",
    "analysisResult": {...},
    "conversationHistory": []
  }'
```

**Expected Response**:
```json
{
  "message": {
    "id": "msg-1234567890",
    "role": "assistant",
    "content": "Okay, so here's what I'm noticing about your opening...",
    "timestamp": 1234567890
  },
  "usage": {
    "inputTokens": 2500,
    "outputTokens": 180,
    "cost": 0.0045
  }
}
```

---

## Phase 2: Update Frontend Service

### Step 2.1: Create API Client

**File**: `src/services/piqWorkshop/piqChatApiClient.ts`

```typescript
import { supabase } from '@/lib/supabaseClient';
import { AnalysisResult } from '@/components/portfolio/extracurricular/workshop/backendTypes';
import { ChatMessage } from './piqChatService';

export interface PIQChatRequest {
  userMessage: string;
  essayText: string;
  promptId: string;
  promptText: string;
  promptTitle: string;
  analysisResult: AnalysisResult | null;
  conversationHistory?: ChatMessage[];
  options?: {
    currentScore: number;
    initialScore: number;
    hasUnsavedChanges: boolean;
    needsReanalysis: boolean;
    versionHistory?: Array<{ timestamp: number; nqi: number; note?: string }>;
    maxTokens?: number;
    temperature?: number;
  };
}

export interface PIQChatResponse {
  message: ChatMessage;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    cost: number;
  };
}

export async function callPIQChatAPI(request: PIQChatRequest): Promise<PIQChatResponse> {
  const { data, error } = await supabase.functions.invoke('piq-chat', {
    body: request
  });

  if (error) {
    throw new Error(`PIQ Chat API Error: ${error.message}`);
  }

  return data as PIQChatResponse;
}
```

### Step 2.2: Update PIQ Chat Service

**File**: `src/services/piqWorkshop/piqChatService.ts`

**Changes**:
```typescript
// OLD: Direct Claude call
import { callClaude } from '@/lib/llm/claude';

export async function sendPIQChatMessage(request: ChatRequest): Promise<ChatResponse> {
  // ... build context ...

  response = await callClaude(fullUserPrompt, {
    systemPrompt: SYSTEM_PROMPT,
    // ...
  });

  // ... return response ...
}
```

```typescript
// NEW: API client call
import { callPIQChatAPI } from './piqChatApiClient';

export async function sendPIQChatMessage(request: ChatRequest): Promise<ChatResponse> {
  const {
    userMessage,
    context,
    conversationHistory = [],
    options = {},
  } = request;

  // Call backend API instead of Claude directly
  const response = await callPIQChatAPI({
    userMessage,
    essayText: context.currentState.draft,
    promptId: context.piqEssay.promptId,
    promptText: context.piqEssay.promptText,
    promptTitle: context.piqEssay.promptTitle,
    analysisResult: buildAnalysisResultFromContext(context),
    conversationHistory,
    options: {
      currentScore: context.analysis.nqi,
      initialScore: context.analysis.initialNqi,
      hasUnsavedChanges: context.currentState.hasUnsavedChanges,
      needsReanalysis: context.currentState.needsReanalysis,
      versionHistory: context.history.timeline,
      maxTokens: options.maxTokens,
      temperature: options.temperature,
    }
  });

  return response;
}
```

---

## Phase 3: Add Version History Support

### Step 3.1: Update PIQWorkshop Component

**File**: `src/pages/PIQWorkshop.tsx`

**Current issue**: Chat context receives empty version history

```typescript
// Line 1625 - Currently passing empty array
externalMessages={chatMessages}
onMessagesChange={setChatMessages}
```

**Solution**: Build version history from draftVersions state

```typescript
// Add version history mapping (before the JSX)
const versionHistoryForChat = draftVersions.map((v, idx) => ({
  timestamp: v.timestamp,
  nqi: v.score,
  note: idx === currentVersionIndex ? 'Current version' : undefined
}));
```

**Update ContextualWorkshopChat props**:
```typescript
<ContextualWorkshopChat
  mode="piq"
  piqPromptId={selectedPromptId}
  piqPromptText={UC_PIQ_PROMPTS.find(p => p.id === selectedPromptId)?.prompt || ''}
  piqPromptTitle={UC_PIQ_PROMPTS.find(p => p.id === selectedPromptId)?.title || ''}
  // ... existing props ...

  // NEW: Pass version history
  versionHistory={versionHistoryForChat}

  externalMessages={chatMessages}
  onMessagesChange={setChatMessages}
/>
```

### Step 3.2: Update ContextualWorkshopChat Component

**File**: `src/components/portfolio/extracurricular/workshop/components/ContextualWorkshopChat.tsx`

**Add prop**:
```typescript
interface ContextualWorkshopChatProps {
  // ... existing props ...

  // NEW: Version history for chat context
  versionHistory?: Array<{ timestamp: number; nqi: number; note?: string }>;
}
```

**Update buildPIQContextObject**:
```typescript
const buildPIQContextObject = (): PIQChatContext => {
  if (!piqPromptId || !piqPromptText || !piqPromptTitle) {
    throw new Error('PIQ mode requires promptId, promptText, and promptTitle');
  }

  return buildPIQChatContext(
    piqPromptId,
    piqPromptText,
    piqPromptTitle,
    currentDraft,
    analysisResult,
    {
      currentScore,
      initialScore,
      hasUnsavedChanges,
      needsReanalysis,
      versionHistory: versionHistory || [], // Use passed version history
    }
  );
};
```

---

## Phase 4: Testing Plan

### Test 4.1: Unit Tests (Backend)

**Test PIQ Chat Edge Function**:

```bash
# Test file: tests/test-piq-chat-edge-function.ts

# Scenarios to test:
1. ✅ Basic chat message returns coaching response
2. ✅ Context includes voice fingerprint
3. ✅ Context includes quality anchors
4. ✅ Context includes workshop items
5. ✅ Word count awareness (under/over limit)
6. ✅ Conversation continuity (history context)
7. ✅ Error handling (missing fields)
8. ✅ Cost calculation accuracy
```

### Test 4.2: Integration Tests (Frontend)

**Test Chat Component with Real Backend**:

```typescript
// Test file: tests/test-piq-chat-integration.ts

describe('PIQ Chat Integration', () => {
  test('User sends message → receives coaching response', async () => {
    // 1. Load PIQ workshop with essay
    // 2. Run analysis
    // 3. Send chat message: "How can I improve my opening?"
    // 4. Verify response mentions specific draft text
    // 5. Verify response includes voice fingerprint awareness
  });

  test('Chat preserves conversation history', async () => {
    // 1. Send first message
    // 2. Send follow-up message
    // 3. Verify second response references first conversation
  });

  test('Chat handles word count correctly', async () => {
    // 1. Load essay with 348 words (near limit)
    // 2. Ask: "Should I add more details?"
    // 3. Verify response mentions word count and suggests cuts
  });

  test('Chat uses version history', async () => {
    // 1. Create 3 versions (scores: 60 → 68 → 73)
    // 2. Ask: "Am I improving?"
    // 3. Verify response mentions improvement trend
  });
});
```

### Test 4.3: E2E Tests (User Flow)

**Manual Testing Checklist**:

1. ✅ **First Message**
   - Load PIQ Workshop
   - Run analysis
   - Open chat
   - Verify welcome message references quality anchors
   - Send first message
   - Verify response quotes actual draft text

2. ✅ **Conversation Continuity**
   - Send follow-up message
   - Verify coach references previous advice
   - Check conversation starters update appropriately

3. ✅ **Word Count Awareness**
   - Test with essay at 340 words (near limit)
   - Ask for additions
   - Verify response suggests specific cuts

4. ✅ **Voice Preservation**
   - Test with essay with casual voice
   - Ask for improvement suggestions
   - Verify suggestions maintain casual tone

5. ✅ **Quality Anchor Recognition**
   - Test with essay with strong opening sentence
   - Ask about opening
   - Verify coach celebrates the quality anchor

6. ✅ **Error Handling**
   - Test with network offline
   - Verify graceful error message
   - Test recovery when network restored

---

## Phase 5: Database Persistence (Optional)

### Step 5.1: Database Schema

**Table**: `piq_chat_conversations`

```sql
CREATE TABLE piq_chat_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_id TEXT NOT NULL,
  essay_text TEXT NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup
CREATE INDEX idx_piq_chat_user_prompt
  ON piq_chat_conversations(user_id, prompt_id);

-- RLS policies
ALTER TABLE piq_chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
  ON piq_chat_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
  ON piq_chat_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON piq_chat_conversations FOR UPDATE
  USING (auth.uid() = user_id);
```

### Step 5.2: Conversation Persistence Service

**File**: `src/services/piqWorkshop/piqChatPersistence.ts`

```typescript
import { supabase } from '@/lib/supabaseClient';
import { ChatMessage } from './piqChatService';

export async function saveConversation(
  promptId: string,
  essayText: string,
  messages: ChatMessage[]
): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('piq_chat_conversations')
    .upsert({
      user_id: user.user.id,
      prompt_id: promptId,
      essay_text: essayText,
      messages: messages,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,prompt_id'
    });

  if (error) throw error;
}

export async function loadConversation(
  promptId: string
): Promise<ChatMessage[] | null> {
  const { data: user } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('piq_chat_conversations')
    .select('messages')
    .eq('user_id', user.user.id)
    .eq('prompt_id', promptId)
    .single();

  if (error || !data) return null;

  return data.messages as ChatMessage[];
}
```

### Step 5.3: Integrate with Chat Component

**File**: `src/components/portfolio/extracurricular/workshop/components/ContextualWorkshopChat.tsx`

```typescript
// Load from database on mount
useEffect(() => {
  if (mode === 'piq' && piqPromptId) {
    loadConversation(piqPromptId).then(messages => {
      if (messages && messages.length > 0) {
        updateMessages(messages);
      }
    });
  }
}, [piqPromptId]);

// Save to database on changes (debounced)
useEffect(() => {
  if (mode === 'piq' && piqPromptId && chatMessages.length > 0) {
    const timeoutId = setTimeout(() => {
      saveConversation(piqPromptId, currentDraft, chatMessages);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }
}, [chatMessages]);
```

---

## Success Criteria

### Functional Requirements

1. ✅ **Chat responds to user messages** with context-aware coaching
2. ✅ **Voice fingerprint preservation** - Coach references and maintains student voice
3. ✅ **Quality anchor recognition** - Coach celebrates strong sentences
4. ✅ **Word count awareness** - Coach calculates trade-offs for additions
5. ✅ **Conversation continuity** - Responses reference previous advice
6. ✅ **Version history awareness** - Coach tracks improvement trends
7. ✅ **Error handling** - Graceful degradation on API failures

### Performance Requirements

1. ✅ **Response time** < 12 seconds (8-12s expected)
2. ✅ **Cost per message** ~ $0.003 with caching
3. ✅ **Cache hit rate** > 80% for repeated conversations
4. ✅ **Uptime** > 99.5%

### Quality Requirements

1. ✅ **Coaching quality** matches test results (94% pass rate)
2. ✅ **Context utilization** 89% (uses fingerprints, anchors, workshop items)
3. ✅ **Character & fun** 95% (playful, enthusiastic, discovery questions)
4. ✅ **Word count accuracy** 100% (calculates trade-offs correctly)

---

## Implementation Timeline

### Day 1: Backend Deployment (4 hours)
- [ ] Create Supabase edge function structure
- [ ] Port context & service logic to Deno
- [ ] Deploy and test edge function
- [ ] Verify with curl/Postman

### Day 2: Frontend Integration (3 hours)
- [ ] Create API client
- [ ] Update piqChatService to use API
- [ ] Add version history support
- [ ] Test frontend → backend flow

### Day 3: Testing (4 hours)
- [ ] Run backend unit tests
- [ ] Run frontend integration tests
- [ ] Manual E2E testing
- [ ] Fix any issues discovered

### Day 4: Polish & Deploy (2 hours)
- [ ] Review all code changes
- [ ] Update documentation
- [ ] Deploy to production
- [ ] Monitor initial usage

**Total Estimated Time**: 13 hours

---

## Risk Mitigation

### Risk 1: API Key Security
**Mitigation**:
- ✅ API keys stored in Supabase secrets (server-side)
- ✅ Edge function enforces authentication
- ✅ Frontend never sees API keys

### Risk 2: Rate Limiting / Cost Overrun
**Mitigation**:
- ✅ Implement per-user rate limits (10 messages/minute)
- ✅ Add cost tracking and alerts
- ✅ Cache system prompt (84% cost reduction)

### Risk 3: Edge Function Timeout
**Mitigation**:
- ✅ Anthropic response typically 8-12s (well under 150s limit)
- ✅ Implement 30s timeout with graceful fallback
- ✅ Log slow requests for monitoring

### Risk 4: Conversation State Loss
**Mitigation**:
- ✅ Local state management (React state)
- ✅ Optional database persistence
- ✅ Cache conversations in localStorage as backup

---

## Rollback Plan

If critical issues occur:

### Quick Rollback (< 5 minutes)
```typescript
// In piqChatService.ts, switch back to direct Claude calls
import { callClaude } from '@/lib/llm/claude';

export async function sendPIQChatMessage(request: ChatRequest): Promise<ChatResponse> {
  // Use old direct Claude implementation
  // ...
}
```

### Full Rollback
1. Revert frontend service changes
2. Keep edge function deployed (doesn't impact old code)
3. Re-deploy frontend
4. Investigate issues offline

---

## Monitoring & Metrics

### Key Metrics to Track

1. **Usage Metrics**
   - Messages per day
   - Unique users
   - Average conversation length

2. **Performance Metrics**
   - Response time (p50, p95, p99)
   - Cache hit rate
   - Error rate

3. **Cost Metrics**
   - Cost per message
   - Daily/monthly cost
   - Cache savings

4. **Quality Metrics**
   - User satisfaction (thumbs up/down)
   - Conversation completion rate
   - Feature adoption rate

### Monitoring Tools

- Supabase Dashboard - Edge function logs
- Custom analytics events - User interactions
- Sentry - Error tracking
- Console logs - Development debugging

---

## Next Steps After Deployment

1. **Gather User Feedback**
   - Add thumbs up/down on chat messages
   - Collect qualitative feedback
   - Identify pain points

2. **Iterate on Coaching Quality**
   - Analyze conversations with low ratings
   - Refine system prompt
   - Add new coaching patterns

3. **Add Advanced Features**
   - Export conversation as PDF
   - Share conversation with mentor
   - Chat suggestions based on essay tier

4. **Optimize Costs**
   - Increase cache TTL if stable
   - Batch API calls if possible
   - Monitor and adjust max_tokens

---

## Conclusion

This plan provides a **comprehensive, step-by-step roadmap** to deploy the PIQ Chat system with:

✅ **Depth**: Detailed implementation steps for each component
✅ **Rigor**: Comprehensive testing plan (unit, integration, E2E)
✅ **Production Quality**: Security, error handling, monitoring
✅ **Risk Management**: Clear mitigation strategies and rollback plan

**Estimated Effort**: 13 hours over 4 days
**Risk Level**: Low (edge function architecture proven, chat component tested)
**Impact**: High (completes world-class AI Essay Coach experience)

Ready to begin implementation upon approval! 🚀
