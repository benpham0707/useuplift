/**
 * Profile Bridge Service
 *
 * Translation layer between rich ActivityProfile objects (built through
 * student conversations) and the 4-stage activity workshop pipeline prompts.
 *
 * DESIGN PHILOSOPHY:
 * The chat system captures the FULL iceberg — facts, story, meaning, impact,
 * connections. The pipeline needs concise, prompt-ready summaries tailored
 * to each stage's purpose. This bridge translates between the two worlds.
 *
 * CONCISENESS CONSTRAINT:
 * Every summary targets 200-400 tokens per activity because pipeline prompts
 * are already large. We add enrichment, not bulk.
 *
 * STAGE MAPPING:
 * - Stage 0 (Story Detection): story + meaning + connections → compact
 * - Stage 1 (Analysis): facts + recognition + scale → verified metrics
 * - Stage 2 (Teaching): ALL + gap analysis vs description → richest output
 * - Stage 3 (Synthesis): connections + traits + spike → strategic positioning
 */

import type {
  ActivityProfile,
  ActivityFacts,
  ActivityStory,
  ActivityMeaning,
  ActivityImpact,
  ActivityConnections,
  KeyMoment,
  EvolutionPhase,
  ActivityRole,
  ActivityArtifact,
  ActivityRecognition,
  AuthenticQuote,
  CharacterTraitDemonstration,
} from './profile/types';

// ============================================================================
// SUMMARY TYPES
// ============================================================================

/** Compact summary for Stage 0 story detection */
export interface ProfileSummaryForStory {
  activityId: string;
  hasProfile: boolean;
  /** 2-3 sentence story essence from profile */
  storyEssence: string;
  /** Why they started this activity */
  originStory: string;
  /** Top 2-3 key moments from the journey */
  keyMoments: string[];
  /** "Evolved from [phase1] -> [phase2] -> [phase3]" */
  evolutionSummary: string;
  /** Their stated meaning/connection */
  meaningConnection: string;
  /** Spike relevance from profile */
  spikeConnection: string;
  /** Narrative role from connections section */
  narrativeRole: string;
}

/** Detailed summary for Stage 1 analysis */
export interface ProfileSummaryForAnalysis {
  activityId: string;
  hasProfile: boolean;
  /** Bullet-point verified facts: "Team of 12, 500+ people reached" */
  verifiedFacts: string;
  /** Recognition summary: "Regional Science Fair 3rd place" */
  recognitionSummary: string;
  /** Scale metrics as bullet points */
  scaleMetrics: string;
  /** Tangible artifacts created: "Built tutoring curriculum used by 3 schools" */
  artifactsSummary: string;
  /** Role progression: "Member -> VP -> President (elected from 50)" */
  roleProgression: string;
  /** Story essence for tier context */
  storyEssence: string;
  /** Impact highlights: "Before: 30% → After: 85%" */
  impactHighlights: string;
}

/** Rich summary for Stage 2 teaching — THIS IS THE BIGGEST WIN */
export interface ProfileSummaryForTeaching {
  activityId: string;
  hasProfile: boolean;
  /** Authentic quotes from the student's own words */
  authenticQuotes: string[];
  /** Verified metrics with labels: { "peopleImpacted": "500+" } */
  verifiedMetrics: Record<string, string>;
  /** Key moments to reference in teaching */
  keyMoments: string[];
  /** CRITICAL: What the profile shows vs what the description says */
  gapsVsDescription: string[];
  /** Top 5 elements from profile that should be in the 150-char description */
  suggestedDescriptionElements: string[];
  /** Impact highlights: "Before: 30% pass rate -> After: 85%" */
  impactHighlights: string;
  /** Skills demonstrated that are relevant to the activity */
  skillsDemonstrated: string[];
  /** Full prompt-ready block for injection */
  promptBlock: string;
}

