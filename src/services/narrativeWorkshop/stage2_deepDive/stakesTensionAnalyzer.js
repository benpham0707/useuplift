/**
 * Stage 2.6: Stakes & Tension Analysis Engine
 *
 * Deep dive analysis of narrative tension, conflict, and stakes.
 * Critical because: Tension keeps readers engaged; stakes make them care.
 *
 * Focus Areas:
 * - Tension presence and building (does essay maintain reader interest?)
 * - Conflict clarity (internal/external/both?)
 * - Stakes establishment (what's at risk? why does it matter?)
 * - Suspense techniques (withholding, pacing, anticipation)
 * - Resolution quality (satisfying payoff? earned insight?)
 * - Reader investment (will AO care about outcome?)
 *
 * Elite Benchmarks (from 20 top essays):
 * - 95% establish clear stakes within first 25% of essay
 * - 80% have both internal + external conflict
 * - Elite essays maintain tension through uncertainty
 * - Strong essays use specific obstacles (not vague "challenges")
 * - Top essays resolve tension with earned insight (not neat bow)
 * - Reader investment requires personal cost + specific stakes
 *
 * LLM Configuration:
 * - Temperature: 0.5 (interpretive for tension/engagement)
 * - Model: Sonnet 4.5
 * - Focus: Tension pacing, stakes clarity, conflict complexity
 */
