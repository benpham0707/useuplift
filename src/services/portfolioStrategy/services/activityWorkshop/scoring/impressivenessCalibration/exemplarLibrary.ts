/**
 * Exemplar Library
 *
 * Pre-built activity descriptions for teaching and comparison.
 * Each exemplar is a real-sounding <=150 character description that demonstrates
 * excellence at a specific tier and in specific scoring dimensions.
 *
 * Used by the teaching stage to show students what strong descriptions look like
 * in their specific domain and at their target level.
 *
 * Cost: $0.00 (pure static data)
 */

import type { ExemplarDescription, ExemplarDimension, ImpressionLevel, InternalTier } from './types';

// ============================================================================
// EXEMPLAR LIBRARY — 150+ exemplars across 9 key domains
// ============================================================================

export const EXEMPLAR_LIBRARY: ExemplarDescription[] = [
  // ── stem_research (18 exemplars) ───────────────────────────────────────

  // baseline (tier 5-6)
  { id: 'sr-01', domainId: 'stem_research', level: 'baseline', text: 'Assisted biology teacher with lab setup and data entry for AP Biology experiments throughout junior year.', whyItWorks: 'Specifies the class, role, and duration — minimal but clear about what was actually done.', demonstratesDimensions: ['role_ownership'], targetTier: 5 },
  { id: 'sr-02', domainId: 'stem_research', level: 'baseline', text: 'Shadowed a chemistry professor at State University for 3 weeks, observing protein crystallography procedures.', whyItWorks: 'Names the institution, timeframe, and specific technique observed — honest about the limited scope.', demonstratesDimensions: ['action_precision'], targetTier: 6 },
  { id: 'sr-03', domainId: 'stem_research', level: 'baseline', text: 'Completed online MIT OpenCourseWare biology modules and summarized 12 research papers on gene expression.', whyItWorks: 'Shows self-directed learning with a specific count and topic. Honest that this is learning, not original research.', demonstratesDimensions: ['quantification', 'action_precision'], targetTier: 5 },

  // notable (tier 4)
  { id: 'sr-04', domainId: 'stem_research', level: 'notable', text: 'Conducted independent soil pH study across 8 local sites over 6 months. Presented findings at county science fair.', whyItWorks: 'Independent design, specific scope (8 sites, 6 months), external presentation. Shows initiative beyond classwork.', demonstratesDimensions: ['role_ownership', 'quantification', 'evidence_of_impact'], targetTier: 4 },
  { id: 'sr-05', domainId: 'stem_research', level: 'notable', text: 'Processed 2,000+ microscopy images for Dr. Chen\'s neuroscience lab at UC Davis using ImageJ and Python scripts.', whyItWorks: 'Quantified contribution, named PI and institution, specified tools. Shows genuine lab membership with real output.', demonstratesDimensions: ['quantification', 'action_precision', 'role_ownership'], targetTier: 4 },
  { id: 'sr-06', domainId: 'stem_research', level: 'notable', text: 'Performed PCR amplification and gel electrophoresis for a plant genetics study, analyzing 45 samples weekly.', whyItWorks: 'Names specific techniques and throughput. AOs recognize PCR/gel as genuine lab skills, not resume padding.', demonstratesDimensions: ['action_precision', 'quantification'], targetTier: 4 },

  // impressive (tier 3)
  { id: 'sr-07', domainId: 'stem_research', level: 'impressive', text: 'Co-authored study on antibiotic resistance in hospital wastewater. Designed sampling protocol for 3 clinical sites.', whyItWorks: 'Co-authorship + protocol design shows intellectual contribution, not just lab hands. Clinical sites add impact.', demonstratesDimensions: ['role_ownership', 'evidence_of_impact', 'differentiation'], targetTier: 3 },
  { id: 'sr-08', domainId: 'stem_research', level: 'impressive', text: 'Built a convolutional neural network to classify 15,000 galaxy images. Won 2nd place at Regeneron ISEF regional fair.', whyItWorks: 'Original project, specific methodology, quantified dataset, validated by competitive placement.', demonstratesDimensions: ['action_precision', 'quantification', 'evidence_of_impact'], targetTier: 3 },
  { id: 'sr-09', domainId: 'stem_research', level: 'impressive', text: 'Independently designed CRISPR experiment targeting drought resistance in wheat. Results presented at state academy.', whyItWorks: 'Independent experimental design with CRISPR signals advanced competence. State-level presentation validates quality.', demonstratesDimensions: ['role_ownership', 'action_precision', 'differentiation'], targetTier: 3 },

  // exceptional (tier 2)
  { id: 'sr-10', domainId: 'stem_research', level: 'exceptional', text: 'First author on peer-reviewed paper in Journal of Young Investigators on novel biosensor for lead detection.', whyItWorks: 'First authorship in a peer-reviewed journal is the gold standard. Novel contribution, not replication.', demonstratesDimensions: ['role_ownership', 'evidence_of_impact', 'differentiation'], targetTier: 2 },
  { id: 'sr-11', domainId: 'stem_research', level: 'exceptional', text: 'Received IRB approval for original behavioral study on sleep and academic performance. N=200 across 4 schools.', whyItWorks: 'IRB approval at HS level is extremely rare and signals adult-level research ethics training. Large N is credible.', demonstratesDimensions: ['role_ownership', 'quantification', 'differentiation'], targetTier: 2 },
  { id: 'sr-12', domainId: 'stem_research', level: 'exceptional', text: 'Regeneron ISEF Grand Award finalist. Developed low-cost water purification membrane, tested in 2 rural communities.', whyItWorks: 'ISEF Grand Award + real-world deployment. This is research with tangible impact beyond the lab.', demonstratesDimensions: ['evidence_of_impact', 'differentiation', 'quantification'], targetTier: 2 },

  // extraordinary (tier 1)
  { id: 'sr-13', domainId: 'stem_research', level: 'extraordinary', text: 'Published in Nature Communications. Discovered novel protein interaction pathway relevant to Alzheimer\'s treatment.', whyItWorks: 'Publication in a top-tier journal with a novel discovery. AOs immediately recognize this as field-level impact.', demonstratesDimensions: ['evidence_of_impact', 'differentiation', 'role_ownership'], targetTier: 1 },
  { id: 'sr-14', domainId: 'stem_research', level: 'extraordinary', text: 'Patent filed for biodegradable microplastics filter. Licensed by municipal water authority for pilot deployment.', whyItWorks: 'Patent + commercial licensing demonstrates that experts deemed this invention viable. Municipal adoption = systemic impact.', demonstratesDimensions: ['evidence_of_impact', 'differentiation', 'role_ownership'], targetTier: 1 },
  { id: 'sr-15', domainId: 'stem_research', level: 'extraordinary', text: 'Regeneron STS top 40 scholar. Original research on RNA splicing variants contributed to ongoing NIH-funded study.', whyItWorks: 'Regeneron STS top 40 is arguably the most prestigious HS science award. NIH-funded integration validates significance.', demonstratesDimensions: ['evidence_of_impact', 'differentiation', 'role_ownership'], targetTier: 1 },

  // additional
  { id: 'sr-16', domainId: 'stem_research', level: 'notable', text: 'Collected and catalogued 300+ insect specimens from local wetlands for university ecology database over 2 summers.', whyItWorks: 'Field research with quantified data contribution. University database integration shows work had downstream value.', demonstratesDimensions: ['quantification', 'evidence_of_impact'], targetTier: 4 },
  { id: 'sr-17', domainId: 'stem_research', level: 'impressive', text: 'Synthesized 14 novel organic compounds in Prof. Vasquez\'s lab. Three showed antimicrobial activity in screening.', whyItWorks: 'Specific count of synthesized compounds with functional results. Names PI. This is graduate-level lab work.', demonstratesDimensions: ['quantification', 'action_precision', 'evidence_of_impact'], targetTier: 3 },
    { id: 'sr-18', domainId: 'stem_research', level: 'exceptional', text: 'Regeneron STS semifinalist. Built computational model predicting wildfire spread with 89% accuracy on test data.', whyItWorks: 'Regeneron STS (successor to Intel/Siemens) validation + specific accuracy metric + practical application.', demonstratesDimensions: ['quantification', 'evidence_of_impact', 'differentiation'], targetTier: 2 },

  // ── coding_engineering (18 exemplars) ──────────────────────────────────

  // baseline
  { id: 'ce-01', domainId: 'coding_engineering', level: 'baseline', text: 'Completed Harvard CS50 online course and built a personal portfolio website using HTML, CSS, and JavaScript.', whyItWorks: 'Names a credible course and specific technologies. Honest about the scope — learning, not creating at scale.', demonstratesDimensions: ['action_precision'], targetTier: 5 },
  { id: 'ce-02', domainId: 'coding_engineering', level: 'baseline', text: 'Built a calculator app and a to-do list app using React as part of learning web development over the summer.', whyItWorks: 'Specific projects and technologies named. Frames honestly as learning rather than overclaiming impact.', demonstratesDimensions: ['action_precision'], targetTier: 6 },
  { id: 'ce-03', domainId: 'coding_engineering', level: 'baseline', text: 'Member of school robotics club. Helped wire sensors and test autonomous navigation for FTC competition robot.', whyItWorks: 'Specific technical contributions within a team context. FTC is a recognized program.', demonstratesDimensions: ['action_precision', 'role_ownership'], targetTier: 5 },

  // notable
  { id: 'ce-04', domainId: 'coding_engineering', level: 'notable', text: 'Developed a study group matching app used by 150+ students at my school. Built with React Native and Firebase.', whyItWorks: 'Real users (150+), named tech stack, solves a real problem. Shows ability to ship, not just code.', demonstratesDimensions: ['quantification', 'evidence_of_impact', 'action_precision'], targetTier: 4 },
  { id: 'ce-05', domainId: 'coding_engineering', level: 'notable', text: 'Lead programmer on FRC Team 2468. Wrote autonomous navigation code in Java, contributing to regional finalist win.', whyItWorks: 'Specific team number (verifiable), named role, specific contribution, and outcome. FRC is rigorous.', demonstratesDimensions: ['role_ownership', 'action_precision', 'evidence_of_impact'], targetTier: 4 },
  { id: 'ce-06', domainId: 'coding_engineering', level: 'notable', text: 'Created a Python web scraper that aggregates college scholarship data. 500+ monthly users from 3 school districts.', whyItWorks: 'Specific technology, quantified user base across multiple districts, practical value proposition.', demonstratesDimensions: ['quantification', 'evidence_of_impact', 'action_precision'], targetTier: 4 },

  // impressive
  { id: 'ce-07', domainId: 'coding_engineering', level: 'impressive', text: 'Built and deployed a full-stack food waste reduction platform connecting 23 restaurants with local food banks.', whyItWorks: 'Full-stack (shows range), deployed (not just built), quantified scope, real social impact.', demonstratesDimensions: ['evidence_of_impact', 'quantification', 'action_precision'], targetTier: 3 },
  { id: 'ce-08', domainId: 'coding_engineering', level: 'impressive', text: 'Open source contributor to Mozilla Firefox. 6 merged pull requests fixing accessibility bugs in screen reader support.', whyItWorks: 'Contributing to a major open source project is verifiable and demonstrates professional-grade code review skills.', demonstratesDimensions: ['evidence_of_impact', 'differentiation', 'quantification'], targetTier: 3 },
  { id: 'ce-09', domainId: 'coding_engineering', level: 'impressive', text: 'USACO Gold division qualifier. Solved 40+ competitive programming problems weekly for 18 months to reach this level.', whyItWorks: 'USACO Gold is a recognized achievement (top ~5% of competitors). Quantified effort shows genuine dedication.', demonstratesDimensions: ['evidence_of_impact', 'quantification', 'differentiation'], targetTier: 3 },

  // exceptional
  { id: 'ce-10', domainId: 'coding_engineering', level: 'exceptional', text: 'USACO Platinum qualifier. Built an AI tutoring system used by 2,000+ students, reducing average fail rate by 15%.', whyItWorks: 'USACO Platinum (top 1%) + deployed system with measurable educational impact. Two independent validations.', demonstratesDimensions: ['evidence_of_impact', 'quantification', 'differentiation'], targetTier: 2 },
  { id: 'ce-11', domainId: 'coding_engineering', level: 'exceptional', text: 'Developed iOS app with 10,000+ downloads and 4.8-star rating. Featured in App Store education category.', whyItWorks: 'App Store feature is editorially curated — external validation that this is quality software, not a toy project.', demonstratesDimensions: ['evidence_of_impact', 'quantification', 'differentiation'], targetTier: 2 },
  { id: 'ce-12', domainId: 'coding_engineering', level: 'exceptional', text: 'Google Summer of Code contributor. Contributed to TensorFlow documentation and 3 production code modules.', whyItWorks: 'GSoC contributor — production-level contributions to a major ML framework demonstrate professional capability.', demonstratesDimensions: ['evidence_of_impact', 'differentiation', 'role_ownership'], targetTier: 2 },

  // extraordinary
  { id: 'ce-13', domainId: 'coding_engineering', level: 'extraordinary', text: 'IOI bronze medalist. Created open-source library with 2,000+ GitHub stars used by universities for teaching.', whyItWorks: 'IOI medal = top tier globally. Open source library adoption by universities proves professional-grade impact.', demonstratesDimensions: ['evidence_of_impact', 'differentiation', 'quantification'], targetTier: 1 },
  { id: 'ce-14', domainId: 'coding_engineering', level: 'extraordinary', text: 'Founded YC-backed startup at 17. Built the core ML pipeline processing 1M+ data points daily for 50 clients.', whyItWorks: 'Y Combinator backing is world-class validation. Quantified scale (1M+ daily, 50 clients) proves real business.', demonstratesDimensions: ['evidence_of_impact', 'quantification', 'differentiation', 'role_ownership'], targetTier: 1 },
  { id: 'ce-15', domainId: 'coding_engineering', level: 'extraordinary', text: 'Accepted patch to Linux kernel fixing a race condition in the scheduler. Youngest contributor in 3 years.', whyItWorks: 'Linux kernel contributions undergo the most rigorous code review in open source. "Youngest in 3 years" is verifiable.', demonstratesDimensions: ['differentiation', 'action_precision', 'evidence_of_impact'], targetTier: 1 },

  // additional
  { id: 'ce-16', domainId: 'coding_engineering', level: 'notable', text: 'Designed and 3D-printed a prosthetic hand prototype using Arduino sensors. Demoed at county maker fair.', whyItWorks: 'Interdisciplinary project (HW + SW + fabrication). Maker fair demo provides mild external validation.', demonstratesDimensions: ['action_precision', 'evidence_of_impact'], targetTier: 4 },
  { id: 'ce-17', domainId: 'coding_engineering', level: 'impressive', text: 'Won Congressional App Challenge. Built an ASL translation app using TensorFlow Lite, adopted by 2 deaf schools.', whyItWorks: 'Congressional competition win + ML technique + institutional adoption by schools. Three validation layers.', demonstratesDimensions: ['evidence_of_impact', 'action_precision', 'quantification'], targetTier: 3 },
  { id: 'ce-18', domainId: 'coding_engineering', level: 'exceptional', text: 'Summer intern at MIT CSAIL. Co-authored workshop paper on efficient transformer architectures for edge devices.', whyItWorks: 'MIT CSAIL internship at HS level is extremely selective. Workshop paper shows intellectual contribution.', demonstratesDimensions: ['differentiation', 'role_ownership', 'evidence_of_impact'], targetTier: 2 },

  // ── debate_speech (17 exemplars) ───────────────────────────────────────

  // baseline
  { id: 'ds-01', domainId: 'debate_speech', level: 'baseline', text: 'Member of school debate team for 2 years. Competed in 5 local tournaments in Lincoln-Douglas format.', whyItWorks: 'Duration, specific format, and tournament count provide basic verifiable facts about participation level.', demonstratesDimensions: ['role_ownership'], targetTier: 5 },
  { id: 'ds-02', domainId: 'debate_speech', level: 'baseline', text: 'Participated in Model UN at school, representing Brazil in the General Assembly at 2 local conferences.', whyItWorks: 'Names format, country, and committee. Honest about local-only scope.', demonstratesDimensions: ['role_ownership', 'action_precision'], targetTier: 6 },

  // notable
  { id: 'ds-03', domainId: 'debate_speech', level: 'notable', text: 'Varsity debate captain. Led practice 3x/week, recruited 8 novice members, and coached them to first tournament wins.', whyItWorks: 'Captain role + specific leadership actions + impact on others. Shows leadership beyond personal competition.', demonstratesDimensions: ['role_ownership', 'quantification', 'evidence_of_impact'], targetTier: 4 },
  { id: 'ds-04', domainId: 'debate_speech', level: 'notable', text: 'Qualified to NSDA district tournament in Public Forum debate. Top speaker at 3 of 8 regular season tournaments.', whyItWorks: 'NSDA districts is a recognized threshold. Speaker awards provide specific competitive validation.', demonstratesDimensions: ['evidence_of_impact', 'quantification'], targetTier: 4 },
  { id: 'ds-05', domainId: 'debate_speech', level: 'notable', text: 'Best Delegate award at 2 regional Model UN conferences. Researched and wrote 15-page position papers per event.', whyItWorks: 'Best Delegate is specific and verifiable. Research depth (15 pages) shows intellectual seriousness.', demonstratesDimensions: ['evidence_of_impact', 'quantification', 'action_precision'], targetTier: 4 },

  // impressive
  { id: 'ds-06', domainId: 'debate_speech', level: 'impressive', text: 'NSDA national qualifier in Original Oratory. Wrote and performed a 10-minute speech on refugee education policy.', whyItWorks: 'NSDA nationals qualification places the student in the top tier of their state. Specific topic shows substance.', demonstratesDimensions: ['evidence_of_impact', 'differentiation', 'action_precision'], targetTier: 3 },
  { id: 'ds-07', domainId: 'debate_speech', level: 'impressive', text: 'Secretary-General of school Model UN conference hosting 400+ delegates from 25 schools across the tri-state area.', whyItWorks: 'Running a conference (not just attending) requires project management. Scale (400 delegates, 25 schools) is impressive.', demonstratesDimensions: ['role_ownership', 'quantification', 'evidence_of_impact'], targetTier: 3 },
  { id: 'ds-08', domainId: 'debate_speech', level: 'impressive', text: 'Founded school\'s first parliamentary debate program. Grew from 4 to 28 members and won 3 regional trophies in 2 years.', whyItWorks: 'Founder + growth metrics + competitive results. Building something from nothing demonstrates initiative.', demonstratesDimensions: ['role_ownership', 'quantification', 'evidence_of_impact'], targetTier: 3 },

  // exceptional
  { id: 'ds-09', domainId: 'debate_speech', level: 'exceptional', text: 'TOC (Tournament of Champions) qualifier in Lincoln-Douglas. Top 20 nationally ranked debater by Tabroom.', whyItWorks: 'TOC qualification + national ranking are the gold standard in HS debate. Tabroom is the authoritative ranking.', demonstratesDimensions: ['evidence_of_impact', 'differentiation'], targetTier: 2 },
  { id: 'ds-10', domainId: 'debate_speech', level: 'exceptional', text: 'Outstanding Delegate at Harvard Model UN and NAIMUN. Chaired DISEC committee at our 500-delegate conference.', whyItWorks: 'Awards at prestigious conferences (HMUN, NAIMUN) are nationally recognized. Chairing demonstrates leadership.', demonstratesDimensions: ['evidence_of_impact', 'differentiation', 'role_ownership'], targetTier: 2 },
  { id: 'ds-11', domainId: 'debate_speech', level: 'exceptional', text: 'Won NSDA nationals in Extemporaneous Speaking. Quoted by local newspaper as expert on education policy issues.', whyItWorks: 'NSDA national champion is the peak of HS forensics. Media recognition adds external validation.', demonstratesDimensions: ['evidence_of_impact', 'differentiation'], targetTier: 2 },

  // extraordinary
  { id: 'ds-12', domainId: 'debate_speech', level: 'extraordinary', text: 'World Schools Debate Team member representing the US at international championship. Awarded best speaker.', whyItWorks: 'National team selection + international competition + best speaker = the absolute pinnacle of HS debate.', demonstratesDimensions: ['evidence_of_impact', 'differentiation', 'role_ownership'], targetTier: 1 },
  { id: 'ds-13', domainId: 'debate_speech', level: 'extraordinary', text: 'Co-founded national debate access nonprofit. Trained 500+ students from under-resourced schools in 12 states.', whyItWorks: 'National scale nonprofit + quantified impact (500 students, 12 states) = systemic change in debate access.', demonstratesDimensions: ['evidence_of_impact', 'quantification', 'role_ownership', 'differentiation'], targetTier: 1 },

  // additional
  { id: 'ds-14', domainId: 'debate_speech', level: 'notable', text: 'Organized school\'s first Ethics Bowl team. Researched 15 cases and guided team to state semifinal in first year.', whyItWorks: 'Founded a new program, quantified research effort, competitive result in first year shows rapid development.', demonstratesDimensions: ['role_ownership', 'quantification', 'evidence_of_impact'], targetTier: 4 },
  { id: 'ds-15', domainId: 'debate_speech', level: 'impressive', text: 'Published op-ed in state newspaper on juvenile justice reform, drawing from 2 years of policy debate research.', whyItWorks: 'Publication bridges debate skills to real-world advocacy. Shows depth of subject matter engagement.', demonstratesDimensions: ['evidence_of_impact', 'differentiation', 'action_precision'], targetTier: 3 },
  { id: 'ds-16', domainId: 'debate_speech', level: 'baseline', text: 'Attended 3 speech and debate tournaments in Dramatic Interpretation. Selected and performed two cutting pieces.', whyItWorks: 'Specific event and activity described. Low tournament count but honest about participation level.', demonstratesDimensions: ['action_precision'], targetTier: 6 },
  { id: 'ds-17', domainId: 'debate_speech', level: 'exceptional', text: 'Apple Valley and Emory invitational champion in LD. Coached 4 novices who all qualified to state tournament.', whyItWorks: 'Named prestigious tournaments (verifiable) + mentorship impact with specific results.', demonstratesDimensions: ['evidence_of_impact', 'differentiation', 'role_ownership'], targetTier: 2 },

  // ── community_service (17 exemplars) ───────────────────────────────────

  // baseline
  { id: 'cs-01', domainId: 'community_service', level: 'baseline', text: 'Volunteered at local food bank sorting donations on weekends. Completed 80 hours of community service.', whyItWorks: 'Specific organization and task. Hours are documented but below the threshold for differentiation.', demonstratesDimensions: ['quantification'], targetTier: 5 },
  { id: 'cs-02', domainId: 'community_service', level: 'baseline', text: 'Participated in annual school Habitat for Humanity build day and holiday toy drive for 3 consecutive years.', whyItWorks: 'Named programs and multi-year participation. But episodic involvement limits the impact narrative.', demonstratesDimensions: ['role_ownership'], targetTier: 6 },

  // notable
  { id: 'cs-03', domainId: 'community_service', level: 'notable', text: 'Weekly math tutor at Boys & Girls Club for 2 years, working with 12 middle schoolers. 8 improved by a letter grade.', whyItWorks: 'Sustained commitment (weekly, 2 years), named org, specific group size, and measurable academic outcomes.', demonstratesDimensions: ['quantification', 'evidence_of_impact', 'role_ownership'], targetTier: 4 },
  { id: 'cs-04', domainId: 'community_service', level: 'notable', text: 'Lead volunteer at senior center: organized weekly activities for 30+ residents and trained 5 new volunteers.', whyItWorks: 'Leadership within an existing org, quantified scope, and training responsibility elevate beyond basic volunteering.', demonstratesDimensions: ['role_ownership', 'quantification', 'evidence_of_impact'], targetTier: 4 },
  { id: 'cs-05', domainId: 'community_service', level: 'notable', text: 'Collected and distributed 2,000+ books to 3 underserved elementary schools through year-long book drive campaign.', whyItWorks: 'Quantified output (2,000 books), defined scope (3 schools), sustained timeline. Shows execution ability.', demonstratesDimensions: ['quantification', 'evidence_of_impact'], targetTier: 4 },

  // impressive
  { id: 'cs-06', domainId: 'community_service', level: 'impressive', text: 'Founded free SAT prep program for low-income students. 45 students served, average score improved 120 points.', whyItWorks: 'Founded (not joined), specific population, quantified reach and measurable outcome. This is a real program.', demonstratesDimensions: ['role_ownership', 'quantification', 'evidence_of_impact'], targetTier: 3 },
  { id: 'cs-07', domainId: 'community_service', level: 'impressive', text: 'Organized community garden project on vacant lot. Partnered with city council, grew produce for 15 families weekly.', whyItWorks: 'Government partnership adds credibility. Sustained food production for families = tangible, ongoing impact.', demonstratesDimensions: ['role_ownership', 'evidence_of_impact', 'quantification'], targetTier: 3 },
  { id: 'cs-08', domainId: 'community_service', level: 'impressive', text: 'Built and launched a mental health peer support hotline at school. Trained 20 volunteers in crisis de-escalation.', whyItWorks: 'Founded a real service infrastructure. Training volunteers in crisis skills shows depth and responsibility.', demonstratesDimensions: ['role_ownership', 'quantification', 'evidence_of_impact', 'differentiation'], targetTier: 3 },

  // exceptional
  { id: 'cs-09', domainId: 'community_service', level: 'exceptional', text: 'Founded nonprofit providing 3,000+ free meals monthly to homeless. Partnered with Feeding America and 8 restaurants.', whyItWorks: 'Scale (3,000 meals/month), national org partnership, and multi-stakeholder coordination signal exceptional impact.', demonstratesDimensions: ['quantification', 'evidence_of_impact', 'differentiation', 'role_ownership'], targetTier: 2 },
  { id: 'cs-10', domainId: 'community_service', level: 'exceptional', text: 'Lobbied state legislature for menstrual product access bill. Testified before committee; bill passed into law.', whyItWorks: 'Legislative testimony + bill passage = measurable policy change. This directly improved lives at systemic level.', demonstratesDimensions: ['evidence_of_impact', 'differentiation', 'role_ownership'], targetTier: 2 },
  { id: 'cs-11', domainId: 'community_service', level: 'exceptional', text: 'Received $25K grant from local foundation to expand tutoring nonprofit to 4 schools. Served 200 students annually.', whyItWorks: 'Grant funding is external validation of organizational credibility. $25K signals serious institutional trust.', demonstratesDimensions: ['quantification', 'evidence_of_impact', 'differentiation'], targetTier: 2 },

  // extraordinary
  { id: 'cs-12', domainId: 'community_service', level: 'extraordinary', text: 'Congressional Award Gold Medal recipient. Founded clean water initiative serving 5 villages across 2 countries.', whyItWorks: 'Congressional Award Gold is the rarest HS service award. International impact across multiple communities is extraordinary.', demonstratesDimensions: ['evidence_of_impact', 'differentiation', 'quantification'], targetTier: 1 },
  { id: 'cs-13', domainId: 'community_service', level: 'extraordinary', text: 'Founded 501(c)(3) refugee resettlement org in 6 states. Featured on NPR and partnered with UNHCR local chapter.', whyItWorks: 'National-scale nonprofit, UN partnership, and major media coverage. This is adult-level organizational leadership.', demonstratesDimensions: ['evidence_of_impact', 'differentiation', 'role_ownership', 'quantification'], targetTier: 1 },

  // additional
  { id: 'cs-14', domainId: 'community_service', level: 'notable', text: 'Coordinated monthly beach cleanups for 18 months. Removed 500+ lbs of debris with teams of 15-20 volunteers.', whyItWorks: 'Sustained timeline, quantified impact (500 lbs), and volunteer coordination show real organizational effort.', demonstratesDimensions: ['quantification', 'role_ownership', 'evidence_of_impact'], targetTier: 4 },
  { id: 'cs-15', domainId: 'community_service', level: 'impressive', text: 'Created bilingual health literacy workshops for immigrant families. 150+ attendees across 12 monthly sessions.', whyItWorks: 'Addresses specific underserved population, sustained program, quantified attendance. Bilingual skill adds authenticity.', demonstratesDimensions: ['differentiation', 'quantification', 'evidence_of_impact'], targetTier: 3 },
  { id: 'cs-16', domainId: 'community_service', level: 'exceptional', text: 'Won Jefferson Award for Public Service. Led campaign that placed 50 defibrillators in public buildings citywide.', whyItWorks: 'Named national award + citywide infrastructure change. 50 defibrillators = potentially life-saving systemic impact.', demonstratesDimensions: ['evidence_of_impact', 'quantification', 'differentiation'], targetTier: 2 },
  { id: 'cs-17', domainId: 'community_service', level: 'baseline', text: 'Volunteered at hospital gift shop 4 hours per week during summer. Assisted patients and visitors with directions.', whyItWorks: 'Specific location and tasks. Hospital context adds slight weight but limited scope and duration.', demonstratesDimensions: ['role_ownership'], targetTier: 5 },

  // ── athletics (17 exemplars) ───────────────────────────────────────────

  // baseline
  { id: 'at-01', domainId: 'athletics', level: 'baseline', text: 'JV soccer player for 2 seasons. Attended all practices and games, contributing as a midfielder.', whyItWorks: 'Specific sport, level (JV), duration, and position named. Honest about participation-level involvement.', demonstratesDimensions: ['role_ownership'], targetTier: 5 },
  { id: 'at-02', domainId: 'athletics', level: 'baseline', text: 'Member of school cross country team for 3 years. Improved personal 5K time from 24:30 to 21:15.', whyItWorks: 'Quantified personal improvement shows dedication. Times give AOs context (above average but not elite).', demonstratesDimensions: ['quantification', 'role_ownership'], targetTier: 5 },

  // notable
  { id: 'at-03', domainId: 'athletics', level: 'notable', text: 'Varsity tennis team captain. Led team to conference semifinals, organized summer training camps for 15 players.', whyItWorks: 'Captain role + team results + initiative beyond required duties (summer camps). Shows leadership and initiative.', demonstratesDimensions: ['role_ownership', 'evidence_of_impact', 'quantification'], targetTier: 4 },
  { id: 'at-04', domainId: 'athletics', level: 'notable', text: 'All-conference honorable mention in swimming. Set 2 school records in 200m IM and 100m butterfly events.', whyItWorks: 'Conference recognition + school records are verifiable. Specific events and times give concrete context.', demonstratesDimensions: ['evidence_of_impact', 'quantification', 'differentiation'], targetTier: 4 },
  { id: 'at-05', domainId: 'athletics', level: 'notable', text: 'Earned black belt in taekwondo after 7 years of training. Assistant instructor for youth classes (ages 6-10).', whyItWorks: 'Long-term commitment (7 years) + teaching role shows depth. Black belt is a recognized milestone.', demonstratesDimensions: ['role_ownership', 'quantification', 'evidence_of_impact'], targetTier: 4 },

  // impressive
  { id: 'at-06', domainId: 'athletics', level: 'impressive', text: 'All-state track and field athlete in 800m. Competed at New Balance Nationals Indoor with a 1:56 PR.', whyItWorks: 'All-state is top ~2% of state. National competition + specific time lets AOs verify the level instantly.', demonstratesDimensions: ['evidence_of_impact', 'quantification', 'differentiation'], targetTier: 3 },
  { id: 'at-07', domainId: 'athletics', level: 'impressive', text: 'Varsity basketball captain and team MVP. Led team to state quarterfinals, averaging 18 pts and 7 assists per game.', whyItWorks: 'MVP + state tournament + specific stats. Stats are verifiable via MaxPreps and tell a clear story.', demonstratesDimensions: ['evidence_of_impact', 'quantification', 'role_ownership'], targetTier: 3 },
  { id: 'at-08', domainId: 'athletics', level: 'impressive', text: 'Recruited to play D1 lacrosse. Founded youth lacrosse clinic serving 40 kids from underserved neighborhoods.', whyItWorks: 'D1 recruitment validates athletic level. Community clinic adds character dimension beyond personal achievement.', demonstratesDimensions: ['evidence_of_impact', 'differentiation', 'role_ownership', 'quantification'], targetTier: 3 },

  // exceptional
  { id: 'at-09', domainId: 'athletics', level: 'exceptional', text: 'State champion in 100m freestyle (49.2s). 3-time All-American. Recruited by 5 D1 programs with scholarship offers.', whyItWorks: 'State champion + All-American + multi-school D1 recruitment. Times verify elite status objectively.', demonstratesDimensions: ['evidence_of_impact', 'quantification', 'differentiation'], targetTier: 2 },
  { id: 'at-10', domainId: 'athletics', level: 'exceptional', text: 'National fencing qualifier, ranked top 32 in Junior Olympics. Trained 15+ hours/week while maintaining 4.0 GPA.', whyItWorks: 'National ranking is verifiable. Junior Olympics is a recognized elite competition. Academic balance adds context.', demonstratesDimensions: ['evidence_of_impact', 'quantification', 'differentiation'], targetTier: 2 },
  { id: 'at-11', domainId: 'athletics', level: 'exceptional', text: 'Gatorade Player of the Year nominee for state. Selected for U18 regional development team in volleyball.', whyItWorks: 'Gatorade POY is one of the most prestigious HS athletic awards. Regional team = federation-level selection.', demonstratesDimensions: ['evidence_of_impact', 'differentiation'], targetTier: 2 },

  // extraordinary
  { id: 'at-12', domainId: 'athletics', level: 'extraordinary', text: 'Junior Olympic gold medalist in wrestling. Member of USA Wrestling Cadet national team, competing internationally.', whyItWorks: 'National team selection + international competition = the pinnacle of HS athletics. Federally verified.', demonstratesDimensions: ['evidence_of_impact', 'differentiation'], targetTier: 1 },
  { id: 'at-13', domainId: 'athletics', level: 'extraordinary', text: 'Olympic Development Program member in soccer. Signed National Letter of Intent with top-5 ranked D1 program.', whyItWorks: 'ODP + top-5 D1 signing. NLI is legally binding and verifiable — this is the clearest athletic validation.', demonstratesDimensions: ['evidence_of_impact', 'differentiation'], targetTier: 1 },

  // additional
  { id: 'at-14', domainId: 'athletics', level: 'baseline', text: 'Played intramural basketball and recreational flag football for 2 years. Joined school gym fitness club.', whyItWorks: 'Honest about recreational level. Shows physical activity interest without overclaiming competitive achievement.', demonstratesDimensions: ['role_ownership'], targetTier: 6 },
  { id: 'at-15', domainId: 'athletics', level: 'notable', text: 'Completed a full marathon (4:12) as a junior, raising $3,200 for childhood cancer research through pledges.', whyItWorks: 'Marathon completion is a concrete achievement. Specific time + fundraising amount adds two quantified dimensions.', demonstratesDimensions: ['quantification', 'evidence_of_impact', 'differentiation'], targetTier: 4 },
  { id: 'at-16', domainId: 'athletics', level: 'impressive', text: 'Captain and goalie, led hockey team to first state tournament in 15 years. Named to all-tournament team.', whyItWorks: 'Historic team achievement (first in 15 years) + individual tournament recognition. Shows both team and individual impact.', demonstratesDimensions: ['role_ownership', 'evidence_of_impact', 'differentiation'], targetTier: 3 },
  { id: 'at-17', domainId: 'athletics', level: 'exceptional', text: 'USA Gymnastics Level 10. Qualified to JO Nationals with a 37.5 all-around score, ranking top 50 nationally.', whyItWorks: 'Level 10 is the highest JO level. National qualification with specific score lets evaluators verify elite status.', demonstratesDimensions: ['evidence_of_impact', 'quantification', 'differentiation'], targetTier: 2 },

  // ── performing_arts (17 exemplars) ─────────────────────────────────────

  // baseline
  { id: 'pa-01', domainId: 'performing_arts', level: 'baseline', text: 'Played clarinet in school concert band for 3 years. Performed at 4 seasonal concerts per year.', whyItWorks: 'Specific instrument, duration, and performance frequency. Honest about ensemble participation level.', demonstratesDimensions: ['role_ownership'], targetTier: 5 },
  { id: 'pa-02', domainId: 'performing_arts', level: 'baseline', text: 'Ensemble cast member in school musical productions of Grease and Into the Woods over 2 years.', whyItWorks: 'Named specific shows, specified role level (ensemble vs lead). Honest framing of participation.', demonstratesDimensions: ['role_ownership', 'action_precision'], targetTier: 6 },

  // notable
  { id: 'pa-03', domainId: 'performing_arts', level: 'notable', text: 'First chair violin in school orchestra. Selected for county honors ensemble after competitive audition process.', whyItWorks: 'First chair is a specific, verifiable position. County honors = selection beyond school level.', demonstratesDimensions: ['evidence_of_impact', 'role_ownership', 'differentiation'], targetTier: 4 },
  { id: 'pa-04', domainId: 'performing_arts', level: 'notable', text: 'Lead role in school production of The Crucible. Directed a student-written one-act play for drama festival.', whyItWorks: 'Lead role + directing shows range. Student-written play suggests creative depth beyond performance.', demonstratesDimensions: ['role_ownership', 'differentiation', 'action_precision'], targetTier: 4 },
  { id: 'pa-05', domainId: 'performing_arts', level: 'notable', text: 'Choreographed 3 dance pieces for school showcase. Studied ballet, jazz, and contemporary for 8 years.', whyItWorks: 'Choreography shows creative leadership. 8 years of study across 3 styles demonstrates serious commitment.', demonstratesDimensions: ['role_ownership', 'action_precision', 'quantification'], targetTier: 4 },

  // impressive
  { id: 'pa-06', domainId: 'performing_arts', level: 'impressive', text: 'All-state jazz ensemble on tenor saxophone. Performed at state music educators conference for 500+ attendees.', whyItWorks: 'All-state is the standard benchmark for top HS musicians. State conference performance adds professional context.', demonstratesDimensions: ['evidence_of_impact', 'differentiation', 'quantification'], targetTier: 3 },
  { id: 'pa-07', domainId: 'performing_arts', level: 'impressive', text: 'Composed original score for school film festival entry. Piece performed by 12-member chamber ensemble at premiere.', whyItWorks: 'Original composition for a specific production shows creative depth. Ensemble performance indicates orchestration skill.', demonstratesDimensions: ['action_precision', 'differentiation', 'role_ownership'], targetTier: 3 },
  { id: 'pa-08', domainId: 'performing_arts', level: 'impressive', text: 'Won regional YoungArts merit award in theater. Cast in community theater production alongside professional actors.', whyItWorks: 'YoungArts is nationally recognized. Community theater casting = adults chose this student over adult competitors.', demonstratesDimensions: ['evidence_of_impact', 'differentiation'], targetTier: 3 },

  // exceptional
  { id: 'pa-09', domainId: 'performing_arts', level: 'exceptional', text: 'National YoungArts finalist in music composition. Original symphony premiered by regional youth philharmonic.', whyItWorks: 'YoungArts finalist = top 1% nationally. Having an original symphony premiered is a career-level achievement.', demonstratesDimensions: ['evidence_of_impact', 'differentiation', 'role_ownership'], targetTier: 2 },
  { id: 'pa-10', domainId: 'performing_arts', level: 'exceptional', text: 'Accepted to Juilliard pre-college program. Won concerto competition performing Shostakovich Piano Concerto No. 2.', whyItWorks: 'Juilliard pre-college is the most selective HS music program. Concerto competition win with named repertoire is elite.', demonstratesDimensions: ['evidence_of_impact', 'differentiation', 'action_precision'], targetTier: 2 },
  { id: 'pa-11', domainId: 'performing_arts', level: 'exceptional', text: 'Original play selected for national high school playwriting festival. Directed a 3-night run with cast of 14.', whyItWorks: 'National selection for original work + production direction. Creative and leadership excellence combined.', demonstratesDimensions: ['evidence_of_impact', 'differentiation', 'role_ownership', 'quantification'], targetTier: 2 },

  // extraordinary
  { id: 'pa-12', domainId: 'performing_arts', level: 'extraordinary', text: 'Presidential Scholar in the Arts semifinalist. Solo debut with city symphony performing Rachmaninoff Concerto No. 3.', whyItWorks: 'Presidential Scholar is the highest US arts recognition. Solo debut with a professional symphony is career-defining.', demonstratesDimensions: ['evidence_of_impact', 'differentiation', 'action_precision'], targetTier: 1 },
  { id: 'pa-13', domainId: 'performing_arts', level: 'extraordinary', text: 'Film screened at Tribeca Film Festival student showcase. Shot, directed, and edited 22-minute narrative short.', whyItWorks: 'Tribeca selection is world-class validation. Complete creative control (shot + directed + edited) shows auteur capability.', demonstratesDimensions: ['evidence_of_impact', 'differentiation', 'role_ownership', 'action_precision'], targetTier: 1 },

  // additional
  { id: 'pa-14', domainId: 'performing_arts', level: 'notable', text: 'Drum major of 120-member marching band. Conducted at 8 football games and 3 competitive band festivals.', whyItWorks: 'Drum major of a large band is significant leadership. Specific performance count and group size provide scale.', demonstratesDimensions: ['role_ownership', 'quantification', 'evidence_of_impact'], targetTier: 4 },
  { id: 'pa-15', domainId: 'performing_arts', level: 'impressive', text: 'Produced and directed school\'s first student film festival. Curated 18 films from 40+ submissions over 3 months.', whyItWorks: 'Created a new institution. Selection process (18 from 40+) shows curatorial judgment and organizational skill.', demonstratesDimensions: ['role_ownership', 'quantification', 'evidence_of_impact'], targetTier: 3 },
  { id: 'pa-16', domainId: 'performing_arts', level: 'exceptional', text: 'NPR Tiny Desk Contest honorable mention for original song. 50,000+ streams on Spotify within first month.', whyItWorks: 'NPR recognition + quantified digital audience. Streaming numbers provide market validation beyond juried awards.', demonstratesDimensions: ['evidence_of_impact', 'quantification', 'differentiation'], targetTier: 2 },
  { id: 'pa-17', domainId: 'performing_arts', level: 'baseline', text: 'Sang in school choir for 2 years. Participated in annual spring choral concert and holiday performance.', whyItWorks: 'Simple, honest participation. Duration and specific events named, but no individual distinction.', demonstratesDimensions: ['role_ownership'], targetTier: 6 },

  // ── stem_competition (18 exemplars) ──────────────────────────────────

  // baseline (tier 5-6)
  { id: 'sc-01', domainId: 'stem_competition', level: 'baseline', text: 'Took the AMC 10 exam sophomore and junior year. Scored above school average both times.', whyItWorks: 'Names a recognized exam and timeline. Honest about school-level performance without overclaiming.', demonstratesDimensions: ['role_ownership'], targetTier: 5 },
  { id: 'sc-02', domainId: 'stem_competition', level: 'baseline', text: 'Member of school math team for 2 years. Competed in 6 local MATHCOUNTS chapter-level competitions.', whyItWorks: 'Specific program, duration, and competition count. Frames participation honestly at the local level.', demonstratesDimensions: ['role_ownership', 'quantification'], targetTier: 5 },
  { id: 'sc-03', domainId: 'stem_competition', level: 'baseline', text: 'Participated in Science Olympiad at school level in 3 events: Anatomy, Forensics, and Disease Detectives.', whyItWorks: 'Names specific events within a recognized program. Honest about school-level scope.', demonstratesDimensions: ['role_ownership', 'action_precision'], targetTier: 6 },

  // notable (tier 4)
  { id: 'sc-04', domainId: 'stem_competition', level: 'notable', text: 'AIME qualifier with AMC 12 score of 112. Captain of school math team, organized weekly practice sessions.', whyItWorks: 'AIME qualification is a recognized threshold (top 5%). Specific score is verifiable. Captain role adds leadership.', demonstratesDimensions: ['evidence_of_impact', 'quantification', 'role_ownership'], targetTier: 4 },
  { id: 'sc-05', domainId: 'stem_competition', level: 'notable', text: 'Won 2 gold medals at Science Olympiad regional tournament in Chemistry Lab and Forensics events.', whyItWorks: 'Gold medals at regionals show competitive success. Specific events demonstrate real hands-on science skills.', demonstratesDimensions: ['evidence_of_impact', 'action_precision'], targetTier: 4 },
  { id: 'sc-06', domainId: 'stem_competition', level: 'notable', text: 'USACO Silver division. Solved 200+ competitive programming problems on Codeforces over 12 months of training.', whyItWorks: 'USACO Silver is a recognized milestone. Quantified training effort shows genuine dedication to improvement.', demonstratesDimensions: ['evidence_of_impact', 'quantification'], targetTier: 4 },

  // impressive (tier 3)
  { id: 'sc-07', domainId: 'stem_competition', level: 'impressive', text: 'USAMO qualifier. Scored 8+ on AIME, placing in top 250 nationally in mathematical problem-solving.', whyItWorks: 'USAMO qualification is elite (top ~250 in the US). Specific AIME score provides verifiable context.', demonstratesDimensions: ['evidence_of_impact', 'quantification', 'differentiation'], targetTier: 3 },
  { id: 'sc-08', domainId: 'stem_competition', level: 'impressive', text: 'USACO Gold division qualifier. Led school CS team to 2nd place at state programming competition.', whyItWorks: 'USACO Gold is top ~5% nationally. State-level team result adds leadership and collaboration dimensions.', demonstratesDimensions: ['evidence_of_impact', 'differentiation', 'role_ownership'], targetTier: 3 },
  { id: 'sc-09', domainId: 'stem_competition', level: 'impressive', text: 'Science Olympiad national tournament competitor. Won gold in Chem Lab and silver in Experimental Design.', whyItWorks: 'National Science Olympiad qualifies only top teams per state. Multiple event medals show breadth and depth.', demonstratesDimensions: ['evidence_of_impact', 'differentiation', 'action_precision'], targetTier: 3 },

  // exceptional (tier 2)
  { id: 'sc-10', domainId: 'stem_competition', level: 'exceptional', text: 'USAMO winner (top 12 nationally). Selected for Mathematical Olympiad Summer Program (MOSP) training camp.', whyItWorks: 'USAMO winner is the top tier of US math competition. MOSP selection confirms national-level recognition.', demonstratesDimensions: ['evidence_of_impact', 'differentiation'], targetTier: 2 },
  { id: 'sc-11', domainId: 'stem_competition', level: 'exceptional', text: 'USACO Platinum division. Ranked top 100 nationally. Authored 5 editorial solutions published on USACO website.', whyItWorks: 'USACO Platinum is the highest division. Published editorials show the student teaches others, not just competes.', demonstratesDimensions: ['evidence_of_impact', 'differentiation', 'quantification'], targetTier: 2 },
  { id: 'sc-12', domainId: 'stem_competition', level: 'exceptional', text: 'ISEF finalist. Developed novel algorithm for protein folding prediction, awarded 3rd in Computational Biology.', whyItWorks: 'ISEF is the premier international science fair. Category placement validates novel research contribution.', demonstratesDimensions: ['evidence_of_impact', 'differentiation', 'action_precision'], targetTier: 2 },

  // extraordinary (tier 1)
  { id: 'sc-13', domainId: 'stem_competition', level: 'extraordinary', text: 'IMO silver medalist representing the US. One of 6 students selected from 300,000+ AMC participants.', whyItWorks: 'IMO medal is the pinnacle of math competition worldwide. Selection ratio quantifies the extraordinary achievement.', demonstratesDimensions: ['evidence_of_impact', 'differentiation', 'quantification'], targetTier: 1 },
  { id: 'sc-14', domainId: 'stem_competition', level: 'extraordinary', text: 'IOI gold medalist. Contributed accepted solution to an open combinatorics problem published in a math journal.', whyItWorks: 'IOI gold is the top of international computing. Journal publication shows the student advances the field itself.', demonstratesDimensions: ['evidence_of_impact', 'differentiation', 'role_ownership'], targetTier: 1 },
  { id: 'sc-15', domainId: 'stem_competition', level: 'extraordinary', text: 'IPhO bronze medalist. Research on quantum optics presented at American Physical Society annual meeting.', whyItWorks: 'IPhO medal places the student among the worlds best physics students. APS presentation validates research depth.', demonstratesDimensions: ['evidence_of_impact', 'differentiation', 'action_precision'], targetTier: 1 },

  // additional
  { id: 'sc-16', domainId: 'stem_competition', level: 'notable', text: 'USAPhO semifinalist. Tutored 8 classmates in AP Physics C, with all 8 earning 5s on the AP exam.', whyItWorks: 'USAPhO semifinal is a strong signal. Tutoring impact with perfect AP scores shows depth and mentorship.', demonstratesDimensions: ['evidence_of_impact', 'quantification', 'role_ownership'], targetTier: 4 },
  { id: 'sc-17', domainId: 'stem_competition', level: 'impressive', text: 'MATHCOUNTS State competition top 10 finalist. Captain of team that placed 3rd at state competition.', whyItWorks: 'State-level MATHCOUNTS top 10 is highly competitive. Team result adds a leadership dimension.', demonstratesDimensions: ['evidence_of_impact', 'role_ownership', 'quantification'], targetTier: 3 },
  { id: 'sc-18', domainId: 'stem_competition', level: 'exceptional', text: 'USABO finalist (top 20 nationally). Invited to Biology Olympiad training camp at university research lab.', whyItWorks: 'USABO top 20 is the selection pool for the international team. Training camp invitation is elite validation.', demonstratesDimensions: ['evidence_of_impact', 'differentiation'], targetTier: 2 },

  // ── entrepreneurship (18 exemplars) ──────────────────────────────────

  // baseline (tier 5-6)
  { id: 'en-01', domainId: 'entrepreneurship', level: 'baseline', text: 'Sold handmade jewelry at school craft fairs and on Etsy, earning $800 over one semester.', whyItWorks: 'Specific platform, product, and revenue. Honest about small scale but shows initiative beyond a hobby.', demonstratesDimensions: ['quantification', 'role_ownership'], targetTier: 5 },
  { id: 'en-02', domainId: 'entrepreneurship', level: 'baseline', text: 'Started a lawn care and snow removal service in my neighborhood, serving 10 regular clients each season.', whyItWorks: 'Specific service, quantified client base. Simple business but demonstrates reliability and client management.', demonstratesDimensions: ['quantification', 'role_ownership'], targetTier: 5 },
  { id: 'en-03', domainId: 'entrepreneurship', level: 'baseline', text: 'Ran a small tutoring business for middle schoolers in math and science. Earned $1,200 over 8 months.', whyItWorks: 'Revenue and duration quantified. Subject-specific tutoring shows a clear value proposition.', demonstratesDimensions: ['quantification', 'role_ownership'], targetTier: 6 },

  // notable (tier 4)
  { id: 'en-04', domainId: 'entrepreneurship', level: 'notable', text: 'Built a custom phone case business on Shopify. $6K revenue in first year with 350+ orders from 12 states.', whyItWorks: 'Named platform, quantified revenue, order count, and geographic reach. Shows real e-commerce execution.', demonstratesDimensions: ['quantification', 'evidence_of_impact', 'action_precision'], targetTier: 4 },
  { id: 'en-05', domainId: 'entrepreneurship', level: 'notable', text: 'Co-founded a campus snack delivery service. 200+ weekly orders from 3 school buildings at peak demand.', whyItWorks: 'Quantified demand across multiple locations. Co-founded signals partnership and real logistics management.', demonstratesDimensions: ['quantification', 'evidence_of_impact', 'role_ownership'], targetTier: 4 },
  { id: 'en-06', domainId: 'entrepreneurship', level: 'notable', text: 'Won 2nd place at DECA regional competition in Entrepreneurship. Pitched original business plan to judge panel.', whyItWorks: 'DECA is a recognized business competition. Regional placement validates the plan against peer competition.', demonstratesDimensions: ['evidence_of_impact', 'action_precision'], targetTier: 4 },

  // impressive (tier 3)
  { id: 'en-07', domainId: 'entrepreneurship', level: 'impressive', text: 'Launched e-commerce brand generating $30K in annual revenue. Hired 3 part-time student employees.', whyItWorks: '$30K revenue is a real business, not a hobby. Hiring employees shows operational maturity and management skill.', demonstratesDimensions: ['quantification', 'evidence_of_impact', 'role_ownership'], targetTier: 3 },
  { id: 'en-08', domainId: 'entrepreneurship', level: 'impressive', text: 'Won DECA International Career Development Conference in Entrepreneurship Innovation Plan event.', whyItWorks: 'DECA ICDC is the national championship level. International competition win validates business thinking.', demonstratesDimensions: ['evidence_of_impact', 'differentiation'], targetTier: 3 },
  { id: 'en-09', domainId: 'entrepreneurship', level: 'impressive', text: 'Founded social enterprise selling fair-trade products. Partnered with 4 artisan cooperatives in Guatemala.', whyItWorks: 'International supply chain with social mission. Partnership with real cooperatives shows execution beyond ideas.', demonstratesDimensions: ['evidence_of_impact', 'role_ownership', 'differentiation'], targetTier: 3 },

  // exceptional (tier 2)
  { id: 'en-10', domainId: 'entrepreneurship', level: 'exceptional', text: 'Built SaaS product with $120K ARR and 500+ paying users. Raised $50K seed round from angel investors.', whyItWorks: 'Six-figure ARR + outside investment = real business validation. 500+ paying users proves product-market fit.', demonstratesDimensions: ['quantification', 'evidence_of_impact', 'differentiation'], targetTier: 2 },
  { id: 'en-11', domainId: 'entrepreneurship', level: 'exceptional', text: 'Won FBLA National Leadership Conference in Business Plan. Product adopted by 2 school districts for use.', whyItWorks: 'FBLA national win is top-tier validation. District adoption means adults chose this over commercial alternatives.', demonstratesDimensions: ['evidence_of_impact', 'differentiation', 'role_ownership'], targetTier: 2 },
  { id: 'en-12', domainId: 'entrepreneurship', level: 'exceptional', text: 'Launched nonprofit connecting surplus restaurant food to shelters. Diverted 15,000 lbs of food in 10 months.', whyItWorks: 'Quantified systemic impact on food waste. 15,000 lbs in 10 months shows sustained operational execution.', demonstratesDimensions: ['quantification', 'evidence_of_impact', 'role_ownership'], targetTier: 2 },

  // extraordinary (tier 1)
  { id: 'en-13', domainId: 'entrepreneurship', level: 'extraordinary', text: 'YC-backed startup at age 17. App reached 50,000 users in 6 months, featured in TechCrunch and Forbes 30U30.', whyItWorks: 'Y Combinator acceptance rate is ~1.5%. Major media features + rapid user growth prove exceptional execution.', demonstratesDimensions: ['evidence_of_impact', 'differentiation', 'quantification'], targetTier: 1 },
  { id: 'en-14', domainId: 'entrepreneurship', level: 'extraordinary', text: 'Founded ed-tech company acquired by a publicly traded firm for mid-six figures while still in high school.', whyItWorks: 'Acquisition by a public company is the ultimate business validation. Exit while in HS is virtually unheard of.', demonstratesDimensions: ['evidence_of_impact', 'differentiation', 'role_ownership'], targetTier: 1 },
  { id: 'en-15', domainId: 'entrepreneurship', level: 'extraordinary', text: 'Built marketplace platform processing $500K in transactions annually. Featured in Wired and Wall Street Journal.', whyItWorks: 'Half-million in GMV signals real economic activity. Tier-1 media coverage provides independent validation.', demonstratesDimensions: ['quantification', 'evidence_of_impact', 'differentiation'], targetTier: 1 },

  // additional
  { id: 'en-16', domainId: 'entrepreneurship', level: 'notable', text: 'Created a print-on-demand clothing line supporting ocean conservation. Donated 20% of $8K revenue to Surfrider.', whyItWorks: 'Revenue quantified with a clear social mission. Named nonprofit adds credibility to the charitable component.', demonstratesDimensions: ['quantification', 'evidence_of_impact', 'role_ownership'], targetTier: 4 },
  { id: 'en-17', domainId: 'entrepreneurship', level: 'impressive', text: 'Developed mobile app for local restaurant ordering. 12 restaurants onboarded, processing 400+ orders monthly.', whyItWorks: 'Multi-vendor marketplace shows B2B sales ability. Order volume proves product-market fit at a local scale.', demonstratesDimensions: ['quantification', 'evidence_of_impact', 'action_precision'], targetTier: 3 },
  { id: 'en-18', domainId: 'entrepreneurship', level: 'exceptional', text: 'Selected for Thiel Fellowship semifinal. Patent pending on novel water filtration device for developing regions.', whyItWorks: 'Thiel Fellowship semifinal is extremely selective. Patent filing shows genuine innovation, not just an idea.', demonstratesDimensions: ['differentiation', 'evidence_of_impact', 'role_ownership'], targetTier: 2 },

  // ── work_employment (18 exemplars) ───────────────────────────────────

  // baseline (tier 5-6)
  { id: 'we-01', domainId: 'work_employment', level: 'baseline', text: 'Cashier at local grocery store for 15 hours per week during junior year. Handled $2K+ in daily transactions.', whyItWorks: 'Specific role, employer type, hours, and quantified responsibility. Honest about the scope of a typical HS job.', demonstratesDimensions: ['role_ownership', 'quantification'], targetTier: 5 },
  { id: 'we-02', domainId: 'work_employment', level: 'baseline', text: 'Barista at Starbucks for 8 months. Memorized 40+ drink recipes and consistently met drive-through time goals.', whyItWorks: 'Named employer, duration, and specific competencies. Shows reliability and attention to detail in fast-paced work.', demonstratesDimensions: ['role_ownership', 'action_precision'], targetTier: 5 },
  { id: 'we-03', domainId: 'work_employment', level: 'baseline', text: 'Lifeguard at community pool for 2 summers. Completed Red Cross certification and supervised 50+ swimmers daily.', whyItWorks: 'Certification adds credibility. Quantified supervisory scope shows genuine responsibility for safety.', demonstratesDimensions: ['role_ownership', 'quantification'], targetTier: 6 },

  // notable (tier 4)
  { id: 'we-04', domainId: 'work_employment', level: 'notable', text: 'Promoted to shift lead at Chick-fil-A within 6 months. Managed a team of 8 during evening rush periods.', whyItWorks: 'Rapid promotion signals recognized competence. Team management at a named chain adds verifiable leadership.', demonstratesDimensions: ['role_ownership', 'evidence_of_impact', 'quantification'], targetTier: 4 },
  { id: 'we-05', domainId: 'work_employment', level: 'notable', text: 'Trained 12 new hires at Target over 1 year. Created a quick-reference onboarding guide adopted store-wide.', whyItWorks: 'Training responsibility + self-initiated process improvement. Store-wide adoption shows real organizational impact.', demonstratesDimensions: ['role_ownership', 'evidence_of_impact', 'quantification'], targetTier: 4 },
  { id: 'we-06', domainId: 'work_employment', level: 'notable', text: 'Managed social media for family restaurant, growing Instagram following from 200 to 2,500 in 8 months.', whyItWorks: 'Quantified growth (12x) in a defined timeframe. Marketing skill applied to a real business with measurable results.', demonstratesDimensions: ['quantification', 'evidence_of_impact', 'action_precision'], targetTier: 4 },

  // impressive (tier 3)
  { id: 'we-07', domainId: 'work_employment', level: 'impressive', text: 'Software engineering intern at a Series B startup. Shipped 3 features to production used by 10,000+ users.', whyItWorks: 'Real engineering internship with shipped production code. User count provides tangible impact measurement.', demonstratesDimensions: ['evidence_of_impact', 'quantification', 'action_precision'], targetTier: 3 },
  { id: 'we-08', domainId: 'work_employment', level: 'impressive', text: 'Assistant manager at family auto repair shop. Handled scheduling, inventory, and $15K monthly parts ordering.', whyItWorks: 'Management-level responsibility with P&L exposure. $15K monthly ordering shows real business operations skill.', demonstratesDimensions: ['role_ownership', 'quantification', 'action_precision'], targetTier: 3 },
  { id: 'we-09', domainId: 'work_employment', level: 'impressive', text: 'Research intern at university hospital lab. Co-authored poster presented at regional medical conference.', whyItWorks: 'Hospital research internship + conference poster shows intellectual contribution beyond data entry tasks.', demonstratesDimensions: ['evidence_of_impact', 'differentiation', 'role_ownership'], targetTier: 3 },

  // exceptional (tier 2)
  { id: 'we-10', domainId: 'work_employment', level: 'exceptional', text: 'Summer intern at Google. Built internal tool adopted by 3 engineering teams, reducing deploy time by 20%.', whyItWorks: 'FAANG internship in HS is extremely rare. Quantified impact on real engineering workflows proves contribution.', demonstratesDimensions: ['evidence_of_impact', 'quantification', 'differentiation'], targetTier: 2 },
  { id: 'we-11', domainId: 'work_employment', level: 'exceptional', text: 'Managed a team of 15 at family construction business. Oversaw $200K renovation project from bid to completion.', whyItWorks: '$200K project management with a 15-person crew is executive-level responsibility. Bid-to-completion shows full cycle.', demonstratesDimensions: ['role_ownership', 'quantification', 'evidence_of_impact'], targetTier: 2 },
  { id: 'we-12', domainId: 'work_employment', level: 'exceptional', text: 'Data science intern at NASA JPL. Developed visualization pipeline used in Mars rover mission planning.', whyItWorks: 'NASA JPL internship is world-class. Contribution to an active space mission is a uniquely verifiable impact.', demonstratesDimensions: ['differentiation', 'evidence_of_impact', 'action_precision'], targetTier: 2 },

  // extraordinary (tier 1)
  { id: 'we-13', domainId: 'work_employment', level: 'extraordinary', text: 'Interned at two FAANG companies in consecutive summers. Filed patent for ML feature used in production.', whyItWorks: 'Multiple FAANG internships + patent filing demonstrates repeated elite-level selection and original contribution.', demonstratesDimensions: ['evidence_of_impact', 'differentiation', 'role_ownership'], targetTier: 1 },
  { id: 'we-14', domainId: 'work_employment', level: 'extraordinary', text: 'Founded and ran catering operation grossing $180K annually, employing 8 staff for events up to 200 guests.', whyItWorks: 'Six-figure revenue + employees + scale of operations. This is a full-scale business, not a student side hustle.', demonstratesDimensions: ['quantification', 'evidence_of_impact', 'role_ownership'], targetTier: 1 },
  { id: 'we-15', domainId: 'work_employment', level: 'extraordinary', text: 'Youngest analyst hired at a hedge fund. Built quantitative models managing a $2M paper trading portfolio.', whyItWorks: 'Professional finance role at HS age is exceptional. Quantified portfolio responsibility shows real trust and impact.', demonstratesDimensions: ['differentiation', 'quantification', 'evidence_of_impact'], targetTier: 1 },

  // additional
  { id: 'we-16', domainId: 'work_employment', level: 'notable', text: 'Camp counselor for 3 summers at YMCA. Promoted to lead counselor supervising 6 staff and 40 campers daily.', whyItWorks: 'Multi-year commitment with clear promotion trajectory. Dual supervision (staff + campers) shows leadership growth.', demonstratesDimensions: ['role_ownership', 'quantification', 'evidence_of_impact'], targetTier: 4 },
  { id: 'we-17', domainId: 'work_employment', level: 'impressive', text: 'Marketing intern at local tech company. Designed email campaign that increased click-through rate by 35%.', whyItWorks: 'Specific marketing contribution with quantified business outcome. 35% improvement is a meaningful metric.', demonstratesDimensions: ['evidence_of_impact', 'quantification', 'action_precision'], targetTier: 3 },
  { id: 'we-18', domainId: 'work_employment', level: 'exceptional', text: 'Summer intern at SpaceX. Contributed to propulsion testing documentation reviewed by senior engineering team.', whyItWorks: 'SpaceX internship at HS level is extraordinarily selective. Propulsion testing involvement shows real engineering work.', demonstratesDimensions: ['differentiation', 'evidence_of_impact', 'action_precision'], targetTier: 2 },

  // ── leadership_government (18 exemplars) ────────────────────────────────

  // baseline (tier 5-6)
  { id: 'lg-01', domainId: 'leadership_government', level: 'baseline', text: 'Served as sophomore class representative, attending weekly student council meetings for one school year.', whyItWorks: 'Specifies role, meeting cadence, and duration — honest about scope of a standard elected position.', demonstratesDimensions: ['role_ownership'], targetTier: 5 },
  { id: 'lg-02', domainId: 'leadership_government', level: 'baseline', text: 'Member of Model United Nations club for 2 years. Attended 3 local conferences representing assigned countries.', whyItWorks: 'Names the activity, duration, and conference count — shows consistent participation without inflating the role.', demonstratesDimensions: ['role_ownership', 'quantification'], targetTier: 6 },
  { id: 'lg-03', domainId: 'leadership_government', level: 'baseline', text: 'Volunteered for local city council campaign, canvassing 4 weekends and distributing flyers to 200+ homes.', whyItWorks: 'Specific timeframe and reach. Canvassing is common but the quantification shows genuine effort.', demonstratesDimensions: ['quantification', 'action_precision'], targetTier: 5 },

  // notable (tier 4)
  { id: 'lg-04', domainId: 'leadership_government', level: 'notable', text: 'President of 85-member Key Club chapter. Organized 12 service events logging 1,400+ collective volunteer hours.', whyItWorks: 'Club size, event count, and aggregate hours show real organizational capacity beyond a title.', demonstratesDimensions: ['role_ownership', 'quantification', 'evidence_of_impact'], targetTier: 4 },
  { id: 'lg-05', domainId: 'leadership_government', level: 'notable', text: 'Led student government committee that planned homecoming week for 1,800-student school, managing $4K budget.', whyItWorks: 'Budget management and school-wide impact. AOs see real logistical responsibility, not just a title.', demonstratesDimensions: ['role_ownership', 'quantification', 'action_precision'], targetTier: 4 },
  { id: 'lg-06', domainId: 'leadership_government', level: 'notable', text: 'Head delegate of school Model UN team. Won Best Delegate at 2 regional conferences representing 15-person team.', whyItWorks: 'External competitive validation plus team leadership. Two awards shows consistency, not a one-off win.', demonstratesDimensions: ['differentiation', 'role_ownership', 'quantification'], targetTier: 4 },

  // impressive (tier 3)
  { id: 'lg-07', domainId: 'leadership_government', level: 'impressive', text: 'Student body president of 2,200-student school. Negotiated new open-campus lunch policy with administration.', whyItWorks: 'School-wide elected role plus a concrete policy outcome. AOs value tangible change over titles.', demonstratesDimensions: ['role_ownership', 'evidence_of_impact', 'differentiation'], targetTier: 3 },
  { id: 'lg-08', domainId: 'leadership_government', level: 'impressive', text: 'Selected as one of 2 delegates from state to attend Boys State. Elected to mock state legislature judiciary role.', whyItWorks: 'Boys State selection is externally validated and competitive. Election within the program compounds selectivity.', demonstratesDimensions: ['differentiation', 'role_ownership'], targetTier: 3 },
  { id: 'lg-09', domainId: 'leadership_government', level: 'impressive', text: 'Founded Youth Voter Registration Initiative. Registered 340 first-time voters across 8 high schools in our county.', whyItWorks: 'Created something new with measurable multi-school impact. 340 registrations is a verifiable civic outcome.', demonstratesDimensions: ['evidence_of_impact', 'quantification', 'action_precision'], targetTier: 3 },

  // exceptional (tier 2)
  { id: 'lg-10', domainId: 'leadership_government', level: 'exceptional', text: 'State president of Junior State of America chapter network. Managed 22 chapters and 1,100+ members statewide.', whyItWorks: 'State-level leadership of recognized org with concrete scope numbers. Managing 22 chapters is executive-level work.', demonstratesDimensions: ['role_ownership', 'quantification', 'evidence_of_impact'], targetTier: 2 },
  { id: 'lg-11', domainId: 'leadership_government', level: 'exceptional', text: 'Organized campaign for school board candidate who won election. Managed 30 volunteers and ran social media strategy.', whyItWorks: 'Real political campaign with a winning outcome. Volunteer management and strategy show operational leadership.', demonstratesDimensions: ['evidence_of_impact', 'action_precision', 'quantification'], targetTier: 2 },
  { id: 'lg-12', domainId: 'leadership_government', level: 'exceptional', text: 'Appointed to city Youth Advisory Board by mayor. Co-authored transit equity report adopted by city council.', whyItWorks: 'Mayoral appointment is external validation. Co-authoring adopted policy shows real governance impact.', demonstratesDimensions: ['differentiation', 'evidence_of_impact', 'action_precision'], targetTier: 2 },

  // extraordinary (tier 1)
  { id: 'lg-13', domainId: 'leadership_government', level: 'extraordinary', text: 'Selected as 1 of 2 state delegates to Boys Nation in Washington, D.C. Met with US senators on education policy.', whyItWorks: 'Boys Nation is one of the most selective HS civic programs nationally. Senate meetings show policy-level access.', demonstratesDimensions: ['differentiation', 'role_ownership'], targetTier: 1 },
  { id: 'lg-14', domainId: 'leadership_government', level: 'extraordinary', text: 'Founded statewide youth political org with 14 chapters across 9 counties. Testified before state legislature twice.', whyItWorks: 'Building a multi-county org from scratch is rare. Legislative testimony shows institutional-level civic impact.', demonstratesDimensions: ['evidence_of_impact', 'quantification', 'differentiation'], targetTier: 1 },
  { id: 'lg-15', domainId: 'leadership_government', level: 'extraordinary', text: 'National winner, United States Senate Youth Program. Received $10K scholarship and week in Washington with senators.', whyItWorks: 'USSYP selects 2 per state — 104 nationally. Named scholarship with DC immersion is unmistakable validation.', demonstratesDimensions: ['differentiation', 'role_ownership'], targetTier: 1 },

  // additional
  { id: 'lg-16', domainId: 'leadership_government', level: 'notable', text: 'Vice president of school debate team. Led practice sessions and coached 8 novice debaters to their first wins.', whyItWorks: 'Mentorship of newer members shows leadership beyond personal success. Specific coaching outcomes are tangible.', demonstratesDimensions: ['role_ownership', 'evidence_of_impact', 'quantification'], targetTier: 4 },
  { id: 'lg-17', domainId: 'leadership_government', level: 'impressive', text: 'Organized district-wide climate action rally with 600 attendees. Secured 3 local sponsors and media coverage.', whyItWorks: 'Multi-school event with attendance figures, sponsors, and press coverage — three forms of external validation.', demonstratesDimensions: ['evidence_of_impact', 'quantification', 'action_precision'], targetTier: 3 },
  { id: 'lg-18', domainId: 'leadership_government', level: 'exceptional', text: 'Elected governor at American Legion Boys State. Led mock cabinet of 12 on statewide policy simulation.', whyItWorks: 'Governor is the top elected role at Boys State. Cabinet leadership adds executive management evidence.', demonstratesDimensions: ['differentiation', 'role_ownership', 'quantification'], targetTier: 2 },

  // ── medical_health (18 exemplars) ───────────────────────────────────────

  // baseline (tier 5-6)
  { id: 'mh-01', domainId: 'medical_health', level: 'baseline', text: 'Volunteered at hospital gift shop for 60 hours over summer, assisting patients and restocking supplies.', whyItWorks: 'Honest about the limited clinical scope. Hour count and specific tasks show commitment without inflation.', demonstratesDimensions: ['role_ownership', 'quantification'], targetTier: 5 },
  { id: 'mh-02', domainId: 'medical_health', level: 'baseline', text: 'Shadowed pediatrician for 40 hours over 2 months. Observed patient exams and learned charting procedures.', whyItWorks: 'Specifies specialty, duration, and what was actually observed. Does not overclaim involvement.', demonstratesDimensions: ['action_precision', 'quantification'], targetTier: 6 },
  { id: 'mh-03', domainId: 'medical_health', level: 'baseline', text: 'Participated in school health fair as blood pressure screening volunteer. Trained by school nurse on equipment.', whyItWorks: 'Names the specific task and training. Honest about a single-event role without inflating it.', demonstratesDimensions: ['action_precision', 'role_ownership'], targetTier: 5 },

  // notable (tier 4)
  { id: 'mh-04', domainId: 'medical_health', level: 'notable', text: 'Regular ER volunteer for 18 months, logging 220+ hours. CPR and First Aid certified through Red Cross.', whyItWorks: 'Long-term commitment in a demanding setting. Red Cross certification adds external credential validation.', demonstratesDimensions: ['quantification', 'role_ownership', 'differentiation'], targetTier: 4 },
  { id: 'mh-05', domainId: 'medical_health', level: 'notable', text: 'Founded health education club at school. Led weekly sessions teaching 30 students CPR, nutrition, and first aid.', whyItWorks: 'Club founding shows initiative. Weekly cadence with specific topics and audience size proves sustained effort.', demonstratesDimensions: ['role_ownership', 'evidence_of_impact', 'quantification'], targetTier: 4 },
  { id: 'mh-06', domainId: 'medical_health', level: 'notable', text: 'Volunteered 200+ hours at nursing home. Led weekly art therapy sessions for 15 residents with dementia.', whyItWorks: 'Art therapy with dementia patients is specialized care. Hour count and resident population give clear scope.', demonstratesDimensions: ['quantification', 'action_precision', 'evidence_of_impact'], targetTier: 4 },

  // impressive (tier 3)
  { id: 'mh-07', domainId: 'medical_health', level: 'impressive', text: 'EMT-Basic certified at 17. Completed 180-hour training and 48-hour clinical rotation at county fire station.', whyItWorks: 'EMT-B certification at 17 is rare and externally validated. Training hours and clinical specifics show rigor.', demonstratesDimensions: ['differentiation', 'quantification', 'action_precision'], targetTier: 3 },
  { id: 'mh-08', domainId: 'medical_health', level: 'impressive', text: 'Clinical research assistant in university oncology lab. Processed 120+ tissue samples for immunotherapy study.', whyItWorks: 'University lab placement shows competitive selection. Specific technique and sample count demonstrate real work.', demonstratesDimensions: ['action_precision', 'quantification', 'differentiation'], targetTier: 3 },
  { id: 'mh-09', domainId: 'medical_health', level: 'impressive', text: 'Founded free mental health peer counseling program serving 45 students weekly. Trained 12 peer counselors.', whyItWorks: 'Created a new program addressing real need. Weekly reach and counselor count show sustainable impact.', demonstratesDimensions: ['evidence_of_impact', 'quantification', 'role_ownership'], targetTier: 3 },

  // exceptional (tier 2)
  { id: 'mh-10', domainId: 'medical_health', level: 'exceptional', text: 'Active EMT with 500+ emergency calls over 2 years. Recognized by fire chief for response during multi-car pileup.', whyItWorks: 'Call volume proves sustained real-world impact. Chief recognition during a major incident is powerful external validation.', demonstratesDimensions: ['quantification', 'evidence_of_impact', 'differentiation'], targetTier: 2 },
  { id: 'mh-11', domainId: 'medical_health', level: 'exceptional', text: 'Co-authored case report on rare pediatric condition with attending physician. Submitted to Journal of Pediatrics.', whyItWorks: 'Co-authoring a case report at HS level is exceptionally rare. Named journal and physician mentor show legitimacy.', demonstratesDimensions: ['differentiation', 'evidence_of_impact', 'action_precision'], targetTier: 2 },
  { id: 'mh-12', domainId: 'medical_health', level: 'exceptional', text: 'Led county-wide naloxone distribution initiative. Trained 200 community members and distributed 500+ kits.', whyItWorks: 'County-wide public health initiative with two quantified outcomes. Addresses opioid crisis — timely and impactful.', demonstratesDimensions: ['evidence_of_impact', 'quantification', 'role_ownership'], targetTier: 2 },

  // extraordinary (tier 1)
  { id: 'mh-13', domainId: 'medical_health', level: 'extraordinary', text: 'Published first-author paper in Journal of Adolescent Health on teen vaping cessation intervention outcomes.', whyItWorks: 'First-author publication in a peer-reviewed medical journal as a HS student is nationally exceptional.', demonstratesDimensions: ['differentiation', 'evidence_of_impact'], targetTier: 1 },
  { id: 'mh-14', domainId: 'medical_health', level: 'extraordinary', text: 'Testified before state health committee on youth mental health funding. Testimony cited in committee final report.', whyItWorks: 'Legislative testimony is rare for any age. Being cited in the official report proves institutional-level impact.', demonstratesDimensions: ['differentiation', 'evidence_of_impact', 'action_precision'], targetTier: 1 },
  { id: 'mh-15', domainId: 'medical_health', level: 'extraordinary', text: 'National winner, HOSA Future Health Professionals biomedical debate. Competed against 2,400+ students from 48 states.', whyItWorks: 'HOSA nationals is the premier HS health competition. National winner among 2,400+ is unmistakable top-tier.', demonstratesDimensions: ['differentiation', 'quantification'], targetTier: 1 },

  // additional
  { id: 'mh-16', domainId: 'medical_health', level: 'notable', text: 'Medical interpreter volunteer at free clinic, translating for 50+ Spanish-speaking patients over 8 months.', whyItWorks: 'Bilingual medical interpreting is a specialized skill. Patient count and clinic context show sustained service.', demonstratesDimensions: ['action_precision', 'quantification', 'differentiation'], targetTier: 4 },
  { id: 'mh-17', domainId: 'medical_health', level: 'impressive', text: 'Summer research intern at NIH. Analyzed fMRI brain imaging data for study on adolescent sleep patterns.', whyItWorks: 'NIH internship is highly selective for HS students. fMRI analysis is specific technical work, not just shadowing.', demonstratesDimensions: ['differentiation', 'action_precision'], targetTier: 3 },
  { id: 'mh-18', domainId: 'medical_health', level: 'exceptional', text: 'Created app connecting 800+ users to free mental health resources. Featured by local news and state health dept.', whyItWorks: 'Building a health tech tool with 800+ users shows entrepreneurial impact. Media and government notice compound it.', demonstratesDimensions: ['evidence_of_impact', 'quantification', 'differentiation'], targetTier: 2 },

  // ── arts_creative (18 exemplars) ────────────────────────────────────────

  // baseline (tier 5-6)
  { id: 'ac-01', domainId: 'arts_creative', level: 'baseline', text: 'Created portfolio of 12 oil paintings in AP Studio Art. Submitted work for AP exam portfolio evaluation.', whyItWorks: 'Names the medium, count, and context. AP exam submission is standard but shows completion and commitment.', demonstratesDimensions: ['role_ownership', 'quantification'], targetTier: 5 },
  { id: 'ac-02', domainId: 'arts_creative', level: 'baseline', text: 'Contributed 3 short stories and 2 poems to school literary magazine over 2 years as a staff writer.', whyItWorks: 'Specific piece count and duration. Staff writer role is modest but honest about the level of involvement.', demonstratesDimensions: ['role_ownership', 'quantification'], targetTier: 6 },
  { id: 'ac-03', domainId: 'arts_creative', level: 'baseline', text: 'Designed posters and social media graphics for 5 school clubs using Photoshop and Illustrator.', whyItWorks: 'Names specific tools and client count. Applied design work shows practical skills even without external awards.', demonstratesDimensions: ['action_precision', 'quantification'], targetTier: 5 },

  // notable (tier 4)
  { id: 'ac-04', domainId: 'arts_creative', level: 'notable', text: 'Earned Scholastic Art Silver Key for charcoal self-portrait series. Work displayed at regional exhibit for 2 weeks.', whyItWorks: 'Silver Key is externally juried recognition. Regional exhibition adds public display — validated beyond school.', demonstratesDimensions: ['differentiation', 'action_precision'], targetTier: 4 },
  { id: 'ac-05', domainId: 'arts_creative', level: 'notable', text: 'Editor-in-chief of school literary magazine. Reviewed 200+ submissions and published 40 student works annually.', whyItWorks: 'Top editorial role with quantified scope. Managing the full editorial pipeline shows leadership and taste.', demonstratesDimensions: ['role_ownership', 'quantification', 'evidence_of_impact'], targetTier: 4 },
  { id: 'ac-06', domainId: 'arts_creative', level: 'notable', text: 'Photography selected for regional juried art show among 600 entries. Sold 3 prints at exhibition opening.', whyItWorks: 'Juried selection from 600 entries shows competitive merit. Print sales add a market-validation dimension.', demonstratesDimensions: ['differentiation', 'quantification'], targetTier: 4 },

  // impressive (tier 3)
  { id: 'ac-07', domainId: 'arts_creative', level: 'impressive', text: 'Awarded Scholastic Art Gold Key and exhibited at state-level ceremony. Created 24-piece mixed media collection.', whyItWorks: 'Gold Key is top 1% at regional level. State exhibition and large body of work show sustained artistic practice.', demonstratesDimensions: ['differentiation', 'quantification'], targetTier: 3 },
  { id: 'ac-08', domainId: 'arts_creative', level: 'impressive', text: 'Published creative nonfiction essay in regional literary journal with 5,000+ readership. Selected from 800 entries.', whyItWorks: 'External publication with readership data and acceptance rate. Regional journal validates quality beyond school.', demonstratesDimensions: ['differentiation', 'evidence_of_impact', 'quantification'], targetTier: 3 },
  { id: 'ac-09', domainId: 'arts_creative', level: 'impressive', text: 'Organized solo art exhibition at local gallery. Displayed 30 works, sold 8 pieces, and donated proceeds to arts fund.', whyItWorks: 'Solo exhibition shows curatorial initiative. Sales prove market value. Charitable donation adds community dimension.', demonstratesDimensions: ['role_ownership', 'evidence_of_impact', 'quantification'], targetTier: 3 },

  // exceptional (tier 2)
  { id: 'ac-10', domainId: 'arts_creative', level: 'exceptional', text: 'Scholastic Art American Visions nominee. Work selected for national traveling exhibition viewed by 50,000+ visitors.', whyItWorks: 'American Visions is the pinnacle of Scholastic recognition. National traveling exhibition is museum-level exposure.', demonstratesDimensions: ['differentiation', 'evidence_of_impact'], targetTier: 2 },
  { id: 'ac-11', domainId: 'arts_creative', level: 'exceptional', text: 'Creative writing published in Polyphony Lit and The Adroit Journal. Finalist in national Bennington Young Writers contest.', whyItWorks: 'Polyphony and Adroit are the most selective HS lit journals. Bennington finalist adds a second national credential.', demonstratesDimensions: ['differentiation', 'evidence_of_impact'], targetTier: 2 },
  { id: 'ac-12', domainId: 'arts_creative', level: 'exceptional', text: 'Represented by local gallery at age 16. Sold 15 original works totaling $4,200 to private collectors over 18 months.', whyItWorks: 'Gallery representation as a minor is rare. Sustained sales with dollar figures prove professional-level market demand.', demonstratesDimensions: ['differentiation', 'quantification', 'evidence_of_impact'], targetTier: 2 },

  // extraordinary (tier 1)
  { id: 'ac-13', domainId: 'arts_creative', level: 'extraordinary', text: 'Named U.S. Presidential Scholar in the Arts, one of 20 selected nationally. Exhibited at Kennedy Center in D.C.', whyItWorks: 'Presidential Scholar in the Arts is the highest HS arts honor in the U.S. Kennedy Center is the ultimate venue.', demonstratesDimensions: ['differentiation'], targetTier: 1 },
  { id: 'ac-14', domainId: 'arts_creative', level: 'extraordinary', text: 'Won Scholastic Art Gold Portfolio. National selection from 340,000+ submissions across all categories and regions.', whyItWorks: 'Gold Portfolio is the single most selective Scholastic award. The 340K submission pool makes the scale undeniable.', demonstratesDimensions: ['differentiation', 'quantification'], targetTier: 1 },
  { id: 'ac-15', domainId: 'arts_creative', level: 'extraordinary', text: 'Novel excerpt published in Best American Teen Writing anthology. Selected by panel of National Book Award judges.', whyItWorks: 'Best American anthology is a nationally recognized literary brand. NBA judge selection adds the highest literary credential.', demonstratesDimensions: ['differentiation', 'evidence_of_impact'], targetTier: 1 },

  // additional
  { id: 'ac-16', domainId: 'arts_creative', level: 'notable', text: 'Wrote and illustrated 32-page children\'s book. Self-published on Amazon and donated 50 copies to local library.', whyItWorks: 'Completing a full book shows follow-through. Self-publishing plus library donation shows initiative and community.', demonstratesDimensions: ['evidence_of_impact', 'action_precision', 'quantification'], targetTier: 4 },
  { id: 'ac-17', domainId: 'arts_creative', level: 'impressive', text: 'Designed school mural (8ft x 20ft) approved by administration. Led team of 6 artists over 3-month installation.', whyItWorks: 'Large-scale public art with administrative approval shows institutional trust. Team leadership adds management dimension.', demonstratesDimensions: ['role_ownership', 'action_precision', 'quantification'], targetTier: 3 },
  { id: 'ac-18', domainId: 'arts_creative', level: 'exceptional', text: 'Portfolio accepted into YoungArts national finalist program. Attended week-long intensive with mentoring artists.', whyItWorks: 'YoungArts selects ~700 from 10,000+ applicants. National finalist intensive is a recognized pre-professional credential.', demonstratesDimensions: ['differentiation', 'role_ownership'], targetTier: 2 },
];

