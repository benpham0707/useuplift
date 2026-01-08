/**
 * College Overlay Testing with REAL Stage 2A Inputs
 *
 * Purpose: Test college overlay layer with realistic high-quality universal
 * suggestions to see how it enhances (not replaces) existing quality.
 *
 * Testing Strategy:
 * 1. Use actual Stage 2A outputs (already high-quality)
 * 2. Apply college overlay for Stanford, Penn, Yale
 * 3. Analyze what overlay adds vs what it should preserve
 * 4. Document enhancement patterns vs replacement patterns
 * 5. Measure quality preservation vs quality loss
 */

import { TypeSpecificSuggestionService } from '../src/services/commonAppWorkshop/services/typeSpecificSuggestionService';
import { getCollegeResearch } from '../src/services/commonAppWorkshop/data';
import type { IssueContext } from '../src/services/commonAppWorkshop/services/typeSpecificSuggestionService';
import type { VoiceFingerprint } from '../src/services/commonAppWorkshop/types/contextGathering';
import type { EssayContextPackage } from '../src/services/commonAppWorkshop/types';

// ============================================================================
// REAL STAGE 2A OUTPUTS (From previous test)
// ============================================================================

interface RealExample {
  name: string;
  college_name: 'stanford' | 'upenn' | 'yale';
  essay_type: 'intellectual' | 'community' | 'values';
  essay_text: string;
  issue: IssueContext;

  // REAL Stage 2A output (what we captured)
  universal_suggestion: {
    polished: string;
    voice_amplifier: string;
    rationale: string;
  };

  // What we expect overlay to do
  expected_overlay_behavior: {
    should_preserve: string[];
    should_enhance: string[];
    should_not_change: string[];
    red_flags_to_check: string[];
    green_flags_to_highlight: string[];
  };
}

