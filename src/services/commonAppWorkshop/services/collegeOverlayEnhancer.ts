/**
 * College Overlay Enhancer
 *
 * **PURPOSE**: Enhance already-excellent universal suggestions with college-specific context.
 *
 * **CRITICAL ARCHITECTURE PRINCIPLE**:
 * This service ENHANCES, not REGENERATES.
 *
 * Input: High-quality universal suggestions from Stage 2A
 * Output: SAME suggestions + college-specific annotations (red/green flags, enhanced rationale)
 *
 * **What This Does**:
 * 1. PRESERVES universal suggestion text exactly (100% preservation)
 * 2. DETECTS red flags in universal suggestions (warn, don't change)
 * 3. IDENTIFIES green flags demonstrated (highlight strengths)
 * 4. ENHANCES rationale with college-specific context
 * 5. ADDS rubric band guidance and Socratic questions
 *
 * **What This Does NOT Do**:
 * - Regenerate suggestion text
 * - Change voice or style
 * - Fabricate new details
 * - Alter thematic connections
 * - Redo universal quality work
 *
 * **Quality Guarantee**:
 * If preservation rate < 100%, this is a BUG that must be fixed immediately.
 */

import Anthropic from '@anthropic-ai/sdk';
import { parseClaudeJSON } from '../utils/jsonParser';
import type { CollegeResearch } from '../types/collegeResearch';
import type {
  PolishedOriginalSuggestion,
  VoiceAmplifierSuggestion,
  IssueSuggestion
} from './typeSpecificSuggestionService';
import { redFlagMatcher } from './redFlagMatcher';
import { greenFlagAmplifier } from './greenFlagAmplifier';
import { promptRubricInjector } from './promptRubricInjector';
import { socraticQuestionMatcher } from './socraticQuestionMatcher';
import { multiLayerEnhancementService, type MultiLayerEnhancementOutput, type EnhancementLayer } from './multiLayerEnhancementService';

// ============================================================================
// TYPES
// ============================================================================

interface EnhancementInput {
  universal_suggestion: PolishedOriginalSuggestion | VoiceAmplifierSuggestion;
  college: CollegeResearch;
  promptId?: string;
  issue_diagnosis: string; // For matching Socratic questions
  weak_dimensions: string[]; // For Socratic targeting
}

interface SurgicalChange {
  location: string;
  original: string;
  enhanced: string;
  reason: string;
}

interface TargetedEnhancementResult {
  enhanced_text: string;
  enhanced_rationale: string;
  changes_made: SurgicalChange[];
  preservation_check: {
    voice_preserved: boolean;
    core_message_preserved: boolean;
    quality_improved: boolean;
  };
}

interface EnhancementOutput {
  text: string; // ENHANCED with surgical changes (or unchanged if validation fails)
  rationale: string; // Enhanced with college context
  overlay_warnings: string[]; // Red flags detected
  green_flag_highlights: string[]; // Values demonstrated
  rubric_band_note: string | null; // Current → Target guidance
  socratic_questions: string[]; // Matched questions
  // NEW Phase 2 fields
  changes_made: SurgicalChange[]; // Tracked changes for transparency
  validation_result: EnhancementValidation | null; // Validation outcome
  // NEW Multi-Layer Enhancement fields
  multi_layer_enhancement?: {
    layers_applied: EnhancementLayer[];
    total_layers_applied: number;
    enhancement_type: string;
    value_alignment_detected: string[];
  };
}

interface EnhancementValidation {
  passed: boolean;
  use_enhanced: boolean;
  fallback_to_universal: boolean;
  reasons: {
    voice_preserved: boolean;
    core_message_preserved: boolean;
    quality_improved: boolean;
    specifics_added: boolean;
  };
}

