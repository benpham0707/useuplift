/**
 * Haiku Citation Mapping Service
 *
 * **QUALITY-FIRST COST OPTIMIZATION - ADDITIVE HAIKU PRE-ANALYSIS**
 *
 * This service uses Claude Haiku to create comprehensive citation mappings BEFORE
 * the main Sonnet teaching stage. Haiku analyzes the essay and identifies:
 *
 * 1. Which Dean quotes/AO quotes are most relevant to which essay parts
 * 2. Which red flags are triggered (with specific evidence locations)
 * 3. Which green flag opportunities exist (with enhancement suggestions)
 * 4. Which college values are demonstrated where
 * 5. Which elite examples are most relevant to learn from
 *
 * **Why This is Zero-Risk to Quality**:
 * - ADDS context for Sonnet, never replaces full research
 * - Sonnet still receives ALL college research (fully cached)
 * - Citation map helps Sonnet find relevant evidence faster
 * - If Haiku misses something, Sonnet can still find it in full research
 * - Net effect: Better targeted teaching with same research depth
 *
 * **Cost Impact**:
 * - Haiku analysis: ~8K tokens input (essay + research summary) + ~2K output = $0.024
 * - Enables more efficient Sonnet teaching (fewer tokens to search)
 * - Improves teaching quality by pre-identifying connections
 * - Total cost increase: $0.024 per essay for better quality
 *
 * **The Complete Process**:
 * 1. Haiku reads student essay draft
 * 2. Haiku reads compressed college research summary (NOT full research)
 * 3. Haiku identifies structural patterns, red/green flags, relevant quotes
 * 4. Haiku creates citation mapping
 * 5. Sonnet receives: citation map + FULL college research + student essay
 * 6. Sonnet uses map as guide to find relevant evidence quickly
 * 7. Sonnet teaches with full depth using complete research
 */

import type {
  CitationMapping,
  CollegeResearch,
  CollegeKeyQuote,
  CollegeRedFlag,
  CollegeGreenFlag,
  CollegeCoreValue,
  CollegeEliteExample,
  EssayPattern,
} from '../types/collegeResearch';
import { getCollegeResearch } from '../data';

// ============================================================================
// CITATION MAPPING SERVICE
// ============================================================================

/**
 * Service for creating citation mappings using Haiku
 *
 * This is a "pre-processor" that runs before Sonnet teaching to identify
 * which research elements are most relevant to which essay parts. It creates
 * a structured map that helps Sonnet quickly find the right evidence to cite.
 */
export class HaikuCitationService {
  /**
   * Create comprehensive citation mapping for an essay
   *
   * This is the main entry point. It analyzes the essay using Haiku and
   * returns a complete citation mapping that identifies:
   * - Structural patterns (word count, paragraph structure, hooks)
   * - Pattern classification (what type of essay is this)
   * - Relevant college values (which values apply where)
   * - Applicable quotes (which Dean quotes to cite where)
   * - Red flags (what problems exist, where, with evidence)
   * - Green flag opportunities (what strengths to enhance)
   * - Example relevance (which elite examples to learn from)
   *
   * @param collegeId - Which college (e.g., 'stanford')
   * @param promptId - Which essay prompt
   * @param essayDraft - The student's current draft
   * @param pattern - Expected essay pattern (for context)
   * @returns Complete citation mapping
   */
  public async createCitationMapping(
    collegeId: string,
    promptId: string,
    essayDraft: string,
    pattern: EssayPattern
  ): Promise<CitationMapping> {
    const research = getCollegeResearch(collegeId);
    if (!research) {
      throw new Error(`College research not found for: ${collegeId}`);
    }

    const prompt = research.essayPrompts.find(p => p.promptId === promptId);
    if (!prompt) {
      throw new Error(`Essay prompt not found: ${promptId}`);
    }

    // Build comprehensive Haiku prompt for citation mapping
    const haikuPrompt = this.buildComprehensiveHaikuPrompt(
      research,
      prompt.promptTitle,
      essayDraft,
      pattern
    );

    // In a real implementation, this would call Claude Haiku API:
    // const response = await callClaudeHaiku(haikuPrompt);
    // const mapping = JSON.parse(response);
    //
    // For now, we create a structured placeholder that demonstrates
    // the complete mapping structure:

    const citationMapping: CitationMapping = {
      // Essay hash for caching/tracking
      essayHash: this.hashEssay(essayDraft),

      // Structural analysis
      structural: this.analyzeStructure(essayDraft),

      // Pattern analysis
      patternAnalysis: {
        primaryPattern: pattern,
        confidence: 0.85,
        secondaryPattern: undefined,
      },

      // Which college values are relevant
      relevantValues: this.identifyRelevantValues(
        research.coreValues,
        essayDraft,
        pattern
      ),

      // Which quotes apply where
      applicableQuotes: this.identifyApplicableQuotes(
        research.keyQuotes,
        essayDraft,
        pattern
      ),

      // Red flags detected
      triggeredRedFlags: this.detectRedFlags(research.redFlags, essayDraft),

      // Green flag opportunities
      greenFlagOpportunities: this.identifyGreenFlagOpportunities(
        research.greenFlags,
        essayDraft
      ),

      // Example relevance
      exampleRelevance: this.rankExampleRelevance(
        research.eliteExamples.filter(ex => ex.promptId === promptId),
        essayDraft
      ),
    };

    return citationMapping;
  }

