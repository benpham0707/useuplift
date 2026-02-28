/**
 * Exemplar Library — Pre-built Activity Description Examples by Domain & Tier
 *
 * Provides curated exemplar descriptions for teaching prompt injection.
 * Instead of asking the LLM to generate examples (which produces generic,
 * template-sounding output), we inject real-world-quality exemplars that
 * demonstrate specific writing techniques at each tier level.
 *
 * Each exemplar:
 * - Is 150 characters or fewer
 * - Opens with a student-owned verb/discovery (never "Assisted with")
 * - Includes at least one specific/quantifiable detail
 * - Ends with verifiable external validation when possible
 * - Sounds like a real high school student (authentic voice)
 *
 * Tier system:
 * - Tier 1 (Pinnacle) 9.0-10.0: IMO/IOI team, ISEF Grand Award, published in Nature
 * - Tier 2 (National) 7.0-8.9: USAMO, Regeneron finalist, nationally published
 * - Tier 3 (State/Regional) 5.5-6.9: State champion, founded org 100+ members
 * - Tier 4 (School Leader) 4.0-5.4: Club president, team captain, school impact
 * - Tier 5 (Participant) 2.5-3.9: Regular member 2+ years, consistent involvement
 * - Tier 6 (Developing) 1.0-2.4: Passive membership, resume padding
 *
 * Cost: $0.00 (pure data, no LLM calls)
 * Integration: Teaching prompts, expert system prompts, score projection
 */

import type { Exemplar } from './types';

// ============================================================================
// STEM RESEARCH EXEMPLARS
// ============================================================================

const STEM_RESEARCH_EXEMPLARS: Exemplar[] = [
  // Tier 1 — Pinnacle
  {
    domainId: 'stem_research',
    tier: 1,
    description:
      'Discovered high-entropy alloy phase with 40% improved fracture toughness; published in Nature Materials as co-first author',
    whyItWorks:
      'Opens with student-owned discovery, quantifies the breakthrough, names the highest-impact journal with verifiable authorship',
    techniques: ['student_owned_discovery', 'quantified_breakthrough', 'top_journal_validation'],
  },
  {
    domainId: 'stem_research',
    tier: 1,
    description:
      'Identified novel CRISPR off-target mechanism in cardiac cells; ISEF Grand Award, 2 patents pending',
    whyItWorks:
      'Student-generated finding in a specific tissue type, dual external validation (ISEF + patents) proves impact beyond the lab',
    techniques: ['student_owned_discovery', 'specific_organism', 'dual_external_validation'],
  },
  // Tier 2 — National
  {
    domainId: 'stem_research',
    tier: 2,
    description:
      'Identified novel gene expression pattern in zebrafish retinal cells; presenting findings at AACR 2025',
    whyItWorks:
      'Opens with student-owned discovery, names specific organism and tissue, ends with verifiable conference presentation',
    techniques: ['student_owned_discovery', 'specific_organism', 'external_validation'],
  },
  {
    domainId: 'stem_research',
    tier: 2,
    description:
      'Developed computational model predicting antibiotic resistance in E. coli with 91% accuracy; Regeneron STS semifinalist',
    whyItWorks:
      'Quantifies predictive accuracy, specifies organism, closes with nationally recognized competition placement',
    techniques: ['quantified_accuracy', 'specific_organism', 'national_competition_validation'],
  },
  // Tier 3 — State/Regional
  {
    domainId: 'stem_research',
    tier: 3,
    description:
      'Analyzed 2,400 water samples across 18 months to map nitrate contamination in local watershed; county report adopted findings',
    whyItWorks:
      'Quantifies scope and duration, shows sustained commitment, ends with real-world policy adoption',
    techniques: ['quantified_scope', 'duration_commitment', 'policy_adoption'],
  },
  {
    domainId: 'stem_research',
    tier: 3,
    description:
      'Designed PCR assay detecting invasive species DNA in river sediment; presented at state science symposium',
    whyItWorks:
      'Student designed the method (not just ran it), specifies ecological application, regional validation',
    techniques: ['student_designed_method', 'ecological_application', 'regional_validation'],
  },
  // Tier 4 — School Leader
  {
    domainId: 'stem_research',
    tier: 4,
    description:
      'Tested 6 soil amendments on tomato growth over 14 weeks; data selected for school science journal publication',
    whyItWorks:
      'Specific experimental design with quantified variables, shows patience through duration, school-level recognition',
    techniques: ['quantified_variables', 'duration_commitment', 'school_publication'],
  },
  // Tier 5 — Participant
  {
    domainId: 'stem_research',
    tier: 5,
    description:
      'Cataloged 300+ butterfly specimens over 2 summers for university ecology lab; trained 4 new volunteers on ID protocols',
    whyItWorks:
      'Quantifies contribution and duration, shows progression from participant to trainer, specific and honest about role',
    techniques: ['quantified_contribution', 'role_progression', 'honest_scope'],
  },
  // Tier 6 — Developing
  {
    domainId: 'stem_research',
    tier: 6,
    description:
      'Observed lab procedures in university chemistry department for one semester; learned titration and spectrophotometry basics',
    whyItWorks:
      'Honest about observational role, specifies what was learned, does not overclaim ownership of research',
    techniques: ['honest_role_description', 'specific_learning', 'no_overclaiming'],
  },
];

// ============================================================================
// CODING & ENGINEERING EXEMPLARS
// ============================================================================