/** Summary for Stage 3 synthesis */
export interface ProfileSummaryForSynthesis {
  activityId: string;
  hasProfile: boolean;
  /** What makes THIS student's version of the activity unique */
  uniqueAngle: string;
  /** How this activity contributes to the overall narrative */
  narrativeContribution: string;
  /** Top elements that should appear in the final description */
  bestDescriptionElements: string[];
  /** Narrative role from profile connections */
  narrativeRole: string;
  /** Character traits demonstrated */
  characterTraits: string[];
  /** Connection to spike */
  spikeRelevance: string;
  /** Major alignment info */
  majorAlignment: string;
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

/** Minimum data completeness to consider a profile useful */
const MIN_COMPLETENESS_THRESHOLD = 15;

/** Minimum number of populated fields for a profile to add value */
const MIN_MEANINGFUL_FIELDS = 3;

/**
 * Check if a string has substantive content (not empty/whitespace).
 */
function hasContent(value: string | undefined | null): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Check if a number is meaningful (defined, > 0).
 */
function hasNumber(value: number | undefined | null): value is number {
  return typeof value === 'number' && value > 0;
}

/**
 * Check if an array has substantive entries.
 */
function hasEntries<T>(arr: T[] | undefined | null): arr is T[] {
  return Array.isArray(arr) && arr.length > 0;
}

/**
 * Truncate a string to a maximum length, appending "..." if needed.
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Case-insensitive check if description text contains a term.
 */
function descriptionContains(description: string, term: string): boolean {
  return description.toLowerCase().includes(term.toLowerCase());
}

/**
 * Case-insensitive check if description contains any of the given terms.
 */
function descriptionContainsAny(description: string, terms: string[]): boolean {
  const lowerDesc = description.toLowerCase();
  return terms.some(term => lowerDesc.includes(term.toLowerCase()));
}

/**
 * Extract scale metrics as a labeled record from profile facts.
 * Only includes fields that have meaningful values.
 */
function extractScaleMetrics(facts: ActivityFacts): Record<string, string> {
  const metrics: Record<string, string> = {};

  if (hasNumber(facts.scale.teamSize)) {
    metrics['teamSize'] = `${facts.scale.teamSize} members`;
  }
  if (hasNumber(facts.scale.peopleDirectlyImpacted)) {
    metrics['peopleImpacted'] = `${facts.scale.peopleDirectlyImpacted}+ people directly impacted`;
  }
  if (hasNumber(facts.scale.peopleIndirectlyReached)) {
    metrics['peopleReached'] = `${facts.scale.peopleIndirectlyReached}+ people reached`;
  }
  if (hasNumber(facts.scale.budgetManaged)) {
    metrics['budget'] = `$${facts.scale.budgetManaged.toLocaleString()} managed`;
  }
  if (hasNumber(facts.scale.revenueGenerated)) {
    metrics['revenue'] = `$${facts.scale.revenueGenerated.toLocaleString()} generated`;
  }
  if (hasNumber(facts.scale.resourcesCreated)) {
    const desc = hasContent(facts.scale.resourcesDescription)
      ? facts.scale.resourcesDescription
      : 'resources';
    metrics['resources'] = `${facts.scale.resourcesCreated} ${desc} created`;
  }
  if (hasNumber(facts.scale.eventsOrganized)) {
    metrics['events'] = `${facts.scale.eventsOrganized} events organized`;
  }
  if (hasContent(facts.scale.geographicScope)) {
    metrics['scope'] = `${facts.scale.geographicScope} scope`;
  }

  // Duration metrics
  if (hasNumber(facts.duration.totalYears) && facts.duration.totalYears > 0) {
    metrics['duration'] = `${facts.duration.totalYears} year${facts.duration.totalYears !== 1 ? 's' : ''} of involvement`;
  }
  if (hasNumber(facts.duration.totalHoursEstimated) && facts.duration.totalHoursEstimated > 0) {
    metrics['totalHours'] = `${facts.duration.totalHoursEstimated.toLocaleString()} total hours`;
  }

  return metrics;
}

/**
 * Format recognition entries as compact bullet strings.
 */
function formatRecognition(recognitions: ActivityRecognition[]): string {
  if (!hasEntries(recognitions)) return 'No recognition data';

  return recognitions
    .map(r => {
      let entry = r.name;
      if (hasContent(r.placement)) {
        entry = `${r.placement} — ${entry}`;
      }
      if (hasContent(r.level)) {
        entry += ` (${r.level})`;
      }
      if (hasContent(r.selectivity)) {
        entry += ` [${r.selectivity}]`;
      }
      if (hasContent(r.issuedBy)) {
        entry += ` from ${r.issuedBy}`;
      }
      return `- ${entry}`;
    })
    .join('\n');
}

/**
 * Build the story essence from profile story + meaning sections.
 * Targets 2-3 sentences.
 */
function buildStoryEssence(story: ActivityStory, meaning: ActivityMeaning): string {
  const parts: string[] = [];

  // Origin
  if (hasContent(story.origin.whyJoined)) {
    parts.push(story.origin.whyJoined);
  } else if (hasContent(story.origin.initialMotivation)) {
    parts.push(story.origin.initialMotivation);
  }

  // What it means to them
  if (hasContent(meaning.whyItMatters)) {
    parts.push(meaning.whyItMatters);
  }

  // Growth or evolution summary
  if (hasEntries(story.evolution) && hasContent(story.evolution[story.evolution.length - 1].whatChanged)) {
    parts.push(`Evolution: ${story.evolution[story.evolution.length - 1].whatChanged}`);
  }

  if (parts.length === 0) {
    return 'No story data available';
  }

  return truncate(parts.join('. '), 500);
}

/**
 * Extract the top 2-3 key moments as descriptive strings.
 */
function extractKeyMoments(moments: KeyMoment[], limit: number = 3): string[] {
  if (!hasEntries(moments)) return [];

  // Sort: prefer turning_point and breakthrough first
  const priorityTypes = ['turning_point', 'breakthrough', 'proud_moment'];
  const sorted = [...moments].sort((a, b) => {
    const aPriority = priorityTypes.indexOf(a.type);
    const bPriority = priorityTypes.indexOf(b.type);
    // Items in priorityTypes come first; within same group, preserve order
    if (aPriority >= 0 && bPriority < 0) return -1;
    if (aPriority < 0 && bPriority >= 0) return 1;
    if (aPriority >= 0 && bPriority >= 0) return aPriority - bPriority;
    return 0;
  });

  return sorted.slice(0, limit).map(m => {
    let result = `[${m.type}] ${m.description}`;
    if (hasContent(m.outcome)) {
      result += ` → ${m.outcome}`;
    }
    return truncate(result, 200);
  });
}

/**
 * Build an evolution summary from the story's evolution phases.
 * Format: "Evolved from [phase1] -> [phase2] -> [phase3]"
 */
function buildEvolutionSummary(evolution: EvolutionPhase[]): string {
  if (!hasEntries(evolution)) return '';

  if (evolution.length === 1) {
    return `Evolution: ${evolution[0].phase} — ${evolution[0].description}`;
  }

  const phases = evolution.map(e => e.phase);
  return `Evolved from ${phases.join(' → ')}`;
}

/**
 * Format artifacts into a compact summary string.
 */
function formatArtifacts(artifacts: ActivityArtifact[]): string {
  if (!hasEntries(artifacts)) return 'No artifacts data';

  return artifacts
    .slice(0, 4)
    .map(a => {
      let line = `${a.type}: "${a.name}"`;
      if (hasContent(a.impact)) {
        line += ` (${truncate(a.impact, 60)})`;
      }
      if (a.stillExists) {
        line += ' [still in use]';
      }
      return `- ${line}`;
    })
    .join('\n');
}

/**
 * Format role progression as a compact string.
 * Example: "Member → VP → President (elected from 50 candidates)"
 */
function formatRoleProgression(roles: ActivityRole[]): string {
  if (!hasEntries(roles)) return 'No role progression data';

  if (roles.length === 1) {
    const r = roles[0];
    let result = r.role;
    if (r.howObtained) {
      result += ` (${r.howObtained})`;
    }
    return result;
  }

  // Multiple roles — show progression
  const roleNames = roles.map(r => {
    let name = r.role;
    if (r.howObtained && r.howObtained !== 'volunteered') {
      name += ` (${r.howObtained})`;
    }
    return name;
  });
  return roleNames.join(' → ');
}

/**
 * Extract a "unique angle" from what makes this student's involvement special.
 * Combines origin, key moments, and meaning to identify distinctiveness.
 */
function extractUniqueAngle(profile: ActivityProfile): string {
  const parts: string[] = [];

  // What makes their origin unique
  if (hasContent(profile.story.origin.catalyst)) {
    parts.push(profile.story.origin.catalyst);
  }

  // Proudest moment often reveals uniqueness
  if (hasContent(profile.meaning.proudestMoment)) {
    parts.push(profile.meaning.proudestMoment);
  }

  // Their own words about why it matters
  if (hasContent(profile.meaning.whyItMatters)) {
    parts.push(profile.meaning.whyItMatters);
  }

  // Counterfactual impact is inherently unique
  if (hasContent(profile.impact.counterfactual)) {
    parts.push(profile.impact.counterfactual);
  }

  if (parts.length === 0) return 'No unique angle data available';

  return truncate(parts.join('. '), 300);
}

/**
 * Build a narrative contribution string from connections data.
 * Describes how this activity fits the overall student story.
 */
function buildNarrativeContribution(connections: ActivityConnections, meaning: ActivityMeaning): string {
  const parts: string[] = [];

  // Narrative role
  parts.push(`Role: ${connections.narrativeRole}`);

  // Themes
  if (hasEntries(connections.themes)) {
    parts.push(`Themes: ${connections.themes.join(', ')}`);
  }

  // Related activities
  if (hasEntries(connections.relatedActivities)) {
    const relatedNames = connections.relatedActivities
      .slice(0, 3)
      .map(r => `${r.activityName} (${r.connectionType})`);
    parts.push(`Connected to: ${relatedNames.join(', ')}`);
  }

  // How it shaped them
  if (hasContent(meaning.howItShapedThem)) {
    parts.push(`Shaped by: ${truncate(meaning.howItShapedThem, 100)}`);
  }

  return parts.join(' | ');
}

/**
 * Extract skills demonstrated from both meaning.skills and facts.technicalSkills.
 */
function extractSkillsDemonstrated(profile: ActivityProfile): string[] {
  const skills: string[] = [];

  // Skills from meaning section (with context)
  if (hasEntries(profile.meaning.skills)) {
    for (const s of profile.meaning.skills.slice(0, 5)) {
      let skill = s.skill;
      if (s.proficiencyLevel === 'advanced' || s.proficiencyLevel === 'expert') {
        skill += ` (${s.proficiencyLevel})`;
      }
      skills.push(skill);
    }
  }

  // Technical skills from facts (supplement if we don't have enough)
  if (hasEntries(profile.facts.technicalSkills) && skills.length < 5) {
    for (const ts of profile.facts.technicalSkills) {
      if (skills.length >= 7) break;
      if (!skills.some(s => s.toLowerCase().includes(ts.toLowerCase()))) {
        skills.push(ts);
      }
    }
  }

  return skills;
}

/**
 * Build impact highlights from the impact section.
 */
function buildImpactHighlights(impact: ActivityImpact): string {
  const parts: string[] = [];

  // Before/after (most compelling)
  if (impact.beforeAfter) {
    const ba = impact.beforeAfter;
    if (hasContent(ba.before) && hasContent(ba.after)) {
      parts.push(`Before: ${truncate(ba.before, 100)} → After: ${truncate(ba.after, 100)}`);
    }
  }

  // Beneficiaries
  if (hasEntries(impact.directBeneficiaries)) {
    for (const b of impact.directBeneficiaries.slice(0, 3)) {
      let line = `Helped ${b.who}`;
      if (hasContent(b.measurableOutcome)) {
        line += `: ${b.measurableOutcome}`;
      } else if (hasNumber(b.count)) {
        line += ` (${b.count} people)`;
      }
      parts.push(line);
    }
  }

  // Legacy
  if (hasContent(impact.ongoingLegacy)) {
    parts.push(`Ongoing legacy: ${truncate(impact.ongoingLegacy, 150)}`);
  }

  // External adoption
  if (impact.externalAdoption && hasContent(impact.externalAdoption.adoptedBy)) {
    parts.push(
      `Adopted by ${impact.externalAdoption.adoptedBy}: ${impact.externalAdoption.whatAdopted}`
    );
  }

  if (parts.length === 0) {
    return 'No impact data available';
  }

  return parts.map(p => `- ${p}`).join('\n');
}

/**
 * Compute gaps between what the profile contains and what the description mentions.
 *
 * This is the MOST IMPORTANT function in the bridge — it drives personalized
 * teaching by identifying what the student knows but hasn't put in their description.
 */
function computeGaps(
  profile: ActivityProfile,
  currentDescription: string
): string[] {
  const gaps: string[] = [];
  const { facts, story, meaning, impact } = profile;

  // --- Scale gaps ---
  if (hasNumber(facts.scale.teamSize) && !descriptionContainsAny(currentDescription, [
    String(facts.scale.teamSize), 'team', 'members', 'led',
  ])) {
    gaps.push(
      `Profile: led team of ${facts.scale.teamSize} | Description: no mention of team size or leadership scope`
    );
  }

  if (hasNumber(facts.scale.peopleDirectlyImpacted) && !descriptionContainsAny(currentDescription, [
    String(facts.scale.peopleDirectlyImpacted), 'impacted', 'served', 'helped', 'reached',
  ])) {
    gaps.push(
      `Profile: ${facts.scale.peopleDirectlyImpacted}+ people directly impacted | Description: no quantified impact`
    );
  }

  if (hasNumber(facts.scale.peopleIndirectlyReached) && !descriptionContainsAny(currentDescription, [
    String(facts.scale.peopleIndirectlyReached), 'reached', 'audience', 'viewers',
  ])) {
    gaps.push(
      `Profile: ${facts.scale.peopleIndirectlyReached}+ people reached | Description: no mention of broader reach`
    );
  }

  if (hasNumber(facts.scale.budgetManaged) && !descriptionContainsAny(currentDescription, [
    String(facts.scale.budgetManaged), '$', 'budget', 'fund',
  ])) {
    gaps.push(
      `Profile: managed $${facts.scale.budgetManaged.toLocaleString()} budget | Description: no mention of financial scope`
    );
  }

  if (hasNumber(facts.scale.revenueGenerated) && !descriptionContainsAny(currentDescription, [
    String(facts.scale.revenueGenerated), '$', 'revenue', 'earn', 'sales',
  ])) {
    gaps.push(
      `Profile: generated $${facts.scale.revenueGenerated.toLocaleString()} revenue | Description: no mention of revenue`
    );
  }

  if (hasNumber(facts.scale.eventsOrganized) && !descriptionContainsAny(currentDescription, [
    String(facts.scale.eventsOrganized), 'event', 'organized', 'hosted',
  ])) {
    gaps.push(
      `Profile: organized ${facts.scale.eventsOrganized} events | Description: no mention of events`
    );
  }

  if (hasNumber(facts.scale.resourcesCreated) && !descriptionContainsAny(currentDescription, [
    String(facts.scale.resourcesCreated), 'created', 'built', 'developed', 'resource',
  ])) {
    const desc = hasContent(facts.scale.resourcesDescription) ? facts.scale.resourcesDescription : 'resources';
    gaps.push(
      `Profile: created ${facts.scale.resourcesCreated} ${desc} | Description: no mention of created resources`
    );
  }

  // --- Recognition gaps ---
  if (hasEntries(facts.recognition)) {
    for (const rec of facts.recognition) {
      const searchTerms = [rec.name];
      if (hasContent(rec.placement)) searchTerms.push(rec.placement);
      if (hasContent(rec.level)) searchTerms.push(rec.level);
      if (hasContent(rec.issuedBy)) searchTerms.push(rec.issuedBy);

      if (!descriptionContainsAny(currentDescription, searchTerms)) {
        let recDesc = rec.name;
        if (hasContent(rec.placement)) recDesc = `${rec.placement}, ${recDesc}`;
        if (hasContent(rec.level)) recDesc += ` (${rec.level})`;
        gaps.push(
          `Profile: ${recDesc} | Description: recognition not mentioned`
        );
      }
    }
  }

  // --- Before/after gap ---
  if (impact.beforeAfter && hasContent(impact.beforeAfter.before) && hasContent(impact.beforeAfter.after)) {
    // Check if description contains any quantitative before/after indication
    const hasBeforeAfterLanguage = descriptionContainsAny(currentDescription, [
      'before', 'after', 'increased', 'decreased', 'improved', 'reduced',
      '%', 'from', 'to', '→',
    ]);
    if (!hasBeforeAfterLanguage) {
      gaps.push(
        `Profile: Before: ${truncate(impact.beforeAfter.before, 60)} → After: ${truncate(impact.beforeAfter.after, 60)} | Description: no before/after transformation shown`
      );
    }
  }

  // --- Role evolution gap ---
  if (hasEntries(facts.roles) && facts.roles.length > 1) {
    const hasEvolutionLanguage = descriptionContainsAny(currentDescription, [
      'promoted', 'advanced', 'elected', 'founded', 'rose to', 'became',
    ]);
    if (!hasEvolutionLanguage) {
      const roles = facts.roles.map(r => r.role).join(' → ');
      gaps.push(
        `Profile: role progression ${roles} | Description: no mention of growth/progression`
      );
    }
  }

  // --- Artifacts gap ---
  if (hasEntries(facts.artifacts)) {
    for (const artifact of facts.artifacts.slice(0, 3)) {
      if (!descriptionContainsAny(currentDescription, [artifact.name, artifact.type])) {
        gaps.push(
          `Profile: created ${artifact.type} "${artifact.name}" | Description: tangible output not mentioned`
        );
      }
    }
  }

  // --- Counterfactual gap ---
  if (hasContent(impact.counterfactual) && !descriptionContainsAny(currentDescription, [
    'without', 'wouldn\'t', 'would not', 'before I',
  ])) {
    gaps.push(
      `Profile: ${truncate(impact.counterfactual, 100)} | Description: counterfactual impact not leveraged`
    );
  }

  return gaps;
}

/**
 * Identify the top elements from the profile that should appear
 * in a 150-character description, ranked by admissions impact.
 */
function suggestDescriptionElements(profile: ActivityProfile): string[] {
  const elements: { text: string; priority: number }[] = [];
  const { facts, impact, connections, meaning } = profile;

  // Quantifiable scale (highest priority)
  if (hasNumber(facts.scale.peopleDirectlyImpacted)) {
    elements.push({
      text: `Quantified impact: ${facts.scale.peopleDirectlyImpacted}+ people directly helped`,
      priority: 10,
    });
  }
  if (hasNumber(facts.scale.teamSize)) {
    elements.push({
      text: `Leadership scope: team of ${facts.scale.teamSize}`,
      priority: 9,
    });
  }
  if (hasNumber(facts.scale.budgetManaged)) {
    elements.push({
      text: `Financial scope: $${facts.scale.budgetManaged.toLocaleString()} budget`,
      priority: 8,
    });
  }
  if (hasNumber(facts.scale.revenueGenerated)) {
    elements.push({
      text: `Revenue impact: $${facts.scale.revenueGenerated.toLocaleString()}`,
      priority: 9,
    });
  }

  // Before/after transformation
  if (impact.beforeAfter && hasContent(impact.beforeAfter.before) && hasContent(impact.beforeAfter.after)) {
    elements.push({
      text: `Transformation: "${truncate(impact.beforeAfter.before, 40)}" → "${truncate(impact.beforeAfter.after, 40)}"`,
      priority: 9,
    });
  }

  // Recognition
  if (hasEntries(facts.recognition)) {
    const top = facts.recognition[0];
    let recText = top.name;
    if (hasContent(top.placement)) recText = `${top.placement}, ${recText}`;
    if (hasContent(top.level)) recText += ` (${top.level})`;
    elements.push({
      text: `Recognition: ${recText}`,
      priority: 8,
    });
  }

  // Artifacts/tangible outputs
  if (hasEntries(facts.artifacts)) {
    const top = facts.artifacts[0];
    elements.push({
      text: `Tangible output: ${top.type} "${top.name}"`,
      priority: 7,
    });
  }

  // Spike connection
  if (connections.spikeRelevance.connectsToSpike && hasContent(connections.spikeRelevance.spikeConnection)) {
    elements.push({
      text: `Spike connection: ${truncate(connections.spikeRelevance.spikeConnection, 80)}`,
      priority: 7,
    });
  }

  // Role progression
  if (hasEntries(facts.roles) && facts.roles.length > 1) {
    elements.push({
      text: `Role growth: ${facts.roles.map(r => r.role).join(' → ')}`,
      priority: 6,
    });
  }

  // External adoption
  if (impact.externalAdoption && hasContent(impact.externalAdoption.adoptedBy)) {
    elements.push({
      text: `External adoption: ${impact.externalAdoption.adoptedBy} adopted "${impact.externalAdoption.whatAdopted}"`,
      priority: 8,
    });
  }

  // Proudest moment (adds personal depth)
  if (hasContent(meaning.proudestMoment)) {
    elements.push({
      text: `Personal highlight: ${truncate(meaning.proudestMoment, 80)}`,
      priority: 5,
    });
  }

  // Sort by priority descending, return top 5
  return elements
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 5)
    .map(e => e.text);
}

