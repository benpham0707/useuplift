/**
 * Comprehensive Chat V3 Testing
 *
 * Tests the new supportive, constructive tone with real scenarios
 */

import { buildWorkshopChatContext } from './src/services/workshop/chatContextV2';
import { sendChatMessage, getWelcomeMessage } from './src/services/workshop/chatServiceV3';

// ============================================================================
// TEST SCENARIOS
// ============================================================================

const testScenarios = [
  {
    name: 'Very Weak Draft - Score Question',
    activity: {
      id: 'test-1',
      name: 'Debate Team',
      role: 'Member',
      category: 'academic',
      hoursPerWeek: 5,
      weeksPerYear: 40,
      applicationGuidance: {
        whyItMatters: 'Shows intellectual engagement and communication skills',
      },
      scores: {
        portfolioContribution: { overall: 60 },
        commitment: { overall: 70 },
        impact: { overall: 50 },
      },
    } as any,
    draft: 'I was on the debate team. We practiced every week and went to tournaments. I learned a lot about public speaking and making arguments. We won some competitions.',
    analysisResult: {
      analysis: {
        narrative_quality_index: 15,
        reader_impression_label: 'generic_unclear',
        categories: [
          {
            category: 'reflection_meaning',
            score: 0.5,
            maxScore: 10,
            comments: ['Lacks personal reflection'],
            evidence: ['I learned a lot about public speaking'],
            suggestions: ['Show specific moments of growth'],
          },
          {
            category: 'specificity_evidence',
            score: 2.0,
            maxScore: 10,
            comments: ['Very vague, lacks concrete details'],
            evidence: ['We practiced every week', 'We won some competitions'],
            suggestions: ['Add specific examples, numbers, names'],
          },
        ],
      },
      authenticity: {
        authenticity_score: 3.0,
        voice_type: 'essay',
        red_flags: ['I learned a lot', 'I was on'],
        green_flags: [],
      },
    } as any,
    teachingCoaching: {
      teaching_issues: [
        {
          id: 'issue-1',
          category: 'reflection_meaning',
          severity: 'critical',
          problem: {
            title: 'Add Deep Personal Reflection',
            explanation: 'The narrative lacks meaningful reflection on why this experience mattered',
            impact_on_score: 'Costing you 12-15 points',
            from_draft: 'I learned a lot about public speaking',
          },
          principle: {
            name: 'SHOW_VULNERABILITY',
            description: 'Demonstrate authentic struggle and growth',
            why_officers_care: 'Shows self-awareness and maturity',
          },
          examples: [
            {
              context: 'Debate - Stanford admit',
              before: { text: 'I learned about argument structure' },
              after: {
                text: 'The third time I lost on a technicality, my hands were literally shaking. I realized debate isn\'t about being right—it\'s about making others believe you are.',
              },
            },
          ],
        },
      ],
      strategy: {
        strengths_to_maintain: [],
        critical_gaps: ['No vulnerability', 'Missing specific examples', 'Lacks reflection'],
        quick_wins: [],
        recommended_order: ['Add vulnerability first'],
      },
    } as any,
    question: 'Why is my score so low?',
  },

  {
    name: 'Developing Draft - Priority Question',
    activity: {
      id: 'test-2',
      name: 'Community Garden Project',
      role: 'Founder',
      category: 'service',
      hoursPerWeek: 8,
      weeksPerYear: 36,
      applicationGuidance: {
        whyItMatters: 'Demonstrates initiative, leadership, and community impact',
      },
      scores: {
        portfolioContribution: { overall: 75 },
        commitment: { overall: 80 },
        impact: { overall: 70 },
      },
    } as any,
    draft: 'I started a community garden in my neighborhood. I organized volunteers and managed planting schedules. We grew vegetables and flowers. The community was happy with the results. It taught me about leadership and working with others.',
    analysisResult: {
      analysis: {
        narrative_quality_index: 45,
        reader_impression_label: 'patchy_narrative',
        categories: [
          {
            category: 'transformative_impact',
            score: 3.5,
            maxScore: 10,
            comments: ['Shows activity but not transformation'],
            evidence: ['It taught me about leadership'],
            suggestions: ['Show how YOU changed, not just what you did'],
          },
          {
            category: 'specificity_evidence',
            score: 5.0,
            maxScore: 10,
            comments: ['Some details but could be more specific'],
            evidence: ['organized volunteers', 'managed planting schedules'],
            suggestions: ['Add names, numbers, specific challenges'],
          },
        ],
      },
      authenticity: {
        authenticity_score: 5.5,
        voice_type: 'essay',
        red_flags: ['It taught me'],
        green_flags: ['I started', 'I organized'],
      },
      elite_patterns: {
        vulnerability: { score: 2, hasPhysicalSymptoms: false, examples: [] },
        dialogue: { score: 0, hasDialogue: false, examples: [] },
        communityTransformation: { score: 5, hasContrast: false },
        quantifiedImpact: { score: 3, hasMetrics: false, metrics: [] },
        microToMacro: { score: 4, transcendsActivity: false },
      },
    } as any,
    teachingCoaching: {
      teaching_issues: [
        {
          id: 'issue-2',
          category: 'transformative_impact',
          severity: 'high',
          problem: {
            title: 'Show Personal Transformation',
            explanation: 'You describe what you did, but not who you became',
            impact_on_score: 'Limiting you to 50/100 range',
            from_draft: 'I organized volunteers and managed planting schedules',
          },
          principle: {
            name: 'SHOW_TRANSFORMATION',
            description: 'Demonstrate change through specific before/after moments',
            why_officers_care: 'Shows growth mindset and self-awareness',
          },
        },
      ],
      strategy: {
        strengths_to_maintain: ['Clear activity ownership', 'Leadership role'],
        critical_gaps: ['Missing vulnerability', 'No dialogue', 'Generic reflection'],
        quick_wins: ['Add one vulnerable moment', 'Include specific conversation'],
      },
    } as any,
    question: 'What should I focus on first?',
  },

  {
    name: 'Strong Draft - Improvement Question',
    activity: {
      id: 'test-3',
      name: 'Robotics Team',
      role: 'Lead Engineer',
      category: 'academic',
      hoursPerWeek: 12,
      weeksPerYear: 38,
      applicationGuidance: {
        whyItMatters: 'Demonstrates technical excellence and leadership under pressure',
      },
      scores: {
        portfolioContribution: { overall: 88 },
        commitment: { overall: 92 },
        impact: { overall: 85 },
      },
    } as any,
    draft: 'Three days before regionals, our robot\'s vision system failed. I spent 18 hours redesigning the gripper mechanism, trying pneumatics, then servos, finally settling on a custom gear system. "This is hopeless," I whispered to my dad. "Every bug is just discord," he replied. "You need to tune the whole orchestra." Each failure taught me that engineering isn\'t about perfect designs—it\'s about rapid iteration. By competition day, 8 teammates could debug vision code independently.',
    analysisResult: {
      analysis: {
        narrative_quality_index: 72,
        reader_impression_label: 'solid_needs_polish',
        categories: [
          {
            category: 'transformative_impact',
            score: 7.5,
            maxScore: 10,
            comments: ['Shows growth, could go deeper'],
            evidence: ['Each failure taught me'],
            suggestions: ['Connect to broader insight about leadership/learning'],
          },
          {
            category: 'craft_language_quality',
            score: 7.0,
            maxScore: 10,
            comments: ['Good sensory details, dialogue present'],
            evidence: ['"This is hopeless," I whispered'],
            suggestions: ['Add extended metaphor or structural innovation'],
          },
        ],
      },
      authenticity: {
        authenticity_score: 8.0,
        voice_type: 'natural',
        red_flags: [],
        green_flags: ['whispered', 'hopeless', 'Each failure'],
      },
      elite_patterns: {
        vulnerability: { score: 7, hasPhysicalSymptoms: false, examples: ['"This is hopeless"'] },
        dialogue: { score: 8, hasDialogue: true, examples: ['"Every bug is just discord"'] },
        communityTransformation: { score: 6, hasContrast: true },
        quantifiedImpact: { score: 7, hasMetrics: true, metrics: ['18 hours', '8 teammates'] },
        microToMacro: { score: 6, transcendsActivity: false },
      },
    } as any,
    teachingCoaching: {
      teaching_issues: [
        {
          id: 'issue-3',
          category: 'reflection_meaning',
          severity: 'medium',
          problem: {
            title: 'Deepen Universal Insight',
            explanation: 'The reflection is good but stays activity-specific',
            impact_on_score: 'Preventing jump from 72 to 85+',
            from_draft: 'engineering isn\'t about perfect designs—it\'s about rapid iteration',
          },
          principle: {
            name: 'UNIVERSAL_INSIGHT',
            description: 'Connect specific experience to broader human truth',
            why_officers_care: 'Shows intellectual depth and mature perspective',
          },
        },
      ],
      strategy: {
        strengths_to_maintain: [
          'Strong vulnerability',
          'Effective dialogue',
          'Specific metrics',
          'Active voice',
        ],
        critical_gaps: ['Philosophical depth could be stronger'],
        quick_wins: ['Strengthen closing insight to transcend robotics'],
      },
    } as any,
    question: 'How can I push this to 85+?',
  },

  {
    name: 'First Draft - General Help',
    activity: {
      id: 'test-4',
      name: 'Hospital Volunteering',
      role: 'Volunteer',
      category: 'service',
      hoursPerWeek: 4,
      weeksPerYear: 32,
      applicationGuidance: {
        whyItMatters: 'Shows compassion and exposure to healthcare',
      },
      scores: {
        portfolioContribution: { overall: 55 },
        commitment: { overall: 60 },
        impact: { overall: 50 },
      },
    } as any,
    draft: 'I volunteer at the local hospital every weekend. I help patients by bringing them water and talking to them. Many of them are lonely and appreciate having someone to talk to. This experience has shown me how important human connection is in healthcare.',
    analysisResult: {
      analysis: {
        narrative_quality_index: 38,
        reader_impression_label: 'patchy_narrative',
        categories: [
          {
            category: 'specificity_evidence',
            score: 2.5,
            maxScore: 10,
            comments: ['Very generic, lacks specific moments'],
            evidence: ['bringing them water', 'talking to them'],
            suggestions: ['Choose ONE specific patient/moment to focus on'],
          },
          {
            category: 'voice_integrity',
            score: 3.0,
            maxScore: 10,
            comments: ['Sounds like a resume bullet'],
            evidence: ['This experience has shown me'],
            suggestions: ['Write more conversationally, like you\'re telling a friend'],
          },
        ],
      },
      authenticity: {
        authenticity_score: 4.0,
        voice_type: 'essay',
        red_flags: ['This experience has shown me', 'how important'],
        green_flags: [],
      },
    } as any,
    teachingCoaching: {
      teaching_issues: [
        {
          id: 'issue-4',
          category: 'specificity_evidence',
          severity: 'critical',
          problem: {
            title: 'Add Specific Story',
            explanation: 'You summarize many experiences instead of showing one',
            impact_on_score: 'Keeping you below 40/100',
            from_draft: 'Many of them are lonely',
          },
          principle: {
            name: 'ADD_SPECIFICITY',
            description: 'Choose one specific moment and zoom in with details',
            why_officers_care: 'Proves the experience really happened and shows your unique perspective',
          },
        },
      ],
      strategy: {
        strengths_to_maintain: ['Shows service commitment'],
        critical_gaps: ['No specific story', 'Generic language', 'No vulnerability'],
        quick_wins: ['Focus on ONE patient interaction'],
      },
    } as any,
    question: 'How do I make this better?',
  },
];

