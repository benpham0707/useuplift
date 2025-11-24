/**
 * FIT & TRAJECTORY ANALYZER
 *
 * Dimension 8/13: Contribution & Fit (7% weight)
 *
 * Detects future connection and credible trajectory:
 * - Specific future connection (major, career, continued work)
 * - Logical trajectory from experience to future
 * - Continued commitment indicators ("I plan to continue")
 * - UC-specific mentions (bonus)
 * - Credible next steps
 * - Generic "change the world" penalty
 *
 * Scoring Philosophy:
 * - Specific trajectory + continued commitment + UC mentions = 9-10
 * - Generic mission + no connection + one-time thing = 0-3
 */

export interface FitTrajectoryAnalysis {
  // Overall assessment
  fit_score: number; // 0-10
  fit_quality: 'clear_trajectory' | 'strong_connection' | 'some_connection' | 'generic_mission' | 'no_future_link';

  // Future connection
  has_future_connection: boolean;
  future_connection_type: ('major' | 'career' | 'continued_work' | 'research' | 'none')[];
  future_connection_count: number;
  future_connection_examples: string[];

  // Trajectory clarity
  has_logical_trajectory: boolean;
  trajectory_strength: 'explicit' | 'implied' | 'weak' | 'absent';
  trajectory_examples: string[];

  // Continued commitment
  shows_continued_commitment: boolean;
  commitment_count: number;
  commitment_examples: string[];

  // UC-specific mentions
  has_uc_mentions: boolean;
  uc_mention_count: number;
  uc_mention_examples: string[];

  // Credible next steps
  has_credible_next_steps: boolean;
  next_step_count: number;
  next_step_examples: string[];

  // Red flags
  has_generic_mission: boolean;
  generic_mission_count: number;
  generic_mission_examples: string[];

  // Guidance
  strengths: string[];
  weaknesses: string[];
  quick_wins: string[];
}

/**
 * Analyze fit and trajectory in an essay
 */