const CODING_ENGINEERING_EXEMPLARS: Exemplar[] = [
  // Tier 1 — Pinnacle
  {
    domainId: 'coding_engineering',
    tier: 1,
    description:
      'Created open-source screen reader used by 15,000+ visually impaired users; merged 47 PRs into Chromium accessibility core',
    whyItWorks:
      'Massive user impact with specific count, contribution to a globally recognized codebase proves elite-level ability',
    techniques: ['user_impact_scale', 'open_source_contribution', 'verifiable_metrics'],
  },
  // Tier 2 — National
  {
    domainId: 'coding_engineering',
    tier: 2,
    description:
      'Built diagnostic app matching rural patients to specialists; deployed in 8 clinics across 3 states, 4,200 consultations logged',
    whyItWorks:
      'Problem-first framing, multi-state deployment proves real adoption, specific consultation count is verifiable',
    techniques: ['problem_first_framing', 'deployment_scale', 'verifiable_usage_metrics'],
  },
  {
    domainId: 'coding_engineering',
    tier: 2,
    description:
      'Engineered low-cost water quality sensor ($12/unit) deployed in 23 villages; data shared with WHO regional office',
    whyItWorks:
      'Cost innovation is quantified, deployment scale is specific, WHO connection provides external validation',
    techniques: ['cost_innovation', 'deployment_scale', 'institutional_validation'],
  },
  // Tier 3 — State/Regional
  {
    domainId: 'coding_engineering',
    tier: 3,
    description:
      'Built accessibility app used by 200+ visually impaired students across 3 school districts',
    whyItWorks:
      'Leads with action verb, specifies user impact and scale, demonstrates real-world deployment beyond personal project',
    techniques: ['action_verb_lead', 'user_impact', 'deployment_scale'],
  },
  {
    domainId: 'coding_engineering',
    tier: 3,
    description:
      'Developed scheduling tool that reduced teacher planning time by 5 hrs/week; adopted by 14 teachers at 2 schools',
    whyItWorks:
      'Quantifies time saved per user, specific adoption numbers, solves a real problem for identifiable people',
    techniques: ['quantified_time_savings', 'adoption_metrics', 'real_problem_solving'],
  },
  // Tier 4 — School Leader
  {
    domainId: 'coding_engineering',
    tier: 4,
    description:
      'Created lost-and-found app for school; 380 students registered, reunited 95 items in first semester',
    whyItWorks:
      'Solves a tangible school problem, quantifies both user base and measurable outcomes',
    techniques: ['tangible_problem', 'user_registration_count', 'outcome_metrics'],
  },
  {
    domainId: 'coding_engineering',
    tier: 4,
    description:
      'Built robotics team scouting system tracking 120 match variables; used by team at 6 regional competitions',
    whyItWorks:
      'Specific technical scope (120 variables), clear adoption context, demonstrates sustained utility',
    techniques: ['technical_scope', 'competition_context', 'sustained_utility'],
  },
  // Tier 5 — Participant
  {
    domainId: 'coding_engineering',
    tier: 5,
    description:
      'Maintained club website for 2 years; redesigned event page after surveying 60 students on navigation pain points',
    whyItWorks:
      'Shows sustained commitment, user research demonstrates initiative beyond basic maintenance',
    techniques: ['sustained_commitment', 'user_research', 'initiative_beyond_role'],
  },
  // Tier 6 — Developing
  {
    domainId: 'coding_engineering',
    tier: 6,
    description:
      'Completed 3 online courses in web development; built personal portfolio site showcasing class projects',
    whyItWorks:
      'Honest about learning stage, quantifies courses, shows application of skills without overclaiming impact',
    techniques: ['honest_learning_stage', 'quantified_courses', 'no_overclaiming'],
  },
];

// ============================================================================
// COMMUNITY SERVICE EXEMPLARS
// ============================================================================

const COMMUNITY_SERVICE_EXEMPLARS: Exemplar[] = [
  // Tier 1 — Pinnacle
  {
    domainId: 'community_service',
    tier: 1,
    description:
      'Founded refugee tutoring nonprofit serving 400 students across 12 cities; secured $180K in grants, 3 district partnerships',
    whyItWorks:
      'Multi-city scale with specific numbers, significant fundraising proves organizational maturity, institutional partnerships',
    techniques: ['multi_city_scale', 'fundraising_quantified', 'institutional_partnerships'],
  },
  // Tier 2 — National
  {
    domainId: 'community_service',
    tier: 2,
    description:
      'Launched free SAT prep program for low-income students; 230 participants, avg score increase of 140 points across 2 years',
    whyItWorks:
      'Quantifies both reach and measurable outcome, duration shows sustained commitment, addresses equity gap',
    techniques: ['quantified_reach', 'measurable_outcome', 'equity_focus'],
  },
  {
    domainId: 'community_service',
    tier: 2,
    description:
      'Created mobile food pantry delivering to 85 homebound seniors weekly; recruited and trained 60 volunteer drivers',
    whyItWorks:
      'Identifies underserved population, quantifies weekly cadence and volunteer scale, shows systems thinking',
    techniques: ['underserved_population', 'operational_cadence', 'volunteer_scale'],
  },
  // Tier 3 — State/Regional
  {
    domainId: 'community_service',
    tier: 3,
    description:
      'Started school garden donating 600 lbs of produce to food bank annually; trained 25 students in sustainable agriculture',
    whyItWorks:
      'Quantifies tangible output and training impact, shows both creation and teaching dimensions',
    techniques: ['quantified_output', 'teaching_others', 'dual_impact_dimensions'],
  },
  {
    domainId: 'community_service',
    tier: 3,
    description:
      'Organized annual coat drive collecting 2,100 coats from 15 drop-off locations; partnered with Salvation Army for distribution',
    whyItWorks:
      'Specific collection numbers and logistics scale, named partnership adds credibility',
    techniques: ['quantified_collection', 'logistics_scale', 'named_partnership'],
  },
  // Tier 4 — School Leader
  {
    domainId: 'community_service',
    tier: 4,
    description:
      'Organized 12 food drives collecting 8,000 lbs; recruited 45 volunteers from 3 community orgs',
    whyItWorks:
      'Quantifies both output and organization, shows volunteer management skills across multiple organizations',
    techniques: ['quantified_output', 'volunteer_management', 'multi_org_coordination'],
  },
  {
    domainId: 'community_service',
    tier: 4,
    description:
      'Tutored 18 ESL students in English and math for 3 semesters; 14 improved one full grade level in reading',
    whyItWorks:
      'Specific student count and duration, quantified academic outcome proves effectiveness',
    techniques: ['specific_student_count', 'duration_commitment', 'measurable_academic_outcome'],
  },
  // Tier 5 — Participant
  {
    domainId: 'community_service',
    tier: 5,
    description:
      'Volunteered at animal shelter every Saturday for 18 months; socialized 40+ dogs to improve adoption readiness',
    whyItWorks:
      'Consistent schedule shows dedication, quantifies animals helped, specific task demonstrates real contribution',
    techniques: ['consistent_schedule', 'quantified_contribution', 'specific_task'],
  },
  // Tier 6 — Developing
  {
    domainId: 'community_service',
    tier: 6,
    description:
      'Participated in 3 beach cleanups and 2 park restoration days organized by school environmental club',
    whyItWorks:
      'Honest about event-based participation, quantifies involvement, does not overclaim leadership or sustained commitment',
    techniques: ['honest_participation_level', 'quantified_events', 'no_overclaiming'],
  },
];

// ============================================================================
// LEADERSHIP & GOVERNMENT EXEMPLARS
// ============================================================================

