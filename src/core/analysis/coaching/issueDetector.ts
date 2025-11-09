/**
 * Issue Detector: Identifies specific, addressable issues in extracurricular narratives
 *
 * Outputs structured issues that map directly to UI components:
 * - Quote from draft
 * - Problem explanation
 * - Why it matters
 * - Multiple fix suggestions (with "Why This Works")
 */

import { RubricCategoryScore, ExperienceEntry } from '../../types/experience';
import { AuthenticityAnalysis } from '../features/authenticityDetector';
import { ExtractedFeatures } from '../../types/experience';

// ============================================================================
// TYPES
// ============================================================================

export interface DetectedIssue {
  id: string;
  category: string;  // Maps to rubric category
  severity: 'critical' | 'important' | 'helpful';

  // UI display
  title: string;
  from_draft: string;  // Quote from their text

  // Explanation
  problem: string;      // "The Problem"
  why_matters: string;  // "Why It Matters"

  // Fix suggestions (paginated in UI)
  suggested_fixes: SuggestedFix[];
}

export interface SuggestedFix {
  fix_text: string;           // The actual fix/rewrite
  why_this_works: string;     // Explanation
  teaching_example?: string;  // Optional: example from different context
  apply_type: 'replace' | 'add' | 'reframe' | 'elicit';  // How to apply
}

export interface CategoryIssues {
  category_name: string;
  category_key: string;
  score: number;
  diagnosis: string;  // Brief summary for collapsed view
  issues_count: number;
  detected_issues: DetectedIssue[];
}

// ============================================================================
// MAIN ISSUE DETECTION
// ============================================================================

export function detectAllIssues(
  entry: ExperienceEntry,
  categoryScores: RubricCategoryScore[],
  authenticity: AuthenticityAnalysis,
  features: ExtractedFeatures
): CategoryIssues[] {
  const allCategoryIssues: CategoryIssues[] = [];

  for (const category of categoryScores) {
    const issues = detectCategoryIssues(
      category,
      entry,
      authenticity,
      features
    );

    if (issues.detected_issues.length > 0) {
      allCategoryIssues.push(issues);
    }
  }

  // Sort by severity (critical issues first)
  return allCategoryIssues.sort((a, b) => {
    const criticalA = a.detected_issues.filter(i => i.severity === 'critical').length;
    const criticalB = b.detected_issues.filter(i => i.severity === 'critical').length;
    return criticalB - criticalA;
  });
}

function detectCategoryIssues(
  category: RubricCategoryScore,
  entry: ExperienceEntry,
  authenticity: AuthenticityAnalysis,
  features: ExtractedFeatures
): CategoryIssues {
  const categoryName = category.name.toLowerCase();
  const score = category.score_0_to_10;
  const issues: DetectedIssue[] = [];

  // Route to specific detectors based on category
  if (categoryName.includes('voice')) {
    issues.push(...detectVoiceIssues(entry, authenticity, score));
  } else if (categoryName.includes('specificity') || categoryName.includes('evidence')) {
    issues.push(...detectSpecificityIssues(entry, features, score));
  } else if (categoryName.includes('reflection') || categoryName.includes('meaning')) {
    issues.push(...detectReflectionIssues(entry, features, score));
  } else if (categoryName.includes('narrative') || categoryName.includes('arc')) {
    issues.push(...detectNarrativeIssues(entry, features, score));
  } else if (categoryName.includes('initiative') || categoryName.includes('leadership')) {
    issues.push(...detectInitiativeIssues(entry, features, score));
  } else if (categoryName.includes('community') || categoryName.includes('collaboration')) {
    issues.push(...detectCollaborationIssues(entry, features, score));
  }

  return {
    category_name: formatCategoryName(category.name),
    category_key: category.name,
    score,
    diagnosis: generateCategoryDiagnosis(category.name, score),
    issues_count: issues.length,
    detected_issues: issues,
  };
}

// ============================================================================
// VOICE & AUTHENTICITY ISSUES
// ============================================================================

