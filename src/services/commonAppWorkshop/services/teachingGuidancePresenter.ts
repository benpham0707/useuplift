// @ts-nocheck
/**
 * Teaching Guidance Presenter Service
 *
 * **ADDITIVE LAYER**: This service ENHANCES existing feedback without replacing it.
 *
 * ## Architecture
 *
 * **Existing System (preserved)**:
 * - Stage 1B: CriticalIssue (diagnosis, quote, location, prescription)
 * - Stage 2: IssueSurgicalTeaching (essay-specific suggestions)
 *
 * **This Layer (additive)**:
 * - UNIVERSAL teaching: Research-backed WHY/HOW/EXAMPLES
 * - NOT essay-specific: Teaches transferable skills
 * - Workshop mode bridge: Prepares context for technique chat
 *
 * ## Key Principle: Universal vs Tailored
 *
 * The existing system provides TAILORED feedback specific to the student's essay.
 * This layer provides UNIVERSAL teaching that applies to any essay with this issue.
 *
 * Students learn the universal skill here, then apply it to their specific text
 * in the Workshop Chat Mode (see workshopChatMode.ts).
 *
 * ## Flow
 *
 * 1. Student receives CriticalIssue (existing - stays intact)
 * 2. Student clicks "Learn More" → sees FormattedTeachingGuidance (this service)
 * 3. Student clicks "Apply to My Essay" → enters Workshop Mode (workshopChatMode.ts)
 *
 * @version 1.1 - Refactored for ADDITIVE architecture
 * @date January 2025
 */

import {
  researchBackedTeachingService,
  type IssueType,
  type ResearchBackedTeaching,
  type TechniqueBundle,
  type TransformationExample,
  type SourceCitation,
} from './researchBackedTeachingService';
import type { CriticalIssue } from './stage1BDiagnosisService';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Formatted teaching guidance ready for display
 */
export interface FormattedTeachingGuidance {
  // Issue identification
  issue_id: string;
  issue_type: IssueType;
  issue_title: string;

  // The problematic text from their essay
  student_quote: string;
  student_quote_location: string;

  // WHY section - digestible explanation
  why_this_matters: {
    headline: string;           // One-line hook
    explanation: string;        // 2-3 sentences
    admissions_quote?: string;  // Dean/AO quote if available
    admissions_source?: string; // Who said it
  };

  // HOW section - step-by-step guidance
  step_by_step: StepByStepGuidance[];

  // EXAMPLES section - before/after transformations
  examples: FormattedExample[];

  // APPLY section - chat handoff for personalized application
  apply_to_my_essay: ChatHandoffContext;

  // Metadata
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_time: string;
  college_specific?: CollegeSpecificNote;
}

/**
 * Single step in the guidance
 */
export interface StepByStepGuidance {
  step_number: number;
  technique_name: string;
  instruction: string;
  tip?: string;
  example?: string;
  common_mistake?: string;
}

/**
 * Before/after example formatted for display
 */
export interface FormattedExample {
  title: string;
  before: {
    text: string;
    issue_highlighted: string;  // What's wrong
  };
  after: {
    text: string;
    improvement_highlighted: string;  // What's better
  };
  principle: string;
  why_it_works: string;
}

/**
 * Context for handing off to chat interface
 */
export interface ChatHandoffContext {
  // Prompt for the chat to use
  system_context: string;

  // Suggested user message to start
  suggested_user_prompt: string;

  // Technique being applied
  technique_name: string;

  // The student's original text to improve
  student_text: string;

  // What the technique should accomplish
  expected_outcome: string;

  // Example transformation for reference
  reference_transformation?: {
    before: string;
    after: string;
  };

  // Key principles to maintain
  principles_to_follow: string[];

  // What to avoid
  pitfalls_to_avoid: string[];
}

/**
 * College-specific note
 */
export interface CollegeSpecificNote {
  college_name: string;
  insight: string;
  source?: string;
}

/**
 * Complete teaching package for an issue
 */
export interface TeachingPackage {
  formatted_guidance: FormattedTeachingGuidance;
  raw_teaching: ResearchBackedTeaching | null;
  issue: CriticalIssue;
}