const LEADERSHIP_GOVERNMENT_EXEMPLARS: Exemplar[] = [
  // Tier 1 — Pinnacle
  {
    domainId: 'leadership_government',
    tier: 1,
    description:
      'Selected as US Senate Page; authored youth policy brief cited in Congressional testimony on education reform',
    whyItWorks:
      'Federal-level selection validates national standing, Congressional citation proves field-defining policy impact',
    techniques: ['federal_selection', 'policy_authorship', 'congressional_citation'],
  },
  // Tier 2 — National
  {
    domainId: 'leadership_government',
    tier: 2,
    description:
      'Won national YMCA Youth Governor election; led 500-delegate state assembly and presented platform to real governor',
    whyItWorks:
      'National competitive election, large-scale assembly leadership, direct engagement with elected officials',
    techniques: ['national_election', 'large_assembly_leadership', 'official_engagement'],
  },
  {
    domainId: 'leadership_government',
    tier: 2,
    description:
      'Founded statewide youth voter registration initiative; registered 3,400 students across 45 high schools before midterms',
    whyItWorks:
      'Statewide scale with precise numbers, time-anchored to real event, addresses civic participation gap',
    techniques: ['statewide_scale', 'precise_registration_count', 'civic_impact'],
  },
  // Tier 3 — State/Regional
  {
    domainId: 'leadership_government',
    tier: 3,
    description:
      'Authored student mental health policy adopted by school board; led coalition of 8 schools advocating for counselor funding',
    whyItWorks:
      'Policy authorship with institutional adoption, multi-school coalition shows strong organizational reach',
    techniques: ['policy_authorship', 'institutional_adoption', 'coalition_building'],
  },
  {
    domainId: 'leadership_government',
    tier: 3,
    description:
      'Led Model UN delegation of 22 to win Best Large Delegation at regional conference; mentored 8 first-time delegates',
    whyItWorks:
      'Specific team size, verifiable award, mentoring dimension shows leadership beyond personal achievement',
    techniques: ['team_size', 'verifiable_award', 'mentoring_dimension'],
  },
  {
    domainId: 'leadership_government',
    tier: 3,
    description:
      'Proposed and passed student-led recycling program reducing school waste by 30%; presented data to school board',
    whyItWorks:
      'Shows full initiative cycle from proposal to measurement, quantified environmental outcome',
    techniques: ['full_initiative_cycle', 'quantified_outcome', 'board_presentation'],
  },
  // Tier 4 — School Leader
  {
    domainId: 'leadership_government',
    tier: 4,
    description:
      'Elected student body president; negotiated $15K budget increase for arts programs, organized 3 town halls with 200+ attendees',
    whyItWorks:
      'Specific budget outcome demonstrates real power exercised, town hall attendance quantifies community engagement',
    techniques: ['budget_outcome', 'community_engagement_scale', 'elected_mandate'],
  },
  {
    domainId: 'leadership_government',
    tier: 4,
    description:
      'Served as junior class treasurer; managed $8,500 prom budget, saved $1,200 by negotiating vendor contracts',
    whyItWorks:
      'Specific financial responsibility, quantified savings show concrete skill application',
    techniques: ['financial_responsibility', 'quantified_savings', 'negotiation_skill'],
  },
  {
    domainId: 'leadership_government',
    tier: 4,
    description:
      'Chaired school diversity committee; organized 4 cultural events attended by 500+ students over the year',
    whyItWorks:
      'Specific committee with clear scope, quantified event output and attendance',
    techniques: ['committee_leadership', 'event_series', 'attendance_metrics'],
  },
  // Tier 5 — Participant
  {
    domainId: 'leadership_government',
    tier: 5,
    description:
      'Attended 30+ student council meetings over 2 years; contributed to homecoming and spirit week planning committees',
    whyItWorks:
      'Quantifies consistent attendance and duration, honest about contributor (not leader) role',
    techniques: ['consistent_attendance', 'duration_commitment', 'honest_role_description'],
  },
  // Tier 6 — Developing
  {
    domainId: 'leadership_government',
    tier: 6,
    description:
      'Joined student council as freshman representative; attended monthly meetings and helped set up 2 school events',
    whyItWorks:
      'Honest about entry-level role, specifies cadence and tangible contributions without overclaiming',
    techniques: ['honest_entry_level', 'meeting_cadence', 'tangible_contributions'],
  },
];

// ============================================================================
// ATHLETICS EXEMPLARS
// ============================================================================

const ATHLETICS_EXEMPLARS: Exemplar[] = [
  // Tier 1 — Pinnacle
  {
    domainId: 'athletics',
    tier: 1,
    description:
      'Ranked #3 nationally in 400m hurdles; trained 6 days/week for 4 years while maintaining 3.9 GPA',
    whyItWorks:
      'Verifiable national ranking, quantifies training intensity and duration, academic balance demonstrates character',
    techniques: ['national_ranking', 'training_intensity', 'academic_balance'],
  },
  // Tier 2 — National
  {
    domainId: 'athletics',
    tier: 2,
    description:
      'Earned All-State selection in swimming 2 consecutive years; dropped 4.2 seconds in 200 IM through off-season training',
    whyItWorks:
      'Verifiable honor with duration, specific time improvement shows measurable growth and dedication',
    techniques: ['verifiable_honor', 'measurable_improvement', 'training_dedication'],
  },
  {
    domainId: 'athletics',
    tier: 2,
    description:
      'Captained soccer team to first state semifinal in school history; mentored 6 JV players promoted to varsity',
    whyItWorks:
      'Historic team achievement tied to leadership, mentoring quantified with specific promotion outcomes',
    techniques: ['historic_team_achievement', 'captain_leadership', 'mentoring_outcomes'],
  },
  // Tier 3 — State/Regional
  {
    domainId: 'athletics',
    tier: 3,
    description:
      'Won conference championship in high jump with PR of 6\'2"; organized summer clinics for 20 middle school athletes',
    whyItWorks:
      'Specific measurable performance, conference-level validation, community coaching shows character beyond competition',
    techniques: ['specific_performance', 'conference_validation', 'community_coaching'],
  },
  {
    domainId: 'athletics',
    tier: 3,
    description:
      'Led cross-country team as captain; improved team average 5K time by 1:45 through restructured practice plan',
    whyItWorks:
      'Quantifies team-level improvement (not just personal), shows strategic thinking through practice redesign',
    techniques: ['team_improvement', 'strategic_leadership', 'quantified_time_improvement'],
  },
  // Tier 4 — School Leader
  {
    domainId: 'athletics',
    tier: 4,
    description:
      'Started as JV benchwarmer, earned varsity starting position by senior year; never missed a practice in 3 seasons',
    whyItWorks:
      'Growth narrative from bottom to starter, consistency metric (zero missed practices) shows character',
    techniques: ['growth_narrative', 'perseverance', 'consistency_metric'],
  },
  {
    domainId: 'athletics',
    tier: 4,
    description:
      'Played varsity basketball 3 years; organized pickup league for 35 students who did not make school teams',
    whyItWorks:
      'Sustained varsity commitment, initiative to include non-team athletes shows leadership and empathy',
    techniques: ['sustained_commitment', 'inclusive_initiative', 'community_building'],
  },
  // Tier 5 — Participant
  {
    domainId: 'athletics',
    tier: 5,
    description:
      'Competed on JV tennis team for 2 seasons; improved from 0-8 record to 5-3 through daily practice after school',
    whyItWorks:
      'Honest about starting level, specific improvement arc, daily practice shows work ethic',
    techniques: ['honest_starting_point', 'specific_improvement_arc', 'work_ethic'],
  },
  // Tier 6 — Developing
  {
    domainId: 'athletics',
    tier: 6,
    description:
      'Joined intramural volleyball for 2 semesters; learned basic rotations and team coordination',
    whyItWorks:
      'Honest about recreational level, specifies what was learned, does not inflate intramural to competitive',
    techniques: ['honest_level_description', 'specific_learning', 'no_inflation'],
  },
];

