/**
 * Workshop Generator Adapter
 *
 * Generates high-quality rewrite suggestions constrained by the student's
 * actual experiences and reflections. Focuses on rearranging/polishing
 * rather than inventing new content.
 *
 * Design Philosophy:
 * - Preserve student voice and authenticity
 * - Generate 2-3 distinct candidates with different styles
 * - Base rewrites on user's reflection answers (if provided)
 * - Show clear rationale for each candidate
 * - Estimate score improvement for each option
 */

import { generateEssay, transformEssay, GenerationProfile, GenerationResult } from '@/core/generation/essayGenerator';
import { ExperienceEntry } from '@/core/types/experience';
import { WorkshopIssue } from './workshopAnalyzer';
import { ReflectionPromptSet } from './reflectionPrompts';
import { analyzeEntry } from '@/core/analysis/engine';

// ============================================================================
// TYPES
// ============================================================================

export interface RewriteRequest {
  originalEntry: ExperienceEntry;
  targetIssues: WorkshopIssue[];                    // Issues to focus on fixing
  userReflections?: ReflectionAnswers;              // Answers to reflection prompts
  stylePreference?: 'concise' | 'warm' | 'action'; // User's voice preference
  targetTier?: 1 | 2 | 3;                           // 1=Ivy, 2=Top UC, 3=Competitive
}

export interface ReflectionAnswers {
  [issueId: string]: {
    [promptId: string]: string;                     // User's answer to each prompt
  };
}

export interface RewriteCandidate {
  id: string;
  text: string;
  style: 'concise_operator' | 'warm_reflective' | 'action_arc';
  styleLabel: string;
  rationale: string;                                // Why this version works
  literaryTechniques: string[];                     // Techniques used
  estimatedScoreGain: number;                       // Predicted NQI improvement
  improvementsApplied: string[];                    // What changed from original
  preservedElements: string[];                      // What stayed the same (authenticity markers)
}

export interface RewriteOutput {
  candidates: RewriteCandidate[];                   // 2-3 options
  comparisonView: {
    before: string;
    after: string[];                                // One for each candidate
    highlightedChanges: ChangeHighlight[];
  };
  generationMetadata: {
    originalScore: number;
    targetScore: number;
    focusIssues: string[];
    userReflectionsUsed: boolean;
    timestamp: string;
  };
}

export interface ChangeHighlight {
  candidateId: string;
  changeType: 'addition' | 'removal' | 'modification';
  before: string;
  after: string;
  rationale: string;
}

// ============================================================================
// MAIN GENERATION FUNCTION
// ============================================================================

/**
 * Generate 2-3 rewrite candidates based on detected issues and user reflections
 */
export async function generateRewriteCandidates(
  request: RewriteRequest
): Promise<RewriteOutput> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`GENERATING REWRITE CANDIDATES`);
  console.log(`Original: "${request.originalEntry.description_original}"`);
  console.log(`Target Issues: ${request.targetIssues.map(i => i.title).join(', ')}`);
  console.log(`User Reflections: ${request.userReflections ? 'Yes' : 'No'}`);
  console.log(`${'='.repeat(80)}\n`);

  // ============================================================================
  // STEP 1: Analyze original to get baseline score
  // ============================================================================

  console.log('Step 1: Analyzing original draft...');
  const originalAnalysis = await analyzeEntry(request.originalEntry, {
    depth: 'quick',
    skip_coaching: true,
  });
  const originalScore = originalAnalysis.report.narrative_quality_index;
  console.log(`  Original NQI: ${originalScore}/100\n`);

  // ============================================================================
  // STEP 2: Build generation profiles for each style
  // ============================================================================

  console.log('Step 2: Building generation profiles...');
  const profiles = buildGenerationProfiles(request, originalScore);
  console.log(`  Generated ${profiles.length} style profiles\n`);

  // ============================================================================
  // STEP 3: Generate candidates in parallel
  // ============================================================================

  console.log('Step 3: Generating candidates (parallel)...');
  const generationPromises = profiles.map(profile =>
    generateCandidate(profile, request)
  );

  const results = await Promise.all(generationPromises);
  console.log(`  ✓ Generated ${results.length} candidates\n`);

  // ============================================================================
  // STEP 4: Analyze candidates and estimate scores
  // ============================================================================

  console.log('Step 4: Analyzing candidates...');
  const candidates = await analyzeCandidates(
    results,
    request.originalEntry,
    originalScore
  );
  console.log(`  ✓ Analyzed ${candidates.length} candidates\n`);

  // ============================================================================
  // STEP 5: Build comparison view
  // ============================================================================

  console.log('Step 5: Building comparison view...');
  const comparisonView = buildComparisonView(
    request.originalEntry.description_original,
    candidates
  );
  console.log(`  ✓ Comparison view ready\n`);

  // ============================================================================
  // STEP 6: Assemble output
  // ============================================================================

  const output: RewriteOutput = {
    candidates,
    comparisonView,
    generationMetadata: {
      originalScore,
      targetScore: originalScore + 15, // Target +15 improvement
      focusIssues: request.targetIssues.map(i => i.title),
      userReflectionsUsed: !!request.userReflections,
      timestamp: new Date().toISOString(),
    },
  };

  console.log(`${'='.repeat(80)}`);
  console.log(`GENERATION COMPLETE`);
  console.log(`Candidates: ${candidates.length}`);
  console.log(`Estimated Improvements: ${candidates.map(c => `+${c.estimatedScoreGain}`).join(', ')}`);
  console.log(`${'='.repeat(80)}\n`);

  return output;
}

