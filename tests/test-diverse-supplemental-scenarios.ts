/**
 * Diverse Supplemental Scenarios Test
 *
 * Tests workshop mode across DIFFERENT types of issues that require
 * approaches beyond pure storytelling:
 *
 * Scenario 1: SHORT "Why Major" (150 words) - Needs technical depth + passion, NOT a story
 * Scenario 2: WEAK HOOK - Opening lacks punch, needs attention-grabbing start
 * Scenario 3: GENERIC INSIGHT - Has story but lacks unique perspective/learning
 * Scenario 4: WEAK CLOSING - Good essay but ending falls flat
 */

import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import {
  workshopChatModeService,
  createSuggestionContextFromStage2,
  type SuggestionModeContext,
} from '../src/services/commonAppWorkshop/services';

const client = new Anthropic();

// ============================================================================
// SCENARIO 1: SHORT "WHY MAJOR" - Technical Depth + Passion (NOT Storytelling)
// ============================================================================
const SCENARIO_1 = {
  name: 'Why Computer Science (150 words) - Technical + Passion',
  stage2Issue: {
    issue_id: 'why_major_1',
    issue_quote: 'I want to study computer science because technology is the future and I want to be part of it. I have always been interested in coding and problem-solving.',
    diagnosis_summary: 'This reads like every other CS applicant. No specific technical interest, no unique angle, no demonstration of existing knowledge. With only 150 words, you need density—every sentence must prove something.',

    suggestions: {
      polished_original: {
        type: 'polished_original',
        text: 'I want to study computer science because I\'m obsessed with the gap between how humans think and how machines process. My first neural network—a digit classifier I trained on MNIST—got 94% accuracy, but I couldn\'t explain WHY it misclassified certain 7s as 1s. That question led me to interpretability research, to Anthropic\'s work on mechanistic interpretability, to building my own visualization tools for attention patterns.',
        rationale: 'Shows specific technical knowledge (MNIST, accuracy metrics, attention patterns), demonstrates genuine curiosity (the WHY question), and reveals a research trajectory. This couldn\'t be written by someone who just "likes coding."',
        what_changed: [
          'Replaced generic "technology is the future" with specific intellectual obsession',
          'Named actual technical concepts (neural networks, MNIST, interpretability)',
          'Showed a progression of curiosity, not just interest',
          'Demonstrated existing work, not just future plans',
        ],
      },
      voice_amplifier: {
        type: 'voice_amplifier',
        text: 'My digit classifier hit 94% accuracy and I should have been thrilled. Instead, I spent three weeks asking why it thought certain 7s were 1s. That question—why does the model fail where humans don\'t?—led me to interpretability research. I\'ve since built visualization tools for attention patterns, read every Anthropic paper on mechanistic interpretability, and discovered that the most interesting problems in CS aren\'t about making machines smarter. They\'re about understanding what "smart" even means.',
        rationale: 'Opens with unexpected emotional hook (should have been thrilled, wasn\'t). Shows obsessive curiosity. Ends with a genuine insight about the field. Technical terms are embedded naturally.',
        what_changed: [
          'Started with counterintuitive hook (success that felt like failure)',
          'Embedded technical depth without making it feel like a resume',
          'Ended with a genuine intellectual insight about the field',
          'Made the passion feel earned through specific examples',
        ],
        why_authentic: 'The specific detail about 7s and 1s, the three-week obsession, the pivot to interpretability—this trajectory is too specific to fake.',
      },
    },

    teaching: {
      type_specific_principle: 'For "Why Major" essays, show EXISTING engagement, not just future interest. Name specific concepts, projects, or questions that prove you\'re already thinking like someone in this field.',
      how_to_choose: {
        polished_when: 'You want to emphasize your research trajectory and technical depth',
        voice_when: 'You want to lead with curiosity and end with an insight',
        can_combine: 'Technical depth with personal voice and genuine questioning',
      },
      socratic_prompts: [
        'What specific problem or concept in your field keeps you up at night?',
        'What have you already built, read, or explored that most applicants haven\'t?',
        'What question do you have that your professors might actually find interesting?',
      ],
    },
  },

  criticalIssue: {
    issue_number: 1,
    quote: 'I want to study computer science because technology is the future and I want to be part of it.',
    location: 'Opening of Why Major supplement',
    problem: 'Generic motivation—could be written by any applicant',
    symptom_type: 'generic_claim',
    diagnosis: 'This lacks specificity and proof. "Technology is the future" is a cliché. "Interested in coding" doesn\'t differentiate you. In a 150-word essay, you need to prove technical depth and genuine passion in every sentence.',
  },

  conversations: [
    "I see what you mean but I haven't done anything as advanced as neural networks. I mostly just do web development and some Python scripting.",
    "Well, I did build a Discord bot that uses the OpenAI API to answer questions for my gaming community. It started simple but I kept adding features because people kept asking for stuff.",
    "The hardest part was rate limiting—I had to figure out how to queue requests so we didn't hit the API limits. I ended up learning about async programming and building a request scheduler.",
    "Here's my attempt: 'I built a Discord bot to help my gaming community, which sounds simple until you're debugging async request queues at 2am because 50 people are asking it questions simultaneously. That problem—managing concurrent AI requests efficiently—taught me more about systems design than any tutorial.'",
  ],
  college: 'Stanford',
};