// ============================================================================
// PERFORMING ARTS EXEMPLARS
// ============================================================================

const PERFORMING_ARTS_EXEMPLARS: Exemplar[] = [
  // Tier 1 — Pinnacle
  {
    domainId: 'performing_arts',
    tier: 1,
    description:
      'Composed orchestral piece premiered by state youth symphony; selected for national YoungArts finalist, 1 of 60 in music',
    whyItWorks:
      'Original composition premiered by established ensemble, nationally competitive selection with specific numbers',
    techniques: ['original_composition', 'ensemble_premiere', 'national_selection'],
  },
  // Tier 2 — National
  {
    domainId: 'performing_arts',
    tier: 2,
    description:
      'Performed lead in 5 school and community productions over 3 years; accepted to Interlochen summer program',
    whyItWorks:
      'Quantifies roles and duration, mix of school and community shows breadth, elite program acceptance validates talent',
    techniques: ['quantified_roles', 'multi_venue_breadth', 'elite_program_validation'],
  },
  {
    domainId: 'performing_arts',
    tier: 2,
    description:
      'First chair violin in all-state orchestra 2 years; organized 8 free community concerts reaching 1,500+ audience members',
    whyItWorks:
      'Verifiable all-state position with duration, community concerts quantify outreach and initiative beyond performance',
    techniques: ['all_state_position', 'community_outreach', 'audience_reach'],
  },
  // Tier 3 — State/Regional
  {
    domainId: 'performing_arts',
    tier: 3,
    description:
      'Choreographed original dance piece performed at 3 regional festivals; taught weekly classes to 15 beginners for a year',
    whyItWorks:
      'Original creative work with regional exposure, sustained teaching commitment quantified with student count',
    techniques: ['original_creative_work', 'regional_exposure', 'sustained_teaching'],
  },
  {
    domainId: 'performing_arts',
    tier: 3,
    description:
      'Directed one-act play that advanced to state competition; managed cast of 12 and crew of 8 on $400 budget',
    whyItWorks:
      'Directing role shows leadership beyond performance, state-level competition, budget constraint shows resourcefulness',
    techniques: ['directing_leadership', 'state_competition', 'budget_management'],
  },
  // Tier 4 — School Leader
  {
    domainId: 'performing_arts',
    tier: 4,
    description:
      'Section leader of marching band for 2 seasons; arranged 3 halftime medleys performed at 10 football games',
    whyItWorks:
      'Leadership role with duration, arranging shows creative skill, specific performance count demonstrates output',
    techniques: ['section_leadership', 'creative_arrangement', 'performance_count'],
  },
  // Tier 5 — Participant
  {
    domainId: 'performing_arts',
    tier: 5,
    description:
      'Played in school jazz band for 3 years; practiced 5 hours/week and performed at 12 school and community events',
    whyItWorks:
      'Sustained commitment with practice quantified, honest about ensemble member role with specific performance count',
    techniques: ['sustained_commitment', 'practice_quantified', 'performance_count'],
  },
  // Tier 6 — Developing
  {
    domainId: 'performing_arts',
    tier: 6,
    description:
      'Joined school choir sophomore year; performed in 2 seasonal concerts and learned sight-reading fundamentals',
    whyItWorks:
      'Honest about entry-level involvement, specifies concerts and skill development without overclaiming',
    techniques: ['honest_entry_level', 'specific_events', 'skill_development'],
  },
];

// ============================================================================
// WORK & EMPLOYMENT EXEMPLARS
// ============================================================================