  /**
   * Build comprehensive Haiku prompt for citation mapping
   *
   * This prompt gives Haiku everything it needs to create a detailed
   * citation mapping, including:
   * - The essay to analyze
   * - Summary of college values (not full evidence, that's for Sonnet)
   * - List of available quotes
   * - Red/green flag definitions
   * - Expected output format
   */
  private buildComprehensiveHaikuPrompt(
    research: CollegeResearch,
    promptTitle: string,
    essayDraft: string,
    pattern: EssayPattern
  ): string {
    return `
# Citation Mapping Task

You are analyzing a college essay to create a comprehensive citation mapping.
Your job is to identify which research elements are most relevant to which parts of this essay.

---

## Essay to Analyze

**College**: ${research.collegeName}
**Prompt**: ${promptTitle}
**Expected Pattern**: ${pattern}

**Draft**:
\`\`\`
${essayDraft}
\`\`\`

**Word Count**: ${essayDraft.split(/\s+/).length}

---

## Available Research Elements

### College Values

${research.coreValues
  .map(
    v => `
**${v.valueId}** (${v.valueName}, Weight: ${v.weight}%)
- Definition: ${v.definition}
- Essay implication: ${v.essayImplication}
- What it IS: ${v.is.slice(0, 3).join('; ')}
- What it IS NOT: ${v.isNot.slice(0, 3).join('; ')}
`
  )
  .join('\n')}

### Available Quotes from ${research.collegeName}

${research.keyQuotes
  .map(
    (q, idx) => `
**Quote ${idx + 1}** (${q.quoteId}):
"${q.quote}"
- Source: ${q.source.name} (${q.source.title})
- Context: ${q.context}
- Use cases: ${q.useCases.map(uc => uc.issue || uc.dimension || uc.flag || 'general').join(', ')}
`
  )
  .join('\n')}

### Red Flags to Watch For

${research.redFlags
  .map(
    rf => `
**${rf.flagId}** - ${rf.flagName} (Severity: ${rf.severity})
- What it is: ${rf.detection.description}
- Signal phrases: ${rf.detection.signalPhrases.slice(0, 3).join('; ')}
- Why ${research.collegeName} cares: ${rf.teaching.whyItMatters}
`
  )
  .join('\n')}

### Green Flags to Recognize

${research.greenFlags
  .map(
    gf => `
**${gf.flagId}** - ${gf.flagName} (Strength: ${gf.strength})
- What it is: ${gf.detection.description}
- Signal phrases: ${gf.detection.signalPhrases.slice(0, 3).join('; ')}
- Why it matters: ${gf.teaching.whyItMatters}
`
  )
  .join('\n')}

---

## Your Task

Analyze the essay and create a comprehensive citation mapping with these components:

### 1. Structural Analysis
- Count words and paragraphs
- Identify if there's an opening hook
- Identify if there's a conclusion
- Calculate average sentence length

### 2. Pattern Analysis
- Confirm primary pattern (or suggest different pattern)
- Provide confidence score (0-1)
- Note secondary pattern if present

### 3. Relevant Values
- Which college values are demonstrated in the essay?
- Where specifically (which paragraph/section)?
- How strongly (high/medium/low relevance)?

### 4. Applicable Quotes
- Which quotes would be most relevant to cite when teaching this essay?
- Where would each quote apply (which part of essay)?
- Why is it relevant?
- How should it be used in teaching?

### 5. Triggered Red Flags
- Which red flags (if any) are present?
- What's the evidence (specific quote from essay)?
- Where in the essay (paragraph number)?
- Which quote should be cited to address this?

### 6. Green Flag Opportunities
- Which green flags (if any) are present or could be enhanced?
- What's the opportunity?
- Where in the essay?
- Which quote would support this strength?

### 7. Example Relevance
- Which example techniques would be most helpful for this student?
- High/medium/low relevance for each example
- What specific technique to learn from it

---

## Output Format

Return a JSON object with this exact structure:

\`\`\`json
{
  "structural": {
    "wordCount": <number>,
    "paragraphCount": <number>,
    "hasOpeningHook": <boolean>,
    "hasConclusion": <boolean>,
    "avgSentenceLength": <number>
  },
  "patternAnalysis": {
    "primaryPattern": "<essay_pattern>",
    "confidence": <0-1>,
    "secondaryPattern": "<optional>"
  },
  "relevantValues": [
    {
      "valueId": "value_id",
      "relevance": "high|medium|low",
      "applicableToLocation": "paragraph_1 or opening or specific location"
    }
  ],
  "applicableQuotes": [
    {
      "quoteId": "quote_id",
      "quote": "the actual quote text",
      "source": "source name",
      "appliesTo": "what part of essay this quote is relevant to",
      "relevance": "why this quote is relevant",
      "suggestedUse": "how to use this quote in teaching"
    }
  ],
  "triggeredRedFlags": [
    {
      "flagId": "flag_id",
      "flagName": "flag name",
      "evidence": "quote from essay showing this problem",
      "location": "paragraph_2",
      "citationToUse": "which quote_id to cite when addressing this"
    }
  ],
  "greenFlagOpportunities": [
    {
      "flagId": "flag_id",
      "flagName": "flag name",
      "opportunity": "what could be enhanced or is already strong",
      "location": "where in essay",
      "citationToSupport": "which quote supports this strength"
    }
  ],
  "exampleRelevance": [
    {
      "exampleId": "example_id",
      "relevance": "high|medium|low",
      "specificTechnique": "what technique from this example would help"
    }
  ]
}
\`\`\`

Be specific and thorough. Quote exact text from the essay as evidence.
Identify paragraph locations precisely (paragraph_1, paragraph_2, etc.).
Suggest the most relevant quotes for each issue/opportunity.
`.trim();
  }

