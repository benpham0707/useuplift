/**
 * PIQ TEACHING EXAMPLES CORPUS
 *
 * Comprehensive weak→strong example pairs that teach students how to fix specific issues.
 *
 * Design Principles (from extracurricular workshop + PIQ enhancements):
 * - Natural, varied, original, authentic voice
 * - Culturally diverse contexts
 * - Weak: 15-30 words (generic, vague, surface-level)
 * - Strong: 30-70 words (specific, vulnerable, deep)
 * - Clear before/after difference
 * - Issue-type specific
 * - Transferable principles
 * - Real PIQ scenarios (leadership, challenge, creative, community, etc.)
 */

import type { PIQTeachingExample, PIQRubricDimension } from './types';

// ============================================================================
// OPENING HOOK EXAMPLES
// ============================================================================

const HOOK_EXAMPLES: PIQTeachingExample[] = [
  {
    id: 'hook-001-generic-to-physical-vuln',
    issueType: 'hook-weak-generic',
    dimension: 'opening_hook_quality',
    weakExample: 'As president of the robotics club, I faced many challenges during our competition season.',
    strongExample: 'I threw up in the bathroom 20 minutes before our robotics presentation. My hands were shaking so badly I couldn\'t hold the remote control. This was our third regional competition, and I\'d already failed my team twice.',
    explanation: 'The strong version drops you into a specific, visceral moment with physical symptoms (threw up, shaking hands), exact timing (20 minutes before), and established stakes (third competition, two previous failures). Generic statements about "challenges" create no tension or intrigue.',
    diffHighlights: [
      'Added physical vulnerability (threw up, shaking hands)',
      'Added specific timing (20 minutes before)',
      'Added stakes (third attempt, two failures)',
      'Removed generic "faced challenges"',
      'Created immediate visceral engagement'
    ],
    principle: 'Physical vulnerability + specific stakes > abstract challenges',
    essayContext: 'leadership'
  },

  {
    id: 'hook-002-generic-to-in-medias-res',
    issueType: 'hook-weak-generic',
    dimension: 'opening_hook_quality',
    weakExample: 'I have always been interested in social justice and wanted to make a difference in my community.',
    strongExample: '"You need to leave. Now." The security guard\'s hand was already on my arm. Three seniors from my organizing committee had scattered. I was alone in the superintendent\'s waiting room, holding 847 parent signatures demanding answers.',
    explanation: 'The strong version starts mid-action with dialogue, physical touch (hand on arm), abandonment (scattered seniors), and quantified evidence (847 signatures). "Have always been interested" creates no scene, stakes, or tension.',
    diffHighlights: [
      'Started with dialogue and immediate conflict',
      'Added specific physical detail (hand on arm)',
      'Showed isolation (alone, others scattered)',
      'Added concrete evidence (847 signatures)',
      'Created stakes (demanding answers from superintendent)',
      'Removed abstract "interested in" statement'
    ],
    principle: 'Drop into moment of maximum tension > state interests',
    essayContext: 'community'
  },

  {
    id: 'hook-003-generic-to-sensory-immersion',
    issueType: 'hook-weak-generic',
    dimension: 'opening_hook_quality',
    weakExample: 'My grandmother\'s Alzheimer\'s diagnosis changed my perspective on healthcare.',
    strongExample: 'She asked me my name for the third time that morning. Each time, I watched her face search mine like she was reading a language she used to know. The smell of her jasmine tea—the one constant she remembered to make—filled the kitchen where she\'d taught me to cook for eighteen years.',
    explanation: 'The strong version uses sensory details (smell of jasmine tea), specific repetition (third time), visual metaphor (reading a language), and time context (eighteen years of cooking together). Generic "changed my perspective" tells rather than shows.',
    diffHighlights: [
      'Added sensory detail (smell of jasmine tea)',
      'Added specific count (third time)',
      'Added visual imagery (face searching, reading language)',
      'Added time depth (eighteen years)',
      'Showed the change through scene, not statement',
      'Removed generic "changed my perspective"'
    ],
    principle: 'Sensory immersion + specific moments > abstract statements',
    essayContext: 'challenge'
  },

  {
    id: 'hook-004-add-stakes',
    issueType: 'hook-missing-stakes',
    dimension: 'opening_hook_quality',
    weakExample: 'The final debate round was the most important match of my career. I had prepared extensively and felt ready.',
    strongExample: 'The final debate round was the most important match of my career. I\'d lost twice to this same opponent—once costing us nationals, once costing me captain position. My team had voted: win this, or step down. I had prepared extensively. And I was about to forget every word.',
    explanation: 'The strong version adds specific stakes (previous losses with consequences, team ultimatum), creates dramatic irony (prepared but about to forget), and shows what\'s at risk. Simply saying "most important" doesn\'t establish why.',
    diffHighlights: [
      'Added previous losses with consequences (nationals, captaincy)',
      'Added team ultimatum (win or step down)',
      'Added dramatic irony (prepared but forgetting)',
      'Kept "most important" but proved it with stakes',
      'Created personal and team consequences'
    ],
    principle: 'Prove stakes with consequences > state importance',
    essayContext: 'leadership'
  },

  {
    id: 'hook-005-dialogue-opening',
    issueType: 'hook-weak-generic',
    dimension: 'opening_hook_quality',
    weakExample: 'Throughout my time in theater, I learned that taking creative risks can lead to growth.',
    strongExample: '"That\'s not in the script." My director\'s voice cut through the rehearsal silence. Twenty cast members stared. I\'d just improvised an entire monologue—in Mandarin—for a character the playwright wrote as white. My hand was still shaking on the prop I\'d nearly dropped.',
    explanation: 'The strong version opens with dialogue, social pressure (twenty stares), specific creative risk (Mandarin monologue for white character), and physical symptom (shaking hand). Abstract "learned that risks lead to growth" creates no scene.',
    diffHighlights: [
      'Opened with dialogue ("That\'s not in the script")',
      'Added social pressure (director, twenty cast members staring)',
      'Made risk specific (Mandarin for white character)',
      'Added physical symptom (shaking hand)',
      'Showed the moment, not the lesson',
      'Removed generic "learned that" phrasing'
    ],
    principle: 'Dialogue + specific action > abstract lesson',
    essayContext: 'creative'
  }
];