/**
 * Count how many profile sections have meaningful data.
 * Used by isProfileUseful() to avoid injecting noise.
 */
function countMeaningfulFields(profile: ActivityProfile): number {
  let count = 0;

  const { facts, story, meaning, impact, connections } = profile;

  // Facts section
  if (hasNumber(facts.duration.totalHoursEstimated) && facts.duration.totalHoursEstimated > 0) count++;
  if (hasNumber(facts.scale.teamSize) || hasNumber(facts.scale.peopleDirectlyImpacted) ||
      hasNumber(facts.scale.budgetManaged) || hasNumber(facts.scale.eventsOrganized)) count++;
  if (hasEntries(facts.roles)) count++;
  if (hasEntries(facts.recognition)) count++;
  if (hasEntries(facts.artifacts)) count++;
  if (hasEntries(facts.technicalSkills)) count++;

  // Story section
  if (hasContent(story.origin.whyJoined) || hasContent(story.origin.howStarted)) count++;
  if (hasEntries(story.keyMoments)) count++;
  if (hasEntries(story.evolution)) count++;
  if (hasEntries(story.relationships)) count++;

  // Meaning section
  if (hasEntries(meaning.skills)) count++;
  if (hasEntries(meaning.values)) count++;
  if (hasContent(meaning.whyItMatters)) count++;
  if (hasEntries(meaning.authenticQuotes)) count++;
  if (hasContent(meaning.proudestMoment)) count++;

  // Impact section
  if (hasEntries(impact.directBeneficiaries)) count++;
  if (impact.beforeAfter && hasContent(impact.beforeAfter.before)) count++;
  if (hasEntries(impact.testimonials)) count++;
  if (hasContent(impact.ongoingLegacy)) count++;

  // Connections section
  if (connections.spikeRelevance.connectsToSpike) count++;
  if (connections.majorAlignment.relevantToMajor) count++;
  if (hasEntries(connections.characterTraits)) count++;

  return count;
}