  /**
   * Analyze essay structure
   *
   * Returns basic structural metrics about the essay:
   * - Word count
   * - Paragraph count
   * - Whether there's an opening hook
   * - Whether there's a conclusion
   * - Average sentence length
   */
  private analyzeStructure(essayDraft: string): {
    wordCount: number;
    paragraphCount: number;
    hasOpeningHook: boolean;
    hasConclusion: boolean;
    avgSentenceLength: number;
  } {
    const words = essayDraft.trim().split(/\s+/);
    const paragraphs = essayDraft.trim().split(/\n\n+/);
    const sentences = essayDraft.split(/[.!?]+/).filter(s => s.trim().length > 0);

    // Simple heuristics for hook and conclusion
    const firstSentence = sentences[0]?.toLowerCase() || '';
    const lastParagraph = paragraphs[paragraphs.length - 1]?.toLowerCase() || '';

    const hasOpeningHook =
      firstSentence.length < 100 && // Short, punchy opening
      (firstSentence.includes('?') || // Question
        firstSentence.includes('"') || // Quote
        /^(i |my |the |when |if )/i.test(firstSentence)); // Personal/scene-setting

    const hasConclusion =
      lastParagraph.length > 50 && // Substantive conclusion
      (lastParagraph.includes('now') ||
        lastParagraph.includes('today') ||
        lastParagraph.includes('future') ||
        lastParagraph.includes('will'));

    const avgSentenceLength = words.length / Math.max(sentences.length, 1);

    return {
      wordCount: words.length,
      paragraphCount: paragraphs.length,
      hasOpeningHook,
      hasConclusion,
      avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    };
  }