import { callClaudeWithRetry } from '@/lib/llm/claude';
// ============================================================================
// SYSTEM PROMPT
// ============================================================================
const STAKES_TENSION_SYSTEM_PROMPT = `You are an expert college essay analyst specializing in narrative tension and stakes analysis.

Your expertise: Evaluating tension building, conflict complexity, and stakes clarity based on analysis of elite essays from Harvard, Princeton, Stanford, MIT, Yale, and Berkeley.

Critical insights from 20 elite essays:

**Stakes Establishment** (95% of elite essays):
- Established early: Within first 25% of essay
- Specific and concrete: "Six months of research," "Dr. Chen's grant money," "Three doubters to prove wrong"
- Personal cost clear: What protagonist stands to lose
- NOT abstract: "Things might not work out" is too vague
- Multiple layers: Personal + external consequences

**Conflict Types** (80% have BOTH):
- INTERNAL: Doubt, fear, competing values, identity struggle, misconception
  * Example: "Should I abandon my heritage or embrace it?"
  * Example: "Perfection vs authenticity—which matters more?"
- EXTERNAL: Obstacle, failure, opposition, resource constraints, time pressure
  * Example: "19% on chemistry quiz," "Three voters against me," "Two weeks vs two months prep"
- BOTH is elite: Internal struggle + external obstacle = rich narrative

**Tension Building**:
- Uncertainty: Outcome unclear, multiple paths possible
- Escalation: Problem gets worse before resolution
- Pacing: Key moments developed, transitions compressed
- Withholding: Strategic delay of resolution/answer
- NOT smooth: Essays need friction, not success story

**Suspense Techniques**:
- Questions raised: Explicit or implicit uncertainty
- Obstacles introduced: Specific, concrete barriers
- Time pressure: Deadlines, urgency, limited chances
- High stakes: Clear consequences of failure
- NOT manufactured: Tension must feel organic

**Resolution Quality**:
- ELITE: Earned insight, authentic transformation
- STRONG: Problem addressed, growth shown
- WEAK: Neat bow, too perfect, sudden epiphany
- PROBLEMATIC: Unresolved, anticlimactic, rushed
- Best essays: Resolution creates meaning, not just ends story

**Reader Investment**:
- Requires: Personal stakes + specific details + genuine uncertainty
- Enhanced by: Vulnerability, relatable struggle, unique angle
- Killed by: Generic challenges, predictable arc, no real risk
- AO must care: "What happens next?" feeling maintained

Your task: Analyze tension and stakes with elite-calibrated precision for engagement and impact.

Return valid JSON matching the StakesTensionAnalysis type exactly.`;
// ============================================================================
// PROMPT BUILDER
// ============================================================================
function buildStakesTensionPrompt(essayText, essayType) {
    const words = essayText.split(/\s+/);
    const wordCount = words.length;
    // Extract first 25% to check for early stakes establishment
    const first25Percent = words.slice(0, Math.floor(wordCount * 0.25)).join(' ');
    // Extract middle section for tension analysis
    const skipFirst = Math.floor(wordCount * 0.2);
    const skipLast = Math.floor(wordCount * 0.2);
    const middleSection = words.slice(skipFirst, wordCount - skipLast).join(' ');
    return `Analyze the narrative tension and stakes of this essay.

**Full Essay**:
"""
${essayText}
"""

**First 25%** (check for early stakes establishment):
"""
${first25Percent}
"""

**Middle Section** (tension building):
"""
${middleSection}
"""

**Essay Type**: ${essayType}
**Word Count**: ${wordCount}

---

Provide your analysis as valid JSON with these EXACT fields:

{
  "tensionPresent": boolean,
  "tensionLevel": number (0-10 - how gripping is narrative?),
  "tensionPacing": "builds" | "steady" | "fluctuates" | "drops" | "none",
  "tensionTechniques": ["array of techniques used: e.g., 'withholding', 'escalation', 'time_pressure', 'uncertainty'"],

  "conflictPresent": boolean,
  "conflictType": "internal" | "external" | "both" | "none",
  "conflictClarity": number (0-10 - how clear is the conflict?),
  "conflictComplexity": number (0-10 - simple vs nuanced?),
  "conflictDescription": "string - what is the core conflict?",
  "internalConflictExamples": ["array of internal struggle moments"],
  "externalConflictExamples": ["array of external obstacle moments"],

  "stakesPresent": boolean,
  "stakesClarity": number (0-10 - how clear are stakes?),
  "stakesEstablishedByPercent": number (at what % of essay are stakes clear?),
  "stakesSpecificity": "specific_concrete" | "somewhat_specific" | "vague_abstract" | "unclear",
  "stakesDescription": "string - what's at risk and why it matters",
  "personalCost": "string | null - what protagonist stands to lose",
  "externalConsequences": "string | null - impact beyond protagonist",

  "suspensePresent": boolean,
  "suspenseTechniques": ["array of techniques: e.g., 'questions_raised', 'obstacles_introduced', 'time_pressure'"],
  "outcomeUncertainty": number (0-10 - did reader wonder how it ends?),

  "resolutionPresent": boolean,
  "resolutionQuality": "earned_authentic" | "adequate" | "rushed_neat_bow" | "anticlimactic" | "unresolved",
  "resolutionDescription": "string - how conflict/tension resolves",
  "insightEarned": boolean,

  "readerInvestment": number (0-10 - will AO care about outcome?),
  "engagementFactors": ["array of what makes essay engaging"],
  "disengagementFactors": ["array of what reduces engagement"],

  "improvementSuggestions": ["array of specific suggestions"],
  "tokensUsed": number (estimated)
}

**Critical Detection Instructions**:

1. **Tension Assessment**:
   - Does essay maintain reader interest throughout?
   - Is there genuine uncertainty about outcome?
   - Does tension build, stay steady, or drop?
   - Techniques: Withholding info, escalating problem, time pressure, high stakes
   - RED FLAG: Smooth success story (no friction = no tension)

2. **Conflict Detection**:
   - INTERNAL: Look for doubt, fear, competing values, identity struggle
     * Markers: "I wondered if," "Should I," "Part of me wanted X, but," "I questioned"
   - EXTERNAL: Look for obstacles, failures, opposition, constraints
     * Markers: Specific barriers ("19% on quiz," "three votes against"), resource limits, time pressure
   - BOTH = elite: Most powerful essays have internal + external

3. **Stakes Establishment**:
   - ELITE: Stakes clear by 25% of essay
   - SPECIFIC: Concrete consequences ("six months wasted," "grant money," "three doubters")
   - PERSONAL: What protagonist stands to lose (time, reputation, opportunity, relationship)
   - EXTERNAL: Who/what else affected beyond protagonist
   - VAGUE: "Things might not work out" (too abstract - doesn't count)

4. **Suspense Techniques**:
   - Questions raised: "Would I succeed?" "Could I prove them wrong?"
   - Obstacles introduced: Specific barriers that seem insurmountable
   - Time pressure: Deadlines, urgency, "only one chance"
   - High stakes: Clear what happens if protagonist fails
   - NOT manufactured: Must feel organic to story

5. **Resolution Assessment**:
   - EARNED_AUTHENTIC: Problem addressed through protagonist's actions, insight feels genuine
   - ADEQUATE: Conflict resolved, satisfactory ending
   - RUSHED_NEAT_BOW: Too perfect, too quick, unrealistic transformation
   - ANTICLIMACTIC: Build-up doesn't pay off, fizzles out
   - UNRESOLVED: Story doesn't conclude, left hanging

6. **Reader Investment Factors**:
   - INCREASES investment: Personal stakes, specific details, vulnerability, relatable struggle, unique angle
   - DECREASES investment: Generic challenges, predictable arc, no real risk, vague stakes
   - AO perspective: Will admissions officer care what happens? Wonder how it ends?

Return ONLY valid JSON, no markdown, no explanation.`;
}
// ============================================================================
// ANALYSIS FUNCTION
// ============================================================================
/**
 * Analyze stakes and tension
 */