// ============================================================================
// VULNERABILITY & AUTHENTICITY EXAMPLES
// ============================================================================

const VULNERABILITY_EXAMPLES: PIQTeachingExample[] = [
  {
    id: 'vuln-001-manufactured-to-specific-failure',
    issueType: 'vuln-manufactured-phrases',
    dimension: 'vulnerability_authenticity',
    weakExample: 'Leading 80 students was scary, but I realized that vulnerability is a strength and asking for help isn\'t a weakness.',
    strongExample: 'I spent most of Tuesday crying in the supply closet, terrified I\'d already failed everyone. My first team meeting as president: three seniors walked out. I can tell you the exact scuff marks on the floor where they stood when they said "This is a joke," but not what I said that made them leave. That\'s what shame does—it makes you remember the wrong things.',
    explanation: 'The strong version shows specific failure (crying in closet, three walkouts), fragmented memory (remembers scuff marks, not words), and psychological insight about shame. Manufactured phrases like "vulnerability is a strength" are defensive, not vulnerable.',
    diffHighlights: [
      'Replaced neat lesson with specific failure (crying, walkouts)',
      'Added fragmented memory detail (scuff marks vs words)',
      'Showed psychological truth (shame distorts memory)',
      'Removed defensive "vulnerability is strength" phrasing',
      'Created real vulnerability through specific failure',
      'Added day specificity (Tuesday)'
    ],
    principle: 'Specific failure + psychological truth > manufactured lesson',
    essayContext: 'leadership'
  },

  {
    id: 'vuln-002-defensive-retreat-to-sustained',
    issueType: 'vuln-defensive-retreat',
    dimension: 'vulnerability_authenticity',
    weakExample: 'I failed the AP Physics exam twice, but through hard work and determination, I eventually passed and learned that perseverance pays off.',
    strongExample: 'I failed the AP Physics exam twice. The second time, I told my parents I had the flu on score release day and stayed in bed until 3 PM. Even now, I can\'t open the College Board website without my stomach dropping. I passed on the third try—barely, with a 3—but "passing" feels like the wrong word for something you limp across after it\'s already broken you.',
    explanation: 'The strong version stays in the complexity: physical symptom (stayed in bed until 3 PM), lasting impact (still can\'t open website), qualified success (barely, 3 score), and metaphor that acknowledges damage. "Learned perseverance pays off" is defensive retreat.',
    diffHighlights: [
      'Added specific avoidance behavior (flu excuse, bed until 3 PM)',
      'Added lasting psychological impact (stomach drops)',
      'Qualified the "success" (barely, with a 3)',
      'Used "broken" metaphor showing damage, not triumph',
      'Removed defensive "perseverance pays off"',
      'Maintained vulnerability through complexity'
    ],
    principle: 'Stay in complexity > retreat to redemption',
    essayContext: 'challenge'
  },

  {
    id: 'vuln-003-add-physical-symptoms',
    issueType: 'vuln-level-1-minimal',
    dimension: 'vulnerability_authenticity',
    weakExample: 'Presenting my research to the university panel was difficult and nerve-wracking.',
    strongExample: 'The night before presenting my research to the university panel, I threw up twice and couldn\'t eat breakfast. During the presentation, I watched my own hands shake while advancing slides. On slide 7—the methodology section I\'d spent three months perfecting—I blanked completely. My advisor\'s face shifted from encouraging to concerned, and I wanted to disappear.',
    explanation: 'The strong version adds physical symptoms (threw up, can\'t eat, hands shaking), specific moment of failure (blanked on slide 7), quantified effort (three months), and social observation (advisor\'s expression). "Difficult and nerve-wracking" is generic acknowledgment.',
    diffHighlights: [
      'Added physical symptoms (threw up twice, couldn\'t eat)',
      'Added visible shaking (watched own hands)',
      'Named specific failure moment (blanked on slide 7)',
      'Added quantified investment (three months)',
      'Added social observation (advisor\'s expression)',
      'Removed generic "difficult" description'
    ],
    principle: 'Physical symptoms + specific failure > generic acknowledgment',
    essayContext: 'academic'
  },

  {
    id: 'vuln-004-defense-mechanism',
    issueType: 'vuln-level-1-minimal',
    dimension: 'vulnerability_authenticity',
    weakExample: 'After my article was rejected by the school newspaper, I felt disappointed but motivated to improve.',
    strongExample: 'After my article was rejected by the school newspaper, I spent two weeks making jokes about how "journalism is dead anyway" and avoided the newspaper office. I walked past it four times a day—took the long route to calculus just so I wouldn\'t see the editor-in-chief who\'d sent the rejection. Turns out my defense mechanism is humor + avoidance. My therapist would be proud I finally noticed.',
    explanation: 'The strong version reveals defense mechanisms (humor to deflect, physical avoidance), quantifies avoidance (two weeks, four times daily, long route), adds self-awareness layer (therapist comment), and shows psychological sophistication. "Disappointed but motivated" is surface-level.',
    diffHighlights: [
      'Named defense mechanisms (humor + avoidance)',
      'Quantified avoidance (two weeks, four times daily)',
      'Added specific behavior (long route to calculus)',
      'Added self-awareness layer (therapist comment)',
      'Showed psychological depth through pattern recognition',
      'Removed generic "disappointed but motivated"'
    ],
    principle: 'Reveal defense mechanisms > state emotions',
    essayContext: 'creative'
  },

  {
    id: 'vuln-005-transformation-credibility',
    issueType: 'vuln-transformation-imposed',
    dimension: 'vulnerability_authenticity',
    weakExample: 'After that conversation with my mentor, I realized I needed to change my approach and became a better leader.',
    strongExample: 'After that conversation with my mentor, I tried delegating three times. First attempt: I micromanaged anyway. Second attempt: I delegated but checked the work hourly. Third attempt: I managed to wait four hours before "just checking in." My team laughed. "We knew you\'d crack by lunch," Maya said. She was timing me. I\'m still learning to let go—yesterday I rewrote someone\'s presentation slide, caught myself, and had to apologize.',
    explanation: 'The strong version shows multiple attempts with specific failures (micromanaged, hourly checks, four-hour wait), team observation (Maya timing), humor with truth (knew you\'d crack), and ongoing struggle (yesterday\'s relapse). "Became a better leader" is too sudden and neat.',
    diffHighlights: [
      'Showed three specific attempts with escalating progress',
      'Added team observation/feedback (Maya timing)',
      'Included dialogue showing others\' awareness',
      'Added recent relapse (yesterday\'s slide rewrite)',
      'Showed ongoing struggle, not complete transformation',
      'Removed sudden "became better" claim'
    ],
    principle: 'Multiple attempts + ongoing struggle > sudden transformation',
    essayContext: 'leadership'
  },

  {
    id: 'vuln-006-no-specific-failure-fix',
    issueType: 'vuln-no-specific-failure',
    dimension: 'vulnerability_authenticity',
    weakExample: 'Organizing the cultural festival taught me about responsibility and the challenges of leadership.',
    strongExample: 'I forgot to book the venue for our cultural festival. Didn\'t forget as in "it slipped my mind"—I wrote it down, saw it every day for three weeks, and somehow convinced myself someone else would handle it. By the time I called, we\'d lost our date to a wedding reception. Had to tell 47 performers we might not have a festival. Wei\'s face when I explained: I\'ll never forget that specific disappointment.',
    explanation: 'The strong version names exact failure (forgot venue booking), dissects the psychology (saw it, convinced self someone else would do it), adds consequences (lost date, 47 performers), and captures social cost (Wei\'s face). Generic "taught me about responsibility" hides actual failure.',
    diffHighlights: [
      'Named specific failure (forgot venue booking)',
      'Explored psychological avoidance (convinced self)',
      'Added timeframe (saw it three weeks)',
      'Quantified impact (47 performers affected)',
      'Captured social cost (Wei\'s disappointment)',
      'Removed generic "taught me" phrasing'
    ],
    principle: 'Name exact failure + consequences > generic lessons',
    essayContext: 'community'
  }
];