// ============================================================================
// PROFILE BUILDING
// ============================================================================

/**
 * Build generation profiles for different writing styles
 */
function buildGenerationProfiles(
  request: RewriteRequest,
  originalScore: number
): GenerationProfile[] {
  const entry = request.originalEntry;

  // Extract content from original and reflections
  const content = extractContentFromReflections(
    entry,
    request.userReflections,
    request.targetIssues
  );

  // Base profile (shared across all styles)
  const baseProfile: Partial<GenerationProfile> = {
    activityType: mapCategoryToActivityType(entry.category),
    role: entry.role || 'participant',
    duration: entry.time_span || 'not specified',
    hoursPerWeek: entry.hours_per_week || 0,
    achievements: content.achievements,
    challenges: content.challenges,
    relationships: content.relationships,
    impact: content.impact,
    targetTier: request.targetTier || inferTargetTier(originalScore),
    avoidClichés: true,
  };

  // Generate 3 style variants
  const profiles: GenerationProfile[] = [
    // Style 1: Concise Operator (action-focused, metric-heavy)
    {
      ...baseProfile,
      studentVoice: 'conversational',
      riskTolerance: 'low',
      academicStrength: 'strong',
      literaryTechniques: ['inMediasRes', 'dualScene'],
      generateAngle: false, // Keep it grounded
    } as GenerationProfile,

    // Style 2: Warm Reflective (introspective, relationship-focused)
    {
      ...baseProfile,
      studentVoice: 'introspective',
      riskTolerance: 'medium',
      academicStrength: 'strong',
      literaryTechniques: ['extendedMetaphor', 'dualScene'],
      generateAngle: false,
    } as GenerationProfile,

    // Style 3: Action Arc (narrative-driven, stakes-focused)
    {
      ...baseProfile,
      studentVoice: 'conversational',
      riskTolerance: 'medium',
      academicStrength: 'strong',
      literaryTechniques: ['inMediasRes', 'montageStructure'],
      generateAngle: false,
    } as GenerationProfile,
  ];

  return profiles;
}

/**
 * Extract structured content from reflection answers
 */