const EXAMPLES: RealExample[] = [
  {
    name: 'Example 1: Intellectual - Stanford',
    college_name: 'stanford',
    essay_type: 'intellectual',
    essay_text: `
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
    `.trim(),
    issue: {
      issue_id: 'issue_1',
      quote: 'I want to study bioethics at the intersection of science and philosophy',
      location: 'Final paragraph',
      diagnosis: {
        problem: 'Future plans stated but not connected to past intellectual journey',
        symptom_type: 'DISCONNECTED_FUTURE',
        affected_dimensions: ['coherence', 'insight'],
        score_impact: -8,
      },
      surrounding_context: '',
      relevant_college_values: [],
      relevant_quotes: [],
    },
    universal_suggestion: {
      polished: "These questions all circle back to the same problem: how do we build ethical frameworks fast enough to keep up with scientific capability? I want to study bioethics not just to answer these questions, but to develop better ways of asking them - frameworks that can handle the uncertainty of editing genomes and translating consciousness into quantum mechanics.",
      voice_amplifier: "Mr. Chen thinks I'm overthinking everything. Maybe. But someone has to figure out who gets to decide whether we edit malaria out of existence or whether free will survives quantum mechanics. I'm not looking for easy answers - I'm looking for better questions. The kind that can handle gene drives and consciousness and meaning all breaking apart at the same time.",
      rationale: "Connects the specific examples (CRISPR, quantum mechanics, translation) to future study through the unifying thread of framework-building, showing intellectual evolution rather than just stating plans"
    },
    expected_overlay_behavior: {
      should_preserve: [
        'Framework-building theme (core universal quality)',
        'Connection to specific examples',
        'Authentic questioning voice',
        'Intellectual depth already present'
      ],
      should_enhance: [
        'Add note about Stanford\'s emphasis on interdisciplinary exploration',
        'Flag if "intellectual vitality" term used (it\'s not - good)',
        'Highlight that self-directed exploration matches Stanford values'
      ],
      should_not_change: [
        'The actual suggestion text (already high quality)',
        'The thematic connection',
        'The voice markers',
        'The intellectual depth'
      ],
      red_flags_to_check: [
        '"intellectual vitality" (not present - good)',
        '"passion" claims (not present - good)',
        'Generic Stanford buzzwords (check)'
      ],
      green_flags_to_highlight: [
        'Self-directed exploration beyond class',
        'Energetic intellectual voice',
        'Interdisciplinary thinking'
      ]
    }
  },

  {
    name: 'Example 2: Community - UPenn',
    college_name: 'upenn',
    essay_type: 'community',
    essay_text: `
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
    `.trim(),
    issue: {
      issue_id: 'issue_1',
      quote: 'I want to study education policy because I\'ve seen how much difference targeted support can make',
      location: 'Final paragraph',
      diagnosis: {
        problem: 'Career interest stated as conclusion but lacks deeper "why"',
        symptom_type: 'SURFACE_LEVEL_WHY',
        affected_dimensions: ['insight', 'intellectual_vitality'],
        score_impact: -7,
      },
      surrounding_context: '',
      relevant_college_values: [],
      relevant_quotes: [],
    },
    universal_suggestion: {
      polished: "At Penn, I want to study education policy because I keep wondering: why did our school have a tutoring center but no system to identify kids who needed it? The students who benefited most were the ones who stumbled in by accident or had friends drag them. Policy shapes who gets help and who falls through the cracks.",
      voice_amplifier: "At Penn, I want to study education policy, but honestly, I'm still figuring out why some schools get it right and others don't. Our tutoring center helped 23 kids. The calculus class next door had 180. Do the math.",
      rationale: "Transforms generic statement into specific policy question rooted in observed gap. Shows analytical thinking about systemic issues rather than just personal impact."
    },
    expected_overlay_behavior: {
      should_preserve: [
        'Specific policy question (universal quality)',
        'Systemic thinking',
        'Rooted-in-experience approach',
        'Conversational voice ("honestly", "Do the math")'
      ],
      should_enhance: [
        'Note Penn\'s Netter Center for Community Partnerships',
        'Highlight civic engagement + systems thinking alignment',
        'Flag good balance of service + intellectual inquiry'
      ],
      should_not_change: [
        'The policy question framing',
        'The personal-to-systemic connection',
        'The authentic voice',
        'The analytical depth'
      ],
      red_flags_to_check: [
        'Generic Penn flattery (not present - good)',
        'Surface-level community service claims (not present - good)'
      ],
      green_flags_to_highlight: [
        'Building sustainable systems',
        'Analytical approach to service',
        'Civic engagement mindset'
      ]
    }
  },

  {
    name: 'Example 3: Values - Yale',
    college_name: 'yale',
    essay_type: 'values',
    essay_text: `
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
    `.trim(),
    issue: {
      issue_id: 'issue_1',
      quote: 'This experience showed me that sometimes the most meaningful work is simply being present',
      location: 'Final paragraph',
      diagnosis: {
        problem: 'Lesson stated explicitly rather than letting story speak for itself',
        symptom_type: 'OVER_EXPLAINED_INSIGHT',
        affected_dimensions: ['subtlety', 'trust_reader'],
        score_impact: -6,
      },
      surrounding_context: '',
      relevant_college_values: [],
      relevant_quotes: [],
    },
    universal_suggestion: {
      polished: "The letters are done now, sealed in envelopes she keeps in her nightstand. She hasn't sent them yet - 'Not yet,' she says, and I understand. Sometimes the most important words are the ones you're not quite ready to release.",
      voice_amplifier: "The letters sit in her nightstand drawer, sealed. Five white envelopes with her children's names in my handwriting, her words inside. She opens the drawer sometimes just to look at them. 'Not yet,' she says when I ask if she wants me to mail them. I stop asking.",
      rationale: "Removes explicit lesson-stating while keeping subtle reflection. Ends with the concrete image of unsent letters, letting readers draw conclusions about presence and patience."
    },
    expected_overlay_behavior: {
      should_preserve: [
        'Subtle reflection (universal quality)',
        'Trust in reader',
        'Concrete imagery',
        'Emotional restraint'
      ],
      should_enhance: [
        'Note Yale\'s emphasis on intellectual depth in reflection',
        'Highlight maturity and thoughtfulness',
        'Flag excellent balance of showing vs telling'
      ],
      should_not_change: [
        'The subtle ending',
        'The concrete details',
        'The emotional tone',
        'The reader trust'
      ],
      red_flags_to_check: [
        'Over-explaining (already removed - good)',
        'Generic Yale flattery (not present - good)'
      ],
      green_flags_to_highlight: [
        'Mature reflection',
        'Thoughtful restraint',
        'Intellectual depth in personal story'
      ]
    }
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

// Mock essay context (simulating what Stage 1C would produce)
const createMockContext = (totalScore: number): EssayContextPackage => ({
  score_reasoning: {
    total_score: totalScore,
    quality_tier: totalScore >= 80 ? 'Good' : totalScore >= 65 ? 'Average' : 'Below Average',
    core_strength: 'Genuine intellectual curiosity and authentic voice',
    core_weakness: 'Needs stronger connection between examples and future goals',
    reader_experience: 'Engaged by specific examples but wants clearer throughline',
    principle_scores: []
  },
  dimensional_context: [
    {
      dimension: 'intellectual_vitality',
      current_score: 7,
      target_score: 8,
      gap: 1,
      strength_level: 'ADEQUATE',
      evidence: {
        strengths: ['Shows self-directed exploration beyond class'],
        weaknesses: ['Could connect exploration to future plans more explicitly']
      }
    }
  ],
  holistic_context: {
    recurring_motifs: ['questioning', 'exploration', 'framework-building'],
    emotional_arc: 'Steady intellectual curiosity throughout',
    narrative_thread: 'Building frameworks to handle uncertainty',
    arc_predictability: 4,
    arc_suggested_subversion: 'Add moment of doubt or failure'
  }
});

// ============================================================================
// TEST RUNNER
// ============================================================================

async function runComprehensiveOverlayTest() {
  console.log('\n' + '═'.repeat(80));
  console.log('COLLEGE OVERLAY TESTING WITH REAL STAGE 2A INPUTS');
  console.log('═'.repeat(80) + '\n');

  console.log('Testing Strategy:');
  console.log('1. Use ACTUAL Stage 2A outputs (high-quality universal suggestions)');
  console.log('2. Apply college overlay for each school');
  console.log('3. Analyze preservation vs enhancement vs unwanted changes');
  console.log('4. Document patterns and issues\n');

  const service = new TypeSpecificSuggestionService();
  const results: any[] = [];

  for (const example of EXAMPLES) {
    console.log('\n' + '='.repeat(80));
    console.log(example.name.toUpperCase());
    console.log('='.repeat(80) + '\n');

    const college = getCollegeResearch(example.college_name);
    if (!college) {
      console.error(`❌ College data not found for ${example.college_name}`);
      continue;
    }

    console.log('📊 BASELINE (Stage 2A Universal Output):');
    console.log('─'.repeat(80));
    console.log('Polished Suggestion:');
    console.log(`"${example.universal_suggestion.polished}"\n`);
    console.log('Voice Amplifier:');
    console.log(`"${example.universal_suggestion.voice_amplifier}"\n`);

    console.log('✅ Quality Already Present (from Stage 2A):');
    example.expected_overlay_behavior.should_preserve.forEach(item => {
      console.log(`   • ${item}`);
    });

    console.log('\n🎯 Expected Overlay Enhancements:');
    example.expected_overlay_behavior.should_enhance.forEach(item => {
      console.log(`   • ${item}`);
    });

    console.log('\n⚠️  Should NOT Change:');
    example.expected_overlay_behavior.should_not_change.forEach(item => {
      console.log(`   • ${item}`);
    });

    // Set surrounding context
    example.issue.surrounding_context = example.essay_text;

    try {
      console.log('\n⚙️  Applying College Overlay...\n');

      const startTime = Date.now();

      const result = await service.generateSuggestions(
        example.essay_text,
        example.essay_type,
        [example.issue],
        {
          college,
          promptId: `${example.college_name}_${example.essay_type}`,
          voice: mockVoice,
          essayContext: createMockContext(72)
        }
      );

      const duration = Date.now() - startTime;

      console.log('📋 COLLEGE OVERLAY OUTPUT:');
      console.log('─'.repeat(80));

      const overlayIssue = result.issues[0];

      if (overlayIssue?.suggestions?.polished_original) {
        console.log('\n📝 College-Enhanced Polished Suggestion:');
        console.log(`"${overlayIssue.suggestions.polished_original.text}"\n`);

        console.log('💡 Enhanced Rationale:');
        console.log(overlayIssue.suggestions.polished_original.rationale);
        console.log();

        if (overlayIssue.suggestions.polished_original.overlay_warnings) {
          console.log('⚠️  Overlay Warnings:');
          overlayIssue.suggestions.polished_original.overlay_warnings.forEach(w => {
            console.log(`   • ${w.substring(0, 120)}${w.length > 120 ? '...' : ''}`);
          });
          console.log();
        }
      }

      if (overlayIssue?.suggestions?.voice_amplifier) {
        console.log('🎤 College-Enhanced Voice Amplifier:');
        console.log(`"${overlayIssue.suggestions.voice_amplifier.text}"\n`);

        if (overlayIssue.suggestions.voice_amplifier.overlay_warnings) {
          console.log('⚠️  Voice Overlay Warnings:');
          overlayIssue.suggestions.voice_amplifier.overlay_warnings.forEach(w => {
            console.log(`   • ${w.substring(0, 120)}${w.length > 120 ? '...' : ''}`);
          });
          console.log();
        }
      }

      console.log('📊 Overlay Analysis Metadata:');
      console.log(`   Red flags detected: ${result.overlay_analysis.red_flags_detected}`);
      console.log(`   Green flags detected: ${result.overlay_analysis.green_flags_detected}`);
      console.log(`   Rubric band: ${result.overlay_analysis.rubric_band || 'N/A'}`);
      console.log(`   Socratic questions available: ${result.overlay_analysis.socratic_questions_available}`);
      console.log();

      console.log('⏱️  Performance:');
      console.log(`   Duration: ${duration}ms`);
      console.log(`   Cost: $${result.cost.toFixed(4)}`);
      console.log(`   Tokens: ${result.tokens_used.input.toLocaleString()} in / ${result.tokens_used.output.toLocaleString()} out`);

      // ANALYSIS: Compare overlay output to universal baseline
      console.log('\n' + '─'.repeat(80));
      console.log('📊 ANALYSIS: Preservation vs Enhancement');
      console.log('─'.repeat(80));

      const polishedChanged = overlayIssue?.suggestions?.polished_original?.text !== example.universal_suggestion.polished;
      const voiceChanged = overlayIssue?.suggestions?.voice_amplifier?.text !== example.universal_suggestion.voice_amplifier;

      console.log('\n1️⃣  Text Preservation:');
      if (polishedChanged) {
        console.log(`   ⚠️  Polished suggestion CHANGED from universal baseline`);
        console.log(`   Original: "${example.universal_suggestion.polished.substring(0, 80)}..."`);
        console.log(`   Overlay:  "${overlayIssue.suggestions.polished_original.text.substring(0, 80)}..."`);
      } else {
        console.log(`   ✅ Polished suggestion PRESERVED from Stage 2A`);
      }

      if (voiceChanged) {
        console.log(`   ⚠️  Voice amplifier CHANGED from universal baseline`);
        console.log(`   Original: "${example.universal_suggestion.voice_amplifier.substring(0, 80)}..."`);
        console.log(`   Overlay:  "${overlayIssue.suggestions.voice_amplifier.text.substring(0, 80)}..."`);
      } else {
        console.log(`   ✅ Voice amplifier PRESERVED from Stage 2A`);
      }

      console.log('\n2️⃣  Overlay Value Added:');
      const valueAdded: string[] = [];

      if (result.overlay_analysis.red_flags_detected > 0) {
        valueAdded.push(`Detected ${result.overlay_analysis.red_flags_detected} red flags`);
      }
      if (result.overlay_analysis.green_flags_detected > 0) {
        valueAdded.push(`Highlighted ${result.overlay_analysis.green_flags_detected} green flags`);
      }
      if (result.overlay_analysis.rubric_band) {
        valueAdded.push(`Provided rubric band guidance: ${result.overlay_analysis.rubric_band}`);
      }
      if (result.overlay_analysis.socratic_questions_available > 0) {
        valueAdded.push(`Matched ${result.overlay_analysis.socratic_questions_available} Socratic questions`);
      }

      if (valueAdded.length > 0) {
        valueAdded.forEach(v => console.log(`   ✅ ${v}`));
      } else {
        console.log(`   ⚠️  No clear value added beyond universal suggestions`);
      }

      console.log('\n3️⃣  Potential Issues:');
      const issues: string[] = [];

      if (polishedChanged || voiceChanged) {
        issues.push('Overlay regenerated suggestions instead of enhancing them');
      }

      if (result.overlay_analysis.red_flags_detected === 0 &&
          result.overlay_analysis.green_flags_detected === 0) {
        issues.push('Overlay didn\'t detect any college-specific patterns');
      }

      if (issues.length > 0) {
        issues.forEach(i => console.log(`   ⚠️  ${i}`));
      } else {
        console.log(`   ✅ No major issues detected`);
      }

      results.push({
        example: example.name,
        polished_preserved: !polishedChanged,
        voice_preserved: !voiceChanged,
        red_flags_detected: result.overlay_analysis.red_flags_detected,
        green_flags_detected: result.overlay_analysis.green_flags_detected,
        value_added: valueAdded.length,
        issues: issues.length,
        cost: result.cost,
        duration
      });

    } catch (error) {
      console.error('❌ Test failed:', error);
      results.push({
        example: example.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // AGGREGATE ANALYSIS
  console.log('\n\n' + '═'.repeat(80));
  console.log('AGGREGATE ANALYSIS ACROSS ALL EXAMPLES');
  console.log('═'.repeat(80) + '\n');

  const successful = results.filter(r => !r.error);

  console.log('📊 Preservation Metrics:');
  const polishedPreserved = successful.filter(r => r.polished_preserved).length;
  const voicePreserved = successful.filter(r => r.voice_preserved).length;
  console.log(`   Polished suggestions preserved: ${polishedPreserved}/${successful.length} (${((polishedPreserved / successful.length) * 100).toFixed(0)}%)`);
  console.log(`   Voice amplifiers preserved: ${voicePreserved}/${successful.length} (${((voicePreserved / successful.length) * 100).toFixed(0)}%)`);

  console.log('\n📊 Enhancement Metrics:');
  const totalRedFlags = successful.reduce((sum, r) => sum + r.red_flags_detected, 0);
  const totalGreenFlags = successful.reduce((sum, r) => sum + r.green_flags_detected, 0);
  const totalValueAdded = successful.reduce((sum, r) => sum + r.value_added, 0);
  console.log(`   Total red flags detected: ${totalRedFlags}`);
  console.log(`   Total green flags highlighted: ${totalGreenFlags}`);
  console.log(`   Average value-adds per example: ${(totalValueAdded / successful.length).toFixed(1)}`);

  console.log('\n📊 Performance Metrics:');
  const avgCost = successful.reduce((sum, r) => sum + r.cost, 0) / successful.length;
  const avgDuration = successful.reduce((sum, r) => sum + r.duration, 0) / successful.length;
  console.log(`   Average cost: $${avgCost.toFixed(4)}`);
  console.log(`   Average duration: ${avgDuration.toFixed(0)}ms`);

  console.log('\n📊 Issues Summary:');
  const totalIssues = successful.reduce((sum, r) => sum + r.issues, 0);
  if (totalIssues > 0) {
    console.log(`   ⚠️  ${totalIssues} potential issues identified across examples`);
    console.log(`   Most common: Regenerating instead of enhancing`);
  } else {
    console.log(`   ✅ No major issues detected`);
  }

  console.log('\n' + '═'.repeat(80));
  console.log('CONCLUSIONS & RECOMMENDATIONS');
  console.log('═'.repeat(80) + '\n');

  console.log('Key Findings:');
  console.log('1. Current overlay behavior:');
  if (polishedPreserved === 0 && voicePreserved === 0) {
    console.log('   ⚠️  REGENERATES suggestions instead of enhancing them');
    console.log('   → This loses Stage 2A quality and wastes previous work');
  } else if (polishedPreserved === successful.length) {
    console.log('   ✅ PRESERVES Stage 2A suggestions correctly');
  } else {
    console.log('   ⚠️  MIXED - sometimes preserves, sometimes regenerates');
  }

  console.log('\n2. Value added by overlay:');
  if (totalValueAdded > 0) {
    console.log(`   ✅ Provides ${totalValueAdded} enhancement features`);
    console.log(`   → Red/green flag detection, rubric guidance, Socratic questions`);
  } else {
    console.log('   ⚠️  Limited value beyond universal suggestions');
  }

  console.log('\n3. Recommended fixes:');
  if (polishedPreserved === 0) {
    console.log('   🔧 CRITICAL: Stop regenerating suggestions');
    console.log('      → Accept Stage 2A output as base quality');
    console.log('      → Only add college-specific context/warnings');
    console.log('      → Preserve universal suggestion text');
  }
  console.log('   🔧 Enhance red/green flag detection');
  console.log('   🔧 Make overlay warnings more actionable');
  console.log('   🔧 Test that enhancements preserve voice + theme coherence');

  console.log('\n');
}

// ============================================================================
// RUN
// ============================================================================

runComprehensiveOverlayTest().then(() => {
  console.log('Comprehensive overlay test complete.\n');
  process.exit(0);
}).catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