const WORK_EMPLOYMENT_EXEMPLARS: Exemplar[] = [
  // Tier 1 — Pinnacle
  {
    domainId: 'work_employment',
    tier: 1,
    description:
      'Founded ed-tech startup at 16 generating $500K ARR; product featured in TechCrunch, acquired by Fortune 500 company',
    whyItWorks:
      'Revenue scale and media coverage prove field-defining impact, acquisition validates product at industry level',
    techniques: ['startup_founding', 'national_media_coverage', 'industry_acquisition'],
  },
  // Tier 2 — National
  {
    domainId: 'work_employment',
    tier: 2,
    description:
      'Selected for Google STEP internship (2% acceptance); designed feature shipped to 10M+ users, cited in quarterly review',
    whyItWorks:
      'Elite program selectivity with acceptance rate, user-scale impact quantified, corporate-level recognition',
    techniques: ['elite_program_selectivity', 'user_scale_impact', 'corporate_recognition'],
  },
  {
    domainId: 'work_employment',
    tier: 2,
    description:
      'Managed 8-person team at family restaurant while parents recovered from illness; maintained revenue during 6-month period',
    whyItWorks:
      'Demonstrates extraordinary responsibility, specific team size and duration, revenue maintenance proves competence',
    techniques: ['extraordinary_responsibility', 'team_management', 'business_continuity'],
  },
  // Tier 3 — State/Regional
  {
    domainId: 'work_employment',
    tier: 3,
    description:
      'Promoted to shift manager at 16; reduced food waste 35% by redesigning inventory system, saving store $22K annually',
    whyItWorks:
      'Early promotion shows strong ability, quantified business impact with dollar savings, system-level thinking',
    techniques: ['early_promotion', 'quantified_business_impact', 'system_redesign'],
  },
  {
    domainId: 'work_employment',
    tier: 3,
    description:
      'Interned at biotech startup; built customer onboarding flow that increased trial-to-paid conversion by 18%',
    whyItWorks:
      'Specific business metric improvement, shows direct contribution to company growth, verifiable outcome',
    techniques: ['specific_metric_improvement', 'business_contribution', 'verifiable_outcome'],
  },
  {
    domainId: 'work_employment',
    tier: 3,
    description:
      'Trained 12 new hires at retail job over 18 months; created training checklist adopted across 4 store locations',
    whyItWorks:
      'Shows progression from worker to trainer, quantifies trainees and duration, system adopted beyond original store',
    techniques: ['role_progression', 'quantified_trainees', 'system_adoption'],
  },
  {
    domainId: 'work_employment',
    tier: 3,
    description:
      'Worked 20 hrs/week as veterinary assistant for 2 years; independently managed intake for 15+ animals daily',
    whyItWorks:
      'Quantifies time commitment and duration, independent responsibility shows trust earned, daily volume is specific',
    techniques: ['time_commitment', 'independent_responsibility', 'daily_volume'],
  },
  // Tier 4 — School Leader
  {
    domainId: 'work_employment',
    tier: 4,
    description:
      'Worked as lifeguard 3 summers; earned advanced certification, trained 6 junior guards in water rescue techniques',
    whyItWorks:
      'Duration shows return commitment, certification progression, training others demonstrates growth beyond base role',
    techniques: ['return_commitment', 'certification_progression', 'peer_training'],
  },
  {
    domainId: 'work_employment',
    tier: 4,
    description:
      'Tutored 22 students in math and science at learning center; 85% improved by at least one letter grade',
    whyItWorks:
      'Specific student count, measurable academic outcome with percentage, demonstrates teaching effectiveness',
    techniques: ['specific_student_count', 'measurable_outcome_percentage', 'teaching_effectiveness'],
  },
  // Tier 5 — Participant
  {
    domainId: 'work_employment',
    tier: 5,
    description:
      'Worked as cashier at grocery store 15 hrs/week for a year; handled $3K+ in daily transactions accurately',
    whyItWorks:
      'Honest about role, quantifies time commitment, daily transaction volume shows reliability and trust',
    techniques: ['honest_role', 'time_commitment', 'reliability_metric'],
  },
  // Tier 6 — Developing
  {
    domainId: 'work_employment',
    tier: 6,
    description:
      'Helped at family business on weekends during busy season; assisted with customer service and stocking shelves',
    whyItWorks:
      'Honest about informal and seasonal nature, specifies tasks without overclaiming formal employment',
    techniques: ['honest_informal_role', 'specific_tasks', 'no_overclaiming'],
  },
];

// ============================================================================
// STEM COMPETITION EXEMPLARS
// ============================================================================

const STEM_COMPETITION_EXEMPLARS: Exemplar[] = [
  // Tier 1 — Pinnacle
  {
    domainId: 'stem_competition',
    tier: 1,
    description:
      'Earned gold medal at International Physics Olympiad; solved 3 novel problems in theoretical mechanics section',
    whyItWorks:
      'Highest-tier international competition with specific medal, naming the section shows genuine engagement with content',
    techniques: ['international_medal', 'specific_section', 'problem_solving_detail'],
  },
  // Tier 2 — National
  {
    domainId: 'stem_competition',
    tier: 2,
    description:
      'Qualified for USAMO after scoring top 0.5% on AMC 12; spent 800+ hours over 3 years training in combinatorics',
    whyItWorks:
      'Verifiable qualification with specific percentile, quantified training commitment, names specific math area',
    techniques: ['verifiable_qualification', 'training_hours', 'specific_subject_area'],
  },
  // Tier 3 — State/Regional
  {
    domainId: 'stem_competition',
    tier: 3,
    description:
      'Placed 2nd at state Science Olympiad in forensics; built practice lab with $200 budget to train 5 teammates',
    whyItWorks:
      'Specific event and placement, resourcefulness with budget constraint, team training shows leadership',
    techniques: ['specific_placement', 'budget_resourcefulness', 'teammate_training'],
  },
  // Tier 4 — School Leader
  {
    domainId: 'stem_competition',
    tier: 4,
    description:
      'Captain of Science Bowl team for 2 years; organized weekly practices and led team to regional quarterfinals',
    whyItWorks:
      'Leadership role with duration, shows organizational effort, specific competitive outcome',
    techniques: ['captain_leadership', 'practice_organization', 'competitive_outcome'],
  },
  // Tier 5 — Participant
  {
    domainId: 'stem_competition',
    tier: 5,
    description:
      'Competed in Math League for 3 years; improved individual ranking from 40th to 12th in conference over that span',
    whyItWorks:
      'Duration shows persistence, specific ranking improvement arc demonstrates growth trajectory',
    techniques: ['sustained_participation', 'specific_improvement_arc', 'growth_trajectory'],
  },
  // Tier 6 — Developing
  {
    domainId: 'stem_competition',
    tier: 6,
    description:
      'Participated in school math competition club as sophomore; attended weekly practice sessions for one semester',
    whyItWorks:
      'Honest about entry-level participation, specifies cadence and duration without overclaiming awards',
    techniques: ['honest_entry_level', 'practice_cadence', 'no_overclaiming'],
  },
];

// ============================================================================
// DEBATE & SPEECH EXEMPLARS
// ============================================================================