// ============================================================================
// SCENARIO 2: WEAK HOOK - Needs Attention-Grabbing Opening
// ============================================================================
const SCENARIO_2 = {
  name: 'Weak Hook - Activity Essay Opening',
  stage2Issue: {
    issue_id: 'weak_hook_1',
    issue_quote: 'Model United Nations has been an important activity for me throughout high school. I have learned a lot about diplomacy and public speaking.',
    diagnosis_summary: 'This opening could be from any of the 100,000 MUN essays admissions officers read. There\'s no hook, no tension, no reason to keep reading. The first sentence should make them lean forward, not reach for the next application.',

    suggestions: {
      polished_original: {
        type: 'polished_original',
        text: 'The delegate from Russia just called my resolution "Western propaganda disguised as humanitarianism." I had thirty seconds to respond, and my hands were shaking.',
        rationale: 'Drops reader directly into a moment of conflict. Creates immediate tension and stakes. Shows the reality of MUN (confrontation, pressure) rather than describing its benefits.',
        what_changed: [
          'Replaced description with dramatic moment',
          'Added specific dialogue for immediacy',
          'Created stakes (30 seconds, shaking hands)',
          'Made reader want to know what happened next',
        ],
      },
      voice_amplifier: {
        type: 'voice_amplifier',
        text: '"Western propaganda." The delegate from Russia spat the words at my resolution like they burned. Thirty seconds to respond. Shaking hands. This was supposed to be practice for diplomacy, but nothing about this moment felt like practice.',
        rationale: 'Uses fragmentation for urgency. The phrase "spat the words... like they burned" adds visceral imagery. Ends with an insight about the gap between "practice" and reality.',
        what_changed: [
          'Fragmented structure for tension',
          'Visceral imagery (spat, burned)',
          'Self-aware closing line about the nature of the experience',
          'More personal vulnerability (shaking hands, practice vs. real)',
        ],
        why_authentic: 'The specific accusation (Western propaganda) and the meta-observation about practice suggest someone who actually experienced this moment and reflected on it.',
      },
    },

    teaching: {
      type_specific_principle: 'Strong hooks create tension, curiosity, or surprise in the first sentence. Drop readers into a MOMENT, not a summary. The hook\'s job is to make them need to keep reading.',
      how_to_choose: {
        polished_when: 'You want clean, cinematic tension',
        voice_when: 'You want to show your processing of the moment alongside the moment itself',
        can_combine: 'Dramatic moment with brief self-aware reflection',
      },
      socratic_prompts: [
        'What\'s the most intense or unexpected moment from this activity?',
        'What would a movie director choose as the opening scene?',
        'What moment made you feel something strongly—fear, excitement, frustration?',
      ],
    },
  },

  criticalIssue: {
    issue_number: 1,
    quote: 'Model United Nations has been an important activity for me throughout high school.',
    location: 'Opening sentence',
    problem: 'Generic opening—no hook, no tension, no reason to keep reading',
    symptom_type: 'weak_hook',
    diagnosis: 'This is the same opening as thousands of other MUN essays. A strong hook drops readers into tension, conflict, or surprise. Start with a MOMENT, not a summary.',
  },

  conversations: [
    "I get it but I'm not sure I have a dramatic moment like that. Most of MUN is actually pretty boring—committee sessions, negotiations, caucuses.",
    "Actually there was this one time when I was chairing a committee and two delegates almost got into a real argument. One accused the other of not understanding the 'real' Middle East because she'd never been there.",
    "I had to intervene. I paused the session and reminded them that we're all learning here, but honestly I was nervous because the tension felt personal, not political.",
    "Here's my attempt: 'Two delegates were arguing about Gaza, and then it stopped being about Gaza. \"You've never even been there,\" one said. As chair, I had the gavel. I didn't have an answer.'",
  ],
  college: 'Georgetown',
};

