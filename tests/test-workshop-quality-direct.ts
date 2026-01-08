/**
 * Test Workshop Response Quality - Direct API Call
 *
 * Tests the TRUE WRITING WORKSHOP approach:
 * 1. Coach teaches the principle
 * 2. Student writes their own version
 * 3. Coach analyzes and provides feedback
 * 4. Iterate until authentic and strong
 *
 * Key validation: Coach should NOT write for the student
 */

import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

// ============================================================================
// TEST DATA
// ============================================================================

const TEST_ISSUE = {
  quote: 'I have always been passionate about learning and pushing myself to achieve my goals.',
  location: 'Opening paragraph, lines 1-2',
  problem: 'Generic claim of passion without concrete evidence or specific moment',
  diagnosis: 'The student TELLS about passion without SHOWING a moment where that passion was visible through behavior.',
};

const TEST_SUGGESTIONS = {
  polished_original: {
    text: 'In third grade, I spent my recess rereading the same library book about space while everyone else played kickball.',
    rationale: 'Replaces abstract claim with specific scene showing passion through behavior. The contrast (reading vs kickball) demonstrates choice.',
    what_changed: [
      'Replaced "passionate about learning" with specific action (rereading space book)',
      'Added specific time/place (third grade, recess, library)',
      'Added contrast with peers (kickball) to show unique choice',
    ],
    safety_level: 'safe',
    when_to_use: 'When you want a reliable improvement that shows rather than tells',
  },
  voice_amplifier: {
    text: "Third grade recess: everyone sprinting toward the kickball diamond, me sprinting toward the library. Same book about Jupiter's moons. Fifth time that week.",
    rationale: 'Uses sentence fragments and parallel structure to create energy. The "fifth time" detail adds authenticity.',
    what_changed: [
      'Used fragmentary style for energy and personality',
      'Added parallel structure (everyone sprinting / me sprinting)',
      "Added specific detail (Jupiter's moons, fifth time)",
    ],
    why_authentic: 'The fragmentary style and specific detail (fifth time) sounds like natural teenage voice',
    risk_level: 'medium',
    when_to_use: 'When you want to show personality and take creative risk',
  },
  how_to_choose: {
    polished_when: 'You want safe improvement and your essay is already voice-forward elsewhere',
    voice_when: 'This is a key moment and you want to establish your distinctive voice early',
    can_combine: 'Take the specific detail (space/Jupiter) from both and blend with your own sentence structure',
  },
};

// ============================================================================
// SYSTEM PROMPTS
// ============================================================================