/**
 * Enhanced issue with universal teaching ADDED
 *
 * This is the ADDITIVE result - original issue preserved,
 * universal teaching layered on top.
 */
export interface EnhancedIssueWithTeaching {
  // Original issue data (PRESERVED - not modified)
  original: {
    issue: CriticalIssue;
    // If Stage 2 suggestions exist, they're preserved here
    stage2_suggestions?: {
      polished_original?: string;
      voice_amplifier?: string;
    };
  };

  // Universal teaching (ADDITIVE - new layer)
  universal_teaching: {
    // Research-backed WHY
    why_this_matters: {
      headline: string;
      explanation: string;
      research_source?: string;
    };

    // Universal HOW (not essay-specific)
    technique: {
      name: string;
      steps: string[];
      difficulty: 'beginner' | 'intermediate' | 'advanced';
      estimated_time: string;
    };

    // Universal EXAMPLES (from research, not student's essay)
    examples: Array<{
      before: string;
      after: string;
      why_it_works: string;
    }>;
  };

  // Workshop mode ready flag
  workshop_mode_available: boolean;
}

// ============================================================================
// PRESENTER CLASS
// ============================================================================

class TeachingGuidancePresenter {

  // ==========================================================================
  // ADDITIVE ENHANCEMENT (Preferred API)
  // ==========================================================================

  /**
   * Enhance an existing issue with universal teaching
   *
   * **ADDITIVE**: Original issue is preserved, universal teaching is layered on.
   *
   * Use this method when you want to ADD universal teaching to existing
   * feedback without replacing anything.
   *
   * @param issue - The existing CriticalIssue from Stage 1B
   * @param stage2Suggestions - Optional Stage 2 suggestions if available
   * @returns Enhanced issue with universal teaching added
   */
  enhanceIssueWithUniversalTeaching(
    issue: CriticalIssue,
    stage2Suggestions?: {
      polished_original?: string;
      voice_amplifier?: string;
    }
  ): EnhancedIssueWithTeaching {
    // Map symptom type to issue type
    const issueType = this.mapSymptomToIssueType(issue.symptom_type);

    // Get research-backed teaching
    const teaching = issueType
      ? researchBackedTeachingService.getTeachingForIssue(issueType)
      : null;

    // Build the ADDITIVE enhancement
    return {
      // Original data PRESERVED
      original: {
        issue,
        stage2_suggestions: stage2Suggestions,
      },

      // Universal teaching ADDED
      universal_teaching: {
        why_this_matters: {
          headline: this.createHeadline(issue.symptom_type),
          explanation: teaching?.why_section.summary || issue.diagnosis || issue.problem,
          research_source: teaching?.evidence.primary_sources[0]?.author,
        },

        technique: {
          name: teaching?.techniques[0]?.name || 'Writing Improvement',
          steps: teaching?.techniques[0]?.steps || this.getFallbackSteps(issue).map(s => s.instruction),
          difficulty: this.assessDifficulty(teaching),
          estimated_time: this.estimateTime(teaching),
        },

        examples: teaching?.transformations.map(t => ({
          before: t.before,
          after: t.after,
          why_it_works: t.why_it_works,
        })) || [],
      },

      // Workshop mode available if we have teaching
      workshop_mode_available: !!teaching,
    };
  }

  /**
   * Enhance multiple issues with universal teaching
   *
   * Batch version of enhanceIssueWithUniversalTeaching
   */
  enhanceIssuesWithUniversalTeaching(
    issues: CriticalIssue[],
    stage2Output?: {
      issues: Array<{
        issue_number: number;
        suggestions?: {
          polished_original?: { revised_text: string };
          voice_amplifier?: { revised_text: string };
        };
      }>;
    }
  ): EnhancedIssueWithTeaching[] {
    return issues.map(issue => {
      // Find matching Stage 2 suggestions if available
      const stage2Issue = stage2Output?.issues.find(s2 => s2.issue_number === issue.issue_number);
      const suggestions = stage2Issue?.suggestions
        ? {
            polished_original: stage2Issue.suggestions.polished_original?.revised_text,
            voice_amplifier: stage2Issue.suggestions.voice_amplifier?.revised_text,
          }
        : undefined;

      return this.enhanceIssueWithUniversalTeaching(issue, suggestions);
    });
  }

