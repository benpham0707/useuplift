/**
 * Stage 2.5: Character Development Analysis Engine
 *
 * Deep dive analysis of protagonist characterization and voice authenticity.
 * Critical because: Strong character = clear voice + interiority + authentic growth.
 *
 * Focus Areas:
 * - Interiority presence (internal thoughts, feelings, reasoning)
 * - Voice authenticity (sounds like real person, age-appropriate, consistent)
 * - Character growth demonstration (before → after transformation)
 * - Dialogue usage and quality (reveals character, advances story)
 * - Emotion description (physical/sensory vs abstract/telling)
 * - Protagonist clarity (reader knows who narrator is)
 * - Agency level (active decision-maker vs passive observer)
 *
 * Elite Benchmarks (from 20 top essays):
 * - 90% demonstrate interiority through specific thoughts/reactions
 * - 75% use physical emotion descriptions ("clammy hands" vs "I felt nervous")
 * - Elite essays show growth through changed actions/perspectives
 * - Strong dialogue is sparse but meaningful (≤5% of essay)
 * - Top essays have distinctive voice (word choice, rhythm, perspective)
 * - Protagonist has clear identity markers within first 100 words
 *
 * LLM Configuration:
 * - Temperature: 0.5 (interpretive for voice/character nuance)
 * - Model: Sonnet 4.5
 * - Focus: Authenticity, interiority, voice consistency
 */