function detectVoiceIssues(
  entry: ExperienceEntry,
  auth: AuthenticityAnalysis,
  score: number
): DetectedIssue[] {
  const issues: DetectedIssue[] = [];
  const text = entry.description_original;

  // Critical: Essay-speak phrases
  if (auth.red_flags.includes('excessive_manufactured_phrases') ||
      auth.red_flags.includes('pure_essay_voice')) {

    const essaySpeakPhrases = [
      'this taught me that',
      'through this experience',
      'i came to realize',
      'i learned valuable lessons',
      'from this experience',
    ];

    for (const phrase of essaySpeakPhrases) {
      const regex = new RegExp(phrase, 'i');
      const match = text.match(regex);

      if (match) {
        const sentence = extractSentence(text, match.index!);

        issues.push({
          id: `voice-essay-speak-${issues.length}`,
          category: 'Voice Integrity',
          severity: 'critical',
          title: 'Essay-Speak Detected',
          from_draft: sentence,
          problem: 'This sounds like formal essay language instead of your authentic voice. It feels written FOR admissions rather than FROM you.',
          why_matters: 'Authentic voice makes you memorable. Generic essay-speak makes every applicant sound the same.',
          suggested_fixes: [
            {
              fix_text: 'Cut this sentence entirely and show the learning through a specific story instead.',
              why_this_works: 'Showing beats telling. Let readers discover your insight through narrative.',
              apply_type: 'replace',
            },
            {
              fix_text: 'Rewrite in conversational tone: Start with "Turns out..." or "I didn\'t expect..." instead.',
              why_this_works: 'Conversational openers signal authenticity and feel less manufactured.',
              teaching_example: 'Instead of "Through this experience, I learned leadership," try "Turns out, leadership isn\'t about having the right answer."',
              apply_type: 'reframe',
            },
            {
              fix_text: 'Replace with a specific moment that demonstrates the insight.',
              why_this_works: 'Concrete moments are more memorable and credible than stated lessons.',
              teaching_example: 'Instead of "I learned patience," write "Three hours in, explaining the same concept five different ways, I stopped checking my watch."',
              apply_type: 'replace',
            },
          ],
        });
        break; // Only flag one instance per issue type
      }
    }
  }

  // Important: Passive voice
  if (score < 7 && /was|were|been/.test(text)) {
    const passiveMatch = text.match(/(was|were|been)\s+\w+ed/i);
    if (passiveMatch) {
      const sentence = extractSentence(text, passiveMatch.index!);

      issues.push({
        id: `voice-passive-${issues.length}`,
        category: 'Voice Integrity',
        severity: 'important',
        title: 'Passive Voice Weakens Impact',
        from_draft: sentence,
        problem: 'Passive voice makes you sound distant from your own story and obscures your agency.',
        why_matters: 'Active voice shows ownership and makes your contributions clear.',
        suggested_fixes: [
          {
            fix_text: 'Rewrite with active voice: "I organized..." instead of "It was organized..."',
            why_this_works: 'Active voice puts you at the center of the action and shows initiative.',
            teaching_example: 'Weak: "The project was completed by our team." Strong: "I led our team to complete the project."',
            apply_type: 'reframe',
          },
        ],
      });
    }
  }

  // Important: SAT vocabulary showing off
  if (auth.red_flags.includes('vocabulary_showing_off')) {
    const fancyWords = ['plethora', 'myriad', 'multitude', 'culmination', 'proliferation'];
    for (const word of fancyWords) {
      if (text.toLowerCase().includes(word)) {
        const match = text.match(new RegExp(`\\b${word}\\b`, 'i'));
        if (match) {
          const sentence = extractSentence(text, match.index!);

          issues.push({
            id: `voice-vocabulary-${issues.length}`,
            category: 'Voice Integrity',
            severity: 'important',
            title: 'Vocabulary Showing Off',
            from_draft: sentence,
            problem: `Using fancy words like "${word}" makes you sound like you're trying to impress rather than communicate.`,
            why_matters: 'Authenticity matters more than vocabulary. Admissions officers prefer clarity over complexity.',
            suggested_fixes: [
              {
                fix_text: `Replace "${word}" with simpler language: "many" or be specific with an exact number.`,
                why_this_works: 'Simple, precise language sounds more authentic and confident.',
                teaching_example: 'Instead of "a plethora of challenges," write "12 technical problems" or simply "many setbacks."',
                apply_type: 'replace',
              },
            ],
          });
          break;
        }
      }
    }
  }

  return issues;
}