function extractContentFromReflections(
  entry: ExperienceEntry,
  reflections: ReflectionAnswers | undefined,
  targetIssues: WorkshopIssue[]
): {
  achievements: string[];
  challenges: string[];
  relationships: string[];
  impact: string[];
} {
  const content = {
    achievements: [] as string[],
    challenges: [] as string[],
    relationships: [] as string[],
    impact: [] as string[],
  };

  // Parse original description for baseline content
  const originalText = entry.description_original;
  content.achievements.push(originalText); // Include original as baseline

  // If user provided reflections, extract details
  if (reflections) {
    for (const issueId of Object.keys(reflections)) {
      const answers = reflections[issueId];

      for (const answer of Object.values(answers)) {
        if (!answer || answer.length < 10) continue;

        // Classify answer based on content
        const lowerAnswer = answer.toLowerCase();

        if (lowerAnswer.match(/\d+|metric|hour|people|raised|completed/)) {
          content.achievements.push(answer);
        } else if (lowerAnswer.match(/hard|difficult|challenge|wrong|fail|obstacle/)) {
          content.challenges.push(answer);
        } else if (lowerAnswer.match(/\bteach|\blearn|\btaught|\bmentor|\bhelp|relationship|person|friend|team/)) {
          content.relationships.push(answer);
        } else if (lowerAnswer.match(/impact|change|improve|result|outcome|effect/)) {
          content.impact.push(answer);
        } else {
          // Default: add to achievements
          content.achievements.push(answer);
        }
      }
    }
  }

  // Deduplicate
  content.achievements = [...new Set(content.achievements)];
  content.challenges = [...new Set(content.challenges)];
  content.relationships = [...new Set(content.relationships)];
  content.impact = [...new Set(content.impact)];

  return content;
}

// ============================================================================
// CANDIDATE GENERATION
// ============================================================================

/**
 * Generate a single candidate using essay generator
 */
async function generateCandidate(
  profile: GenerationProfile,
  request: RewriteRequest
): Promise<GenerationResult & { styleLabel: string }> {
  const styleLabels = {
    conversational: profile.literaryTechniques.includes('extendedMetaphor')
      ? 'Warm Reflective'
      : profile.literaryTechniques.includes('montageStructure')
        ? 'Action Arc'
        : 'Concise Operator',
    introspective: 'Warm Reflective',
  };

  const styleLabel = styleLabels[profile.studentVoice] || 'Balanced';

  console.log(`  Generating: ${styleLabel}...`);

  // Use transformEssay for more controlled improvement
  const result = await transformEssay(
    request.originalEntry.description_original,
    profile
  );

  return {
    ...result,
    styleLabel,
  };
}

/**
 * Analyze candidates and build structured output
 */
async function analyzeCandidates(
  results: Array<GenerationResult & { styleLabel: string }>,
  originalEntry: ExperienceEntry,
  originalScore: number
): Promise<RewriteCandidate[]> {
  const candidates: RewriteCandidate[] = [];

  for (let i = 0; i < results.length; i++) {
    const result = results[i];

    console.log(`  Analyzing candidate ${i + 1}: ${result.styleLabel}...`);

    // Quick analysis to estimate score
    const candidateEntry = { ...originalEntry, description_original: result.essay };
    const analysis = await analyzeEntry(candidateEntry, {
      depth: 'quick',
      skip_coaching: true,
    });

    const estimatedScore = analysis.report.narrative_quality_index;
    const scoreGain = estimatedScore - originalScore;

    console.log(`    Score: ${originalScore} → ${estimatedScore} (+${scoreGain})`);

    // Build rationale
    const rationale = buildRationale(result, scoreGain);

    // Identify improvements
    const improvements = identifyImprovements(
      originalEntry.description_original,
      result.essay
    );

    // Identify preserved elements (authenticity check)
    const preserved = identifyPreservedElements(
      originalEntry.description_original,
      result.essay
    );

    candidates.push({
      id: `candidate-${i + 1}`,
      text: result.essay,
      style: mapStyleLabel(result.styleLabel),
      styleLabel: result.styleLabel,
      rationale,
      literaryTechniques: result.techniquesUsed,
      estimatedScoreGain: scoreGain,
      improvementsApplied: improvements,
      preservedElements: preserved,
    });
  }

  // Sort by estimated score gain (best first)
  candidates.sort((a, b) => b.estimatedScoreGain - a.estimatedScoreGain);

  return candidates;
}

function mapStyleLabel(label: string): 'concise_operator' | 'warm_reflective' | 'action_arc' {
  if (label.includes('Concise')) return 'concise_operator';
  if (label.includes('Warm') || label.includes('Reflective')) return 'warm_reflective';
  return 'action_arc';
}

function buildRationale(result: GenerationResult, scoreGain: number): string {
  const strengths = result.strengths.slice(0, 3).join(', ');
  return `This version improves your score by approximately ${scoreGain} points. Key improvements: ${strengths}.`;
}

/**
 * Identify what changed (additions, clarifications, structure)
 */
