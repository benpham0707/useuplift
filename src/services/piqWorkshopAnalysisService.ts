// @ts-nocheck - PIQ analysis service
/**
 * PIQ Workshop Analysis Service - EDGE FUNCTION INTEGRATION
 *
 * Calls the workshop-analysis edge function (server-side) for Claude API access
 * Returns ALL insights: voice fingerprint, experience fingerprint, 12 dimensions, workshop items
 */

import type { AnalysisResult, ValidationSummary } from '@/components/portfolio/extracurricular/workshop/backendTypes';
import { createClient } from '@supabase/supabase-js';

// Supabase client for edge function calls
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================================================
// TWO-STEP ANALYSIS CALLBACKS
// ============================================================================

export interface TwoStepAnalysisCallbacks {
  onPhase17Complete?: (result: AnalysisResult) => void;
  onPhase18Complete?: (validatedResult: AnalysisResult) => void;
  onPhase19Complete?: (teachingResult: AnalysisResult) => void;
  onProgress?: (status: string) => void;
}

/**
 * Two-Step Analysis: Phase 17 + Phase 18 Validation
 *
 * Splits analysis into two separate API calls to avoid 150s timeout:
 * 1. Phase 17 (88-133s): Generate workshop suggestions
 * 2. Phase 18 (20-50s): Validate suggestion quality
 *
 * Benefits:
 * - No timeout errors
 * - Progressive loading (suggestions appear first, then quality scores)
 * - Graceful degradation (if Phase 18 fails, user still gets Phase 17 suggestions)
 */