// ============================================================================
// RUN TESTS
// ============================================================================

async function runTests() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║   CHAT V3 COMPREHENSIVE TESTING - SUPPORTIVE TONE            ║');
  console.log('║   Testing constructive, encouraging, specific feedback       ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  for (let i = 0; i < testScenarios.length; i++) {
    const scenario = testScenarios[i];

    console.log('═'.repeat(80));
    console.log(`TEST ${i + 1}: ${scenario.name}`);
    console.log('═'.repeat(80));
    console.log();

    // Build context
    const context = buildWorkshopChatContext(
      scenario.activity,
      scenario.draft,
      scenario.analysisResult,
      scenario.teachingCoaching
    );

    console.log('📝 SCENARIO:');
    console.log(`   Activity: ${scenario.activity.name} (${scenario.activity.role})`);
    console.log(`   NQI Score: ${context.analysis.nqi}/100 (${context.analysis.tier})`);
    console.log(`   Draft length: ${scenario.draft.split(' ').length} words`);
    console.log();

    console.log('❓ STUDENT QUESTION:');
    console.log(`   "${scenario.question}"`);
    console.log();

    // Get response
    try {
      console.log('⏳ Generating response...\n');

      const response = await sendChatMessage({
        userMessage: scenario.question,
        context,
      });

      console.log('🤖 COACH RESPONSE:');
      console.log('─'.repeat(80));
      console.log(response.message.content);
      console.log('─'.repeat(80));
      console.log();

      console.log('📊 TOKEN USAGE:');
      console.log(`   Input: ${response.usage.inputTokens}, Output: ${response.usage.outputTokens}`);
      console.log();

      console.log('✅ QUALITY CHECKS:');
      const content = response.message.content;

      // Check for supportive tone
      const supportive = /let's|we can|you're|here's what|consider|try|imagine/i.test(content);
      console.log(`   [${supportive ? '✓' : '✗'}] Supportive tone (uses "let's", "you're", "consider")`);

      // Check for specific quotes
      const quotes = content.includes('"') || content.includes("'");
      console.log(`   [${quotes ? '✓' : '✗'}] Quotes actual draft text`);

      // Check for concrete examples
      const hasExample = /here's what|this could become|imagine if|for example/i.test(content);
      console.log(`   [${hasExample ? '✓' : '✗'}] Provides concrete example`);

      // Check for actionable guidance
      const actionable = /try|add|consider|rewrite|focus on|start with/i.test(content);
      console.log(`   [${actionable ? '✓' : '✗'}] Gives actionable guidance`);

      // Check it's not harsh
      const harsh = /weak|bad|terrible|wrong|poor|fail/i.test(content);
      console.log(`   [${harsh ? '✗' : '✓'}] Avoids harsh language`);

      // Check it's not generic
      const generic = /great job|keep it up|nice work|good effort/i.test(content) && !quotes;
      console.log(`   [${generic ? '✗' : '✓'}] Avoids generic encouragement`);

      console.log();
      console.log('💭 NOTES:');
      console.log('   - Does this feel supportive yet honest?');
      console.log('   - Is the feedback specific and actionable?');
      console.log('   - Would a student feel encouraged to revise?');
      console.log();

    } catch (error: any) {
      console.log('❌ ERROR:', error.message);
      console.log();
    }

    if (i < testScenarios.length - 1) {
      console.log('\n\n');
    }
  }

  console.log('═'.repeat(80));
  console.log('TESTING COMPLETE');
  console.log('═'.repeat(80));
}

runTests().catch(console.error);
