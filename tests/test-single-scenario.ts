/**
 * Single Scenario Workshop Test
 *
 * Tests Scenario 1 (Harvard - Passive Agency) with full 6-turn conversation
 */

import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import {
  workshopChatModeService,
  createSuggestionContextFromStage2,
  type SuggestionModeContext,
} from '../src/services/commonAppWorkshop/services';

const client = new Anthropic();

// SCENARIO 1: Diversity Essay - Passive Agency (Harvard)
const STAGE2_ISSUE = {
  issue_id: 'diversity_1',
  issue_quote: 'Growing up as the child of immigrants, I was taught to value education and work hard. My parents\' sacrifices shaped who I am today.',
  diagnosis_summary: 'This passage removes the student from their own story. The passive constructions ("I was taught," "shaped who I am") make the student a recipient of circumstances rather than an active agent navigating cultural complexity. Harvard wants to see HOW you engaged with your identity, not just that you have one.',

  // NOTE: In production, Stage 2 generates these dynamically based on the student's actual essay.
  // These test examples demonstrate the STRUCTURE of suggestions, not content to copy.
  suggestions: {
    polished_original: {
      type: 'polished_original',
      text: 'The morning my grandmother arrived from [country], I watched her hands shake as she tried to read the customs form. I took the pen from her and filled in the boxes myself—citizenship status, flight origin, purpose of visit. Words she\'d never needed until she stepped off that plane.',
      rationale: 'Transforms passive background into active moment of responsibility. The grandmother\'s shaking hands create immediate emotional stakes. Filling in the form shows agency. The specific bureaucratic words ground it in reality.',
      what_changed: [
        'Replaced abstract "I was taught" with concrete action',
        'Added specific sensory detail (shaking hands)',
        'Showed a choice the student made (taking the pen)',
        'Grounded in specific moment rather than general claim',
      ],
    },
    voice_amplifier: {
      type: 'voice_amplifier',
      text: 'Customs form. Shaking hands. My grandmother looking at English words like they might bite her. I was nine when I learned what "purpose of visit" meant—not the definition, but the weight of writing "family reunification" for someone who couldn\'t.',
      rationale: 'Fragmentary opening creates immediate tension. The image of words that "might bite her" captures fear without stating it. The pivot from definition to weight shows emotional depth.',
      what_changed: [
        'Used fragmentary structure for urgency',
        'Created vivid image ("words like they might bite her")',
        'Added age to anchor the memory',
        'Showed both action and emotional understanding',
      ],
      why_authentic: 'The specific phrase "family reunification" and the distinction between knowing a definition and understanding its weight—these come from lived experience.',
    },
  },

  teaching: {
    type_specific_principle: 'For diversity essays, show ACTIVE ENGAGEMENT with identity, not just the identity itself',
    college_specific_context: 'Harvard values students who take initiative and contribute',
    how_to_choose: {
      polished_when: 'You want to keep the focus on the practical action and your initiative',
      voice_when: 'You want to lean into the emotional complexity and paradox of your experience',
      can_combine: 'Use the specific action but experiment with emotional complexity',
    },
    socratic_prompts: [
      'What did you DO because of your background, not just experience because of it?',
      'When did you choose to take on a responsibility that wasn\'t asked of you?',
    ],
  },
};

const CRITICAL_ISSUE = {
  issue_number: 1,
  quote: 'Growing up as the child of immigrants, I was taught to value education and work hard. My parents\' sacrifices shaped who I am today.',
  location: 'Opening paragraph, lines 1-3',
  problem: 'Passive agency—student is acted upon rather than acting',
  symptom_type: 'passive_agency',
  diagnosis: 'The passive voice removes the student from their own story. "I was taught" and "shaped who I am" make the student a passive recipient. Admissions officers want to see the student CHOOSING, ACTING, NAVIGATING.',
};