// ============================================================================
// MAIN SERVICE
// ============================================================================

export class ProfileBridgeService {
  /**
   * Generate story detection summary for Stage 0.
   * Compact — only story/meaning/connection data.
   *
   * @param profile The rich activity profile from conversation
   * @returns A concise summary focused on narrative identity
   */
  summarizeForStory(profile: ActivityProfile): ProfileSummaryForStory {
    const { story, meaning, connections } = profile;

    // Build story essence from origin + meaning
    const storyEssence = buildStoryEssence(story, meaning);

    // Origin story
    let originStory = 'No origin data';
    if (hasContent(story.origin.howStarted)) {
      originStory = story.origin.howStarted;
      if (hasContent(story.origin.catalyst)) {
        originStory += ` (catalyst: ${story.origin.catalyst})`;
      }
    }

    // Key moments (top 2-3)
    const keyMoments = extractKeyMoments(story.keyMoments, 3);

    // Evolution summary
    const evolutionSummary = buildEvolutionSummary(story.evolution);

    // Meaning connection
    let meaningConnection = 'No meaning data';
    if (hasContent(meaning.whyItMatters)) {
      meaningConnection = meaning.whyItMatters;
    } else if (hasContent(meaning.proudestMoment)) {
      meaningConnection = `Proudest moment: ${meaning.proudestMoment}`;
    }

    // Spike connection
    let spikeConnection = 'No spike data';
    if (connections.spikeRelevance.connectsToSpike) {
      if (hasContent(connections.spikeRelevance.spikeConnection)) {
        spikeConnection = connections.spikeRelevance.spikeConnection;
      } else {
        spikeConnection = `Connected to spike (strength: ${connections.spikeRelevance.strength})`;
      }
    }

    // Narrative role
    const narrativeRole = connections.narrativeRole;

    return {
      activityId: profile.activityId,
      hasProfile: true,
      storyEssence: truncate(storyEssence, 400),
      originStory: truncate(originStory, 300),
      keyMoments,
      evolutionSummary: truncate(evolutionSummary, 300),
      meaningConnection: truncate(meaningConnection, 300),
      spikeConnection: truncate(spikeConnection, 200),
      narrativeRole,
    };
  }