  // ==========================================================================
  // FORMATTED GUIDANCE (Full Presentation Layer)
  // ==========================================================================

  /**
   * Format a critical issue into complete teaching guidance
   */
  formatIssueForTeaching(
    issue: CriticalIssue,
    collegeId?: string
  ): TeachingPackage {
    // Get the issue type from symptom_type
    const issueType = this.mapSymptomToIssueType(issue.symptom_type);

    // Get research-backed teaching
    const teaching = issueType
      ? researchBackedTeachingService.getTeachingForIssue(issueType)
      : null;

    // Build formatted guidance
    const formatted = this.buildFormattedGuidance(issue, teaching, issueType, collegeId);

    return {
      formatted_guidance: formatted,
      raw_teaching: teaching,
      issue,
    };
  }

  /**
   * Format multiple issues into teaching packages
   */
  formatIssuesForTeaching(
    issues: CriticalIssue[],
    collegeId?: string
  ): TeachingPackage[] {
    return issues.map(issue => this.formatIssueForTeaching(issue, collegeId));
  }

  /**
   * Build the formatted guidance structure
   */
  private buildFormattedGuidance(
    issue: CriticalIssue,
    teaching: ResearchBackedTeaching | null,
    issueType: IssueType | null,
    collegeId?: string
  ): FormattedTeachingGuidance {
    const issueId = `issue_${issue.issue_number}_${Date.now()}`;

    return {
      issue_id: issueId,
      issue_type: issueType || 'telling_not_showing',
      issue_title: this.formatIssueTitle(issue.symptom_type, issue.problem),

      student_quote: issue.quote,
      student_quote_location: issue.location,

      why_this_matters: this.buildWhySection(issue, teaching),
      step_by_step: this.buildStepByStep(issue, teaching),
      examples: this.buildExamples(teaching),
      apply_to_my_essay: this.buildChatHandoff(issue, teaching, issueType),

      difficulty: this.assessDifficulty(teaching),
      estimated_time: this.estimateTime(teaching),
      college_specific: collegeId ? this.getCollegeNote(issueType, collegeId) : undefined,
    };
  }

  /**
   * Build the WHY section - digestible explanation
   */
  private buildWhySection(
    issue: CriticalIssue,
    teaching: ResearchBackedTeaching | null
  ): FormattedTeachingGuidance['why_this_matters'] {
    if (teaching) {
      // Extract admissions quote if available
      const primarySource = teaching.evidence.primary_sources[0];

      return {
        headline: this.createHeadline(issue.symptom_type),
        explanation: teaching.why_section.summary,
        admissions_quote: teaching.why_section.admissions_perspective || primarySource?.quote,
        admissions_source: primarySource?.author,
      };
    }

    // Fallback when no teaching bundle
    return {
      headline: this.createHeadline(issue.symptom_type),
      explanation: issue.diagnosis || issue.problem,
    };
  }

  /**
   * Build step-by-step guidance from techniques
   */
  private buildStepByStep(
    issue: CriticalIssue,
    teaching: ResearchBackedTeaching | null
  ): StepByStepGuidance[] {
    if (!teaching || teaching.techniques.length === 0) {
      // Fallback guidance based on issue type
      return this.getFallbackSteps(issue);
    }

    const steps: StepByStepGuidance[] = [];
    let stepNumber = 1;

    // Take the most relevant technique (first one is usually most applicable)
    const primaryTechnique = teaching.techniques[0];

    // Add each step from the technique
    for (const step of primaryTechnique.steps) {
      steps.push({
        step_number: stepNumber,
        technique_name: primaryTechnique.name,
        instruction: step,
        common_mistake: primaryTechnique.common_mistakes[stepNumber - 1],
      });
      stepNumber++;
    }

    // If there's a second technique, add key steps
    if (teaching.techniques.length > 1) {
      const secondaryTechnique = teaching.techniques[1];

      // Add as a "bonus" or "alternative" step
      steps.push({
        step_number: stepNumber,
        technique_name: `Alternative: ${secondaryTechnique.name}`,
        instruction: secondaryTechnique.steps[0] || secondaryTechnique.description,
        tip: 'Try this approach if the first technique doesn\'t feel natural for your essay.',
      });
    }

    return steps;
  }

