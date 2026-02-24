// @ts-nocheck
/**
 * Multi-Layer Enhancement Service
 *
 * **PURPOSE**: Provide multiple enhancement strategies beyond just program name insertion.
 *
 * **PROBLEM WITH OLD APPROACH**:
 * - Only matched programs/resources to essay topics
 * - Required 0.8+ confidence to enhance text
 * - Many good essays got no enhancement because they weren't about specific programs
 * - Enhancement was too narrow (only program names)
 *
 * **NEW APPROACH - 5 ENHANCEMENT LAYERS**:
 *
 * LAYER 1: VALUE ALIGNMENT SIGNALS (No API call)
 * - Detect which college values the essay already demonstrates
 * - Suggest how to STRENGTHEN demonstrated values
 * - Always applicable - every essay has some value alignment
 *
 * LAYER 2: MINDSET FRAMING (No API call)
 * - Reframe suggestions to match college's preferred thinking style
 * - Stanford: curiosity-driven, question-focused
 * - MIT: hands-on, build-to-understand
 * - Harvard: impact-focused, character-centered
 * - UChicago: intellectual playfulness, visible thinking
 *
 * LAYER 3: APPROACH SIGNALS (No API call)
 * - Add college-specific phrasing that signals understanding of their ethos
 * - NOT program names, but APPROACH indicators
 * - e.g., "explore this question" (Stanford) vs "build to understand" (MIT)
 *
 * LAYER 4: RESOURCE INTEGRATION (Conditional API call)
 * - Only when topic closely matches specific programs
 * - Surgical program/faculty insertion
 * - High confidence threshold (0.8+)
 *
 * LAYER 5: DEAN QUOTE TEACHING (No API call)
 * - Inject relevant dean quotes into teaching rationale
 * - Gives suggestions more authority
 * - Shows understanding of what the college values
 *
 * **KEY PRINCIPLE**: At least one layer should ALWAYS enhance the suggestion.
 * We never return universal unchanged if we have college data.
 */

import type { CollegeResearch, CollegeCoreValue, CollegeKeyQuote } from '../types/collegeResearch';
import type {
  PolishedOriginalSuggestion,
  VoiceAmplifierSuggestion,
} from './typeSpecificSuggestionService';

// ============================================================================
// TYPES
// ============================================================================

export interface EnhancementLayer {
  layer_id: string;
  layer_name: string;
  applicable: boolean;
  confidence: number; // 0-1
  enhancement: string | null;
  teaching_addition: string | null;
}

export interface MultiLayerEnhancementInput {
  suggestion_text: string;
  suggestion_rationale: string;
  issue_diagnosis: string;
  college: CollegeResearch;
  essay_text?: string; // Original essay for context
}

export interface MultiLayerEnhancementOutput {
  // Enhanced content
  enhanced_text: string;
  enhanced_rationale: string;

  // Layer breakdown
  layers_applied: EnhancementLayer[];
  total_layers_applied: number;

  // Quality indicators
  enhancement_confidence: number; // Aggregate confidence
  enhancement_type: 'value' | 'mindset' | 'approach' | 'resource' | 'teaching' | 'combined';

  // Debug info
  value_alignment_detected: string[];
  mindset_signals_added: boolean;
  approach_signals_added: boolean;
  resources_integrated: boolean;
  dean_quotes_added: boolean;
}

// ============================================================================
// COLLEGE MINDSET DEFINITIONS
// ============================================================================

interface CollegeMindset {
  thinking_verbs: string[]; // e.g., ["explore", "question", "discover"]
  framing_phrases: string[]; // e.g., ["What if...", "I couldn't stop thinking about..."]
  approach_indicators: string[]; // e.g., ["following your curiosity", "building to understand"]
  avoid_phrases: string[]; // Phrases that don't fit this college's ethos
}