  /**
   * Generate analysis summary for Stage 1.
   * Facts-focused — verified metrics, recognition, scale.
   *
   * @param profile The rich activity profile from conversation
   * @returns A concise summary focused on verifiable facts and metrics
   */
  summarizeForAnalysis(profile: ActivityProfile): ProfileSummaryForAnalysis {
    const { facts, story, meaning, impact } = profile;

    // Verified facts as bullet points
    const verifiedParts: string[] = [];

    // Duration
    if (hasNumber(facts.duration.totalYears) && facts.duration.totalYears > 0) {
      verifiedParts.push(`${facts.duration.totalYears} years of involvement`);
    }
    if (hasNumber(facts.duration.hoursPerWeek) && facts.duration.hoursPerWeek > 0) {
      verifiedParts.push(`${facts.duration.hoursPerWeek} hrs/wk, ${facts.duration.weeksPerYear} wks/yr`);
    }

    // Scale
    const scale = extractScaleMetrics(facts);
    for (const [, value] of Object.entries(scale)) {
      verifiedParts.push(value);
    }

    // Roles
    if (hasEntries(facts.roles)) {
      const roleNames = facts.roles.map(r => r.role);
      verifiedParts.push(`Roles: ${roleNames.join(' → ')}`);
    }

    // Technical skills
    if (hasEntries(facts.technicalSkills)) {
      verifiedParts.push(`Skills: ${facts.technicalSkills.slice(0, 5).join(', ')}`);
    }

    const verifiedFacts = verifiedParts.length > 0
      ? verifiedParts.map(p => `- ${p}`).join('\n')
      : 'No verified facts available';

    // Recognition
    const recognitionSummary = formatRecognition(facts.recognition);

    // Scale metrics
    const scaleEntries = Object.entries(scale);
    const scaleMetrics = scaleEntries.length > 0
      ? scaleEntries.map(([key, val]) => `- ${key}: ${val}`).join('\n')
      : 'No scale metrics available';

    // Artifacts summary
    const artifactsSummary = formatArtifacts(facts.artifacts);

    // Role progression
    const roleProgression = formatRoleProgression(facts.roles);

    // Story essence (compact for tier context)
    const storyEssence = buildStoryEssence(story, meaning);

    // Impact highlights
    const impactHighlights = buildImpactHighlights(impact);

    return {
      activityId: profile.activityId,
      hasProfile: true,
      verifiedFacts,
      recognitionSummary,
      scaleMetrics,
      artifactsSummary,
      roleProgression,
      storyEssence: truncate(storyEssence, 300),
      impactHighlights,
    };
  }

