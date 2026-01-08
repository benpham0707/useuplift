/**
 * Capture REAL Universal Suggestions (Stage 2A Output)
 *
 * Purpose: Generate actual Stage 2A outputs to use as realistic test cases
 * for college overlay layer testing.
 *
 * This shows what the college overlay ACTUALLY receives (high-quality universal
 * suggestions), not rudimentary examples.
 */

import { TypeSpecificSuggestionService } from '../src/services/commonAppWorkshop/services/typeSpecificSuggestionService';
import type { IssueContext } from '../src/services/commonAppWorkshop/services/typeSpecificSuggestionService';
import type { VoiceFingerprint } from '../src/services/commonAppWorkshop/types/contextGathering';

// ============================================================================
// REASONABLY GOOD ESSAYS (not terrible - already show some quality)
// ============================================================================

const EXAMPLE_1_INTELLECTUAL_STANFORD = `
I've always found myself drawn to questions without clear answers. Last year,
when our biology class covered CRISPR gene editing, most students focused on
memorizing the mechanisms for the test. I couldn't stop thinking about whether
we should use it to eliminate genetic diseases, even if it meant changing the
human gene pool forever.

That weekend, I spent hours reading research papers about gene drives in mosquitoes
- technology that could wipe out malaria but might also have unforeseen ecological
consequences. The scientific capabilities fascinated me, but the ethical questions
kept me up at night. How do we weigh immediate human benefit against long-term
ecosystem risks? Who gets to make these decisions?

This pattern has shown up throughout my learning. In AP Physics, while others
solved problems for grades, I spent lunch debating with Mr. Chen about whether
quantum mechanics proves free will doesn't exist. In English, I wrote my
independent project on how translation fundamentally alters meaning - not
because it was assigned, but because I needed to understand how much of a
text's essence survives linguistic transformation.

What excites me about Stanford's intellectual culture is the space to pursue
these kinds of questions seriously. I want to study bioethics at the intersection
of science and philosophy, where I can explore the frameworks we use to make
decisions about technologies we barely understand.
`.trim();

const EXAMPLE_2_COMMUNITY_UPENN = `
The tutoring center was supposed to close at 4 PM, but I was still there at
6:30, working with three students who'd failed their algebra quiz. My supervisor
had gone home, but these students finally understood something for the first time
all semester - I couldn't cut that short just because my shift ended.

This wasn't unusual. What started as a 3-hour weekly volunteer commitment
became 15-20 hours because I realized the students who needed help most were
the ones who wouldn't ask for it. I started arriving early to catch kids before
school, staying late, and eventually convinced the school to let me run weekend
sessions.

The breakthrough came when I stopped trying to just explain concepts and started
asking questions that made students discover answers themselves. Instead of
"Here's how to factor quadratics," I'd ask "What patterns do you notice in these
numbers?" Watching a student's face when they realize they figured it out
themselves - that's what kept me coming back.

By the end of the year, we'd grown from 3 students to 23, and I'd trained
four other peer tutors to use the same Socratic approach. The program continues
without me now, which feels like the real success - building something sustainable
rather than making myself indispensable.

At Penn, I want to study education policy because I've seen how much difference
targeted support can make. But more importantly, I've learned that helping
others succeed teaches you as much as it teaches them.
`.trim();

const EXAMPLE_3_VALUES_YALE = `
My grandmother's hands shake when she tries to write, the Parkinson's
progressing faster than any of us expected. Last month, she asked me to help
her write letters to her five children - apologies for things she'd done wrong,
gratitude for what they'd given her, wisdom she wanted to pass on.

It took three weeks. We'd work for 20 minutes before her hands tired, and I'd
read back what we'd written. She'd close her eyes, remembering moments from
40 years ago with perfect clarity - the time she worked two jobs to afford
my uncle's textbooks, the fight she regretted having with my aunt, the pride
she felt watching her children graduate.

What struck me wasn't just the content, but how writing these letters changed
her. She'd been withdrawn since the diagnosis, but this project gave her
purpose. She was deliberate about every word, insisting we revise until the
tone felt right. "This might be all I leave them," she told me. "It has to
be true."

I learned more about my family's history in those three weeks than I had in
eighteen years. But more than that, I learned what it means to help someone
finish something important before they run out of time. The letters are done
now, sealed in envelopes she keeps in her nightstand. She hasn't sent them yet -
"Not yet," she says, and I understand.

This experience showed me that sometimes the most meaningful work is simply
being present while someone does theirs. It's taught me patience I didn't know
I had and given me a model for how I want to serve others - not by fixing their
problems, but by helping them accomplish what matters to them.
`.trim();

// ============================================================================
// MOCK CONTEXTS (Realistic - showing good but not perfect essays)
// ============================================================================

const mockIssuesExample1: IssueContext[] = [
  {
    issue_id: 'issue_1',
    quote: 'I want to study bioethics at the intersection of science and philosophy',
    location: 'Final paragraph',
    diagnosis: {
      problem: 'Future plans stated but not connected to past intellectual journey',
      symptom_type: 'DISCONNECTED_FUTURE',
      affected_dimensions: ['coherence', 'insight'],
      score_impact: -8,
    },
    surrounding_context: EXAMPLE_1_INTELLECTUAL_STANFORD,
    relevant_college_values: [],
    relevant_quotes: [],
  }
];

