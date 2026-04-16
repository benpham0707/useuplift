/**
 * Student Narrative Bridge — Cross-Module Context Assembly
 *
 * GAP-13: A pure function that assembles cross-module context into a prose
 * string for injection into any module's LLM prompts.
 *
 * No LLM calls, no side effects, no database access. Takes structured outputs
 * from various modules (essay intelligence, activity workshop, PIQ, academic)
 * and returns a single context string that any module can prepend to its prompt.
 *
 * This lets each module benefit from insights discovered by other modules,
 * without coupling the modules to each other's internals.
 */

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface StudentModuleOutputs {
  essayIntelligence?: {
    coachingLens?: string;
    writerPortrait?: string;
    revealedQualities?: string[];
  };
  activityProfiles?: Array<{
    title: string;
    tier: number;
    keyStrengths: string[];
    /** Rich personal details from the activity conversator — these are the
     *  raw material for personalized essay coaching and example generation.
     *  e.g., "presented to school board despite being terrified, secured $5K funding" */
    keyMoment?: string;
    /** Authentic quotes from the student's own words during activity chat */
    authenticQuote?: string;
    /** Origin story — how/why they got involved (from profile_data JSONB) */
    originStory?: string;
    /** Proudest moment in this activity (from profile_data JSONB) */
    proudestMoment?: string;
    /** Why this activity matters to them personally (from profile_data JSONB) */
    whyItMatters?: string;
  }>;
  /** Derived portfolio synthesis — computed from activity profiles, not stored */
  portfolioSynthesis?: {
    /** Dominant spike area (if detected) */
    spike?: string;
    /** Number of Tier 1-2 activities (strong signal activities) */
    strongActivityCount: number;
  };
  piqSummaries?: string[];
  academicContext?: {
    gpaContext?: string;
    courseLoadSummary?: string;
    majorDirection?: string;
  };
}

// ============================================================================
// ASSEMBLY FUNCTION
// ============================================================================

/**
 * Assemble cross-module student context into a single prompt-injectable string.
 *
 * Returns an empty string when no module outputs are available, so callers
 * can always concatenate without conditional checks:
 *
 * ```ts
 * const ctx = assembleStudentContext(outputs);
 * const prompt = ctx + '\n' + basePrompt;  // ctx is '' if nothing available
 * ```
 */
export function assembleStudentContext(outputs: StudentModuleOutputs): string {
  const sections: string[] = [];

  // Essay Intelligence insights (writer identity, coaching direction)
  if (outputs.essayIntelligence) {
    const ei = outputs.essayIntelligence;
    const parts: string[] = [];
    if (ei.writerPortrait) parts.push(`This student: ${ei.writerPortrait}`);
    if (ei.revealedQualities?.length) {
      parts.push(`Qualities shown: ${ei.revealedQualities.join(', ')}`);
    }
    if (ei.coachingLens) parts.push(`Current coaching: ${ei.coachingLens}`);
    if (parts.length > 0) sections.push(parts.join('. '));
  }

  // Activity profiles (tier + strengths + personal details for coaching)
  if (outputs.activityProfiles?.length) {
    const activityLines = outputs.activityProfiles.map(a => {
      let line = `${a.title} (Tier ${a.tier}): ${a.keyStrengths.slice(0, 2).join(', ')}`;
      if (a.originStory) line += ` | Origin: ${a.originStory}`;
      if (a.keyMoment) line += ` | Key moment: ${a.keyMoment}`;
      if (a.proudestMoment) line += ` | Proudest: ${a.proudestMoment}`;
      if (a.whyItMatters) line += ` | Why it matters: ${a.whyItMatters}`;
      if (a.authenticQuote) line += ` | In their words: "${a.authenticQuote}"`;
      return line;
    });
    sections.push(`Activities:\n${activityLines.join('\n')}`);
  }

  // PIQ insights (one-line summaries from analyzed PIQs)
  if (outputs.piqSummaries?.length) {
    sections.push(`PIQ insights: ${outputs.piqSummaries.join('. ')}`);
  }

  // Academic context (direction, GPA, course rigor)
  if (outputs.academicContext) {
    const ac = outputs.academicContext;
    const parts: string[] = [];
    if (ac.majorDirection) parts.push(`Direction: ${ac.majorDirection}`);
    if (ac.gpaContext) parts.push(ac.gpaContext);
    if (ac.courseLoadSummary) parts.push(ac.courseLoadSummary);
    if (parts.length > 0) sections.push(parts.join('. '));
  }

  // Portfolio synthesis (derived from activity profiles — holistic narrative)
  if (outputs.portfolioSynthesis) {
    const ps = outputs.portfolioSynthesis;
    const parts: string[] = [];
    if (ps.spike) parts.push(`Spike: ${ps.spike}`);
    parts.push(`Strong activities (Tier 1-2): ${ps.strongActivityCount}`);
    if (parts.length > 0) sections.push(`Portfolio: ${parts.join('. ')}`);
  }

  if (sections.length === 0) return '';
  return `=== STUDENT CONTEXT (from other modules) ===\n${sections.join('\n')}\n===`;
}