// ============================================================================
// SCENARIO 3: GENERIC INSIGHT - Has Story But Lacks Unique Perspective
// ============================================================================
const SCENARIO_3 = {
  name: 'Generic Insight - Community Service Essay',
  stage2Issue: {
    issue_id: 'generic_insight_1',
    issue_quote: 'Through volunteering at the food bank, I learned that helping others is rewarding and that many people in our community struggle with food insecurity. This experience taught me to be grateful for what I have.',
    diagnosis_summary: 'The story might be real, but the insight is borrowed. "Helping is rewarding" and "be grateful" are what everyone says. What did YOU specifically learn that others might not have noticed?',

    suggestions: {
      polished_original: {
        type: 'polished_original',
        text: 'I expected the food bank to feel like charity. Instead, Mrs. Patterson—who drives a nicer car than my mom—told me she\'d been coming since her husband\'s medical bills started. That day I learned that food insecurity doesn\'t look like what I thought it looked like.',
        rationale: 'The specific detail (nicer car) subverts expectations. Names a real person. The insight is specific: food insecurity\'s invisibility, not the generic "people struggle."',
        what_changed: [
          'Added specific, expectation-breaking detail',
          'Named a real person with a specific story',
          'Made the insight concrete and unexpected',
          'Showed what changed in YOUR understanding, not just that you "learned"',
        ],
      },
      voice_amplifier: {
        type: 'voice_amplifier',
        text: 'Mrs. Patterson drives a nicer car than my mom. She\'s been coming to the food bank since her husband got sick—medical bills eat savings faster than you\'d think. I stopped sorting cans that day. I started noticing who was in line, and how invisible struggle can be until you\'re standing behind a folding table with a box of pasta.',
        rationale: 'Opens with jarring detail that challenges assumptions. "Medical bills eat savings faster than you\'d think" is specific observation. Ends with a physical image that captures the shift in perspective.',
        what_changed: [
          'Led with the surprising detail',
          'Added specific insight about medical debt (not generic)',
          'Physical ending (folding table, box of pasta) grounds the reflection',
          'Shows a change in BEHAVIOR (stopped sorting, started noticing)',
        ],
        why_authentic: 'The detail about the car, the husband\'s illness, the shift from sorting to noticing—this is too specific to be generic. This person was actually there.',
      },
    },

    teaching: {
      type_specific_principle: 'Unique insights come from noticing what others miss. What surprised you? What contradicted your expectations? The insight should be specific to YOUR experience, not a general truth everyone knows.',
      how_to_choose: {
        polished_when: 'You want to center the other person\'s story and your realization',
        voice_when: 'You want to show your own processing and behavioral change',
        can_combine: 'Specific observation with reflection on how it changed your actions',
      },
      socratic_prompts: [
        'What surprised you most—something that contradicted what you expected?',
        'Who did you meet that changed how you think about this issue?',
        'What did you notice that others might have missed?',
      ],
    },
  },

  criticalIssue: {
    issue_number: 1,
    quote: 'This experience taught me to be grateful for what I have.',
    location: 'Closing insight',
    problem: 'Generic insight—this is what everyone writes',
    symptom_type: 'generic_insight',
    diagnosis: 'This insight could appear in any service essay. What did YOU specifically learn that surprised you? What did you notice that others might have missed? The insight needs to be earned and unique.',
  },

  conversations: [
    "I hear what you're saying but I'm not sure what unique insight I had. I just sorted food and handed out bags.",
    "Actually, one thing that surprised me was how many people came in professional clothes. Like, suits and scrubs. I always pictured food bank users differently.",
    "There was this one nurse who came during her break. She said she makes decent money but her student loans mean she can't afford groceries at the end of the month. That really stuck with me.",
    "Here's my attempt: 'A nurse in scrubs came during her lunch break. She makes $60,000 a year and can't afford groceries the last week of each month—student loans. I stopped thinking of hunger as something that happens to 'other people' and started seeing it as something that happens to systems.'",
  ],
  college: 'Duke',
};