interface PreservationValidation {
  preserved: boolean;
  text_match: boolean;
  value_added: boolean;
  issues: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SONNET_MODEL = 'claude-sonnet-4-5-20250514';

const SONNET_PRICING = {
  input: 3.0 / 1_000_000,
  output: 15.0 / 1_000_000,
};

// ============================================================================
// COLLEGE OVERLAY ENHANCER
// ============================================================================

export class CollegeOverlayEnhancer {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Enhance universal suggestion with college-specific overlay
   *
   * PHASE 2 ARCHITECTURE:
   * 1. PRESERVE universal quality as baseline
   * 2. Make SURGICAL targeted additions (program names, resources)
   * 3. VALIDATE enhancements (voice, core message, quality)
   * 4. FALLBACK to universal if validation fails
   *
   * The goal: "study bioethics" → "study bioethics through Stanford's Program in Ethics in Society"
   * NOT: rewriting the entire suggestion
   */
  async enhance(input: EnhancementInput): Promise<EnhancementOutput> {
    const { universal_suggestion, college, promptId, issue_diagnosis, weak_dimensions } = input;

    const collegeId = college.collegeId?.toLowerCase() || college.collegeName.toLowerCase();

    // ─────────────────────────────────────────────────────────────────────
    // STEP 1: Pattern matching (heuristic - fast, no API call)
    // ─────────────────────────────────────────────────────────────────────

    // Detect red flags
    const redFlagOutput = redFlagMatcher.matchFlags({
      essayText: universal_suggestion.text,
      collegeId: collegeId,
      promptId: promptId,
    });

    // Detect green flags
    const greenFlagOutput = greenFlagAmplifier.matchFlags({
      essayText: universal_suggestion.text,
      collegeId: collegeId,
      promptId: promptId,
    });

    // Get rubric guidance (estimate score from existing score_impact if available)
    const estimatedScore = 'score_impact' in universal_suggestion
      ? universal_suggestion.score_impact.before
      : 70;

    const rubricGuidance = promptRubricInjector.getRubricGuidance({
      collegeId: collegeId,
      promptId: promptId || 'default',
      estimatedScore: estimatedScore,
    });

    // Match Socratic questions
    const socraticOutput = socraticQuestionMatcher.matchQuestions({
      collegeId: collegeId,
      promptId: promptId,
      detectedIssues: [issue_diagnosis],
      weakDimensions: weak_dimensions.slice(0, 3),
    });

    // ─────────────────────────────────────────────────────────────────────
    // STEP 2A: Multi-Layer Enhancement (ALWAYS runs - value, mindset, quotes)
    // This ensures we never return purely universal when we have college data
    // ─────────────────────────────────────────────────────────────────────

    const multiLayerResult = multiLayerEnhancementService.enhance({
      suggestion_text: universal_suggestion.text,
      suggestion_rationale: universal_suggestion.rationale,
      issue_diagnosis: issue_diagnosis,
      college: college,
    });

    console.log(`[CollegeOverlayEnhancer] Multi-layer enhancement for ${college.collegeName}:`, {
      layers_applied: multiLayerResult.total_layers_applied,
      enhancement_type: multiLayerResult.enhancement_type,
      value_alignment: multiLayerResult.value_alignment_detected,
      mindset_added: multiLayerResult.mindset_signals_added,
      approach_added: multiLayerResult.approach_signals_added,
      dean_quotes_added: multiLayerResult.dean_quotes_added,
    });

    // ─────────────────────────────────────────────────────────────────────
    // STEP 2B: Targeted Resource Enhancement (API call - only if high confidence)
    // ─────────────────────────────────────────────────────────────────────

    const targetedEnhancement = await this.buildTargetedEnhancement(
      {
        ...universal_suggestion,
        // Use multi-layer enhanced rationale as starting point
        rationale: multiLayerResult.enhanced_rationale,
      },
      college,
      redFlagOutput.matches || [],
      greenFlagOutput.matches || []
    );

    // ─────────────────────────────────────────────────────────────────────
    // STEP 3: Validate Enhancement Quality
    // ─────────────────────────────────────────────────────────────────────

    const validation = this.validateEnhancement(
      universal_suggestion.text,
      targetedEnhancement,
      college
    );

    console.log(`[CollegeOverlayEnhancer] Validation result for ${college.collegeName}:`, {
      use_enhanced: validation.use_enhanced,
      changes_made: targetedEnhancement.changes_made.length,
      voice_preserved: validation.reasons.voice_preserved,
      core_message_preserved: validation.reasons.core_message_preserved,
    });

    // ─────────────────────────────────────────────────────────────────────
    // STEP 4: Combine Multi-Layer + Resource Enhancement
    // Multi-layer ALWAYS contributes (text may change via approach signals)
    // Resource enhancement ONLY contributes if validation passed
    // ─────────────────────────────────────────────────────────────────────

    // For text: prefer resource enhancement if validated, otherwise use multi-layer
    const useResourceTextEnhancement = validation.use_enhanced && targetedEnhancement.changes_made.length > 0;

    let finalText = universal_suggestion.text;
    let finalChanges: SurgicalChange[] = [];

    if (useResourceTextEnhancement) {
      // Resource enhancement (high confidence program names)
      finalText = targetedEnhancement.enhanced_text;
      finalChanges = targetedEnhancement.changes_made;
    } else if (multiLayerResult.approach_signals_added) {
      // Multi-layer approach signals (lower-stakes college mindset framing)
      finalText = multiLayerResult.enhanced_text;
      // Note: approach signals don't use SurgicalChange format
    }
    // If neither applies, text stays as universal (but rationale IS enhanced)

    // ─────────────────────────────────────────────────────────────────────
    // STEP 4: Format overlay warnings and highlights
    // ─────────────────────────────────────────────────────────────────────

    const overlayWarnings = (redFlagOutput.matches || []).map(match => {
      const deanQuote = match.dean_quote || {};
      const source = deanQuote.source || { name: 'Unknown' };
      return `⚠️ RED FLAG DETECTED: "${match.pattern}" (${match.severity})\n` +
        `Why this matters: ${deanQuote.why_problematic || 'Problematic pattern'}\n` +
        `Dean quote: "${deanQuote.quote || 'N/A'}" - ${source.name}`;
    });

    const greenFlagHighlights = (greenFlagOutput.matches || []).map(match => {
      const essayQuote = match.essay_quote || {};
      const source = essayQuote.source || { name: 'Unknown' };
      return `✅ Demonstrates ${college.collegeName} value: "${match.pattern}"\n` +
        `What this shows: ${essayQuote.what_demonstrates || 'Demonstrates value'}\n` +
        `Dean's perspective: "${essayQuote.quote || 'N/A'}" - ${source.name}`;
    });

    // Format rubric band note
    const rubricBandNote = rubricGuidance && rubricGuidance.whatPreventsHigherScore
      ? `Current: ${rubricGuidance.currentBand.name} | Target: ${rubricGuidance.targetBand.name}\n` +
        `How to reach: ${rubricGuidance.whatPreventsHigherScore}`
      : null;

    // Extract Socratic questions (safe access)
    const socraticQuestions = socraticOutput.questions?.map(q => q.question) || [];

    // Final rationale comes from resource enhancement (which started with multi-layer rationale)
    // This ensures ALL layers contribute to the rationale
    const finalRationale = targetedEnhancement.enhanced_rationale;

    return {
      text: finalText,
      rationale: finalRationale,
      overlay_warnings: overlayWarnings,
      green_flag_highlights: greenFlagHighlights,
      rubric_band_note: rubricBandNote,
      socratic_questions: socraticQuestions,
      changes_made: finalChanges,
      validation_result: validation,
      // Include multi-layer enhancement metadata for debugging/transparency
      multi_layer_enhancement: {
        layers_applied: multiLayerResult.layers_applied,
        total_layers_applied: multiLayerResult.total_layers_applied,
        enhancement_type: multiLayerResult.enhancement_type,
        value_alignment_detected: multiLayerResult.value_alignment_detected,
      },
    };
  }