  /**
   * Build formatted examples from transformations
   */
  private buildExamples(
    teaching: ResearchBackedTeaching | null
  ): FormattedExample[] {
    if (!teaching || teaching.transformations.length === 0) {
      return [];
    }

    return teaching.transformations.map((t, index) => ({
      title: `Example ${index + 1}: ${t.principle_applied}`,
      before: {
        text: t.before,
        issue_highlighted: this.identifyIssueInExample(t.before),
      },
      after: {
        text: t.after,
        improvement_highlighted: this.identifyImprovementInExample(t.after),
      },
      principle: t.principle_applied,
      why_it_works: t.why_it_works,
    }));
  }

  /**
   * Build chat handoff context for applying the technique
   */
  private buildChatHandoff(
    issue: CriticalIssue,
    teaching: ResearchBackedTeaching | null,
    issueType: IssueType | null
  ): ChatHandoffContext {
    const techniqueName = teaching?.techniques[0]?.name || 'Revision Technique';
    const transformation = teaching?.transformations[0];

    // Build system context for the chat
    const systemContext = this.buildSystemContextForChat(issue, teaching, issueType);

    // Build suggested user prompt
    const suggestedPrompt = this.buildSuggestedUserPrompt(issue, techniqueName);

    // Build principles to follow
    const principles = teaching?.techniques.slice(0, 2).map(t => t.description) || [
      'Show through specific detail, don\'t tell through claims',
      'Use concrete, sensory language',
    ];

    // Build pitfalls to avoid
    const pitfalls = teaching?.techniques[0]?.common_mistakes || [
      'Don\'t replace one generic phrase with another',
      'Don\'t lose your authentic voice in the process',
    ];

    return {
      system_context: systemContext,
      suggested_user_prompt: suggestedPrompt,
      technique_name: techniqueName,
      student_text: issue.quote,
      expected_outcome: issue.prescription || 'A more specific, grounded version that shows rather than tells',
      reference_transformation: transformation ? {
        before: transformation.before,
        after: transformation.after,
      } : undefined,
      principles_to_follow: principles,
      pitfalls_to_avoid: pitfalls,
    };
  }

  /**
   * Build system context for chat handoff
   */
  private buildSystemContextForChat(
    issue: CriticalIssue,
    teaching: ResearchBackedTeaching | null,
    issueType: IssueType | null
  ): string {
    const parts: string[] = [];

    parts.push(`## TEACHING CONTEXT FOR CHAT`);
    parts.push(``);
    parts.push(`You are helping a student apply a specific writing technique to improve their essay.`);
    parts.push(``);

    parts.push(`### THE ISSUE`);
    parts.push(`The student wrote: "${issue.quote}"`);
    parts.push(`Location: ${issue.location}`);
    parts.push(`Problem: ${issue.problem}`);
    parts.push(``);

    if (teaching) {
      parts.push(`### WHY THIS MATTERS`);
      parts.push(teaching.why_section.summary);
      parts.push(``);

      parts.push(`### TECHNIQUE TO APPLY: ${teaching.techniques[0]?.name}`);
      parts.push(teaching.techniques[0]?.description || '');
      parts.push(``);

      parts.push(`### STEP-BY-STEP GUIDANCE`);
      teaching.techniques[0]?.steps.forEach((step, i) => {
        parts.push(`${i + 1}. ${step}`);
      });
      parts.push(``);

      if (teaching.transformations.length > 0) {
        parts.push(`### EXAMPLE TRANSFORMATION`);
        parts.push(`Before: "${teaching.transformations[0].before}"`);
        parts.push(`After: "${teaching.transformations[0].after}"`);
        parts.push(`Why it works: ${teaching.transformations[0].why_it_works}`);
        parts.push(``);
      }

      parts.push(`### COMMON MISTAKES TO AVOID`);
      teaching.techniques[0]?.common_mistakes.forEach(mistake => {
        parts.push(`- ${mistake}`);
      });
    }

    parts.push(``);
    parts.push(`### YOUR ROLE`);
    parts.push(`Guide the student through applying this technique to THEIR specific text.`);
    parts.push(`Ask them questions about their specific situation to help them find their own details.`);
    parts.push(`Don't write it for them - help them discover what to write.`);
    parts.push(`Reference the example transformation to show what good looks like.`);

    return parts.join('\n');
  }