// ============================================================================
// NARRATIVE ARC & STAKES EXAMPLES
// ============================================================================

const ARC_EXAMPLES: PIQTeachingExample[] = [
  {
    id: 'arc-001-flat-to-conflict',
    issueType: 'arc-flat-no-conflict',
    dimension: 'narrative_arc_stakes',
    weakExample: 'I organized weekly coding workshops for middle school students and helped them learn programming fundamentals.',
    strongExample: 'Week three of coding workshops: zero students showed up. Week four: two came, both on their phones the entire time. The problem wasn\'t the curriculum—I\'d spent 40 hours building it. The problem was I was teaching code like a textbook when these kids needed to build something they actually wanted. I had eight weeks left to figure out how to make Python matter to twelve-year-olds who just wanted to make games.',
    explanation: 'The strong version creates conflict (zero attendance, disengagement), establishes stakes (eight weeks left), identifies the problem (textbook teaching vs building what they want), and creates tension between effort invested (40 hours) and current failure.',
    diffHighlights: [
      'Added conflict (zero attendance, phone usage)',
      'Added quantified failure (week 3, week 4)',
      'Established problem clearly (textbook vs what they want)',
      'Added time pressure (eight weeks left)',
      'Showed effort invested (40 hours)',
      'Removed generic "helped them learn"'
    ],
    principle: 'Establish conflict + stakes + time pressure > activity summary',
    essayContext: 'community'
  },

  {
    id: 'arc-002-add-turning-point',
    issueType: 'arc-no-turning-point',
    dimension: 'narrative_arc_stakes',
    weakExample: 'Through practice and feedback, my debate skills gradually improved throughout the season.',
    strongExample: '"You\'re losing on facts, not arguments." My coach said this after my third straight loss. I didn\'t get it. I knew the Geneva Convention backwards—could cite articles in my sleep. That\'s when she made me record my cross-examinations. Listening back was brutal: defensive, robotic, zero persuasion. That recording—hearing myself sound like a Wikipedia article—changed everything. I started experimenting: What if I conceded their strongest point FIRST?',
    explanation: 'The strong version creates a specific turning point (hearing the recording), uses dialogue (coach\'s insight), shows confusion then realization (didn\'t get it → changed everything), and demonstrates new approach (concede strongest point first). "Gradually improved" has no moment of change.',
    diffHighlights: [
      'Added dialogue with specific insight ("losing on facts")',
      'Created turning point moment (hearing recording)',
      'Showed confusion then realization ("didn\'t get it")',
      'Added specific self-observation (defensive, robotic)',
      'Demonstrated new approach (concede point first)',
      'Removed vague "gradually improved"'
    ],
    principle: 'Specific turning point moment > gradual improvement',
    essayContext: 'leadership'
  },

  {
    id: 'arc-003-summary-to-scene',
    issueType: 'arc-summary-not-scene',
    dimension: 'narrative_arc_stakes',
    weakExample: 'I had a difficult conversation with my lab partner about his lack of contribution to our research project.',
    strongExample: 'I waited until everyone else left the lab at 9 PM. Practiced my opening line six times in the bathroom. When I finally said "We need to talk about the data collection," Marcus didn\'t look up from his phone. Three seconds of silence—I counted—before he said "Yeah, I know." Not defensive. Not apologetic. Just... tired. Turned out he was working two jobs and hadn\'t told anyone. I\'d prepared for conflict and got complexity instead.',
    explanation: 'The strong version turns summary into scene: specific timing (waited until 9 PM), preparation (practiced six times), dialogue (actual quotes), physical details (didn\'t look up), counted silence (three seconds), and unexpected complexity (two jobs). Summary creates distance.',
    diffHighlights: [
      'Added specific timing and waiting (9 PM, waited)',
      'Showed preparation (practiced six times in bathroom)',
      'Included actual dialogue (exact quotes)',
      'Added physical detail (didn\'t look up from phone)',
      'Counted silence for emphasis (three seconds)',
      'Revealed unexpected complexity (two jobs)',
      'Removed summary "had a conversation"'
    ],
    principle: 'Drop into scene with dialogue + details > summarize conversation',
    essayContext: 'academic'
  },

  {
    id: 'arc-004-maintain-complexity',
    issueType: 'arc-too-neat-resolved',
    dimension: 'narrative_arc_stakes',
    weakExample: 'Now I understand that leadership means listening to others, and I will always remember to value everyone\'s input.',
    strongExample: 'I\'m better at listening now—caught myself interrupting three times this week and actually stopped mid-sentence. But I still default to "fixing" when someone brings me a problem. Yesterday, when Priya described her scheduling conflict, I\'d already built a solution in my head before she finished talking. She wanted to vent. I wanted to solve. I\'m learning the difference, but it doesn\'t come naturally yet.',
    explanation: 'The strong version maintains complexity: shows progress (caught self three times), reveals ongoing pattern (default to fixing), includes recent example (yesterday with Priya), distinguishes wants (vent vs solve), and acknowledges struggle (doesn\'t come naturally). "Will always remember" is too neat.',
    diffHighlights: [
      'Showed specific progress (caught three times this week)',
      'Added recent example (yesterday with Priya)',
      'Revealed ongoing default pattern (still fixes)',
      'Distinguished between wants (vent vs solve)',
      'Acknowledged ongoing struggle (not natural)',
      'Removed "always remember" certainty'
    ],
    principle: 'Ongoing complexity + recent examples > resolved transformation',
    essayContext: 'leadership'
  },

  {
    id: 'arc-005-clarify-stakes',
    issueType: 'arc-unclear-stakes',
    dimension: 'narrative_arc_stakes',
    weakExample: 'The science fair was coming up and I needed to finish my project.',
    strongExample: 'The science fair was in six days. I\'d already lost regionals twice—once for incomplete data, once for a hypothesis I couldn\'t defend. This was my last year to qualify for states. My physics teacher had written my rec letter assuming I\'d place. If I failed again, I wouldn\'t just lose the competition—I\'d prove right everyone who said I was "more interested than capable."',
    explanation: 'The strong version adds time pressure (six days), previous failures (twice, with reasons), last-chance stakes (last year), social stakes (teacher\'s rec letter), and identity stakes (interested vs capable). "Needed to finish" has no stakes.',
    diffHighlights: [
      'Added time pressure (six days)',
      'Added previous failures with reasons',
      'Established last-chance stakes (last year)',
      'Added social stakes (teacher\'s rec letter)',
      'Added identity stakes (quote about capability)',
      'Removed generic "needed to finish"'
    ],
    principle: 'Layer stakes (time + reputation + identity) > state deadline',
    essayContext: 'academic'
  }
];

