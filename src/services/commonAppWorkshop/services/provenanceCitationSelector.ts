/**
 * Citation Selector Service
 *
 * Dynamically selects the most relevant citations for each student's situation.
 *
 * **Purpose**: When a student has an issue (e.g., "classroom-only learning"),
 * automatically pick the BEST citations to:
 * 1. Explain why it's a problem
 * 2. Show how confident we are
 * 3. Teach how to fix it
 *
 * **For Students**: This ensures you see the most relevant research/quotes
 * for YOUR specific situation, not just generic advice.
 *
 * **OPTIMIZATION (v2)**:
 * Now integrated with SmartSourceSelector for O(1) pre-indexed lookups.
 * Falls back to legacy keyword matching if optimized system unavailable.
 */

import type {
  CitationContext,
  SelectedCitation,
  ProvenanceSource,
  CitationUse,
  ValueWeightProvenance,
} from '../types/provenanceTypes';

import { getAllStanfordProvenances } from '../data/provenanceData/stanfordProvenance';

// Import optimized source selection system
import {
  SmartSourceSelector,
  getSmartSourceSelector,
} from './smartSourceSelector';
import type { CollegeId, ClicheSymptomType } from '../types/labeledSourceTypes';

// ============================================================================
// CITATION SELECTOR SERVICE
// ============================================================================

export class CitationSelector {
  // Cache of all available citations by college
  private citationCache: Map<string, ProvenanceSource[]> = new Map();

  // Optimized source selector (pre-indexed, O(1) lookups)
  private smartSelector: SmartSourceSelector | null = null;

  // Track whether optimized system is available
  private useOptimizedSystem: boolean = false;

  constructor() {
    // Pre-load Stanford citations (legacy system)
    this.loadStanfordCitations();

    // Initialize optimized system
    this.initializeOptimizedSystem();
  }

  /**
   * Initialize the optimized SmartSourceSelector
   * Falls back to legacy if initialization fails
   */
  private initializeOptimizedSystem(): void {
    try {
      this.smartSelector = getSmartSourceSelector();
      const stats = this.smartSelector.getStats();

      // Only use optimized system if we have sufficient sources
      if (stats.totalSources >= 5 && stats.issueTypesCovered >= 3) {
        this.useOptimizedSystem = true;
        console.log(`[CitationSelector] Optimized system enabled: ${stats.totalSources} sources indexed`);
      } else {
        console.log(`[CitationSelector] Optimized system available but limited coverage, using hybrid mode`);
        this.useOptimizedSystem = true; // Still use for what we have
      }
    } catch (error) {
      console.warn('[CitationSelector] Optimized system unavailable, using legacy:', error);
      this.useOptimizedSystem = false;
    }
  }

  /**
   * Select best citations for a student's issue
   *
   * Example: Student has CLASS_BASED_ONLY red flag
   * Returns: Dean Shaw quote about self-directed learning + IV weight provenance
   *
   * @param context - Information about the student's issue
   * @returns Top 3-5 most relevant citations with explanations
   *
   * **OPTIMIZATION**: Now uses SmartSourceSelector for O(1) pre-indexed lookups
   * when available. Falls back to legacy keyword matching otherwise.
   */
  selectCitationsForIssue(context: CitationContext): SelectedCitation[] {
    // Try optimized system first
    if (this.useOptimizedSystem && this.smartSelector) {
      const optimizedResult = this.selectCitationsOptimized(context);
      if (optimizedResult.length > 0) {
        return optimizedResult;
      }
      // Fall through to legacy if optimized returns nothing
    }

    // Legacy path: keyword-based matching
    return this.selectCitationsLegacy(context);
  }

