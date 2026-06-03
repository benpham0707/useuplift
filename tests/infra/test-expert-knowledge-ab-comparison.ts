/**
 * A/B Comparison Test: Expert Knowledge Integration
 *
 * PURPOSE: Empirically verify whether the expert counselor knowledge base
 * actually improves output quality, or is just added token cost.
 *
 * METHODOLOGY:
 * 1. Same student profile, same activity
 * 2. Path A: Generic system prompt (old approach)
 * 3. Path B: Expert system prompt with full knowledge integration
 * 4. Score both outputs on 8 concrete quality dimensions
 *
 * This test answers: "Does the expert knowledge make Claude's output
 * measurably better, or is it just expensive decoration?"
 */

import { callClaude } from '../../src/lib/llm/claude';
import {
  assembleExpertContext,
  formatExpertKnowledgeForPrompt,
} from '../../src/services/portfolioStrategy/services/activityWorkshop/expertCounselorKnowledgeBase';
import {
  buildExpertTeachingPrompt,
  buildActivityExpertContext,
} from '../../src/services/portfolioStrategy/services/activityWorkshop/expertSystemPrompts';

// ─────────────────────────────────────────────────
// TEST DATA: A realistic student with nuance
// ─────────────────────────────────────────────────

const TEST_STUDENT = {
  activities: [
    {
      id: 'act-1',
      title: 'Robotics Club',
      description: 'Helped build robots for competitions. Worked on programming and mechanical design. We competed at regionals.',
      role: 'Vice President',
      hoursPerWeek: 12,
      weeksPerYear: 40,
      yearsInvolved: 3,
      gradeLevels: ['10', '11', '12'],
    },
    {
      id: 'act-2',
      title: 'Math Tutoring',
      description: 'Tutored underclassmen in AP Calculus and Pre-Calculus. Helped students prepare for tests and understand difficult concepts.',
      role: 'Lead Tutor',
      hoursPerWeek: 5,
      weeksPerYear: 36,
      yearsInvolved: 2,
      gradeLevels: ['11', '12'],
    },
    {
      id: 'act-3',
      title: 'Part-time Job at Restaurant',
      description: 'Worked as a server and sometimes helped manage shifts when the manager was out. Balanced work with school commitments.',
      role: 'Server/Shift Lead',
      hoursPerWeek: 20,
      weeksPerYear: 52,
      yearsInvolved: 2,
      gradeLevels: ['11', '12'],
    },
  ],
  studentContext: {
    intendedMajor: 'Computer Science',
    targetSchools: ['MIT', 'Carnegie Mellon', 'Georgia Tech'],
    isFirstGen: true,
    hasWorkObligations: true,
    workHoursPerWeek: 20,
    constraintNotes: 'Works to support family, first-generation college student',
    geographicContext: 'Rural high school, limited STEM resources',
  },
};

// The specific activity we'll test teaching on
const TARGET_ACTIVITY = TEST_STUDENT.activities[0]; // Robotics Club
const TARGET_ANALYSIS = {
  tier: 3,
  issues: ['Vague description - no specific achievements', 'Missing quantifiable metrics', 'Passive voice throughout'],
  strengths: ['Multi-year commitment', 'Leadership role', 'Technical skills demonstrated'],
  greenFlags: ['3-year commitment', 'VP leadership'],
  redFlags: ['No competition results mentioned', 'Description could apply to any robotics team member'],
};

// ─────────────────────────────────────────────────
// THE GENERIC PROMPT (Path A - old approach)
// ─────────────────────────────────────────────────

const GENERIC_SYSTEM_PROMPT = `You are a warm, encouraging college admissions advisor. Provide teaching that celebrates strengths first, then offers specific improvements with before/after examples. Output valid JSON only.`;

