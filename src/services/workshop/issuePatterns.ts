/**
 * Comprehensive Issue Pattern Detection Database
 *
 * Sophisticated pattern matching for all 11 rubric dimensions with:
 * - Regex patterns for detection
 * - Severity classification
 * - Detailed explanations
 * - Context-aware matching
 *
 * Built on top of existing issueDetector.ts but expanded for deeper analysis.
 */

import type { RubricCategory } from '@/components/portfolio/extracurricular/workshop/backendTypes';

// ============================================================================
// TYPES
// ============================================================================

export interface IssuePattern {
  id: string;
  name: string;
  dimension: RubricCategory;
  regex: RegExp;
  severity: 'critical' | 'major' | 'minor';
  explanation: string;
  technicalDetails: string;
  whyItMatters: string;
  detectionNotes?: string; // Optional: edge cases, context needed
}

export interface PatternGroup {
  dimension: RubricCategory;
  displayName: string;
  patterns: IssuePattern[];
}

// ============================================================================
// DIMENSION 1: VOICE INTEGRITY (12% weight)
// ============================================================================

const voiceIntegrityPatterns: IssuePattern[] = [
  {
    id: 'voice-001-manufactured-phrases',
    name: 'Manufactured Phrases',
    dimension: 'voice_integrity',
    regex: /\b(countless|numerous|various|myriad|plethora|valuable|rewarding|meaningful|intense|significant|profound)\b/gi,
    severity: 'critical',
    explanation: 'Generic intensifiers that replace specific details and signal inauthentic "college essay voice"',
    technicalDetails: 'These are placeholder words that tell rather than show. They could appear in anyone\'s essay.',
    whyItMatters: 'Admissions officers read 50+ essays per day. Manufactured phrases make yours blend into the pile instead of standing out.',
  },
  {
    id: 'voice-002-essay-speak',
    name: 'Essay-Speak Phrases',
    dimension: 'voice_integrity',
    regex: /\b(through this experience|this taught me that|i came to realize|from this experience|this has shown me|as a result of|looking back|in retrospect)\b/gi,
    severity: 'critical',
    explanation: 'Formal essay language that signals writing FOR admissions rather than FROM authentic voice',
    technicalDetails: 'These transition phrases are taught in essay writing courses but rarely appear in natural speech or strong narratives.',
    whyItMatters: 'Authentic voice makes you memorable. Essay-speak makes every applicant sound the same and manufactured.',
  },
  {
    id: 'voice-003-passive-voice',
    name: 'Passive Voice',
    dimension: 'voice_integrity',
    regex: /\b(was|were|been|being)\s+\w+(ed|en)\b/gi,
    severity: 'major',
    explanation: 'Passive constructions that hide agency and make you sound distant from your own story',
    technicalDetails: 'Pattern: [to be verb] + [past participle]. Example: "was organized" instead of "I organized"',
    whyItMatters: 'Active voice shows ownership and makes your contributions clear. Passive voice obscures who did what.',
  },
  {
    id: 'voice-004-hedge-words',
    name: 'Hedge Words',
    dimension: 'voice_integrity',
    regex: /\b(sort of|kind of|somewhat|rather|quite|fairly|pretty much|in a way)\b/gi,
    severity: 'major',
    explanation: 'Weak qualifiers that undermine confidence and signal uncertainty',
    technicalDetails: 'These phrases weaken assertions and make you sound hesitant about your own experiences.',
    whyItMatters: 'Confidence signals competence. Hedging makes you sound unsure or trying to pre-emptively defend claims.',
  },
  {
    id: 'voice-005-vocabulary-showing-off',
    name: 'Vocabulary Showing Off',
    dimension: 'voice_integrity',
    regex: /\b(utilize|commence|terminate|endeavor|ameliorate|proliferation|culmination|multifaceted|comprehensive)\b/gi,
    severity: 'major',
    explanation: 'SAT vocabulary words that feel forced and make you sound like you\'re trying to impress',
    technicalDetails: 'Simple, precise language sounds more authentic. "Use" beats "utilize," "start" beats "commence"',
    whyItMatters: 'Authenticity matters more than vocabulary. Officers prefer clarity over complexity.',
  },
  {
    id: 'voice-006-cliche-phrases',
    name: 'College Essay Clichés',
    dimension: 'voice_integrity',
    regex: /\b(passion|journey|rewarding experience|valuable learning|important skills|stepping stone|eye-opening|life-changing|game-changer)\b/gi,
    severity: 'major',
    explanation: 'Overused phrases that signal generic writing and lack of original thought',
    technicalDetails: 'These phrases appear in thousands of essays annually and offer zero differentiation.',
    whyItMatters: 'Clichés are red flags for manufactured content. Original language shows original thinking.',
  },
];