  /**
   * Optimized citation selection using pre-indexed SmartSourceSelector
   * O(1) lookup instead of O(n) keyword matching
   */
  private selectCitationsOptimized(context: CitationContext): SelectedCitation[] {
    if (!this.smartSelector) return [];

    // Map issue type to ClicheSymptomType
    const issueType = this.mapIssueToSymptomType(context.issue_detected);
    if (!issueType) {
      // Issue type not mapped, fall back to legacy
      return [];
    }

    // Map college_id to CollegeId (if supported)
    const collegeId = this.mapCollegeId(context.college_id);

    // Use SmartSourceSelector for O(1) lookup
    const bundle = this.smartSelector.selectForIssue(
      { symptom_type: issueType },
      collegeId,
      {
        max_sources: context.severity === 'critical' ? 5 : 3,
        min_relevance_score: 40,
        require_author_diversity: true,
        prioritize_college_specific: true,
      }
    );

    // Convert LabeledSource bundle to SelectedCitation format
    const citations: SelectedCitation[] = [];

    // Add primary source
    citations.push(this.labeledSourceToSelectedCitation(
      bundle.primary,
      1,
      context,
      this.determineUseFromIssueType(issueType)
    ));

    // Add supporting sources
    bundle.supporting.forEach((source, index) => {
      citations.push(this.labeledSourceToSelectedCitation(
        source,
        index + 2,
        context,
        'teach_technique'
      ));
    });

    return citations;
  }

  /**
   * Legacy citation selection (keyword-based matching)
   * Kept for backward compatibility and fallback
   */
  private selectCitationsLegacy(context: CitationContext): SelectedCitation[] {
    // Get all available citations for this college
    const allCitations = this.getAllCitations(context.college_id);

    if (allCitations.length === 0) {
      console.warn(`No citations available for college: ${context.college_id}`);
      return [];
    }

    // Score each citation for relevance to THIS issue
    const scored = allCitations.map((citation) => ({
      citation,
      relevance_score: this.scoreRelevance(citation, context),
      use_for: this.determineUse(citation, context),
    }));

    // Sort by relevance, take top citations
    const topCount = context.severity === 'critical' ? 5 : 3;
    const topCitations = scored
      .filter((item) => item.relevance_score > 30) // Minimum relevance threshold
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, topCount);