const DEBATE_SPEECH_EXEMPLARS: Exemplar[] = [
  // Tier 2 — National
  {
    domainId: 'debate_speech',
    tier: 2,
    description:
      'Reached semifinals at National Speech & Debate Tournament in original oratory; ranked top 20 nationally in event',
    whyItWorks:
      'Highest-level competition with specific round reached, national ranking is verifiable',
    techniques: ['national_tournament_depth', 'specific_event', 'verifiable_ranking'],
  },
  // Tier 3 — State/Regional
  {
    domainId: 'debate_speech',
    tier: 3,
    description:
      'Won state qualifier in Lincoln-Douglas debate; researched 40+ sources per topic across 8 tournament rounds',
    whyItWorks:
      'Specific debate format and state-level outcome, research quantification shows preparation depth',
    techniques: ['specific_format', 'state_qualification', 'research_depth_quantified'],
  },
  // Tier 4 — School Leader
  {
    domainId: 'debate_speech',
    tier: 4,
    description:
      'Captain of debate team; mentored 10 novices, 6 of whom qualified for their first invitational tournament',
    whyItWorks:
      'Mentoring quantified with specific outcomes for mentees, shows leadership through others\' success',
    techniques: ['mentoring_quantified', 'mentee_outcomes', 'leadership_through_others'],
  },
  // Tier 5 — Participant
  {
    domainId: 'debate_speech',
    tier: 5,
    description:
      'Competed in Public Forum debate at 12 tournaments over 2 years; improved speaker points avg from 26 to 28.5',
    whyItWorks:
      'Quantifies tournament participation and duration, specific metric improvement shows growth',
    techniques: ['tournament_count', 'duration_commitment', 'metric_improvement'],
  },
  // Tier 6 — Developing
  {
    domainId: 'debate_speech',
    tier: 6,
    description:
      'Joined speech club junior year; delivered 4 practice speeches and competed in 1 novice tournament',
    whyItWorks:
      'Honest about limited involvement, quantifies activities, does not overclaim competitive success',
    techniques: ['honest_limited_involvement', 'quantified_activities', 'no_overclaiming'],
  },
];

// ============================================================================
// ENTREPRENEURSHIP EXEMPLARS
// ============================================================================

const ENTREPRENEURSHIP_EXEMPLARS: Exemplar[] = [
  // Tier 2 — National
  {
    domainId: 'entrepreneurship',
    tier: 2,
    description:
      'Launched e-commerce business generating $45K revenue in first year; 2,800 customers across 38 states',
    whyItWorks:
      'Specific revenue and customer numbers, geographic reach is verifiable, shows real business operation',
    techniques: ['revenue_quantified', 'customer_count', 'geographic_reach'],
  },
  // Tier 3 — State/Regional
  {
    domainId: 'entrepreneurship',
    tier: 3,
    description:
      'Founded campus snack delivery service with 150 weekly orders; hired 4 classmates and donated 10% of profits to food bank',
    whyItWorks:
      'Quantifies demand and team size, donation shows character beyond profit motive',
    techniques: ['quantified_demand', 'team_hired', 'social_impact_integration'],
  },
  // Tier 4 — School Leader
  {
    domainId: 'entrepreneurship',
    tier: 4,
    description:
      'Started custom sticker business on Etsy; fulfilled 320 orders over 14 months with 4.9 star average review',
    whyItWorks:
      'Specific platform and order volume, duration shows sustained operation, review score proves quality',
    techniques: ['specific_platform', 'order_volume', 'quality_metric'],
  },
  // Tier 5 — Participant
  {
    domainId: 'entrepreneurship',
    tier: 5,
    description:
      'Sold handmade jewelry at 6 craft fairs over a year; earned $800 and learned pricing and inventory management',
    whyItWorks:
      'Honest about small-scale operation, quantifies events and revenue, names specific skills learned',
    techniques: ['honest_scale', 'revenue_quantified', 'specific_skills_learned'],
  },
  // Tier 6 — Developing
  {
    domainId: 'entrepreneurship',
    tier: 6,
    description:
      'Participated in DECA club for one year; completed a business plan project for regional competition',
    whyItWorks:
      'Honest about club-level participation, specifies deliverable without overclaiming business operation',
    techniques: ['honest_club_participation', 'specific_deliverable', 'no_overclaiming'],
  },
];

// ============================================================================
// ACADEMIC EXEMPLARS
// ============================================================================

const ACADEMIC_EXEMPLARS: Exemplar[] = [
  // Tier 2 — National
  {
    domainId: 'academic',
    tier: 2,
    description:
      'Published original historical research on local civil rights movement in peer-reviewed undergraduate journal',
    whyItWorks:
      'Original research with specific topic, peer-reviewed publication provides verifiable external validation',
    techniques: ['original_research', 'specific_topic', 'peer_reviewed_publication'],
  },
  // Tier 3 — State/Regional
  {
    domainId: 'academic',
    tier: 3,
    description:
      'Founded philosophy discussion group meeting weekly for 2 years; grew from 5 to 28 members, hosted 3 guest professors',
    whyItWorks:
      'Founded (not just joined), quantified growth trajectory, guest professors show external recognition',
    techniques: ['founded_initiative', 'growth_trajectory', 'external_guest_validation'],
  },
  // Tier 4 — School Leader
  {
    domainId: 'academic',
    tier: 4,
    description:
      'President of National Honor Society chapter; organized 6 peer tutoring sessions serving 80+ students per semester',
    whyItWorks:
      'Leadership role in recognized organization, quantified service output and reach',
    techniques: ['recognized_org_leadership', 'quantified_service', 'reach_metrics'],
  },
  // Tier 5 — Participant
  {
    domainId: 'academic',
    tier: 5,
    description:
      'Member of school book club for 3 years; read and discussed 36 books, led 4 group discussions on favorite selections',
    whyItWorks:
      'Sustained commitment quantified by books read, leading some discussions shows growing initiative',
    techniques: ['sustained_commitment', 'quantified_engagement', 'growing_initiative'],
  },
  // Tier 6 — Developing
  {
    domainId: 'academic',
    tier: 6,
    description:
      'Attended 5 after-school academic enrichment workshops on college readiness and study skills',
    whyItWorks:
      'Honest about workshop-level participation, quantifies attendance without overclaiming deeper engagement',
    techniques: ['honest_attendance', 'quantified_workshops', 'no_overclaiming'],
  },
];

// ============================================================================
// FAMILY RESPONSIBILITY EXEMPLARS
// ============================================================================