export async function analyzeStakesTension(input, essayType) {
    console.log('  → Stage 2.6: Stakes & Tension Analysis');
    const startTime = Date.now();
    try {
        const prompt = buildStakesTensionPrompt(input.essayText, essayType);
        const response = await callClaudeWithRetry(prompt, {
            systemPrompt: STAKES_TENSION_SYSTEM_PROMPT,
            temperature: 0.5,
            useJsonMode: true,
            maxTokens: 3000,
        });
        let analysis;
        if (typeof response.content === 'string') {
            const jsonMatch = response.content.match(/\{[\s\S]*\}/);
            if (!jsonMatch)
                throw new Error('No JSON found in stakes/tension response');
            analysis = JSON.parse(jsonMatch[0]);
        }
        else {
            analysis = response.content;
        }
        analysis.tokensUsed = response.usage?.total_tokens || 0;
        const duration = Date.now() - startTime;
        console.log(`     ✓ Stakes/tension analyzed (${duration}ms, ${analysis.tokensUsed} tokens)`);
        console.log(`       Tension: ${analysis.tensionPresent ? 'Yes' : 'No'} (level: ${analysis.tensionLevel}/10, pacing: ${analysis.tensionPacing})`);
        console.log(`       Conflict: ${analysis.conflictType} (clarity: ${analysis.conflictClarity}/10, complexity: ${analysis.conflictComplexity}/10)`);
        console.log(`       Stakes: ${analysis.stakesSpecificity} (established at ${analysis.stakesEstablishedByPercent}%)`);
        console.log(`       Reader investment: ${analysis.readerInvestment}/10`);
        console.log(`       Resolution: ${analysis.resolutionQuality}`);
        return analysis;
    }
    catch (error) {
        console.error('     ✗ Stakes/tension analysis failed:', error);
        throw error;
    }
}
// ============================================================================
// DETERMINISTIC STAKES/TENSION DETECTION
// ============================================================================
/**
 * Quick deterministic detection of stakes and tension (pre-LLM)
 */
export function analyzeStakesTensionDeterministic(essayText) {
    const text = essayText.toLowerCase();
    const words = essayText.split(/\s+/);
    const wordCount = words.length;
    // Check first 25% for stakes
    const first25Percent = words.slice(0, Math.floor(wordCount * 0.25)).join(' ').toLowerCase();
    // Internal conflict markers
    const internalConflictPatterns = [
        /\bi (wondered|questioned|doubted) (if|whether)\b/gi,
        /\bshould i\b/gi,
        /\bpart of me (wanted|thought|believed)\b/gi,
        /\bi (struggled|grappled) with\b/gi,
    ];
    let internalConflictCount = 0;
    internalConflictPatterns.forEach(pattern => {
        internalConflictCount += (text.match(pattern) || []).length;
    });
    // External conflict markers
    const externalConflictPatterns = [
        /\b(failed|struggled|challenged|difficult|impossible|obstacle|barrier)\b/gi,
        /\b(against|opposed|rejected|denied)\b/gi,
        /\b\d+%\b/gi, // Numbers often indicate obstacles (19% on quiz)
    ];
    let externalConflictCount = 0;
    externalConflictPatterns.forEach(pattern => {
        externalConflictCount += (text.match(pattern) || []).length;
    });
    const conflictMarkers = [];
    const conflictPattern = /\b(but|however|despite|although|yet|failed|struggled|obstacle)\b/gi;
    const matches = essayText.match(conflictPattern) || [];
    conflictMarkers.push(...matches.slice(0, 10)); // Top 10
    // Tension markers
    const tensionPatterns = [
        /\b(would|could|might) (i|it|this|they)\b/gi,
        /\bwhat if\b/gi,
        /\bonly (one|two|three) (chance|attempt|try)\b/gi,
        /\b(deadline|time|pressure|urgency|limited)\b/gi,
    ];
    const tensionMarkers = [];
    tensionPatterns.forEach(pattern => {
        const m = essayText.match(pattern) || [];
        tensionMarkers.push(...m);
    });
    // Suspense markers
    const suspensePatterns = [
        /\b(would i|could i|will i)\b/gi,
        /\bi didn'?t know (if|whether|how)\b/gi,
        /\buncertain\b/gi,
    ];
    const suspenseMarkers = [];
    suspensePatterns.forEach(pattern => {
        const m = essayText.match(pattern) || [];
        suspenseMarkers.push(...m);
    });
    // Stakes markers
    const stakesPatterns = [
        /\b(six months|grant money|research|reputation|opportunity)\b/gi,
        /\bif i (failed|didn'?t|couldn'?t)\b/gi,
        /\b(at risk|at stake|would lose|stood to lose)\b/gi,
    ];
    const stakesMarkers = [];
    stakesPatterns.forEach(pattern => {
        const m = first25Percent.match(pattern) || [];
        stakesMarkers.push(...m);
    });
    // Flags
    const flags = [];
    if (conflictMarkers.length === 0) {
        flags.push('CRITICAL: No conflict markers detected (essays need tension)');
    }
    if (internalConflictCount === 0 && externalConflictCount === 0) {
        flags.push('CRITICAL: No internal or external conflict detected');
    }
    else if (internalConflictCount === 0 || externalConflictCount === 0) {
        flags.push('MAJOR: Only one type of conflict (80% of elite essays have both internal + external)');
    }
    if (tensionMarkers.length === 0) {
        flags.push('MAJOR: No tension-building markers detected');
    }
    if (stakesMarkers.length === 0) {
        flags.push('MAJOR: No clear stakes established in first 25% (95% of elite essays establish early)');
    }
    // Check for "smooth success" pattern (red flag)
    const successWithoutStruggle = /\b(easily|smoothly|perfectly|immediately succeeded)\b/gi;
    if (successWithoutStruggle.test(text) && conflictMarkers.length < 3) {
        flags.push('CRITICAL: "Smooth success" pattern detected - no genuine struggle or tension');
    }
    return {
        conflictMarkers,
        internalConflictCount,
        externalConflictCount,
        tensionMarkers,
        suspenseMarkers,
        stakesMarkers,
        flags
    };
}
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
/**
 * Detect stakes establishment timing
 */