export async function analyzePIQEntryTwoStep(
  essayText: string,
  promptTitle: string,
  promptText: string,
  callbacks: TwoStepAnalysisCallbacks = {},
  options: {
    depth?: 'quick' | 'standard' | 'comprehensive';
    skip_coaching?: boolean;
    essayType?: 'personal_statement' | 'uc_piq' | 'why_us' | 'supplemental' | 'activity_essay';
  } = {}
): Promise<AnalysisResult> {

  // ========================================================================
  // PHASE 17: Generate Workshop Suggestions (88-133s)
  // ========================================================================

  try {
    callbacks.onProgress?.('Analyzing your essay and generating suggestions...');

    const phase17Start = Date.now();

    const { data: phase17Data, error: phase17Error } = await supabase.functions.invoke(
      'workshop-analysis',
      {
        body: {
          essayText,
          essayType: options.essayType || 'uc_piq',
          promptText,
          promptTitle,
          maxWords: 350,
          targetSchools: ['UC System'],
          studentContext: {
            academicStrength: 'moderate',
            voicePreference: 'concise',
          }
        }
      }
    );

    const phase17Time = (Date.now() - phase17Start) / 1000;

    if (phase17Error) {
      throw new Error(`Phase 17 failed: ${phase17Error.message}`);
    }

    if (!phase17Data || !phase17Data.success) {
      throw new Error(phase17Data?.error || 'Phase 17 failed');
    }

    // Transform Phase 17 result to AnalysisResult
    const phase17Result: AnalysisResult = {
      analysis: {
        narrative_quality_index: phase17Data.analysis.narrative_quality_index,
        overall_strengths: phase17Data.analysis.overall_strengths || [],
        overall_weaknesses: phase17Data.analysis.overall_weaknesses || [],
        categories: (phase17Data.rubricDimensionDetails || []).map((dim: any) => ({
          category: dim.dimension_name,
          score: dim.final_score,
          maxScore: 10,
          comments: [dim.evidence?.justification || ''],
          evidence: [dim.evidence?.strengths || ''],
          suggestions: dim.evidence?.gaps || [],
        })),
        weights: {},
        id: 'phase17-' + Date.now(),
        entry_id: 'piq-' + Date.now(),
        rubric_version: 'surgical-workshop-v17',
        created_at: new Date().toISOString(),
        reader_impression_label: getImpressionLabel(phase17Data.analysis.narrative_quality_index),
        flags: [],
        suggested_fixes_ranked: [],
        analysis_depth: 'comprehensive',
      },
      voiceFingerprint: phase17Data.voiceFingerprint,
      experienceFingerprint: phase17Data.experienceFingerprint,
      rubricDimensionDetails: phase17Data.rubricDimensionDetails,
      workshopItems: phase17Data.workshopItems,
      categories: {},
    };

    // Notify UI that Phase 17 is complete - suggestions can be displayed!
    callbacks.onPhase17Complete?.(phase17Result);

    // ========================================================================
    // PHASE 18: Validate Suggestion Quality (20-50s)
    // ========================================================================

    callbacks.onProgress?.('Scoring suggestion quality...');

    const phase18Start = Date.now();

    const { data: phase18Data, error: phase18Error } = await supabase.functions.invoke(
      'validate-workshop',
      {
        body: {
          workshopItems: phase17Data.workshopItems,
          essayText,
          promptText
        }
      }
    );

    const phase18Time = (Date.now() - phase18Start) / 1000;

    // Graceful degradation: If Phase 18 fails, return Phase 17 results
    if (phase18Error || !phase18Data?.success) {
      return phase17Result;
    }

    // Merge Phase 18 validations back into Phase 17 result
    const validatedResult: AnalysisResult = {
      ...phase17Result,
      workshopItems: phase18Data.workshopItems, // Now includes validation
      validationSummary: phase18Data.summary as ValidationSummary
    };

    // Notify UI that Phase 18 is complete - quality scores can be displayed!
    callbacks.onPhase18Complete?.(validatedResult);

    // ========================================================================
    // PHASE 19: Teaching Layer (30-60s)
    // ========================================================================

    callbacks.onProgress?.('Generating deep teaching guidance...');

    const phase19Start = Date.now();

    const { data: phase19Data, error: phase19Error } = await supabase.functions.invoke(
      'teaching-layer',
      {
        body: {
          workshopItems: validatedResult.workshopItems.map(item => ({
            id: item.id,
            quote: item.quote,
            rubric_category: item.rubric_category,
            suggestions: item.suggestions,
          })),
          essayText,
          promptText,
          promptTitle,
          voiceFingerprint: phase17Result.voiceFingerprint || {},
          experienceFingerprint: phase17Result.experienceFingerprint || {},
          rubricDimensionDetails: phase17Result.rubricDimensionDetails || [],
          currentNQI: phase17Result.analysis?.narrative_quality_index || 70,
        }
      }
    );

    const phase19Time = (Date.now() - phase19Start) / 1000;

    // Graceful degradation: If Phase 19 fails, return Phase 18 results
    if (phase19Error || !phase19Data?.success) {
      
      // Notify UI that teaching is unavailable
      callbacks.onProgress?.('⚠️ Deep teaching guidance unavailable - showing basic guidance');
      
      
      return validatedResult;
    }

    // Merge teaching guidance into workshopItems
    // Use index-based matching as primary (more reliable than ID matching from AI)
    const teachingEnhancedItems = validatedResult.workshopItems.map((item, index) => {
      // Try ID match first
      let enhancement = phase19Data.enhancedItems?.find((e: any) => e.id === item.id);
      
      // Fallback to index-based matching if ID match fails
      if (!enhancement && phase19Data.enhancedItems?.[index]) {
        enhancement = phase19Data.enhancedItems[index];
      }
      
      if (enhancement?.teaching) {

        // 🔍 CRITICAL DEBUG: Log ENTIRE teaching structure from Phase 19

        // CRITICAL: Check if suggestionRationales are present (Phase 19 NEW feature)
        if (enhancement.teaching.suggestionRationales && enhancement.teaching.suggestionRationales.length > 0) {
          enhancement.teaching.suggestionRationales.forEach((r, i) => {
          });
        } else {
        }

        return {
          ...item,
          teaching: enhancement.teaching,
          teachingDepth: enhancement.teachingDepth,
          estimatedImpact: enhancement.estimatedImpact,
        };
      } else {
      }
      return item;
    });

    // Notify UI that Phase 19 is complete - teaching guidance now available!
    callbacks.onPhase19Complete?.({
      ...validatedResult,
      workshopItems: teachingEnhancedItems,
    });

    // ========================================================================
    // PHASE 20: Generate Suggestion Rationales (separate, focused request)
    // ========================================================================

    const phase20Start = Date.now();

    // Call suggestion-rationales function for EACH workshop item
    const phase20Enhanced = await Promise.all(
      teachingEnhancedItems.map(async (item, index) => {
        try {
          const { data: rationaleData, error: rationaleError } = await supabase.functions.invoke(
            'suggestion-rationales',
            {
              body: {
                suggestions: item.suggestions.map((s, i) => ({
                  index: i,
                  text: s.text,
                  type: s.type || (i === 0 ? 'polished_original' : i === 1 ? 'voice_amplifier' : 'divergent_strategy'),
                })),
                issueContext: {
                  title: item.title,
                  excerpt: item.quote,
                  category: item.rubric_category,
                },
              },
            }
          );

          if (rationaleError || !rationaleData?.success) {
            if (rationaleError?.message?.includes('403') || rationaleError?.status === 403) {
            }
            return item; // Return without rationales
          }

          // Merge rationales into teaching
          if (item.teaching && rationaleData.rationales) {
            return {
              ...item,
              teaching: {
                ...item.teaching,
                suggestionRationales: rationaleData.rationales,
              },
            };
          }

          return item;
        } catch (err) {
          if (err instanceof Error) {
          }
          return item; // Return without rationales
        }
      })
    );

    const phase20Time = (Date.now() - phase20Start) / 1000;

    const finalResult: AnalysisResult = {
      ...validatedResult,
      workshopItems: phase20Enhanced,
    };

    return finalResult;

  } catch (error) {
    throw new Error(`PIQ workshop analysis failed: ${(error as Error).message}`);
  }
}

/**
 * Analyze PIQ entry using edge function (server-side surgical workshop)
 *
 * This is the LEGACY single-call method - use analyzePIQEntryTwoStep() instead for timeout-safe operation
 */
