/**
 * Elite Examples from 2024-2025 Admissions Cycle
 *
 * Actual admitted student essays from:
 * - Harvard Class of 2029
 * - UCLA Class of 2029
 * - UC Berkeley Class of 2029
 * - Model UN exceptional example
 * - Chemistry Society exceptional example
 *
 * ⚠️ FRAGILITY FLAG (D-1.15.1 H-4 audit closure 2026-04-30) ⚠️
 * D-1.15 integration scenarios pin specific essays from this file by `id`
 * and treat their `description_original` byte-content as load-bearing —
 * iter-1 snapshotText assertions compare byte-equal to the essay text,
 * AND scenario `iter1MoveAnchors` reference paragraph indices keyed off
 * the current paragraph count.
 *
 * If you edit `description_original` for any of these IDs:
 *   - harvard-mites-2029  (S1, S4)
 *   - ucla-cancer-awareness-2029  (S2, S5)
 *   - ucb-cell-tower-2029  (S3)
 * then `tests/integration/d1-15-harness.test.ts` AND
 * `tests/integration/phase1-iteration-ledger.ts` will break — likely with
 * cryptic snapshotText-mismatch or paragraphIndex-out-of-range errors. To
 * intentionally edit these essays: update `tests/fixtures/d1-15/scenarios.ts`
 * scenario fixtures + iter1MoveAnchors in the SAME commit.
 */

import { ExperienceEntry } from '../../src/core/types/experience';