function buildSuggestionModePrompt(): string {
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
- Their authentic voice matters more than "perfect" phrasing

# THE ISSUE BEING ADDRESSED

**Student's Original Text:**
"${TEST_ISSUE.quote}"

**Location in Essay:** ${TEST_ISSUE.location}

**The Problem:**
${TEST_ISSUE.problem}

**Why This Matters:**
${TEST_ISSUE.diagnosis}

# EXAMPLE REVISIONS (For Teaching, Not Copying)

These show what APPLYING the technique looks like. Use them to explain principles, NOT as templates.

### Example A: Polished Approach
"${TEST_SUGGESTIONS.polished_original.text}"

**The principles at work:**
${TEST_SUGGESTIONS.polished_original.what_changed.map(c => `- ${c}`).join('\n')}

**Why this works:** ${TEST_SUGGESTIONS.polished_original.rationale}

### Example B: Voice-Forward Approach
"${TEST_SUGGESTIONS.voice_amplifier.text}"

**The principles at work:**
${TEST_SUGGESTIONS.voice_amplifier.what_changed.map(c => `- ${c}`).join('\n')}

**Why this works:** ${TEST_SUGGESTIONS.voice_amplifier.rationale}
**The risk/reward:** ${TEST_SUGGESTIONS.voice_amplifier.why_authentic}

# GUIDED DISCOVERY FRAMEWORK

Your questions should guide their thinking progressively, not ask them to generate ideas from nothing.

## LAYER 1: Anchoring Questions (Find the moment)
Purpose: Help them identify a SPECIFIC moment, not an abstract concept.

**Explain why you're asking:**
"The examples above work because they show SPECIFIC scenes, not general claims. Let me help you find YOUR specific moment that shows this same quality."

**Anchoring questions:**
- "Think back to a time when this quality was visible in you. Where were you physically? What time of day was it?"
- "When did someone first notice this about you? What were you actually doing when they noticed?"
- "What's a moment when you surprised yourself with how much you cared about this?"

## LAYER 2: Sensory Excavation (Deepen the moment)
Purpose: Once they have a moment, help them access the DETAILS that make it vivid.

**Explain why details matter:**
"I know WHAT happened, but I can't SEE it yet. Notice how the examples have details like 'same worn copy of Hawking's book' or 'fifth time that week.' These specifics make readers feel present. Let's find YOUR version of those details."

**Sensory questions (pick 2-3 relevant ones):**
- "Picture yourself there. What's the first small detail you see?"
- "What sounds were in the background?"
- "What were your hands doing? Holding something?"
- "Who else was there? What were THEY doing differently?"

## LAYER 3: The Contrast (Find the choice)
Purpose: The examples work because they show CHOICE—doing something different from others.

**Explain why contrast matters:**
"Notice in the examples: 'everyone sprinting toward the kickball diamond, me sprinting toward the library.' The power is in the CONTRAST. What were others doing while you were doing this?"

**Contrast questions:**
- "What would most people have been doing in that moment? Why did you do something different?"
- "Did anyone notice you were doing something unusual? How did they react?"
- "What did you give up or skip to do this instead?"

## LAYER 4: Writing Prompt (Now they're ready)
Only AFTER they've surfaced rich details, prompt them to write.

**The transition:**
"You've given me great material. You have [specific detail], [contrast with others], and [authentic element they mentioned]. Now put yourself back there and write 1-2 sentences capturing that scene. Don't worry about making it perfect—just get the moment down. We'll refine it together."

# HANDLING COMMON SITUATIONS

**If they ask "Can I just use Example A/B?"**
"I understand the temptation—those examples are good! But here's the thing: if you use them with just your details swapped in, your essay will sound like everyone else who does the same thing. Admissions officers read thousands of essays and can spot templates instantly. Let's find YOUR moment instead. What's a time when [quality they're trying to show] was visible in your life?"

**If they give a thin/generic response:**
"That's a starting point, but right now it could be anyone's story. What's the detail that makes it specifically YOURS? The thing you'd remember that no one else would know?"

**If they seem stuck:**
"Let's try a different angle. Forget the 'perfect' moment. What's a tiny moment—a single afternoon, a specific conversation, even a random Tuesday? Sometimes the small moments are more powerful than the big ones."

**When they share their attempt:**
1. Quote exactly what they wrote
2. Identify what's WORKING: "The phrase '[their words]' is strong because..."
3. Identify what needs work: "This part is still a bit abstract. Help me SEE it."
4. Give ONE targeted improvement: "Keep everything else, but add [specific element]"
5. Ask for revision: "Take another pass with that in mind"

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
- Discouraging about their genuine attempts

**Response Length:** 300 words maximum

Remember: Your job is to help them discover and articulate THEIR story, not to give them a better version of someone else's.`;
}

// ============================================================================
// TESTS
// ============================================================================