    // Convert to SelectedCitation format with student-friendly explanations
    return topCitations.map((item, index) => this.formatCitation(item, index + 1, context));
  }

  /**
   * Map issue string to ClicheSymptomType for optimized lookup
   */
  private mapIssueToSymptomType(issue: string): ClicheSymptomType | null {
    // Map common issue types to ClicheSymptomType
    const mapping: Record<string, ClicheSymptomType> = {
      // Direct mappings
      'cliche_metaphor': 'cliche_metaphor',
      'telling_not_showing': 'telling_not_showing',
      'cliche_topic_framing': 'cliche_topic_framing',
      'cliche_narrative_arc': 'cliche_narrative_arc',
      'cliche_ai_convergence': 'cliche_ai_convergence',
      'cliche_essay_formula': 'cliche_essay_formula',
      'cliche_college_specific': 'cliche_college_specific',
      'cliche_value_signaling': 'cliche_value_signaling',
      'cliche_inspirational': 'cliche_inspirational',
      'cliche_language': 'cliche_language',

      // Legacy issue mappings
      'CLASS_BASED_ONLY': 'telling_not_showing',
      'GENERIC_STATEMENTS': 'cliche_language',
      'RESUME_REPETITION': 'telling_not_showing',
      'LACKS_VOICE': 'cliche_language',
      'VAGUE_CLAIMS': 'telling_not_showing',
      'GENERIC': 'cliche_language',
    };

    return mapping[issue] || null;
  }

  /**
   * Map college_id string to CollegeId type
   */
  private mapCollegeId(collegeId: string): CollegeId {
    // Direct mapping for supported colleges
    const supportedColleges: CollegeId[] = [
      'stanford', 'harvard', 'mit', 'uchicago', 'duke', 'yale',
      'princeton', 'columbia', 'penn', 'brown', 'dartmouth', 'cornell',
      'caltech', 'northwestern', 'johns_hopkins', 'uva', 'tulane',
      'harvey_mudd', 'gmu'
    ];

    if (supportedColleges.includes(collegeId as CollegeId)) {
      return collegeId as CollegeId;
    }

    // Default to stanford for unsupported colleges (best coverage)
    return 'stanford';
  }

  /**
   * Convert LabeledSource to SelectedCitation format
   */
  private labeledSourceToSelectedCitation(
    source: import('../types/labeledSourceTypes').LabeledSource,
    priority: number,
    context: CitationContext,
    useFor: CitationUse
  ): SelectedCitation {
    return {
      citation: {
        source_id: source.source_id,
        type: source.type,
        title: source.title,
        author: source.author,
        author_title: source.author_title,
        publication: source.publication,
        date: source.date,
        quote: source.quote,
        finding: source.finding,
        url: source.url,
        relevance_to_claim: source.relevance_to_claim,
        last_verified: source.last_verified,
        weight_in_calculation: source.weight_in_calculation,
      },
      relevance: {
        score: this.calculateLabeledSourceScore(source, context.issue_detected),
        reason: this.explainLabeledSourceRelevance(source, context),
        use_for: useFor,
      },
      presentation: {
        simplified_version: this.simplifyLabeledSource(source),
        full_version: this.fullVersionLabeledSource(source),
        display_priority: priority,
      },
    };
  }

  /**
   * Calculate relevance score from LabeledSource pre-computed data
   */
  private calculateLabeledSourceScore(
    source: import('../types/labeledSourceTypes').LabeledSource,
    issue: string
  ): number {
    const symptomType = this.mapIssueToSymptomType(issue);
    if (!symptomType || !source.issue_relevance[symptomType]) {
      return 60; // Default score for unmapped issues
    }
    return source.issue_relevance[symptomType].score;
  }

  /**
   * Explain relevance using LabeledSource taxonomy
   */
  private explainLabeledSourceRelevance(
    source: import('../types/labeledSourceTypes').LabeledSource,
    context: CitationContext
  ): string {
    // Use source's usage context for explanation
    const primaryCategory = source.taxonomy.primary_category;

    if (source.college_specificity.primary_college === context.college_id) {
      return `Official ${context.college_id} guidance on ${primaryCategory}`;
    }

    if (source.type === 'dean_quote' && source.author) {
      return `${source.author} directly addresses ${primaryCategory}`;
    }

    if (source.type === 'internal_analysis') {
      return `Research on ${primaryCategory} patterns in elite essays`;
    }

    return `Expert perspective on ${primaryCategory}`;
  }

  /**
   * Simplify LabeledSource for student-friendly display
   */
  private simplifyLabeledSource(source: import('../types/labeledSourceTypes').LabeledSource): string {
    if (source.type === 'dean_quote' && source.quote) {
      const author = source.author || 'An admissions dean';
      return `${author} said: "${source.quote.substring(0, 100)}${source.quote.length > 100 ? '...' : ''}"`;
    }

    if (source.type === 'internal_analysis' && source.finding) {
      const percentMatch = source.finding.match(/(\d+)%/);
      if (percentMatch) {
        return `${percentMatch[1]}% of successful essays demonstrate this quality`;
      }
    }

    return source.relevance_to_claim || 'Expert guidance on this topic';
  }

  /**
   * Full version of LabeledSource with all details
   */
  private fullVersionLabeledSource(source: import('../types/labeledSourceTypes').LabeledSource): string {
    const parts: string[] = [];

    if (source.author) {
      let authorLine = source.author;
      if (source.author_title) authorLine += ` (${source.author_title})`;
      parts.push(authorLine);
    }

    if (source.quote) {
      parts.push(`"${source.quote}"`);
    } else if (source.finding) {
      parts.push(source.finding);
    }

    if (source.publication && source.date) {
      parts.push(`Source: ${source.publication}, ${source.date}`);
    }

    if (source.url) {
      parts.push(`Link: ${source.url}`);
    }

    return parts.join('\n');
  }

  /**
   * Determine CitationUse from symptom type
   */
  private determineUseFromIssueType(issueType: ClicheSymptomType): CitationUse {
    const useMapping: Record<ClicheSymptomType, CitationUse> = {
      'cliche_metaphor': 'explain_problem',
      'telling_not_showing': 'teach_technique',
      'cliche_topic_framing': 'explain_problem',
      'cliche_narrative_arc': 'explain_problem',
      'cliche_ai_convergence': 'justify_severity',
      'cliche_essay_formula': 'explain_problem',
      'cliche_college_specific': 'explain_problem',
      'cliche_value_signaling': 'teach_technique',
      'cliche_inspirational': 'explain_problem',
      'cliche_language': 'teach_technique',
    };
    return useMapping[issueType] || 'teach_technique';
  }

  /**
   * Get citations specifically for proving a weight
   *
   * Example: Student asks "How do you know IV is 40%?"
   * Returns: Full provenance with dean quotes and methodology
   *
   * **OPTIMIZATION**: Now uses SmartSourceSelector for weight proofs
   * when available.
   */
  selectWeightProof(college_id: string, value_id: string): SelectedCitation[] {
    // Try optimized system first for weight proofs
    if (this.useOptimizedSystem && this.smartSelector) {
      const collegeId = this.mapCollegeId(college_id);
      const bundle = this.smartSelector.selectForWeightProof(value_id, collegeId);

      if (bundle.primary) {
        const citations: SelectedCitation[] = [];

        // Add primary source
        citations.push({
          citation: bundle.primary,
          relevance: {
            score: 95,
            reason: `Primary source for ${value_id} weight calculation`,
            use_for: 'prove_weight' as CitationUse,
          },
          presentation: {
            simplified_version: this.simplifyLabeledSource(bundle.primary),
            full_version: this.fullVersionLabeledSource(bundle.primary),
            display_priority: 1,
          },
        });

        // Add supporting sources
        bundle.supporting.forEach((source, index) => {
          citations.push({
            citation: source,
            relevance: {
              score: 85,
              reason: `Supporting evidence for ${value_id} weight`,
              use_for: 'prove_weight' as CitationUse,
            },
            presentation: {
              simplified_version: this.simplifyLabeledSource(source),
              full_version: this.fullVersionLabeledSource(source),
              display_priority: index + 2,
            },
          });
        });

        if (citations.length > 0) {
          return citations;
        }
      }
    }

    // Legacy path
    const provenances = this.getProvenances(college_id);
    const provenance = provenances.find((p) => p.value_id === value_id);

    if (!provenance) {
      return [];
    }

    // Return primary sources as citations
    return provenance.primary_sources.map((source, index) => ({
      citation: source,
      relevance: {
        score: 95, // Weight proofs are always highly relevant
        reason: this.explainWeightRelevance(source, provenance),
        use_for: 'prove_weight' as CitationUse,
      },
      presentation: {
        simplified_version: this.simplify(source),
        full_version: this.fullVersion(source),
        display_priority: index + 1,
      },
    }));
  }

  // ==========================================================================
  // RELEVANCE SCORING
  // ==========================================================================

  /**
   * Score how relevant a citation is (0-100)
   *
   * Factors:
   * - Issue match (40 points): Does citation address this specific issue?
   * - Source authority (30 points): Dean quote > Official > Analysis
   * - Recency (20 points): How recent is the data?
   * - Specificity (10 points): How specific is the quote/finding?
   */
  private scoreRelevance(
    citation: ProvenanceSource,
    context: CitationContext
  ): number {
    let score = 0;

    // Factor 1: Issue match (40 points)
    const issueMatchScore = this.scoreIssueMatch(citation, context.issue_detected);
    score += issueMatchScore * 0.4;

    // Factor 2: Source authority (30 points)
    score += this.scoreAuthority(citation.type) * 0.3;

    // Factor 3: Recency (20 points)
    score += this.scoreRecency(citation.date || '2020-01-01') * 0.2;

    // Factor 4: Specificity (10 points)
    score += this.scoreSpecificity(citation) * 0.1;

    return Math.round(score);
  }

  /**
   * Score how well citation matches the issue (0-100)
   */
  private scoreIssueMatch(citation: ProvenanceSource, issue: string): number {
    const text = `${citation.quote || ''} ${citation.finding || ''}`.toLowerCase();

    // Issue-specific keyword matching
    const issueKeywords = this.getIssueKeywords(issue);
    let matchScore = 0;

    for (const keyword of issueKeywords) {
      if (text.includes(keyword)) {
        matchScore += 20; // Each keyword match adds 20 points
      }
    }

    // Also check relevance_to_claim
    const relevance = citation.relevance_to_claim.toLowerCase();
    for (const keyword of issueKeywords) {
      if (relevance.includes(keyword)) {
        matchScore += 10;
      }
    }

    return Math.min(matchScore, 100);
  }

  /**
   * Get keywords for an issue
   */
  private getIssueKeywords(issue: string): string[] {
    const keywordMap: Record<string, string[]> = {
      CLASS_BASED_ONLY: [
        'self-directed',
        'beyond classroom',
        'independent',
        'own sake',
        'outside',
        'explore',
      ],
      GENERIC_STATEMENTS: ['specific', 'detail', 'concrete', 'example'],
      RESUME_REPETITION: ['why', 'meaning', 'reflection', 'growth'],
      LACKS_VOICE: ['authentic', 'voice', 'genuine', 'personality'],
    };

    return keywordMap[issue] || [];
  }

  /**
   * Score source authority (0-100)
   */
  private scoreAuthority(type: string): number {
    const authorityScores: Record<string, number> = {
      dean_quote: 100, // Highest authority
      cds: 90, // Official data
      admission_website: 80, // Official source
      essay_prompt: 75, // Official prompt
      mission_statement: 70, // Official mission
      interview: 65, // Published interview
      internal_analysis: 50, // Our research
    };

    return authorityScores[type] || 40;
  }

  /**
   * Score recency (0-100)
   */
  private scoreRecency(dateStr: string): number {
    const age = this.getAgeInMonths(dateStr);

    if (age < 6) return 100; // Less than 6 months
    if (age < 12) return 90; // Less than 1 year
    if (age < 18) return 75; // Less than 18 months
    if (age < 24) return 60; // Less than 2 years
    if (age < 36) return 40; // Less than 3 years
    return 20; // Older than 3 years
  }

  /**
   * Score specificity (0-100)
   */
  private scoreSpecificity(citation: ProvenanceSource): number {
    let score = 0;

    // Specific quote (better than just finding)
    if (citation.quote && citation.quote.length > 30) {
      score += 50;
    }

    // Quantitative data (numbers/percentages)
    if (citation.finding) {
      if (citation.finding.includes('%')) score += 25;
      if (citation.finding.match(/\d+/)) score += 25;
    }

    return Math.min(score, 100);
  }

  // ==========================================================================
  // CITATION USE DETERMINATION
  // ==========================================================================

  /**
   * Determine how to use this citation
   */
  private determineUse(citation: ProvenanceSource, context: CitationContext): CitationUse {
    // Weight-related citations
    if (
      citation.source_id.includes('weight') ||
      citation.source_id.includes('priority') ||
      citation.relevance_to_claim.toLowerCase().includes('weight')
    ) {
      return 'prove_weight';
    }

    // Problem/red flag citations
    if (
      citation.quote?.toLowerCase().includes('avoid') ||
      citation.quote?.toLowerCase().includes("don't") ||
      citation.relevance_to_claim.toLowerCase().includes('problem')
    ) {
      return 'explain_problem';
    }

    // Severity citations (critical, important, etc.)
    if (
      citation.quote?.toLowerCase().includes('critical') ||
      citation.quote?.toLowerCase().includes('important') ||
      citation.quote?.toLowerCase().includes('priority')
    ) {
      return 'justify_severity';
    }

    // Elite pattern citations
    if (
      citation.type === 'internal_analysis' &&
      (citation.finding?.includes('%') || citation.finding?.includes('pattern'))
    ) {
      return 'show_elite_pattern';
    }

    // Default: teaching
    return 'teach_technique';
  }

  // ==========================================================================
  // CITATION FORMATTING
  // ==========================================================================

  /**
   * Format citation for presentation to student
   */
  private formatCitation(
    item: { citation: ProvenanceSource; relevance_score: number; use_for: CitationUse },
    priority: number,
    context: CitationContext
  ): SelectedCitation {
    return {
      citation: item.citation,

      relevance: {
        score: item.relevance_score,
        reason: this.explainRelevance(item.citation, context),
        use_for: item.use_for,
      },

      presentation: {
        simplified_version: this.simplify(item.citation),
        full_version: this.fullVersion(item.citation),
        display_priority: priority,
      },
    };
  }

  /**
   * Explain WHY this citation is relevant (for students)
   */
  private explainRelevance(citation: ProvenanceSource, context: CitationContext): string {
    if (citation.type === 'dean_quote' && citation.author) {
      return `${citation.author} (Stanford's Dean of Admissions) directly addresses this issue`;
    }

    if (citation.type === 'internal_analysis') {
      return `Our analysis of successful Stanford essays shows this pattern`;
    }

    if (citation.type === 'cds') {
      return `Stanford's official Common Data Set confirms this priority`;
    }

    if (citation.type === 'admission_website') {
      return `Stanford's admission website explicitly states this`;
    }

    return `This source helps explain why this matters for Stanford`;
  }

  /**
   * Explain relevance for weight proof
   */
  private explainWeightRelevance(
    source: ProvenanceSource,
    provenance: ValueWeightProvenance
  ): string {
    if (source.type === 'dean_quote') {
      return `Dean ${source.author} explicitly ranks ${provenance.value_name} as a top priority`;
    }

    if (source.type === 'internal_analysis') {
      return `Our frequency analysis shows ${provenance.value_name} is emphasized most often`;
    }

    return `Official source confirms the importance of ${provenance.value_name}`;
  }

  /**
   * Simplify citation for high schoolers
   */
  private simplify(citation: ProvenanceSource): string {
    if (citation.type === 'dean_quote' && citation.quote) {
      const author = citation.author || 'Stanford\'s dean';
      return `${author} said: "${citation.quote}"`;
    }

    if (citation.type === 'internal_analysis' && citation.finding) {
      // Extract key number/finding
      const percentMatch = citation.finding.match(/(\d+)%/);
      if (percentMatch) {
        return `${percentMatch[1]}% of successful Stanford essays do this`;
      }

      const timesMatch = citation.finding.match(/(\d+)\s*times/i);
      if (timesMatch) {
        return `Stanford mentions this ${timesMatch[1]}x more than other values`;
      }
    }

    if (citation.type === 'cds') {
      return `Stanford officially rates this as "Very Important"`;
    }

    if (citation.type === 'admission_website') {
      return `Stanford's admission website says this matters`;
    }

    return citation.relevance_to_claim;
  }

  /**
   * Full version with all details
   */
  private fullVersion(citation: ProvenanceSource): string {
    const parts: string[] = [];

    // Author line
    if (citation.author) {
      let authorLine = citation.author;
      if (citation.author_title) authorLine += ` (${citation.author_title})`;
      parts.push(authorLine);
    }

    // Quote or finding
    if (citation.quote) {
      parts.push(`"${citation.quote}"`);
    } else if (citation.finding) {
      parts.push(citation.finding);
    }

    // Source details
    if (citation.publication && citation.date) {
      parts.push(`Source: ${citation.publication}, ${citation.date}`);
    } else if (citation.publication) {
      parts.push(`Source: ${citation.publication}`);
    }

    // URL
    if (citation.url) {
      parts.push(`Link: ${citation.url}`);
    }

    // Verification status
    if (citation.last_verified) {
      parts.push(`Verified: ${citation.last_verified}`);
    }

    return parts.join('\n');
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  /**
   * Get all citations for a college
   */
  private getAllCitations(college_id: string): ProvenanceSource[] {
    return this.citationCache.get(college_id) || [];
  }

  /**
   * Load Stanford citations into cache
   */
  private loadStanfordCitations(): void {
    const provenances = getAllStanfordProvenances();
    const citations: ProvenanceSource[] = [];

    // Collect all sources from all provenances
    for (const prov of provenances) {
      citations.push(...prov.primary_sources);
      citations.push(...prov.supporting_sources);
    }

    this.citationCache.set('stanford', citations);
  }

  /**
   * Get provenances for a college
   */
  private getProvenances(college_id: string): ValueWeightProvenance[] {
    if (college_id === 'stanford') {
      return getAllStanfordProvenances();
    }
    return [];
  }

  /**
   * Calculate age in months
   */
  private getAgeInMonths(dateStr: string): number {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      return (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 30);
    } catch {
      return 48; // Default to 4 years if parsing fails
    }
  }
}
