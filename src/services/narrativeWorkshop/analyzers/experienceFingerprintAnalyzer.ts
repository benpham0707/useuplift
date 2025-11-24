/**
 * Experience Fingerprint Analyzer
 *
 * This analyzer extracts what is UNIQUELY THIS PERSON about their experience.
 * It goes beyond voice (how they write) to capture the essence of their story
 * (what makes their experience irreplaceable).
 *
 * Philosophy:
 * - AI tends toward convergence (similar structures, safe insights, crowd-pleasing beats)
 * - We actively RESIST this by identifying what's DIVERGENT about each student
 * - The fingerprint becomes a "requirement spec" that suggestions MUST incorporate
 *
 * Anti-Pattern Detection:
 * - Flags if the experience follows the typical "setup → struggle → triumph → lesson" arc
 * - Identifies when insights feel generic vs. genuinely personal
 * - Detects manufactured emotional beats vs. authentic ones
 */

import { callClaudeWithRetry } from '@/lib/llm/claude';
import { HolisticUnderstanding, VoiceFingerprint } from '../types';

// ============================================================================
// EXPERIENCE FINGERPRINT INTERFACE
// ============================================================================

export interface ExperienceFingerprint {
  // Core Uniqueness Elements
  unusualCircumstance: {
    description: string;           // "Did this in rural Alaska, not Silicon Valley"
    whyItMatters: string;          // "Lack of resources forced creative problem-solving"
    specificDetail: string;        // "The nearest hardware store was a 3-hour drive"
  } | null;

  unexpectedEmotion: {
    emotion: string;               // "relief" instead of expected "pride"
    trigger: string;               // "when I failed the first prototype"
    counterExpectation: string;    // "Most would feel defeated, I felt free to try something wild"
  } | null;

  contraryInsight: {
    insight: string;               // "Quitting was the right choice"
    againstWhat: string;           // "Against the 'never give up' narrative"
    whyAuthentic: string;          // "Recognizing when to pivot showed maturity, not weakness"
  } | null;

  specificSensoryAnchor: {
    sensory: string;               // "The smell of burnt solder"
    context: string;               // "Late nights in the garage"
    emotionalWeight: string;       // "That smell now means possibility to me"
  } | null;

  uniqueRelationship: {
    person: string;                // "My grandmother who doesn't speak English"
    dynamic: string;               // "She taught me coding through gestures and patience"
    unexpectedAspect: string;      // "She understood recursion before I could explain it in words"
  } | null;

  culturalSpecificity: {
    element: string;               // "Vietnamese funeral traditions"
    connection: string;            // "How honoring ancestors shaped my view of legacy"
    universalBridge: string;       // "Connects to why I build things meant to outlast me"
  } | null;

  // Anti-Convergence Markers
  antiPatternFlags: {
    followsTypicalArc: boolean;    // setup → struggle → triumph → lesson
    hasGenericInsight: boolean;    // "I learned the value of hard work"
    hasManufacturedBeat: boolean;  // Emotional moment that feels staged
    hasCrowdPleaser: boolean;      // Safe insight everyone would agree with
    warnings: string[];            // Specific warnings about convergence risks
  };

  // Divergence Requirements (What MUST be in any suggestion)
  divergenceRequirements: {
    mustInclude: string[];         // Elements that make this irreplaceable
    mustAvoid: string[];           // Generic patterns this essay is at risk for
    uniqueAngle: string;           // The ONE perspective only this person has
    authenticTension: string;      // The real internal conflict (not manufactured)
  };

  // Quality Anchors (Sentences that ARE working and must not be homogenized)
  qualityAnchors: {
    sentence: string;
    whyItWorks: string;
    preservationPriority: 'critical' | 'high' | 'medium';
  }[];

  // Metadata
  confidenceScore: number;         // 0-100, how confident are we in this fingerprint?
  extractedAt: string;
}

// ============================================================================
// SYSTEM PROMPT - EXPERIENCE FINGERPRINT EXTRACTION
// ============================================================================

