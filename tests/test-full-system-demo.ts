
import * as dotenv from 'dotenv';
dotenv.config();

import { NarrativeGenerator } from '../src/services/generation/narrativeGenerator';
import { EssayAnalysisResult, HolisticAnalysis } from '../src/services/orchestrator/types';

// ============================================================================
// THE RAW STUDENT ESSAY (Tier 2/3 - "The Resume Summary")
// ============================================================================
const RAW_ESSAY = `
I have always been passionate about medicine. Ever since I was young, I wanted to help people. 
When I volunteered at the local hospital, I saw how doctors saved lives and it inspired me.
My specific role was at the front desk greeting patients. It was challenging because sometimes people were angry or sad.
One day, a patient came in who was really upset about his bill. I listened to him and told him I would find a nurse.
He calmed down and thanked me. This experience taught me that being a doctor isn't just about science, it's about empathy.
I also joined the HOSA club at my school to learn more medical skills. We learned CPR and how to take blood pressure.
I worked hard to become the Vice President of the club. I organized meetings and guest speakers.
Through these experiences, I have developed the leadership and resilience needed to succeed in the medical field.
I am determined to become a surgeon and make a difference in the world.
`;

// ============================================================================
// STEP 1: ENGINE A DIAGNOSTICS (Simulated Deep Analysis)
// ============================================================================
// In production, this comes from EssayOrchestrator.analyze(essay)
const ENGINE_A_OUTPUT: EssayAnalysisResult = {
  metadata: {
    promptType: 'fit_trajectory', // "Why Major?" / Career Prep
    timestamp: new Date().toISOString(),
    wordCount: 150
  },
  voice: {
    score: 3.5,
    quality_level: 'resume_prose',
    weaknesses: [
      'Generic "I have always been passionate" opening',
      'Telling not showing ("It was challenging")',
      'Transactional tone (doing things to "learn skills" rather than curiosity)',
      'Lack of sensory details'
    ],
    tier_evaluation: { current_tier: 'resume_prose', next_tier: 'emerging_voice' }
  },
  opening_hook: {
    hook_type: 'generic_resume',
    effectiveness_score: 3,
    weaknesses: ['Starts with "Ever since I was young"', 'Vague abstraction ("help people")']
  },
  primary_dimensions: {
    fit_trajectory: {
      score: 4,
      quality_level: 'interest',
      reasoning: {
        goal_analysis: 'Goal is broad ("Surgeon") but motivation is generic ("Help people").',
        alignment_analysis: 'Activities (Front desk, HOSA) are standard Tier 2 extracurriculars.',
      }
    }
  },
  holistic_context: {
    narrative_quality: {
      coherence_score: 60,
      spine: [],
      spike: [],
      lift: [],
      blind_spots: [
        {
          id: 'bs_1',
          text: [{ text: 'The "Transactional Altruism" Trap', details: [] }],
          score: 8,
          reasoning: 'You frame helping people as a transaction to get into med school ("it inspired me", "taught me"). Focus on the patient\'s reality, not your resume.'
        },
        {
          id: 'bs_2',
          text: [{ text: 'The "Hero Complex"', details: [] }],
          score: 7,
          reasoning: 'You portray yourself as the savior in the front desk story. True empathy is witnessing suffering, not just "fixing" it.'
        }
      ]
    },
    // @ts-ignore - partial mock
    brand_archetype: {
      candidates: [
        { archetype: 'The Empathetic Observer', score: 9 }
      ]
    }
  } as HolisticAnalysis,
  // Other required fields mocked empty
  craft: {}, specificity: {}, narrative_arc: {}, thematic_coherence: {}, vulnerability: {}, secondary_dimensions: {}
};

// ============================================================================
// DEMO RUNNER
// ============================================================================
async function runFullSystemDemo() {
  console.log('\n================================================================');
  console.log('🚨 UPLIFT SYSTEM DEMO: FROM DIAGNOSTIC TO NARRATIVE');
  console.log('================================================================');

  // 1. Display Diagnostic Insights (Engine A)
  console.log('\n[ENGINE A] DIAGNOSTIC REPORT:');
  console.log('----------------------------------------------------------------');
  console.log(`❌ VOICE SCORE: ${ENGINE_A_OUTPUT.voice.score}/10 (${ENGINE_A_OUTPUT.voice.quality_level})`);
  console.log(`⚠️ BLIND SPOTS DETECTED:`);
  ENGINE_A_OUTPUT.holistic_context?.narrative_quality.blind_spots.forEach(bs => {
    // @ts-ignore
    console.log(`   - ${bs.text[0].text}: ${bs.reasoning}`);
  });
  console.log(`🎯 STRATEGIC DIRECTION: Transform from "Resume Summary" to "The Empathetic Observer"`);

  // 2. Generate Improvements (Engine B)
  console.log('\n\n[ENGINE B] THE ALCHEMIST (GENERATING SOLUTIONS):');
  console.log('----------------------------------------------------------------');

  // --- A. FIX THE HOOK ---
  console.log('\n1. FIXING THE HOOK (Focus: Immediacy vs. "Ever since I was young")');
  const hookResult = await NarrativeGenerator.generate({
    originalText: RAW_ESSAY,
    analysisContext: ENGINE_A_OUTPUT,
    focusArea: 'hook',
    specificDirective: 'Drop us directly into the hospital front desk chaos. No backstory.',
    targetArchetype: 'The Empathetic Observer'
  });
  console.log(hookResult);

  // --- B. REWRITE THE "PIVOT MOMENT" (The Angry Patient) ---
  console.log('\n2. REWRITING THE SCENE (The Angry Patient)');
  const pivotResult = await NarrativeGenerator.generate({
    originalText: "One day, a patient came in who was really upset about his bill. I listened to him and told him I would find a nurse. He calmed down and thanked me.",
    analysisContext: ENGINE_A_OUTPUT,
    focusArea: 'pivot_moment',
    specificDirective: 'Show the patient\'s fear, not just anger. Show your hesitation. Do NOT make yourself the hero who solved it easily.',
    targetArchetype: 'The Empathetic Observer'
  });
  console.log(pivotResult);

  // --- C. DEEPEN THE REFLECTION ---
  console.log('\n3. DEEPENING THE REFLECTION (Empathy vs. Science)');
  const reflectionResult = await NarrativeGenerator.generate({
    originalText: "This experience taught me that being a doctor isn't just about science, it's about empathy.",
    analysisContext: ENGINE_A_OUTPUT,
    focusArea: 'reflection',
    specificDirective: 'Move beyond "empathy is important." Discuss the burden of witnessing pain you cannot fix.',
    targetArchetype: 'The Empathetic Observer'
  });
  console.log(reflectionResult);
}

runFullSystemDemo().catch(console.error);