// ============================================================================
// LOOKUP FUNCTIONS
// ============================================================================

/** Index exemplars by domain for O(1) access */
const DOMAIN_EXEMPLAR_INDEX: Map<string, ExemplarDescription[]> = new Map();
for (const exemplar of EXEMPLAR_LIBRARY) {
  const existing = DOMAIN_EXEMPLAR_INDEX.get(exemplar.domainId) ?? [];
  existing.push(exemplar);
  DOMAIN_EXEMPLAR_INDEX.set(exemplar.domainId, existing);
}

/**
 * Get exemplars for a domain, optionally filtered by level.
 */
export function getExemplarsForDomain(
  domainId: string,
  level?: ImpressionLevel
): ExemplarDescription[] {
  const exemplars = DOMAIN_EXEMPLAR_INDEX.get(domainId) ?? [];
  if (!level) return exemplars;
  return exemplars.filter(e => e.level === level);
}

/**
 * Find the best exemplar for teaching a student whose description is weak
 * in specific dimensions, at a target level.
 *
 * Selection priority:
 * 1. Matches the target level
 * 2. Demonstrates the most weak dimensions
 * 3. Prefers exemplars that demonstrate ALL weak dimensions over partial matches
 */
export function getBestExemplarForTeaching(
  domainId: string,
  weakDimensions: ExemplarDimension[],
  targetLevel: ImpressionLevel
): ExemplarDescription | null {
  const exemplars = getExemplarsForDomain(domainId, targetLevel);
  if (exemplars.length === 0) return null;

  let bestExemplar: ExemplarDescription | null = null;
  let bestScore = -1;

  for (const exemplar of exemplars) {
    let score = 0;
    for (const dim of weakDimensions) {
      if (exemplar.demonstratesDimensions.includes(dim)) {
        score++;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestExemplar = exemplar;
    }
  }

  return bestExemplar;
}