  /**
   * Identify relevant college values
   *
   * Maps which college values are demonstrated in the essay and where.
   * In real implementation, Haiku would do sophisticated pattern matching.
   */
  private identifyRelevantValues(
    coreValues: CollegeCoreValue[],
    essayDraft: string,
    pattern: EssayPattern
  ): Array<{
    valueId: string;
    relevance: 'high' | 'medium' | 'low';
    applicableToLocation: string;
  }> {
    // Placeholder implementation
    // Real implementation: Haiku analyzes essay against each value's definition
    return coreValues.slice(0, 3).map((value, idx) => ({
      valueId: value.valueId,
      relevance: idx === 0 ? ('high' as const) : ('medium' as const),
      applicableToLocation: `paragraph_${idx + 1}`,
    }));
  }

  /**
   * Identify applicable quotes
   *
   * Maps which Dean/AO quotes are most relevant to cite when teaching this essay.
   * Haiku identifies connections between essay issues and available quotes.
   */
  private identifyApplicableQuotes(
    keyQuotes: CollegeKeyQuote[],
    essayDraft: string,
    pattern: EssayPattern
  ): Array<{
    quoteId: string;
    quote: string;
    source: string;
    appliesTo: string;
    relevance: string;
    suggestedUse: string;
  }> {
    // Placeholder implementation
    // Real implementation: Haiku matches essay content to quote use cases
    return keyQuotes.slice(0, 5).map(q => ({
      quoteId: q.quoteId,
      quote: q.quote,
      source: `${q.source.name} (${q.source.title})`,
      appliesTo: 'To be determined by Haiku analysis',
      relevance: 'This quote addresses...',
      suggestedUse: 'Cite when teaching...',
    }));
  }

  /**
   * Detect red flags in essay
   *
   * Identifies which red flags are triggered, with specific evidence
   * and location information. This helps Sonnet quickly find problems.
   */
  private detectRedFlags(
    redFlags: CollegeRedFlag[],
    essayDraft: string
  ): Array<{
    flagId: string;
    flagName: string;
    evidence: string;
    location: string;
    citationToUse: string;
  }> {
    const detected: Array<{
      flagId: string;
      flagName: string;
      evidence: string;
      location: string;
      citationToUse: string;
    }> = [];

    // Real implementation: Haiku checks each red flag's signal phrases
    // against essay content and identifies specific evidence
    redFlags.forEach(flag => {
      // Check if any signal phrases appear in essay
      const signalFound = flag.detection.signalPhrases.some(phrase =>
        essayDraft.toLowerCase().includes(phrase.toLowerCase())
      );

      if (signalFound) {
        // In real implementation, Haiku would extract exact quote
        detected.push({
          flagId: flag.flagId,
          flagName: flag.flagName,
          evidence: 'Haiku would extract specific quote showing this flag',
          location: 'paragraph_X',
          citationToUse: 'relevant_quote_id',
        });
      }
    });

    return detected;
  }

  /**
   * Identify green flag opportunities
   *
   * Finds green flags that are present or could be enhanced.
   * Helps Sonnet recognize and amplify strengths.
   */
  private identifyGreenFlagOpportunities(
    greenFlags: CollegeGreenFlag[],
    essayDraft: string
  ): Array<{
    flagId: string;
    flagName: string;
    opportunity: string;
    location: string;
    citationToSupport: string;
  }> {
    const opportunities: Array<{
      flagId: string;
      flagName: string;
      opportunity: string;
      location: string;
      citationToSupport: string;
    }> = [];

    // Real implementation: Haiku checks for green flag signals
    greenFlags.forEach(flag => {
      const signalFound = flag.detection.signalPhrases.some(phrase =>
        essayDraft.toLowerCase().includes(phrase.toLowerCase())
      );

      if (signalFound) {
        opportunities.push({
          flagId: flag.flagId,
          flagName: flag.flagName,
          opportunity: 'Haiku would identify specific enhancement opportunity',
          location: 'paragraph_X',
          citationToSupport: 'relevant_quote_id',
        });
      }
    });

    return opportunities;
  }

  /**
   * Rank example relevance
   *
   * Determines which elite examples are most helpful for this student
   * to learn from. Focuses on specific techniques.
   */
  private rankExampleRelevance(
    examples: CollegeEliteExample[],
    essayDraft: string
  ): Array<{
    exampleId: string;
    relevance: 'high' | 'medium' | 'low';
    specificTechnique: string;
  }> {
    // Placeholder implementation
    // Real implementation: Haiku matches essay weaknesses to example strengths
    return examples.map(ex => ({
      exampleId: ex.exampleId,
      relevance: 'medium' as const,
      specificTechnique: 'Haiku would identify which technique to learn',
    }));
  }