// ============================================================================
// SCENARIO 4: WEAK CLOSING - Good Essay But Ending Falls Flat
// ============================================================================
const SCENARIO_4 = {
  name: 'Weak Closing - Research Experience Essay',
  stage2Issue: {
    issue_id: 'weak_closing_1',
    issue_quote: 'Overall, this research experience was very valuable to me. I learned a lot about the scientific process and I hope to continue doing research in college.',
    diagnosis_summary: 'The essay built to something, and then the ending deflated it. "Valuable," "learned a lot," and "hope to continue" are the weakest possible ways to close. End with impact, insight, or forward momentum—not a summary.',

    suggestions: {
      polished_original: {
        type: 'polished_original',
        text: 'My results didn\'t support the hypothesis. My PI called that a success—negative results, she said, are still results. I\'m still thinking about what it means to work in a field where being wrong is how you make progress.',
        rationale: 'Ends with a genuine intellectual question rather than a summary. The PI\'s quote introduces a concept (negative results as success) that shows learning. Forward-looking without being generic.',
        what_changed: [
          'Replaced summary with specific result and response',
          'Added a mentor\'s voice and perspective',
          'Ended on an open question rather than a closed statement',
          'Showed ongoing reflection, not just past learning',
        ],
      },
      voice_amplifier: {
        type: 'voice_amplifier',
        text: 'Six months of work. Hypothesis: not supported. My first instinct was to feel like I\'d failed, but Dr. Martinez smiled. "Now we know something we didn\'t before." I\'m applying to college with no published paper, just a question I can\'t stop asking: what else do I think is true that might not be?',
        rationale: 'Shows the emotional arc (failure feeling → reframe). Mentor\'s quote is memorable. Ends with a personal, philosophical question that shows intellectual growth.',
        what_changed: [
          'Made the negative result emotionally resonant',
          'Used mentor quote as pivot point',
          'Ended with a genuine question about the self',
          'Connected research experience to broader intellectual stance',
        ],
        why_authentic: 'The specific timeline (six months), the emotional honesty (felt like failure), and the philosophical question at the end suggest real reflection, not templated summary.',
      },
    },

    teaching: {
      type_specific_principle: 'Strong closings provide resonance, not summary. End with impact, a lingering question, forward momentum, or a specific image. Never summarize what you just said or state generic hopes.',
      how_to_choose: {
        polished_when: 'You want to end with an intellectual question you\'re still exploring',
        voice_when: 'You want to end with a personal, philosophical reflection',
        can_combine: 'Specific moment of realization with ongoing question',
      },
      socratic_prompts: [
        'What question from this experience are you still thinking about?',
        'What moment marked a shift in how you understand something?',
        'If you could only keep one insight from this experience, what would it be?',
      ],
    },
  },

  criticalIssue: {
    issue_number: 1,
    quote: 'I hope to continue doing research in college.',
    location: 'Closing sentence',
    problem: 'Weak, generic closing—deflates everything before it',
    symptom_type: 'weak_closing',
    diagnosis: 'This ending could be copy-pasted onto any research essay. Strong closings provide resonance—a lingering question, a specific image, or forward momentum. Not a summary or generic hope.',
  },

  conversations: [
    "I don't know how to end it differently. The research was valuable and I do want to keep doing it.",
    "I guess the most interesting part wasn't even my results—it was when I found an error in a paper we were building on. My mentor said that's actually common but no one talks about it.",
    "It made me realize that published research isn't as 'finished' as I thought. There are still questions and mistakes in even peer-reviewed work.",
    "Here's my attempt: 'I found an error in a cited paper—a calculation that changed one of our assumptions. Dr. Reyes said this happens more than people admit. I used to think published research was the end of a question. Now I see it as the beginning of the next one.'",
  ],
  college: 'MIT',
};

// ============================================================================
// TEST RUNNER
// ============================================================================