  /**
   * Build suggested user prompt for chat
   */
  private buildSuggestedUserPrompt(
    issue: CriticalIssue,
    techniqueName: string
  ): string {
    return `Help me apply the "${techniqueName}" technique to improve this part of my essay: "${issue.quote.substring(0, 100)}${issue.quote.length > 100 ? '...' : ''}"`;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Map symptom_type to IssueType
   */
  private mapSymptomToIssueType(symptomType: string): IssueType | null {
    const mapping: Record<string, IssueType> = {
      'abstract_language': 'telling_not_showing',
      'telling_not_showing': 'telling_not_showing',
      'passive_voice': 'passive_victim_framing',
      'passive_agency': 'passive_victim_framing',
      'passive_victim': 'passive_victim_framing',
      'cliche_language': 'cliche_language',
      'cliche_expression': 'cliche_language',
      'inspirational_cliche': 'cliche_inspirational',
      'ai_language': 'cliche_ai_convergence',
      'ai_convergence': 'cliche_ai_convergence',
      'performative_intelligence': 'performative_intelligence',
      'thesaurus_problem': 'performative_intelligence',
      'premature_resolution': 'premature_resolution',
      'forced_epiphany': 'premature_resolution',
      'false_epiphany': 'false_epiphany',
      'missing_systems_awareness': 'missing_systems_awareness',
      'individual_level': 'missing_systems_awareness',
      'strategic_vulnerability': 'strategic_vulnerability',
      'announced_vulnerability': 'strategic_vulnerability',
    };

    return mapping[symptomType.toLowerCase()] || null;
  }

  /**
   * Format issue title for display
   */
  private formatIssueTitle(symptomType: string, problem: string): string {
    const titles: Record<string, string> = {
      'abstract_language': 'Replace Abstract Claims with Concrete Details',
      'telling_not_showing': 'Show, Don\'t Tell',
      'passive_voice': 'Add Agency to Your Narrative',
      'passive_agency': 'Show What You Did, Not What Happened To You',
      'cliche_language': 'Replace Clichés with Fresh Language',
      'inspirational_cliche': 'Avoid Inspirational Clichés',
      'ai_language': 'Use Your Authentic Voice',
      'ai_convergence': 'Replace AI-Sounding Language',
      'performative_intelligence': 'Show Curiosity, Don\'t Claim It',
      'thesaurus_problem': 'Use Simple, Clear Language',
      'premature_resolution': 'Leave Space for Complexity',
      'forced_epiphany': 'Show Gradual Understanding',
      'false_epiphany': 'Replace Sudden Realization with Process',
      'missing_systems_awareness': 'Connect to Larger Context',
      'strategic_vulnerability': 'Let Vulnerability Emerge Naturally',
      'announced_vulnerability': 'Show, Don\'t Announce, Your Honesty',
    };

    return titles[symptomType.toLowerCase()] || `Address: ${problem.substring(0, 50)}`;
  }

  /**
   * Create headline for WHY section
   */
  private createHeadline(symptomType: string): string {
    const headlines: Record<string, string> = {
      'abstract_language': 'Claims don\'t create connection - details do.',
      'telling_not_showing': 'Readers feel stories, they don\'t believe statements.',
      'passive_voice': 'Admissions officers want to see what you DID.',
      'cliche_language': 'Clichés signal you reached for the conventional.',
      'inspirational_cliche': 'Neat conclusions undermine authentic growth.',
      'ai_convergence': 'Your unique voice is your competitive advantage.',
      'performative_intelligence': 'Vocabulary doesn\'t signal depth - thinking does.',
      'premature_resolution': 'Real growth is messy and ongoing.',
      'false_epiphany': 'Sudden realizations feel fake because they are.',
      'missing_systems_awareness': 'Strong essays connect personal to systemic.',
      'strategic_vulnerability': 'Announcing authenticity negates it.',
    };

    return headlines[symptomType.toLowerCase()] || 'This pattern weakens your essay\'s impact.';
  }

  /**
   * Identify the issue in an example "before" text
   */
  private identifyIssueInExample(text: string): string {
    // Look for common problematic patterns
    if (text.includes('I learned') || text.includes('taught me')) {
      return 'Abstract lesson claim';
    }
    if (text.includes('passionate') || text.includes('passion')) {
      return 'Tells passion instead of showing';
    }
    if (text.includes('transformative') || text.includes('profoundly')) {
      return 'Elevated vocabulary without substance';
    }
    if (text.includes('I realized') || text.includes('everything changed')) {
      return 'Claims sudden epiphany';
    }
    return 'Generic language that could be anyone\'s';
  }

  /**
   * Identify the improvement in an example "after" text
   */
  private identifyImprovementInExample(text: string): string {
    if (text.includes('still') || text.includes('mostly')) {
      return 'Shows ongoing complexity';
    }
    if (text.match(/\d/) || text.includes(':')) {
      return 'Uses specific details and numbers';
    }
    if (text.includes('"') || text.includes('\'')) {
      return 'Includes specific dialogue or detail';
    }
    return 'Concrete, specific, grounded in reality';
  }

  /**
   * Assess difficulty level of the teaching
   */
  private assessDifficulty(
    teaching: ResearchBackedTeaching | null
  ): 'beginner' | 'intermediate' | 'advanced' {
    if (!teaching) return 'intermediate';

    const difficulties = teaching.techniques.map(t => t.difficulty);

    if (difficulties.includes('advanced')) return 'advanced';
    if (difficulties.every(d => d === 'simple')) return 'beginner';
    return 'intermediate';
  }

  /**
   * Estimate time to apply the technique
   */
  private estimateTime(teaching: ResearchBackedTeaching | null): string {
    if (!teaching) return '10-15 minutes';

    const totalSteps = teaching.techniques.reduce((sum, t) => sum + t.steps.length, 0);

    if (totalSteps <= 3) return '5-10 minutes';
    if (totalSteps <= 6) return '10-15 minutes';
    return '15-20 minutes';
  }

  /**
   * Get college-specific note
   */
  private getCollegeNote(
    issueType: IssueType | null,
    collegeId: string
  ): CollegeSpecificNote | undefined {
    if (!issueType) return undefined;

    const guidance = researchBackedTeachingService.getCollegeSpecificGuidance(issueType, collegeId);

    if (guidance.insight) {
      return {
        college_name: collegeId,
        insight: guidance.insight,
        source: guidance.sources[0]?.author,
      };
    }

    return undefined;
  }

  /**
   * Get fallback steps when no teaching bundle available
   */
  private getFallbackSteps(issue: CriticalIssue): StepByStepGuidance[] {
    return [
      {
        step_number: 1,
        technique_name: 'Identify the Issue',
        instruction: `Look at the text: "${issue.quote.substring(0, 50)}..." - what makes this generic or unclear?`,
      },
      {
        step_number: 2,
        technique_name: 'Recall the Moment',
        instruction: 'Close your eyes and remember the specific moment. What did you see, hear, or feel?',
      },
      {
        step_number: 3,
        technique_name: 'Add Concrete Details',
        instruction: 'Replace the generic language with specific details from your memory.',
        tip: 'Names, numbers, and sensory details make writing come alive.',
      },
      {
        step_number: 4,
        technique_name: 'Test Your Revision',
        instruction: 'Read it aloud. Does it sound like something only YOU could write?',
      },
    ];
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const teachingGuidancePresenter = new TeachingGuidancePresenter();

// Export class for testing
export { TeachingGuidancePresenter };
