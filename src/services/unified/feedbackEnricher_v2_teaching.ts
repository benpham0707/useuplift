/**
 * Feedback Enricher v2: Teaching-Focused
 *
 * Philosophy: We're not just scoring - we're TEACHING.
 *
 * Tone: Encouraging, motivating, caring mentor who:
 * - Celebrates what's working
 * - Explains WHY things matter (not just WHAT to fix)
 * - Tells stories and provides context
 * - Makes students feel understood and capable
 * - Provides lengthy, in-depth analysis so they truly learn
 *
 * Goal: Student should finish reading and think:
 * "I understand EXACTLY why this matters, what I can do, and I feel EXCITED to improve"
 */

import {
  getPercentileForScore,
  getCompetitiveBenchmark,
  getTierInfo,
  explainScore
} from './calibrationData';

// ============================================================================
// TYPES
// ============================================================================

export interface SimpleEvidence {
  quotes: string[];
  justification: string;
  constructive_feedback?: string;
  anchors_met?: number[];
}

export interface TeachingFeedback {
  // ===== THE OPENING: Where You Are =====
  opening_story: string; // Warm, personalized observation about their essay

  // ===== CELEBRATING STRENGTHS (Detailed) =====
  what_youre_doing_well: {
    summary: string; // Encouraging headline
    detailed_observations: Array<{
      strength: string;
      why_this_matters: string; // Teach them WHY this is good
      evidence_from_essay: string; // Quote from THEIR writing
      encouragement: string; // Motivating comment
    }>;
  };

  // ===== YOUR SCORE IN CONTEXT (Storytelling) =====
  score_context: {
    your_score: number;
    percentile_story: string; // "Here's where you stand..." with context
    competitive_landscape: string; // "At top schools, readers are looking for..."
    what_this_means_for_you: string; // Personal, encouraging explanation
    the_good_news: string; // Hope and actionable clarity
  };

  // ===== UNDERSTANDING THE TIERS (Educational) =====
  tier_journey: {
    current_tier_name: string;
    current_tier_explained: string; // What defines this tier (teach the concept)

    what_got_you_here: string; // Acknowledge their progress

    next_tier_name: string;
    next_tier_explained: string; // What defines next tier (teach the concept)

    the_gap: string; // Story about what's between current and next

    how_to_cross_the_gap: Array<{
      step: string;
      why_this_works: string; // Teach the principle
      example: string; // Show them what it looks like
    }>;
  };

  // ===== OPPORTUNITIES FOR GROWTH (Caring & Clear) =====
  growth_opportunities: {
    headline: string; // Encouraging framing
    detailed_analysis: Array<{
      opportunity: string; // What to improve
      why_this_matters: string; // Teach them the principle behind it
      what_readers_experience: string; // Help them see from reader's POV
      how_to_improve: string; // Specific, actionable guidance
      example_transformation?: string; // Before/after if applicable
    }>;
  };

  // ===== YOUR PERSONALIZED ROADMAP (Essay-Specific) =====
  personalized_roadmap: {
    looking_at_your_essay: string; // Specific observation about THEIR writing
    what_we_notice: string[]; // Specific details from their essay

    your_next_concrete_step: {
      the_challenge: string; // Reframe issue as growth opportunity
      why_tackle_this_first: string; // Prioritization reasoning
      exactly_how: string; // Step-by-step guidance
      what_success_looks_like: string; // Help them visualize the goal
    };

    looking_ahead: string; // Encouraging vision of their potential
  };

  // ===== CLOSING ENCOURAGEMENT =====
  closing_message: string; // Warm, motivating send-off
}

// ============================================================================
// MAIN TEACHING ENRICHER
// ============================================================================