export function analyzeFitTrajectory(essayText: string): FitTrajectoryAnalysis {

  // Detect future connections
  const futureConnection = detectFutureConnection(essayText);

  // Detect trajectory clarity
  const trajectory = detectTrajectory(essayText);

  // Detect continued commitment
  const commitment = detectContinuedCommitment(essayText);

  // Detect UC-specific mentions
  const ucMentions = detectUCMentions(essayText);

  // Detect credible next steps
  const nextSteps = detectCredibleNextSteps(essayText);

  // Detect generic mission statements (penalty)
  const genericMission = detectGenericMission(essayText);

  // Calculate fit score (0-10)
  let score = 3.0; // Start at lower baseline (3.0)

  // Future connection (+2.5 max)
  if (futureConnection.count >= 2) score += 2.5;
  else if (futureConnection.count >= 1) score += 1.5;
  else score -= 2.5; // Increased penalty: No future connection mentioned

  // Trajectory clarity (+2.5 max)
  if (trajectory.strength === 'explicit') score += 2.5;
  else if (trajectory.strength === 'implied') score += 1.5;
  else if (trajectory.strength === 'weak') score += 0.5;
  else score -= 2.0; // Increased penalty: No trajectory

  // Continued commitment (+2.0 max)
  if (commitment.count >= 2) score += 2.0;
  else if (commitment.count >= 1) score += 1.0;

  // UC mentions (bonus +1.0 max)
  if (ucMentions.count >= 2) score += 1.0;
  else if (ucMentions.count >= 1) score += 0.5;

  // Credible next steps (+1.5 max)
  if (nextSteps.count >= 2) score += 1.5;
  else if (nextSteps.count >= 1) score += 0.5;

  // Generic mission penalty (-2.5 max)
  if (genericMission.count >= 3) score -= 2.5;
  else if (genericMission.count >= 2) score -= 1.5;
  else if (genericMission.count >= 1) score -= 0.5;

  // Cap at 0-10
  score = Math.max(0, Math.min(10, score));

  // Determine fit quality
  let quality: 'clear_trajectory' | 'strong_connection' | 'some_connection' | 'generic_mission' | 'no_future_link';
  if (score >= 9) quality = 'clear_trajectory';
  else if (score >= 7) quality = 'strong_connection';
  else if (score >= 5) quality = 'some_connection';
  else if (score >= 3) quality = 'generic_mission';
  else quality = 'no_future_link';

  // Generate guidance
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const quickWins: string[] = [];

  if (futureConnection.count >= 1) {
    strengths.push(`Clear future connection (${futureConnection.types.join(', ')})`);
  } else {
    weaknesses.push('No connection to future major/career/work');
    quickWins.push('Add: "I plan to major in [X]" or "This led me to pursue [career/field]"');
  }

  if (trajectory.strength === 'explicit') {
    strengths.push('Explicit trajectory showing how experience shaped your path');
  } else if (trajectory.strength === 'absent') {
    weaknesses.push('No logical connection between experience and future plans');
    quickWins.push('Add: "This experience led me to..." or "That\'s why I want to study..."');
  }

  if (commitment.count >= 1) {
    strengths.push('Shows continued commitment beyond one-time participation');
  } else {
    weaknesses.push('Reads like a one-time experience with no ongoing commitment');
    quickWins.push('Add: "I continue to..." or "I plan to keep working on..."');
  }

  if (ucMentions.count >= 1) {
    strengths.push('UC-specific mentions showing research/fit');
  } else {
    quickWins.push('Add UC-specific detail: "I want to study under Professor X" or "UC\'s [program] aligns with..."');
  }

  if (nextSteps.count >= 1) {
    strengths.push('Credible next steps showing realistic progression');
  } else {
    weaknesses.push('No concrete next steps mentioned');
    quickWins.push('Add specific next step: "Next, I plan to..." or "I\'m currently working toward..."');
  }

  if (genericMission.count >= 2) {
    weaknesses.push(`Generic mission statements (${genericMission.count} instances of "change the world"/"make a difference")`);
    quickWins.push('Replace "change the world" with specific goal: "increase X by Y%" or "help Z students"');
  }

  return {
    fit_score: parseFloat(score.toFixed(2)),
    fit_quality: quality,

    has_future_connection: futureConnection.present,
    future_connection_type: futureConnection.types,
    future_connection_count: futureConnection.count,
    future_connection_examples: futureConnection.examples,

    has_logical_trajectory: trajectory.present,
    trajectory_strength: trajectory.strength,
    trajectory_examples: trajectory.examples,

    shows_continued_commitment: commitment.present,
    commitment_count: commitment.count,
    commitment_examples: commitment.examples,

    has_uc_mentions: ucMentions.present,
    uc_mention_count: ucMentions.count,
    uc_mention_examples: ucMentions.examples,

    has_credible_next_steps: nextSteps.present,
    next_step_count: nextSteps.count,
    next_step_examples: nextSteps.examples,

    has_generic_mission: genericMission.present,
    generic_mission_count: genericMission.count,
    generic_mission_examples: genericMission.examples,

    strengths,
    weaknesses,
    quick_wins: quickWins
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function detectFutureConnection(text: string): {
  present: boolean;
  count: number;
  types: ('major' | 'career' | 'continued_work' | 'research' | 'none')[];
  examples: string[];
} {
  const examples: string[] = [];
  const types: ('major' | 'career' | 'continued_work' | 'research' | 'none')[] = [];
  let count = 0;

  // Major/field of study (flexible - detect essence, not template)
  const majorPatterns = [
    // Future plans
    /I\s+(?:plan\s+to|want\s+to|will|hope\s+to)\s+(?:major|study|pursue)\s+(?:in\s+)?(?:\w+\s+)?(?:engineering|biology|computer\s+science|psychology|economics|neuroscience|physics|chemistry|mathematics|sociology|anthropology|political\s+science|public\s+policy|data\s+science)/gi,
    // Already studying (current students)
    /I'm\s+(?:studying|majoring\s+in|pursuing)\s+(?:\w+\s+)?(?:and\s+)?(?:engineering|biology|computer\s+science|psychology|economics|sociology|public\s+policy|data\s+science|anthropology)/gi,
    // Narrative connection
    /(?:This|That)\s+(?:led|inspired|drove)\s+me\s+to\s+pursue\s+(?:a\s+)?(?:degree|major)\s+in/gi,
    /I'm\s+(?:now\s+)?interested\s+in\s+studying\s+\w+/gi,
    /I\s+(?:plan\s+to|want\s+to)\s+study\s+\w+\s+in\s+college/gi,
    // Broad field mentions (capture any major reference)
    /\b(?:major|study|pursue|learn\s+more\s+about)\s+(?:\w+\s+)?(?:in\s+)?(?:the\s+)?field\s+of\b/gi
  ];

  for (const pattern of majorPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      count += matches.length;
      examples.push(...matches.slice(0, 2));
      if (!types.includes('major')) types.push('major');
    }
  }

  // Career connection
  const careerPatterns = [
    /I\s+(?:want|hope|plan)\s+to\s+(?:become|be)\s+(?:a\s+)?(?:doctor|engineer|researcher|teacher|scientist|entrepreneur|lawyer|professor)/gi,
    /(?:My|This)\s+(?:goal|aim|dream)\s+is\s+to\s+(?:work|become|pursue\s+a\s+career)/gi,
    /I\s+(?:plan\s+to|want\s+to|will)\s+pursue\s+a\s+career\s+in/gi,
    /(?:This|That)\s+experience\s+(?:confirmed|solidified|showed)\s+(?:my|that\s+I\s+want\s+to)\s+(?:pursue|become)/gi
  ];

  for (const pattern of careerPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      count += matches.length;
      examples.push(...matches.slice(0, 2));
      if (!types.includes('career')) types.push('career');
    }
  }

  // Continued work
  const continuedWorkPatterns = [
    /I\s+(?:continue|continued|still|am\s+still)\s+(?:to\s+)?(?:work|working)\s+(?:on|with|in)/gi,
    /I\s+(?:plan\s+to|will)\s+(?:continue|keep)\s+(?:working|researching|studying)/gi,
    /I'm\s+(?:currently|now)\s+(?:working|developing|building|researching)/gi,
    /(?:Even\s+)?(?:now|today),\s+I\s+(?:still|continue)/gi
  ];

  for (const pattern of continuedWorkPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      count += matches.length;
      examples.push(...matches.slice(0, 2));
      if (!types.includes('continued_work')) types.push('continued_work');
    }
  }

  // Research connection
  const researchPatterns = [
    /I\s+(?:want|plan|hope)\s+to\s+(?:conduct|do|pursue)\s+research\s+(?:in|on)/gi,
    /I'm\s+interested\s+in\s+researching/gi,
    /I\s+hope\s+to\s+(?:join|work\s+in)\s+(?:a\s+)?(?:lab|research\s+group)/gi
  ];

  for (const pattern of researchPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      count += matches.length;
      examples.push(...matches.slice(0, 2));
      if (!types.includes('research')) types.push('research');
    }
  }

  if (types.length === 0) types.push('none');

  return {
    present: count > 0,
    count,
    types,
    examples: [...new Set(examples)]
  };
}