// ============================================================================
// SPECIFICITY & EVIDENCE ISSUES
// ============================================================================

function detectSpecificityIssues(
  entry: ExperienceEntry,
  features: ExtractedFeatures,
  score: number
): DetectedIssue[] {
  const issues: DetectedIssue[] = [];
  const text = entry.description_original;

  // Critical: No concrete numbers
  if (!features.evidence.has_concrete_numbers || features.evidence.number_count < 2) {
    // Find vague phrases
    const vagueMatches = text.match(/(many|several|numerous|frequently|often|regularly)/i);
    if (vagueMatches) {
      const sentence = extractSentence(text, vagueMatches.index!);

      issues.push({
        id: `specificity-no-numbers-${issues.length}`,
        category: 'Specificity & Evidence',
        severity: 'critical',
        title: 'Missing Concrete Numbers',
        from_draft: sentence,
        problem: 'Vague words like "many," "several," or "often" leave readers guessing about your actual commitment.',
        why_matters: 'Specific numbers build credibility and help admissions officers gauge the scale of your work.',
        suggested_fixes: [
          {
            fix_text: `Replace "${vagueMatches[0]}" with exact numbers: how many hours? how many people? how many times?`,
            why_this_works: 'Exact numbers are instantly credible and show you\'re grounded in reality.',
            teaching_example: 'Weak: "I volunteered frequently." Strong: "Every Tuesday, 6-9pm, for 18 months."',
            apply_type: 'replace',
          },
          {
            fix_text: 'Add time commitment: "X hours per week for Y months" or total hours.',
            why_this_works: 'Time commitment signals dedication and helps readers understand scope.',
            teaching_example: '"156 hours over 11 months" is more impressive than "volunteered regularly."',
            apply_type: 'add',
          },
          {
            fix_text: 'Quantify impact: How many people? How much money? What measurable change?',
            why_this_works: 'Measurable outcomes show your work had real effects.',
            teaching_example: '"Helped 47 students prepare for SATs" beats "helped many students."',
            apply_type: 'add',
          },
        ],
      });
    } else {
      // No vague words but still no numbers - general issue
      issues.push({
        id: 'specificity-missing-metrics',
        category: 'Specificity & Evidence',
        severity: 'critical',
        title: 'No Measurable Details',
        from_draft: text.substring(0, 100) + '...',
        problem: 'Your description lacks concrete numbers, making it hard for readers to understand the scope of your work.',
        why_matters: 'Without metrics, admissions officers can\'t gauge whether this was a casual hobby or serious commitment.',
        suggested_fixes: [
          {
            fix_text: 'Add your time investment: hours per week, weeks per year, or total hours.',
            why_this_works: 'Time metrics help readers understand your dedication level.',
            teaching_example: '"4 hours per week, 44 weeks per year (176 total hours)"',
            apply_type: 'add',
          },
          {
            fix_text: 'Quantify people impacted: students tutored, audience size, team members, etc.',
            why_this_works: 'Scale of impact matters for assessing significance.',
            apply_type: 'elicit',
          },
          {
            fix_text: 'Include measurable outcomes: money raised, projects completed, problems solved.',
            why_this_works: 'Tangible results prove your work had real effects.',
            teaching_example: '"Raised $2,847" or "Completed 6 website redesigns"',
            apply_type: 'elicit',
          },
        ],
      });
    }
  }

  // Important: No before/after comparison
  if (score < 7 && !features.evidence.before_after_comparison) {
    issues.push({
      id: 'specificity-no-growth',
      category: 'Specificity & Evidence',
      severity: 'important',
      title: 'Missing Growth/Progress',
      from_draft: text.substring(0, 100) + '...',
      problem: 'You describe what you did, but not how things changed over time or what improved.',
      why_matters: 'Showing growth demonstrates learning and development, which admissions values highly.',
      suggested_fixes: [
        {
          fix_text: 'Add a "From X to Y" comparison: "Started with 5 members, ended with 23" or "First project took 6 hours, last one took 2."',
          why_this_works: 'Before/after shows tangible progress and skill development.',
          teaching_example: '"My first presentation bombed (12% approval). By my sixth, approval hit 87%."',
          apply_type: 'add',
        },
        {
          fix_text: 'Show skill progression: What could you do at the end that you couldn\'t do at the start?',
          why_this_works: 'Skill development proves you actually learned something concrete.',
          teaching_example: '"Month one: I could barely tune a guitar. Month six: I was teaching others chord progressions."',
          apply_type: 'elicit',
        },
      ],
    });
  }

  return issues;
}