export function enrichWithTeaching(
  dimensionName: string,
  score: number,
  simpleEvidence: SimpleEvidence,
  essayText: string,
  options: {
    dimensionDisplayName?: string;
  } = {}
): TeachingFeedback {

  const displayName = options.dimensionDisplayName || formatDimensionName(dimensionName);

  // Opening story
  const opening_story = craftOpeningStory(displayName, score, simpleEvidence, essayText);

  // Celebrating strengths (detailed)
  const what_youre_doing_well = buildDetailedStrengths(
    displayName,
    score,
    simpleEvidence,
    essayText
  );

  // Score context (storytelling)
  const score_context = buildScoreContextStory(dimensionName, score, displayName);

  // Tier journey (educational)
  const tier_journey = buildTierJourneyStory(dimensionName, score, simpleEvidence, displayName);

  // Growth opportunities (caring & clear)
  const growth_opportunities = buildGrowthOpportunities(
    dimensionName,
    score,
    simpleEvidence,
    essayText,
    displayName
  );

  // Personalized roadmap (essay-specific)
  const personalized_roadmap = buildPersonalizedRoadmap(
    dimensionName,
    score,
    simpleEvidence,
    essayText,
    displayName
  );

  // Closing encouragement
  const closing_message = craftClosingMessage(score, displayName);

  return {
    opening_story,
    what_youre_doing_well,
    score_context,
    tier_journey,
    growth_opportunities,
    personalized_roadmap,
    closing_message
  };
}

// ============================================================================
// SECTION BUILDERS (Teaching-Focused)
// ============================================================================

function craftOpeningStory(
  dimensionName: string,
  score: number,
  evidence: SimpleEvidence,
  essayText: string
): string {

  const hasQuotes = evidence.quotes.length > 0;
  const firstQuote = hasQuotes ? evidence.quotes[0] : '';

  // Personalized opening based on their writing
  if (hasQuotes && firstQuote.length > 20) {
    const snippet = firstQuote.substring(0, 60).trim();
    return `Let's talk about ${dimensionName}. When we read your essay, we notice you ${snippet.toLowerCase()}... This opening gives us a window into your approach to storytelling. Let's explore what's working and where we can help you strengthen this dimension even further.`;
  }

  return `Let's dive into ${dimensionName}. We've spent time with your essay, and we want to share what we're seeing—both the strengths that are already shining through and the opportunities that could take your writing to the next level.`;
}

function buildDetailedStrengths(
  dimensionName: string,
  score: number,
  evidence: SimpleEvidence,
  essayText: string
): TeachingFeedback['what_youre_doing_well'] {

  const observations: TeachingFeedback['what_youre_doing_well']['detailed_observations'] = [];

  // Extract numbers, ages, specific details
  const numbers = essayText.match(/\b\d+\b/g) || [];
  const ages = essayText.match(/(\d+)\s*(year|age)/gi) || [];
  const properNouns = essayText.match(/\b[A-Z][a-z]+\b/g) || [];

  // Strength 1: Specificity (if present)
  if (numbers.length >= 2 || ages.length >= 1) {
    observations.push({
      strength: "You use concrete numbers and specific details",
      why_this_matters: "This is crucial because specific details make your story REAL. When you write '7 years old' or '1000-piece puzzle,' readers can picture exactly what you're describing. Generic writing says 'when I was young' - but you're giving us precision, and that's what creates vivid imagery.",
      evidence_from_essay: evidence.quotes[0] || essayText.substring(0, 100),
      encouragement: "This specificity is a strength many writers struggle to achieve. You're already doing it naturally, which tells us you have a strong foundation to build on."
    });
  }

  // Strength 2: Voice/Authenticity
  const hasPersonalPhrasing = /I (decided|realized|discovered|noticed|felt)/i.test(essayText);
  if (hasPersonalPhrasing) {
    observations.push({
      strength: "Your voice feels authentic and personal",
      why_this_matters: "Authenticity is what makes essays memorable. Admissions readers read thousands of essays - they can instantly tell when someone is writing in their real voice versus trying to sound impressive. Your natural phrasing comes through, which means readers get to know the real YOU.",
      evidence_from_essay: essayText.match(/I (decided|realized|discovered|noticed|felt)[^.!?]*/i)?.[0] || "Your personal reflections",
      encouragement: "Keep trusting your own voice. It's more powerful than you might realize."
    });
  }

  // Strength 3: Narrative structure (if chronological or has progression)
  if (/(when I was|as I|then I|eventually|however)/i.test(essayText)) {
    observations.push({
      strength: "You're building a narrative with progression",
      why_this_matters: "Good storytelling isn't just describing - it's showing CHANGE over time. When you use words like 'when I was,' 'as I matured,' 'eventually,' you're guiding readers through a journey. This structure helps them understand not just WHAT happened, but HOW you evolved.",
      evidence_from_essay: "Your use of transition words and temporal markers throughout",
      encouragement: "You understand that essays need movement and development. That's sophisticated thinking about narrative."
    });
  }

  // If we found no specific strengths, give encouraging foundational praise
  if (observations.length === 0) {
    observations.push({
      strength: "You're engaging with the writing process thoughtfully",
      why_this_matters: "Every strong essay starts with a writer who cares about telling their story authentically. The fact that you're seeking feedback and working to improve shows the kind of growth mindset that admissions committees value.",
      evidence_from_essay: "Your overall essay construction",
      encouragement: "You're building skills that will serve you not just in college applications, but in all your future writing."
    });
  }

  return {
    summary: `First, let's celebrate what's working in your essay. These are real strengths that you should maintain as you revise:`,
    detailed_observations: observations
  };
}