  /**
   * Generate teaching summary for Stage 2.
   * The RICHEST summary — includes gap analysis vs description.
   * This is where the biggest quality improvement happens because
   * we can tell the LLM exactly what the student knows but hasn't
   * included in their description.
   *
   * @param profile The rich activity profile from conversation
   * @param currentDescription The student's current 150-char description
   * @returns A comprehensive summary with gap analysis and teaching focus
   */
  summarizeForTeaching(
    profile: ActivityProfile,
    currentDescription: string
  ): ProfileSummaryForTeaching {
    const { facts, story, meaning, impact } = profile;

    // Authentic quotes (top 5)
    const authenticQuotes: string[] = [];
    if (hasEntries(meaning.authenticQuotes)) {
      for (const q of meaning.authenticQuotes.slice(0, 5)) {
        authenticQuotes.push(`"${q.quote}" — ${q.context}`);
      }
    }

    // Verified metrics
    const verifiedMetrics = extractScaleMetrics(facts);

    // Key moments (top 3)
    const keyMoments: string[] = [];
    if (hasEntries(story.keyMoments)) {
      for (const m of story.keyMoments.slice(0, 3)) {
        let moment = `[${m.type}] ${m.description}`;
        if (hasContent(m.outcome)) {
          moment += ` → ${m.outcome}`;
        }
        keyMoments.push(truncate(moment, 200));
      }
    }

    // GAP ANALYSIS — the critical piece
    const gapsVsDescription = computeGaps(profile, currentDescription);

    // Suggested description elements
    const suggestedElements = suggestDescriptionElements(profile);

    // Impact highlights
    const impactHighlights = buildImpactHighlights(profile.impact);

    // Skills demonstrated
    const skillsDemonstrated = extractSkillsDemonstrated(profile);

    // Build the prompt block
    const promptBlock = this.buildTeachingPromptBlock(
      profile,
      currentDescription,
      authenticQuotes,
      verifiedMetrics,
      gapsVsDescription,
      suggestedElements
    );

    return {
      activityId: profile.activityId,
      hasProfile: true,
      authenticQuotes,
      verifiedMetrics,
      keyMoments,
      gapsVsDescription,
      suggestedDescriptionElements: suggestedElements,
      impactHighlights,
      skillsDemonstrated,
      promptBlock,
    };
  }

  /**
   * Generate synthesis summary for Stage 3.
   * Connection-focused — narrative role, traits, spike.
   *
   * @param profile The rich activity profile from conversation
   * @returns A concise summary focused on portfolio positioning
   */
  summarizeForSynthesis(profile: ActivityProfile): ProfileSummaryForSynthesis {
    const { connections, meaning } = profile;

    // Unique angle — what makes this student's version distinctive
    const uniqueAngle = extractUniqueAngle(profile);

    // Narrative contribution — how this fits the overall story
    const narrativeContribution = buildNarrativeContribution(connections, meaning);

    // Best description elements (reuse the ranking logic from suggestDescriptionElements)
    const bestDescriptionElements = suggestDescriptionElements(profile);

    // Narrative role
    const narrativeRole = connections.narrativeRole;

    // Character traits
    const characterTraits: string[] = [];
    if (hasEntries(connections.characterTraits)) {
      for (const ct of connections.characterTraits) {
        let trait = ct.trait;
        if (hasContent(ct.howDemonstrated)) {
          trait += `: ${truncate(ct.howDemonstrated, 80)}`;
        }
        characterTraits.push(trait);
      }
    }

    // Supplement with values from meaning section
    if (hasEntries(meaning.values) && characterTraits.length < 5) {
      for (const v of meaning.values) {
        if (characterTraits.length >= 5) break;
        characterTraits.push(`${v.value}: ${truncate(v.howDemonstrated, 80)}`);
      }
    }

    // Spike relevance
    let spikeRelevance = 'Not connected to spike';
    if (connections.spikeRelevance.connectsToSpike) {
      spikeRelevance = `${connections.spikeRelevance.strength} connection`;
      if (hasContent(connections.spikeRelevance.spikeConnection)) {
        spikeRelevance += `: ${connections.spikeRelevance.spikeConnection}`;
      }
      if (hasContent(connections.spikeRelevance.spikeAspect)) {
        spikeRelevance += ` (aspect: ${connections.spikeRelevance.spikeAspect})`;
      }
    }

    // Major alignment
    let majorAlignment = 'Not aligned with intended major';
    if (connections.majorAlignment.relevantToMajor) {
      majorAlignment = 'Relevant to intended major';
      if (hasContent(connections.majorAlignment.howRelevant)) {
        majorAlignment += `: ${connections.majorAlignment.howRelevant}`;
      }
      if (hasEntries(connections.majorAlignment.skillsDemonstrated)) {
        majorAlignment += ` | Skills: ${connections.majorAlignment.skillsDemonstrated.join(', ')}`;
      }
    }

    return {
      activityId: profile.activityId,
      hasProfile: true,
      uniqueAngle,
      narrativeContribution,
      bestDescriptionElements,
      narrativeRole,
      characterTraits,
      spikeRelevance: truncate(spikeRelevance, 300),
      majorAlignment: truncate(majorAlignment, 300),
    };
  }