const EXPERIENCE_FINGERPRINT_SYSTEM_PROMPT = `You are an expert at identifying what makes a person's experience IRREPLACEABLE and UNIQUELY THEIRS.

**YOUR MISSION:**
Extract the elements of this essay that NO OTHER STUDENT could have written. We're not looking for "good" writing - we're looking for what's SINGULAR about this person's story.

**WHY THIS MATTERS:**
AI naturally converges toward:
- Similar narrative structures (setup → struggle → triumph → lesson)
- "Safe" phrasings that feel polished but generic
- Crowd-pleasing insights that lack edge
- Manufactured emotional beats

Your job is to IDENTIFY AND PROTECT what's DIVERGENT about this essay.

**WHAT TO EXTRACT:**

1. **Unusual Circumstance** - What's different about the CONTEXT of their experience?
   - Not: "I worked on a robotics project" (anyone could say this)
   - Yes: "I built robots in my basement in rural Montana, 200 miles from the nearest maker space"
   - Look for: geography, resources, timing, constraints that are unusual

2. **Unexpected Emotion** - What did they feel that SURPRISES?
   - Not: "I felt proud when I succeeded" (expected)
   - Yes: "I felt grief when my project worked - I'd grown attached to the broken version"
   - Look for: emotions that run counter to what you'd expect

3. **Contrary Insight** - What did they learn that goes AGAINST conventional wisdom?
   - Not: "I learned that hard work pays off" (everyone says this)
   - Yes: "I learned that my obsession was a problem, not a virtue"
   - Look for: conclusions that might make some readers uncomfortable

4. **Specific Sensory Anchor** - What physical detail ONLY they would remember?
   - Not: "The lab smelled like chemicals" (generic)
   - Yes: "The specific click of the 3D printer finishing - I could identify ours by sound"
   - Look for: details that reveal intimate familiarity

5. **Unique Relationship Dynamic** - What's unusual about a key relationship?
   - Not: "My mentor believed in me" (standard narrative)
   - Yes: "My mentor and I communicated mostly in memes - our serious conversations happened in absurdity"
   - Look for: relationship dynamics that subvert expectations

6. **Cultural Specificity** - What cultural element is THEIRS specifically?
   - Not: "My immigrant parents valued education" (overused)
   - Yes: "In my family, we measure time by which relative's restaurant we were working at"
   - Look for: cultural details that feel lived, not performed

**ANTI-CONVERGENCE FLAGS - BE STRICT:**
Flag TRUE if you detect these patterns - err on the side of flagging:

- followsTypicalArc: TRUE if story follows setup → struggle → triumph → lesson. Most essays do this.
  EXAMPLES that should be TRUE:
  - "I struggled but persevered and won"
  - "I failed, learned, and succeeded"
  - Any arc that ends with neat resolution

- hasGenericInsight: TRUE if the lesson could appear in any essay. Most essays have this.
  EXAMPLES that should be TRUE:
  - "I learned hard work pays off"
  - "The journey matters more than the destination"
  - "Failure is a stepping stone to success"
  - "I discovered the importance of teamwork"

- hasManufacturedBeat: TRUE if an emotional moment feels staged for effect
  EXAMPLES that should be TRUE:
  - Crying moment that's too perfectly placed
  - Convenient epiphany at the right moment
  - Emotional resolution that wraps up too neatly

- hasCrowdPleaser: TRUE if insight is designed to make readers nod, not think
  EXAMPLES that should be TRUE:
  - Any conclusion most people would agree with
  - Safe observations about hard work, passion, or growth
  - Anything that avoids uncomfortable truths

**DIVERGENCE REQUIREMENTS:**
Based on what you find, specify:
- mustInclude: Elements that ANY suggestion must preserve (the irreplaceable parts)
- mustAvoid: Generic patterns this essay is at risk of falling into
- uniqueAngle: The ONE perspective only this person could have
- authenticTension: The REAL internal conflict (not the convenient one)

**QUALITY ANCHORS:**
Identify 2-4 sentences that are ALREADY WORKING - that capture this person's unique voice and shouldn't be touched or homogenized.

**OUTPUT FORMAT:**
Return a JSON object matching the ExperienceFingerprint interface. If you can't find a particular element, return null for that field - don't invent one.

Be HONEST about what's unique and what's generic. A fingerprint that flags generic patterns is more valuable than one that pretends everything is special.`;