export async function analyzePIQEntry(
  essayText: string,
  promptTitle: string,
  promptText: string,
  options: {
    depth?: 'quick' | 'standard' | 'comprehensive';
    skip_coaching?: boolean;
    essayType?: 'personal_statement' | 'uc_piq' | 'why_us' | 'supplemental' | 'activity_essay';
  } = {}
): Promise<AnalysisResult> {

  try {
    // Call workshop-analysis edge function

    const { data, error } = await supabase.functions.invoke('workshop-analysis', {
      body: {
        essayText,
        essayType: options.essayType || 'uc_piq',
        promptText,
        promptTitle,
        maxWords: 350,
        targetSchools: ['UC System'],
        studentContext: {
          academicStrength: 'moderate',
          voicePreference: 'concise',
        }
      }
    });

    if (error) {
      throw new Error(`Edge function failed: ${error.message}`);
    }

    if (!data || !data.success) {
      throw new Error(data?.error || 'Edge function returned unsuccessful result');
    }

    // Transform edge function result to AnalysisResult format
    const analysisResult: AnalysisResult = {
      analysis: {
        narrative_quality_index: data.analysis.narrative_quality_index,
        overall_strengths: data.analysis.overall_strengths || [],
        overall_weaknesses: data.analysis.overall_weaknesses || [],
      },
      voiceFingerprint: data.voiceFingerprint,
      experienceFingerprint: data.experienceFingerprint,
      rubricDimensionDetails: data.rubricDimensionDetails,
      workshopItems: data.workshopItems,
      categories: {}, // Legacy field - not used
    };

    return analysisResult;

  } catch (error) {

    // THROW THE ERROR - DO NOT FALL BACK
    throw new Error(`PIQ workshop analysis failed: ${(error as Error).message}`);
  }
}

/**
 * Transform SurgicalWorkshopResult to AnalysisResult format
 * CRITICAL: Preserve ALL data - no information loss
 */
function transformSurgicalToAnalysisResult(
  surgical: SurgicalWorkshopResult,
  essayText: string,
  promptTitle: string
): AnalysisResult {
  // Map 12 dimension names to category keys for compatibility
  const dimensionNameToKey: Record<string, string> = {
    'opening_power_scene_entry': 'narrative_arc_stakes',
    'narrative_arc_stakes_turn': 'narrative_arc_stakes',
    'character_interiority_vulnerability': 'voice_integrity',
    'show_dont_tell_craft': 'craft_language_quality',
    'reflection_meaning_making': 'reflection_meaning',
    'intellectual_vitality_curiosity': 'reflection_meaning',
    'originality_specificity_voice': 'originality_voice',
    'structure_pacing_coherence': 'craft_language_quality',
    'word_economy_craft': 'craft_language_quality',
    'context_constraints_disclosure': 'specificity_evidence',
    'ethical_awareness_humility': 'reflection_meaning',
    'school_program_fit': 'fit_trajectory'
  };

  // Build categories from rubric dimensions (aggregate by key)
  const categoryMap = new Map<string, any>();

  surgical.rubricResult.dimension_scores.forEach((dim) => {
    const key = dimensionNameToKey[dim.dimension_name] || 'voice_integrity';

    if (!categoryMap.has(key)) {
      categoryMap.set(key, {
        category: key,
        score: 0,
        maxScore: 10,
        comments: [],
        evidence: [],
        suggestions: []
      });
    }

    const cat = categoryMap.get(key);
    cat.score = Math.max(cat.score, dim.final_score); // Use highest score for category
    cat.comments.push(`${dim.dimension_name}: ${dim.evidence?.justification || 'No justification'}`);
    cat.evidence.push(dim.evidence?.justification || '');
  });

  const categories = Array.from(categoryMap.values());

  // Build complete AnalysisResult
  return {
    report: {
      id: surgical.analysisId,
      entry_id: 'piq-' + Date.now(),
      rubric_version: 'surgical-workshop-v17',
      created_at: new Date().toISOString(),
      categories,
      weights: {
        voice_integrity: 0.10,
        specificity_evidence: 0.09,
        transformative_impact: 0.12,
        role_clarity_ownership: 0.08,
        narrative_arc_stakes: 0.10,
        initiative_leadership: 0.10,
        community_collaboration: 0.08,
        reflection_meaning: 0.12,
        craft_language_quality: 0.07,
        fit_trajectory: 0.07,
        time_investment_consistency: 0.07,
      },
      narrative_quality_index: surgical.overallScore,
      reader_impression_label: getImpressionLabel(surgical.overallScore),
      flags: surgical.experienceFingerprint?.antiPatternFlags?.warnings || [],
      suggested_fixes_ranked: surgical.workshopItems.slice(0, 5).map(item => item.problem),
      analysis_depth: 'comprehensive',
    },

    analysis: {
      id: surgical.analysisId,
      entry_id: 'piq-' + Date.now(),
      rubric_version: 'surgical-workshop-v17',
      created_at: new Date().toISOString(),
      categories,
      weights: {} as any,
      narrative_quality_index: surgical.overallScore,
      reader_impression_label: getImpressionLabel(surgical.overallScore),
      flags: [],
      suggested_fixes_ranked: [],
      analysis_depth: 'comprehensive',
    },

    features: extractBasicFeatures(essayText),

    authenticity: {
      authenticity_score: surgical.voiceFingerprint?.tone ? 8 : 5,
      voice_type: surgical.voiceFingerprint?.tone?.primary?.toLowerCase().includes('conversational') ? 'conversational' : 'natural',
      red_flags: surgical.experienceFingerprint?.antiPatternFlags?.warnings || [],
      green_flags: surgical.experienceFingerprint?.qualityAnchors?.map(a => a.whyItWorks) || [],
      manufactured_signals: surgical.experienceFingerprint?.antiPatternFlags?.warnings || [],
      authenticity_markers: [],
      assessment: `Voice: ${surgical.voiceFingerprint?.tone?.primary || 'Unknown'}`,
    },

    coaching: {
      prioritized_issues: surgical.workshopItems.map((item, idx) => ({
        issue_id: item.id,
        category: item.rubric_category as any,
        severity: item.severity as any,
        title: item.problem,
        problem: item.problem,
        impact: item.why_it_matters,
        suggestions: item.suggestions?.map(s => s.text) || [],
      })),
      quick_wins: surgical.workshopItems.slice(0, 3).map((item, idx) => ({
        issue_id: `quick-win-${idx}`,
        estimated_minutes: 10,
        potential_gain: '+3-5 NQI',
      })),
      strategic_guidance: {
        focus_areas: surgical.workshopItems.slice(0, 3).map(item => item.rubric_category as any),
        estimated_time_minutes: surgical.workshopItems.length * 15,
        potential_nqi_gain: Math.min(20, surgical.workshopItems.length * 3),
      },
    },

    performance: {
      stage1_ms: surgical.performanceMetrics.stages.holistic_voice || 0,
      stage2_ms: surgical.performanceMetrics.stages.rubric_scoring || 0,
      stage3_ms: surgical.performanceMetrics.stages.locators || 0,
      stage4_ms: surgical.performanceMetrics.stages.surgical_editor || 0,
      total_ms: surgical.performanceMetrics.totalMs,
    },

    // ============================================================================
    // SURGICAL WORKSHOP DATA (COMPLETE - NO DATA LOSS)
    // ============================================================================
    voiceFingerprint: surgical.voiceFingerprint,
    experienceFingerprint: surgical.experienceFingerprint,
    rubricDimensionDetails: surgical.rubricResult.dimension_scores,
    workshopItems: surgical.workshopItems,
  };
}