function detectTrajectory(text: string): {
  present: boolean;
  strength: 'explicit' | 'implied' | 'weak' | 'absent';
  examples: string[];
} {
  const examples: string[] = [];
  let explicitCount = 0;
  let impliedCount = 0;

  // Explicit trajectory (clear causal language)
  const explicitPatterns = [
    /(?:This|That)\s+(?:experience|work|project)\s+(?:led|inspired|drove|motivated|pushed|convinced)\s+me\s+to\s+\w+/gi,
    /That's\s+(?:why|how)\s+I\s+(?:decided|chose|want)\s+to\s+(?:pursue|study|major)/gi,
    /(?:Because\s+of|After)\s+this\s+experience,\s+I\s+(?:decided|chose|knew|realized)\s+(?:to\s+)?(?:pursue|study)/gi,
    /This\s+(?:shaped|influenced|defined)\s+my\s+(?:decision|path|interest)\s+(?:to|in)/gi,
    /I\s+now\s+(?:want|plan|hope)\s+to\s+\w+\s+because\s+of\s+(?:this|that)/gi,
    // NEW: Active study trajectory
    /I'm\s+(?:studying|majoring\s+in)\s+\w+(?:\s+\w+){0,5}\s+(?:to|in\s+order\s+to|so\s+I\s+can)\s+\w+/gi,
    /I\s+(?:chose|picked)\s+(?:this|my)\s+(?:major|path|field)\s+(?:to|because)/gi
  ];

  for (const pattern of explicitPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      explicitCount += matches.length;
      examples.push(...matches.slice(0, 2));
    }
  }

  // Implied trajectory (connection without explicit "because")
  const impliedPatterns = [
    /After\s+\w+(?:\s+\w+){2,8},\s+I\s+(?:decided|chose|knew)\s+(?:to\s+)?(?:pursue|study|major)/gi,
    /(?:Now|Today),\s+I\s+(?:want|plan|hope)\s+to\s+(?:pursue|study|become)/gi,
    /I'm\s+(?:now\s+)?interested\s+in\s+\w+/gi,

    // Thematic consistency (experience → related field)
    /(?:This|These)\s+(?:experiences?|moments?|lessons?)\s+(?:have\s+)?(?:shaped|influenced|driven|motivated)\s+(?:my\s+)?(?:interest|passion|decision|path)/gi,
    /I\s+(?:want|plan|hope)\s+to\s+(?:continue|keep|pursue|study|explore)\s+(?:this|these)\s+(?:questions?|issues?|topics?|themes?)/gi,
    /I'm\s+(?:drawn|committed)\s+to\s+\w+/gi
  ];

  for (const pattern of impliedPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      impliedCount += matches.length;
      examples.push(...matches.slice(0, 2));
    }
  }

  let strength: 'explicit' | 'implied' | 'weak' | 'absent';
  if (explicitCount >= 1) strength = 'explicit';
  else if (impliedCount >= 1) strength = 'implied';
  else if (examples.length > 0) strength = 'weak';
  else strength = 'absent';

  return {
    present: explicitCount > 0 || impliedCount > 0,
    strength,
    examples: [...new Set(examples)]
  };
}