function identifyImprovements(original: string, rewrite: string): string[] {
  const improvements: string[] = [];

  // Check for metrics
  const originalNumbers = original.match(/\d+/g)?.length || 0;
  const rewriteNumbers = rewrite.match(/\d+/g)?.length || 0;
  if (rewriteNumbers > originalNumbers) {
    improvements.push(`Added ${rewriteNumbers - originalNumbers} specific metric(s)`);
  }

  // Check for active voice
  const originalPassive = (original.match(/\bwas\b|\bwere\b|\bbeen\b/gi) || []).length;
  const rewritePassive = (rewrite.match(/\bwas\b|\bwere\b|\bbeen\b/gi) || []).length;
  if (rewritePassive < originalPassive) {
    improvements.push('Converted to active voice');
  }

  // Check for sentence variety
  const originalSentences = original.split(/[.!?]/).length;
  const rewriteSentences = rewrite.split(/[.!?]/).length;
  if (Math.abs(rewriteSentences - originalSentences) > 2) {
    improvements.push('Improved sentence variety and structure');
  }

  // Check for dialogue
  if (!original.includes('"') && rewrite.includes('"')) {
    improvements.push('Added quoted dialogue');
  }

  // Check for reflection language
  const reflectionMarkers = /\blearn|\brealize|\bunderstand|\bbelieve|\bthink/gi;
  const originalReflection = (original.match(reflectionMarkers) || []).length;
  const rewriteReflection = (rewrite.match(reflectionMarkers) || []).length;
  if (rewriteReflection > originalReflection) {
    improvements.push('Deepened reflection');
  }

  if (improvements.length === 0) {
    improvements.push('Refined language and clarity');
  }

  return improvements;
}

/**
 * Identify what stayed the same (authenticity preservation)
 */
function identifyPreservedElements(original: string, rewrite: string): string[] {
  const preserved: string[] = [];

  // Check for preserved key phrases (3+ word sequences)
  const originalPhrases = original.toLowerCase().match(/\b\w+\s+\w+\s+\w+\b/g) || [];
  const rewritePhrases = rewrite.toLowerCase().match(/\b\w+\s+\w+\s+\w+\b/g) || [];

  const commonPhrases = originalPhrases.filter(phrase => rewritePhrases.includes(phrase));
  if (commonPhrases.length > 0) {
    preserved.push(`Core content and voice preserved`);
  }

  // Check for preserved proper nouns (names, organizations)
  const originalNames = original.match(/\b[A-Z][a-z]+\b/g) || [];
  const rewriteNames = rewrite.match(/\b[A-Z][a-z]+\b/g) || [];
  const commonNames = originalNames.filter(name => rewriteNames.includes(name));
  if (commonNames.length > 0) {
    preserved.push(`Specific people/organizations maintained (${commonNames.join(', ')})`);
  }

  // Check for preserved metrics
  const originalMetrics = original.match(/\d+/g) || [];
  const rewriteMetrics = rewrite.match(/\d+/g) || [];
  const commonMetrics = originalMetrics.filter(m => rewriteMetrics.includes(m));
  if (commonMetrics.length > 0) {
    preserved.push(`Original metrics retained`);
  }

  return preserved;
}

// ============================================================================
// COMPARISON VIEW
// ============================================================================

function buildComparisonView(
  original: string,
  candidates: RewriteCandidate[]
): {
  before: string;
  after: string[];
  highlightedChanges: ChangeHighlight[];
} {
  return {
    before: original,
    after: candidates.map(c => c.text),
    highlightedChanges: [], // TODO: Implement detailed diff highlighting
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function mapCategoryToActivityType(
  category: string
): 'academic' | 'service' | 'arts' | 'athletics' | 'work' | 'advocacy' {
  const mapping: Record<string, 'academic' | 'service' | 'arts' | 'athletics' | 'work' | 'advocacy'> = {
    leadership: 'academic',
    service: 'service',
    research: 'academic',
    athletics: 'athletics',
    arts: 'arts',
    academic: 'academic',
    work: 'work',
  };

  return mapping[category.toLowerCase()] || 'academic';
}

function inferTargetTier(originalScore: number): 1 | 2 | 3 {
  if (originalScore >= 70) return 1; // Already strong, aim for Ivy
  if (originalScore >= 50) return 2; // Decent, aim for Top UC
  return 3; // Weak, aim for competitive
}