// ============================================================================
// SPECIFICITY & EVIDENCE EXAMPLES
// ============================================================================

const SPECIFICITY_EXAMPLES: PIQTeachingExample[] = [
  {
    id: 'spec-001-add-numbers',
    issueType: 'spec-no-numbers',
    dimension: 'specificity_evidence',
    weakExample: 'I volunteered regularly at the food bank and helped many families.',
    strongExample: 'Every Tuesday and Thursday, 6-9 PM, for 18 months: I organized food distribution for 200+ families at the South Bay Food Bank. Tracked attendance, managed 12 volunteer shifts, packed 847 boxes total.',
    explanation: 'The strong version adds specific days (Tuesday, Thursday), exact times (6-9 PM), duration (18 months), impact scale (200+ families), location (South Bay Food Bank), team size (12 volunteers), and total output (847 boxes). "Regularly" and "many" are vague.',
    diffHighlights: [
      'Added specific days (Tuesday, Thursday)',
      'Added exact times (6-9 PM)',
      'Added duration (18 months)',
      'Added impact numbers (200+ families)',
      'Added location specificity (South Bay)',
      'Added output metric (847 boxes)',
      'Removed vague "regularly" and "many"'
    ],
    principle: 'Quantify time + impact + output > vague frequency',
    essayContext: 'community'
  },

  {
    id: 'spec-002-before-after-metrics',
    issueType: 'spec-no-numbers',
    dimension: 'specificity_evidence',
    weakExample: 'Through hard work, I improved my programming skills significantly.',
    strongExample: 'September: Couldn\'t write a function without Stack Overflow. December: Built a 2,347-line inventory system from scratch. January: Teaching two juniors how to debug. Went from copying code I didn\'t understand to explaining recursion at 2 AM because someone asked.',
    explanation: 'The strong version uses month markers, shows concrete before (Stack Overflow dependent) and after (2,347-line system, teaching others), adds specific activity (explaining recursion at 2 AM), and demonstrates mastery through teaching. "Improved significantly" is unmeasurable.',
    diffHighlights: [
      'Added time markers (September, December, January)',
      'Showed concrete before state (Stack Overflow dependency)',
      'Added measurable output (2,347 lines)',
      'Demonstrated mastery (teaching two juniors)',
      'Added specific teaching moment (recursion at 2 AM)',
      'Removed vague "improved significantly"'
    ],
    principle: 'Before/after with metrics > claim improvement',
    essayContext: 'academic'
  },

  {
    id: 'spec-003-add-sensory-details',
    issueType: 'spec-missing-sensory',
    dimension: 'specificity_evidence',
    weakExample: 'I was nervous before my piano recital.',
    strongExample: 'Fifteen minutes before my piano recital, my hands started sweating so badly the keys felt slippery. I could hear my own breathing over the warm-up pianist two rooms away. The bench was cold through my dress, and I kept wiping my palms on the fabric, leaving dark streaks.',
    explanation: 'The strong version adds physical symptoms (sweating hands, slippery keys), auditory detail (hearing own breathing, pianist two rooms away), tactile sensations (cold bench through dress), and visual detail (dark streaks on fabric). "Was nervous" is abstract.',
    diffHighlights: [
      'Added specific timing (fifteen minutes before)',
      'Added physical symptom (sweating, slippery keys)',
      'Added auditory detail (own breathing, pianist)',
      'Added tactile sensation (cold bench through dress)',
      'Added visual detail (dark streaks on fabric)',
      'Removed abstract "was nervous"'
    ],
    principle: 'Multi-sensory details > state emotion',
    essayContext: 'creative'
  },

  {
    id: 'spec-004-replace-vague-language',
    issueType: 'spec-vague-descriptions',
    dimension: 'specificity_evidence',
    weakExample: 'My mentor gave me valuable advice that significantly impacted my approach to research.',
    strongExample: '"Stop trying to prove you\'re the smartest person in the room. That\'s not what science is." My mentor, Dr. Chen, said this after I\'d spent three weeks refusing to ask for help with spectroscopy. She made me write "I don\'t know" on a Post-it and stick it on my monitor. Changed how I approach every experiment.',
    explanation: 'The strong version quotes exact words, names the mentor (Dr. Chen), identifies specific technique (spectroscopy), adds timeframe (three weeks), includes physical action (Post-it on monitor), and shows application (every experiment). "Valuable advice" and "significantly impacted" are vague.',
    diffHighlights: [
      'Added exact quote (stop trying to prove...)',
      'Named the mentor (Dr. Chen)',
      'Added specific technique (spectroscopy)',
      'Added timeframe (three weeks refusing help)',
      'Included physical reminder (Post-it on monitor)',
      'Removed vague "valuable" and "significantly"'
    ],
    principle: 'Quote + specific names + actions > vague "valuable advice"',
    essayContext: 'academic'
  },

  {
    id: 'spec-005-add-time-specificity',
    issueType: 'spec-no-time-specificity',
    dimension: 'specificity_evidence',
    weakExample: 'I dedicated a lot of time to the debate team.',
    strongExample: '15 hours per week, 38 weeks per year, for three years: 1,710 total hours. That\'s researching opponents Tuesday-Thursday, practice debates Friday, tournaments Saturday, video review Sunday. Started freshman year not knowing how to hold a timer. Junior year, coaching the novice team.',
    explanation: 'The strong version breaks down time (per week, per year, total), maps activities to days, shows progression (timer → coaching), and proves sustained commitment. "A lot of time" is meaningless.',
    diffHighlights: [
      'Broke down time (weekly, yearly, three-year total)',
      'Calculated total hours (1,710)',
      'Mapped activities to specific days',
      'Showed skill progression (timer → coaching)',
      'Proved sustained commitment over three years',
      'Removed vague "a lot of time"'
    ],
    principle: 'Break down + calculate total + show progression > vague "a lot"',
    essayContext: 'leadership'
  }
];