function detectContinuedCommitment(text: string): {
  present: boolean;
  count: number;
  examples: string[];
} {
  const patterns = [
    /I\s+(?:continue|continued|still|am\s+still|will\s+continue)\s+(?:to\s+)?\w+/gi,
    /I\s+(?:plan|hope|intend)\s+to\s+(?:continue|keep)\s+\w+/gi,
    /(?:Even\s+)?(?:today|now),\s+I\s+(?:still|continue)/gi,
    /I'm\s+(?:currently|now|still)\s+(?:working|developing|pursuing)/gi,
    /I\s+(?:haven't|have\s+not)\s+stopped\s+\w+/gi,
    /I\s+will\s+keep\s+\w+/gi,
    /(?:This|It)\s+remains\s+(?:a\s+)?(?:passion|priority|focus)/gi
  ];

  const examples: string[] = [];
  let count = 0;

  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      count += matches.length;
      examples.push(...matches.slice(0, 2));
    }
  }

  return {
    present: count > 0,
    count,
    examples: [...new Set(examples)]
  };
}

function detectUCMentions(text: string): {
  present: boolean;
  count: number;
  examples: string[];
} {
  const patterns = [
    // Formal UC mentions
    /\bUC\s+(?:Berkeley|Davis|Irvine|Los\s+Angeles|Merced|Riverside|San\s+Diego|Santa\s+Barbara|Santa\s+Cruz)\b/gi,
    /\bUCB|UCLA|UCSD|UCSB|UCI|UCD|UCR|UCSC|UCM\b/gi,
    /\bUniversity\s+of\s+California(?:\s+at)?\s+(?:Berkeley|Davis|Irvine|Los\s+Angeles|Merced|Riverside|San\s+Diego|Santa\s+Barbara|Santa\s+Cruz)/gi,

    // Narrative mentions (flexible - detect essence, not template)
    /\bat\s+UC\s+(?:Berkeley|Davis|Irvine|Los\s+Angeles|Merced|Riverside|San\s+Diego|Santa\s+Barbara|Santa\s+Cruz)\b/gi,
    /\bUC\s+(?:Berkeley|Davis|Irvine|LA|San\s+Diego|Santa\s+Barbara|Santa\s+Cruz|Riverside|Merced)\s+(?:students?|community|campus|professor|program|research|lab)\b/gi,
    /\b(?:Berkeley|Davis|Irvine|UCLA|UCSD|UCSB|UCI|UCD|UCR|UCSC|UCM)'s\s+(?:program|department|community|research|lab|students?)\b/gi,

    // Faculty/research connections
    /(?:Professor|Dr\.)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?'s\s+(?:lab|research|work)\s+at\s+UC/gi,
    /UC's\s+(?:program|department|lab|center)\s+(?:in|for|of)/gi,

    // UC-specific schools and departments
    /\b(?:Haas|Jacobs|Rady|Anderson)\s+School\b/gi, // UC business schools
    /\b(?:EECS|IEOR|MechE)\b/gi, // UC-specific department abbreviations

    // Campus nicknames and informal mentions
    /\b(?:Cal|Golden\s+Bears|Bruins|Tritons|Gauchos|Anteaters|Aggies)\b/gi // UC campus nicknames
  ];

  const examples: string[] = [];
  let count = 0;

  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      count += matches.length;
      examples.push(...matches.slice(0, 2));
    }
  }

  return {
    present: count > 0,
    count,
    examples: [...new Set(examples)]
  };
}