// ============================================================================
// REFLECTION & MEANING ISSUES
// ============================================================================

function detectReflectionIssues(
  entry: ExperienceEntry,
  features: ExtractedFeatures,
  score: number
): DetectedIssue[] {
  const issues: DetectedIssue[] = [];
  const text = entry.description_original;

  // Critical: Generic lessons
  const genericLessons = ['teamwork', 'leadership', 'communication', 'dedication', 'perseverance'];
  for (const lesson of genericLessons) {
    const regex = new RegExp(`\\b${lesson}\\b`, 'i');
    if (regex.test(text)) {
      const match = text.match(regex);
      if (match) {
        const sentence = extractSentence(text, match.index!);

        issues.push({
          id: `reflection-generic-${issues.length}`,
          category: 'Reflection & Meaning',
          severity: 'critical',
          title: 'Generic Reflection',
          from_draft: sentence,
          problem: `Saying you learned "${lesson}" is too generic. What specifically did you learn about ${lesson}?`,
          why_matters: 'Generic lessons could apply to anyone. Your unique insight is what makes you memorable.',
          suggested_fixes: [
            {
              fix_text: `Delete the generic statement. Show a specific moment that demonstrates your understanding of ${lesson}.`,
              why_this_works: 'Showing beats telling. A concrete story is more memorable than a stated lesson.',
              teaching_example: `Instead of "I learned teamwork," write: "When Sarah caught my mistake before the client demo, I realized great teams make everyone better."`,
              apply_type: 'replace',
            },
            {
              fix_text: 'Get specific: What belief about yourself or the world changed?',
              why_this_works: 'Belief shifts show genuine intellectual growth, not just activity participation.',
              teaching_example: `"I used to think ${lesson} meant X. Now I know it means Y."`,
              apply_type: 'reframe',
            },
            {
              fix_text: 'Identify what you do differently now because of this insight.',
              why_this_works: 'Behavioral changes prove the learning was real and transferable.',
              teaching_example: 'Instead of "I learned patience," write "Now when I teach, I count to five before jumping in with the answer."',
              apply_type: 'reframe',
            },
          ],
        });
        break; // Only flag first instance
      }
    }
  }

  // Critical: No reflection at all
  if (features.reflection.reflection_quality === 'none') {
    issues.push({
      id: 'reflection-missing',
      category: 'Reflection & Meaning',
      severity: 'critical',
      title: 'No Reflection or Learning',
      from_draft: text,
      problem: 'You describe what you did, but not what you learned or how you changed.',
      why_matters: 'Admissions wants to see self-awareness and intellectual maturity, not just a resume.',
      suggested_fixes: [
        {
          fix_text: 'Answer: What did you believe before starting? What do you believe now?',
          why_this_works: 'Belief shifts show genuine growth and self-awareness.',
          apply_type: 'elicit',
        },
        {
          fix_text: 'Answer: What\'s one thing you do differently now because of this experience?',
          why_this_works: 'Behavioral changes prove the learning was real and impactful.',
          apply_type: 'elicit',
        },
        {
          fix_text: 'Answer: What surprised you? What didn\'t go as expected?',
          why_this_works: 'Surprise indicates genuine discovery, not manufactured reflection.',
          apply_type: 'elicit',
        },
      ],
    });
  }

  // Important: Superficial reflection
  if (features.reflection.reflection_quality === 'superficial' && score < 6) {
    const formulaicMatch = text.match(/(taught me|learned|realized|understood|came to)/i);
    if (formulaicMatch) {
      const sentence = extractSentence(text, formulaicMatch.index!);

      issues.push({
        id: 'reflection-superficial',
        category: 'Reflection & Meaning',
        severity: 'important',
        title: 'Reflection Feels Formulaic',
        from_draft: sentence,
        problem: 'Your reflection uses predictable phrasing ("taught me," "I learned") that signals essay-speak.',
        why_matters: 'Authentic insight comes through story and specific moments, not stated lessons.',
        suggested_fixes: [
          {
            fix_text: 'Replace with a specific story that SHOWS the insight without stating it.',
            why_this_works: 'Readers remember stories, not lessons. Let them discover your insight.',
            teaching_example: 'Instead of "This taught me resilience," write about the specific moment you kept going when you wanted to quit.',
            apply_type: 'replace',
          },
          {
            fix_text: 'Use a more authentic reflection format: "Turns out..." or "I didn\'t expect..."',
            why_this_works: 'Conversational reflection sounds like genuine discovery, not manufactured wisdom.',
            apply_type: 'reframe',
          },
        ],
      });
    }
  }

  return issues;
}

