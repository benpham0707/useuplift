/**
 * INITIATIVE & LEADERSHIP ANALYZER
 *
 * Dimension 7B: Initiative & Leadership (7% weight)
 *
 * Detects self-directed action and informal leadership:
 * - Problem identification ("I noticed", "I saw that nobody")
 * - Opportunity creation ("I started/founded/created")
 * - Self-directed action ("I taught myself", "without being asked")
 * - Risk-taking ("I wasn't sure... but I")
 * - Informal leadership (leading without title)
 * - Reactive language penalty ("I was told/asked to")
 *
 * Scoring Philosophy:
 * - Problem-spotting + self-directed + risk-taking = 9-10
 * - Reactive + title without initiative = 0-3
 */

export interface InitiativeLeadershipAnalysis {
  // Overall assessment
  initiative_score: number; // 0-10
  initiative_quality: 'proactive_builder' | 'strong_initiative' | 'mixed_leadership' | 'reactive_participation' | 'passive_member';

  // Problem identification
  identifies_problems: boolean;
  problem_identification_count: number;
  problem_examples: string[];

  // Opportunity creation
  creates_opportunities: boolean;
  opportunity_creation_count: number;
  opportunity_examples: string[];

  // Self-directed action
  shows_self_direction: boolean;
  self_direction_count: number;
  self_direction_examples: string[];

  // Risk-taking
  takes_risks: boolean;
  risk_taking_count: number;
  risk_examples: string[];

  // Informal leadership
  shows_informal_leadership: boolean;
  informal_leadership_count: number;
  informal_leadership_examples: string[];

  // Reactive language (red flags)
  has_reactive_language: boolean;
  reactive_count: number;
  reactive_examples: string[];

  // Title mentions (context)
  has_title: boolean;
  title_count: number;
  title_examples: string[];

  // Guidance
  strengths: string[];
  weaknesses: string[];
  quick_wins: string[];
}

/**
 * Analyze initiative and leadership in an essay
 */