function detectCredibleNextSteps(text: string): {
  present: boolean;
  count: number;
  examples: string[];
} {
  const patterns = [
    /(?:Next|Moving\s+forward),\s+I\s+(?:plan|will|hope)\s+to\s+\w+/gi,
    /I'm\s+(?:currently|now)\s+(?:working|planning|preparing)\s+(?:on|to)\s+\w+/gi,
    /I\s+(?:plan|hope|intend)\s+to\s+(?:take|enroll\s+in|join|apply\s+to)\s+\w+/gi,
    /In\s+college,\s+I\s+(?:plan|want|hope)\s+to\s+\w+/gi,
    /My\s+next\s+step\s+is\s+to\s+\w+/gi,
    /I'm\s+applying\s+to\s+\w+/gi,
    /I\s+recently\s+(?:started|began|joined)\s+\w+/gi
  ];

  const examples: string[] = [];
  let count = 0;

  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      count += matches.length;
      examples.push(...matches.slice(0, 2));
    }
  }

  return {
    present: count > 0,
    count,
    examples: [...new Set(examples)]
  };
}

function detectGenericMission(text: string): {
  present: boolean;
  count: number;
  examples: string[];
} {
  const patterns = [
    /\b(?:change|save|help)\s+the\s+world\b/gi,
    /\bmake\s+(?:a\s+)?(?:difference|impact)\b(?!\s+(?:by|through|in)\s+\w+)/gi, // Unless followed by specifics
    /\bimprove\s+society\b/gi,
    /\bleave\s+(?:a\s+)?(?:legacy|mark)\b/gi,
    /\bcontribute\s+to\s+(?:humanity|mankind|the\s+world)\b/gi,
    /\bfuture\s+generations\b/gi,
    /\bmake\s+the\s+world\s+(?:a\s+)?better\s+place\b/gi,
    /\bhelp\s+people(?!\s+(?:in|with|who))/gi, // "help people" without specifics
    /\bsolve\s+(?:global|world)\s+(?:problems|issues|challenges)\b/gi
  ];

  const examples: string[] = [];
  let count = 0;

  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      count += matches.length;
      examples.push(...matches.slice(0, 3));
    }
  }

  return {
    present: count > 0,
    count,
    examples: [...new Set(examples)]
  };
}