const FAMILY_RESPONSIBILITY_EXEMPLARS: Exemplar[] = [
  // Tier 2 — National (exceptional circumstance)
  {
    domainId: 'family_responsibility',
    tier: 2,
    description:
      'Managed household and cared for 3 younger siblings 30 hrs/week while parent underwent cancer treatment for 18 months',
    whyItWorks:
      'Quantifies extraordinary responsibility with time commitment, specific family circumstance, sustained duration',
    techniques: ['quantified_time_commitment', 'specific_circumstance', 'sustained_duration'],
  },
  // Tier 3 — State/Regional
  {
    domainId: 'family_responsibility',
    tier: 3,
    description:
      'Translated for non-English-speaking parents at 25+ medical, school, and legal appointments over 3 years',
    whyItWorks:
      'Quantifies appointments across diverse contexts, duration shows sustained family support, cultural bridge role',
    techniques: ['quantified_appointments', 'diverse_contexts', 'cultural_bridge_role'],
  },
  // Tier 4 — School Leader
  {
    domainId: 'family_responsibility',
    tier: 4,
    description:
      'Cooked dinner and helped 2 siblings with homework 5 nights/week for 2 years while parent worked evening shifts',
    whyItWorks:
      'Specific routine quantified with frequency and duration, shows consistent family commitment alongside school',
    techniques: ['routine_quantified', 'frequency_and_duration', 'consistent_commitment'],
  },
  // Tier 5 — Participant
  {
    domainId: 'family_responsibility',
    tier: 5,
    description:
      'Drove younger sibling to practices and appointments 3 times/week; managed family grocery shopping on weekends',
    whyItWorks:
      'Specific tasks with frequency, shows reliability and practical family contribution',
    techniques: ['specific_tasks', 'frequency_quantified', 'practical_contribution'],
  },
  // Tier 6 — Developing
  {
    domainId: 'family_responsibility',
    tier: 6,
    description:
      'Helped with household chores including laundry and dishes several times per week',
    whyItWorks:
      'Honest about common household contribution, does not inflate routine chores into extraordinary responsibility',
    techniques: ['honest_contribution', 'specific_chores', 'no_inflation'],
  },
];

// ============================================================================
// MEDICAL & HEALTH EXEMPLARS
// ============================================================================

const MEDICAL_HEALTH_EXEMPLARS: Exemplar[] = [
  // Tier 1 — Pinnacle
  {
    domainId: 'medical_health',
    tier: 1,
    description:
      'Co-first-author on clinical paper in JAMA Pediatrics; IRB-approved study on adolescent sleep influenced school start-time policy',
    whyItWorks:
      'First-author publication in top medical journal with named policy impact — physician-researcher level achievement',
    techniques: ['first_author_clinical_publication', 'named_journal', 'policy_impact'],
  },
  // Tier 2 — National
  {
    domainId: 'medical_health',
    tier: 2,
    description:
      'Founded free clinic serving 1,200 patients/year in underserved area; partnered with county health dept to sustain operations',
    whyItWorks:
      'Quantified sustained health impact, institutional partnership signals legitimacy, organizational scale is exceptional',
    techniques: ['founded_health_initiative', 'quantified_patients_served', 'institutional_partnership'],
  },
  {
    domainId: 'medical_health',
    tier: 2,
    description:
      'EMT for 2 years; responded to 150+ emergency calls including cardiac arrests. Trained 8 new EMTs as shift instructor',
    whyItWorks:
      'Sustained emergency service with specific call volume, cardiac arrests show severity, training role shows leadership',
    techniques: ['clinical_credential', 'quantified_calls', 'training_leadership'],
  },
  // Tier 3 — State/Regional
  {
    domainId: 'medical_health',
    tier: 3,
    description:
      'IRB-approved study on ER readmission patterns; analyzed 2,000 patient records, co-authored paper presented at state conference',
    whyItWorks:
      'IRB approval, specific dataset size, publication venue — verifiable clinical research with tangible output',
    techniques: ['irb_research', 'quantified_dataset', 'conference_presentation'],
  },
  {
    domainId: 'medical_health',
    tier: 3,
    description:
      'Led blood pressure screening at 6 community sites; detected 18 undiagnosed hypertension cases over 12 months',
    whyItWorks:
      'Student-led with specific sites, measurable health outcome (18 detections), sustained over full year',
    techniques: ['health_initiative_leadership', 'measurable_health_outcome', 'sustained_commitment'],
  },
  // Tier 4 — School Leader
  {
    domainId: 'medical_health',
    tier: 4,
    description:
      'Earned EMT-B certification; volunteered 200 hours on ambulance squad responding to medical emergencies in community',
    whyItWorks:
      'Verifiable credential requiring national exam, quantified service hours, active emergency response role',
    techniques: ['clinical_credential', 'quantified_hours', 'active_clinical_role'],
  },
  // Tier 5 — Participant
  {
    domainId: 'medical_health',
    tier: 5,
    description:
      'Volunteered 300 hours in hospital oncology ward; delivered meals, provided companionship, tracked patient comfort surveys',
    whyItWorks:
      'Specific department and tasks, quantified hours, survey tracking shows contribution beyond basic presence',
    techniques: ['specific_department', 'quantified_hours', 'data_tracking_contribution'],
  },
  // Tier 6 — Developing
  {
    domainId: 'medical_health',
    tier: 6,
    description:
      'Shadowed pediatrician for 40 hours over one summer; observed patient appointments and learned about primary care',
    whyItWorks:
      'Honest about passive observation role, specific specialty and duration, does not overclaim clinical participation',
    techniques: ['honest_shadowing', 'specific_specialty', 'no_overclaiming'],
  },
];

// ============================================================================
// ARTS & CREATIVE EXEMPLARS
// ============================================================================