function buildGenericUserPrompt(): string {
  return `Provide deep teaching for this activity.

STUDENT CONTEXT:
- Intended Major: Computer Science
- Target Schools: MIT, Carnegie Mellon, Georgia Tech

ACTIVITY: ${TARGET_ACTIVITY.title}
- Description: "${TARGET_ACTIVITY.description}"
- Role: ${TARGET_ACTIVITY.role}
- Tier: ${TARGET_ANALYSIS.tier}
- Issues: ${TARGET_ANALYSIS.issues.join('; ')}
- Strengths: ${TARGET_ANALYSIS.strengths.join('; ')}
- Green Flags: ${TARGET_ANALYSIS.greenFlags.join('; ')}
- Red Flags: ${TARGET_ANALYSIS.redFlags.join('; ')}

Respond with JSON:
{
  "celebration": {
    "headline": "One celebratory sentence about what's great",
    "strengths": ["strength1", "strength2"]
  },
  "tierExplanation": {
    "assignedTier": ${TARGET_ANALYSIS.tier},
    "explanation": "Why this tier",
    "whatWouldChangeIt": "How to improve"
  },
  "improvementTeaching": [{
    "issue": "main issue to fix",
    "whyItMatters": "why this matters",
    "howToFix": "step by step guidance",
    "exampleBefore": "quote their weak text",
    "exampleAfter": "your improved version"
  }],
  "descriptionOptimization": {
    "originalDescription": "${TARGET_ACTIVITY.description.replace(/"/g, '\\"')}",
    "optimizedDescription": "your improved version (max 150 chars)",
    "changesExplained": [{ "change": "what changed", "reason": "why" }]
  }
}`;
}

// ─────────────────────────────────────────────────
// THE EXPERT PROMPT (Path B - new approach)
// ─────────────────────────────────────────────────

function buildExpertUserPrompt(expertContext: ReturnType<typeof assembleExpertContext>): string {
  const activityExpertSection = buildActivityExpertContext(expertContext, TARGET_ACTIVITY.id, TARGET_ACTIVITY.description);

  return `Provide deep teaching for this activity.

STUDENT CONTEXT:
- Intended Major: Computer Science
- Target Schools: MIT, Carnegie Mellon, Georgia Tech
- First-Generation College Student
${expertContext.constraintLevel ? `- Constraint Level: ${expertContext.constraintLevel.name} (Level ${expertContext.constraintLevel.level}) — ${expertContext.constraintLevel.description}` : ''}
${expertContext.narrativeArc ? `- Narrative Arc: ${expertContext.narrativeArc.name} — ${expertContext.narrativeArc.description}` : ''}

ACTIVITY: ${TARGET_ACTIVITY.title}
- Description: "${TARGET_ACTIVITY.description}"
- Role: ${TARGET_ACTIVITY.role}
- Tier: ${TARGET_ANALYSIS.tier}
- Issues: ${TARGET_ANALYSIS.issues.join('; ')}
- Strengths: ${TARGET_ANALYSIS.strengths.join('; ')}
- Green Flags: ${TARGET_ANALYSIS.greenFlags.join('; ')}
- Red Flags: ${TARGET_ANALYSIS.redFlags.join('; ')}

${activityExpertSection ? `EXPERT COUNSELOR INTELLIGENCE:
${activityExpertSection}` : ''}

TEACHING PROTOCOL:
1. CELEBRATE FIRST — Acknowledge what's genuinely working. Be specific.
2. EDUCATE — Explain WHY this matters using admissions psychology (the 8-minute read, committee pitch test).
3. TRANSFORM — Show concrete before/after. Quote their text, then show the improved version.
4. CONNECT — Link to their broader narrative and how this activity fits their story.

Respond with JSON:
{
  "celebration": {
    "headline": "One celebratory sentence about what's great",
    "strengths": ["strength1", "strength2"]
  },
  "tierExplanation": {
    "assignedTier": ${TARGET_ANALYSIS.tier},
    "explanation": "Why this tier",
    "whatWouldChangeIt": "How to improve"
  },
  "improvementTeaching": [{
    "issue": "main issue to fix",
    "whyItMatters": "why this matters",
    "howToFix": "step by step guidance",
    "exampleBefore": "quote their weak text",
    "exampleAfter": "your improved version"
  }],
  "descriptionOptimization": {
    "originalDescription": "${TARGET_ACTIVITY.description.replace(/"/g, '\\"')}",
    "optimizedDescription": "your improved version (max 150 chars)",
    "changesExplained": [{ "change": "what changed", "reason": "why" }]
  }
}`;
}