async function testSuggestionModeConversation(): Promise<void> {
  console.log('');
  console.log('═'.repeat(80));
  console.log('  SUGGESTION MODE - Real Conversation Quality Test');
  console.log('═'.repeat(80));

  const systemPrompt = buildSuggestionModePrompt();

  // Welcome message - Warm, conversational, makes them feel understood and in good hands
  const welcomeMessage = `**Here's the thing nobody tells you:** The sentence you're most proud of might be the one hurting your essay.

"${TEST_ISSUE.quote}"

I want you to know something: this isn't a "bad" sentence. It's actually exactly the kind of thing most students write, and for good reason—you're trying to communicate something real about yourself. The problem is that *everyone* writes sentences like this, which means yours gets lost in the pile.

**Here's what's actually happening:** ${TEST_ISSUE.diagnosis} It's not that the sentiment is wrong—it's that admissions officers can't *see* you yet. They're reading a claim when what they need is a window into who you actually are.

**The good news:** This is completely fixable, and you already have everything you need. We're not going to invent something new about you—we're going to find a real moment that already happened and let *that* do the talking.

Let me show you what I mean. Here's your sentence transformed two different ways:

**Version A** (clean and direct):
"${TEST_SUGGESTIONS.polished_original.text}"

*Why this works:* ${TEST_SUGGESTIONS.polished_original.rationale}

**Version B** (more personality, more risk):
"${TEST_SUGGESTIONS.voice_amplifier.text}"

*Why this works:* ${TEST_SUGGESTIONS.voice_amplifier.rationale}

See the difference? Both versions work because they follow the same principles:
- **A specific moment** instead of a general claim ("always" or "every time")
- **Visible action** that someone could observe, not just an internal feeling
- **A choice that reveals character**—you did this instead of something else

Now, those examples are teaching tools—they're not YOUR story. But you have moments like this. Everyone does. The trick is finding the right one and knowing how to capture it.

**That's what we're going to do together.**

Think back to a time when this quality—the one you're trying to show—was actually visible in your life. Not when you *felt* it, but when someone watching you would have *seen* it. A single moment. Could be big, could be small. Where were you? What were you actually doing?`;

  console.log('\n  WELCOME MESSAGE:');
  console.log('  ' + '─'.repeat(70));
  welcomeMessage.split('\n').forEach(line => console.log(`  ${line}`));
  console.log('  ' + '─'.repeat(70));

  // Conversation turns - TRUE WORKSHOP FLOW
  // 1. Student asks for clarification (coach should teach principle, not give copy-paste)
  // 2. Student shares a memory (coach should ask them to write)
  // 3. Student writes their attempt (coach should analyze and give feedback)
  const conversationTurns = [
    "Can I just use one of those examples? Maybe change the space part to something I actually did?",
    "OK fine. I remember in 8th grade I spent every lunch period in the library reading about black holes. My friends thought I was weird.",
    "Here's my attempt: 'Eighth grade lunch meant my friends heading to the cafeteria while I headed to the library. Same astronomy section. Same worn copy of Hawking's book.'",
  ];

  const messages: Anthropic.MessageParam[] = [
    { role: 'assistant', content: welcomeMessage },
  ];

  let totalTokens = 0;
  let totalCost = 0;

  for (const userMessage of conversationTurns) {
    console.log(`\n  STUDENT: "${userMessage}"`);
    console.log('');

    messages.push({ role: 'user', content: userMessage });

    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: systemPrompt,
        messages,
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '';

      console.log('  COACH RESPONSE:');
      console.log('  ' + '─'.repeat(70));
      content.split('\n').forEach(line => {
        if (line.length <= 74) {
          console.log(`  ${line}`);
        } else {
          // Word wrap
          const words = line.split(' ');
          let currentLine = '  ';
          for (const word of words) {
            if (currentLine.length + word.length > 74) {
              console.log(currentLine);
              currentLine = '  ' + word + ' ';
            } else {
              currentLine += word + ' ';
            }
          }
          if (currentLine.trim()) console.log(currentLine);
        }
      });
      console.log('  ' + '─'.repeat(70));

      const inputCost = response.usage.input_tokens * 0.003 / 1000;
      const outputCost = response.usage.output_tokens * 0.015 / 1000;
      const turnCost = inputCost + outputCost;
      totalTokens += response.usage.input_tokens + response.usage.output_tokens;
      totalCost += turnCost;

      console.log(`  [${response.usage.input_tokens} in / ${response.usage.output_tokens} out | $${turnCost.toFixed(4)}]`);

      messages.push({ role: 'assistant', content });

    } catch (error: any) {
      console.log(`  ERROR: ${error.message}`);
    }
  }

  console.log('\n' + '═'.repeat(80));
  console.log(`  TOTAL: ${totalTokens} tokens | $${totalCost.toFixed(4)}`);
  console.log('═'.repeat(80));
}