const mockIssuesExample2: IssueContext[] = [
  {
    issue_id: 'issue_1',
    quote: 'I want to study education policy because I\'ve seen how much difference targeted support can make',
    location: 'Final paragraph',
    diagnosis: {
      problem: 'Career interest stated as conclusion but lacks deeper "why"',
      symptom_type: 'SURFACE_LEVEL_WHY',
      affected_dimensions: ['insight', 'intellectual_vitality'],
      score_impact: -7,
    },
    surrounding_context: EXAMPLE_2_COMMUNITY_UPENN,
    relevant_college_values: [],
    relevant_quotes: [],
  }
];

const mockIssuesExample3: IssueContext[] = [
  {
    issue_id: 'issue_1',
    quote: 'This experience showed me that sometimes the most meaningful work is simply being present',
    location: 'Final paragraph',
    diagnosis: {
      problem: 'Lesson stated explicitly rather than letting story speak for itself',
      symptom_type: 'OVER_EXPLAINED_INSIGHT',
      affected_dimensions: ['subtlety', 'trust_reader'],
      score_impact: -6,
    },
    surrounding_context: EXAMPLE_3_VALUES_YALE,
    relevant_college_values: [],
    relevant_quotes: [],
  }
];

const mockVoice: VoiceFingerprint = {
  core_markers: ['I', 'we', 'couldn\'t'],
  sentence_rhythms: ['varied', 'mix of short and long'],
  vocabulary_level: 'sophisticated-conversational',
  quirks: ['em dashes for emphasis', 'rhetorical questions'],
  authenticity_score: 78,
  distinctiveness_score: 72,
};

// ============================================================================
// RUN UNIVERSAL SUGGESTION GENERATION (NO COLLEGE CONTEXT YET)
// ============================================================================

async function captureUniversalSuggestions() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('CAPTURING REAL UNIVERSAL SUGGESTIONS (Stage 2A Output)');
  console.log('═══════════════════════════════════════════════════════════\n');

  const service = new TypeSpecificSuggestionService();

  const examples = [
    {
      name: 'Example 1: Intellectual - Stanford',
      essay: EXAMPLE_1_INTELLECTUAL_STANFORD,
      type: 'intellectual' as const,
      issues: mockIssuesExample1,
    },
    {
      name: 'Example 2: Community - UPenn',
      essay: EXAMPLE_2_COMMUNITY_UPENN,
      type: 'community' as const,
      issues: mockIssuesExample2,
    },
    {
      name: 'Example 3: Values - Yale',
      essay: EXAMPLE_3_VALUES_YALE,
      type: 'values' as const,
      issues: mockIssuesExample3,
    }
  ];

  for (const example of examples) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(example.name);
    console.log('='.repeat(60));

    console.log('\n📄 ESSAY EXCERPT:');
    console.log('─'.repeat(60));
    console.log(example.essay.substring(0, 300) + '...\n');

    console.log('🔍 DIAGNOSED ISSUE:');
    console.log('─'.repeat(60));
    console.log(`Problem: ${example.issues[0].diagnosis.problem}`);
    console.log(`Quote: "${example.issues[0].quote}"`);
    console.log(`Score Impact: ${example.issues[0].diagnosis.score_impact}\n`);

    try {
      console.log('⚙️  Generating UNIVERSAL suggestions (no college context)...\n');

      const result = await service.generateSuggestions(
        example.essay,
        example.type,
        example.issues,
        {
          voice: mockVoice,
          // NO college, NO promptId - pure universal suggestions
        }
      );

      const issue = result.issues[0];

      console.log('✨ STAGE 2A OUTPUT (What College Overlay Receives):');
      console.log('─'.repeat(60));

      if (issue?.suggestions?.polished_original) {
        console.log('\n📝 Polished Universal Suggestion:');
        console.log(`"${issue.suggestions.polished_original.text}"\n`);

        console.log('💡 Universal Rationale:');
        console.log(issue.suggestions.polished_original.rationale);
        console.log();
      }

      if (issue?.suggestions?.voice_amplifier) {
        console.log('🎤 Voice Amplifier Suggestion:');
        console.log(`"${issue.suggestions.voice_amplifier.text}"\n`);

        console.log('💡 Voice Rationale:');
        console.log(issue.suggestions.voice_amplifier.rationale);
        console.log();
      }

      console.log('📊 Metrics:');
      console.log(`   Cost: $${result.cost.toFixed(4)}`);
      console.log(`   Tokens: ${result.tokens_used.input.toLocaleString()} in / ${result.tokens_used.output.toLocaleString()} out`);

      console.log('\n✅ This is what college overlay should ENHANCE (not redo)\n');

    } catch (error) {
      console.error('❌ Error generating suggestions:', error);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('SUMMARY');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('These 3 examples show REALISTIC Stage 2A output:');
  console.log('1. Essays are reasonably good (not terrible rudimentary examples)');
  console.log('2. Universal suggestions are already high-quality');
  console.log('3. College overlay should ENHANCE these, not try to fix');
  console.log('   fundamental issues that Stage 2A already handled\n');

  console.log('Use these as test cases for college overlay development.\n');
}

// ============================================================================
// RUN
// ============================================================================

captureUniversalSuggestions().then(() => {
  console.log('Capture complete.');
  process.exit(0);
}).catch((error) => {
  console.error('Capture failed:', error);
  process.exit(1);
});