// ============================================================================
// DIMENSION 2: SPECIFICITY & EVIDENCE (11% weight)
// ============================================================================

const specificityEvidencePatterns: IssuePattern[] = [
  {
    id: 'spec-001-vague-quantifiers',
    name: 'Vague Quantifiers',
    dimension: 'specificity_evidence',
    regex: /\b(many|some|several|few|lots of|plenty of|a lot of|numerous|various|multiple)\b/gi,
    severity: 'critical',
    explanation: 'Imprecise quantities that leave readers guessing about scope and commitment',
    technicalDetails: 'These words signal you either don\'t know the details or don\'t want to share them.',
    whyItMatters: 'Specific numbers build credibility. Vague quantifiers suggest superficial involvement or exaggeration.',
  },
  {
    id: 'spec-002-vague-time',
    name: 'Vague Time References',
    dimension: 'specificity_evidence',
    regex: /\b(frequently|often|regularly|sometimes|occasionally|usually|typically)\b/gi,
    severity: 'major',
    explanation: 'Imprecise time commitment that makes it impossible to gauge dedication',
    technicalDetails: 'Replace with exact schedules: "Every Tuesday 3-5pm" or "4 hours/week for 18 months"',
    whyItMatters: 'Time investment signals commitment depth. Vagueness suggests casual involvement.',
  },
  {
    id: 'spec-003-weak-verbs',
    name: 'Weak Action Verbs',
    dimension: 'specificity_evidence',
    regex: /\b(worked on|dealt with|was involved in|participated in|did|got|had)\b/gi,
    severity: 'major',
    explanation: 'Generic verbs that don\'t convey specific actions or expertise',
    technicalDetails: 'Replace with precise verbs: "debugged," "coordinated," "designed," "analyzed," "synthesized"',
    whyItMatters: 'Specific verbs signal expertise and deep involvement. Generic verbs suggest surface-level participation.',
  },
  {
    id: 'spec-004-no-before-after',
    name: 'Missing Before/After Comparison',
    dimension: 'specificity_evidence',
    regex: /^(?!.*(started with|ended with|from \d+|to \d+|increased|decreased|improved|grew|before|after)).+$/gim,
    severity: 'major',
    explanation: 'No quantified growth or change over time',
    technicalDetails: 'Strong essays show progression: "Started with 5 members, ended with 23" or "First project took 6 hours, last took 2"',
    whyItMatters: 'Growth metrics prove learning and skill development, not just time spent.',
    detectionNotes: 'This pattern needs essay-level analysis, not just regex matching',
  },
  {
    id: 'spec-005-no-metrics',
    name: 'No Concrete Numbers',
    dimension: 'specificity_evidence',
    regex: /^(?!.*\d).+$/gm,
    severity: 'critical',
    explanation: 'Entire essay lacks quantified impact or metrics',
    technicalDetails: 'Strong essays include: time commitment, people impacted, money raised, projects completed, measurable outcomes',
    whyItMatters: 'Without metrics, officers can\'t gauge if this was casual hobby or serious commitment.',
    detectionNotes: 'Run this on whole essay, not sentence-by-sentence',
  },
];

// ============================================================================
// DIMENSION 3: TRANSFORMATIVE IMPACT (11% weight)
// ============================================================================