// ============================================================================
// PROMPT BUILDER
// ============================================================================

function buildExperienceFingerprintPrompt(
  essayText: string,
  voiceFingerprint?: VoiceFingerprint,
  holistic?: HolisticUnderstanding
): string {
  let context = '';

  if (voiceFingerprint) {
    context += `\n**VOICE CONTEXT (Already Analyzed):**
- Tone: ${voiceFingerprint.tone}
- Cadence: ${voiceFingerprint.cadence}
- Voice Markers: ${voiceFingerprint.markers.join(', ')}

`;
  }

  if (holistic) {
    context += `**NARRATIVE CONTEXT:**
- Central Theme: ${holistic.centralTheme}
- Narrative Thread: ${holistic.narrativeThread}
- Primary Voice: ${holistic.primaryVoice}
- Authenticity Signals: ${holistic.authenticitySignals.join(', ')}
- Red Flags: ${holistic.redFlags.join(', ')}

`;
  }

  return `Analyze this essay and extract what makes this experience IRREPLACEABLE and UNIQUELY THIS PERSON'S.

${context}**ESSAY TEXT:**
"""
${essayText}
"""

**TASK:**
1. Identify what's UNUSUAL about their circumstance, emotions, insights, relationships
2. Flag any convergence patterns (generic arcs, safe insights, manufactured beats)
3. Specify what MUST be preserved vs. what's at risk of becoming generic
4. Identify sentences that are already working as quality anchors

Return ONLY a JSON object matching the ExperienceFingerprint interface.`;
}

// ============================================================================
// ANALYZER FUNCTION
// ============================================================================

export async function analyzeExperienceFingerprint(
  essayText: string,
  voiceFingerprint?: VoiceFingerprint,
  holistic?: HolisticUnderstanding
): Promise<ExperienceFingerprint> {
  console.log('🔬 Extracting Experience Fingerprint...');
  const startTime = Date.now();

  try {
    const prompt = buildExperienceFingerprintPrompt(essayText, voiceFingerprint, holistic);

    const response = await callClaudeWithRetry(prompt, {
      systemPrompt: EXPERIENCE_FINGERPRINT_SYSTEM_PROMPT,
      temperature: 0.3, // Slightly higher for nuanced extraction
      useJsonMode: true,
      maxTokens: 2000,
    });

    let fingerprint: ExperienceFingerprint;

    if (typeof response.content === 'string') {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in response');
      }
      fingerprint = JSON.parse(jsonMatch[0]);
    } else if (typeof response.content === 'object') {
      fingerprint = response.content as ExperienceFingerprint;
    } else {
      throw new Error('Unexpected response format');
    }

    // Normalize the fingerprint structure to ensure all fields exist
    fingerprint = normalizeFingerprint(fingerprint);

    // Add metadata
    fingerprint.extractedAt = new Date().toISOString();

    const duration = Date.now() - startTime;
    console.log(`✅ Experience Fingerprint extracted (${duration}ms)`);

    // Log key findings (with safe access)
    if (fingerprint.unusualCircumstance?.description) {
      console.log(`   Unusual Circumstance: ${fingerprint.unusualCircumstance.description.substring(0, 50)}...`);
    }
    if (fingerprint.contraryInsight?.insight) {
      console.log(`   Contrary Insight: ${fingerprint.contraryInsight.insight.substring(0, 50)}...`);
    }

    // Log anti-pattern warnings (with safe access)
    const flags = fingerprint.antiPatternFlags || {};
    const warnings: string[] = [];
    if (flags.followsTypicalArc) warnings.push('typical-arc');
    if (flags.hasGenericInsight) warnings.push('generic-insight');
    if (flags.hasManufacturedBeat) warnings.push('manufactured-beat');
    if (flags.hasCrowdPleaser) warnings.push('crowd-pleaser');

    if (warnings.length > 0) {
      console.log(`   ⚠️ Convergence risks detected: ${warnings.join(', ')}`);
    } else {
      console.log(`   ✅ Strong divergence - experience feels unique`);
    }

    return fingerprint;

  } catch (error) {
    console.error('❌ Error extracting Experience Fingerprint:', error);
    // Return a minimal fallback that flags the need for human review
    return createFallbackFingerprint();
  }
}