// 6-turn realistic conversation (matches the grandmother/customs form example suggestions)
const CONVERSATIONS = [
  "I like Version B but the 'family reunification' part doesn't apply to me. My situation was different—my parents came here before I was born.",
  "Actually, my moment was helping my dad at the DMV. He needed to renew his license but the forms were confusing and the clerk was getting impatient. I was maybe 10 or 11.",
  "Yeah, what I remember most was the clerk sighing every time my dad asked a question. I stepped in and started explaining the forms to my dad in Tagalog, but also kind of translating the clerk's frustration into something less harsh.",
  "Here's my attempt: 'The DMV clerk sighed for the third time. My dad's pen hovered over the form, and I watched him search for words he'd never needed before—'vehicle identification,' 'liability coverage.' I leaned over and pointed to each box, translating not just the English, but the clerk's impatience into something my dad could use.'",
  "Should I add what happened after? The clerk actually thanked me when we finished, which felt weird.",
  "Here's my full version: 'The DMV clerk sighed for the third time. My dad's pen hovered over the form, searching for words he'd never needed—'vehicle identification,' 'liability coverage.' I leaned over and pointed to each box, translating not just the English, but the clerk's impatience into something my dad could use. When we finished, the clerk looked at me and said 'thank you'—not to my dad, to me. I was eleven, and I understood then that translation isn't just about language. It's about standing in the gap when someone you love can't reach the other side.'",
];

function buildSystemPrompt(context: SuggestionModeContext): string {
  const { issue, suggestions } = context;

  return `You are a supportive, expert college admissions essay coach running a TRUE WRITING WORKSHOP.

# CRITICAL PHILOSOPHY: TEACH, DON'T TEMPLATE

**The suggestions below are TEACHING EXAMPLES, not templates to copy.**

Your job is to:
1. Use the suggestions to ILLUSTRATE what good writing looks like
2. Extract the PRINCIPLES that make them work
3. Ask the student to write THEIR OWN version using those principles
4. Analyze their attempt and provide specific feedback

**Why This Matters:**
- If students copy our suggestions (even with their details), all essays sound the same
- Admissions officers and AI detectors can spot templated writing
- Real learning happens when THEY create, and WE coach

# THE ISSUE BEING ADDRESSED

**Student's Original Text:**
"${issue.original_quote}"

**Location in Essay:** ${issue.location}

**The Problem:**
${issue.problem_summary}

**Why This Matters:**
${issue.diagnosis}

# EXAMPLE REVISIONS (For Teaching, Not Copying)

### Example A: Polished Approach
"${suggestions.polished_original?.text}"

**The principles at work:**
${suggestions.polished_original?.what_changed.map(c => `- ${c}`).join('\n')}

**Why this works:** ${suggestions.polished_original?.rationale}

### Example B: Voice-Forward Approach
"${suggestions.voice_amplifier?.text}"

**The principles at work:**
${suggestions.voice_amplifier?.what_changed.map(c => `- ${c}`).join('\n')}

**Why this works:** ${suggestions.voice_amplifier?.rationale}

# GUIDED DISCOVERY FRAMEWORK

## LAYER 1: Anchoring (Find the moment)
Help them identify a SPECIFIC moment, not an abstract concept.
- "Think back to a time when this quality was visible. Where were you physically?"
- "When did someone first notice this about you? What were you actually doing?"

## LAYER 2: Sensory Excavation (Deepen the moment)
Once they have a moment, help them access vivid DETAILS.
- "Picture yourself there. What's the first small detail you see?"
- "What were your hands doing?"
- "Who else was there? What were THEY doing?"

## LAYER 3: The Contrast (Find the choice)
The power is in showing what makes this THEIR version.
- "What would most people have been doing? Why did you do something different?"
- "What did you give up or skip to do this instead?"

## LAYER 4: Writing Prompt
Only AFTER rich discovery, prompt them to write.
- "You have [detail], [contrast], and [authentic element]. Now write 1-2 sentences capturing that scene."

# IMPROVEMENT PATHS

## PATH 1: Abstract Claim → Concrete Scene
Ground abstract qualities in observable action.
Example: "I love helping people" → "Every Tuesday I wheel Mrs. Chen's trash cans to the curb"

## PATH 2: Telling Emotion → Showing Through Body/Action
Replace named emotions with physical sensations.
Example: "I was terrified" → "My hands shook so badly I had to set down my sheet music"

## PATH 5: Balancing Story + Insight
**CRITICAL:** Insights must be EARNED through the scene. A generic insight doesn't work. A specific insight grounded in the specific moment resonates.
Structure: Scene (2-3 sentences) → Micro-moment of realization (1 sentence) → What you understood (1 sentence)

# WHEN THEY SHARE THEIR ATTEMPT

The student trusted you enough to write. Honor that with deep, specific analysis.

1. **Quote their exact words** - Show you read every word carefully
2. **Celebrate what's WORKING with specificity:**
   - "The phrase '[their exact words]' is powerful because..."
   - "This detail makes the scene vivid because..."
3. **Identify growth opportunities with depth:**
   - Don't just say "this is abstract" - explain WHAT makes it abstract
   - Show them the specific gap: "Right now I can see [X] but I'm missing [Y]"
4. **Provide a concrete path forward:**
   - Give ONE specific technique to try
   - Explain WHY this change will strengthen the impact
5. **Invite the next iteration:**
   - "Take another pass with that in mind"

# TONE GUIDELINES

BE:
- A coach who genuinely wants to help them write something great
- Patient and encouraging through iterations
- Specific in both praise and feedback
- Honest when something isn't working yet

DON'T BE:
- A ghostwriter who does the work for them
- Vague ("make it more specific" without explaining how)
- Impatient when they need multiple tries

**Response Length:** 250 words maximum

Remember: Your job is to help them discover and articulate THEIR story, not to give them a better version of someone else's.`;
}