/**
 * Get reader impression label from NQI score
 */
function getImpressionLabel(nqi: number): 'captivating_grounded' | 'strong_distinct_voice' | 'solid_needs_polish' | 'patchy_narrative' | 'generic_unclear' {
  if (nqi >= 85) return 'captivating_grounded';
  if (nqi >= 70) return 'strong_distinct_voice';
  if (nqi >= 55) return 'solid_needs_polish';
  if (nqi >= 40) return 'patchy_narrative';
  return 'generic_unclear';
}

/**
 * Extract basic features for compatibility
 */
function extractBasicFeatures(text: string): any {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return {
    word_count: words.length,
    voice: {
      active_verb_count: 0,
      passive_verb_count: 0,
      first_person_count: (text.match(/\b(I|my|me|mine)\b/gi) || []).length,
      buzzword_count: 0,
      passive_ratio: 0,
      sentence_variety_score: 5,
    },
    evidence: {
      number_count: (text.match(/\d+/g) || []).length,
      has_concrete_numbers: (text.match(/\d+/g) || []).length > 0,
      metric_specificity_score: 5,
    },
    arc: {
      has_stakes: text.match(/\b(challenge|problem|difficult|struggle|overcome)\b/i) !== null,
      has_turning_point: text.match(/\b(realized|learned|discovered|understood)\b/i) !== null,
      temporal_markers: [],
    },
    collaboration: {
      we_usage_count: (text.match(/\bwe\b/gi) || []).length,
      credit_given: text.match(/\b(team|together|with)\b/i) !== null,
    },
    reflection: {
      reflection_quality: text.match(/\b(realized|learned|discovered)\b/i) ? 'good' : 'superficial',
    },
  };
}