export function analyzeInitiativeLeadership(essayText: string): InitiativeLeadershipAnalysis {

  // Detect problem identification
  const problemIdentification = detectProblemIdentification(essayText);

  // Detect opportunity creation
  const opportunityCreation = detectOpportunityCreation(essayText);

  // Detect self-directed action
  const selfDirection = detectSelfDirection(essayText);

  // Detect risk-taking
  const riskTaking = detectRiskTaking(essayText);

  // Detect informal leadership
  const informalLeadership = detectInformalLeadership(essayText);

  // Detect reactive language (penalty)
  const reactiveLanguage = detectReactiveLanguage(essayText);

  // Detect title mentions (context)
  const titleMentions = detectTitleMentions(essayText);

  // Calculate initiative score (0-10)
  let score = 2.5; // Start at lower baseline (2.5) to require proof of initiative

  // Problem identification (+2.0 max)
  if (problemIdentification.count >= 2) score += 2.0;
  else if (problemIdentification.count >= 1) score += 1.0;

  // Opportunity creation (+3.0 max)
  if (opportunityCreation.count >= 2) score += 3.0;
  else if (opportunityCreation.count >= 1) score += 2.0;

  // Self-directed action (+2.0 max)
  if (selfDirection.count >= 3) score += 2.0;
  else if (selfDirection.count >= 2) score += 1.5;
  else if (selfDirection.count >= 1) score += 0.5;

  // Risk-taking (+1.5 max)
  if (riskTaking.count >= 2) score += 1.5;
  else if (riskTaking.count >= 1) score += 1.0;

  // Informal leadership (+1.5 max)
  if (informalLeadership.count >= 2) score += 1.5;
  else if (informalLeadership.count >= 1) score += 0.5;

  // Reactive language penalty (-3.0 max)
  if (reactiveLanguage.count >= 4) score -= 3.0;
  else if (reactiveLanguage.count >= 2) score -= 2.0;
  else if (reactiveLanguage.count >= 1) score -= 1.0;

  // Title without initiative penalty (-2.5)
  if (titleMentions.present &&
      !opportunityCreation.present &&
      selfDirection.count === 0) {
    score -= 2.5; // Increased penalty: Has title but no proactive action
  }

  // Cap at 0-10
  score = Math.max(0, Math.min(10, score));

  // Determine initiative quality
  let quality: 'proactive_builder' | 'strong_initiative' | 'mixed_leadership' | 'reactive_participation' | 'passive_member';
  if (score >= 9) quality = 'proactive_builder';
  else if (score >= 7) quality = 'strong_initiative';
  else if (score >= 5) quality = 'mixed_leadership';
  else if (score >= 3) quality = 'reactive_participation';
  else quality = 'passive_member';

  // Generate guidance
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const quickWins: string[] = [];

  if (problemIdentification.count >= 1) {
    strengths.push('Identifies problems/gaps before taking action');
  } else {
    weaknesses.push('No problem identification shown (what gap did you spot?)');
    quickWins.push('Add: "I noticed that..." or "I saw that nobody was..." before describing your action');
  }

  if (opportunityCreation.count >= 1) {
    strengths.push('Creates new opportunities (started/founded/launched something)');
  } else {
    weaknesses.push('No opportunity creation (did you start anything new?)');
    quickWins.push('Add: "I started/created/founded..." to show you built something from scratch');
  }

  if (selfDirection.count >= 2) {
    strengths.push('Self-directed action (taught yourself, took initiative without being asked)');
  } else if (selfDirection.count === 0) {
    weaknesses.push('No self-directed action shown');
    quickWins.push('Add: "I taught myself..." or "Without being asked, I..." to show proactivity');
  }

  if (riskTaking.count >= 1) {
    strengths.push('Shows willingness to take risks despite uncertainty');
  } else {
    weaknesses.push('No risk-taking demonstrated');
    quickWins.push('Add: "I wasn\'t sure if it would work, but I..." to show calculated risk');
  }

  if (informalLeadership.count >= 1) {
    strengths.push('Informal leadership (led without formal title)');
  }

  if (reactiveLanguage.count >= 2) {
    weaknesses.push(`Reactive language (${reactiveLanguage.count} instances of "I was told/asked to")`);
    quickWins.push('Shift from "I was asked to" → "I saw the need and decided to"');
  }

  if (titleMentions.present && !opportunityCreation.present && selfDirection.count === 0) {
    weaknesses.push('Title mentioned but no proactive initiative shown');
    quickWins.push('Don\'t just state title - show what problem you solved or opportunity you created');
  }

  return {
    initiative_score: parseFloat(score.toFixed(2)),
    initiative_quality: quality,

    identifies_problems: problemIdentification.present,
    problem_identification_count: problemIdentification.count,
    problem_examples: problemIdentification.examples,

    creates_opportunities: opportunityCreation.present,
    opportunity_creation_count: opportunityCreation.count,
    opportunity_examples: opportunityCreation.examples,

    shows_self_direction: selfDirection.present,
    self_direction_count: selfDirection.count,
    self_direction_examples: selfDirection.examples,

    takes_risks: riskTaking.present,
    risk_taking_count: riskTaking.count,
    risk_examples: riskTaking.examples,

    shows_informal_leadership: informalLeadership.present,
    informal_leadership_count: informalLeadership.count,
    informal_leadership_examples: informalLeadership.examples,

    has_reactive_language: reactiveLanguage.present,
    reactive_count: reactiveLanguage.count,
    reactive_examples: reactiveLanguage.examples,

    has_title: titleMentions.present,
    title_count: titleMentions.count,
    title_examples: titleMentions.examples,

    strengths,
    weaknesses,
    quick_wins: quickWins
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function detectProblemIdentification(text: string): {
  present: boolean;
  count: number;
  examples: string[];
} {
  const patterns = [
    // Strict gap/problem patterns
    /I\s+noticed\s+(?:that\s+)?(?:no\s+one|nobody|there\s+(?:was|were)\s+no|the\s+lack\s+of)/gi,
    /I\s+saw\s+(?:that\s+)?(?:no\s+one|nobody|there\s+(?:was|were)\s+no)/gi,
    /I\s+realized\s+(?:that\s+)?(?:no\s+one|nobody|there\s+(?:was|were)\s+no|the\s+lack\s+of)/gi,
    /I\s+(?:identified|recognized|spotted)\s+(?:a\s+)?(?:gap|problem|need|opportunity)/gi,
    /(?:There\s+was|There\s+were)\s+no\s+\w+(?:\s+\w+){1,5},\s+so\s+I/gi,
    /(?:Nobody|No\s+one)\s+(?:was|had)\s+\w+(?:\s+\w+){1,5},\s+so\s+I/gi,
    /I\s+saw\s+(?:the\s+)?(?:gap|need|opportunity)\s+(?:for|to)/gi,
    /When\s+I\s+(?:noticed|saw|realized)\s+that\s+\w+(?:\s+\w+){1,8},\s+I\s+(?:decided|knew)/gi,
    // NEW: Problem statements
    /(?:The|My)\s+(?:problem|challenge|issue)\s+(?:was|is)\s+(?:that|when)/gi,
    /I\s+(?:faced|encountered|ran\s+into)\s+(?:a\s+)?(?:problem|challenge|issue|obstacle)/gi,
    /I\s+realized\s+(?:I|we)\s+(?:needed|had\s+to)\s+\w+/gi,
    // NEW: Broader narrative observation patterns
    /I\s+noticed\s+something/gi,
    /I\s+noticed\s+(?:that\s+)?(?:our|their|the|my)/gi,
    /I\s+(?:saw|realized|discovered|observed)\s+(?:that\s+)?(?:the|our|my|this)/gi,
    /\bwhat\s+(?:was\s+)?missing\b/gi,
    /\bwhat\s+(?:others?\s+)?(?:weren't|hadn't|didn't)\b/gi
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

function detectOpportunityCreation(text: string): {
  present: boolean;
  count: number;
  examples: string[];
} {
  const patterns = [
    // Formal opportunity creation
    /I\s+(?:started|founded|created|launched|established|initiated)\s+(?:a\s+)?(?:club|organization|program|initiative|project|company|business|nonprofit|event)/gi,
    /I\s+(?:built|created|made)\s+(?:a\s+)?(?:platform|system|app|website|tool|resource)/gi,
    /I\s+organized\s+(?:the\s+)?first\s+\w+/gi,
    /I\s+(?:started|began|launched)\s+\w+\s+(?:from\s+scratch|from\s+the\s+ground\s+up)/gi,
    /I\s+(?:created|built)\s+(?:a\s+)?(?:new|novel)\s+\w+/gi,
    /I\s+(?:founded|co-founded)/gi,

    // Narrative solution creation (flexible, dynamic detection)
    /I\s+(?:wrote|drafted|created)\s+a\s+letter\s+(?:to|explaining|describing)/gi,
    /I\s+made\s+a\s+decision\b/gi,
    /I\s+(?:decided|chose)\s+to\s+(?:create|build|make|design|develop)\s+\w+/gi,
    /I\s+came\s+up\s+with\s+(?:a\s+)?(?:solution|idea|plan|strategy|approach)/gi,
    /I\s+(?:designed|developed|devised)\s+(?:a\s+)?(?:method|approach|strategy|solution)/gi
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

function detectSelfDirection(text: string): {
  present: boolean;
  count: number;
  examples: string[];
} {
  const patterns = [
    /I\s+taught\s+myself\s+(?:how\s+to\s+)?\w+/gi,
    /(?:Without|Before)\s+(?:being\s+)?(?:asked|told|assigned),\s+I\s+\w+/gi,
    /On\s+my\s+own(?:\s+time)?,\s+I\s+\w+/gi,
    /I\s+(?:decided|chose)\s+to\s+\w+\s+on\s+my\s+own/gi,
    /I\s+took\s+(?:the\s+)?initiative\s+to/gi,
    /I\s+(?:volunteered|offered)\s+to\s+\w+/gi,
    /I\s+(?:learned|studied|researched|explored)\s+\w+\s+(?:independently|on\s+my\s+own)/gi,
    /(?:Nobody|No\s+one)\s+(?:asked|told)\s+me\s+to,\s+(?:but|yet)\s+I/gi
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

function detectRiskTaking(text: string): {
  present: boolean;
  count: number;
  examples: string[];
} {
  const patterns = [
    /I\s+(?:wasn't|was\s+not)\s+sure\s+(?:if|whether|how)\s+\w+(?:\s+\w+){1,8},\s+but\s+I/gi,
    /I\s+(?:didn't|did\s+not)\s+know\s+(?:if|whether|how)\s+\w+(?:\s+\w+){1,8},\s+but\s+I\s+(?:tried|decided)/gi,
    /(?:Even\s+though|Although|Despite)\s+(?:I\s+had\s+)?no\s+(?:experience|background|training),\s+I\s+\w+/gi,
    /I\s+took\s+(?:a\s+)?(?:risk|chance|leap)/gi,
    /I\s+(?:decided|chose)\s+to\s+try\s+(?:even\s+though|despite)/gi,
    /It\s+was\s+(?:risky|uncertain|unclear),\s+but\s+I/gi,
    /I\s+had\s+never\s+\w+(?:\s+\w+){0,5}\s+before,\s+but\s+I/gi,
    /Without\s+(?:knowing|experience|training)\s+\w+(?:\s+\w+){1,5},\s+I\s+(?:decided|tried)/gi
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

function detectInformalLeadership(text: string): {
  present: boolean;
  count: number;
  examples: string[];
} {
  const patterns = [
    /(?:Even\s+though|Although|Despite)\s+I\s+(?:wasn't|was\s+not)\s+(?:the\s+)?(?:captain|president|leader|coordinator),\s+I\s+(?:led|organized|coordinated)/gi,
    /Without\s+(?:a\s+)?(?:title|formal\s+role),\s+I\s+(?:led|organized|coordinated)/gi,
    /I\s+(?:led|coordinated|organized)\s+\w+\s+(?:informally|without\s+being)/gi,
    /I\s+(?:rallied|mobilized|brought\s+together|convinced)\s+(?:others|peers|teammates)/gi,
    /I\s+(?:recruited|brought\s+in|gathered)\s+\w+\s+to\s+(?:help|join|work)/gi,
    /(?:Others|Peers|Teammates)\s+(?:looked\s+to|came\s+to|asked)\s+me\s+(?:for|to)/gi
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

function detectReactiveLanguage(text: string): {
  present: boolean;
  count: number;
  examples: string[];
} {
  const patterns = [
    /I\s+was\s+(?:asked|told|assigned|instructed|directed)\s+to\s+\w+/gi,
    /(?:My\s+teacher|My\s+advisor|My\s+coach|The\s+principal)\s+(?:asked|told|wanted)\s+me\s+to/gi,
    /I\s+was\s+(?:given|assigned)\s+(?:the\s+)?(?:task|role|responsibility)\s+(?:of|to)/gi,
    /I\s+had\s+to\s+\w+\s+because\s+(?:I\s+was\s+told|my\s+teacher|the\s+coach)/gi,
    /(?:They|He|She)\s+(?:asked|told|wanted)\s+me\s+to\s+(?:help|lead|organize)/gi,
    /I\s+was\s+(?:selected|chosen|picked)\s+to\s+\w+(?!\s+because\s+I)/gi // Unless followed by reason for selection
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

function detectTitleMentions(text: string): {
  present: boolean;
  count: number;
  examples: string[];
} {
  const patterns = [
    /\b(?:president|vice\s+president|captain|co-captain)\b/gi,
    /\b(?:founder|co-founder|executive\s+director)\b/gi,
    /\b(?:leader|team\s+leader|coordinator|director)\b/gi,
    /\b(?:head|chair|chairperson)\s+(?:of|for)\b/gi
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
