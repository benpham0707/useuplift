/**
 * Roadmap Generator — Section 3: Strategic Roadmap
 *
 * Generates the strategic roadmap section of the deep academic report.
 * Ported from monolith's generateStrategicRoadmap() with prompt improvements:
 * - B8: Trajectory action items from analysis
 * - D1: Expected courses from admitted student profiles
 * - Progression awareness: No backward course recommendations
 */

import { callClaude } from '@/lib/llm/claude';
import { parseClaudeJSON } from '../../../../../../commonAppWorkshop/utils/jsonParser';
import type { EnrichedReportContext } from '../types';
import type { StrategicRoadmapSection } from '../types';
import { formatSubject } from '../context/tierCalibration';

// ============================================================================
// CONSTANTS
// ============================================================================

const MODEL = 'claude-sonnet-4-5-20250929';
const MAX_TOKENS_PER_SECTION = 4096;

// ============================================================================
// GENERATOR
// ============================================================================

export async function generateStrategicRoadmap(
  ctx: EnrichedReportContext,
  trackUsage: (usage: { input_tokens?: number; output_tokens?: number } | undefined) => void
): Promise<StrategicRoadmapSection> {
  const planning = ctx.forRoadmap.planningAdvice;
  const quant = ctx.quantitativeAnalysis;

  const systemPrompt = `You MUST output valid JSON only — no markdown, no headers, no explanation text outside the JSON object.

You are an expert academic advisor writing a strategic roadmap for a HIGH SCHOOL STUDENT. Write in second person ("you"). Be practical and encouraging.

CRITICAL RULES:
1. RESPOND ONLY WITH A SINGLE JSON OBJECT. No markdown formatting, no preamble, no explanation outside the JSON.
2. Only reference courses the student has ACTUALLY taken (listed in the COMPLETE COURSE LIST below).
3. STUDENT-FRIENDLY LANGUAGE: Write for a high schooler.
   - Use actual GPAs and course names (students understand these)
   - AVOID raw statistical jargon: no "38% risk level", "-0.37 typical impact", "73% consistency"
   - INSTEAD use plain English: "your grades suggest you can handle this", "expect about a B+ based on your similar coursework"
   - For trajectory projections, describe the OUTCOME: "With strong senior year performance, your GPA could climb to around 3.70" instead of "0.22 GPA delta between scenarios"
4. Every recommendation must reference the student's actual past performance.
5. Course recommendations must be internally consistent — if you limit total course load, don't list more courses than the cap allows.

COURSE RECOMMENDATION QUALITY:
- Recommended courses should represent PROGRESSION, not regression. If a student earned a 4.0 in AP Computer Science A, recommending AP Computer Science Principles (an intro-level breadth course) is a step backward. Instead, recommend courses that demonstrate deeper engagement: data structures, algorithms, college CS courses, or independent projects.
- "expectedOutcome" should reference the student's SPECIFIC past performance in similar courses to ground the projection. Example: "Based on your 3.30 in Mechanics, expect 3.0-3.3 range — E&M is typically considered harder by students."
- Be consistent between Section 2 (Challenges) and Section 3 (Roadmap). If a course is recommended here, Section 2 should not recommend a contradictory alternative.
- Check the student's EXISTING courses before recommending. If they earned 4.0 in AP Computer Science A, do NOT recommend AP Computer Science Principles (a step backward). Recommend forward progression: dual enrollment CS, independent research, or competition-level work.

SCOPE — this section OWNS:
- Prioritized action items and the reasoning behind their order
- Specific course recommendations with risk assessment
- Major alignment analysis
- GPA trajectory optimization advice
DO NOT duplicate:
- Challenge analysis or AO interpretations (Section 2 owns that)
- Identity or tier framing (Section 1 owns that)
- Reference earlier sections instead of restating their conclusions. Say "As identified in Section 2, your STEM foundation gaps..." rather than re-explaining the gap.
- Each priority description should explain WHY this action is prioritized (the strategic logic) — not re-analyze the underlying challenge. Section 2 already did that analysis.
- When a recommended course relates to a Section 2 challenge, briefly name the challenge: "This addresses the STEM Foundation Inconsistency identified in your Challenges analysis."

Output valid JSON:
{
  "priorities": [
    {
      "priority": 1,
      "title": "Short title",
      "description": "2-3 sentences explaining WHY this is the top priority and what changes if they do/don't act.",
      "impact": "critical" | "high" | "moderate",
      "actionItems": ["Specific action 1", "Specific action 2"]
    }
  ],
  "courseStrategy": {
    "recommended": [
      {
        "course": "Specific course name",
        "rationale": "MAX 2 sentences. Why this course, tied to 1-2 specific data points from their profile.",
        "risk": "low" | "medium" | "high",
        "expectedOutcome": "MAX 1 sentence. Grade projection with ONE specific reference: 'Based on your [X] in [similar course], expect [Y] range.'"
      }
    ],
    "avoid": [
      { "course": "Course to avoid", "reason": "Why, based on their specific data." }
    ],
    "rationale": "1-2 sentences on the overall course strategy philosophy for this student."
  },
  "majorAlignment": {
    "score": "<0-100>",
    "assessment": "2-3 sentences. Start by stating the alignment LEVEL in terms of college competitiveness: 90-100 = 'Exceptional — your coursework tells a clear [major] story competitive at Ivy/Elite schools.' 75-89 = 'Strong — your foundation is solid for Highly Selective [major] programs (UCLA, Georgetown), with minor gaps.' 55-74 = 'Moderate — you have the basics for Selective [major] programs (Boston U, UT Austin), but missing key pieces that would make you competitive at Very Selective programs.' 30-54 = 'Developing — significant gaps for competitive [major] programs.' Below 30 = 'Major misalignment.' Then explain specifically what's present and what's missing.",
    "missingPieces": ["What's missing for their major"],
    "strengthsToLeverage": ["What they already have going for them"]
  },
  "trajectoryOptimization": "4-5 sentences. First, name the biggest GPA lever. Then provide TWO scenarios using the recommended courses and their expected outcomes:\n- BEST CASE: If they earn [expected high] in each recommended course → projected senior year GPA [X], cumulative [Y], major alignment moves to [Z].\n- REALISTIC CASE: If they earn their typical performance → projected senior GPA [X], cumulative [Y].\nUse the student's performance envelope (floor/ceiling/typical) and the expected outcomes from your own course strategy to make these projections specific and grounded."
}

CONSTRAINT: EXACTLY 1 priority may be 'critical'. The other 2 MUST be 'high' or 'moderate'. If everything is critical, nothing is — force yourself to identify the SINGLE most impactful action. // Q10: Constrain Priority Impact Levels

Include exactly 3 priorities, 3-5 recommended courses, and 1-2 courses to avoid. Ensure total recommended courses don't exceed the workload you advise in priorities.`;

  const courseRecs = planning.courseRecommendations || [];
  const opportunities = planning.opportunities || [];
  const workload = planning.workloadAdvice;

  // Build complete course list for grounding
  const allCoursesList = Object.entries(quant.subjectPatterns)
    .map(([subj, p]) => {
      const courses = p.performanceHistory.courses
        .map(c => `${c.name} (${c.level}): ${c.grade.toFixed(2)}`)
        .join(', ');
      return `${formatSubject(subj)}: ${courses}`;
    }).join('\n');

  const userPrompt = `Create a strategic roadmap for this student:

COMPLETE COURSE LIST (courses they have ACTUALLY taken — do NOT claim they are missing any of these, and do NOT say they are "currently taking" a course unless it appears here):
${allCoursesList}

CURRENT TRAJECTORY: ${planning.trajectoryAssessment?.pattern || 'unknown'}
AO INTERPRETATION: ${planning.trajectoryAssessment?.aoInterpretation || 'N/A'}
TRAJECTORY RECOMMENDATION: ${planning.trajectoryAssessment?.recommendation || 'N/A'}

TRAJECTORY ACTION ITEMS (from analysis):
${ctx.forRoadmap.trajectoryActionItems.length > 0
  ? ctx.forRoadmap.trajectoryActionItems.map(a => `- ${a}`).join('\n')
  : 'None identified.'}

COURSE RECOMMENDATIONS FROM ANALYSIS:
${courseRecs.map(r => `- ${formatSubject(r.subject)}: ${r.recommendedLevel}${r.specificCourse ? ` (${r.specificCourse})` : ''} — ${r.rationale} [Risk: ${r.riskLevel}]`).join('\n')}

WORKLOAD ADVICE:
- Recommended rigorous courses: ${workload?.recommendedRigorousCourses || 'N/A'}
- Maximum: ${workload?.maxRigorousCourses || 'N/A'}
- Current vs recommended: ${workload?.currentVsRecommended || 'N/A'}
- Balance: ${workload?.balanceAdvice || 'N/A'}

MAJOR ALIGNMENT:
- Major: ${planning.majorAlignment?.major || ctx.input.intendedMajor || 'Undecided'}
- Alignment score: ${planning.majorAlignment?.alignmentScore || 'N/A'}
- Missing courses: ${planning.majorAlignment?.missingCourses?.join(', ') || 'None'}
- Red flags: ${planning.majorAlignment?.redFlagsForMajor?.join('; ') || 'None'}

EXPECTED COURSES FOR ${ctx.input.intendedMajor || 'college-bound students'} (from admitted student profiles):
${ctx.forRoadmap.expectedCourses.length > 0
  ? ctx.forRoadmap.expectedCourses.map(c =>
      `- ${c.course} [${c.expectationLevel}]: ${c.reasoning}`
    ).join('\n')
  : 'No major-specific course expectations available.'}

OPPORTUNITIES:
${opportunities.map(o => `- [${o.type}] ${o.description}: ${o.action} → ${o.benefit}`).join('\n')}

RED FLAGS:
${(planning.redFlags || []).map(r => `- [${r.severity}] ${r.description}: ${r.howToAddress}`).join('\n')}

PERFORMANCE ENVELOPE:
- Current typical: ${quant.performanceEnvelope.comfortableRange.typicalGPA.toFixed(2)}
- Ceiling: ${quant.performanceEnvelope.ceiling.gpa.toFixed(2)}
- Optimal target: ${quant.performanceEnvelope.optimalTarget.gpa.toFixed(2)}

DIFFICULTY TRANSITION BENCHMARKS (use these to calibrate expectedOutcome): // Q8: Add Difficulty Transition Benchmarks
- Regular → Honors: typically -0.10 to -0.20 GPA impact
- Honors → AP: typically -0.25 to -0.40 GPA impact
- Regular → AP: typically -0.40 to -0.60 GPA impact
- AP → AP (same subject, higher level): typically -0.10 to -0.20 GPA impact
Calibrate the student's specific expectedOutcome using THEIR observed difficulty sensitivity pattern AND these benchmarks.

GRADE: ${ctx.input.currentGrade}
${ctx.input.currentGrade === 11 ? `URGENCY: Senior year is your LAST transcript data point. Every course choice carries disproportionate weight because AOs will see whether your upward trajectory continued or stalled. Frame all recommendations with this urgency — these aren't "nice to have" improvements, they're the final chapter of your academic story.` : ctx.input.currentGrade === 10 ? `URGENCY: You have two more years to shape your transcript. This is the ideal time for strategic course additions and trajectory building — mistakes are recoverable.` : ctx.input.currentGrade === 9 ? `URGENCY: You have three years ahead. Focus on building foundations and exploring interests — the transcript story is just beginning.` : `URGENCY: Factor in the student's remaining time to shape their transcript.`}
SCHOOL TYPE: ${ctx.input.schoolContext.type.replace(/_/g, ' ')}

VERIFIED STATISTICS (cite these):
${ctx.forChallenges.verifiedStats.slice(0, 6).map(s => `- ${s.claim}: ${s.value} (${s.citation})`).join('\n')}`;

  const response = await callClaude<string>({
    model: MODEL,
    systemPrompt,
    userPrompt,
    maxTokens: MAX_TOKENS_PER_SECTION,
    temperature: 0.3,
  });

  trackUsage(response.usage);
  return parseClaudeJSON<StrategicRoadmapSection>(response.content, 'strategicRoadmap');
}