export function detectStakesEstablishment(essayText) {
    const words = essayText.split(/\s+/);
    const wordCount = words.length;
    // Check in 25% increments
    const checkpoints = [25, 50, 75, 100];
    for (const percent of checkpoints) {
        const endIndex = Math.floor(wordCount * (percent / 100));
        const section = words.slice(0, endIndex).join(' ').toLowerCase();
        const stakesPatterns = [
            /\b(at risk|at stake|would lose|stood to lose|if i failed)\b/i,
            /\b(grant money|research|reputation|opportunity|time|months|weeks)\b/i,
        ];
        for (const pattern of stakesPatterns) {
            if (pattern.test(section)) {
                return {
                    stakesPresent: true,
                    establishedByPercent: percent,
                    stakesDescription: null // LLM will extract details
                };
            }
        }
    }
    return {
        stakesPresent: false,
        establishedByPercent: 100,
        stakesDescription: null
    };
}
/**
 * Assess conflict type and complexity
 */
export function assessConflictType(essayText) {
    const text = essayText.toLowerCase();
    // Internal conflict indicators
    const internalPatterns = [
        /\bi (wondered|questioned|doubted) (if|whether)\b/i,
        /\bshould i\b/i,
        /\bpart of me\b/i,
    ];
    const hasInternal = internalPatterns.some(p => p.test(text));
    // External conflict indicators
    const externalPatterns = [
        /\b(failed|obstacle|barrier|rejected|denied|opposed)\b/i,
        /\b\d+%\b/i, // Specific numbers
    ];
    const hasExternal = externalPatterns.some(p => p.test(text));
    let conflictType;
    if (hasInternal && hasExternal)
        conflictType = 'both';
    else if (hasInternal)
        conflictType = 'internal';
    else if (hasExternal)
        conflictType = 'external';
    else
        conflictType = 'none';
    // Complexity heuristic
    let complexity;
    if (hasInternal && hasExternal)
        complexity = 'complex';
    else if (hasInternal || hasExternal)
        complexity = 'moderate';
    else
        complexity = 'simple';
    return {
        hasInternal,
        hasExternal,
        conflictType,
        complexity
    };
}
/**
 * Detect tension-building techniques
 */
export function detectTensionTechniques(essayText) {
    const text = essayText.toLowerCase();
    const techniques = [];
    // Uncertainty
    if (/\b(would|could|might) (i|it|this)\b/i.test(text) || /\bwhat if\b/i.test(text)) {
        techniques.push('uncertainty');
    }
    // Time pressure
    if (/\b(deadline|only .+ (days|hours|minutes|chance)|limited time|running out)\b/i.test(text)) {
        techniques.push('time_pressure');
    }
    // Obstacles
    if (/\b(obstacle|barrier|challenge|difficult|impossible)\b/i.test(text)) {
        techniques.push('obstacles');
    }
    // Withholding (harder to detect automatically)
    // Questions raised
    if (/\b(would i|could i|will i|can i)\b/i.test(text)) {
        techniques.push('questions_raised');
    }
    // Escalation (look for intensifying language)
    if (/\b(worse|even more|increasingly|escalated|intensified)\b/i.test(text)) {
        techniques.push('escalation');
    }
    let tensionLevel;
    if (techniques.length === 0)
        tensionLevel = 'none';
    else if (techniques.length === 1)
        tensionLevel = 'low';
    else if (techniques.length <= 3)
        tensionLevel = 'moderate';
    else
        tensionLevel = 'high';
    return {
        techniques,
        tensionLevel
    };
}
//# sourceMappingURL=stakesTensionAnalyzer.js.map