function buildScoreContextStory(
  dimensionName: string,
  score: number,
  displayName: string
): TeachingFeedback['score_context'] {

  const percentile = getPercentileForScore(score, dimensionName);
  const competitive = getCompetitiveBenchmark(dimensionName);

  // Percentile story (contextualized)
  let percentile_story = '';
  if (score < 4) {
    percentile_story = `Your current score places you in the ${percentile} range. Here's what that means: we've analyzed thousands of college essays, and at this level, ${displayName} needs significant strengthening to stand out in competitive admissions. But here's the important part - this dimension is very teachable, and we're going to show you exactly how to improve.`;
  } else if (score < 6) {
    percentile_story = `Your score places you in the ${percentile} range. You're building a foundation in ${displayName}, which means you're on the right track. You're not at the bottom - you're in the middle of the pack, which is actually a great place to be because targeted improvements can move you up quickly.`;
  } else if (score < 8) {
    percentile_story = `Your score puts you in the ${percentile} range - this means you're already stronger than many applicants in ${displayName}. You have a solid foundation, and you're close to the competitive range. The gap between where you are and where you want to be is smaller than you might think.`;
  } else {
    percentile_story = `Your score places you in the ${percentile} range - you're excelling in ${displayName}! You're already writing at a level that competitive admissions committees look for. Our feedback will help you maintain this strength and polish the details.`;
  }

  // Competitive landscape (teach them what readers want)
  const competitive_landscape = `At schools like UC Berkeley, UCLA, and other top institutions, admissions readers are evaluating hundreds of essays per day. ${competitive}. They're not just looking for students who can write correctly - they're looking for essays that make them FEEL something, that show genuine personality, and that reveal how you think. ${displayName} is one of the key dimensions where this comes through.`;

  // What this means for you (personal, encouraging)
  let what_this_means_for_you = '';
  if (score < 5) {
    what_this_means_for_you = `For your essay, this means we have meaningful work to do in ${displayName}, but you're not starting from zero. You have building blocks in place. Our job now is to strengthen this dimension strategically so your essay creates the impact you want.`;
  } else if (score < 7) {
    what_this_means_for_you = `For your essay, this means you're in a strong position to improve. You're past the foundational stage, which means you can focus on elevation rather than rebuilding. Small, targeted changes in ${displayName} can have a big impact on how readers experience your essay.`;
  } else {
    what_this_means_for_you = `For your essay, this means you're already competitive in ${displayName}. Our feedback will help you refine and polish, ensuring this strength comes through clearly and consistently.`;
  }

  // The good news (hope + actionable clarity)
  const the_good_news = `Here's the encouraging part: ${displayName} is one of the most improvable dimensions. Unlike talent or experiences (which you can't change at this point), how you PRESENT your story is entirely within your control. We're going to show you specific, concrete ways to strengthen this dimension using the material you already have in your essay.`;

  return {
    your_score: score,
    percentile_story,
    competitive_landscape,
    what_this_means_for_you,
    the_good_news
  };
}

