#!/usr/bin/env node

/**
 * LLM INTEGRATION EXAMPLE
 *
 * Demonstrates how to use transparent scoring data with an LLM
 * to provide sophisticated, evidence-based college admissions guidance.
 *
 * This is an architecture demonstration. In production, you would:
 * 1. Call the MCP tools to get analysis with transparent scoring
 * 2. Feed the structured data to your LLM (Claude, GPT-4, etc.)
 * 3. Get nuanced, context-aware guidance back
 */

import {
  enableMockMode,
  initializeSupabase
} from '../src/database/supabaseClientTestable.js';

import {
  seedMockDatabase,
  clearMockDatabase
} from '../src/database/supabaseClientMock.js';

import { tools } from '../src/tools/index.js';

// Enable mock mode
enableMockMode();
initializeSupabase();

console.log('═══════════════════════════════════════════════════════════════');
console.log('  LLM INTEGRATION EXAMPLE');
console.log('  Hybrid Deterministic + AI System for College Admissions');
console.log('═══════════════════════════════════════════════════════════════\n');

// Example student: First-gen with strong leadership
clearMockDatabase();
seedMockDatabase({
  user_id: 'example-student-001',
  profile: {
    first_gen: true,
    challenging_circumstances: true,
    family_hours_per_week: 15,
    financial_need: true,
    leadership_roles: [
      {
        name: 'Debate Team Captain',
        hours_per_week: 12,
        impact: 'Led team to state championship. Mentored 15 new members. Organized weekly practice sessions and developed training curriculum that improved average speaker scores by 25%.'
      },
      {
        name: 'Student Government VP',
        hours_per_week: 8,
        impact: 'Coordinated school-wide initiatives serving 1,200 students. Managed $15,000 budget.'
      }
    ],
    gpa: 3.85,
    ap_courses: 9,
    intended_major: 'Political Science'
  }
});

async function demonstrateLLMIntegration() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 1: Get Analysis from Deterministic MCP Tools');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const piqAnalysis = await tools.suggest_piq_prompts({
    user_id: 'example-student-001'
  });

  console.log('✅ Received PIQ Analysis with Transparent Scoring\n');
  console.log(`Found ${piqAnalysis.recommendations.length} recommendations:`);

  // Show top 2 recommendations
  for (let i = 0; i < Math.min(2, piqAnalysis.recommendations.length); i++) {
    const rec = piqAnalysis.recommendations[i];
    console.log(`\n  ${i + 1}. PIQ ${rec.prompt_number}: ${rec.prompt_text.substring(0, 50)}...`);
    console.log(`     Fit Score: ${rec.fit_score}/100`);
    console.log(`     Base Score: ${rec.base_score}/100 (raw achievements)`);
    console.log(`     Context Boost: +${rec.context_adjustment} (circumstances/barriers)`);
    console.log(`     Adjustments:`);
    if (rec.score_breakdown?.adjustments) {
      for (const adj of rec.score_breakdown.adjustments.slice(0, 3)) {
        console.log(`       • ${adj.reason}: +${adj.points}`);
      }
    }
  }

  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 2: Construct LLM Prompt with Structured Data');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const llmPrompt = `You are an expert college admissions counselor. Analyze this student's PIQ opportunities and provide strategic guidance.

STUDENT ANALYSIS (from deterministic algorithms):

${JSON.stringify(piqAnalysis, null, 2)}

YOUR TASK:

1. **Top 2 PIQ Recommendations**
   - For each, explain WHY it's a good fit (reference base_score vs context_adjustment)
   - Identify what makes this PIQ uniquely strong for THIS student

2. **Specific Essay Strategy**
   - Opening hook suggestion
   - Key story beats to hit
   - What to avoid (clichés, common mistakes)

3. **Warning about Weak PIQs**
   - Which PIQs to avoid and why
   - What would make them stronger (if anything)

4. **Gap Analysis**
   - What's missing from their profile
   - Realistic next steps to strengthen weaker areas

Be direct, specific, and evidence-based. Use the score breakdowns to explain your reasoning.
Reference specific numbers (e.g., "Your PIQ 4 scores 98/100 because...").
`;

  console.log('LLM Prompt Template:');
  console.log('─────────────────────────────────────────────────────────────');
  console.log(llmPrompt.substring(0, 800) + '...\n[truncated for display]');

  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 3: Example LLM Response (Simulated)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const simulatedLLMResponse = `Based on your analysis, here's my strategic guidance:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOP RECOMMENDATION: PIQ 4 (Educational Barrier) - Score: 98/100
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHY THIS IS YOUR STRONGEST PIQ:
├─ Base Score: 40/100 (opportunity seized through 9 AP courses)
├─ Context Boost: +58 points (first-gen +25, family duties +20, challenges +20, financial +15)
└─ Final: 98/100 - This is EXCEPTIONAL

What makes this powerful for YOU specifically:
• You didn't just take AP courses—you took NINE while supporting your family 15 hrs/week
• Being first-gen means you navigated an unfamiliar college prep system alone
• Your 3.85 GPA despite these barriers shows extraordinary resilience

ESSAY STRATEGY:

Opening Hook (don't start generic):
❌ "I've always wanted to go to college despite challenges..."
✅ "At 11 PM on a Tuesday, I was reviewing AP Calc notes while my younger
   siblings finally fell asleep in the next room. In six hours, I'd have to
   explain polynomial derivatives to my debate team. The contradiction wasn't
   lost on me: teaching advanced math while my own education felt like a
   constant negotiation with time."

Story Arc:
1. Specific barrier moment (studying while family responsibilities pull you away)
2. Internal conflict (wanting to excel vs. family obligations)
3. How you navigated it (specific systems you developed)
4. Growth revelation (leadership skills from family responsibility → debate captain)
5. Connect to future (how this resilience shapes your academic goals)

AVOID:
• Generic "I worked hard" statements
• Making it sound like a hardship Olympics (stay authentic)
• Separating school/family as two different worlds (show the intersection)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECOND CHOICE: PIQ 6 (Academic Passion) - Score: 93/100
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHY THIS WORKS:
├─ Base Score: 70/100 (strong course rigor alone)
├─ Context Boost: +23 (Political Science major + 9 AP courses + excellence)
└─ Final: 93/100

This PIQ shows intellectual curiosity that complements PIQ 4's resilience story.
Your debate captain role (state championship, +25% speaker scores) demonstrates
applied political thinking, not just classroom learning.

ESSAY STRATEGY:
• Pick a specific political/debate moment that sparked deeper intellectual curiosity
• Show evolution: how you went from "winning debates" to "understanding systems"
• Connect to Political Science major with authentic curiosity (not resume building)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WARNING: Don't write PIQ 1 (Leadership) yet
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Wait—I see you have strong leadership (2 roles, state championship, measurable
impact). But here's the strategic issue:

Your PIQ 4 will ALREADY show leadership (navigating first-gen + family + 9 APs
requires initiative and self-leadership). And your PIQ 6 will show debate captain
intellectual leadership.

Writing a THIRD leadership essay (PIQ 1) risks:
• Repetitive narrative across your portfolio
• Missing chance to show other dimensions (identity, creativity, community)

BETTER STRATEGY:
Instead of PIQ 1, consider:
• PIQ 8 (Open-ended): Show your immigrant background or unique identity (+8 context)
• PIQ 7 (Community): If debate team does community outreach, show different angle

Your leadership is ALREADY evident. Use your 4 PIQs to show multidimensional you.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GAP ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What would strengthen your profile further:

1. CREATIVE/TALENT dimension (currently missing)
   → If you have ANY creative outlet (writing, art, music), even informal,
     consider PIQ 2 or PIQ 3 to show different side

2. COMMUNITY SERVICE dimension (underdeveloped)
   → If debate team does community teaching/outreach, PIQ 7 could work
   → But only if it's substantive (8+ hrs/week), not title-only

3. VULNERABILITY/AUTHENTICITY (good in PIQ 4, strengthen further)
   → PIQ 5 (Challenge) could work if you have a specific growth story beyond
     just "first-gen + family duties" (which PIQ 4 covers)
   → Or PIQ 8 for identity/cultural exploration

RECOMMENDED PORTFOLIO:
• PIQ 4 (Educational Barrier) - 98/100 - Your strongest story
• PIQ 6 (Academic Passion) - 93/100 - Shows intellectual depth
• PIQ 8 (Open-ended) - 86/100 - Identity/unique perspective
• PIQ 7 (Community) - 83/100 - If debate has community angle

This gives you: Resilience + Intellect + Identity + Service = Well-Rounded Leader
archetype with authentic narrative arc.`;

  console.log(simulatedLLMResponse);

  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 4: Why This Hybrid System is Powerful');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log(`
DETERMINISTIC LAYER (MCP Tools):
✅ Fast (<10ms response time)
✅ Reliable (100% reproducible)
✅ Transparent (shows exactly why scores are what they are)
✅ Grounded in data (validates against actual student profile)
✅ Mathematically precise (base + adjustments = final)

          ↓ feeds structured data to ↓

AI/LLM LAYER:
✅ Nuanced (understands context and emotional weight)
✅ Strategic (sees portfolio holistically)
✅ Adaptive (tailors advice to individual student)
✅ Creative (suggests specific essay strategies, opening hooks)
✅ Empathetic (authentic guidance, not generic platitudes)

          ↓ results in ↓

STUDENT RECEIVES:
✅ Evidence-based recommendations (not hunches)
✅ Transparent reasoning (can see the "why")
✅ Actionable strategies (specific next steps)
✅ Reality-grounded guidance (not false hope or discouragement)
✅ Confidence in decisions (backed by both data and expertise)
`);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 5: Production Implementation');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log(`
In your production app:

\`\`\`typescript
// 1. Get analysis from MCP server
const analysis = await fetch('http://localhost:3000/mcp', {
  method: 'POST',
  body: JSON.stringify({
    tool: 'suggest_piq_prompts',
    arguments: { user_id: studentId }
  })
});

// 2. Feed to your LLM
const guidance = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 4096,
  messages: [{
    role: 'user',
    content: \`You are an expert college counselor. Analyze this PIQ data:

    \${JSON.stringify(analysis, null, 2)}

    Provide strategic guidance...\`
  }]
});

// 3. Display to student
return {
  algorithmicScores: analysis,  // Transparent, validated data
  expertGuidance: guidance.content,  // AI-powered strategy
  sources: 'Hybrid system: deterministic analysis + AI reasoning'
};
\`\`\`

Key Benefits:
• LLM never hallucinates scores (deterministic layer provides ground truth)
• Students see WHY they got recommendations (transparent scoring)
• Counselors can validate AI advice (all scores traceable to student data)
• System gracefully degrades (if LLM fails, deterministic layer still works)
`);

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  LLM INTEGRATION EXAMPLE COMPLETE');
  console.log('  This demonstrates Phase 1.5: Transparent Scoring for AI');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

demonstrateLLMIntegration().catch(error => {
  console.error('Example error:', error);
  process.exit(1);
});