  /**
   * Build teaching context from citation mapping
   *
   * This creates a concise summary that Sonnet can use to quickly understand
   * which research elements are most relevant. It's a guide, not a replacement
   * for the full research.
   */
  public buildTeachingContext(mapping: CitationMapping): string {
    const context: string[] = [];

    context.push('# Citation Mapping (from Haiku Pre-Analysis)');
    context.push('');
    context.push(
      '*This mapping helps you find relevant research quickly. You have access to ALL research.*'
    );
    context.push('');

    // Structural overview
    context.push('## Essay Structure');
    context.push('');
    context.push(`- Word count: ${mapping.structural.wordCount}`);
    context.push(`- Paragraphs: ${mapping.structural.paragraphCount}`);
    context.push(
      `- Opening hook: ${mapping.structural.hasOpeningHook ? 'Yes' : 'No'}`
    );
    context.push(
      `- Conclusion: ${mapping.structural.hasConclusion ? 'Yes' : 'No'}`
    );
    context.push(
      `- Avg sentence length: ${mapping.structural.avgSentenceLength} words`
    );
    context.push('');

    // Pattern analysis
    context.push('## Pattern Analysis');
    context.push('');
    context.push(
      `- Primary pattern: ${mapping.patternAnalysis.primaryPattern} (${Math.round(mapping.patternAnalysis.confidence * 100)}% confident)`
    );
    if (mapping.patternAnalysis.secondaryPattern) {
      context.push(
        `- Secondary pattern: ${mapping.patternAnalysis.secondaryPattern}`
      );
    }
    context.push('');

    // Relevant values
    if (mapping.relevantValues.length > 0) {
      context.push('## College Values Demonstrated');
      context.push('');
      mapping.relevantValues.forEach(val => {
        context.push(`- **${val.valueId}**: ${val.relevance} relevance`);
        context.push(`  Location: ${val.applicableToLocation}`);
      });
      context.push('');
    }

    // Applicable quotes
    if (mapping.applicableQuotes.length > 0) {
      context.push('## Most Relevant Quotes to Cite');
      context.push('');
      mapping.applicableQuotes.slice(0, 5).forEach(quote => {
        context.push(`### ${quote.quoteId}`);
        context.push(`> "${quote.quote}"`);
        context.push(`**Source**: ${quote.source}`);
        context.push(`**Applies to**: ${quote.appliesTo}`);
        context.push(`**Relevance**: ${quote.relevance}`);
        context.push(`**Suggested use**: ${quote.suggestedUse}`);
        context.push('');
      });
    }

    // Red flags
    if (mapping.triggeredRedFlags.length > 0) {
      context.push('## Red Flags Detected');
      context.push('');
      mapping.triggeredRedFlags.forEach(flag => {
        context.push(`### ${flag.flagName}`);
        context.push(`**Evidence**: "${flag.evidence}"`);
        context.push(`**Location**: ${flag.location}`);
        context.push(`**Quote to cite**: ${flag.citationToUse}`);
        context.push('');
      });
    }

    // Green flags
    if (mapping.greenFlagOpportunities.length > 0) {
      context.push('## Green Flag Opportunities');
      context.push('');
      mapping.greenFlagOpportunities.forEach(flag => {
        context.push(`### ${flag.flagName}`);
        context.push(`**Opportunity**: ${flag.opportunity}`);
        context.push(`**Location**: ${flag.location}`);
        context.push(`**Quote to support**: ${flag.citationToSupport}`);
        context.push('');
      });
    }

    // Example recommendations
    if (mapping.exampleRelevance.length > 0) {
      const highRelevance = mapping.exampleRelevance.filter(
        ex => ex.relevance === 'high'
      );
      if (highRelevance.length > 0) {
        context.push('## Most Relevant Examples to Show');
        context.push('');
        highRelevance.forEach(ex => {
          context.push(`- **${ex.exampleId}**`);
          context.push(`  Technique to learn: ${ex.specificTechnique}`);
        });
        context.push('');
      }
    }

    context.push('---');
    context.push('');

    return context.join('\n');
  }

  /**
   * Hash essay for caching/tracking
   */
  private hashEssay(essayDraft: string): string {
    // Simple hash implementation
    // In production, use crypto.createHash('sha256')
    return `essay_${essayDraft.length}_${Date.now()}`;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const haikuCitationService = new HaikuCitationService();