const transformativeImpactPatterns: IssuePattern[] = [
  {
    id: 'transform-001-generic-learning',
    name: 'Generic Learning Statements',
    dimension: 'transformative_impact',
    regex: /\b(i learned|this taught me|i gained|i developed|i discovered|i realized)\s+(teamwork|leadership|communication|dedication|perseverance|time management|responsibility)\b/gi,
    severity: 'critical',
    explanation: 'Stating generic lessons instead of showing specific transformation',
    technicalDetails: 'These could appear in anyone\'s essay. No unique insight or personal growth visible.',
    whyItMatters: 'Officers want to see HOW you changed, not THAT you learned generic lessons.',
  },
  {
    id: 'transform-002-no-reflection',
    name: 'Missing Reflection',
    dimension: 'transformative_impact',
    regex: /^(?!.*(realized|understood|discovered|recognized|became aware|shifted|changed my thinking|now I|looking back)).+$/gim,
    severity: 'critical',
    explanation: 'No visible personal transformation or intellectual growth',
    technicalDetails: 'Strong reflection shows belief shifts, behavioral changes, or new understanding',
    whyItMatters: 'Transformation distinguishes participants from leaders. Growth signals maturity.',
    detectionNotes: 'Requires essay-level analysis for presence of reflection markers',
  },
  {
    id: 'transform-003-superficial-reflection',
    name: 'Superficial Reflection',
    dimension: 'transformative_impact',
    regex: /\b(i learned that|this showed me that|i came to understand that|it was important|this was significant)\b/gi,
    severity: 'major',
    explanation: 'Formulaic reflection that tells rather than shows growth',
    technicalDetails: 'These phrases signal manufactured insight rather than genuine discovery',
    whyItMatters: 'Authentic reflection comes through story and specific moments, not stated lessons.',
  },
  {
    id: 'transform-004-no-surprise',
    name: 'No Element of Surprise',
    dimension: 'transformative_impact',
    regex: /^(?!.*(surprised|unexpected|didn\'t expect|turns out|actually|realized that|contrary to)).+$/gim,
    severity: 'major',
    explanation: 'No indication of genuine discovery or changed expectations',
    technicalDetails: 'Surprise signals authentic learning. Everything going as expected suggests manufactured narrative.',
    whyItMatters: 'Genuine growth involves moments where reality differed from expectations.',
    detectionNotes: 'Check for markers of surprise, contradiction, or changed beliefs',
  },
];

// ============================================================================
// DIMENSION 4: ROLE CLARITY & OWNERSHIP (10% weight)
// ============================================================================

const roleClarityOwnershipPatterns: IssuePattern[] = [
  {
    id: 'role-001-too-much-we',
    name: 'Excessive "We" Language',
    dimension: 'role_clarity_ownership',
    regex: /\bwe\b/gi,
    severity: 'major',
    explanation: 'Overuse of collective language that obscures individual contribution',
    technicalDetails: 'Count "we" occurrences. More than 5 in short essay suggests unclear role.',
    whyItMatters: 'Officers need to know what YOU did, not what the team accomplished.',
    detectionNotes: 'Frequency matters. Occasional "we" is fine; dominance is problematic.',
  },
  {
    id: 'role-002-helper-language',
    name: 'Helper/Supporter Language',
    dimension: 'role_clarity_ownership',
    regex: /\b(helped|assisted|supported|contributed to|participated in|was part of|was involved in)\b/gi,
    severity: 'major',
    explanation: 'Passive role verbs that make you sound like supporter, not leader or owner',
    technicalDetails: 'These verbs minimize agency and suggest secondary role',
    whyItMatters: 'Initiative and ownership impress admissions more than participation or helping.',
  },
  {
    id: 'role-003-unclear-ownership',
    name: 'Unclear Ownership',
    dimension: 'role_clarity_ownership',
    regex: /\b(the team|the group|everyone|people|students|members)\s+(decided|created|organized|built|designed)\b/gi,
    severity: 'major',
    explanation: 'Collective attribution without specifying your role',
    technicalDetails: 'Strong essays clarify: "I led the design while teammates handled implementation"',
    whyItMatters: 'Vague attribution leaves officers guessing about your actual contribution.',
  },
  {
    id: 'role-004-no-decision-making',
    name: 'No Decision-Making Visible',
    dimension: 'role_clarity_ownership',
    regex: /^(?!.*(i decided|i chose|i determined|i selected|i prioritized|i changed|my approach|my strategy)).+$/gim,
    severity: 'major',
    explanation: 'No evidence of independent decision-making or strategic thinking',
    technicalDetails: 'Strong essays show moments where YOU made key choices',
    whyItMatters: 'Decision-making signals leadership and ownership, not just task completion.',
    detectionNotes: 'Look for evidence of strategic choices made by the student',
  },
];

// ============================================================================
// DIMENSION 5: NARRATIVE ARC & STAKES (10% weight)
// ============================================================================

const narrativeArcStakesPatterns: IssuePattern[] = [
  {
    id: 'narrative-001-no-conflict-words',
    name: 'No Conflict Markers',
    dimension: 'narrative_arc_stakes',
    regex: /^(?!.*(challenge|problem|struggle|difficult|hard|fail|obstacle|setback|wrong|mistake|crisis|risk)).+$/gim,
    severity: 'critical',
    explanation: 'No tension, obstacles, or stakes evident in the narrative',
    technicalDetails: 'Stories need conflict to engage. Success without struggle feels hollow.',
    whyItMatters: 'Stakes make achievement meaningful. Easy success doesn\'t demonstrate perseverance.',
    detectionNotes: 'Check entire essay for presence of challenge/obstacle language',
  },
  {
    id: 'narrative-002-generic-challenge',
    name: 'Generic Challenge Language',
    dimension: 'narrative_arc_stakes',
    regex: /\b(was challenging|was difficult|faced obstacles|overcame challenges|worked hard)\b/gi,
    severity: 'major',
    explanation: 'Stating that things were hard without showing specific struggles',
    technicalDetails: 'Replace "It was challenging" with specific obstacles and how you handled them',
    whyItMatters: 'Showing specific struggles is more credible than stating things were hard.',
  },
  {
    id: 'narrative-003-no-vulnerability',
    name: 'Missing Vulnerability',
    dimension: 'narrative_arc_stakes',
    regex: /^(?!.*(nervous|scared|worried|doubt|failed|wrong|mistake|froze|panic|stomach|hands|shaking|sweating)).+$/gim,
    severity: 'major',
    explanation: 'No emotional or physical vulnerability shown',
    technicalDetails: 'Elite essays include physical symptoms (hands shaking) or named emotions (terrified, doubtful)',
    whyItMatters: 'Vulnerability makes you relatable and shows authentic growth, not manufactured perfection.',
    detectionNotes: 'Look for physical symptoms or honest emotional states',
  },
  {
    id: 'narrative-004-no-turning-point',
    name: 'Missing Turning Point',
    dimension: 'narrative_arc_stakes',
    regex: /^(?!.*(then|but|however|after|when|moment|realized|shifted|changed|decided|pivoted|breakthrough)).+$/gim,
    severity: 'major',
    explanation: 'No clear moment when approach or understanding changed',
    technicalDetails: 'Turning points give structure: "After three failures, I stopped X and started Y"',
    whyItMatters: 'Turning points make abstract growth concrete and create narrative momentum.',
    detectionNotes: 'Look for temporal markers indicating shift in approach',
  },
];

// ============================================================================
// DIMENSION 6: INITIATIVE & LEADERSHIP (9% weight)
// ============================================================================

const initiativeLeadershipPatterns: IssuePattern[] = [
  {
    id: 'initiative-001-no-creation-verbs',
    name: 'No Creation/Initiative Verbs',
    dimension: 'initiative_leadership',
    regex: /^(?!.*(started|created|founded|launched|initiated|organized|designed|built|established|pioneered)).+$/gim,
    severity: 'major',
    explanation: 'No evidence of starting something new or taking initiative',
    technicalDetails: 'Initiative verbs signal proactivity. Maintenance verbs signal participation.',
    whyItMatters: 'Creating something new is more impressive than maintaining something existing.',
    detectionNotes: 'Check for verbs indicating origination or founding',
  },
  {
    id: 'initiative-002-member-only',
    name: 'Member-Only Language',
    dimension: 'initiative_leadership',
    regex: /\b(was a member|as a member|joined|attended|participated in)\b/gi,
    severity: 'major',
    explanation: 'Language suggesting membership rather than leadership or initiative',
    technicalDetails: 'Even without formal leadership title, show what YOU initiated or drove',
    whyItMatters: 'Officers look for students who create impact, not just show up.',
  },
  {
    id: 'initiative-003-no-problem-identification',
    name: 'No Problem Identification',
    dimension: 'initiative_leadership',
    regex: /^(?!.*(noticed|saw|identified|recognized|problem|issue|need|gap|lacking|missing)).+$/gim,
    severity: 'major',
    explanation: 'No evidence of identifying problems or opportunities independently',
    technicalDetails: 'Leadership starts with seeing what\'s missing or broken. "I noticed X wasn\'t working, so I..."',
    whyItMatters: 'Problem identification signals independent thinking and initiative.',
    detectionNotes: 'Look for evidence of spotting issues or opportunities',
  },
];

// ============================================================================
// DIMENSION 7: COMMUNITY & COLLABORATION (9% weight)
// ============================================================================

const communityCollaborationPatterns: IssuePattern[] = [
  {
    id: 'community-001-no-names',
    name: 'No Named People',
    dimension: 'community_collaboration',
    regex: /^(?!.*([A-Z][a-z]+\s+(taught|helped|showed|told|asked|said|explained))).+$/gim,
    severity: 'major',
    explanation: 'No specific people mentioned by name',
    technicalDetails: 'Naming people (Dr. Kim, Marcus, Sarah) makes stories credible and shows relationship awareness',
    whyItMatters: 'Specific names signal real relationships and collaborative awareness.',
    detectionNotes: 'Look for proper names followed by collaborative action verbs',
  },
  {
    id: 'community-002-solo-only',
    name: 'Solo-Only Narrative',
    dimension: 'community_collaboration',
    regex: /^(?!.*(we|team|together|collaborate|group|partner|with|helped by|taught by)).+$/gim,
    severity: 'major',
    explanation: 'Essay presents you as working entirely alone with no mention of others',
    technicalDetails: 'Even independent work involves mentors, collaborators, or beneficiaries',
    whyItMatters: 'Acknowledging others shows humility and collaborative capacity.',
    detectionNotes: 'Check entire essay for presence of collaboration markers',
  },
  {
    id: 'community-003-no-transformation-evidence',
    name: 'No Community Transformation Evidence',
    dimension: 'community_collaboration',
    regex: /^(?!.*(before|after|used to|now|changed|improved|grew from|expanded from)).+$/gim,
    severity: 'major',
    explanation: 'No visible before/after change in the community or people',
    technicalDetails: 'Strong community impact shows: "Before: X. After: Y." with specific evidence',
    whyItMatters: 'Community transformation proves your work had lasting impact beyond individual achievement.',
    detectionNotes: 'Look for before/after markers and growth indicators',
  },
];

// ============================================================================
// DIMENSION 8: REFLECTION & MEANING (10% weight)
// ============================================================================

const reflectionMeaningPatterns: IssuePattern[] = [
  {
    id: 'reflection-001-no-universal-insight',
    name: 'No Universal Insight',
    dimension: 'reflection_meaning',
    regex: /^(?!.*(in general|people|everyone|human|life|world|truth|realize|understand about)).+$/gim,
    severity: 'major',
    explanation: 'Reflection stays activity-specific without connecting to broader truths',
    technicalDetails: 'Elite essays transcend the activity: "This taught me about how people learn" not just "about robotics"',
    whyItMatters: 'Universal insights show intellectual depth and transferable wisdom.',
    detectionNotes: 'Look for phrases that extend beyond the specific activity',
  },
  {
    id: 'reflection-002-no-behavioral-change',
    name: 'No Behavioral Change Evidence',
    dimension: 'reflection_meaning',
    regex: /^(?!.*(now i|i now|since then|going forward|moving forward|from then on|these days)).+$/gim,
    severity: 'major',
    explanation: 'No evidence of how learning changed your actions or approach',
    technicalDetails: 'Behavioral change proves learning was real: "Now when I teach, I count to five before answering"',
    whyItMatters: 'Changed behavior demonstrates internalized learning, not just intellectual understanding.',
    detectionNotes: 'Check for markers indicating changed actions or approaches',
  },
];

// ============================================================================
// DIMENSION 9: CRAFT & LANGUAGE QUALITY (8% weight)
// ============================================================================

const craftLanguageQualityPatterns: IssuePattern[] = [
  {
    id: 'craft-001-repetitive-structure',
    name: 'Repetitive Sentence Structure',
    dimension: 'craft_language_quality',
    regex: /^(I \w+|The \w+|This \w+|We \w+)/gim,
    severity: 'minor',
    explanation: 'Most sentences start with same pattern, creating monotonous rhythm',
    technicalDetails: 'Vary sentence openings: start with time, action, subordinate clause, or interjection',
    whyItMatters: 'Sentence variety creates rhythm and keeps readers engaged.',
    detectionNotes: 'Requires analyzing sentence beginnings across essay',
  },
  {
    id: 'craft-002-weak-imagery',
    name: 'Weak Sensory Imagery',
    dimension: 'craft_language_quality',
    regex: /^(?!.*(smell|sound|taste|touch|feel|look|sight|hear|texture|color|temperature)).+$/gim,
    severity: 'minor',
    explanation: 'No sensory details that bring scenes to life',
    technicalDetails: 'Add what you saw, heard, smelled, touched, or tasted to create immersion',
    whyItMatters: 'Sensory details are authenticity markers and make essays memorable.',
    detectionNotes: 'Check for presence of sensory vocabulary',
  },
  {
    id: 'craft-003-no-dialogue',
    name: 'Missing Dialogue',
    dimension: 'craft_language_quality',
    regex: /^(?!.*["'].*["']).+$/gim,
    severity: 'minor',
    explanation: 'No dialogue or quoted speech present',
    technicalDetails: 'Brief, natural dialogue reveals character and makes essays cinematic',
    whyItMatters: 'Dialogue is a strong authenticity marker and brings voice to life.',
    detectionNotes: 'Look for quotation marks indicating direct speech',
  },
];

// ============================================================================
// DIMENSION 10: FIT & TRAJECTORY (6% weight)
// ============================================================================

const fitTrajectoryPatterns: IssuePattern[] = [
  {
    id: 'fit-001-no-future-connection',
    name: 'No Future Connection',
    dimension: 'fit_trajectory',
    regex: /^(?!.*(college|major|career|future|want to|plan to|interested in|pursuing|studying|goal)).+$/gim,
    severity: 'major',
    explanation: 'No connection drawn between experience and future academic/career interests',
    technicalDetails: 'Strong essays connect past experience to future goals: "This approach is how I want to study X in college"',
    whyItMatters: 'Officers want to see coherent narrative from past → present → future.',
    detectionNotes: 'Look for forward-looking language',
  },
  {
    id: 'fit-002-major-mismatch',
    name: 'Weak Major Connection',
    dimension: 'fit_trajectory',
    regex: /^(?!.*(engineering|science|medicine|business|arts|humanities|mathematics|research|analysis)).+$/gim,
    severity: 'minor',
    explanation: 'Activity seems disconnected from stated academic interests',
    technicalDetails: 'This requires comparison with student\'s intended major/interests',
    whyItMatters: 'Coherent narrative makes you more memorable and your story more credible.',
    detectionNotes: 'Requires context about student\'s intended major',
  },
];

// ============================================================================
// DIMENSION 11: TIME INVESTMENT & CONSISTENCY (4% weight)
// ============================================================================

const timeInvestmentConsistencyPatterns: IssuePattern[] = [
  {
    id: 'time-001-no-duration',
    name: 'No Duration Specified',
    dimension: 'time_investment_consistency',
    regex: /^(?!.*(months|years|weeks|since|from.*to|during.*until)).+$/gim,
    severity: 'major',
    explanation: 'No timeframe specified for involvement',
    technicalDetails: 'Include exact dates or duration: "September 2022 through May 2024" or "18 months"',
    whyItMatters: 'Duration signals commitment depth. Short-term involvement suggests surface interest.',
    detectionNotes: 'Check for temporal markers',
  },
  {
    id: 'time-002-no-frequency',
    name: 'No Frequency Specified',
    dimension: 'time_investment_consistency',
    regex: /^(?!.*(per week|per day|every|twice|three times|hours|weekly|daily|monthly)).+$/gim,
    severity: 'major',
    explanation: 'No indication of how often you engaged with activity',
    technicalDetails: 'Specify schedule: "Every Tuesday and Thursday, 3-5pm" or "4 hours per week"',
    whyItMatters: 'Frequency signals consistency and dedication versus sporadic involvement.',
    detectionNotes: 'Look for recurring time patterns',
  },
];

// ============================================================================
// PATTERN GROUPS (Organized by Dimension)
// ============================================================================

export const PATTERN_GROUPS: PatternGroup[] = [
  {
    dimension: 'voice_integrity',
    displayName: 'Voice Integrity',
    patterns: voiceIntegrityPatterns,
  },
  {
    dimension: 'specificity_evidence',
    displayName: 'Specificity & Evidence',
    patterns: specificityEvidencePatterns,
  },
  {
    dimension: 'transformative_impact',
    displayName: 'Transformative Impact',
    patterns: transformativeImpactPatterns,
  },
  {
    dimension: 'role_clarity_ownership',
    displayName: 'Role Clarity & Ownership',
    patterns: roleClarityOwnershipPatterns,
  },
  {
    dimension: 'narrative_arc_stakes',
    displayName: 'Narrative Arc & Stakes',
    patterns: narrativeArcStakesPatterns,
  },
  {
    dimension: 'initiative_leadership',
    displayName: 'Initiative & Leadership',
    patterns: initiativeLeadershipPatterns,
  },
  {
    dimension: 'community_collaboration',
    displayName: 'Community & Collaboration',
    patterns: communityCollaborationPatterns,
  },
  {
    dimension: 'reflection_meaning',
    displayName: 'Reflection & Meaning',
    patterns: reflectionMeaningPatterns,
  },
  {
    dimension: 'craft_language_quality',
    displayName: 'Craft & Language Quality',
    patterns: craftLanguageQualityPatterns,
  },
  {
    dimension: 'fit_trajectory',
    displayName: 'Fit & Trajectory',
    patterns: fitTrajectoryPatterns,
  },
  {
    dimension: 'time_investment_consistency',
    displayName: 'Time Investment & Consistency',
    patterns: timeInvestmentConsistencyPatterns,
  },
];

// ============================================================================
// PATTERN LOOKUP & UTILITIES
// ============================================================================

/**
 * Get all patterns for a specific dimension
 */
export function getPatternsForDimension(dimension: RubricCategory): IssuePattern[] {
  const group = PATTERN_GROUPS.find(g => g.dimension === dimension);
  return group?.patterns || [];
}

/**
 * Get pattern by ID
 */
export function getPatternById(id: string): IssuePattern | null {
  for (const group of PATTERN_GROUPS) {
    const pattern = group.patterns.find(p => p.id === id);
    if (pattern) return pattern;
  }
  return null;
}

/**
 * Get all critical patterns across all dimensions
 */
export function getCriticalPatterns(): IssuePattern[] {
  return PATTERN_GROUPS.flatMap(g => g.patterns).filter(p => p.severity === 'critical');
}

/**
 * Get patterns by severity
 */
export function getPatternsBySeverity(severity: 'critical' | 'major' | 'minor'): IssuePattern[] {
  return PATTERN_GROUPS.flatMap(g => g.patterns).filter(p => p.severity === severity);
}

/**
 * Count total patterns in database
 */
export function getTotalPatternCount(): number {
  return PATTERN_GROUPS.reduce((sum, g) => sum + g.patterns.length, 0);
}

/**
 * Get coverage statistics
 */
export function getPatternCoverageStats() {
  const byDimension: Record<string, number> = {};
  const bySeverity: Record<string, number> = { critical: 0, major: 0, minor: 0 };

  PATTERN_GROUPS.forEach(group => {
    byDimension[group.dimension] = group.patterns.length;
    group.patterns.forEach(pattern => {
      bySeverity[pattern.severity]++;
    });
  });

  return {
    totalPatterns: getTotalPatternCount(),
    byDimension,
    bySeverity,
    dimensionsCovered: PATTERN_GROUPS.length,
  };
}

export default PATTERN_GROUPS;
