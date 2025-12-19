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
 */

import type {
  CitationContext,
  SelectedCitation,
  ProvenanceSource,
  CitationUse,
  ValueWeightProvenance,
} from '../types/provenanceTypes';

import { getAllStanfordProvenances } from '../data/provenanceData/stanfordProvenance';

// ============================================================================
// CITATION SELECTOR SERVICE
// ============================================================================

export class CitationSelector {
  // Cache of all available citations by college
  private citationCache: Map<string, ProvenanceSource[]> = new Map();

  constructor() {
    // Pre-load Stanford citations
    this.loadStanfordCitations();
  }

  /**
   * Select best citations for a student's issue
   *
   * Example: Student has CLASS_BASED_ONLY red flag
   * Returns: Dean Shaw quote about self-directed learning + IV weight provenance
   *
   * @param context - Information about the student's issue
   * @returns Top 3-5 most relevant citations with explanations
   */
  selectCitationsFor Issue(context: CitationContext): SelectedCitation[] {
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
   * Get citations specifically for proving a weight
   *
   * Example: Student asks "How do you know IV is 40%?"
   * Returns: Full provenance with dean quotes and methodology
   */
  selectWeightProof(college_id: string, value_id: string): SelectedCitation[] {
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

// ============================================================================
// EXPORTS
// ============================================================================

export { CitationSelector };