// ============================================================================
// FALLBACK
// ============================================================================

/**
 * Normalize the fingerprint to ensure all expected fields exist
 * This handles variations in LLM output structure
 */
function normalizeFingerprint(raw: any): ExperienceFingerprint {
  return {
    unusualCircumstance: raw.unusualCircumstance || raw.unusual_circumstance || null,
    unexpectedEmotion: raw.unexpectedEmotion || raw.unexpected_emotion || null,
    contraryInsight: raw.contraryInsight || raw.contrary_insight || null,
    specificSensoryAnchor: raw.specificSensoryAnchor || raw.specific_sensory_anchor || null,
    uniqueRelationship: raw.uniqueRelationship || raw.unique_relationship || null,
    culturalSpecificity: raw.culturalSpecificity || raw.cultural_specificity || null,
    antiPatternFlags: {
      followsTypicalArc: raw.antiPatternFlags?.followsTypicalArc ?? raw.antiPatternFlags?.follows_typical_arc ?? false,
      hasGenericInsight: raw.antiPatternFlags?.hasGenericInsight ?? raw.antiPatternFlags?.has_generic_insight ?? false,
      hasManufacturedBeat: raw.antiPatternFlags?.hasManufacturedBeat ?? raw.antiPatternFlags?.has_manufactured_beat ?? false,
      hasCrowdPleaser: raw.antiPatternFlags?.hasCrowdPleaser ?? raw.antiPatternFlags?.has_crowd_pleaser ?? false,
      warnings: raw.antiPatternFlags?.warnings || []
    },
    divergenceRequirements: {
      mustInclude: raw.divergenceRequirements?.mustInclude || raw.divergenceRequirements?.must_include || [],
      mustAvoid: raw.divergenceRequirements?.mustAvoid || raw.divergenceRequirements?.must_avoid || [],
      uniqueAngle: raw.divergenceRequirements?.uniqueAngle || raw.divergenceRequirements?.unique_angle || '',
      authenticTension: raw.divergenceRequirements?.authenticTension || raw.divergenceRequirements?.authentic_tension || ''
    },
    qualityAnchors: raw.qualityAnchors || raw.quality_anchors || [],
    confidenceScore: raw.confidenceScore ?? raw.confidence_score ?? 50,
    extractedAt: raw.extractedAt || new Date().toISOString()
  };
}

function createFallbackFingerprint(): ExperienceFingerprint {
  return {
    unusualCircumstance: null,
    unexpectedEmotion: null,
    contraryInsight: null,
    specificSensoryAnchor: null,
    uniqueRelationship: null,
    culturalSpecificity: null,
    antiPatternFlags: {
      followsTypicalArc: false,
      hasGenericInsight: false,
      hasManufacturedBeat: false,
      hasCrowdPleaser: false,
      warnings: ['Unable to analyze - manual review recommended']
    },
    divergenceRequirements: {
      mustInclude: [],
      mustAvoid: [],
      uniqueAngle: 'Unable to determine - manual review recommended',
      authenticTension: 'Unable to determine - manual review recommended'
    },
    qualityAnchors: [],
    confidenceScore: 0,
    extractedAt: new Date().toISOString()
  };
}

// ============================================================================
// HELPER: BUILD DIVERGENCE CONSTRAINTS FOR SURGICAL EDITOR
// ============================================================================

/**
 * Converts an Experience Fingerprint into constraints for the Surgical Editor
 * This ensures suggestions incorporate the unique elements and avoid convergence
 */