export const ELITE_EXAMPLES_2025: ExperienceEntry[] = [
  // =========================================================================
  // TIER 1: HARVARD/STANFORD/MIT LEVEL
  // =========================================================================

  {
    id: 'harvard-mites-2029',
    user_id: 'test-user',
    title: 'MITES Summer Program at MIT',
    category: 'academic',
    time_span: 'June 2024 – August 2024 (6 weeks)',
    hours_per_week: 40,
    weeks_per_year: 6,
    description_original: `Three days before I got on a plane to go across the country for six weeks I quit milk cold-turkey. I had gone to the chiropractor to get a general check up. I knew I had scoliosis and other problems; however, I learned that because of my excessive, to say the least, intake of milk my body had developed a hormone imbalance. I was afraid; afraid my support wouldn't be good enough, afraid that my body wasn't taking care of me.

Within the next 48-hours before the tower's approval at City Hall, I rallied everyone and their grandmas to be proactive for the sake of their health. Through this educational conference, I developed a plan of action to raise my voice for community health advocacy.

Living in a building with 80 people I've never met in a place I've never been while making a significant life style change was not easy. The first few days were not kind: I got mild stomach ulcers, it was awkward, and I felt out of place. That first Thursday night however, all of that started to change.

As the program progressed I only felt more comfortable and safe, enough so to even go up and speak at a family meeting. These people, this family, treated me right. I gained priceless confidence, social skills, self-worth, empathetic ability, and mental fortitude to take with me and grow on for the rest of my life. Through all of this somehow cutting out the biggest part of my diet became the least impactful part of my summer.`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  {
    id: 'ucla-cancer-awareness-2029',
    user_id: 'test-user',
    title: 'Cancer Awareness Week Founder',
    category: 'service',
    time_span: 'October 2023 – June 2024',
    hours_per_week: 12,
    weeks_per_year: 36,
    description_original: `The first day I rolled [Name's] wheelchair around school, people stared and whispered about him. Classmates even smirked, "This will definitely grant you an A in [] class." Dumbstruck by the lack of empathy around me, I picked my jaw up off the ground and replied, "[Name] isn't some charity project for his incurable cancer. He is my friend."

In my little bubble we call "high school", my community is caught up in the stigma that we'll only succeed when we achieve a 4.0 GPA or be the 'first person to cure cancer.' However, in reality, the stress that eats us up pales in comparison to the bacterium consuming [Name's] brain. Although his time is limited, he isn't dying. He's living. [Name's] optimistic outlook gave me a reality check and reminded my peers and me to stop from worrying about "straight-A's" and start caring about people around us.

Weeks following, I hosted a [Cancer] Awareness Week to help my peers to not only empathize with [Name], but also see life through his eyes. Through spending time with [Name], I've been inspired by his positive outlook. I wanted to show him that his school community would fight alongside him during his battle. As people began to put their priorities in perspective, hundreds of community members participated in the walkathons and school fundraisers that I hosted for him, raising $15,000 to ease his family's financial burden for his monthly treatments.

Today, as we walk down the halls together, classmates still stare–they stare with admiration as they give [Name] a warm "What's up!" Through my friendship with [Name], both my community and I understand the lesson which most adults only realize at the end of their lives: The shortsightedness in the mindless race to superficial success are meaningless without taking the time to genuinely cherish our relationships.`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  {
    id: 'ucb-cell-tower-2029',
    user_id: 'test-user',
    title: 'Political Advocate - Cell Tower Fight',
    category: 'advocacy',
    time_span: 'March 2024 (48 hours)',
    hours_per_week: 40,
    weeks_per_year: 2,
    description_original: `Upon returning from my AP Government field trip Washington D.C., my conversation with Congressional leaders on Capitol Hill echoed in my head. I felt inspired by their platform of promoting the common good and refusing lobbying from large corporations. Although I may not be a politician, I was inspired to believe that I could still make a difference in my local community.

Driving up to my front door, I found a letter taped on my front door in bold letters: "VERIZON'S CELLULAR TOWER INSTALLATION". "Who-the-what-now!?" I exclaimed as I found that 5 houses had received same notice. After researching the effects of cellular towers, I found that close vicinity to one would put my family at a high risk of cancer.

Within the next 48-hours before the tower's approval at City Hall, I rallied everyone and their grandmas to be proactive for the sake of their health. Although learning about public policy was enthralling, actually applying it to the real world seemed like a distant idea—one that only my Congresspeople could do. However, I began realizing that anyone could make in impact leveraging determination and the help of one's community.

Upon arrival to the city council meeting, I was shocked to see the room overflowed with 350+ people with banners—my teachers, principals, and friends came to show their support! Neighbors who once bickered over whose dog urinated on whose side of the lawn put their differences aside for the common interest of their community.

As I walked up to the podium to present the case, I thought about Hobbes's natural rights philosophies. Through these civic concepts, I truly understood that our free will determines our self-governed society. The power of public policy lies in the hands of the people. With an army of people behind me, I could see that they too, understood that politicians may have high statuses to make a change. However, a community setting their differences aside for one common goal is much stronger than one politician. I realized it only takes the power of one—one person, one action, one community—that makes all the difference.`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  // =========================================================================
  // TIER 2: TOP UC / IVY-COMPETITIVE
  // =========================================================================

  {
    id: 'model-un-secretary-general',
    user_id: 'test-user',
    title: 'Model United Nations Secretary General',
    category: 'academic',
    time_span: 'September 2022 – June 2024',
    hours_per_week: 10,
    weeks_per_year: 36,
    description_original: `As Secretary General, I organized committees and led the team to over 15 conferences within two years. I was the recipient of awards at 90% of the conferences attended, including Outstanding Delegate and Best Delegate awards. Additionally, the club as a whole won an award of distinction for our research and preparation at NHSMUN. I also spearheaded fundraising initiatives that raised over $7,000 for the American Red Cross during my senior year.`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  {
    id: 'chemistry-society-president',
    user_id: 'test-user',
    title: 'Applied Chemistry Society President',
    category: 'academic',
    time_span: 'September 2023 – June 2025',
    hours_per_week: 8,
    weeks_per_year: 36,
    description_original: `Set meeting agendas, planned the year's activities, directed chemistry experiments researching pollutants in freshwater sources, and raised $5,000 through community sponsorship. Coordinated with school leaders and the fire department for safety during experiment demonstrations held before 500 students in the Junior and Senior classes.`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  {
    id: 'special-needs-charity-founder',
    user_id: 'test-user',
    title: 'Special Needs Charity Founder & Executive Director',
    category: 'service',
    time_span: 'January 2022 – Present',
    hours_per_week: 15,
    weeks_per_year: 48,
    description_original: `Set up chapters in seven countries, led inclusion campaigns, and published articles. Raised $50,000+ in funding and directly impacted 2,000+ individuals with disabilities through programming. Organized quarterly workshops training volunteers on disability awareness and inclusive practices. Partnered with local schools to implement accessibility improvements benefiting over 5,000 students.`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  {
    id: 'neuroscience-society-founder',
    user_id: 'test-user',
    title: 'Neuroscience Society Founder',
    category: 'academic',
    time_span: 'September 2023 – Present',
    hours_per_week: 6,
    weeks_per_year: 36,
    description_original: `Founded and led the society, organizing weekly workshops, recruiting members, and shadowing a clinical neurologist. Authored a 50-page physics study guide reaching over 3,000 downloads. Coordinated speaker series bringing neuroscience professors to present research to high school students interested in cognitive science and medical careers.`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Mapping of IDs to expected tier
export const EXPECTED_TIERS: Record<string, 1 | 2 | 3 | 4> = {
  'harvard-mites-2029': 1,
  'ucla-cancer-awareness-2029': 1,
  'ucb-cell-tower-2029': 1,
  'model-un-secretary-general': 2,
  'chemistry-society-president': 2,
  'special-needs-charity-founder': 2,
  'neuroscience-society-founder': 2,
};

// Expected elite pattern scores (for validation)
export const EXPECTED_PATTERN_SCORES = {
  'harvard-mites-2029': {
    tier: 1,
    minScore: 75,
    shouldHaveVulnerability: true,
    shouldHavePhilosophicalInsight: true,
  },
  'ucla-cancer-awareness-2029': {
    tier: 1,
    minScore: 80,
    shouldHaveDialogue: true,
    shouldHaveCommunityTransformation: true,
  },
  'ucb-cell-tower-2029': {
    tier: 1,
    minScore: 80,
    shouldHaveDialogue: true,
    shouldHaveQuantifiedImpact: true,
    shouldHavePhilosophicalInsight: true,
  },
  'model-un-secretary-general': {
    tier: 2,
    minScore: 60,
    shouldHaveQuantifiedImpact: true,
  },
  'chemistry-society-president': {
    tier: 2,
    minScore: 60,
    shouldHaveQuantifiedImpact: true,
  },
};