function buildTierJourneyStory(
  dimensionName: string,
  score: number,
  evidence: SimpleEvidence,
  displayName: string
): TeachingFeedback['tier_journey'] {

  const tierInfo = getTierInfo(score, dimensionName);

  if (!tierInfo || !tierInfo.current) {
    // Fallback if no tier info
    return {
      current_tier_name: `Level ${Math.floor(score / 2.5) + 1}`,
      current_tier_explained: "Your current level of performance in this dimension",
      what_got_you_here: "The work you've put into your essay so far",
      next_tier_name: "Next Level",
      next_tier_explained: "The next level of craft and sophistication",
      the_gap: "Bridging from where you are to where you want to be",
      how_to_cross_the_gap: [{
        step: "Focus on the specific opportunities we've identified",
        why_this_works: "Targeted revision is more effective than general improvement",
        example: "See the personalized guidance below"
      }]
    };
  }

  const current = tierInfo.current;
  const next = tierInfo.next;

  // Current tier explained (teach the concept)
  const current_tier_explained = `${current.description}\n\nWhat this means: ${explainTierConcept(current.tier_name, displayName, current.description)}`;

  // What got you here (acknowledge progress)
  const what_got_you_here = score < 4
    ? "You're in the early stages of developing this dimension. Every strong writer started here - the key is understanding what takes you to the next level."
    : score < 7
    ? "You've developed foundational skills in this dimension. You understand the basics, and now it's about elevating your craft to make your writing more compelling."
    : "You've put in significant work to reach this level. You understand sophisticated writing techniques, and now it's about refinement and polish.";

  // Next tier explained (teach the concept)
  const next_tier_name = next ? next.tier_name : "Peak Performance";
  const next_tier_explained = next
    ? `${next.description}\n\nWhat this means: ${explainTierConcept(next.tier_name, displayName, next.description)}`
    : "You're already at an elite level. Focus on maintaining this standard across your essay.";

  // The gap (storytelling about what's between)
  const the_gap = next
    ? `The difference between ${current.tier_name} and ${next.tier_name} isn't about writing "better" in some vague sense - it's about specific, learnable techniques. Think of it like learning to play an instrument: ${current.tier_name} means you can play the notes correctly. ${next.tier_name} means you're playing with emotion and nuance that makes people want to listen. Same notes, different level of craft.`
    : "You're at the highest tier - the focus now is consistency and polish.";

  // How to cross the gap (teach the principles with examples)
  const how_to_cross_the_gap: TeachingFeedback['tier_journey']['how_to_cross_the_gap'] = [];

  if (next && next.advancement_criteria) {
    next.advancement_criteria.forEach((criterion, idx) => {
      how_to_cross_the_gap.push({
        step: criterion,
        why_this_works: explainWhyCriterionWorks(criterion, displayName),
        example: generateExampleForCriterion(criterion, displayName)
      });
    });
  }

  return {
    current_tier_name: current.tier_name,
    current_tier_explained,
    what_got_you_here,
    next_tier_name,
    next_tier_explained,
    the_gap,
    how_to_cross_the_gap
  };
}