export function buildDivergenceConstraints(fingerprint: ExperienceFingerprint): string {
  const constraints: string[] = [];

  // Add must-include requirements
  if (fingerprint.divergenceRequirements.mustInclude.length > 0) {
    constraints.push(`**MUST INCORPORATE (Non-negotiable unique elements):**`);
    fingerprint.divergenceRequirements.mustInclude.forEach((item, i) => {
      constraints.push(`${i + 1}. ${item}`);
    });
    constraints.push('');
  }

  // Add must-avoid patterns
  if (fingerprint.divergenceRequirements.mustAvoid.length > 0) {
    constraints.push(`**MUST AVOID (Convergence risks for this essay):**`);
    fingerprint.divergenceRequirements.mustAvoid.forEach((item, i) => {
      constraints.push(`${i + 1}. ${item}`);
    });
    constraints.push('');
  }

  // Add the unique angle
  if (fingerprint.divergenceRequirements.uniqueAngle) {
    constraints.push(`**THE UNIQUE ANGLE (Only this person could say):**`);
    constraints.push(fingerprint.divergenceRequirements.uniqueAngle);
    constraints.push('');
  }

  // Add the authentic tension
  if (fingerprint.divergenceRequirements.authenticTension) {
    constraints.push(`**THE REAL TENSION (Not the convenient narrative):**`);
    constraints.push(fingerprint.divergenceRequirements.authenticTension);
    constraints.push('');
  }

  // Add anti-pattern warnings
  const flags = fingerprint.antiPatternFlags;
  const activeWarnings: string[] = [];
  if (flags.followsTypicalArc) activeWarnings.push('AVOID reinforcing the setup→struggle→triumph→lesson arc');
  if (flags.hasGenericInsight) activeWarnings.push('AVOID generic "lessons learned" - push for uncomfortable truths');
  if (flags.hasManufacturedBeat) activeWarnings.push('AVOID manufactured emotional beats - find real vulnerability');
  if (flags.hasCrowdPleaser) activeWarnings.push('AVOID crowd-pleasing insights - find what makes readers think');

  if (activeWarnings.length > 0) {
    constraints.push(`**ANTI-CONVERGENCE WARNINGS:**`);
    activeWarnings.forEach(w => constraints.push(`- ${w}`));
    constraints.push('');
  }

  // Add quality anchors to preserve
  if (fingerprint.qualityAnchors.length > 0) {
    constraints.push(`**SENTENCES TO PRESERVE (Already working):**`);
    fingerprint.qualityAnchors
      .filter(a => a.preservationPriority === 'critical' || a.preservationPriority === 'high')
      .forEach(anchor => {
        constraints.push(`- "${anchor.sentence.substring(0, 80)}..." → ${anchor.whyItWorks}`);
      });
    constraints.push('');
  }

  // Add specific unique elements to incorporate
  const uniqueElements: string[] = [];
  if (fingerprint.unusualCircumstance) {
    uniqueElements.push(`Unusual context: ${fingerprint.unusualCircumstance.description}`);
  }
  if (fingerprint.unexpectedEmotion) {
    uniqueElements.push(`Unexpected emotion: ${fingerprint.unexpectedEmotion.emotion} (${fingerprint.unexpectedEmotion.counterExpectation})`);
  }
  if (fingerprint.contraryInsight) {
    uniqueElements.push(`Contrary insight: ${fingerprint.contraryInsight.insight}`);
  }
  if (fingerprint.specificSensoryAnchor) {
    uniqueElements.push(`Sensory anchor: ${fingerprint.specificSensoryAnchor.sensory}`);
  }
  if (fingerprint.uniqueRelationship) {
    uniqueElements.push(`Unique relationship: ${fingerprint.uniqueRelationship.dynamic}`);
  }
  if (fingerprint.culturalSpecificity) {
    uniqueElements.push(`Cultural element: ${fingerprint.culturalSpecificity.element}`);
  }

  if (uniqueElements.length > 0) {
    constraints.push(`**UNIQUE ELEMENTS TO BUILD ON:**`);
    uniqueElements.forEach(e => constraints.push(`- ${e}`));
  }

  return constraints.join('\n');
}

// ============================================================================
// EXPORTS
// ============================================================================

export { ExperienceFingerprint };