// Keep the OLD implementation ONLY as fallback when server is completely down
async function OLD_analyzePIQEntry_Fallback() {
  try {
    // Health check
    let healthCheckPassed = false;
    const healthPaths = ['/api/v1/health', '/api/health'];

    for (const path of healthPaths) {
      try {
        const healthRes = await fetch(path, { signal: AbortSignal.timeout(10000) });
        if (healthRes.ok) {
          healthCheckPassed = true;
          break;
        }
      } catch (err) {
      }
    }

    if (!healthCheckPassed) {
      // Return a heuristic-based analysis when server is not available
      return generateHeuristicFallback(essayText, promptTitle);
    }

    // Transform PIQ essay to analysis entry format
    // The backend analyzeEntry API is universal - works for any essay type
    const entry = {
      id: 'piq-' + Date.now(),
      title: promptTitle,
      category: 'personal_insight', // PIQ-specific category
      description_original: essayText,
      role: 'Student',
      organization: promptTitle,
      hours_per_week: 0,
      weeks_per_year: 0,
      tags: ['piq', 'uc_application'],
    };

    // Add PIQ-specific context to the entry
    const entryWithContext = {
      ...entry,
      piq_prompt: promptText,
      piq_title: promptTitle,
      essay_type: 'piq',
    };

    // Call the backend API
    const response = await fetch('/api/analyze-entry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entry: entryWithContext,
        options: {
          depth: options.depth || 'standard',
          skip_coaching: options.skip_coaching || false,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Analysis failed');
    }

    // Run elite pattern detection (client-side)
    const elitePatterns = analyzeElitePatterns(essayText);

    // Run literary sophistication detection (client-side)
    const literarySophistication = analyzeLiterarySophistication(essayText);

    // Transform backend result to AnalysisResult format
    const analysisResult: AnalysisResult = {
      analysis: {
        id: result.result.report.id,
        entry_id: entry.id,
        rubric_version: result.result.report.rubric_version,
        created_at: result.result.report.created_at,

        categories: result.result.report.categories.map(cat => ({
          category: mapCategoryNameToKey(cat.name),
          score: cat.score_0_to_10,
          maxScore: 10,
          comments: [cat.evaluator_notes],
          evidence: cat.evidence_snippets,
          suggestions: extractSuggestions(cat.evaluator_notes),
        })),

        weights: result.result.report.weights as Record<string, number>,
        narrative_quality_index: result.result.report.narrative_quality_index,
        reader_impression_label: result.result.report.reader_impression_label,
        flags: result.result.report.flags,
        suggested_fixes_ranked: result.result.report.suggested_fixes_ranked,
        analysis_depth: result.result.report.analysis_depth,
      },

      authenticity: {
        authenticity_score: result.result.authenticity.authenticity_score,
        voice_type: result.result.authenticity.voice_type as any,
        red_flags: result.result.authenticity.red_flags || [],
        green_flags: result.result.authenticity.green_flags || [],
        manufactured_signals: (result.result as any).authenticity?.manufactured_signals || [],
        authenticity_markers: (result.result as any).authenticity?.authenticity_markers || [],
        assessment: (result.result as any).authenticity?.assessment || '',
      },

      elite_patterns: {
        overallScore: elitePatterns.overallScore,
        tier: elitePatterns.tier,

        vulnerability: {
          score: elitePatterns.vulnerability.score,
          hasPhysicalSymptoms: elitePatterns.vulnerability.markers.some(m => m.includes('physical')),
          hasNamedEmotions: elitePatterns.vulnerability.markers.some(m => m.includes('emotion')),
          hasBeforeAfter: elitePatterns.vulnerability.markers.length > 0,
          examples: elitePatterns.vulnerability.examples,
        },

        dialogue: {
          score: elitePatterns.dialogue.hasDialogue ? 8 : 0,
          hasDialogue: elitePatterns.dialogue.hasDialogue,
          isConversational: elitePatterns.dialogue.hasDialogue,
          revealsCharacter: elitePatterns.dialogue.hasConfrontation,
          examples: elitePatterns.dialogue.quotes,
        },

        communityTransformation: {
          score: elitePatterns.communityTransformation.hasContrast ? 8 : 4,
          hasContrast: elitePatterns.communityTransformation.hasContrast,
          hasBefore: elitePatterns.communityTransformation.hasBeforeState,
          hasAfter: elitePatterns.communityTransformation.hasAfterState,
        },

        quantifiedImpact: {
          score: elitePatterns.quantifiedImpact.hasMetrics ? 8 : 0,
          hasMetrics: elitePatterns.quantifiedImpact.hasMetrics,
          metrics: elitePatterns.quantifiedImpact.metrics.map(m => m.value),
          plausibilityScore: elitePatterns.quantifiedImpact.scaleAppropriate ? 8 : 5,
        },

        microToMacro: {
          score: elitePatterns.microToMacro.score,
          hasUniversalInsight: elitePatterns.microToMacro.hasPhilosophicalInsight,
          transcendsActivity: elitePatterns.microToMacro.hasPhilosophicalInsight,
        },

        strengths: elitePatterns.strengths,
        gaps: elitePatterns.gaps,
      },

      literary_sophistication: {
        overallScore: literarySophistication.overallScore,

        extendedMetaphor: {
          score: literarySophistication.extendedMetaphor.score,
          hasMetaphor: literarySophistication.extendedMetaphor.hasMetaphor,
          isExtended: literarySophistication.extendedMetaphor.sustained,
          examples: literarySophistication.extendedMetaphor.centralImage ? [literarySophistication.extendedMetaphor.centralImage] : [],
        },

        structuralInnovation: {
          score: literarySophistication.structuralInnovation.score,
          structure: literarySophistication.structuralInnovation.innovations.join(', ') || 'standard',
          isInnovative: literarySophistication.structuralInnovation.innovations.length > 0,
        },

        sentenceRhythm: {
          score: literarySophistication.rhythmicProse.score,
          hasVariation: literarySophistication.rhythmicProse.hasVariety,
          examples: literarySophistication.rhythmicProse.hasParallelism ? ['Contains parallelism'] : [],
        },

        sensoryImmersion: {
          score: literarySophistication.sensoryImmersion.score,
          hasSensoryDetails: literarySophistication.sensoryImmersion.diverseSenses,
          examples: Object.entries(literarySophistication.sensoryImmersion.senses)
            .filter(([_, count]) => count > 0)
            .map(([sense, count]) => `${sense}: ${count}`),
        },

        activeVoice: {
          score: literarySophistication.authenticVoice.score,
          percentage: literarySophistication.authenticVoice.conversationalMarkers.length * 10,
          passiveExamples: [],
        },
      },

      coaching: result.result.coaching ? {
        prioritized_issues: (result.result.coaching.categories || []).flatMap(cat =>
          (cat.detected_issues || []).map(issue => ({
            issue_id: issue.id,
            category: mapCategoryNameToKey(cat.category_key || issue.category),
            severity: issue.severity as 'critical' | 'major' | 'minor',
            title: issue.title,
            problem: issue.problem,
            impact: issue.why_matters || issue.impact || '',
            suggestions: (issue.suggested_fixes || []).map(fix => fix.fix_text || fix),
          }))
        ),

        quick_wins: (result.result.coaching.top_priorities || []).slice(0, 3).map((priority, idx) => ({
          issue_id: `quick-win-${idx}`,
          estimated_minutes: 10,
          potential_gain: priority.impact || '+2-3 NQI',
        })),

        strategic_guidance: {
          focus_areas: (result.result.coaching.top_priorities || []).map(p => mapCategoryNameToKey(p.category)),
          estimated_time_minutes: result.result.coaching.overall?.total_issues ? result.result.coaching.overall.total_issues * 15 : 45,
          potential_nqi_gain: 10,
        },
      } : undefined,
    };

    return analysisResult;
  } catch (error) {

    // Instead of throwing, use the heuristic fallback for a better user experience
    return generateHeuristicFallback(essayText, promptTitle);
  }
}

// Helper functions (same as workshopAnalysisService)

function mapCategoryNameToKey(name: string): any {
  const base = name.replace(/\s*\([^)]*\)\s*$/,'').trim();
  const mapping: Record<string, string> = {
    'Voice Integrity': 'voice_integrity',
    'Specificity & Evidence': 'specificity_evidence',
    'Transformative Impact': 'transformative_impact',
    'Role Clarity & Ownership': 'role_clarity_ownership',
    'Narrative Arc & Stakes': 'narrative_arc_stakes',
    'Initiative & Leadership': 'initiative_leadership',
    'Community & Collaboration': 'community_collaboration',
    'Reflection & Meaning': 'reflection_meaning',
    'Craft & Language Quality': 'craft_language_quality',
    'Fit & Trajectory': 'fit_trajectory',
    'Time in Investment & Consistency': 'time_investment_consistency',
    'Transformative Impact: Self & Others': 'transformative_impact',
  };

  if (mapping[base]) {
    return mapping[base];
  }

  const snakeBase = base
    .toLowerCase()
    .replace(/[()]/g, '')
    .replace(/\s*&\s*/g, '_')
    .replace(/\s+/g, '_');
  if ((mapping as any)[snakeBase]) {
    return (mapping as any)[snakeBase];
  }

  return snakeBase;
}

