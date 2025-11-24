/**
 * Quotable Reflection Analyzer - The Insight Generator
 *
 * Analyzes reflection quality and identifies "quotable" insights that could be
 * TED talk titles or memorable lines that AOs remember months later.
 *
 * Research Foundation:
 * - Harvard Personal Rating: "Unusual maturity in self-reflection" is key criterion
 * - Stanford: "We want depth, not breadth. One profound insight > 5 surface observations"
 * - Berkeley AO: "The essays I remember have ONE insight so good I wrote it down"
 * - 63% of admits use "micro-to-macro" pattern (specific → universal)
 *
 * THE REFLECTION QUALITY LADDER:
 *
 * Level 1 (3-4/10): Generic Wisdom - AVOID
 * - "I learned that teamwork is important"
 * - "This taught me to never give up"
 * - "Leadership means helping others"
 * Problem: Every essay says this. Not memorable. No depth.
 *
 * Level 2 (5-6/10): Specific But Not Transferable
 * - "I learned that robotics requires patience and precision"
 * - "This taught me how to manage a team of 80 people"
 * Better: Specific to experience, but doesn't transcend it
 *
 * Level 3 (7-8/10): Specific + Universal - COMPETITIVE
 * - "Leadership isn't about having the best idea or making the final call.
 *    It's about listening long enough to understand what truly motivates people
 *    and creating a space where their combined passions build something better."
 * Good: Moves from specific (your experience) to universal (life/people in general)
 *
 * Level 4 (9-9.5/10): Specific + Surprising + Transferable - TIER 1
 * - "I used to think leadership meant having the loudest voice.
 *    But steering 80 personalities taught me something paradoxical:
 *    the quieter I became, the more they listened.
 *    Silence creates space for others' voices."
 * Excellent: Challenges assumption, reveals paradox, profound truth
 *
 * Level 5 (9.5-10/10): Quotable (TED Talk-Worthy) - TOP 1%
 * - "Leadership isn't about choosing between the safe path and the bold one.
 *    It's about building bridges strong enough to carry both—
 *    and trusting your team to walk them together."
 * Perfect: Poetic language, memorable metaphor, could be a TED talk title
 *
 * THE QUOTABLE FORMULA:
 * [Challenge common belief] + [Reveal surprising truth] + [Universal wisdom] + [Poetic language]
 *
 * "I used to think X. But [experience] taught me Y. Now I see Z."
 *
 * DETECTION STRATEGY:
 * 1. Transformation language ("I used to think", "Now I see")
 * 2. Universal scope ("people", "we", "life", "world")
 * 3. Paradox/surprise ("paradoxically", "surprisingly", "opposite")
 * 4. Philosophical concepts (identity, belonging, purpose, meaning)
 * 5. Metaphor/analogy (bridges, mirrors, threads, foundations)
 * 6. Parallel structure (X is not about Y, it's about Z)
 * 7. Forward-looking ("At Berkeley, I'll...", "moving forward")
 * 8. Avoids clichés ("passion", "journey", "taught me a lot")
 */
export type ReflectionLevel = 1 | 2 | 3 | 4 | 5;
export interface QuotableReflectionAnalysis {
    reflection_level: ReflectionLevel;
    score_0_to_10: number;
    tier: 'quotable' | 'profound' | 'thoughtful' | 'specific' | 'generic';
    is_quotable: boolean;
    has_transformation: boolean;
    has_universal_scope: boolean;
    has_surprise: boolean;
    has_philosophical_depth: boolean;
    has_poetic_language: boolean;
    has_future_application: boolean;
    micro_to_macro: boolean;
    challenges_assumption: boolean;
    avoids_cliches: boolean;
    transformation_phrases: string[];
    universal_language: string[];
    surprise_elements: string[];
    philosophical_concepts: string[];
    metaphors_analogies: string[];
    parallel_structures: string[];
    cliches_found: string[];
    most_quotable_line: string | null;
    reflection_quotes: string[];
    strengths: string[];
    weaknesses: string[];
    current_level: ReflectionLevel;
    next_level: ReflectionLevel;
    upgrade_to_quotable: {
        formula: string;
        example_transformation: {
            current: string;
            level_3: string;
            level_4: string;
            level_5_quotable: string;
        };
    };
    harvard_maturity: boolean;
    stanford_depth: boolean;
    berkeley_memorable: boolean;
    ao_assessment: string;
}
export declare function analyzeQuotableReflection(text: string): QuotableReflectionAnalysis;
export type { QuotableReflectionAnalysis, ReflectionLevel };
//# sourceMappingURL=quotableReflectionAnalyzer.d.ts.map