const ARTS_CREATIVE_EXEMPLARS: Exemplar[] = [
  // Tier 1 — Pinnacle
  {
    domainId: 'arts_creative',
    tier: 1,
    description:
      'Scholastic Art Gold Portfolio winner; work exhibited at Carnegie Hall and acquired by Smithsonian for emerging artists collection',
    whyItWorks:
      'Highest national Scholastic honor, premier venues (Carnegie Hall, Smithsonian), institutional acquisition is permanent validation',
    techniques: ['national_top_award', 'premier_venue', 'institutional_acquisition'],
  },
  // Tier 2 — National
  {
    domainId: 'arts_creative',
    tier: 2,
    description:
      'Scholastic Art National Gold Medal in photography; American Visions nominee — exhibited in NYC gallery with 59 finalists',
    whyItWorks:
      'National medal from 300K submissions, American Visions is top ~60 nationally, gallery exhibition provides context',
    techniques: ['national_medal', 'american_visions', 'exhibition_context'],
  },
  {
    domainId: 'arts_creative',
    tier: 2,
    description:
      'Published short story in The Adroit Journal (3% acceptance); selected by guest editor from 4,000 submissions',
    whyItWorks:
      'Named literary journal with acceptance rate, guest editor adds prestige, submission volume contextualizes achievement',
    techniques: ['named_publication', 'acceptance_rate', 'selection_context'],
  },
  // Tier 3 — State/Regional
  {
    domainId: 'arts_creative',
    tier: 3,
    description:
      'Scholastic Art Gold Key in painting, NE region; portfolio accepted to RISD Pre-College from 2,800 applicants',
    whyItWorks:
      'Regional Gold Key is top 3-5% of submissions, RISD Pre-College acceptance with applicant pool provides calibration',
    techniques: ['regional_gold_key', 'portfolio_acceptance', 'applicant_pool_context'],
  },
  {
    domainId: 'arts_creative',
    tier: 3,
    description:
      'Completed 72,000-word novel through 5 revision cycles; won state young writers competition judged by published authors',
    whyItWorks:
      'Quantified novel completion shows discipline, revision cycles show process maturity, state-level win with named judges',
    techniques: ['completed_long_form_work', 'revision_process', 'state_level_recognition'],
  },
  // Tier 4 — School Leader
  {
    domainId: 'arts_creative',
    tier: 4,
    description:
      'Editor-in-chief of literary magazine; reviewed 400 submissions, selected 20. Won state press association award',
    whyItWorks:
      'Leadership with quantified editorial work, selectivity ratio shows curatorial judgment, state press recognition',
    techniques: ['editorial_leadership', 'quantified_submissions', 'state_press_recognition'],
  },
  // Tier 5 — Participant
  {
    domainId: 'arts_creative',
    tier: 5,
    description:
      'Built 25-piece charcoal portrait series over 2 years; exhibited at school gallery, submitted to Scholastic regional',
    whyItWorks:
      'Specific body of work quantified by pieces, medium, and duration; exhibition and submission show effort beyond hobby',
    techniques: ['quantified_body_of_work', 'sustained_practice', 'external_submission'],
  },
  // Tier 6 — Developing
  {
    domainId: 'arts_creative',
    tier: 6,
    description:
      'Member of school art club for one year; contributed 3 pieces to student art show and helped organize spring exhibition',
    whyItWorks:
      'Honest about club-level participation, quantifies contribution without overclaiming awards or recognition',
    techniques: ['honest_club_participation', 'quantified_contribution', 'no_overclaiming'],
  },
];

// ============================================================================
// EXEMPLAR LIBRARY (MAP)
// ============================================================================

/**
 * All exemplars organized by domain ID.
 * Keyed by domain ID for O(1) lookup.
 */
export const EXEMPLAR_LIBRARY: Map<string, Exemplar[]> = new Map([
  ['stem_research', STEM_RESEARCH_EXEMPLARS],
  ['stem_competition', STEM_COMPETITION_EXEMPLARS],
  ['coding_engineering', CODING_ENGINEERING_EXEMPLARS],
  ['debate_speech', DEBATE_SPEECH_EXEMPLARS],
  ['performing_arts', PERFORMING_ARTS_EXEMPLARS],
  ['athletics', ATHLETICS_EXEMPLARS],
  ['community_service', COMMUNITY_SERVICE_EXEMPLARS],
  ['entrepreneurship', ENTREPRENEURSHIP_EXEMPLARS],
  ['work_employment', WORK_EMPLOYMENT_EXEMPLARS],
  ['leadership_government', LEADERSHIP_GOVERNMENT_EXEMPLARS],
  ['academic', ACADEMIC_EXEMPLARS],
  ['family_responsibility', FAMILY_RESPONSIBILITY_EXEMPLARS],
  ['medical_health', MEDICAL_HEALTH_EXEMPLARS],
  ['arts_creative', ARTS_CREATIVE_EXEMPLARS],
]);

// ============================================================================
// LOOKUP FUNCTIONS
// ============================================================================

/**
 * Get all exemplars for a given domain, optionally filtered by tier.
 *
 * @param domainId - The domain ID to look up (e.g., 'stem_research', 'coding_engineering')
 * @param tier - Optional tier to filter by (1-6). If omitted, returns all tiers.
 * @returns Array of matching Exemplar objects, or empty array if domain not found
 */
export function getExemplarsForDomain(domainId: string, tier?: number): Exemplar[] {
  const exemplars = EXEMPLAR_LIBRARY.get(domainId);
  if (!exemplars) return [];

  if (tier !== undefined) {
    return exemplars.filter(e => e.tier === tier);
  }

  return exemplars;
}

/**
 * Get the closest exemplar to a specific tier for a domain.
 *
 * Exact tier match is preferred. If no exact match exists, finds the exemplar
 * with the smallest tier distance. When tied, prefers the higher-tier exemplar
 * (closer to pinnacle) since teaching prompts benefit from aspirational examples.
 *
 * @param domainId - The domain ID to look up
 * @param tier - The target tier (1-6)
 * @returns The best matching Exemplar, or undefined if domain not found
 */
export function getClosestExemplar(domainId: string, tier: number): Exemplar | undefined {
  const exemplars = EXEMPLAR_LIBRARY.get(domainId);
  if (!exemplars || exemplars.length === 0) return undefined;

  // Exact match first
  const exactMatch = exemplars.find(e => e.tier === tier);
  if (exactMatch) return exactMatch;

  // Find closest tier — prefer higher tier (lower number) when tied
  let closest: Exemplar | undefined;
  let smallestDistance = Infinity;

  for (const exemplar of exemplars) {
    const distance = Math.abs(exemplar.tier - tier);
    if (distance < smallestDistance || (distance === smallestDistance && exemplar.tier < (closest?.tier ?? Infinity))) {
      smallestDistance = distance;
      closest = exemplar;
    }
  }

  return closest;
}

/**
 * Format an exemplar for injection into a teaching/system prompt.
 *
 * Produces a compact, structured text block that gives the LLM both the
 * example description and the reasoning behind its effectiveness.
 *
 * @param exemplar - The Exemplar to format
 * @returns A formatted string suitable for prompt injection
 */
export function formatExemplarForPrompt(exemplar: Exemplar): string {
  const tierLabels: Record<number, string> = {
    1: 'Pinnacle (9.0-10.0)',
    2: 'National (7.0-8.9)',
    3: 'State/Regional (5.5-6.9)',
    4: 'School Leader (4.0-5.4)',
    5: 'Participant (2.5-3.9)',
    6: 'Developing (1.0-2.4)',
  };

  const tierLabel = tierLabels[exemplar.tier] ?? `Tier ${exemplar.tier}`;

  return [
    `[${tierLabel} Example]`,
    `"${exemplar.description}"`,
    `Why it works: ${exemplar.whyItWorks}`,
    `Techniques: ${exemplar.techniques.join(', ')}`,
  ].join('\n');
}