// ============================================================================
// NARRATIVE ARC & STAKES ISSUES
// ============================================================================

function detectNarrativeIssues(
  entry: ExperienceEntry,
  features: ExtractedFeatures,
  score: number
): DetectedIssue[] {
  const issues: DetectedIssue[] = [];
  const text = entry.description_original;

  // Important: No stakes or tension
  if (!features.arc.has_stakes && score < 6) {
    issues.push({
      id: 'narrative-no-stakes',
      category: 'Narrative Arc & Stakes',
      severity: 'important',
      title: 'Missing Stakes or Challenge',
      from_draft: text.substring(0, 150) + '...',
      problem: 'Your narrative feels flat because there\'s no tension, obstacle, or challenge to overcome.',
      why_matters: 'Stories without stakes don\'t engage readers. Challenge makes achievement meaningful.',
      suggested_fixes: [
        {
          fix_text: 'Identify one obstacle you faced: What went wrong? What was harder than expected?',
          why_this_works: 'Obstacles create tension and make your perseverance visible.',
          apply_type: 'elicit',
        },
        {
          fix_text: 'Show what was at risk: What could have gone wrong? Why did it matter?',
          why_this_works: 'Stakes make readers care about the outcome.',
          teaching_example: 'Instead of "I organized a fundraiser that succeeded," write "Three days before our fundraiser, the venue cancelled. We had 45 RSVPs and no location."',
          apply_type: 'reframe',
        },
        {
          fix_text: 'Include a moment of doubt: When did you question if you could do this?',
          why_this_works: 'Vulnerability makes you relatable and shows authentic growth.',
          apply_type: 'elicit',
        },
      ],
    });
  }

  // Helpful: No turning point
  if (!features.arc.has_turning_point && score < 7) {
    issues.push({
      id: 'narrative-no-turning',
      category: 'Narrative Arc & Stakes',
      severity: 'helpful',
      title: 'Missing Turning Point',
      from_draft: text.substring(0, 150) + '...',
      problem: 'Your story lacks a clear moment when things changed or clicked.',
      why_matters: 'Turning points give narrative structure and make growth visible.',
      suggested_fixes: [
        {
          fix_text: 'Identify when things shifted: When did your approach change? What triggered the breakthrough?',
          why_this_works: 'Turning points make abstract growth concrete and memorable.',
          teaching_example: '"After three failed prototypes, I stopped trying to force my original design and asked the users what THEY needed."',
          apply_type: 'elicit',
        },
      ],
    });
  }

  return issues;
}

// ============================================================================
// INITIATIVE & LEADERSHIP ISSUES
// ============================================================================