import { callClaudeWithRetry } from '@/lib/llm/claude';
// ============================================================================
// SYSTEM PROMPT
// ============================================================================
const CHARACTER_DEVELOPMENT_SYSTEM_PROMPT = `You are an expert college essay analyst specializing in character development and voice authenticity.

Your expertise: Evaluating protagonist characterization, interiority, and authentic voice based on analysis of elite essays from Harvard, Princeton, Stanford, MIT, Yale, and Berkeley.

Critical insights from 20 elite essays:

**Interiority** (90% of elite essays):
- Internal thoughts: "I wondered if...", "I thought...", "I questioned..."
- Emotional reactions: Physical descriptions of feelings
- Reasoning process: "If X, then Y", decision-making shown
- Self-awareness: Meta-commentary on own thinking
- NOT surface: "I felt happy" without showing how

**Voice Authenticity**:
- Distinctive word choice: Specific vocabulary, not generic
- Consistent perspective: First-person intimacy maintained
- Age-appropriate: Sounds like teenager, not adult resume
- Personality markers: Humor, earnestness, curiosity, intensity
- NOT formulaic: "This experience taught me" is robotic

**Character Growth**:
- ELITE: Changed action/behavior shown ("I used to X, now I Y")
- STRONG: Changed perspective articulated with evidence
- WEAK: Claimed growth without demonstration
- Elite essays show growth through contrast, not statement

**Emotion Description** (75% of elite essays use physical/sensory):
- ELITE: "Clammy hands," "stomach dropped," "throat tight," "pulse quickened"
- STRONG: Behavioral signs ("I paced," "I avoided eye contact")
- WEAK: Abstract labels ("I was nervous," "I felt anxious")
- Top essays make reader FEEL emotion, not just read about it

**Dialogue Usage**:
- Elite essays: ≤5% dialogue, highly selective
- Purpose: Reveals character, advances narrative, shows relationships
- NOT filler: Generic "How are you?" conversations
- Quality over quantity: One perfect line > paragraph of chat

**Protagonist Clarity**:
- Identity markers early: Age, context, role, personality hint
- Clear motivations: Reader understands why protagonist acts
- Consistent characterization: Actions align with personality
- NOT generic: Could swap in any student

**Agency**:
- ELITE: Active decision-maker ("I chose," "I decided," "I built")
- STRONG: Problem-solver showing initiative
- WEAK: Passive observer ("it happened," "I watched")
- Elite essays show protagonist driving narrative, not swept along

Your task: Analyze character development with elite-calibrated precision for authenticity and depth.

Return valid JSON matching the CharacterDevelopmentAnalysis type exactly.`;
// ============================================================================
// PROMPT BUILDER
// ============================================================================
function buildCharacterDevelopmentPrompt(essayText, essayType) {
    const wordCount = essayText.split(/\s+/).length;
    // Extract opening for protagonist establishment
    const words = essayText.split(/\s+/);
    const opening100 = words.slice(0, 100).join(' ');
    // Look for dialogue
    const hasDialogue = essayText.includes('"') || essayText.includes('\u2018') || essayText.includes('\u2019');
    const dialogueCount = (essayText.match(/["']/g) || []).length;
    return `Analyze the character development and voice authenticity of this essay.

**Full Essay**:
"""
${essayText}
"""

**Opening (first 100 words)**:
"""
${opening100}
"""

**Essay Type**: ${essayType}
**Word Count**: ${wordCount}
**Dialogue Present**: ${hasDialogue ? `Yes (${dialogueCount} quotation marks)` : 'No'}

---

Provide your analysis as valid JSON with these EXACT fields:

{
  "interiorityPresent": boolean,
  "interiorityDepth": number (0-10 - how much access to inner thoughts?),
  "interiorityExamples": ["array of quotes showing internal thoughts/reactions"],

  "voiceAuthenticity": number (0-10 - sounds like real person?),
  "voiceConsistency": number (0-10 - maintained throughout?),
  "voiceDistinctiveness": number (0-10 - memorable, unique voice?),
  "voiceCharacteristics": ["array of voice traits: e.g., 'earnest', 'witty', 'reflective', 'matter-of-fact'"],
  "ageAppropriate": boolean,

  "characterGrowthPresent": boolean,
  "growthDemonstrated": "shown_through_action" | "shown_through_perspective" | "claimed_not_shown" | "none",
  "beforeState": "string | null - how protagonist was before",
  "afterState": "string | null - how protagonist is after",
  "growthEvidence": ["array of specific evidence of transformation"],

  "emotionDescriptionType": "physical_sensory" | "behavioral" | "abstract_labels" | "mixed" | "minimal",
  "emotionExamples": [
    {
      "quote": "string - exact quote",
      "type": "physical" | "behavioral" | "abstract",
      "effectiveness": number (0-10)
    }
  ],

  "dialoguePresent": boolean,
  "dialogueQuality": number (0-10 - if present, how effective?),
  "dialoguePercentage": number (estimated % of essay),
  "dialoguePurpose": "reveals_character" | "advances_narrative" | "shows_relationships" | "filler" | "n/a",
  "dialogueExamples": ["array of dialogue quotes with context"],

  "protagonistClarity": number (0-10 - how well-defined is narrator?),
  "identityMarkers": ["array of details establishing protagonist identity"],
  "identityEstablishedByWord": number (word count when protagonist becomes clear),

  "agencyLevel": number (0-10 - active driver vs passive observer?),
  "agencyType": "decision_maker" | "problem_solver" | "observer" | "passive_recipient",
  "agencyExamples": ["array of moments showing agency or lack thereof"],

  "improvementSuggestions": ["array of specific suggestions"],
  "tokensUsed": number (estimated)
}

**Critical Detection Instructions**:

1. **Interiority Detection**:
   - Look for: "I wondered," "I thought," "I questioned," "I realized," "What if..."
   - Internal conflict: Competing thoughts/desires
   - Reasoning shown: "If I did X, then Y would happen"
   - Self-reflection: "Looking back, I see..."
   - Count instances, provide exact quotes

2. **Voice Authenticity Assessment**:
   - Distinctive vocabulary: Specific word choices, not generic
   - Sentence rhythm: Varied, natural, flows
   - Perspective consistency: Maintains first-person intimacy
   - Personality: Can you hear a specific person?
   - Age-appropriate: Sounds like 17-18 year old, not adult resume
   - RED FLAG: "This experience taught me" (formulaic adult voice)

3. **Growth Demonstration**:
   - SHOWN THROUGH ACTION: "I used to avoid X, now I seek it out"
   - SHOWN THROUGH PERSPECTIVE: Before thought Y, now understand Z
   - CLAIMED NOT SHOWN: "I grew as a person" (generic claim)
   - Evidence: Specific before/after contrast with details

4. **Emotion Description Quality**:
   - ELITE: Physical sensations ("clammy hands," "stomach dropped," "pulse quickened")
   - STRONG: Behavioral signs ("I paced," "I couldn't meet their eyes," "I gripped the table")
   - WEAK: Abstract labels ("I was nervous," "I felt anxious," "I was scared")
   - Count each type, assess overall approach

5. **Dialogue Assessment**:
   - Count quotation marks, estimate % of essay
   - Evaluate purpose: Does it reveal character or just fill space?
   - Quality markers: Distinctive voice, meaningful content, advances story
   - Elite benchmark: ≤5% of essay, highly selective

6. **Protagonist Clarity**:
   - When established: First 50 words? First 100? Later?
   - Identity markers: Age, role, context, personality hints
   - Motivations: Why does protagonist care/act?
   - Could you describe protagonist to someone? (If no = low clarity)

7. **Agency Detection**:
   - ACTIVE: "I chose," "I decided," "I built," "I confronted," "I initiated"
   - PROBLEM-SOLVING: "I figured out," "I tried," "I experimented"
   - PASSIVE: "it happened," "I was given," "I was told," "I watched"
   - Count active vs passive moments

Return ONLY valid JSON, no markdown, no explanation.`;
}
// ============================================================================
// ANALYSIS FUNCTION
// ============================================================================
/**
 * Analyze character development and voice authenticity
 */
export async function analyzeCharacterDevelopment(input, essayType) {
    console.log('  → Stage 2.5: Character Development Analysis');
    const startTime = Date.now();
    try {
        const prompt = buildCharacterDevelopmentPrompt(input.essayText, essayType);
        const response = await callClaudeWithRetry(prompt, {
            systemPrompt: CHARACTER_DEVELOPMENT_SYSTEM_PROMPT,
            temperature: 0.5,
            useJsonMode: true,
            maxTokens: 8000,
        });
        let analysis;
        if (typeof response.content === 'string') {
            const jsonMatch = response.content.match(/\{[\s\S]*\}/);
            if (!jsonMatch)
                throw new Error('No JSON found in character development response');
            analysis = JSON.parse(jsonMatch[0]);
        }
        else {
            analysis = response.content;
        }
        analysis.tokensUsed = response.usage?.total_tokens || 0;
        const duration = Date.now() - startTime;
        console.log(`     ✓ Character development analyzed (${duration}ms, ${analysis.tokensUsed} tokens)`);
        console.log(`       Interiority: ${analysis.interiorityPresent ? 'Yes' : 'No'} (depth: ${analysis.interiorityDepth}/10)`);
        console.log(`       Voice authenticity: ${analysis.voiceAuthenticity}/10, Distinctiveness: ${analysis.voiceDistinctiveness}/10`);
        console.log(`       Growth: ${analysis.growthDemonstrated}`);
        console.log(`       Emotion type: ${analysis.emotionDescriptionType}`);
        console.log(`       Agency: ${analysis.agencyType} (level: ${analysis.agencyLevel}/10)`);
        return analysis;
    }
    catch (error) {
        console.error('     ✗ Character development analysis failed:', error);
        throw error;
    }
}
// ============================================================================
// DETERMINISTIC CHARACTER ANALYSIS
// ============================================================================
/**
 * Quick deterministic analysis of character development (pre-LLM)
 */
export function analyzeCharacterDeterministic(essayText) {
    const text = essayText.toLowerCase();
    const words = essayText.split(/\s+/);
    const wordCount = words.length;
    // Interiority markers
    const interiorityPatterns = [
        /\bi (wondered|thought|questioned|realized|believed|assumed|imagined)\b/gi,
        /\bwhat if\b/gi,
        /\bi asked myself\b/gi,
        /\bin my mind\b/gi,
    ];
    const interiorityMarkers = [];
    interiorityPatterns.forEach(pattern => {
        const matches = essayText.match(pattern) || [];
        interiorityMarkers.push(...matches);
    });
    // Physical emotion descriptions
    const physicalEmotionPatterns = [
        /\b(clammy|sweaty|shaking|trembling) (hands|fingers|voice)\b/gi,
        /\b(stomach|heart) (dropped|sank|pounded|raced|churned)\b/gi,
        /\bpulse (quickened|raced)\b/gi,
        /\bthroat (tight|constricted)\b/gi,
        /\b(cheeks|face) (flushed|burned|reddened)\b/gi,
    ];
    let physicalEmotionCount = 0;
    physicalEmotionPatterns.forEach(pattern => {
        const matches = text.match(pattern) || [];
        physicalEmotionCount += matches.length;
    });
    // Abstract emotion labels
    const abstractEmotionPatterns = [
        /\bi (felt|was) (nervous|anxious|scared|happy|sad|excited|worried|stressed)\b/gi,
        /\bi (felt|was) (a sense of|filled with)\b/gi,
    ];
    let abstractEmotionCount = 0;
    abstractEmotionPatterns.forEach(pattern => {
        const matches = text.match(pattern) || [];
        abstractEmotionCount += matches.length;
    });
    // Dialogue percentage
    const dialogueMarks = (essayText.match(/["''""]/g) || []).length;
    const dialoguePercentage = Math.round((dialogueMarks / wordCount) * 100 * 10) / 10; // Rough estimate
    // Active verbs (agency)
    const activeVerbs = [
        /\bi (chose|decided|built|created|initiated|launched|organized|led|designed|confronted|challenged)\b/gi,
        /\bi (figured out|solved|tried|experimented|tested|explored)\b/gi,
    ];
    let activeVerbCount = 0;
    activeVerbs.forEach(pattern => {
        const matches = text.match(pattern) || [];
        activeVerbCount += matches.length;
    });
    // Passive constructions
    const passivePatterns = [
        /\bi (was given|was told|was taught|was shown|was selected)\b/gi,
        /\bit happened\b/gi,
        /\bi watched\b/gi,
    ];
    let passiveConstructionCount = 0;
    passivePatterns.forEach(pattern => {
        const matches = text.match(pattern) || [];
        passiveConstructionCount += matches.length;
    });
    // Flags
    const flags = [];
    if (interiorityMarkers.length === 0) {
        flags.push('CRITICAL: No interiority markers detected (90% of elite essays have this)');
    }
    else if (interiorityMarkers.length < 2) {
        flags.push('MAJOR: Limited interiority (fewer than 2 internal thought markers)');
    }
    if (physicalEmotionCount === 0 && abstractEmotionCount > 0) {
        flags.push('MAJOR: Only abstract emotion labels, no physical descriptions (75% of elite essays use physical)');
    }
    if (abstractEmotionCount >= 3) {
        flags.push(`MAJOR: High use of abstract emotion labels (${abstractEmotionCount} instances of "I felt/was [emotion]")`);
    }
    if (dialoguePercentage > 10) {
        flags.push(`MAJOR: High dialogue percentage (~${dialoguePercentage}% - elite essays use ≤5%)`);
    }
    if (activeVerbCount === 0 && passiveConstructionCount > 0) {
        flags.push('CRITICAL: No active agency verbs, only passive constructions');
    }
    else if (passiveConstructionCount > activeVerbCount * 2) {
        flags.push('MAJOR: Passive constructions outnumber active agency (2:1 ratio)');
    }
    // Check for formulaic voice
    const formulaicPhrases = text.match(/\b(this experience taught me|helped me grow|changed my life|found my passion)\b/gi) || [];
    if (formulaicPhrases.length > 0) {
        flags.push(`CRITICAL: ${formulaicPhrases.length} formulaic phrase(s) detected - sounds robotic, not authentic`);
    }
    return {
        interiorityMarkers,
        physicalEmotionCount,
        abstractEmotionCount,
        dialoguePercentage,
        activeVerbCount,
        passiveConstructionCount,
        flags
    };
}
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
/**
 * Detect interiority presence
 */
export function detectInteriority(essayText) {
    const text = essayText.toLowerCase();
    const patterns = [
        /\bi (wondered|thought|questioned|realized|believed|assumed|imagined)\b/gi,
        /\bwhat if\b/gi,
        /\bi asked myself\b/gi,
    ];
    const markers = [];
    patterns.forEach(pattern => {
        const matches = essayText.match(pattern) || [];
        markers.push(...matches);
    });
    const count = markers.length;
    let depth;
    if (count === 0)
        depth = 'none';
    else if (count < 2)
        depth = 'minimal';
    else if (count < 5)
        depth = 'moderate';
    else
        depth = 'deep';
    return {
        present: count > 0,
        markers,
        depth
    };
}
/**
 * Detect emotion description style
 */
export function detectEmotionStyle(essayText) {
    const text = essayText.toLowerCase();
    // Physical sensations
    const physicalPatterns = [
        /\b(clammy|sweaty|shaking|trembling) (hands|fingers|voice)\b/gi,
        /\b(stomach|heart) (dropped|sank|pounded|raced)\b/gi,
        /\bpulse (quickened|raced)\b/gi,
    ];
    let physicalCount = 0;
    physicalPatterns.forEach(pattern => {
        physicalCount += (text.match(pattern) || []).length;
    });
    // Behavioral
    const behavioralPatterns = [
        /\bi (paced|avoided|gripped|clenched|fidgeted)\b/gi,
        /\bi couldn'?t (meet|look|make) (eye contact|their eyes)\b/gi,
    ];
    let behavioralCount = 0;
    behavioralPatterns.forEach(pattern => {
        behavioralCount += (text.match(pattern) || []).length;
    });
    // Abstract labels
    const abstractPatterns = [
        /\bi (felt|was) (nervous|anxious|scared|happy|sad|excited)\b/gi,
    ];
    let abstractCount = 0;
    abstractPatterns.forEach(pattern => {
        abstractCount += (text.match(pattern) || []).length;
    });
    const total = physicalCount + behavioralCount + abstractCount;
    let dominantStyle;
    if (total === 0) {
        dominantStyle = 'minimal';
    }
    else if (physicalCount > behavioralCount && physicalCount > abstractCount) {
        dominantStyle = 'physical';
    }
    else if (behavioralCount > abstractCount) {
        dominantStyle = 'behavioral';
    }
    else if (abstractCount > physicalCount + behavioralCount) {
        dominantStyle = 'abstract';
    }
    else {
        dominantStyle = 'mixed';
    }
    return {
        physicalCount,
        behavioralCount,
        abstractCount,
        dominantStyle
    };
}
/**
 * Detect dialogue usage
 */
export function detectDialogue(essayText) {
    const words = essayText.split(/\s+/);
    const quoteMatches = essayText.match(/["''""]/g) || [];
    const quoteCount = quoteMatches.length;
    // Rough estimate: each pair of quotes = ~10 words of dialogue
    const estimatedDialogueWords = (quoteCount / 2) * 10;
    const estimatedPercentage = Math.round((estimatedDialogueWords / words.length) * 100);
    return {
        present: quoteCount > 0,
        estimatedPercentage,
        quoteCount
    };
}
/**
 * Assess protagonist clarity
 */
export function assessProtagonistClarity(essayText) {
    const words = essayText.split(/\s+/);
    const first100 = words.slice(0, 100).join(' ').toLowerCase();
    const fullText = essayText.toLowerCase();
    // Look for identity markers
    const markers = [];
    // Age indicators
    if (/\b(junior|senior|sophomore|freshman|high school|16|17|18|grade)\b/i.test(fullText)) {
        markers.push('age_context');
    }
    // Role indicators
    if (/\b(student|captain|president|member|volunteer|researcher)\b/i.test(fullText)) {
        markers.push('role');
    }
    // Personal details
    if (/\b(my|i'm|i am|as a)\b/i.test(fullText)) {
        markers.push('first_person_established');
    }
    const establishedEarly = markers.length > 0 && /\b(i|my)\b/i.test(first100);
    let clarity;
    if (markers.length >= 2 && establishedEarly)
        clarity = 'clear';
    else if (markers.length >= 1)
        clarity = 'moderate';
    else
        clarity = 'vague';
    return {
        identityMarkersFound: markers,
        establishedEarly,
        clarity
    };
}
//# sourceMappingURL=characterDevelopmentAnalyzer.js.map