const COLLEGE_MINDSETS: Record<string, CollegeMindset> = {
  stanford: {
    thinking_verbs: ['explore', 'question', 'discover', 'wonder', 'investigate', 'pursue'],
    framing_phrases: [
      'What if you explored...',
      'Following this thread of curiosity...',
      'This question could lead you to...',
      'The intellectual rabbit hole here might include...',
    ],
    approach_indicators: [
      'self-directed exploration',
      'following your curiosity',
      'asking the next question',
      'connecting unexpected ideas',
      'intellectual energy',
    ],
    avoid_phrases: [
      'prestigious opportunity',
      'career advancement',
      'will help you succeed',
      'impressive accomplishment',
    ],
  },
  mit: {
    thinking_verbs: ['build', 'test', 'prototype', 'iterate', 'debug', 'optimize', 'collaborate'],
    framing_phrases: [
      'What if you built...',
      'To test this idea...',
      'Working with others on...',
      'The hands-on approach here...',
    ],
    approach_indicators: [
      'building to understand',
      'hands-on exploration',
      'collaborative problem-solving',
      'learning through failure',
      'making things work',
    ],
    avoid_phrases: [
      'theoretical understanding',
      'individual achievement',
      'academic recognition',
    ],
  },
  harvard: {
    thinking_verbs: ['lead', 'impact', 'serve', 'transform', 'advocate', 'bridge', 'mentor'],
    framing_phrases: [
      'Consider how this could impact...',
      'The opportunity to serve others here...',
      'Your leadership could...',
      'This positions you to make people better by...',
    ],
    approach_indicators: [
      'making people better',
      'character-centered leadership',
      'impact on others',
      'bridging communities',
      'civil discourse',
    ],
    avoid_phrases: [
      'personal gain',
      'individual success',
      'self-advancement',
    ],
  },
  uchicago: {
    thinking_verbs: ['examine', 'question', 'play', 'probe', 'rethink', 'challenge', 'deconstruct'],
    framing_phrases: [
      'What happens if we turn this idea on its head...',
      'The playful approach might be to...',
      'Consider the counterintuitive...',
      'The fun intellectual move here...',
    ],
    approach_indicators: [
      'visible thinking process',
      'intellectual playfulness',
      'questioning assumptions',
      'unconventional angles',
      'delight in complexity',
    ],
    avoid_phrases: [
      'straightforward solution',
      'obvious answer',
      'practical application',
    ],
  },
  yale: {
    thinking_verbs: ['contribute', 'collaborate', 'engage', 'participate', 'enrich', 'share'],
    framing_phrases: [
      'Consider how this could enrich your community...',
      'This creates opportunity for meaningful exchange...',
      'Your unique perspective could add to...',
      'Think about bringing this to residential life...',
    ],
    approach_indicators: [
      'community contribution',
      'intellectual exchange',
      'residential engagement',
      'diverse perspectives',
      'active participation',
    ],
    avoid_phrases: [
      'individual glory',
      'competitive advantage',
      'standing out',
    ],
  },
  princeton: {
    thinking_verbs: ['serve', 'lead', 'commit', 'dedicate', 'honor', 'steward'],
    framing_phrases: [
      'Consider the service dimension here...',
      'How might this translate to serving others...',
      'The nation and humanity need people who...',
      'This commitment could manifest as...',
    ],
    approach_indicators: [
      'service to humanity',
      'long-term commitment',
      'principled leadership',
      'ethical responsibility',
      'intellectual rigor',
    ],
    avoid_phrases: [
      'personal benefit',
      'career advancement',
      'networking opportunity',
    ],
  },
  columbia: {
    thinking_verbs: ['engage', 'critique', 'analyze', 'confront', 'navigate', 'synthesize'],
    framing_phrases: [
      'Consider the urban dimension of this...',
      'How does this intersect with the real world...',
      'The Core would prepare you to...',
      'New York offers a laboratory for...',
    ],
    approach_indicators: [
      'urban engagement',
      'core curriculum',
      'real-world application',
      'intellectual breadth',
      'critical thinking',
    ],
    avoid_phrases: [
      'isolated study',
      'theoretical only',
      'academic bubble',
    ],
  },
  caltech: {
    thinking_verbs: ['solve', 'research', 'discover', 'prove', 'experiment', 'investigate'],
    framing_phrases: [
      'The research question here could be...',
      'What experiment would test this...',
      'Consider the scientific approach of...',
      'The collaborative research environment offers...',
    ],
    approach_indicators: [
      'scientific rigor',
      'research intensity',
      'collaborative discovery',
      'first-principles thinking',
      'experimental verification',
    ],
    avoid_phrases: [
      'career preparation',
      'broad education',
      'humanities focus',
    ],
  },
  brown: {
    thinking_verbs: ['design', 'create', 'explore', 'integrate', 'customize', 'innovate'],
    framing_phrases: [
      'The open curriculum allows you to...',
      'You could design a pathway that...',
      'Consider integrating this with...',
      'Your unique combination might include...',
    ],
    approach_indicators: [
      'intellectual autonomy',
      'self-designed education',
      'interdisciplinary exploration',
      'creative integration',
      'personal ownership',
    ],
    avoid_phrases: [
      'required courses',
      'structured pathway',
      'traditional approach',
    ],
  },
  upenn: {
    thinking_verbs: ['apply', 'impact', 'venture', 'innovate', 'collaborate', 'implement'],
    framing_phrases: [
      'Consider the real-world application...',
      'How could this translate to impact...',
      'The cross-school collaboration enables...',
      'Think about the venture potential...',
    ],
    approach_indicators: [
      'practical application',
      'cross-school collaboration',
      'entrepreneurial mindset',
      'real-world impact',
      'interdisciplinary approach',
    ],
    avoid_phrases: [
      'pure theory',
      'abstract thinking',
      'isolated study',
    ],
  },
  duke: {
    thinking_verbs: ['engage', 'serve', 'lead', 'contribute', 'connect', 'balance'],
    framing_phrases: [
      'Consider how this balances academics and engagement...',
      'The DukeEngage opportunity here...',
      'Think about the community dimension...',
      'This could connect to service in...',
    ],
    approach_indicators: [
      'knowledge in service',
      'community engagement',
      'balanced excellence',
      'collaborative leadership',
      'purposeful action',
    ],
    avoid_phrases: [
      'academic only',
      'theoretical focus',
      'individual pursuit',
    ],
  },
  northwestern: {
    thinking_verbs: ['create', 'collaborate', 'communicate', 'produce', 'perform', 'design'],
    framing_phrases: [
      'Consider the creative application...',
      'The collaboration across schools enables...',
      'Think about the communication dimension...',
      'This production could take shape as...',
    ],
    approach_indicators: [
      'creative expression',
      'cross-disciplinary collaboration',
      'communication excellence',
      'practical artistry',
      'professional preparation',
    ],
    avoid_phrases: [
      'pure research',
      'theoretical only',
      'isolated study',
    ],
  },
};