  /**
   * Build targeted enhancement with surgical text improvements
   *
   * PHASE 2: This method makes SURGICAL additions to suggestion text
   * while preserving voice, core message, and quality.
   *
   * ALLOWED: Adding specific program names, resources, faculty
   * Example: "study bioethics" → "study bioethics through Stanford's Program in Ethics in Society"
   *
   * NOT ALLOWED: Rewriting, changing voice, adding generic flattery
   */
  private async buildTargetedEnhancement(
    universal_suggestion: PolishedOriginalSuggestion | VoiceAmplifierSuggestion,
    college: CollegeResearch,
    redFlagMatches: any[],
    greenFlagMatches: any[]
  ): Promise<TargetedEnhancementResult> {
    // Extract specific resources from college data if available
    const allResources = this.extractSpecificResources(college);

    // ITERATION 1: Smart match resources to essay content
    const { resources: specificResources, confidence } = this.matchResourcesToContentWithConfidence(
      universal_suggestion.text,
      allResources
    );

    // Log matched resources for debugging
    console.log('[CollegeOverlayEnhancer] Matched resources:', {
      confidence,
      programs: specificResources.programs.map(p => p.name),
      centers: specificResources.centers.map(c => c.name),
      faculty: specificResources.faculty.map(f => f.name),
      labs: specificResources.labs.map(l => l.name),
    });

    // SELECTIVE ENHANCEMENT: Only enhance when we have HIGH confidence (>= 0.8)
    // This prevents generic essays from receiving inappropriate program name additions
    // and ensures college-specific resources are only added when they genuinely match
    //
    // Confidence levels:
    // - 0.8-1.0: Excellent match - proceed with enhancement
    // - 0.6-0.8: Good match - proceed with caution, minimal changes
    // - 0.4-0.6: Moderate match - enhance rationale only, no text changes
    // - 0.0-0.4: Low match - skip enhancement entirely

    if (confidence < 0.4) {
      console.log('[CollegeOverlayEnhancer] Low confidence (<0.4) - skipping enhancement, returning universal');
      return {
        enhanced_text: universal_suggestion.text,
        enhanced_rationale: universal_suggestion.rationale + ` This suggestion applies universally and doesn't require ${college.collegeName}-specific details.`,
        changes_made: [],
        preservation_check: {
          voice_preserved: true,
          core_message_preserved: true,
          quality_improved: false,
        },
      };
    }

    // For moderate confidence (0.4-0.8), enhance rationale only - no text changes
    const enhanceTextAllowed = confidence >= 0.8;

    if (!enhanceTextAllowed) {
      console.log(`[CollegeOverlayEnhancer] Moderate confidence (${confidence.toFixed(2)}) - enhancing rationale only, preserving text`);
    }

    const prompt = `You are making SURGICAL, TARGETED enhancements to adapt a universal suggestion for ${college.collegeName}.

${enhanceTextAllowed ? '' : `**IMPORTANT: TEXT CHANGES NOT ALLOWED**
Due to moderate confidence in resource matching, you must NOT change the suggestion text.
Instead, enhance the RATIONALE only by explaining how this universal suggestion aligns with ${college.collegeName}'s values.
Set "enhanced_text" to the EXACT original text below.
`}
CRITICAL RULES (MUST FOLLOW):
1. ${enhanceTextAllowed ? 'Make MINIMAL changes - only 0-2 targeted insertions where a program/resource name genuinely adds value' : 'DO NOT change the text - preserve it EXACTLY as provided'}
2. PRESERVE the voice, core message, and 70%+ of original words
3. DO NOT rewrite or restructure - only INSERT specific details into existing sentences
4. DO NOT add generic flattery ("dream school", "world-class", "prestigious")
5. If no meaningful enhancement is possible, return the text UNCHANGED
6. Changes must reference REAL ${college.collegeName} programs/resources from the provided list

EXAMPLES OF GOOD SURGICAL CHANGES (by topic):

BIOETHICS/ETHICS:
- Original: "explore ethical questions about genetic engineering"
- Enhanced: "explore ethical questions about genetic engineering with Professor Hank Greely, whose CRISPR People examines exactly these dilemmas"
- What we did: Added specific faculty + work. Original phrase intact.

AI/TECHNOLOGY:
- Original: "study how AI affects society"
- Enhanced: "study how AI affects society through Stanford's Human-Centered AI institute (HAI)"
- What we did: Added specific center. Original phrase intact.

ROBOTICS/BUILDING:
- Original: "build robots that can help people"
- Enhanced: "build robots that can help people, drawing on Professor Okamura's CHARM Lab work in medical robotics"
- What we did: Added relevant lab + faculty. Original phrase intact.

GENERAL:
- Original: "think deeply about hard questions"
- Enhanced: "think deeply about hard questions" (NO CHANGE - too vague to match resources)
- What we did: No enhancement possible without specifics. Left unchanged.

EXAMPLES OF BAD CHANGES (DO NOT DO THIS):
- Adding generic flattery: "world-renowned", "prestigious", "dream school"
- Rewriting the whole sentence instead of inserting details
- Adding resources that don't match the essay topic
- Name-dropping without connection to the student's interest

UNIVERSAL SUGGESTION (your BASE - preserve its quality):
"${universal_suggestion.text}"

CURRENT RATIONALE:
"${universal_suggestion.rationale}"

${college.collegeName} SPECIFIC RESOURCES FOR ENHANCEMENT (MATCHED TO ESSAY CONTENT):
${specificResources.programs.length > 0
  ? `Programs (most relevant to this essay):\n${specificResources.programs.map(p => `- ${p.name}: ${p.description}`).join('\n')}`
  : 'No matching programs found'}

${specificResources.centers.length > 0
  ? `\nCenters/Institutes:\n${specificResources.centers.map(c => `- ${c.name}: ${c.focus}`).join('\n')}`
  : ''}

${specificResources.faculty.length > 0
  ? `\nRelevant Faculty:\n${specificResources.faculty.map(f => `- ${f.name}: ${f.researchAreas.join(', ')}`).join('\n')}`
  : ''}

${specificResources.labs.length > 0
  ? `\nResearch Labs:\n${specificResources.labs.map(l => `- ${l.name}: ${l.focus}`).join('\n')}`
  : ''}

CORE VALUES:
${college.coreValues?.slice(0, 3).map(v => `- ${v.valueName}: ${v.essayImplication}`).join('\n') || 'N/A'}

${redFlagMatches.length > 0
  ? `\nRED FLAGS DETECTED:\n${redFlagMatches.slice(0, 2).map(m => `- "${m.pattern}": ${m.dean_quote?.why_problematic || 'Problematic'}`).join('\n')}`
  : ''}

${greenFlagMatches.length > 0
  ? `\nGREEN FLAGS DEMONSTRATED:\n${greenFlagMatches.slice(0, 2).map(m => `- "${m.pattern}": ${m.essay_quote?.what_demonstrates || 'Good pattern'}`).join('\n')}`
  : ''}

YOUR JOB:
1. Look for 1-2 places where adding a SPECIFIC program/resource/faculty name would add genuine value
2. Make MINIMAL targeted insertions (e.g., "study ethics" → "study ethics through Stanford's Program in Ethics in Society")
3. Keep everything else EXACTLY as-is
4. If no enhancement adds value, return the text unchanged
5. Write an enhanced rationale that explains why this works for ${college.collegeName}

OUTPUT (JSON format):
{
  "enhanced_text": "the text with surgical additions (or unchanged if no improvements)",
  "enhanced_rationale": "2-3 sentence rationale explaining why this works for ${college.collegeName}",
  "changes_made": [
    {
      "location": "where in the text",
      "original": "original phrase",
      "enhanced": "enhanced phrase with specific addition",
      "reason": "why this specific detail adds value"
    }
  ],
  "preservation_check": {
    "voice_preserved": true/false,
    "core_message_preserved": true/false,
    "quality_improved": true/false
  }
}

If no changes made, return empty changes_made array and the original text.`;

    try {
      const response = await this.client.messages.create({
        model: SONNET_MODEL,
        max_tokens: 1000,
        temperature: 0.1, // Very low temperature for consistent, minimal surgical changes
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      const parsed = parseClaudeJSON<{
        enhanced_text: string;
        enhanced_rationale: string;
        changes_made: SurgicalChange[];
        preservation_check: {
          voice_preserved: boolean;
          core_message_preserved: boolean;
          quality_improved: boolean;
        };
      }>(content.text);

      if (!parsed) {
        console.warn('[CollegeOverlayEnhancer] Failed to parse enhancement response, falling back to universal');
        return {
          enhanced_text: universal_suggestion.text,
          enhanced_rationale: universal_suggestion.rationale,
          changes_made: [],
          preservation_check: {
            voice_preserved: true,
            core_message_preserved: true,
            quality_improved: false,
          },
        };
      }

      // CRITICAL: If text enhancement was not allowed, force preservation regardless of API response
      const finalEnhancedText = enhanceTextAllowed
        ? (parsed.enhanced_text || universal_suggestion.text)
        : universal_suggestion.text;

      const finalChangesMade = enhanceTextAllowed
        ? (parsed.changes_made || [])
        : [];

      // Log if we had to override API's attempt to change text
      if (!enhanceTextAllowed && parsed.enhanced_text !== universal_suggestion.text && parsed.changes_made?.length > 0) {
        console.log('[CollegeOverlayEnhancer] Overriding API text changes - text enhancement not allowed at this confidence level');
      }

      return {
        enhanced_text: finalEnhancedText,
        enhanced_rationale: parsed.enhanced_rationale || universal_suggestion.rationale,
        changes_made: finalChangesMade,
        preservation_check: parsed.preservation_check || {
          voice_preserved: true,
          core_message_preserved: true,
          quality_improved: false,
        },
      };
    } catch (error) {
      console.error('[CollegeOverlayEnhancer] Enhancement API call failed:', error);
      // Graceful fallback to universal
      return {
        enhanced_text: universal_suggestion.text,
        enhanced_rationale: universal_suggestion.rationale,
        changes_made: [],
        preservation_check: {
          voice_preserved: true,
          core_message_preserved: true,
          quality_improved: false,
        },
      };
    }
  }

  /**
   * ITERATION 1 + 3: Smart resource matching with confidence score
   * Instead of showing all resources, match them to essay content keywords
   * Returns confidence score to decide if enhancement should be attempted
   */
  private matchResourcesToContentWithConfidence(
    text: string,
    resources: {
      programs: Array<{ name: string; description: string; relevantFor: string[] }>;
      centers: Array<{ name: string; focus: string }>;
      faculty: Array<{ name: string; researchAreas: string[] }>;
      labs: Array<{ name: string; focus: string }>;
    }
  ): {
    resources: typeof resources;
    confidence: number; // 0-1 scale
  } {
    const textLower = text.toLowerCase();

    // Extract key topics from the text
    const topicKeywords = this.extractTopicKeywords(textLower);

    // If no topic keywords found, confidence is very low
    if (topicKeywords.length === 0) {
      return {
        resources: {
          programs: resources.programs.slice(0, 2),
          centers: resources.centers.slice(0, 1),
          faculty: resources.faculty.slice(0, 1),
          labs: resources.labs.slice(0, 1),
        },
        confidence: 0.1,
      };
    }

    // Score and sort programs by relevance
    const scoredPrograms = resources.programs.map(p => {
      let score = 0;
      // Check relevantFor matches
      p.relevantFor.forEach(r => {
        if (topicKeywords.some(k => r.toLowerCase().includes(k) || k.includes(r.toLowerCase()))) {
          score += 3;
        }
      });
      // Check description matches
      topicKeywords.forEach(k => {
        if (p.description.toLowerCase().includes(k)) score += 1;
        if (p.name.toLowerCase().includes(k)) score += 2;
      });
      return { ...p, score };
    }).sort((a, b) => b.score - a.score);

    // Score and sort centers
    const scoredCenters = resources.centers.map(c => {
      let score = 0;
      topicKeywords.forEach(k => {
        if (c.focus.toLowerCase().includes(k)) score += 2;
        if (c.name.toLowerCase().includes(k)) score += 2;
      });
      return { ...c, score };
    }).sort((a, b) => b.score - a.score);

    // Score and sort faculty
    const scoredFaculty = resources.faculty.map(f => {
      let score = 0;
      f.researchAreas.forEach(r => {
        if (topicKeywords.some(k => r.toLowerCase().includes(k) || k.includes(r.toLowerCase()))) {
          score += 3;
        }
      });
      return { ...f, score };
    }).sort((a, b) => b.score - a.score);

    // Score and sort labs
    const scoredLabs = resources.labs.map(l => {
      let score = 0;
      topicKeywords.forEach(k => {
        if (l.focus.toLowerCase().includes(k)) score += 2;
        if (l.name.toLowerCase().includes(k)) score += 2;
      });
      return { ...l, score };
    }).sort((a, b) => b.score - a.score);

    // Calculate confidence based on best matches
    const maxProgramScore = scoredPrograms[0]?.score || 0;
    const maxFacultyScore = scoredFaculty[0]?.score || 0;
    const maxCenterScore = scoredCenters[0]?.score || 0;
    const maxLabScore = scoredLabs[0]?.score || 0;

    // UPDATED CONFIDENCE CALCULATION (more selective for text enhancement)
    //
    // For text enhancement (adding program names to suggestion text),
    // we need HIGH confidence that the resources genuinely match the essay topic.
    //
    // Scoring criteria:
    // - Score >= 6: Excellent match (multiple strong keyword overlaps)
    // - Score >= 4: Strong match (direct topic alignment)
    // - Score >= 3: Good match (partial topic alignment)
    // - Score < 3: Weak match (generic or tangential)

    // Calculate weighted confidence based on match quality
    const excellentMatches = [
      maxProgramScore >= 6 ? 1 : 0,
      maxFacultyScore >= 6 ? 1 : 0,
      maxCenterScore >= 4 ? 1 : 0,
      maxLabScore >= 4 ? 1 : 0,
    ].reduce((a, b) => a + b, 0);

    const strongMatches = [
      maxProgramScore >= 4 && maxProgramScore < 6 ? 1 : 0,
      maxFacultyScore >= 4 && maxFacultyScore < 6 ? 1 : 0,
      maxCenterScore >= 3 && maxCenterScore < 4 ? 1 : 0,
      maxLabScore >= 3 && maxLabScore < 4 ? 1 : 0,
    ].reduce((a, b) => a + b, 0);

    const goodMatches = [
      maxProgramScore >= 3 && maxProgramScore < 4 ? 1 : 0,
      maxFacultyScore >= 3 && maxFacultyScore < 4 ? 1 : 0,
      maxCenterScore >= 2 && maxCenterScore < 3 ? 1 : 0,
      maxLabScore >= 2 && maxLabScore < 3 ? 1 : 0,
    ].reduce((a, b) => a + b, 0);

    // Confidence calculation:
    // - Excellent matches contribute 0.25 each
    // - Strong matches contribute 0.15 each
    // - Good matches contribute 0.08 each
    // - Base confidence is 0.1 (always some value from topic extraction)
    //
    // To reach 0.8 (required for text enhancement):
    // - 3 excellent matches (0.1 + 0.75 = 0.85) ✓
    // - 2 excellent + 2 strong (0.1 + 0.50 + 0.30 = 0.9) ✓
    // - 2 excellent + 1 strong + 2 good (0.1 + 0.50 + 0.15 + 0.16 = 0.91) ✓
    // - 1 excellent + 4 strong (0.1 + 0.25 + 0.60 = 0.95) ✓
    //
    // Won't reach 0.8:
    // - 2 excellent + 1 good (0.1 + 0.50 + 0.08 = 0.68) ✗
    // - 1 excellent + 2 strong (0.1 + 0.25 + 0.30 = 0.65) ✗
    // - 4 good matches only (0.1 + 0.32 = 0.42) ✗

    const confidence = Math.min(1.0,
      0.1 +
      (excellentMatches * 0.25) +
      (strongMatches * 0.15) +
      (goodMatches * 0.08)
    );

    // Log confidence breakdown for debugging
    console.log('[CollegeOverlayEnhancer] Confidence breakdown:', {
      excellentMatches,
      strongMatches,
      goodMatches,
      confidence: confidence.toFixed(2),
      textEnhancementAllowed: confidence >= 0.8,
    });

    // Return top-scoring resources (only those with score > 0 preferred)
    return {
      resources: {
        programs: scoredPrograms.filter(p => p.score > 0).slice(0, 5).length > 0
          ? scoredPrograms.filter(p => p.score > 0).slice(0, 5)
          : scoredPrograms.slice(0, 3),
        centers: scoredCenters.filter(c => c.score > 0).slice(0, 3).length > 0
          ? scoredCenters.filter(c => c.score > 0).slice(0, 3)
          : scoredCenters.slice(0, 2),
        faculty: scoredFaculty.filter(f => f.score > 0).slice(0, 3).length > 0
          ? scoredFaculty.filter(f => f.score > 0).slice(0, 3)
          : scoredFaculty.slice(0, 2),
        labs: scoredLabs.filter(l => l.score > 0).slice(0, 3).length > 0
          ? scoredLabs.filter(l => l.score > 0).slice(0, 3)
          : scoredLabs.slice(0, 2),
      },
      confidence,
    };
  }

  /**
   * Extract topic keywords from text for matching
   */
  private extractTopicKeywords(text: string): string[] {
    // Common topic words to look for
    const topicPatterns = [
      /bioethics?/gi, /ethics/gi, /moral/gi, /philosophy/gi,
      /ai\b/gi, /artificial intelligence/gi, /machine learning/gi, /robot/gi,
      /crispr/gi, /genetic/gi, /biology/gi, /medicine/gi, /health/gi,
      /computer science/gi, /programming/gi, /coding/gi, /software/gi,
      /design/gi, /build/gi, /creat/gi, /innovat/gi, /entrepreneur/gi,
      /psychology/gi, /cognitive/gi, /brain/gi, /neuro/gi,
      /environment/gi, /climate/gi, /sustainab/gi,
      /policy/gi, /government/gi, /politic/gi, /social/gi,
      /art/gi, /music/gi, /theater/gi, /creative/gi,
      /research/gi, /experiment/gi, /lab/gi,
      /human/gi, /society/gi, /culture/gi,
    ];

    const found: string[] = [];
    topicPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(m => {
          const normalized = m.toLowerCase().replace(/s$/, ''); // Remove trailing 's'
          if (!found.includes(normalized)) {
            found.push(normalized);
          }
        });
      }
    });

