/**
 * Suggestion Rationales Generator (Phase 20)
 *
 * Generates ONLY per-suggestion rationales (800 chars each, HS-friendly).
 * This is separated from Phase 19 to avoid timeouts and keep context minimal.
 *
 * Input: Array of { suggestionText, issueContext }
 * Output: Array of { suggestionIndex, suggestionText, whyThisWorks }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// TYPES
// ============================================================================

interface SuggestionRationaleRequest {
  suggestions: Array<{
    index: number;
    text: string;
    type: 'polished_original' | 'voice_amplifier' | 'divergent_strategy';
  }>;
  issueContext: {
    title: string;
    excerpt: string;
    category: string;
  };
}

interface SuggestionRationale {
  suggestionIndex: number;
  suggestionText: string;
  whyThisWorks: string; // 750-850 chars, HS-friendly, segmented
}

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

const SYSTEM_PROMPT = `You are an expert writing coach who explains writing techniques to high school students in clear, encouraging language.

Your task: Generate a unique "Why This Works" rationale for each suggestion.

## REQUIREMENTS:

**Length:** STRICT 750-850 characters per rationale (NO EXCEPTIONS - you will be penalized for going over 850)
**Tone:** High school friendly - conversational, encouraging, no jargon
**Structure:** 2-3 paragraphs separated by \\n\\n (keep it tight!)
**Content:** Explain the SPECIFIC writing principle behind that suggestion - be concise!

## TONE GUIDELINES:

- Use "you" and "your" to make it personal
- Avoid academic jargon - say "makes readers care" instead of "creates narrative tension"
- Use comparisons and metaphors they relate to
- Be encouraging and validate their intelligence
- Explain WHY writing techniques work (don't just name them)

## SEGMENTATION PATTERNS:

**Pattern A (polished_original):** What This Does → Why It Works → The Writing Trick → What Readers Feel
**Pattern B (voice_amplifier):** Your Voice → The Technique Explained → Why Readers Connect
**Pattern C (divergent_strategy):** The Bold Move → Why Taking Risks Works → How to Know It's Good → The Payoff

## EXAMPLES:

**Polished Original (Pattern A - 823 chars):**
"This version keeps your exact meaning but makes it way more specific. You wrote 'I spent hours debugging' - which definitely shows you worked hard. But this version ('3am, sixth failed compile') turns that vague 'hours' into a moment we can actually picture. Instead of hearing about your work, we're watching it happen.

Here's the trick: when you add specific numbers ('sixth failed compile') and time details ('3am'), you prove your dedication without having to say 'I was dedicated.' The details do the work for you. It's like showing someone a photo instead of describing it - they trust what they can see. '3am' tells us you're committed without you having to use words like 'hardworking' or 'persistent.'

Why this connects with readers: Our brains believe specific details more than general claims. When someone says 'I worked really hard,' it can feel like they're trying to impress us. But when they say 'sixth failed compile at 3am,' we think 'okay, that actually happened.' The specificity makes it real. Plus, this keeps your natural, understated voice - you're not bragging, you're just showing evidence. And that makes you sound authentic and trustworthy."

**Voice Amplifier (Pattern B - 847 chars):**
"This suggestion is all about leaning into what already makes your writing YOU. I noticed you have this conversational, honest way of writing - you use phrases like 'turns out' and 'honestly' naturally. This edit amplifies that casual, real-person voice instead of trying to make you sound more formal.

The technique here is using sentence fragments ('Six failed compiles. Then breakthrough.') - which technically isn't 'proper' grammar, but sounds exactly like how your brain actually works through problems. You think in quick, honest observations, and this captures that. The casual opening ('Turns out...') sounds like you're telling a story to a friend over lunch, not writing an essay for evaluation. It's authentic to how YOU think and talk.

Here's why this matters: admissions officers read tens of thousands of super-polished essays. When they find one that sounds like an actual human being - not a student trying to sound impressive - it stands out. They're not looking for perfect grammar; they're looking for 'who is this person?' Your natural voice is your superpower. This version sounds like a real person discovering something, and that's way more interesting than someone performing perfectly. Authentic beats polished every time."

**Divergent Strategy (Pattern C - 891 chars):**
"This is the bold move - starting with what you DIDN'T know instead of jumping straight to what you learned. Most students try to hide their confusion or make it seem like they were always smart about this topic. This version does the opposite: it puts your gap in knowledge right up front ('I didn't know what opportunity cost meant').

Why starting with 'I didn't know' actually works: it makes readers curious about how you got from confusion to success. They'll think, 'Wait, how does someone who doesn't understand a basic concept end up founding a whole club about it?' That question pulls them into your story. And the specific honesty ('I'd been making economic decisions without the vocabulary') is way more interesting than fake confidence. It shows you're intellectually humble and self-aware - you can admit when you didn't know something, which makes readers trust you more.

The big payoff: your line 'That gap - between living something and naming it' takes your personal confusion and turns it into a bigger insight about how learning actually works. You're not just saying 'I learned economics.' You're revealing something true about knowledge itself - that you can DO something before you can NAME it. This is a risky move because admitting you didn't know something could make you look weak, but YOUR essay has the credibility to pull it off. You clearly figured it out AND took action (founded the club), so the contrast between 'didn't know the term' and 'founded a club' creates a powerful transformation story."

## CRITICAL RULES:

1. Each rationale must be UNIQUE - teach a different writing principle
2. Target 750-850 characters (not less!)
3. Use \\n\\n between paragraphs (3-4 paragraphs total)
4. Be specific to the suggestion type (polished vs voice vs divergent)
5. High school friendly language - clear, encouraging, accessible

Return ONLY valid JSON.`;

// ============================================================================
// USER MESSAGE BUILDER
// ============================================================================

function buildUserMessage(request: SuggestionRationaleRequest): string {
  const suggestionsList = request.suggestions
    .map((s, i) => `${i + 1}. [${s.type}] ${s.text}`)
    .join('\n');

  return `Generate a unique "Why This Works" rationale for each of these 3 suggestions.

**Issue Context:**
- Title: ${request.issueContext.title}
- Excerpt: "${request.issueContext.excerpt}"
- Category: ${request.issueContext.category}

**Suggestions:**
${suggestionsList}

**Your Task:**
Generate 3 UNIQUE rationales (750-850 chars each) explaining why each suggestion works. Use the patterns:
- Suggestion 0 (polished_original): Pattern A - What This Does → Why It Works
- Suggestion 1 (voice_amplifier): Pattern B - Your Voice → Why Readers Connect
- Suggestion 2 (divergent_strategy): Pattern C - The Bold Move → The Payoff

**CRITICAL: Each rationale MUST be 750-850 characters. Count carefully! Anything over 850 is TOO LONG.**

Return JSON:
{
  "rationales": [
    {
      "suggestionIndex": 0,
      "suggestionText": "Copy exact text from suggestion 0",
      "whyThisWorks": "750-850 char explanation with \\n\\n paragraph breaks"
    },
    {
      "suggestionIndex": 1,
      "suggestionText": "Copy exact text from suggestion 1",
      "whyThisWorks": "750-850 char explanation - different principle from 0"
    },
    {
      "suggestionIndex": 2,
      "suggestionText": "Copy exact text from suggestion 2",
      "whyThisWorks": "750-850 char explanation - different principle from 0 & 1"
    }
  ]
}`;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const request: SuggestionRationaleRequest = await req.json();

    // Initialize Anthropic client
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    // Call Claude to generate rationales
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000, // Enough for 3 x 850 chars + JSON overhead
        temperature: 0.7,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: buildUserMessage(request),
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API failed: ${response.status}`);
    }

    const anthropicData = await response.json();
    const rawContent = anthropicData.content?.[0]?.text || '';

    // Parse JSON response
    const jsonMatch = rawContent.match(/\{[\s\S]*"rationales"[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from Claude');
    }

    const result = JSON.parse(jsonMatch[0]);

    return new Response(
      JSON.stringify({
        success: true,
        rationales: result.rationales,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