  /**
   * Generate summaries for all stages at once.
   * Useful when the pipeline runs all stages sequentially.
   *
   * @param profile The rich activity profile from conversation
   * @param currentDescription The student's current description text
   * @returns All four stage summaries
   */
  summarizeAll(
    profile: ActivityProfile,
    currentDescription: string
  ): {
    story: ProfileSummaryForStory;
    analysis: ProfileSummaryForAnalysis;
    teaching: ProfileSummaryForTeaching;
    synthesis: ProfileSummaryForSynthesis;
  } {
    return {
      story: this.summarizeForStory(profile),
      analysis: this.summarizeForAnalysis(profile),
      teaching: this.summarizeForTeaching(profile, currentDescription),
      synthesis: this.summarizeForSynthesis(profile),
    };
  }

  /**
   * Compute gaps between what the profile contains and what the description mentions.
   *
   * This is THE core value proposition of the profile bridge integration:
   * "You told me you trained 12 tutors - why isn't that in your description?"
   *
   * Returns a list of things the student KNOWS but hasn't WRITTEN.
   *
   * @param profile The rich activity profile from conversation
   * @param description The student's current activity description
   * @returns Array of gap descriptions showing profile data missing from description
   */
  computeGaps(profile: ActivityProfile, description: string): string[] {
    return computeGaps(profile, description);
  }

  /**
   * Check if a profile has enough data to be useful.
   * Below 15% completeness or fewer than 3 meaningful fields,
   * the profile adds noise rather than value.
   *
   * @param profile The activity profile to evaluate
   * @returns true if the profile should be injected into pipeline prompts
   */
  isProfileUseful(profile: ActivityProfile): boolean {
    // Gate 1: Minimum completeness threshold
    if (profile.dataCompleteness < MIN_COMPLETENESS_THRESHOLD) {
      return false;
    }

    // Gate 2: Minimum meaningful fields
    const fieldCount = countMeaningfulFields(profile);
    if (fieldCount < MIN_MEANINGFUL_FIELDS) {
      return false;
    }

    return true;
  }

  /**
   * Format a profile summary as a prompt-ready text block.
   * Used by each stage to inject into LLM prompts.
   *
   * The output is a clearly labeled block with section headers
   * that the LLM can reference during generation.
   *
   * @param summary Any of the four stage summary types
   * @returns A formatted text block ready for prompt injection
   */
  formatForPrompt(
    summary:
      | ProfileSummaryForStory
      | ProfileSummaryForAnalysis
      | ProfileSummaryForTeaching
      | ProfileSummaryForSynthesis
  ): string {
    if (!summary.hasProfile) {
      return '';
    }

    // Determine summary type by checking for distinctive fields
    if (this.isStorySummary(summary)) {
      return this.formatStorySummaryForPrompt(summary);
    }
    if (this.isAnalysisSummary(summary)) {
      return this.formatAnalysisSummaryForPrompt(summary);
    }
    if (this.isTeachingSummary(summary)) {
      return summary.promptBlock; // Already built during summarize
    }
    if (this.isSynthesisSummary(summary)) {
      return this.formatSynthesisSummaryForPrompt(summary);
    }

    return '';
  }

  // ============================================================================
  // PRIVATE FORMATTING METHODS
  // ============================================================================

  /**
   * Build the full prompt block for Stage 2 teaching injection.
   */
  private buildTeachingPromptBlock(
    profile: ActivityProfile,
    currentDescription: string,
    authenticQuotes: string[],
    verifiedMetrics: Record<string, string>,
    gaps: string[],
    suggestedElements: string[]
  ): string {
    const sections: string[] = [];

    // Section 1: Verified context
    const metricsLines = Object.entries(verifiedMetrics).map(
      ([key, val]) => `- ${key}: ${val}`
    );

    // Add recognition
    if (hasEntries(profile.facts.recognition)) {
      for (const rec of profile.facts.recognition.slice(0, 3)) {
        let line = rec.name;
        if (hasContent(rec.placement)) line = `${rec.placement}, ${line}`;
        if (hasContent(rec.level)) line += ` (${rec.level})`;
        if (hasContent(rec.selectivity)) line += ` [${rec.selectivity}]`;
        metricsLines.push(`- Recognition: ${line}`);
      }
    }

    // Add before/after
    if (profile.impact.beforeAfter && hasContent(profile.impact.beforeAfter.before)) {
      metricsLines.push(
        `- Impact: Before: ${truncate(profile.impact.beforeAfter.before, 60)} → After: ${truncate(profile.impact.beforeAfter.after, 60)}`
      );
    }

    if (metricsLines.length > 0) {
      sections.push(
        `VERIFIED STUDENT CONTEXT (from conversation — treat as confirmed facts):\n${metricsLines.join('\n')}`
      );
    }

    // Section 2: Authentic voice
    if (authenticQuotes.length > 0) {
      sections.push(
        `AUTHENTIC STUDENT VOICE:\n${authenticQuotes.map(q => `- ${q}`).join('\n')}`
      );
    }

    // Section 3: Gap analysis (the most valuable section)
    if (gaps.length > 0) {
      sections.push(
        `DESCRIPTION GAPS (profile shows these, but description doesn't mention):\n${gaps.map(g => `- ${g}`).join('\n')}`
      );
    }

    // Section 4: Suggested elements
    if (suggestedElements.length > 0) {
      sections.push(
        `TOP ELEMENTS FOR 150-CHAR DESCRIPTION (ranked by admissions impact):\n${suggestedElements.map((e, i) => `${i + 1}. ${e}`).join('\n')}`
      );
    }

    // Section 5: Key moments for teaching reference
    if (hasEntries(profile.story.keyMoments)) {
      const momentLines = profile.story.keyMoments.slice(0, 3).map(m => {
        let line = `[${m.type}] ${truncate(m.description, 100)}`;
        if (hasContent(m.outcome)) line += ` → ${truncate(m.outcome, 60)}`;
        return `- ${line}`;
      });
      sections.push(
        `KEY MOMENTS (for teaching context):\n${momentLines.join('\n')}`
      );
    }

    if (sections.length === 0) {
      return `STUDENT PROFILE: Minimal data available for "${profile.activityTitle}"`;
    }

    return sections.join('\n\n');
  }