    return found;
  }

  /**
   * Extract specific resources from college data for targeted enhancements
   */
  private extractSpecificResources(college: CollegeResearch): {
    programs: Array<{ name: string; description: string; relevantFor: string[] }>;
    centers: Array<{ name: string; focus: string }>;
    faculty: Array<{ name: string; researchAreas: string[] }>;
    labs: Array<{ name: string; focus: string }>;
  } {
    // Check if college has specific_resources field (Phase 2 data structure)
    const specificResources = (college as any).specific_resources;

    if (specificResources) {
      return {
        programs: specificResources.programs || [],
        centers: specificResources.centers || [],
        faculty: specificResources.faculty || [],
        labs: specificResources.labs || [],
      };
    }

    // Fallback: Extract from existing college data structures
    // This allows the system to work even before college data is updated
    const programs: Array<{ name: string; description: string; relevantFor: string[] }> = [];
    const centers: Array<{ name: string; focus: string }> = [];
    const faculty: Array<{ name: string; researchAreas: string[] }> = [];

    // Extract from core values (often mention specific programs)
    if (college.coreValues) {
      college.coreValues.forEach(value => {
        // Look for program names in evidence
        value.evidence?.forEach(ev => {
          const programMatch = ev.quote?.match(/(?:Program in|Center for|Institute of|School of)\s+([^,."]+)/i);
          if (programMatch) {
            programs.push({
              name: programMatch[0],
              description: ev.context || '',
              relevantFor: [value.valueName.toLowerCase()],
            });
          }
        });
      });
    }

    // Extract from key quotes (often mention specific resources)
    if (college.keyQuotes) {
      college.keyQuotes.forEach(quote => {
        const programMatch = quote.quote?.match(/(?:Program in|Center for|Institute of|School of)\s+([^,."]+)/i);
        if (programMatch) {
          programs.push({
            name: programMatch[0],
            description: quote.context || '',
            relevantFor: [],
          });
        }
      });
    }

    return { programs, centers, faculty, labs: [] };
  }

  /**
   * Validate enhancement quality
   *
   * Three-layer validation:
   * 1. Voice preservation (heuristic)
   * 2. Core message preservation (heuristic)
   * 3. Quality improvement assessment
   */
  private validateEnhancement(
    originalText: string,
    enhancement: TargetedEnhancementResult,
    college: CollegeResearch
  ): EnhancementValidation {
    // Layer 1: Voice Preservation
    const voicePreserved = this.checkVoicePreservation(originalText, enhancement.enhanced_text);

    // Layer 2: Core Message Preservation
    const coreMessagePreserved = this.checkCoreMessagePreservation(originalText, enhancement.enhanced_text);

    // Layer 3: Quality Improvement (specifics added, not just fluff)
    const qualityImproved = this.assessQualityImprovement(
      originalText,
      enhancement.enhanced_text,
      enhancement.changes_made,
      college
    );

    // Layer 4: Specifics Added (changes reference real college data)
    const specificsAdded = enhancement.changes_made.length > 0 &&
      enhancement.changes_made.every(change =>
        this.isSpecificCollegeDetail(change.enhanced, college)
      );

    // Determine if we should use the enhanced version
    const passed = voicePreserved && coreMessagePreserved;
    const useEnhanced = passed && (qualityImproved || specificsAdded);

    return {
      passed,
      use_enhanced: useEnhanced,
      fallback_to_universal: !useEnhanced,
      reasons: {
        voice_preserved: voicePreserved,
        core_message_preserved: coreMessagePreserved,
        quality_improved: qualityImproved,
        specifics_added: specificsAdded,
      },
    };
  }

  /**
   * Check if voice is preserved between original and enhanced text
   *
   * Heuristics:
   * - First person pronouns maintained
   * - Sentence structure largely preserved
   * - Casual markers preserved (if present)
   * - No shift to formal/academic language
   */
  private checkVoicePreservation(original: string, enhanced: string): boolean {
    // If unchanged, voice is preserved
    if (original === enhanced) return true;

    // Check 1: First person maintained
    const originalFirstPerson = (original.match(/\b(I|my|me|I'm|I've|I'd)\b/gi) || []).length;
    const enhancedFirstPerson = (enhanced.match(/\b(I|my|me|I'm|I've|I'd)\b/gi) || []).length;

    // Enhanced should have similar or slightly more first person (additions might add one)
    if (enhancedFirstPerson < originalFirstPerson - 1) {
      console.log('[Validation] Voice check failed: First person reduced');
      return false;
    }

    // Check 2: No shift to formal/consultant language
    const formalMarkers = [
      /\bpassion for\b/i,
      /\bworld-class\b/i,
      /\bprestigious\b/i,
      /\bdream school\b/i,
      /\bunparalleled\b/i,
      /\brenowned\b/i,
      /\bexcited to\b.*\bopportunity\b/i,
    ];

    for (const marker of formalMarkers) {
      if (!marker.test(original) && marker.test(enhanced)) {
        console.log('[Validation] Voice check failed: Formal marker added');
        return false;
      }
    }

    // Check 3: Original structure largely preserved
    // Enhanced should be similar length (surgical additions, not rewrites)
    // Relaxed threshold: allow up to 2x for additive enhancements (program names can be verbose)
    const lengthRatio = enhanced.length / original.length;
    if (lengthRatio > 2.0 || lengthRatio < 0.7) {
      console.log('[Validation] Voice check failed: Text length changed significantly', { lengthRatio });
      return false;
    }

    // Check 4: Original text should be mostly contained in enhanced
    // (surgical additions, not rewrites)
    // Relaxed threshold: 0.7 word retention (allows more restructuring for natural integration)
    const originalWords = original.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const enhancedLower = enhanced.toLowerCase();
    const wordRetention = originalWords.filter(w => enhancedLower.includes(w)).length / originalWords.length;

    if (wordRetention < 0.7) {
      console.log('[Validation] Voice check failed: Too many original words lost', { wordRetention });
      return false;
    }

    return true;
  }

  /**
   * Check if core message is preserved
   *
   * Heuristics:
   * - Key nouns/verbs maintained
   * - Theme/topic unchanged
   * - Meaning not altered
   */
  private checkCoreMessagePreservation(original: string, enhanced: string): boolean {
    // If unchanged, core message is preserved
    if (original === enhanced) return true;

    // Extract key content words (nouns, verbs, adjectives > 4 chars)
    const extractKeyWords = (text: string): Set<string> => {
      const words = text.toLowerCase().match(/\b[a-z]{5,}\b/g) || [];
      return new Set(words);
    };

    const originalKeyWords = extractKeyWords(original);
    const enhancedKeyWords = extractKeyWords(enhanced);

    // Calculate overlap
    let preserved = 0;
    originalKeyWords.forEach(word => {
      if (enhancedKeyWords.has(word)) preserved++;
    });

    const preservationRate = preserved / originalKeyWords.size;

    if (preservationRate < 0.75) {
      console.log('[Validation] Core message check failed: Key words changed', {
        preservationRate,
        originalWords: originalKeyWords.size,
        preserved,
      });
      return false;
    }

    return true;
  }

  /**
   * Assess if quality actually improved
   *
   * Quality improves if:
   * - Specific college details added (not generic)
   * - Changes are insertions, not rewrites
   * - Added content is factual (from college data)
   */
  private assessQualityImprovement(
    original: string,
    enhanced: string,
    changes: SurgicalChange[],
    college: CollegeResearch
  ): boolean {
    // No changes = no improvement
    if (changes.length === 0) return false;

    // Check if all changes are genuine additions (enhanced contains original)
    const allAdditive = changes.every(change => {
      const enhancedContainsOriginal = change.enhanced.includes(change.original) ||
        // Allow minor restructuring as long as key words preserved
        change.original.split(' ').filter(w => w.length > 3).every(w =>
          change.enhanced.toLowerCase().includes(w.toLowerCase())
        );
      return enhancedContainsOriginal;
    });

    if (!allAdditive) {
      console.log('[Validation] Quality check: Not all changes are additive');
      return false;
    }

    // Check if changes reference specific college details
    const changesReferenceSpecifics = changes.every(change =>
      this.isSpecificCollegeDetail(change.enhanced, college)
    );

    return changesReferenceSpecifics;
  }

  /**
   * Check if text contains specific college details (not generic)
   */
  private isSpecificCollegeDetail(text: string, college: CollegeResearch): boolean {
    const textLower = text.toLowerCase();
    const collegeName = college.collegeName.toLowerCase();

    // Must mention the college or a specific program
    const mentionsCollege = textLower.includes(collegeName) ||
      textLower.includes(collegeName.replace(' university', '').replace('university of ', ''));

    if (!mentionsCollege) {
      // Check for specific program/center/faculty names
      const specificMarkers = [
        /program in/i,
        /center for/i,
        /institute of/i,
        /professor\s+\w+/i,
        /\b[A-Z][a-z]+'s\s+(program|center|lab|institute)/i,
      ];

      return specificMarkers.some(marker => marker.test(text));
    }

    // Check it's not just generic flattery with college name
    const genericPatterns = [
      new RegExp(`${collegeName}.*dream\\s*school`, 'i'),
      new RegExp(`${collegeName}.*world-class`, 'i'),
      new RegExp(`${collegeName}.*prestigious`, 'i'),
      new RegExp(`${collegeName}.*renowned`, 'i'),
      new RegExp(`excited.*${collegeName}`, 'i'),
    ];

    if (genericPatterns.some(p => p.test(textLower))) {
      console.log('[Validation] Specific detail check failed: Generic flattery detected');
      return false;
    }

    return true;
  }

  /**
   * Validate that enhancement preserved universal quality
   *
   * This is a CRITICAL validation layer. If this fails, the enhancement is BROKEN.
   */
  validatePreservation(
    universal: PolishedOriginalSuggestion | VoiceAmplifierSuggestion,
    enhanced: EnhancementOutput,
    college: CollegeResearch
  ): PreservationValidation {
    const issues: string[] = [];

    // CRITICAL: Text must match exactly
    const textMatch = enhanced.text === universal.text;
    if (!textMatch) {
      issues.push('⛔ CRITICAL: Text was changed (should be preserved)');
    }

    // Check if overlay added value
    const valueAdded = enhanced.overlay_warnings.length > 0 ||
                      enhanced.green_flag_highlights.length > 0 ||
                      enhanced.socratic_questions.length > 0 ||
                      enhanced.rationale !== universal.rationale;

    if (!valueAdded) {
      issues.push('⚠️  No overlay value added (why run enhancement?)');
    }

    // Check if rationale was enhanced (not just copied)
    if (enhanced.rationale === universal.rationale) {
      issues.push('⚠️  Rationale not enhanced (same as universal)');
    }

    // Check if college name appears in enhanced rationale
    if (!enhanced.rationale.includes(college.collegeName)) {
      issues.push('⚠️  College name not mentioned in enhanced rationale');
    }

    return {
      preserved: textMatch,
      text_match: textMatch,
      value_added: valueAdded,
      issues: issues,
    };
  }

  /**
   * Batch enhance multiple suggestions
   */
  async enhanceBatch(inputs: EnhancementInput[]): Promise<EnhancementOutput[]> {
    // Run enhancements in parallel (they're independent)
    const results = await Promise.all(
      inputs.map(input => this.enhance(input))
    );

    return results;
  }
}

// Singleton export
export const collegeOverlayEnhancer = new CollegeOverlayEnhancer();