async function runScenario(scenario: typeof SCENARIO_1): Promise<void> {
  console.log('\n' + '='.repeat(80));
  console.log(`  SCENARIO: ${scenario.name}`);
  console.log(`  College: ${scenario.college}`);
  console.log('='.repeat(80));

  // Create context
  const context = createSuggestionContextFromStage2(
    scenario.stage2Issue as any,
    scenario.criticalIssue as any,
    { collegeName: scenario.college }
  );

  // Get welcome message
  const welcome = workshopChatModeService.getSuggestionWelcomeMessage(context);

  console.log('\n  WELCOME MESSAGE:');
  console.log('  ' + '-'.repeat(70));
  wordWrap(welcome.content, 70);
  console.log('  ' + '-'.repeat(70));

  // Build system prompt
  const systemPrompt = buildSystemPrompt(context);

  // Initialize conversation
  const messages: Anthropic.MessageParam[] = [
    { role: 'assistant', content: welcome.content },
  ];

  let totalTokens = 0;
  let totalCost = 0;

  // Run conversations
  for (let i = 0; i < scenario.conversations.length; i++) {
    console.log(`\n  TURN ${i + 1} OF ${scenario.conversations.length}`);
    console.log('  ' + '-'.repeat(70));

    console.log('  STUDENT:');
    wordWrap(`"${scenario.conversations[i]}"`, 68, '    ');

    messages.push({ role: 'user', content: scenario.conversations[i] });

    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
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
      wordWrap(content, 68, '    ');
      console.log(`\n    [${inputTokens} in → ${outputTokens} out | $${cost.toFixed(4)}]`);

    } catch (error: any) {
      console.log(`\n  ERROR: ${error.message}`);
      break;
    }
  }

  console.log('\n  ' + '-'.repeat(70));
  console.log(`  Scenario Total: ${totalTokens} tokens | $${totalCost.toFixed(4)}`);
}

function buildSystemPrompt(context: SuggestionModeContext): string {
  const { issue, suggestions } = context;

  return `You are a supportive, expert college admissions essay coach running a TRUE WRITING WORKSHOP.

# CRITICAL PHILOSOPHY: TEACH, DON'T TEMPLATE

**The suggestions below are TEACHING EXAMPLES, not templates to copy.**

Your job is to:
1. Use the suggestions to ILLUSTRATE what good writing looks like
2. Extract the PRINCIPLES that make them work
3. Help the student find THEIR OWN version using those principles
4. Analyze their attempts with specific, actionable feedback

# IMPORTANT: NOT EVERYTHING IS STORYTELLING

Different issues require different approaches:
- **Weak technical depth** → Help them identify specific knowledge/projects to showcase
- **Generic insight** → Dig for what SPECIFICALLY surprised or changed them
- **Weak hook** → Find the most compelling moment to lead with
- **Weak closing** → Find the lingering question or resonant image
- **Generic motivation** → Surface their actual obsessions and interests

**Short word limits (100-150 words)** require DENSITY, not narrative. Every sentence must prove something.

# THE ISSUE BEING ADDRESSED

**Student's Original Text:**
"${issue.original_quote}"

**Location in Essay:** ${issue.location}

**The Problem:**
${issue.problem_summary}

**Why This Matters:**
${issue.diagnosis}

# EXAMPLE REVISIONS (For Teaching, Not Copying)

${suggestions.polished_original ? `### Version A (Polished)
"${suggestions.polished_original.text}"

**Why this works:** ${suggestions.polished_original.rationale}
` : ''}

${suggestions.voice_amplifier ? `### Version B (Voice-Forward)
"${suggestions.voice_amplifier.text}"

**Why this works:** ${suggestions.voice_amplifier.rationale}
` : ''}

# COACHING APPROACH

1. **Listen for their real material** - What have they actually done, built, noticed, or questioned?
2. **Extract the gold** - What specific detail or insight makes their experience unique?
3. **Help them see it** - Show them why that detail matters
4. **Guide their writing** - Help them craft it with the right technique for this problem

**NEVER REPEAT YOURSELF:** Each turn should introduce NEW insight, not rehash previous points.

**Response Length:** 250 words maximum

Remember: Your job is to help them find and articulate what's genuinely interesting about THEIR experience.`;
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
  console.log('  DIVERSE SUPPLEMENTAL SCENARIOS TEST');
  console.log('  Testing: Technical Depth, Hooks, Insights, Closings');
  console.log('*'.repeat(80));

  const scenarios = [SCENARIO_1, SCENARIO_2, SCENARIO_3, SCENARIO_4];

  let grandTotalTokens = 0;
  let grandTotalCost = 0;

  for (const scenario of scenarios) {
    await runScenario(scenario);
  }

  console.log('\n' + '='.repeat(80));
  console.log('  ALL SCENARIOS COMPLETE');
  console.log('='.repeat(80));
  console.log('\n  Scenarios tested:');
  console.log('  1. Why Major (150 words) - Technical depth + passion');
  console.log('  2. Weak Hook - Attention-grabbing opening');
  console.log('  3. Generic Insight - Unique perspective');
  console.log('  4. Weak Closing - Strong ending');
  console.log('');
}

main().catch(console.error);