// ─────────────────────────────────────────────────
// QUALITY SCORING: 8 concrete dimensions
// ─────────────────────────────────────────────────

interface QualityScore {
  dimension: string;
  score: number; // 0-10
  evidence: string;
}

function scoreOutput(output: string, label: string): QualityScore[] {
  const scores: QualityScore[] = [];
  const lower = output.toLowerCase();

  // 1. SPECIFICITY: Does it reference specific numbers, examples, or the student's actual words?
  const specificity = (() => {
    let s = 0;
    if (output.includes('"Helped build robots')) s += 2; // Quotes their actual text
    if (output.includes('"Worked on programming')) s += 1;
    if (/\d+/.test(output)) s += 2; // Contains numbers
    if (/\b(regionals|VP|vice president)\b/i.test(output)) s += 1; // References their specific details
    if (output.includes('before') || output.includes('after') || output.includes('Before') || output.includes('After')) s += 2;
    if (/["'][^"']{20,}["']/.test(output)) s += 2; // Contains quoted text longer than 20 chars
    return Math.min(10, s);
  })();
  scores.push({ dimension: 'Specificity', score: specificity, evidence: `${label}: Found ${(output.match(/\d+/g) || []).length} numbers, ${(output.match(/["'][^"']{10,}["']/g) || []).length} quoted phrases` });

  // 2. ADMISSIONS PSYCHOLOGY: Does it reference how AOs actually think?
  const admPsych = (() => {
    let s = 0;
    if (/committee/i.test(output)) s += 2; // Committee reference
    if (/8.minute|eight.minute/i.test(output)) s += 2; // 8-minute read
    if (/AO|admissions officer|reader/i.test(output)) s += 1;
    if (/scan|skim|scroll/i.test(output)) s += 1; // How AOs actually read
    if (/pitch|advocate/i.test(output)) s += 2; // Committee pitch concept
    if (/stand out|remember|memorable/i.test(output)) s += 1;
    if (/tired|40th application|late at night/i.test(output)) s += 1; // Realistic AO empathy
    return Math.min(10, s);
  })();
  scores.push({ dimension: 'Admissions Psychology', score: admPsych, evidence: `${label}: committee=${/committee/i.test(output)}, 8-min=${/8.minute/i.test(output)}, pitch=${/pitch/i.test(output)}` });

  // 3. CONSTRAINT AWARENESS: Does it acknowledge first-gen, work obligations, rural context?
  const constraint = (() => {
    let s = 0;
    if (/first.gen|first generation/i.test(output)) s += 3;
    if (/work|job|20 hours|part.time/i.test(output)) s += 2;
    if (/rural|limited resources|access/i.test(output)) s += 2;
    if (/constraint|obstacle|despite|remarkable given/i.test(output)) s += 2;
    if (/initiative|resourceful|created.*where/i.test(output)) s += 1;
    return Math.min(10, s);
  })();
  scores.push({ dimension: 'Constraint Awareness', score: constraint, evidence: `${label}: first-gen=${/first.gen/i.test(output)}, work=${/work|job/i.test(output)}, rural=${/rural/i.test(output)}` });

  // 4. ACTIONABILITY: Does it give concrete, doable next steps?
  const actionability = (() => {
    let s = 0;
    const actionVerbs = (output.match(/\b(add|include|replace|change|rewrite|mention|specify|quantify|describe|list|highlight)\b/gi) || []);
    s += Math.min(4, actionVerbs.length); // Up to 4 points for action verbs
    if (/step|first|then|next/i.test(output)) s += 2; // Sequential guidance
    if (output.includes('optimizedDescription')) s += 2; // Actually rewrote description
    if (/\d+ (students?|members?|teams?|hours?|dollars?)/i.test(output)) s += 2; // Specific metric suggestions
    return Math.min(10, s);
  })();
  scores.push({ dimension: 'Actionability', score: actionability, evidence: `${label}: ${(output.match(/\b(add|include|replace|change|rewrite|mention|specify|quantify)\b/gi) || []).length} action verbs` });

  // 5. SCHOOL-SPECIFIC INTELLIGENCE: Does it reference MIT/CMU/GT preferences?
  const schoolSpecific = (() => {
    let s = 0;
    if (/MIT/i.test(output)) s += 2;
    if (/Carnegie Mellon|CMU/i.test(output)) s += 2;
    if (/Georgia Tech/i.test(output)) s += 2;
    if (/innovation|maker|build|create/i.test(output)) s += 1; // Tech school values
    if (/technical depth|engineering/i.test(output)) s += 1;
    if (/hands.on|project|prototype/i.test(output)) s += 1;
    if (/collaborative|team/i.test(output)) s += 1;
    return Math.min(10, s);
  })();
  scores.push({ dimension: 'School-Specific Intelligence', score: schoolSpecific, evidence: `${label}: MIT=${/MIT/i.test(output)}, CMU=${/CMU|Carnegie/i.test(output)}, GT=${/Georgia Tech/i.test(output)}` });

  // 6. SARA HARBERSON FRAMEWORK: Does it cite the tier framework with authority?
  const harberson = (() => {
    let s = 0;
    if (/Sara Harberson|Harberson/i.test(output)) s += 3; // Names the framework
    if (/tier [1-4]/i.test(output)) s += 1;
    if (/national|state|regional|school.level/i.test(output)) s += 2; // Tier definitions
    if (/recognition|competition level|impact scope/i.test(output)) s += 2;
    if (/benchmark|criteria|standard/i.test(output)) s += 2;
    return Math.min(10, s);
  })();
  scores.push({ dimension: 'Sara Harberson Framework', score: harberson, evidence: `${label}: named=${/Harberson/i.test(output)}, tier-refs=${(output.match(/tier [1-4]/gi) || []).length}` });

  // 7. TRANSFORMATION QUALITY: How good is the before/after?
  const transformation = (() => {
    let s = 0;
    // Check if optimizedDescription exists and is meaningfully different
    const optimizedMatch = output.match(/"optimizedDescription"\s*:\s*"([^"]+)"/);
    const originalMatch = output.match(/"originalDescription"\s*:\s*"([^"]+)"/);
    if (optimizedMatch) {
      const opt = optimizedMatch[1];
      s += 2; // Has optimization
      if (opt.length >= 80 && opt.length <= 160) s += 2; // Proper length
      if (/\d/.test(opt)) s += 2; // Has numbers in optimization
      if (originalMatch && opt !== originalMatch[1]) s += 2; // Actually different
      if (/led|organized|developed|built|created|designed|launched/i.test(opt)) s += 2; // Strong action verbs
    }
    return Math.min(10, s);
  })();
  scores.push({ dimension: 'Transformation Quality', score: transformation, evidence: `${label}: has optimized=${!!output.match(/"optimizedDescription"/)}` });

  // 8. NARRATIVE CONNECTION: Does it connect to broader story/CS spike?
  const narrative = (() => {
    let s = 0;
    if (/story|narrative|portfolio/i.test(output)) s += 2;
    if (/spike|depth|focus|thread/i.test(output)) s += 2;
    if (/computer science|CS|tech/i.test(output)) s += 2; // Connects to intended major
    if (/complements?|supports?|reinforces?/i.test(output)) s += 2; // Activity interrelation
    if (/pattern|trajectory|growth/i.test(output)) s += 2;
    return Math.min(10, s);
  })();
  scores.push({ dimension: 'Narrative Connection', score: narrative, evidence: `${label}: spike=${/spike/i.test(output)}, CS=${/computer science|CS/i.test(output)}, story=${/story|narrative/i.test(output)}` });

  return scores;
}