function buildGrowthOpportunities(
  dimensionName: string,
  score: number,
  evidence: SimpleEvidence,
  essayText: string,
  displayName: string
): TeachingFeedback['growth_opportunities'] {

  const headline = score < 5
    ? `Now let's look at where we can strengthen your essay. These aren't failures - they're opportunities. Every point we raise is something you can improve with targeted revision:`
    : score < 7
    ? `You have a solid foundation. Here's where we can elevate your writing from good to great:`
    : `You're writing at a strong level. Here are refinements that will polish this dimension even further:`;

  const detailed_analysis: TeachingFeedback['growth_opportunities']['detailed_analysis'] = [];

  // Parse opportunities from evidence
  const justification = evidence.justification;
  const feedback = evidence.constructive_feedback;

  // Opportunity 1: From constructive feedback
  if (feedback) {
    detailed_analysis.push({
      opportunity: extractOpportunityHeadline(feedback),
      why_this_matters: explainWhyOpportunityMatters(feedback, dimensionName),
      what_readers_experience: describeReaderExperience(feedback, dimensionName),
      how_to_improve: expandOnHowToImprove(feedback, essayText),
      example_transformation: generateTransformationExample(feedback, dimensionName)
    });
  }

  // Opportunity 2: Extract from justification
  const weaknessMatch = justification.match(/(lacks?|missing|needs|could|without|doesn't)[^.!?]+/i);
  if (weaknessMatch && weaknessMatch[0]) {
    const weakness = weaknessMatch[0];
    detailed_analysis.push({
      opportunity: extractOpportunityHeadline(weakness),
      why_this_matters: explainWhyOpportunityMatters(weakness, dimensionName),
      what_readers_experience: describeReaderExperience(weakness, dimensionName),
      how_to_improve: expandOnHowToImprove(weakness, essayText)
    });
  }

  // If no opportunities extracted, provide generic but helpful guidance
  if (detailed_analysis.length === 0) {
    detailed_analysis.push({
      opportunity: `Deepen your approach to ${displayName}`,
      why_this_matters: `${displayName} is what makes your essay memorable and distinctive. Strengthening this dimension helps readers connect with your story on a deeper level.`,
      what_readers_experience: `When this dimension is strong, readers feel like they're experiencing your story alongside you. When it's underdeveloped, they feel like they're reading about your story from a distance.`,
      how_to_improve: `Review your essay and look for places where you're TELLING rather than SHOWING. Where can you add specific details, sensory imagery, or moments that make the reader feel present in your story?`
    });
  }

  return {
    headline,
    detailed_analysis: detailed_analysis.slice(0, 3) // Max 3 opportunities
  };
}

function buildPersonalizedRoadmap(
  dimensionName: string,
  score: number,
  evidence: SimpleEvidence,
  essayText: string,
  displayName: string
): TeachingFeedback['personalized_roadmap'] {

  // Looking at your essay (specific observation)
  const looking_at_your_essay = evidence.quotes.length > 0
    ? `When we look specifically at your essay, we notice passages like: "${evidence.quotes[0].substring(0, 80)}..." This gives us concrete material to work with.`
    : `Looking at your essay as a whole, we see the bones of a strong story. Now it's about bringing out the details that make it vivid and compelling.`;

  // What we notice (specific details)
  const what_we_notice: string[] = [];

  // Find specific elements in their essay
  const hasNumbers = /\d+/.test(essayText);
  const hasDialogue = /"[^"]+"/g.test(essayText);
  const hasReflection = /(I (realized|learned|discovered|understood))/i.test(essayText);

  if (hasNumbers) what_we_notice.push("You include specific numbers and measurements - this is good concrete detail");
  if (hasDialogue) what_we_notice.push("You use dialogue in places - this brings scenes to life");
  if (hasReflection) what_we_notice.push("You include reflective moments - this shows your thinking process");

  if (what_we_notice.length === 0) {
    what_we_notice.push("You have compelling material in your essay that we can develop further");
  }

  // Your next concrete step
  const next_step = {
    the_challenge: evidence.constructive_feedback || `Strengthen ${displayName} throughout your essay`,
    why_tackle_this_first: `This is the highest-leverage improvement you can make in ${displayName}. When you strengthen this aspect, readers will experience your entire essay differently.`,
    exactly_how: generateStepByStepGuidance(dimensionName, evidence, essayText),
    what_success_looks_like: describeSuccess(dimensionName, score, displayName)
  };

  // Looking ahead (encouraging vision)
  const looking_ahead = score < 5
    ? `As you work on ${displayName}, you're not just improving this essay - you're developing writing skills that will serve you throughout college and beyond. The techniques we're teaching you here are the same ones professional writers use. You're learning to think like a storyteller, and that's a powerful skill.`
    : score < 7
    ? `You're already writing at a level that shows real skill in ${displayName}. The improvements we're suggesting will take you from good to exceptional. When you master these techniques, you'll have essays that admissions readers remember long after they've finished reading.`
    : `Your work in ${displayName} is already strong. As you refine these final details, you're operating at the level of published writers. The polish you're adding now is what separates good essays from essays that get students into their dream schools.`;

  return {
    looking_at_your_essay,
    what_we_notice,
    your_next_concrete_step: next_step,
    looking_ahead
  };
}

function craftClosingMessage(score: number, displayName: string): string {
  if (score < 5) {
    return `Remember: ${displayName} is completely learnable. You have everything you need to improve this dimension - it's just a matter of applying the techniques we've outlined. Take it one step at a time, and don't hesitate to revise multiple times. Every draft gets you closer to the essay you want to write. You've got this.`;
  } else if (score < 7) {
    return `You're making real progress in ${displayName}. The work you've done so far has built a solid foundation. Now it's about elevation and refinement. Trust the process, apply the specific guidance we've given you, and watch your essay transform. We believe in what you're building here.`;
  } else {
    return `Your work in ${displayName} demonstrates real skill and sophistication. The refinements we've suggested are about polish, not overhaul. You're already writing at a competitive level. Keep the confidence you have in your voice, apply these final touches, and your essay will shine. Excellent work.`;
  }
}

// ============================================================================
// HELPER FUNCTIONS (Teaching-Focused)
// ============================================================================

function formatDimensionName(dimensionName: string): string {
  return dimensionName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function explainTierConcept(tierName: string, dimensionName: string, description: string): string {
  // Teaching-focused explanation of what the tier means
  const tierExplanations: Record<string, string> = {
    'Weak Opening': 'At this level, essays typically start with generic statements or announcements ("I have always been interested in..."). Readers know what the essay will be about, but they\'re not hooked yet.',
    'Adequate Opening': 'At this level, essays start with something specific - maybe an event or a detail. Readers can follow the story, but they\'re not yet compelled to lean in.',
    'Strong Opening': 'At this level, essays drop readers immediately into a vivid moment. The first sentence creates a question or tension that makes readers WANT to keep going.',
    'Exceptional Opening': 'At this level, the opening is so compelling that admissions readers remember it hours after reading. It combines vivid detail, voice, and intrigue seamlessly.',

    'Flat / List': 'Essays at this level list events without connection. "I did X, then Y, then Z." There\'s no throughline or narrative tension.',
    'Linear Story': 'Essays at this level follow a clear arc: problem, effort, solution. It\'s coherent, but the outcome often feels predictable.',
    'Engaging Story': 'Essays at this level create genuine tension. Readers wonder what will happen next because the stakes feel real.',
    'Compelling Story': 'Essays at this level master narrative craft. Structure, pacing, and emotional arc all work together to create an experience readers remember.',

    'Surface-Level': 'Essays at this level stay on the surface emotionally. They describe events but don\'t reveal the inner experience.',
    'Acknowledgment': 'Essays at this level mention vulnerability but don\'t explore it deeply. "It was hard" without showing HOW it was hard.',
    'Authentic': 'Essays at this level share genuine vulnerability - real doubts, real struggles, real internal conflicts that make readers connect with the writer as a person.',
    'Profound': 'Essays at this level achieve deep emotional honesty that feels brave. Readers are moved by the writer\'s willingness to be real.',
  };

  return tierExplanations[tierName] || description;
}

function explainWhyCriterionWorks(criterion: string, dimensionName: string): string {
  // Teach WHY this advancement criterion works
  if (criterion.includes('scene') || criterion.includes('sensory')) {
    return "Scenes with sensory details activate readers' imaginations. When you write 'I stared at the blinking cursor,' readers can PICTURE that moment. This transforms your essay from a summary into an experience.";
  }
  if (criterion.includes('stakes') || criterion.includes('tension')) {
    return "Stakes give readers a reason to care. When readers understand what you risk losing or gaining, they become emotionally invested in your journey. Without stakes, essays feel flat even if the story is interesting.";
  }
  if (criterion.includes('vulnerability') || criterion.includes('honest')) {
    return "Vulnerability creates connection. When you share real doubts or struggles, readers see you as a real person, not just an applicant. This authenticity is what makes essays memorable.";
  }
  if (criterion.includes('specific') || criterion.includes('concrete')) {
    return "Specific details are the building blocks of vivid writing. 'I practiced for hours' is generic. 'I practiced until 2 AM, when my mom started flicking the lights' is specific - and memorable.";
  }

  return `This works because it elevates your craft in ${dimensionName}, making your writing more sophisticated and compelling.`;
}

function generateExampleForCriterion(criterion: string, dimensionName: string): string {
  // Show them WHAT it looks like
  if (criterion.includes('scene')) {
    return "Generic: 'I struggled with the code.' → Specific scene: 'I stared at line 47 for twenty minutes, watching the semicolon I'd forgotten mock me in red.'";
  }
  if (criterion.includes('stakes')) {
    return "Low stakes: 'I wanted to succeed.' → Clear stakes: 'If this didn't work, I'd have to tell my team I'd wasted three weeks on a failed approach.'";
  }
  if (criterion.includes('vulnerability')) {
    return "Surface: 'It was hard.' → Authentic: 'I did that thing where I bite my thumbnail without realizing, a nervous habit I thought I'd outgrown.'";
  }

  return `See the detailed opportunities section for specific examples from your essay.`;
}

function extractOpportunityHeadline(text: string): string {
  // Extract a clear headline from opportunity text
  if (text.includes('Start with')) return "Strengthen your opening";
  if (text.includes('tension') || text.includes('stakes')) return "Develop the narrative tension";
  if (text.includes('vulnerability') || text.includes('emotional')) return "Deepen your vulnerability";
  if (text.includes('scene') || text.includes('showing')) return "Add more scenes and sensory details";
  if (text.includes('specific')) return "Increase specificity and concrete details";

  return text.substring(0, 50).trim();
}

function explainWhyOpportunityMatters(opportunity: string, dimensionName: string): string {
  // Teach them WHY this opportunity matters
  if (opportunity.includes('opening') || opportunity.includes('hook')) {
    return "Your opening is your first impression - and in competitive admissions, first impressions determine whether readers approach your essay with excitement or obligation. A strong opening earns you goodwill that carries through the entire piece.";
  }
  if (opportunity.includes('stakes') || opportunity.includes('tension')) {
    return "Without stakes, essays feel like trip reports - here's what I did, then here's what I did next. With stakes, essays become stories that readers care about. Stakes are what make readers think 'I hope this works out' as they read.";
  }
  if (opportunity.includes('vulnerability')) {
    return "Admissions readers read hundreds of essays about accomplishments. What they remember are essays that show the PERSON behind the achievements. Vulnerability doesn't mean weakness - it means honesty, and honesty creates connection.";
  }

  return `This matters because ${dimensionName} is a key dimension where competitive essays differentiate themselves. Strengthening this helps readers experience your story more deeply.`;
}

function describeReaderExperience(opportunity: string, dimensionName: string): string {
  // Help them see from reader's POV
  if (opportunity.includes('opening')) {
    return "When your opening is generic, readers think 'Okay, another essay about [topic].' When your opening is specific and vivid, readers think 'Wait, this is different. I want to know more.' That shift in mindset is everything.";
  }
  if (opportunity.includes('scene') || opportunity.includes('showing')) {
    return "When you TELL readers what happened, they process information. When you SHOW them a scene, they experience it with you. The difference is between reading a news article and watching a movie - one informs, the other immerses.";
  }
  if (opportunity.includes('vulnerability')) {
    return "When you keep everything positive and confident, readers respect you but don't connect with you. When you share authentic struggles, readers think 'I've felt that way too' - and that recognition creates connection.";
  }

  return "Strong essays make readers forget they're reading an admissions essay. They get caught up in your story and your perspective. That's the experience we're helping you create.";
}

function expandOnHowToImprove(opportunity: string, essayText: string): string {
  // Detailed, step-by-step guidance
  if (opportunity.includes('Start with') || opportunity.includes('opening')) {
    return "Find the most vivid moment in your essay - often it's buried in paragraph 2 or 3. That's your real opening. Move it to the start. Then, instead of announcing your topic, drop readers directly into that moment with sensory details. What did you see? What did you hear? What were you doing physically?";
  }
  if (opportunity.includes('scene') || opportunity.includes('showing')) {
    return "Go through your essay and highlight every place you write 'I felt [emotion]' or 'It was [adjective].' Those are TELLING sentences. For each one, ask: How did my body react? What was happening around me? What specific thing triggered this feeling? Replace the telling with those specific details.";
  }
  if (opportunity.includes('stakes') || opportunity.includes('tension')) {
    return "Ask yourself: What was I risking? What would failure have meant? Who was I afraid of disappointing? What was the worst-case scenario? Then show us that fear or risk through your actions or internal thoughts in the essay. Make us feel the weight of what mattered to you.";
  }

  return "Review your essay with this specific lens. Find 2-3 places where you can apply this principle, make those changes, and see how the essay feels different.";
}

function generateTransformationExample(opportunity: string, dimensionName: string): string | undefined {
  // Show before/after when helpful
  if (opportunity.includes('opening')) {
    return "BEFORE: 'I have always been interested in puzzles.'\nAFTER: 'I stared at the Lego Ninjago set scattered across my bedroom floor - 847 pieces that were supposed to be a ninja temple, but in my eight-year-old mind, they were about to become something better.'";
  }
  if (opportunity.includes('vulnerability')) {
    return "BEFORE: 'The project was challenging.'\nAFTER: 'I refreshed my email for the fifteenth time that hour, each refresh accompanied by that familiar stomach-drop of dread. What if I'd wasted three weeks building something nobody needed?'";
  }

  return undefined;
}

function generateStepByStepGuidance(dimensionName: string, evidence: SimpleEvidence, essayText: string): string {
  // Ultra-specific, actionable steps
  return `Here's exactly what to do:

1. Print out your essay or open it in a document where you can mark it up.

2. Read through looking ONLY for ${dimensionName.replace(/_/g, ' ')}.

3. Mark every place where this dimension appears (both strong and weak spots).

4. Choose the weakest spot - the place where ${dimensionName.replace(/_/g, ' ')} needs the most help.

5. Apply the specific technique we described above to that one spot. Don't worry about the whole essay yet - just nail this one revision.

6. Read that revised section out loud. Does it feel more vivid? More real? More engaging? If yes, you're on the right track.

7. Once you've strengthened that one spot, move to the next weakest area and repeat.

This focused, incremental approach is more effective than trying to fix everything at once. You're building skill with each revision.`;
}

function describeSuccess(dimensionName: string, currentScore: number, displayName: string): string {
  // Paint a picture of what success looks like
  const targetScore = Math.min(currentScore + 2, 9);

  return `When you've successfully strengthened ${displayName}, here's what you'll notice: Your essay will feel more ALIVE. Readers (including you!) will be more engaged. The dimension will go from being something readers have to work to understand to something they experience naturally. If we were to re-score your essay after these revisions, we'd expect to see your score move from ${currentScore} toward ${targetScore} or higher. But more importantly, YOU'LL feel the difference when you read it. That's the best indicator you're succeeding.`;
}

// ============================================================================
// BATCH ENRICHER
// ============================================================================

export function enrichAllWithTeaching(
  dimensionScores: Array<{
    dimension_name: string;
    final_score: number;
    evidence: SimpleEvidence;
  }>,
  essayText: string
): Array<{
  dimension_name: string;
  final_score: number;
  evidence: SimpleEvidence;
  teaching_feedback: TeachingFeedback;
}> {

  return dimensionScores.map(dim => ({
    ...dim,
    teaching_feedback: enrichWithTeaching(
      dim.dimension_name,
      dim.final_score,
      dim.evidence,
      essayText,
      { dimensionDisplayName: dim.dimension_name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') }
    )
  }));
}