function extractSuggestions(notes: string): string[] {
  const suggestions: string[] = [];
  const sentences = notes.split(/[.!?]+/).filter(s => s.trim().length > 10);

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (
      trimmed.match(/^(add|include|show|demonstrate|specify|clarify|improve|strengthen|deepen)/i) ||
      trimmed.includes('should') ||
      trimmed.includes('could') ||
      trimmed.includes('consider')
    ) {
      suggestions.push(trimmed);
    }
  }

  if (suggestions.length === 0) {
    suggestions.push('Review this category and consider how you can strengthen it');
  }

  return suggestions.slice(0, 3);
}

/**
 * Generate a heuristic-based fallback analysis when the backend is unavailable
 * This provides basic analysis without requiring the server
 */
function generateHeuristicFallback(essayText: string, promptTitle: string): AnalysisResult {
  const text = essayText;
  const wc = text.trim().split(/\s+/).filter(Boolean).length;

  // Apply LENGTH PENALTIES
  let maxScore = 10;
  if (wc < 25) maxScore = 1;
  else if (wc < 50) maxScore = 2;
  else if (wc < 100) maxScore = 4;
  else if (wc < 150) maxScore = 6;

  // Detect quality markers
  const hasStory = text.match(/\b(felt|realized|learned|discovered|struggled|wondered)\b/i);
  const hasEmotion = text.match(/\b(nervous|excited|frustrated|proud|afraid|confused|anxious|happy|sad)\b/i);
  const hasDialogue = text.includes('"') || text.includes("'");
  const hasReflection = text.match(/\b(I (learned|realized|understood|discovered))\b/i);
  const hasNumbers = text.match(/\d+/g)?.length || 0;
  const hasLeadership = text.match(/\b(led|founded|created|organized|initiated|coordinated|managed)\b/i);
  const hasCommunity = text.match(/\b(we|team|group|community|others|together|collaborative)\b/i);
  const hasImpact = text.match(/\b(changed|improved|increased|helped|taught|built|achieved)\b/i);
  const hasOwnership = text.match(/\b(I|my)\b/g)?.length || 0;
  const hasStakes = text.match(/\b(challenge|problem|struggled|difficult|failed|overcome)\b/i);

  // Calculate base score
  let base = 2; // Start a bit higher than resume bullet
  if (hasStory) base += 1;
  if (hasEmotion) base += 1.5;
  if (hasDialogue) base += 1;
  if (hasReflection) base += 1;
  if (hasNumbers > 0) base += 0.5;
  if (hasImpact) base += 0.5;
  base = Math.min(base, maxScore);

  const nqi = Math.round(base * 10);

  // Build categories
  const categories = [
    {
      category: 'voice_integrity' as any,
      score: +base.toFixed(1),
      maxScore: 10,
      comments: ['Heuristic analysis: Focus on using your authentic voice with specific sensory details.'],
      evidence: [text.slice(0, 80)],
      suggestions: ['Add sensory details and personal voice markers'],
    },
    {
      category: 'specificity_evidence' as any,
      score: +(Math.max(1, base - 0.5 + (hasNumbers > 2 ? 1 : 0))).toFixed(1),
      maxScore: 10,
      comments: [hasNumbers > 0 ? 'Has some metrics, needs more specific evidence.' : 'Needs concrete metrics and specific examples.'],
      evidence: [],
      suggestions: ['Add specific numbers and concrete examples'],
    },
    {
      category: 'transformative_impact' as any,
      score: +(Math.max(1, base - 0.5 + (hasImpact ? 1 : 0))).toFixed(1),
      maxScore: 10,
      comments: [hasImpact ? 'Shows some impact, needs before/after contrast.' : 'Needs clear transformative impact.'],
      evidence: [],
      suggestions: ['Show how you or others changed as a result'],
    },
    {
      category: 'role_clarity_ownership' as any,
      score: +(Math.max(1, base - 0.3 + (hasOwnership > 3 ? 0.5 : 0))).toFixed(1),
      maxScore: 10,
      comments: ['Clarify your specific role and ownership of actions.'],
      evidence: [],
      suggestions: ['Be specific about what YOU personally did'],
    },
    {
      category: 'narrative_arc_stakes' as any,
      score: +(Math.max(1, base - 1 + (hasStakes ? 1.5 : 0))).toFixed(1),
      maxScore: 10,
      comments: [hasStakes ? 'Has some tension, needs fuller narrative arc.' : 'Needs clear stakes and narrative progression.'],
      evidence: [],
      suggestions: ['Add a challenge, conflict, or turning point'],
    },
    {
      category: 'initiative_leadership' as any,
      score: +(Math.max(1, base - 0.5 + (hasLeadership ? 1 : 0))).toFixed(1),
      maxScore: 10,
      comments: [hasLeadership ? 'Shows initiative, add specific leadership moments.' : 'Needs clear initiative examples.'],
      evidence: [],
      suggestions: ['Show where you took initiative or led others'],
    },
    {
      category: 'community_collaboration' as any,
      score: +(Math.max(1, base - 0.5 + (hasCommunity ? 0.5 : 0))).toFixed(1),
      maxScore: 10,
      comments: [hasCommunity ? 'Mentions collaboration, needs more depth.' : 'Add community or collaborative elements.'],
      evidence: [],
      suggestions: ['Describe how you worked with others'],
    },
    {
      category: 'reflection_meaning' as any,
      score: +(Math.max(0, base - 1 + (hasReflection ? 1 : 0))).toFixed(1),
      maxScore: 10,
      comments: [hasReflection ? 'Has basic reflection, deepen with transferable insights.' : 'Add deeper reflection on meaning.'],
      evidence: [],
      suggestions: ['Reflect on what this experience taught you'],
    },
    {
      category: 'craft_language_quality' as any,
      score: +(Math.max(1, base - 0.5 + (hasDialogue ? 1 : 0) + (wc > 200 ? 0.5 : 0))).toFixed(1),
      maxScore: 10,
      comments: ['Focus on varied sentence structure and vivid language.'],
      evidence: [],
      suggestions: ['Use varied sentences and vivid descriptions'],
    },
    {
      category: 'fit_trajectory' as any,
      score: +(Math.max(1, base - 0.5)).toFixed(1),
      maxScore: 10,
      comments: ['Connect this experience to your broader interests and goals.'],
      evidence: [],
      suggestions: ['Show how this connects to your future'],
    },
    {
      category: 'time_investment_consistency' as any,
      score: +(Math.max(1, base - 0.3)).toFixed(1),
      maxScore: 10,
      comments: ['Show sustained commitment over time.'],
      evidence: [],
      suggestions: ['Mention duration and consistency of involvement'],
    },
  ];

  return {
    analysis: {
      id: 'heuristic-' + Date.now(),
      entry_id: 'piq-' + Date.now(),
      rubric_version: '1.0.0',
      created_at: new Date().toISOString(),
      categories,
      weights: {
        voice_integrity: 0.10,
        specificity_evidence: 0.09,
        transformative_impact: 0.12,
        role_clarity_ownership: 0.08,
        narrative_arc_stakes: 0.10,
        initiative_leadership: 0.10,
        community_collaboration: 0.08,
        reflection_meaning: 0.12,
        craft_language_quality: 0.07,
        fit_trajectory: 0.07,
        time_investment_consistency: 0.07,
      },
      narrative_quality_index: nqi,
      reader_impression_label: nqi >= 70 ? 'solid_needs_polish' : nqi >= 40 ? 'patchy_narrative' : 'generic_unclear',
      flags: ['heuristic_fallback', ...(wc < 100 ? ['too_short'] : []), ...(wc < 50 ? ['critically_short'] : [])],
      suggested_fixes_ranked: [
        'Add story elements (emotion, dialogue, reflection)',
        'Add concrete numbers and outcomes',
        'Deepen your reflection with transferable insights'
      ],
      analysis_depth: 'quick' as const,
    },
    authenticity: {
      authenticity_score: Math.max(3, Math.min(7, base)),
      voice_type: wc < 50 ? 'robotic' : (hasStory || hasEmotion ? 'conversational' : 'essay') as any,
      red_flags: [...(wc < 80 ? ['too_short'] : []), ...(!hasReflection ? ['no_reflection'] : [])],
      green_flags: [...(hasStory ? ['story_elements'] : []), ...(hasEmotion ? ['emotional_depth'] : [])],
      manufactured_signals: [],
      authenticity_markers: [],
      assessment: 'Heuristic analysis - server unavailable',
    },
    elite_patterns: {
      overallScore: Math.round(base * 8),
      tier: nqi >= 70 ? 2 : 3,
      vulnerability: {
        score: hasEmotion ? 5 : 2,
        hasPhysicalSymptoms: false,
        hasNamedEmotions: !!hasEmotion,
        hasBeforeAfter: false,
        examples: [],
      },
      dialogue: {
        score: hasDialogue ? 6 : 0,
        hasDialogue,
        isConversational: hasDialogue,
        revealsCharacter: false,
        examples: [],
      },
      communityTransformation: {
        score: hasImpact ? 5 : 2,
        hasContrast: false,
        hasBefore: false,
        hasAfter: !!hasImpact,
      },
      quantifiedImpact: {
        score: hasNumbers > 0 ? 5 : 0,
        hasMetrics: hasNumbers > 0,
        metrics: [],
        plausibilityScore: 5,
      },
      microToMacro: {
        score: hasReflection ? 5 : 2,
        hasUniversalInsight: false,
        transcendsActivity: false,
      },
      strengths: [],
      gaps: ['Add vulnerability', 'Include dialogue', 'Show transformation'],
    },
    literary_sophistication: {
      overallScore: Math.round(base * 7),
      extendedMetaphor: {
        score: 2,
        hasMetaphor: false,
        isExtended: false,
        examples: [],
      },
      structuralInnovation: {
        score: 3,
        structure: 'standard',
        isInnovative: false,
      },
      sentenceRhythm: {
        score: 4,
        hasVariation: true,
        examples: [],
      },
      sensoryImmersion: {
        score: hasEmotion ? 4 : 2,
        hasSensoryDetails: !!hasEmotion,
        examples: [],
      },
      activeVoice: {
        score: 5,
        percentage: 60,
        passiveExamples: [],
      },
    },
    coaching: {
      prioritized_issues: categories.slice(0, 3).map((cat, idx) => ({
        issue_id: `heuristic-${cat.category}-${idx}`,
        category: cat.category,
        severity: cat.score < 3 ? 'critical' as const : 'major' as const,
        title: cat.comments[0] || 'Needs improvement',
        problem: cat.comments[0] || '',
        impact: '+5-10 NQI potential',
        suggestions: cat.suggestions,
      })),
      quick_wins: [
        { issue_id: 'quick-1', estimated_minutes: 10, potential_gain: '+5-8 NQI' },
        { issue_id: 'quick-2', estimated_minutes: 10, potential_gain: '+3-5 NQI' },
      ],
      strategic_guidance: {
        focus_areas: ['voice_integrity', 'reflection_meaning', 'narrative_arc_stakes'],
        estimated_time_minutes: 45,
        potential_nqi_gain: 20,
      },
    },
  };
}