// ============================================================================
// EXPORT ALL EXAMPLES
// ============================================================================

export const PIQ_TEACHING_EXAMPLES: PIQTeachingExample[] = [
  ...HOOK_EXAMPLES,
  ...VULNERABILITY_EXAMPLES,
  ...ARC_EXAMPLES,
  ...SPECIFICITY_EXAMPLES,
  // TODO: Add examples for remaining dimensions:
  // - VOICE_EXAMPLES (20-25 examples)
  // - REFLECTION_EXAMPLES (20-25 examples)
  // - IDENTITY_EXAMPLES (15-20 examples)
  // - CRAFT_EXAMPLES (10-15 examples)
  // - COHERENCE_EXAMPLES (5-10 examples)
];

console.log(`✓ PIQ Teaching Examples loaded: ${PIQ_TEACHING_EXAMPLES.length} examples across ${new Set(PIQ_TEACHING_EXAMPLES.map(e => e.dimension)).size} dimensions`);

/**
 * Get teaching example by ID
 */
export function getTeachingExample(exampleId: string): PIQTeachingExample | undefined {
  return PIQ_TEACHING_EXAMPLES.find(e => e.id === exampleId);
}

/**
 * Get teaching examples for a specific issue type
 */
export function getExamplesForIssueType(issueType: string): PIQTeachingExample[] {
  return PIQ_TEACHING_EXAMPLES.filter(e => e.issueType === issueType);
}

/**
 * Get teaching examples for a dimension
 */
export function getExamplesForDimension(dimension: PIQRubricDimension): PIQTeachingExample[] {
  return PIQ_TEACHING_EXAMPLES.filter(e => e.dimension === dimension);
}

/**
 * Get best teaching example for an issue
 * Matches by issue type, then by dimension, then returns first match
 */
export function getBestExampleForIssue(
  issueType: string,
  dimension: PIQRubricDimension,
  essayContext?: string
): PIQTeachingExample | null {
  // Try exact issue type match with context
  if (essayContext) {
    const contextMatch = PIQ_TEACHING_EXAMPLES.find(
      e => e.issueType === issueType && e.essayContext === essayContext
    );
    if (contextMatch) return contextMatch;
  }

  // Try exact issue type match
  const issueMatch = PIQ_TEACHING_EXAMPLES.find(e => e.issueType === issueType);
  if (issueMatch) return issueMatch;

  // Try dimension match
  const dimensionMatches = PIQ_TEACHING_EXAMPLES.filter(e => e.dimension === dimension);
  if (dimensionMatches.length > 0) return dimensionMatches[0];

  // No match found
  return null;
}