// ============================================================================
// MAIN SERVICE CLASS
// ============================================================================

export class MultiLayerEnhancementService {
  /**
   * Apply all applicable enhancement layers
   */
  enhance(input: MultiLayerEnhancementInput): MultiLayerEnhancementOutput {
    const { suggestion_text, suggestion_rationale, issue_diagnosis, college, essay_text } = input;

    const collegeId = college.collegeId?.toLowerCase() || college.collegeName.toLowerCase().replace(' university', '');
    const mindset = COLLEGE_MINDSETS[collegeId] || COLLEGE_MINDSETS.stanford; // Default to Stanford-style if unknown

    const layers: EnhancementLayer[] = [];
    let enhancedText = suggestion_text;
    let enhancedRationale = suggestion_rationale;

    // ─────────────────────────────────────────────────────────────────────────
    // LAYER 1: Value Alignment Signals
    // ─────────────────────────────────────────────────────────────────────────
    const valueLayer = this.applyValueAlignmentLayer(
      enhancedRationale,
      college.coreValues,
      issue_diagnosis
    );
    layers.push(valueLayer);
    if (valueLayer.applicable && valueLayer.teaching_addition) {
      enhancedRationale = this.appendToRationale(enhancedRationale, valueLayer.teaching_addition);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LAYER 2: Mindset Framing
    // ─────────────────────────────────────────────────────────────────────────
    const mindsetLayer = this.applyMindsetFramingLayer(
      enhancedText,
      enhancedRationale,
      mindset,
      college.collegeName
    );
    layers.push(mindsetLayer);
    if (mindsetLayer.applicable && mindsetLayer.enhancement) {
      // For mindset framing, we enhance the rationale, not the text
      enhancedRationale = this.appendToRationale(enhancedRationale, mindsetLayer.enhancement);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LAYER 3: Approach Signals
    // ─────────────────────────────────────────────────────────────────────────
    const approachLayer = this.applyApproachSignalsLayer(
      enhancedText,
      mindset,
      college.collegeName
    );
    layers.push(approachLayer);
    if (approachLayer.applicable && approachLayer.enhancement) {
      enhancedText = approachLayer.enhancement;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LAYER 4: Resource Integration (conditional)
    // ─────────────────────────────────────────────────────────────────────────
    const resourceLayer = this.applyResourceIntegrationLayer(
      enhancedText,
      college,
      issue_diagnosis
    );
    layers.push(resourceLayer);
    // Resource layer is handled by CollegeOverlayEnhancer, so we just note applicability

    // ─────────────────────────────────────────────────────────────────────────
    // LAYER 5: Dean Quote Teaching
    // ─────────────────────────────────────────────────────────────────────────
    const quoteLayer = this.applyDeanQuoteLayer(
      enhancedRationale,
      college.keyQuotes,
      college.coreValues,
      issue_diagnosis
    );
    layers.push(quoteLayer);
    if (quoteLayer.applicable && quoteLayer.teaching_addition) {
      enhancedRationale = this.appendToRationale(enhancedRationale, quoteLayer.teaching_addition);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AGGREGATE RESULTS
    // ─────────────────────────────────────────────────────────────────────────
    const appliedLayers = layers.filter(l => l.applicable);
    const totalApplied = appliedLayers.length;
    const avgConfidence = totalApplied > 0
      ? appliedLayers.reduce((sum, l) => sum + l.confidence, 0) / totalApplied
      : 0;

    // Determine primary enhancement type
    let enhancementType: MultiLayerEnhancementOutput['enhancement_type'] = 'combined';
    if (totalApplied === 1) {
      const appliedLayer = appliedLayers[0];
      if (appliedLayer.layer_id === 'value_alignment') enhancementType = 'value';
      else if (appliedLayer.layer_id === 'mindset_framing') enhancementType = 'mindset';
      else if (appliedLayer.layer_id === 'approach_signals') enhancementType = 'approach';
      else if (appliedLayer.layer_id === 'resource_integration') enhancementType = 'resource';
      else if (appliedLayer.layer_id === 'dean_quotes') enhancementType = 'teaching';
    }

    return {
      enhanced_text: enhancedText,
      enhanced_rationale: enhancedRationale,
      layers_applied: layers,
      total_layers_applied: totalApplied,
      enhancement_confidence: avgConfidence,
      enhancement_type: enhancementType,
      value_alignment_detected: valueLayer.applicable
        ? this.extractDetectedValues(college.coreValues, issue_diagnosis)
        : [],
      mindset_signals_added: mindsetLayer.applicable,
      approach_signals_added: approachLayer.applicable,
      resources_integrated: resourceLayer.applicable,
      dean_quotes_added: quoteLayer.applicable,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER IMPLEMENTATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * LAYER 1: Value Alignment Signals
   *
   * Detects which college values relate to the issue and adds teaching
   * about WHY this improvement matters for the specific college.
   */
  private applyValueAlignmentLayer(
    rationale: string,
    coreValues: CollegeCoreValue[],
    issueDiagnosis: string
  ): EnhancementLayer {
    const diagnosisLower = issueDiagnosis.toLowerCase();

    // Map issue types to relevant values
    const valueMatches: Array<{ value: CollegeCoreValue; relevance: number }> = [];

    for (const value of coreValues) {
      let relevance = 0;

      // Check if issue relates to value's IS indicators
      for (const isIndicator of value.is || []) {
        if (diagnosisLower.includes(isIndicator.toLowerCase().substring(0, 20))) {
          relevance += 2;
        }
      }

      // Check if issue relates to value's IS NOT indicators (opposite problem)
      for (const isNotIndicator of value.isNot || []) {
        if (diagnosisLower.includes(isNotIndicator.toLowerCase().substring(0, 20))) {
          relevance += 1.5;
        }
      }

      // Check value name/definition match
      if (diagnosisLower.includes(value.valueName.toLowerCase())) {
        relevance += 3;
      }

      // Check essay implication match
      const implications = value.essayImplication.toLowerCase().split(' ');
      const matchingImplications = implications.filter(w =>
        w.length > 5 && diagnosisLower.includes(w)
      );
      relevance += matchingImplications.length * 0.5;

      if (relevance > 0) {
        valueMatches.push({ value, relevance });
      }
    }

    if (valueMatches.length === 0) {
      // Even if no direct match, use the college's #1 value
      const topValue = coreValues[0];
      return {
        layer_id: 'value_alignment',
        layer_name: 'Value Alignment Signals',
        applicable: true,
        confidence: 0.5,
        enhancement: null,
        teaching_addition: `This improvement supports ${topValue.valueName}, which ${topValue.definition.toLowerCase()}`,
      };
    }

    // Sort by relevance and take top match
    valueMatches.sort((a, b) => b.relevance - a.relevance);
    const topMatch = valueMatches[0];
    const confidence = Math.min(1.0, 0.4 + (topMatch.relevance * 0.15));

    // Build teaching addition
    let teaching = `This directly supports ${topMatch.value.valueName}`;

    // Add evidence if available
    if (topMatch.value.evidence && topMatch.value.evidence.length > 0) {
      const evidence = topMatch.value.evidence[0];
      teaching += `. As ${evidence.source} notes: "${evidence.quote.substring(0, 100)}${evidence.quote.length > 100 ? '...' : ''}"`;
    } else {
      teaching += `, which ${topMatch.value.definition.toLowerCase()}`;
    }

    return {
      layer_id: 'value_alignment',
      layer_name: 'Value Alignment Signals',
      applicable: true,
      confidence,
      enhancement: null,
      teaching_addition: teaching,
    };
  }

  /**
   * LAYER 2: Mindset Framing
   *
   * Adds framing that matches the college's preferred thinking style.
   */
  private applyMindsetFramingLayer(
    text: string,
    rationale: string,
    mindset: CollegeMindset,
    collegeName: string
  ): EnhancementLayer {
    // Check if the text already uses the college's preferred verbs
    const textLower = text.toLowerCase();
    const hasPreferredVerbs = mindset.thinking_verbs.some(v => textLower.includes(v));

    // Check for phrases to avoid
    const hasAvoidPhrases = mindset.avoid_phrases.some(p => textLower.includes(p.toLowerCase()));

    if (hasPreferredVerbs && !hasAvoidPhrases) {
      // Already well-framed
      return {
        layer_id: 'mindset_framing',
        layer_name: 'Mindset Framing',
        applicable: false,
        confidence: 0,
        enhancement: null,
        teaching_addition: null,
      };
    }

    // Add mindset framing to rationale
    const randomFraming = mindset.framing_phrases[
      Math.floor(Math.random() * mindset.framing_phrases.length)
    ];

    const enhancement = `${collegeName} values ${mindset.approach_indicators[0]} - consider framing this as: "${randomFraming.replace('...', ' your unique angle')}"`;

    return {
      layer_id: 'mindset_framing',
      layer_name: 'Mindset Framing',
      applicable: true,
      confidence: 0.7,
      enhancement,
      teaching_addition: null,
    };
  }

  /**
   * LAYER 3: Approach Signals
   *
   * Makes surgical text changes to add college-specific approach indicators.
   * Very conservative - only adds a brief signal phrase.
   */
  private applyApproachSignalsLayer(
    text: string,
    mindset: CollegeMindset,
    collegeName: string
  ): EnhancementLayer {
    const textLower = text.toLowerCase();

    // Check if text already has approach signals
    const hasApproachSignal = mindset.approach_indicators.some(a =>
      textLower.includes(a.toLowerCase())
    );

    if (hasApproachSignal) {
      return {
        layer_id: 'approach_signals',
        layer_name: 'Approach Signals',
        applicable: false,
        confidence: 0,
        enhancement: null,
        teaching_addition: null,
      };
    }

    // Find a good insertion point
    // Look for phrases like "This would", "Consider", "Try", "You could"
    const insertionPatterns = [
      /\b(This would|Consider|Try|You could|Think about)\b/i,
    ];

    let enhanced = text;
    let inserted = false;

    for (const pattern of insertionPatterns) {
      const match = text.match(pattern);
      if (match && match.index !== undefined) {
        // Insert approach signal before the matched phrase
        const approachSignal = mindset.approach_indicators[0];
        const before = text.substring(0, match.index);
        const after = text.substring(match.index);

        // Only insert if it makes grammatical sense
        if (before.trim().endsWith('.') || before.trim().endsWith(',')) {
          enhanced = `${before.trim()} In the spirit of ${approachSignal}, ${after.charAt(0).toLowerCase()}${after.substring(1)}`;
          inserted = true;
          break;
        }
      }
    }

    if (!inserted) {
      // No good insertion point found - skip this layer
      return {
        layer_id: 'approach_signals',
        layer_name: 'Approach Signals',
        applicable: false,
        confidence: 0,
        enhancement: null,
        teaching_addition: null,
      };
    }

    return {
      layer_id: 'approach_signals',
      layer_name: 'Approach Signals',
      applicable: true,
      confidence: 0.6,
      enhancement: enhanced,
      teaching_addition: null,
    };
  }

  /**
   * LAYER 4: Resource Integration
   *
   * This layer is handled by CollegeOverlayEnhancer.
   * Here we just detect if it COULD apply.
   */
  private applyResourceIntegrationLayer(
    text: string,
    college: CollegeResearch,
    issueDiagnosis: string
  ): EnhancementLayer {
    // Check if college has specific resources
    const hasResources = (college as any).specific_resources ||
      college.coreValues?.some(v => v.evidence?.length > 0);

    // Check if diagnosis mentions specific topics that might match resources
    const topicIndicators = ['program', 'research', 'lab', 'class', 'course', 'study'];
    const mentionsResources = topicIndicators.some(t =>
      issueDiagnosis.toLowerCase().includes(t)
    );

    return {
      layer_id: 'resource_integration',
      layer_name: 'Resource Integration',
      applicable: hasResources && mentionsResources,
      confidence: mentionsResources ? 0.5 : 0.2, // Actual confidence calculated by CollegeOverlayEnhancer
      enhancement: null,
      teaching_addition: null,
    };
  }

  /**
   * LAYER 5: Dean Quote Teaching
   *
   * Adds relevant dean/admissions quotes to the teaching rationale.
   */
  private applyDeanQuoteLayer(
    rationale: string,
    keyQuotes: CollegeKeyQuote[] | undefined,
    coreValues: CollegeCoreValue[],
    issueDiagnosis: string
  ): EnhancementLayer {
    // First check keyQuotes
    let relevantQuote: { quote: string; source: string } | null = null;
    const diagnosisLower = issueDiagnosis.toLowerCase();

    // Try keyQuotes first
    if (keyQuotes && keyQuotes.length > 0) {
      for (const kq of keyQuotes) {
        // Check if quote relates to the issue
        const quoteLower = kq.quote.toLowerCase();
        const matchingWords = diagnosisLower.split(' ').filter(w =>
          w.length > 4 && quoteLower.includes(w)
        );

        if (matchingWords.length >= 2 && kq.quote.length < 200) {
          relevantQuote = {
            quote: kq.quote,
            source: kq.source?.name || 'Admissions Office',
          };
          break;
        }
      }
    }

    // If no keyQuote match, try coreValue evidence
    if (!relevantQuote) {
      for (const value of coreValues.slice(0, 3)) {
        if (value.evidence && value.evidence.length > 0) {
          for (const ev of value.evidence) {
            if (ev.quote.length < 150) {
              relevantQuote = {
                quote: ev.quote,
                source: ev.source,
              };
              break;
            }
          }
          if (relevantQuote) break;
        }
      }
    }

    if (!relevantQuote) {
      return {
        layer_id: 'dean_quotes',
        layer_name: 'Dean Quote Teaching',
        applicable: false,
        confidence: 0,
        enhancement: null,
        teaching_addition: null,
      };
    }

    const teaching = `${relevantQuote.source} emphasizes: "${relevantQuote.quote}"`;

    return {
      layer_id: 'dean_quotes',
      layer_name: 'Dean Quote Teaching',
      applicable: true,
      confidence: 0.8,
      enhancement: null,
      teaching_addition: teaching,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPER METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  private appendToRationale(rationale: string, addition: string): string {
    // Add the teaching addition to the rationale
    const separator = rationale.trim().endsWith('.') ? ' ' : '. ';
    return `${rationale}${separator}${addition}`;
  }

  private extractDetectedValues(
    coreValues: CollegeCoreValue[],
    issueDiagnosis: string
  ): string[] {
    const diagnosisLower = issueDiagnosis.toLowerCase();
    return coreValues
      .filter(v => diagnosisLower.includes(v.valueName.toLowerCase()) ||
        v.is?.some(i => diagnosisLower.includes(i.toLowerCase().substring(0, 15))))
      .map(v => v.valueName);
  }
}

// Singleton export
export const multiLayerEnhancementService = new MultiLayerEnhancementService();