  /**
   * Format Stage 0 story summary for prompt injection.
   */
  private formatStorySummaryForPrompt(summary: ProfileSummaryForStory): string {
    const lines: string[] = [
      'STUDENT PROFILE CONTEXT (from conversation):',
    ];

    if (summary.storyEssence !== 'No story data available') {
      lines.push(`Story: ${summary.storyEssence}`);
    }
    if (summary.originStory !== 'No origin data') {
      lines.push(`Origin: ${summary.originStory}`);
    }
    if (summary.keyMoments.length > 0) {
      lines.push(`Key moments:\n${summary.keyMoments.map(m => `  - ${m}`).join('\n')}`);
    }
    if (hasContent(summary.evolutionSummary)) {
      lines.push(`Evolution: ${summary.evolutionSummary}`);
    }
    if (summary.meaningConnection !== 'No meaning data') {
      lines.push(`Meaning: ${summary.meaningConnection}`);
    }
    if (summary.spikeConnection !== 'No spike data') {
      lines.push(`Spike connection: ${summary.spikeConnection}`);
    }
    lines.push(`Narrative role: ${summary.narrativeRole}`);

    // If we only have the header and the narrative role, the profile has nothing useful
    if (lines.length <= 2) {
      return '';
    }

    return lines.join('\n');
  }

  /**
   * Format Stage 1 analysis summary for prompt injection.
   */
  private formatAnalysisSummaryForPrompt(summary: ProfileSummaryForAnalysis): string {
    const sections: string[] = [
      'VERIFIED STUDENT CONTEXT (from conversation — treat as confirmed facts):',
    ];

    if (summary.verifiedFacts !== 'No verified facts available') {
      sections.push(`Facts:\n${summary.verifiedFacts}`);
    }
    if (summary.recognitionSummary !== 'No recognition data') {
      sections.push(`Recognition:\n${summary.recognitionSummary}`);
    }
    if (summary.scaleMetrics !== 'No scale metrics available') {
      sections.push(`Scale:\n${summary.scaleMetrics}`);
    }
    if (summary.artifactsSummary !== 'No artifacts data') {
      sections.push(`Artifacts:\n${summary.artifactsSummary}`);
    }
    if (summary.roleProgression !== 'No role progression data') {
      sections.push(`Role progression: ${summary.roleProgression}`);
    }
    if (summary.impactHighlights !== 'No impact data available') {
      sections.push(`Impact:\n${summary.impactHighlights}`);
    }
    if (summary.storyEssence !== 'No story data available') {
      sections.push(`Story context: ${summary.storyEssence}`);
    }

    if (sections.length === 1) {
      return '';
    }

    return sections.join('\n\n');
  }

  /**
   * Format Stage 3 synthesis summary for prompt injection.
   */
  private formatSynthesisSummaryForPrompt(summary: ProfileSummaryForSynthesis): string {
    const lines: string[] = [
      'STUDENT PROFILE POSITIONING:',
      `Narrative role: ${summary.narrativeRole}`,
    ];

    if (summary.uniqueAngle !== 'No unique angle data available') {
      lines.push(`Unique angle: ${summary.uniqueAngle}`);
    }

    if (hasContent(summary.narrativeContribution)) {
      lines.push(`Narrative contribution: ${summary.narrativeContribution}`);
    }

    if (summary.bestDescriptionElements.length > 0) {
      lines.push(`Best description elements:\n${summary.bestDescriptionElements.map((e, i) => `  ${i + 1}. ${e}`).join('\n')}`);
    }

    if (summary.characterTraits.length > 0) {
      lines.push(`Character traits:\n${summary.characterTraits.map(t => `  - ${t}`).join('\n')}`);
    }

    if (summary.spikeRelevance !== 'Not connected to spike') {
      lines.push(`Spike: ${summary.spikeRelevance}`);
    }

    if (summary.majorAlignment !== 'Not aligned with intended major') {
      lines.push(`Major alignment: ${summary.majorAlignment}`);
    }

    return lines.join('\n');
  }

  // ============================================================================
  // TYPE GUARDS
  // ============================================================================

  /**
   * Type guard: is this a ProfileSummaryForStory?
   */
  private isStorySummary(
    summary:
      | ProfileSummaryForStory
      | ProfileSummaryForAnalysis
      | ProfileSummaryForTeaching
      | ProfileSummaryForSynthesis
  ): summary is ProfileSummaryForStory {
    return 'storyEssence' in summary && 'originStory' in summary && 'evolutionSummary' in summary;
  }

  /**
   * Type guard: is this a ProfileSummaryForAnalysis?
   */
  private isAnalysisSummary(
    summary:
      | ProfileSummaryForStory
      | ProfileSummaryForAnalysis
      | ProfileSummaryForTeaching
      | ProfileSummaryForSynthesis
  ): summary is ProfileSummaryForAnalysis {
    return 'verifiedFacts' in summary && 'recognitionSummary' in summary;
  }

  /**
   * Type guard: is this a ProfileSummaryForTeaching?
   */
  private isTeachingSummary(
    summary:
      | ProfileSummaryForStory
      | ProfileSummaryForAnalysis
      | ProfileSummaryForTeaching
      | ProfileSummaryForSynthesis
  ): summary is ProfileSummaryForTeaching {
    return 'gapsVsDescription' in summary && 'promptBlock' in summary;
  }

  /**
   * Type guard: is this a ProfileSummaryForSynthesis?
   */
  private isSynthesisSummary(
    summary:
      | ProfileSummaryForStory
      | ProfileSummaryForAnalysis
      | ProfileSummaryForTeaching
      | ProfileSummaryForSynthesis
  ): summary is ProfileSummaryForSynthesis {
    return 'uniqueAngle' in summary && 'narrativeRole' in summary && 'characterTraits' in summary && 'majorAlignment' in summary;
  }
}

/** Singleton instance for service usage */
export const profileBridgeService = new ProfileBridgeService();