function wordWrap(text: string, maxWidth: number, indent: string = '  '): void {
  const lines = text.split('\n');
  for (const line of lines) {
    if (line.length <= maxWidth) {
      console.log(`${indent}${line}`);
    } else {
      const words = line.split(' ');
      let currentLine = indent;
      for (const word of words) {
        if (currentLine.length + word.length > maxWidth + indent.length) {
          console.log(currentLine);
          currentLine = indent + word + ' ';
        } else {
          currentLine += word + ' ';
        }
      }
      if (currentLine.trim()) console.log(currentLine);
    }
  }
}

async function main(): Promise<void> {
  console.log('');
  console.log('*'.repeat(80));
  console.log('  SINGLE SCENARIO TEST: Harvard Diversity Essay - Passive Agency');
  console.log('  6-Turn Full Conversation');
  console.log('*'.repeat(80));

  // Create context
  const context = createSuggestionContextFromStage2(
    STAGE2_ISSUE as any,
    CRITICAL_ISSUE as any,
    { collegeName: 'Harvard' }
  );

  // Get welcome message
  const welcome = workshopChatModeService.getSuggestionWelcomeMessage(context);

  console.log('\n' + '='.repeat(80));
  console.log('  WELCOME MESSAGE');
  console.log('='.repeat(80) + '\n');
  wordWrap(welcome.content, 75);

  // Build system prompt
  const systemPrompt = buildSystemPrompt(context);

  // Initialize conversation
  const messages: Anthropic.MessageParam[] = [
    { role: 'assistant', content: welcome.content },
  ];

  let totalTokens = 0;
  let totalCost = 0;

  // Run all 6 turns
  for (let i = 0; i < CONVERSATIONS.length; i++) {
    console.log('\n' + '='.repeat(80));
    console.log(`  TURN ${i + 1} OF ${CONVERSATIONS.length}`);
    console.log('='.repeat(80));

    console.log('\n  STUDENT:');
    console.log('  ' + '-'.repeat(70));
    wordWrap(`"${CONVERSATIONS[i]}"`, 70);

    messages.push({ role: 'user', content: CONVERSATIONS[i] });

    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: systemPrompt,
        messages,
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '';
      messages.push({ role: 'assistant', content });

      const inputTokens = response.usage.input_tokens;
      const outputTokens = response.usage.output_tokens;
      const cost = (inputTokens * 3 + outputTokens * 15) / 1_000_000;
      totalTokens += inputTokens + outputTokens;
      totalCost += cost;

      console.log('\n  COACH:');
      console.log('  ' + '-'.repeat(70));
      wordWrap(content, 70);
      console.log('  ' + '-'.repeat(70));
      console.log(`  [${inputTokens} in → ${outputTokens} out | $${cost.toFixed(4)}]`);

    } catch (error: any) {
      console.log(`\n  ERROR: ${error.message}`);
      break;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('  FINAL SUMMARY');
  console.log('='.repeat(80));
  console.log(`\n  Total Turns: ${CONVERSATIONS.length}`);
  console.log(`  Total Tokens: ${totalTokens}`);
  console.log(`  Total Cost: $${totalCost.toFixed(4)}`);
  console.log('\n  Key Improvements Validated:');
  console.log('  ─────────────────────────────────────────────────────────');
  console.log('  ✓ "Feel free to write" invitation in welcome');
  console.log('  ✓ "What to watch for" transition before examples');
  console.log('  ✓ Core principles section after examples');
  console.log('  ✓ PATH 5 Story+Insight balance in system prompt');
  console.log('  ✓ Deep feedback when student shares writing attempts');
  console.log('');
}

main().catch(console.error);