function detectInitiativeIssues(
  entry: ExperienceEntry,
  features: ExtractedFeatures,
  score: number
): DetectedIssue[] {
  const issues: DetectedIssue[] = [];
  const text = entry.description_original;

  // Important: Too much "we" language
  if (features.collaboration.we_usage_count > 5 && score < 6) {
    const weMatch = text.match(/\bwe\b/i);
    if (weMatch) {
      const sentence = extractSentence(text, weMatch.index!);

      issues.push({
        id: 'initiative-too-much-we',
        category: 'Initiative & Leadership',
        severity: 'important',
        title: 'Unclear Personal Role',
        from_draft: sentence,
        problem: 'You use "we" frequently, making it unclear what YOU specifically contributed.',
        why_matters: 'Admissions needs to understand YOUR unique role and contributions, not just team achievements.',
        suggested_fixes: [
          {
            fix_text: 'Rewrite to clarify YOUR specific role: "I did X while the team handled Y."',
            why_this_works: 'Clear role delineation shows your unique contributions.',
            apply_type: 'reframe',
          },
          {
            fix_text: 'Identify one decision YOU made or problem YOU solved independently.',
            why_this_works: 'Individual decisions demonstrate initiative and ownership.',
            apply_type: 'elicit',
          },
        ],
      });
    }
  }

  // Important: Passive role
  const passiveIndicators = ['helped', 'assisted', 'supported', 'participated'];
  for (const indicator of passiveIndicators) {
    if (text.toLowerCase().includes(indicator) && score < 6) {
      const match = text.match(new RegExp(`\\b${indicator}\\b`, 'i'));
      if (match) {
        const sentence = extractSentence(text, match.index!);

        issues.push({
          id: `initiative-passive-${issues.length}`,
          category: 'Initiative & Leadership',
          severity: 'important',
          title: 'Passive Role Language',
          from_draft: sentence,
          problem: `Words like "${indicator}" make you sound like a helper, not a leader or owner.`,
          why_matters: 'Initiative and ownership impress admissions more than participation.',
          suggested_fixes: [
            {
              fix_text: `Replace "${indicator}" with active verbs: "organized," "created," "designed," "solved."`,
              why_this_works: 'Active verbs signal ownership and agency.',
              teaching_example: `Instead of "helped organize," write "organized" or "coordinated."`,
              apply_type: 'replace',
            },
            {
              fix_text: 'Clarify: What would NOT have happened without you?',
              why_this_works: 'Counterfactual thinking reveals your unique impact.',
              apply_type: 'elicit',
            },
          ],
        });
        break;
      }
    }
  }

  return issues;
}

// ============================================================================
// COLLABORATION ISSUES
// ============================================================================

function detectCollaborationIssues(
  entry: ExperienceEntry,
  features: ExtractedFeatures,
  score: number
): DetectedIssue[] {
  const issues: DetectedIssue[] = [];
  const text = entry.description_original;

  // Helpful: No credit given to others
  if (!features.collaboration.credit_given && features.collaboration.we_usage_count === 0 && score < 7) {
    issues.push({
      id: 'collaboration-no-credit',
      category: 'Community & Collaboration',
      severity: 'helpful',
      title: 'No Acknowledgment of Others',
      from_draft: text.substring(0, 150) + '...',
      problem: 'You don\'t mention collaborators, mentors, or people you worked with.',
      why_matters: 'Acknowledging others shows humility and teamwork - qualities colleges value.',
      suggested_fixes: [
        {
          fix_text: 'Name 1-2 specific people you worked with and what they taught you or contributed.',
          why_this_works: 'Specific names make your story more credible and show you value relationships.',
          teaching_example: '"Dr. Kim taught me to debug without panicking" or "Marcus rallied the team when I froze."',
          apply_type: 'add',
        },
      ],
    });
  }

  return issues;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function extractSentence(text: string, index: number): string {
  // Find sentence boundaries
  const before = text.substring(0, index);
  const after = text.substring(index);

  const startMatch = before.match(/[.!?]\s*$/);
  const start = startMatch ? before.lastIndexOf(startMatch[0]) + startMatch[0].length : 0;

  const endMatch = after.match(/[.!?]/);
  const end = endMatch ? index + after.indexOf(endMatch[0]) + 1 : text.length;

  return text.substring(start, end).trim();
}

function formatCategoryName(key: string): string {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' & ');
}

function generateCategoryDiagnosis(categoryName: string, score: number): string {
  if (score >= 8) return `Outstanding! Your ${formatCategoryName(categoryName).toLowerCase()} is strong.`;
  if (score >= 6.5) return `Solid ${formatCategoryName(categoryName).toLowerCase()}, but room for improvement.`;
  if (score >= 5) return `${formatCategoryName(categoryName)} needs strengthening to stand out.`;
  if (score >= 3) return `Weak ${formatCategoryName(categoryName).toLowerCase()} - major improvements needed.`;
  return `Critical: No clear ${formatCategoryName(categoryName).toLowerCase()} detected.`;
}