// ─────────────────────────────────────────────────
// RUN THE COMPARISON
// ─────────────────────────────────────────────────

async function runComparison() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  A/B COMPARISON: Expert Knowledge Integration');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('Same student. Same activity. Different prompts.');
  console.log('Does expert knowledge ACTUALLY improve output?');
  console.log('');

  // Build expert context
  const expertContext = assembleExpertContext({
    activities: TEST_STUDENT.activities,
    studentContext: TEST_STUDENT.studentContext,
    analysisResults: {
      'act-1': { tier: 3, greenFlags: TARGET_ANALYSIS.greenFlags, redFlags: TARGET_ANALYSIS.redFlags.map(r => r), issues: TARGET_ANALYSIS.issues },
    },
  });

  console.log('Expert Context Assembled:');
  console.log(`  Constraint Level: ${expertContext.constraintLevel?.name || 'None'} (Level ${expertContext.constraintLevel?.level || 0})`);
  console.log(`  Narrative Arc: ${expertContext.narrativeArc?.name || 'None detected'}`);
  console.log(`  School Archetypes: ${expertContext.schoolArchetypes.map(s => s.name).join(', ') || 'None'}`);
  console.log(`  Character Traits: ${expertContext.characterTraits.demonstrated.length} demonstrated, ${expertContext.characterTraits.missing.length} missing`);
  console.log(`  Advanced Issues: ${expertContext.advancedIssues.length}`);
  console.log(`  Authenticity: ${expertContext.authenticityAssessment.overallLevel}`);
  console.log(`  Impact Credibility: ${expertContext.impactCredibility}`);
  console.log('');

  // Measure expert prompt token cost
  const expertSystemPrompt = buildExpertTeachingPrompt(expertContext, 'deep');
  const expertUserPrompt = buildExpertUserPrompt(expertContext);
  const genericUserPrompt = buildGenericUserPrompt();

  console.log('Token Cost Comparison:');
  console.log(`  Generic system prompt: ~${Math.round(GENERIC_SYSTEM_PROMPT.length / 4)} tokens`);
  console.log(`  Expert system prompt: ~${Math.round(expertSystemPrompt.length / 4)} tokens`);
  console.log(`  Generic user prompt: ~${Math.round(genericUserPrompt.length / 4)} tokens`);
  console.log(`  Expert user prompt: ~${Math.round(expertUserPrompt.length / 4)} tokens`);
  console.log(`  Additional cost: ~${Math.round((expertSystemPrompt.length + expertUserPrompt.length - GENERIC_SYSTEM_PROMPT.length - genericUserPrompt.length) / 4)} extra tokens`);
  console.log('');

  // ── Path A: Generic ──
  console.log('═══ PATH A: GENERIC PROMPT ═══');
  console.log('Running...');
  const startA = Date.now();
  const responseA = await callClaude({
    model: 'claude-sonnet-4-5-20250929',
    systemPrompt: GENERIC_SYSTEM_PROMPT,
    userPrompt: genericUserPrompt,
    maxTokens: 4000,
    temperature: 0.3,
  });
  const timeA = Date.now() - startA;
  console.log(`  Time: ${timeA}ms`);
  console.log(`  Output tokens: ${responseA.usage?.outputTokens || 'unknown'}`);
  console.log('');

  // ── Path B: Expert ──
  console.log('═══ PATH B: EXPERT PROMPT ═══');
  console.log('Running...');
  const startB = Date.now();
  const responseB = await callClaude({
    model: 'claude-sonnet-4-5-20250929',
    systemPrompt: expertSystemPrompt,
    userPrompt: expertUserPrompt,
    maxTokens: 4000,
    temperature: 0.3,
  });
  const timeB = Date.now() - startB;
  console.log(`  Time: ${timeB}ms`);
  console.log(`  Output tokens: ${responseB.usage?.outputTokens || 'unknown'}`);
  console.log('');

  // ── SCORE BOTH OUTPUTS ──
  console.log('═══════════════════════════════════════════════════');
  console.log('  QUALITY COMPARISON');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  const scoresA = scoreOutput(responseA.content, 'Generic');
  const scoresB = scoreOutput(responseB.content, 'Expert');

  const totalA = scoresA.reduce((sum, s) => sum + s.score, 0);
  const totalB = scoresB.reduce((sum, s) => sum + s.score, 0);

  // Print side-by-side comparison
  console.log('Dimension                    | Generic | Expert | Winner');
  console.log('─────────────────────────────|─────────|────────|───────');
  for (let i = 0; i < scoresA.length; i++) {
    const a = scoresA[i];
    const b = scoresB[i];
    const winner = a.score > b.score ? 'A (Generic)' : b.score > a.score ? 'B (Expert)' : 'TIE';
    const dim = a.dimension.padEnd(28);
    console.log(`${dim} |    ${a.score}/10 |   ${b.score}/10 | ${winner}`);
  }
  console.log('─────────────────────────────|─────────|────────|───────');
  console.log(`${'TOTAL'.padEnd(28)} | ${totalA.toString().padStart(4)}/80 | ${totalB.toString().padStart(3)}/80 | ${totalA > totalB ? 'A (Generic)' : totalB > totalA ? 'B (Expert)' : 'TIE'}`);
  console.log('');

  // ── DETAILED EVIDENCE ──
  console.log('═══ EVIDENCE DETAILS ═══');
  console.log('');
  for (let i = 0; i < scoresA.length; i++) {
    console.log(`${scoresA[i].dimension}:`);
    console.log(`  ${scoresA[i].evidence}`);
    console.log(`  ${scoresB[i].evidence}`);
    console.log('');
  }

  // ── PRINT RAW OUTPUTS FOR MANUAL INSPECTION ──
  console.log('═══════════════════════════════════════════════════');
  console.log('  RAW OUTPUT A (Generic)');
  console.log('═══════════════════════════════════════════════════');
  console.log(responseA.content.substring(0, 3000));
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  RAW OUTPUT B (Expert)');
  console.log('═══════════════════════════════════════════════════');
  console.log(responseB.content.substring(0, 3000));
  console.log('');

  // ── VERDICT ──
  console.log('═══════════════════════════════════════════════════');
  console.log('  VERDICT');
  console.log('═══════════════════════════════════════════════════');
  const diff = totalB - totalA;
  if (diff > 10) {
    console.log(`Expert knowledge significantly improves output (+${diff} points)`);
    console.log('The additional token cost is justified.');
  } else if (diff > 3) {
    console.log(`Expert knowledge moderately improves output (+${diff} points)`);
    console.log('Some dimensions improve, others are similar.');
  } else if (diff >= 0) {
    console.log(`Expert knowledge shows minimal improvement (+${diff} points)`);
    console.log('The additional tokens may not be worth the cost.');
  } else {
    console.log(`Expert knowledge DECREASED quality (${diff} points)`);
    console.log('The added complexity may be confusing the LLM.');
  }

  // ── KEY QUESTION ANSWERS ──
  console.log('');
  console.log('KEY FINDINGS:');
  const constraintDiff = scoresB[2].score - scoresA[2].score;
  const admPsychDiff = scoresB[1].score - scoresA[1].score;
  const schoolDiff = scoresB[4].score - scoresA[4].score;
  const harbersonDiff = scoresB[5].score - scoresA[5].score;

  console.log(`  1. Does expert prompt make Claude consider constraints? ${constraintDiff > 0 ? `YES (+${constraintDiff})` : constraintDiff === 0 ? 'NO DIFFERENCE' : `NO, WORSE (${constraintDiff})`}`);
  console.log(`  2. Does expert prompt inject AO psychology? ${admPsychDiff > 0 ? `YES (+${admPsychDiff})` : admPsychDiff === 0 ? 'NO DIFFERENCE' : `NO, WORSE (${admPsychDiff})`}`);
  console.log(`  3. Does expert prompt add school-specific advice? ${schoolDiff > 0 ? `YES (+${schoolDiff})` : schoolDiff === 0 ? 'NO DIFFERENCE' : `NO, WORSE (${schoolDiff})`}`);
  console.log(`  4. Does expert prompt ground in Sara Harberson? ${harbersonDiff > 0 ? `YES (+${harbersonDiff})` : harbersonDiff === 0 ? 'NO DIFFERENCE' : `NO, WORSE (${harbersonDiff})`}`);
}

runComparison().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