async function testUniversalChatComparison(): Promise<void> {
  console.log('\n');
  console.log('═'.repeat(80));
  console.log('  COMPARISON: Workshop Mode vs Generic Prompt');
  console.log('═'.repeat(80));

  const question = "I like the second option but those fragments feel risky for my Stanford app. Help?";

  console.log(`\n  Question: "${question}"`);

  // Generic prompt (what universal chat might do)
  const genericPrompt = `You are a helpful college essay coach. Help the student with their question.`;

  // Workshop Mode prompt (with full context)
  const workshopPrompt = buildSuggestionModePrompt();

  console.log('\n  --- GENERIC CHAT (no context) ---');

  try {
    const genericResponse = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      system: genericPrompt,
      messages: [{ role: 'user', content: question }],
    });

    const content = genericResponse.content[0].type === 'text' ? genericResponse.content[0].text : '';
    console.log('');
    content.split('\n').slice(0, 10).forEach(line => console.log(`  ${line}`));
    if (content.split('\n').length > 10) console.log('  ...');
  } catch (error: any) {
    console.log(`  ERROR: ${error.message}`);
  }

  console.log('\n  --- WORKSHOP SUGGESTION MODE (full context) ---');

  try {
    const workshopResponse = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      system: workshopPrompt,
      messages: [
        { role: 'assistant', content: `Hey! Let's work on your opening. Here are two options...[full welcome message]` },
        { role: 'user', content: question },
      ],
    });

    const content = workshopResponse.content[0].type === 'text' ? workshopResponse.content[0].text : '';
    console.log('');
    content.split('\n').forEach(line => console.log(`  ${line}`));
  } catch (error: any) {
    console.log(`  ERROR: ${error.message}`);
  }

  console.log('\n' + '═'.repeat(80));
  console.log('  KEY DIFFERENCES:');
  console.log('  • Workshop Mode references the ACTUAL suggestions');
  console.log('  • Workshop Mode knows what "option 2" and "fragments" mean');
  console.log('  • Workshop Mode can give specific adaptation advice');
  console.log('  • Generic chat has to guess what the student is talking about');
  console.log('═'.repeat(80));
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  console.log('');
  console.log('*'.repeat(80));
  console.log('  WORKSHOP MODE - RESPONSE QUALITY TEST');
  console.log('  Testing real Claude responses for fun, clarity, and helpfulness');
  console.log('*'.repeat(80));

  await testSuggestionModeConversation();
  await testUniversalChatComparison();

  console.log('\n');
  console.log('═'.repeat(80));
  console.log('  TRUE WRITING WORKSHOP - QUALITY CHECKLIST:');
  console.log('═'.repeat(80));
  console.log('');
  console.log('  CRITICAL (Must Pass):');
  console.log('  ─────────────────────');
  console.log('  [ ] Does NOT write full sentences for them to copy');
  console.log('  [ ] Does NOT give templates with blanks to fill');
  console.log('  [ ] DOES ask discovery questions about their experience');
  console.log('  [ ] DOES prompt them to write their own version');
  console.log('  [ ] DOES analyze their attempt when they share writing');
  console.log('');
  console.log('  GUIDED DISCOVERY (New Framework):');
  console.log('  ─────────────────────────────────');
  console.log('  [ ] Explains WHY each question is being asked');
  console.log('  [ ] Uses anchoring questions to find specific moments');
  console.log('  [ ] Uses sensory excavation to deepen details');
  console.log('  [ ] Uses contrast questions to surface choice/stakes');
  console.log('  [ ] Only prompts writing AFTER discovery yields rich material');
  console.log('  [ ] Digs deeper when student gives thin/generic responses');
  console.log('');
  console.log('  QUALITY (Should Pass):');
  console.log('  ─────────────────────');
  console.log('  [ ] Explains principles clearly (show vs tell, specificity)');
  console.log('  [ ] References examples to illustrate (not as templates)');
  console.log('  [ ] Quotes student\'s actual words when giving feedback');
  console.log('  [ ] Gives ONE targeted improvement suggestion per turn');
  console.log('  [ ] Encouraging but honest about what needs work');
  console.log('');
  console.log('  KEY VALIDATION:');
  console.log('  ─────────────────────');
  console.log('  If student asks "Can I just use the example?"');
  console.log('  → Coach should redirect to writing their own version');
  console.log('  → Coach should explain WHY copying hurts authenticity');
  console.log('');
  console.log('  When student shares a memory:');
  console.log('  → Coach should DIG DEEPER with sensory/contrast questions');
  console.log('  → Coach should NOT immediately prompt for writing');
  console.log('');
  console.log('  When student shares their attempt:');
  console.log('  → Coach should QUOTE their exact words');
  console.log('  → Coach should identify what WORKS and what NEEDS WORK');
  console.log('  → Coach should give ONE targeted improvement');
  console.log('');
}

main().catch(console.error);
