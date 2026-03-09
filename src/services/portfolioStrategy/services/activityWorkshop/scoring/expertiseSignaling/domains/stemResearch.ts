/**
 * STEM Research Expertise Domain
 *
 * Covers lab research, computational research, clinical research,
 * field research, and engineering research activities.
 *
 * Key insight: Research descriptions are the #1 source of name-dropping
 * in college applications. Students list techniques and tools to sound
 * impressive, but AOs are looking for intellectual ownership — did you
 * ASK the question or just pipette the samples?
 *
 * Sources: MIT admissions blog ("What We Look For"), Stanford Research
 * Activities description guide, Sara Harberson on research padding,
 * published AO roundtable insights, NACAC 2024 survey data.
 */

import type { ExpertiseDomain } from '../types';

export const STEM_RESEARCH_DOMAIN: ExpertiseDomain = {
  domainId: 'stem_research',
  label: 'STEM Research',
  overview:
    'Lab, computational, clinical, field, and engineering research activities. ' +
    'The most name-drop-prone category in college applications. AOs look for intellectual ' +
    'ownership and genuine contribution, not technique lists. The dividing line is clear: ' +
    'did the student ASK the question, or just follow a protocol someone else designed?',

  aoExpectations: {
    whatRegisters: [
      'Evidence of a student-generated question or hypothesis, not just a mentor-assigned task',
      'Specific, quantified results that show the student understood what they found (not just that they "found results")',
      'Independent problem-solving moments: protocol failures, unexpected data, methodology pivots',
      'Duration and consistency of commitment — 2+ summers in the same lab signals genuine interest over resume building',
      'Tangible outputs: publications, conference presentations, poster sessions, or even a well-articulated null result',
      'Connection between the research and the student\'s broader intellectual narrative — why THIS question?',
    ],
    whatAOsSeeThrough: [
      'Lists of lab techniques (PCR, gel electrophoresis, Western blot) — every bio research student lists these',
      'Programming language/library name-drops without describing what was analyzed or discovered',
      'Vague "assisted with research" or "contributed to a study" without specifying the actual contribution',
      '"Published researcher" when the student is 14th author on a paper they barely contributed to',
      'Describing the PI\'s research as if it were the student\'s own project',
    ],
    goldenQuestion:
      'If I removed this student from the lab, what specific piece of knowledge would NOT exist?',
    readingTimeContext:
      'AOs spend 8-12 seconds on each activity. Research descriptions that open with ' +
      'technique lists or lab names lose 3-4 seconds to content the AO skips. Lead with ' +
      'your finding or your question, not your tools.',
    competitiveContext:
      'At selective institutions, 30-40% of applicants list research experience. ' +
      'The differentiator is never that you did research — it is WHAT you found, ' +
      'HOW you thought about it, and WHAT it means. A genuine independent project at a ' +
      'local university can outweigh a name-brand summer program if described with ' +
      'intellectual ownership.',
  },

  realExpertiseSignals: [
    {
      id: 'sr_methodology_choice',
      pattern: 'methodology_reference',
      description:
        'Student explains WHY they chose a specific methodology over alternatives, ' +
        'demonstrating decision-making rather than protocol-following.',
      whyItWorks:
        'Only someone who understood the research question deeply enough to evaluate ' +
        'methodological tradeoffs would write this way. Following a protocol requires ' +
        'no understanding; choosing one requires expertise.',
      examples: [
        'Selected confocal over widefield microscopy to resolve subcellular localization',
        'Switched from qPCR to RNA-seq when preliminary data suggested multi-gene pathway involvement',
        'Chose Bayesian over frequentist framework due to small sample size and informative priors',
      ],
      signalStrength: 'strong',
      affectsDimension: 'authenticity',
      detectionKeywords: [
        'chose', 'selected', 'switched to', 'opted for', 'instead of',
        'over', 'because', 'tradeoff', 'compared methods', 'evaluated',
      ],
    },
    {
      id: 'sr_failure_iteration',
      pattern: 'failure_learning',
      description:
        'Student references failed experiments, unexpected results, or protocol ' +
        'optimization — proving they actually went through the messy reality of research.',
      whyItWorks:
        'Students who pad their research descriptions never mention failure. ' +
        'Real researchers know that 80% of experiments fail, and the response to failure ' +
        'IS the research. Mentioning iteration is a powerful authenticity signal.',
      examples: [
        'Optimized extraction protocol after 12 failed runs — final yield 340% above initial',
        'Unexpected cytotoxicity at 48h led us to redesign the nanoparticle delivery vector',
        'Null result in initial screen prompted hypothesis revision, ultimately revealing novel pathway',
      ],
      signalStrength: 'strong',
      affectsDimension: 'authenticity',
      detectionKeywords: [
        'failed', 'unexpected', 'revised', 'optimized', 'redesigned',
        'iterated', 'troubleshoot', 'debug', 'null result', 'pivot',
        'after', 'attempts', 'runs', 'trials', 'refined',
      ],
    },
    {
      id: 'sr_specific_system',
      pattern: 'specific_biological_system',
      description:
        'Student names the specific organism, model system, dataset, or phenomenon ' +
        'they studied — not a technique, but a SUBJECT of inquiry.',
      whyItWorks:
        'Naming "zebrafish cardiac regeneration" vs "biology research" immediately ' +
        'signals depth. It shows the student can locate their work in the scientific ' +
        'landscape and cares about the question, not just the resume line.',
      examples: [
        'Zebrafish cardiac regeneration model — identified 3 novel gene candidates',
        'Arabidopsis thaliana drought response pathways using CRISPR knockouts',
        'Supernova remnant spectral analysis using Chandra X-ray Observatory archival data',
      ],
      signalStrength: 'strong',
      affectsDimension: 'specificity',
      detectionKeywords: [
        'model', 'system', 'organism', 'species', 'pathway',
        'dataset', 'population', 'sample', 'cohort', 'strain',
        'zebrafish', 'drosophila', 'arabidopsis', 'e. coli', 'c. elegans',
      ],
    },
    {
      id: 'sr_scale_indicator',
      pattern: 'scale_quantification',
      description:
        'Student quantifies the scale of their work — sample sizes, data points, ' +
        'time invested, iterations completed.',
      whyItWorks:
        'Scale communicates investment and rigor simultaneously. "Analyzed 50,000 patient records" ' +
        'tells AOs more about contribution than "performed data analysis." It is impossible ' +
        'to fabricate specific scale numbers without sounding implausible.',
      examples: [
        '50,000 patient records across 3 hospital systems',
        '142 soil samples from 12 sites over 8-month longitudinal study',
        '2,400 spectral readings processed through custom pipeline',
      ],
      signalStrength: 'strong',
      affectsDimension: 'impact',
      detectionKeywords: [
        'samples', 'records', 'patients', 'specimens', 'readings',
        'data points', 'participants', 'observations', 'sites', 'trials',
        'months', 'weeks', 'hours',
      ],
    },
    {
      id: 'sr_independent_contribution',
      pattern: 'independent_intellectual_contribution',
      description:
        'Student describes a specific contribution that was THEIRS — a hypothesis they ' +
        'proposed, an assay they designed, an analysis they conceived.',
      whyItWorks:
        'This is the single most important signal in research descriptions. It answers ' +
        'the AO\'s golden question: what would NOT exist without this student? It separates ' +
        'intellectual contributors from protocol followers.',
      examples: [
        'Designed novel fluorescence assay that reduced detection time from 4h to 45min',
        'Proposed alternative hypothesis after reviewing contradictory literature — confirmed by subsequent experiments',
        'Developed automated classification pipeline that replaced 20h/week manual review',
      ],
      signalStrength: 'strong',
      affectsDimension: 'differentiation',
      detectionKeywords: [
        'designed', 'proposed', 'developed', 'conceived', 'hypothesized',
        'my', 'I', 'novel', 'original', 'independently', 'created',
        'new approach', 'first to', 'introduced',
      ],
    },
    {
      id: 'sr_publication_specifics',
      pattern: 'publication_presentation',
      description:
        'Student references specific publication or presentation venues — not just ' +
        '"published" but where, what type, and their author position.',
      whyItWorks:
        'Publication is the currency of research. But "published researcher" is vague to the ' +
        'point of meaninglessness. A student who writes "2nd author in Journal of Biological ' +
        'Chemistry" gives AOs a verifiable, specific credential. Author position reveals ' +
        'contribution level.',
      examples: [
        'Co-first-author, submitted to Journal of Neuroscience (under review)',
        'Oral presentation at American Chemical Society regional meeting — 1 of 4 HS presenters',
        'Poster at Intel ISEF — awarded 3rd place in Microbiology category',
      ],
      signalStrength: 'strong',
      affectsDimension: 'impact',
      detectionKeywords: [
        'published', 'submitted', 'journal', 'conference', 'poster',
        'presentation', 'author', 'co-author', 'proceedings', 'review',
        'presented', 'symposium', 'abstract', 'manuscript',
      ],
    },
    {
      id: 'sr_question_articulation',
      pattern: 'research_question_ownership',
      description:
        'Student articulates the research question itself — showing they understand ' +
        'WHY the work matters, not just WHAT they did.',
      whyItWorks:
        'The ability to state a research question clearly is the hallmark of intellectual ' +
        'ownership. Students who just followed a protocol cannot articulate the driving ' +
        'question. This signal immediately separates researchers from lab helpers.',
      examples: [
        'Investigated whether microplastic concentration correlates with invertebrate species diversity in urban watersheds',
        'Tested if early-life antibiotic exposure alters gut microbiome composition through age 5',
        'Explored whether social media usage predicts sleep quality after controlling for screen brightness',
      ],
      signalStrength: 'strong',
      affectsDimension: 'authenticity',
      detectionKeywords: [
        'investigated', 'tested whether', 'explored if', 'asked whether',
        'hypothesized that', 'question', 'sought to determine', 'examined',
        'studied whether', 'aimed to understand',
      ],
    },
    {
      id: 'sr_controls_variables',
      pattern: 'experimental_design_awareness',
      description:
        'Student references controls, variables, confounders, or experimental design ' +
        'decisions — showing they understand research methodology, not just execution.',
      whyItWorks:
        'Understanding controls and confounders is what separates someone who thinks ' +
        'scientifically from someone who follows directions. A student who mentions their ' +
        'control group has internalized the logic of experimentation.',
      examples: [
        'Designed 3-arm controlled study: treatment, vehicle control, untreated baseline',
        'Controlled for socioeconomic status and geographic region in regression model',
        'Included negative controls to rule out antibody cross-reactivity',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'authenticity',
      detectionKeywords: [
        'control', 'controlled for', 'variable', 'confound', 'baseline',
        'placebo', 'blind', 'randomized', 'independent variable',
        'dependent variable', 'covariate',
      ],
    },
    {
      id: 'sr_unexpected_results',
      pattern: 'surprising_findings',
      description:
        'Student describes an unexpected or counterintuitive result and what it meant.',
      whyItWorks:
        'Unexpected results are the lifeblood of real research. A student who reports ' +
        '"surprising results" with no elaboration is faking it. One who describes WHAT was ' +
        'surprising, WHY it was unexpected, and WHAT they did about it is genuine. ' +
        'This is impossible to fabricate convincingly.',
      examples: [
        'Paradoxical increase in gene expression under stress — led to discovery of compensatory pathway',
        'Control group outperformed treatment, revealing unaccounted environmental variable',
        'Predicted linear relationship was actually logarithmic — revised model improved R-squared from 0.4 to 0.87',
      ],
      signalStrength: 'strong',
      affectsDimension: 'differentiation',
      detectionKeywords: [
        'unexpected', 'surprising', 'paradoxical', 'contrary to',
        'counterintuitive', 'revealed', 'discovered', 'overturned',
        'contradicted', 'anomalous', 'unanticipated',
      ],
    },
    {
      id: 'sr_lab_safety_context',
      pattern: 'safety_protocol_awareness',
      description:
        'Student casually references safety considerations or protocol requirements ' +
        'that reveal familiarity with the actual lab environment.',
      whyItWorks:
        'Students who write about research from a distance never mention the mundane ' +
        'realities of lab work. BSL-2 protocols, IACUC approval, IRB oversight, chemical ' +
        'safety — these casual references prove the student was physically present and ' +
        'engaged with the real constraints of research.',
      examples: [
        'After IRB approval, recruited 45 participants for cognitive task battery',
        'Maintained BSL-2 protocols while working with live pathogen cultures',
        'IACUC-approved behavioral study; personally performed 200+ mouse surgeries',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'authenticity',
      detectionKeywords: [
        'IRB', 'IACUC', 'BSL', 'safety', 'protocol', 'approved',
        'oversight', 'compliance', 'training', 'certification',
        'biosafety', 'hazard', 'PPE',
      ],
    },
    {
      id: 'sr_data_interpretation',
      pattern: 'analytical_depth',
      description:
        'Student describes how they interpreted data, not just that they "analyzed" it. ' +
        'References specific statistical methods, visualization approaches, or analytical frameworks.',
      whyItWorks:
        'Saying "performed statistical analysis" is meaningless — it is the research ' +
        'equivalent of saying "used a computer." Specifying "ran mixed-effects ANOVA ' +
        'to account for nested observations" demonstrates genuine analytical skill.',
      examples: [
        'Applied Cox proportional hazards model to identify 3 independent predictors of recurrence',
        'Used principal component analysis to reduce 47 variables to 6 meaningful dimensions',
        'Developed bootstrapped confidence intervals due to non-normal distribution of residuals',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'specificity',
      detectionKeywords: [
        'regression', 'ANOVA', 'p-value', 'significance', 'confidence interval',
        'effect size', 'correlation', 'R-squared', 'model', 'predicted',
        'bootstrap', 'PCA', 'clustering',
      ],
    },
    {
      id: 'sr_mentor_relationship',
      pattern: 'mentor_collaboration_dynamic',
      description:
        'Student describes the nature of their relationship with their research mentor ' +
        'in a way that reveals genuine intellectual exchange, not just assignment-following.',
      whyItWorks:
        'AOs know that the best research experiences involve genuine mentorship. A student ' +
        'who writes "met weekly with PI to discuss results and next steps" signals a real ' +
        'working relationship. One who writes "worked under Dr. X" signals hierarchy only.',
      examples: [
        'Weekly meetings with PI evolved from receiving protocols to proposing experiments',
        'Collaboratively designed study with graduate student mentor; I led the data collection arm',
        'PI invited me to co-present at lab group meeting after my analysis found novel result',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'authenticity',
      detectionKeywords: [
        'mentor', 'PI', 'advisor', 'collaborat', 'discussed', 'proposed to',
        'weekly', 'meeting', 'co-', 'worked with', 'guided by',
      ],
    },
    {
      id: 'sr_literature_engagement',
      pattern: 'literature_connection',
      description:
        'Student connects their work to the broader literature — showing they read and ' +
        'understood the context for their research.',
      whyItWorks:
        'Most high school researchers cannot name a single paper relevant to their work. ' +
        'A student who writes "our findings contradicted Smith et al. 2022" or "built on ' +
        'the framework proposed in recent Nature paper" shows genuine engagement with the ' +
        'scientific community.',
      examples: [
        'Findings contradicted established model (Johnson et al., 2019) — submitted response paper',
        'Extended methodology from recent Cell paper to novel tissue type',
        'Literature review of 40+ papers identified gap our project addressed',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'differentiation',
      detectionKeywords: [
        'literature', 'paper', 'study', 'et al', 'published',
        'findings', 'prior work', 'gap', 'novel', 'extended',
        'contradicted', 'built on', 'framework',
      ],
    },
    {
      id: 'sr_continuation_commitment',
      pattern: 'longitudinal_commitment',
      description:
        'Student demonstrates sustained commitment to research over multiple semesters ' +
        'or years, showing genuine interest rather than resume building.',
      whyItWorks:
        'Summer research programs are a dime a dozen. Continuing research during the school ' +
        'year, returning to the same lab, or extending a project across 2+ years tells AOs ' +
        'the student cares about the QUESTION, not the credential.',
      examples: [
        '3 semesters in same lab; project evolved from assigned protocol to independent study',
        'Continued research through school year — 10 hrs/week alongside full course load',
        'Returned for 2nd summer to follow up on my first-year findings',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'authenticity',
      detectionKeywords: [
        'semester', 'year', 'continued', 'returned', 'ongoing',
        'longitudinal', 'extended', 'follow-up', 'hrs/week', 'school year',
      ],
    },
  ],

  nameDropTraps: [
    {
      id: 'sr_python_stack',
      pattern: 'Python/pandas/NumPy/scikit-learn',
      whyStudentsUseIt:
        'Students believe listing programming tools demonstrates technical sophistication. ' +
        'College counselors sometimes encourage it. Tech-savvy students especially conflate ' +
        '"tools I used" with "skills I have."',
      whyItFails:
        'AOs are not engineers. "Python/pandas" means nothing to them — it is like writing ' +
        '"used Microsoft Word" for an essay activity. The tools are invisible to the reader. ' +
        'What matters is WHAT you analyzed and WHAT you found. Every character spent on ' +
        'tool names is a character NOT spent on impact.',
      betterAlternative:
        'Replace tool names with the OUTCOME they enabled. "Used Python to analyze data" ' +
        'becomes "Identified 3 biomarkers predicting treatment resistance." The tool is ' +
        'implied by the sophistication of the output.',
      example: {
        nameDrop:
          'Used Python, pandas, and scikit-learn to analyze genomic data and build predictive models',
        improved:
          'Built classifier predicting antibiotic resistance from genomic markers — 94% accuracy across 12,000 samples',
        whatChanged:
          'Removed 30 characters of tool names. Added specific outcome (94% accuracy), ' +
          'scale (12,000 samples), and domain context (antibiotic resistance). AO now ' +
          'understands WHAT was achieved, not what software was open.',
      },
      prevalence: 'very_common',
      typicalCharWaste: 30,
      detectionKeywords: [
        'python', 'pandas', 'numpy', 'scikit-learn', 'sklearn',
        'matplotlib', 'jupyter', 'tensorflow', 'pytorch', 'scipy',
        'programming', 'coded in', 'wrote scripts',
      ],
    },
    {
      id: 'sr_crispr',
      pattern: 'CRISPR-Cas9',
      whyStudentsUseIt:
        'CRISPR is famous and sounds cutting-edge. Students assume naming it signals ' +
        'they worked at the frontier of science. Parents and counselors are impressed by it.',
      whyItFails:
        'CRISPR is now a standard tool in molecular biology labs — it is like listing ' +
        '"used a microscope." AOs at selective schools see CRISPR in hundreds of applications. ' +
        'The 10 characters spent on "CRISPR-Cas9" could describe WHAT GENE was edited ' +
        'and WHY, which is the actual interesting part.',
      betterAlternative:
        'Name the gene, pathway, or organism you modified and the scientific purpose. ' +
        '"Used CRISPR to edit genes" becomes "Knocked out tumor suppressor p53 in zebrafish ' +
        'to model early carcinogenesis."',
      example: {
        nameDrop:
          'Used CRISPR-Cas9 gene editing technology to study cancer genetics in the lab',
        improved:
          'Knocked out 3 tumor suppressor genes in zebrafish; identified novel p53-independent growth pathway',
        whatChanged:
          'Replaced technique name with specific genes (tumor suppressors), organism ' +
          '(zebrafish), and finding (novel pathway). The reader now knows the SCIENCE, ' +
          'not just the technique.',
      },
      prevalence: 'common',
      typicalCharWaste: 10,
      detectionKeywords: [
        'crispr', 'cas9', 'gene editing', 'gene edit', 'genome editing',
      ],
    },
    {
      id: 'sr_machine_learning',
      pattern: 'Machine learning model / ML algorithm',
      whyStudentsUseIt:
        'Machine learning sounds impressive and cutting-edge. Students believe it signals ' +
        'technical sophistication. The term has cultural cachet beyond the technical community.',
      whyItFails:
        '"Built a machine learning model" tells AOs nothing. What problem? What data? ' +
        'What accuracy? A random forest on Kaggle data and a novel neural architecture for ' +
        'medical imaging both get described as "machine learning." AOs cannot distinguish them.',
      betterAlternative:
        'Name the PROBLEM the model solved, the DATA it used, and the PERFORMANCE it achieved. ' +
        'The specific ML technique is irrelevant to the reader — the outcome is everything.',
      example: {
        nameDrop:
          'Developed machine learning models using neural networks to predict patient outcomes',
        improved:
          'Predicted post-surgical complications 72hrs early — 91% sensitivity across 8,400 patient records',
        whatChanged:
          'Removed generic "machine learning" and "neural networks." Added prediction ' +
          'window (72hrs), performance metric (91% sensitivity), and scale (8,400 records). ' +
          'AO now understands real-world value.',
      },
      prevalence: 'very_common',
      typicalCharWaste: 25,
      detectionKeywords: [
        'machine learning', 'ML', 'neural network', 'deep learning',
        'AI model', 'algorithm', 'trained a model', 'random forest',
        'classification model', 'regression model',
      ],
    },
    {
      id: 'sr_pcr_gel',
      pattern: 'PCR / gel electrophoresis / Western blot',
      whyStudentsUseIt:
        'These are the first techniques students learn in a lab. Listing them feels like ' +
        'proof of real lab experience. Biology teachers often emphasize these as "real science."',
      whyItFails:
        'Every biology research student in the country lists these. They are standard ' +
        'techniques taught in AP Biology labs. Listing them is like a writer listing ' +
        '"typed on keyboard." AOs see them as filler that reveals nothing unique.',
      betterAlternative:
        'Replace technique names with the QUESTION they helped answer. "Performed PCR ' +
        'and gel electrophoresis" becomes "Confirmed gene knockout efficiency in 85% of samples."',
      example: {
        nameDrop:
          'Performed PCR, gel electrophoresis, and Western blot analysis in molecular biology lab',
        improved:
          'Confirmed novel protein expression pattern in 3 tissue types; results presented at regional symposium',
        whatChanged:
          'Replaced 3 technique names (wasting ~45 chars) with a specific finding ' +
          '(novel expression pattern), scope (3 tissue types), and validation ' +
          '(symposium presentation).',
      },
      prevalence: 'very_common',
      typicalCharWaste: 45,
      detectionKeywords: [
        'pcr', 'gel electrophoresis', 'western blot', 'southern blot',
        'northern blot', 'agarose', 'SDS-PAGE', 'electrophoresis',
        'blotting', 'gel analysis',
      ],
    },
    {
      id: 'sr_statistical_analysis',
      pattern: 'Statistical analysis / data analysis',
      whyStudentsUseIt:
        'Students believe "statistical analysis" sounds rigorous and scientific. ' +
        'It is technically accurate — they did analyze data. But accuracy is not ' +
        'the same as informativeness.',
      whyItFails:
        '"Performed statistical analysis" is one of the most content-free phrases ' +
        'in application writing. It communicates zero information about what was analyzed, ' +
        'what method was used, or what was found. Every research student analyzes data — ' +
        'this is noise, not signal.',
      betterAlternative:
        'Name the specific analysis, why you chose it, or what it revealed. ' +
        '"Performed statistical analysis" becomes "Survival analysis revealed 40% ' +
        'reduction in tumor recurrence."',
      example: {
        nameDrop:
          'Conducted statistical analysis on experimental data to determine significant results',
        improved:
          'Survival analysis of 800 patients revealed 40% lower recurrence rate in treatment group (p<0.001)',
        whatChanged:
          'Replaced the generic "statistical analysis on data" with specific analysis type ' +
          '(survival analysis), scale (800 patients), finding (40% lower recurrence), ' +
          'and statistical strength (p<0.001).',
      },
      prevalence: 'very_common',
      typicalCharWaste: 20,
      detectionKeywords: [
        'statistical analysis', 'data analysis', 'analyzed data',
        'performed analysis', 'statistical methods', 'statistics',
      ],
    },
    {
      id: 'sr_literature_review',
      pattern: '"Conducted literature review"',
      whyStudentsUseIt:
        'Students include it because it sounds scholarly and research-like. ' +
        'For many students, reading papers WAS their main contribution, so they foreground it.',
      whyItFails:
        'Reading papers is consuming, not producing. AOs value creation over consumption. ' +
        'Listing "literature review" as an activity is like listing "read textbook" for a class. ' +
        'Unless the literature review itself produced a novel synthesis or identified a gap, ' +
        'it is prep work, not achievement.',
      betterAlternative:
        'Either omit it entirely (literature review is assumed), or describe what the ' +
        'review PRODUCED: "Review of 40+ papers identified unexplored mechanism — ' +
        'formed basis for our study."',
      example: {
        nameDrop:
          'Conducted comprehensive literature review and assisted with data collection for cancer research study',
        improved:
          'Synthesized 40+ papers to identify unstudied drug interaction; proposed and executed validation experiment',
        whatChanged:
          'Turned passive consumption ("literature review") into active production ' +
          '("synthesized... identified... proposed... executed"). Shows the review ' +
          'led to an original contribution, not just reading.',
      },
      prevalence: 'common',
      typicalCharWaste: 35,
      detectionKeywords: [
        'literature review', 'reviewed literature', 'reviewed papers',
        'read papers', 'read studies', 'background research',
      ],
    },
    {
      id: 'sr_lab_name',
      pattern: 'University/Lab name-drop',
      whyStudentsUseIt:
        'Students believe the prestige of the institution or lab transfers to them. ' +
        '"Researched at MIT" sounds better than "researched at local university." ' +
        'Parents and counselors reinforce this instinct.',
      whyItFails:
        'The institution name is already captured in the Organization field of the ' +
        'activity entry. Repeating it in the description wastes 15-30 characters. ' +
        'AOs also know that many "prestigious lab" experiences are summer programs ' +
        'where students follow pre-made protocols. The WORK matters more than the ADDRESS.',
      betterAlternative:
        'Use the Organization/Position fields for the lab name. Use every character ' +
        'of the description for your actual contribution and findings.',
      example: {
        nameDrop:
          'Conducted research at Harvard Medical School in the Department of Genetics laboratory',
        improved:
          'Identified 2 novel SNPs associated with early-onset Alzheimer\'s; co-authored manuscript under review',
        whatChanged:
          'Removed 75 characters of location information (already in Organization field) ' +
          'and replaced with specific findings (2 SNPs, Alzheimer\'s) and output (manuscript).',
      },
      prevalence: 'common',
      typicalCharWaste: 25,
      detectionKeywords: [
        'university', 'lab', 'laboratory', 'department', 'institute',
        'center for', 'school of', 'hospital', 'medical center',
      ],
    },
    {
      id: 'sr_assisted_with',
      pattern: '"Assisted with" / "Contributed to"',
      whyStudentsUseIt:
        'Students are trying to be honest about their role — they really were assisting. ' +
        'But honesty about role level does not require vagueness about contribution.',
      whyItFails:
        '"Assisted with research" contains zero information. Every research student ' +
        '"assisted with" something. The phrase tells AOs nothing about what the student ' +
        'actually did, learned, or contributed. It reads as padding.',
      betterAlternative:
        'Replace with the SPECIFIC assistance. "Assisted with data collection" becomes ' +
        '"Collected and catalogued 142 soil samples from 12 wetland sites." Same honest ' +
        'scope, infinitely more informative.',
      example: {
        nameDrop:
          'Assisted with research in neuroscience lab, contributing to ongoing experiments and data analysis',
        improved:
          'Sectioned 500+ brain tissue samples; quantified dendritic spine density, discovering age-related pattern',
        whatChanged:
          'Replaced vague "assisted" and "contributing" with specific actions (sectioned, ' +
          'quantified), scale (500+ samples), and finding (age-related pattern). Same junior ' +
          'role, but now the reader can SEE the work.',
      },
      prevalence: 'very_common',
      typicalCharWaste: 15,
      detectionKeywords: [
        'assisted', 'assisted with', 'helped with', 'contributed to',
        'participated in', 'involved in', 'supported', 'aided',
      ],
    },
    {
      id: 'sr_r_matlab',
      pattern: 'R / MATLAB / SPSS software names',
      whyStudentsUseIt:
        'Students list statistical software to signal quantitative competence. ' +
        'They believe naming specialized software distinguishes them from students ' +
        'who only used Excel.',
      whyItFails:
        'Software names are meaningless to AOs. "Used R for analysis" is like saying ' +
        '"used a calculator for math." The software is a means, not an end. Characters ' +
        'spent on software names are characters not spent on what was FOUND.',
      betterAlternative:
        'Replace software name with the analytical result it produced. ' +
        '"Used R for statistical analysis" becomes "Identified 3 significant predictors ' +
        'of treatment response (p<0.01)."',
      example: {
        nameDrop:
          'Used R and MATLAB to perform computational analysis and create visualizations of research data',
        improved:
          'Modeled tumor growth dynamics across 6 treatment regimens; identified optimal dosing window',
        whatChanged:
          'Removed software names (18 chars) and replaced with specific scientific output ' +
          '(growth dynamics modeling, 6 regimens, dosing optimization). AO now sees the ' +
          'science, not the software.',
      },
      prevalence: 'common',
      typicalCharWaste: 18,
      detectionKeywords: [
        'R', 'MATLAB', 'SPSS', 'SAS', 'stata', 'GraphPad',
        'Prism', 'JMP', 'Minitab', 'software',
      ],
    },
    {
      id: 'sr_research_intern',
      pattern: '"Research intern" role inflation',
      whyStudentsUseIt:
        'The word "intern" sounds professional and structured. Students use it even ' +
        'for informal volunteer positions to elevate their perceived status.',
      whyItFails:
        'AOs at selective schools know that many "research internships" are summer programs ' +
        'where students wash glassware, shadow grad students, and follow pre-made protocols. ' +
        'The title tells AOs nothing; the WORK tells them everything.',
      betterAlternative:
        'Skip the title entirely and describe the specific work. ' +
        'Let the work speak to the level of involvement.',
      example: {
        nameDrop:
          'Research intern at university genetics lab; gained experience in molecular biology techniques',
        improved:
          'Cloned 4 gene variants and screened for expression; one showed unexpected tissue-specific activation',
        whatChanged:
          'Replaced title + vague "gained experience" with specific actions (cloned, screened), ' +
          'quantified scope (4 variants), and an intellectually interesting finding ' +
          '(unexpected tissue-specific activation).',
      },
      prevalence: 'common',
      typicalCharWaste: 20,
      detectionKeywords: [
        'intern', 'internship', 'gained experience', 'exposure to',
        'learned about', 'trained in', 'gained skills',
      ],
    },
  ],

  proofOfWorkPatterns: [
    {
      id: 'sr_pow_protocol_troubleshoot',
      pattern:
        'Student describes troubleshooting a protocol — optimizing temperatures, ' +
        'adjusting concentrations, solving contamination, debugging code.',
      whyItProves:
        'Troubleshooting is the unglamorous reality of research. Students who have not ' +
        'actually done research do not know that protocols fail, equipment breaks, and ' +
        'reagents expire. Describing troubleshooting is near-impossible to fake.',
      examples: [
        'Optimized annealing temperature through 8 gradient PCR runs — final protocol reduced nonspecific binding 90%',
        'Traced contamination to shared reagent stock; implemented dedicated aliquoting system for our bench',
        'Debugged segfault in simulation code — off-by-one error in boundary condition was corrupting 3% of runs',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'This student actually spent time at the bench/keyboard. They encountered real ' +
        'problems and solved them. This is not a student who visited a lab twice for a photo.',
    },
    {
      id: 'sr_pow_notebook_records',
      pattern:
        'Student references lab notebooks, data records, or documentation practices ' +
        'that demonstrate systematic work habits.',
      whyItProves:
        'Maintaining a proper lab notebook is a core research discipline that casual ' +
        'participants never learn. Referencing documentation practices signals the student ' +
        'was trained in and followed proper research methodology.',
      examples: [
        'Maintained detailed lab notebook — PI used my protocols as training docs for incoming students',
        'Developed standardized data entry template adopted by 4 other lab members',
        'Daily experimental logs totaling 200+ pages across 2 semesters',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'This student takes research seriously as a practice, not just as a resume line. ' +
        'The discipline of documentation signals genuine training.',
    },
    {
      id: 'sr_pow_negative_results',
      pattern:
        'Student discusses negative or null results meaningfully — what they expected, ' +
        'what they found (or did not find), and what it means.',
      whyItProves:
        'Only real researchers grapple with negative results. Padded descriptions never ' +
        'mention them because the student does not understand that null results are informative. ' +
        'Discussing a negative result with nuance is a definitive authenticity marker.',
      examples: [
        'Null result in initial drug screen narrowed subsequent search — ultimately identified lead compound',
        'Found no significant correlation between our variables, contradicting our hypothesis — published as negative result',
        'Expected protein-protein interaction was not detected; subsequent structural analysis explained steric incompatibility',
      ],
      expertiseLevel: 'advanced',
      aoInterpretation:
        'This student understands that science is not about proving yourself right — ' +
        'it is about finding truth. Intellectual maturity is rare and highly valued.',
    },
    {
      id: 'sr_pow_equipment_mastery',
      pattern:
        'Student references specific equipment operation, calibration, or maintenance — ' +
        'not as a name-drop, but as evidence of hands-on competence.',
      whyItProves:
        'Operating research equipment requires training and trust from the PI. Students ' +
        'who can independently operate a confocal microscope or flow cytometer have earned ' +
        'a level of lab citizenship that casual visitors never achieve.',
      examples: [
        'Trained on and independently operated flow cytometer — ran 50+ sorting sessions for the lab',
        'Calibrated and maintained HPLC system; trained 2 incoming students on operation',
        'Independently operated SEM for 30+ imaging sessions; developed sample prep protocol that improved resolution 2x',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'The PI trusted this student enough to operate expensive, complex equipment independently. ' +
        'This level of trust is earned through consistent, reliable work.',
    },
    {
      id: 'sr_pow_grad_student_level',
      pattern:
        'Student describes work that is typically performed by graduate students or ' +
        'postdocs — designing experiments, writing manuscripts, presenting at conferences.',
      whyItProves:
        'When a high school student performs graduate-level work, it signals exceptional ' +
        'ability AND an exceptional mentorship relationship. This is the strongest proof-of-work ' +
        'in research — the student was treated as a peer by professionals.',
      examples: [
        'Designed follow-up experiment after initial findings — PI incorporated it into R01 renewal',
        'Wrote methods and results sections of manuscript (published, 2nd author)',
        'Presented at departmental seminar alongside PhD students — received questions from faculty',
      ],
      expertiseLevel: 'expert',
      aoInterpretation:
        'This is a student who is already functioning as a junior scientist. ' +
        'They are not just learning — they are contributing at a professional level.',
    },
    {
      id: 'sr_pow_intellectual_growth',
      pattern:
        'Student describes how their understanding of the research evolved over time — ' +
        'initial confusion, growing comprehension, eventual mastery.',
      whyItProves:
        'Authentic growth narratives are nearly impossible to fabricate. A student who ' +
        'writes "I initially didn\'t understand why we needed controls, but by month 3..." ' +
        'is being genuine in a way that resume padders never are.',
      examples: [
        'First month: struggled to interpret gel images. By semester end: training new students on band quantification',
        'Initial confusion about why our hypothesis mattered evolved into genuine excitement after reading foundational papers',
        'Started unable to pipette consistently; ended designing my own experiments for summer continuation',
      ],
      expertiseLevel: 'novice',
      aoInterpretation:
        'This student is honest about their starting point and can articulate their growth. ' +
        'Authenticity is valued over inflated claims of instant mastery.',
    },
    {
      id: 'sr_pow_collaborative_insight',
      pattern:
        'Student references specific intellectual exchanges with lab members — debates, ' +
        'brainstorming sessions, journal club discussions.',
      whyItProves:
        'Research is collaborative. A student who describes specific intellectual exchanges ' +
        'has participated in the social fabric of a lab. This is not something you experience ' +
        'in a 2-week summer program.',
      examples: [
        'Lab meeting debate over our results led me to propose alternative analysis that resolved contradiction',
        'Journal club discussion of competing methods inspired our hybrid approach',
        'Brainstormed experimental design with postdoc — our combined approach reduced required sample size by 60%',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'This student is intellectually engaged with their lab community. They are not ' +
        'silently executing tasks — they are thinking, debating, and contributing ideas.',
    },
    {
      id: 'sr_pow_field_specific_challenge',
      pattern:
        'Student describes a challenge unique to their specific research field — ' +
        'something only someone in that exact domain would encounter.',
      whyItProves:
        'Domain-specific challenges are the ultimate authenticity test. A student studying ' +
        'wetland ecology who describes sample degradation during transport, or a clinical ' +
        'researcher who describes participant recruitment challenges, is clearly speaking from experience.',
      examples: [
        'RNA degradation during field collection required developing cold-chain transport protocol',
        'Recruited 45 elderly participants for cognitive study — hardest part was building trust in clinical setting',
        'Telescope time allocation limited us to 3 observation windows — designed schedule to maximize data coverage',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'This student encountered and solved a real-world constraint specific to their field. ' +
        'This is hands-on experience, not textbook knowledge.',
    },
  ],

  descriptionTransforms: [
    {
      id: 'sr_dt_tools_to_finding',
      transformType: 'name_drop_to_impact',
      before: 'Used Python and R to analyze large genomic datasets in bioinformatics lab',
      after: 'Identified 4 gene variants linked to drug resistance in 23,000-patient dataset',
      explanation:
        'The tools (Python, R) are invisible to AOs. The finding (gene variants linked to ' +
        'drug resistance) is what makes the activity meaningful. Adding scale (23,000 patients) ' +
        'communicates rigor.',
      charsBefore: 71,
      charsAfter: 72,
      principle: 'Tools are invisible; findings are everything.',
    },
    {
      id: 'sr_dt_vague_to_specific',
      transformType: 'generic_to_specific',
      before: 'Conducted research on cancer biology and presented findings',
      after: 'Mapped tumor microenvironment in 200 biopsy samples; presented at AACR poster session',
      explanation:
        '"Research on cancer biology" is so vague it could describe anything from reading papers ' +
        'to leading a clinical trial. Specifying the exact work (mapping tumor microenvironment), ' +
        'scale (200 biopsies), and venue (AACR) creates a vivid, verifiable picture.',
      charsBefore: 59,
      charsAfter: 82,
      principle: 'The more specific you are, the more credible you become.',
    },
    {
      id: 'sr_dt_passive_to_active',
      transformType: 'passive_to_active',
      before: 'Was involved in neuroscience research project studying memory formation',
      after: 'Designed behavioral assay measuring spatial memory in 60 mice; discovered age-dependent decline',
      explanation:
        '"Was involved in" is the weakest possible opening. It communicates nothing about the ' +
        'student\'s actual role. "Designed" immediately signals intellectual ownership. ' +
        'Adding the specific assay, sample size, and discovery transforms passive observation ' +
        'into active contribution.',
      charsBefore: 65,
      charsAfter: 86,
      principle: 'Lead with your verb. Your action verb IS your role claim.',
    },
    {
      id: 'sr_dt_claim_to_evidence',
      transformType: 'claim_to_evidence',
      before: 'Made significant contributions to groundbreaking environmental research',
      after: 'Discovered high microplastic concentrations in 8/12 streams tested; data cited by city council',
      explanation:
        '"Significant contributions" and "groundbreaking" are claims without evidence. ' +
        'AOs immediately discount such language. The improved version lets the reader ' +
        'CONCLUDE the work was significant (city council citation) rather than being told.',
      charsBefore: 64,
      charsAfter: 89,
      principle: 'Never claim impact. Show evidence and let the reader draw the conclusion.',
    },
    {
      id: 'sr_dt_jargon_to_outcome',
      transformType: 'jargon_to_outcome',
      before: 'Applied CRISPR-Cas9 gene editing and qRT-PCR to study cardiac gene expression',
      after: 'Edited 3 cardiac genes in zebrafish; one knockout regenerated heart tissue 2x faster than control',
      explanation:
        'The technique names (CRISPR-Cas9, qRT-PCR) consume 30+ characters and communicate ' +
        'nothing to AOs. The revised version uses those characters for what was edited (cardiac genes), ' +
        'the system (zebrafish), and the remarkable finding (2x faster regeneration).',
      charsBefore: 75,
      charsAfter: 87,
      principle: 'Techniques are means; findings are ends. Describe the end.',
    },
    {
      id: 'sr_dt_duty_to_achievement',
      transformType: 'duty_to_achievement',
      before: 'Responsible for data collection, sample preparation, and maintaining lab equipment',
      after: 'Collected 400+ water samples over 8 months; analysis revealed seasonal contamination pattern',
      explanation:
        '"Responsible for" is a job description, not an achievement. Every research student ' +
        'collects data and preps samples. The improved version keeps the same honest scope ' +
        'but adds scale (400+ samples), duration (8 months), and finding (seasonal pattern) ' +
        'that transform duties into discoveries.',
      charsBefore: 78,
      charsAfter: 84,
      principle: 'Describe what you ACHIEVED, not what you were assigned.',
    },
    {
      id: 'sr_dt_process_to_result',
      transformType: 'generic_to_specific',
      before: 'Learned laboratory techniques and gained valuable research experience',
      after: 'Independently ran 50+ Western blots; optimized protocol that lab now uses as standard',
      explanation:
        '"Learned techniques" and "gained experience" are about the student, not about the work. ' +
        'AOs want to know what the student DID and what RESULTED. The improved version shows ' +
        'mastery (independently ran), scale (50+), and lasting contribution (new lab standard).',
      charsBefore: 62,
      charsAfter: 77,
      principle: 'Your description is about your WORK, not about your personal growth.',
    },
    {
      id: 'sr_dt_title_to_work',
      transformType: 'name_drop_to_impact',
      before: 'Summer research intern at Johns Hopkins neuroscience department, Prof. Smith lab',
      after: 'Traced neural circuit for fear response in mice; findings added to lab\'s NIH grant renewal',
      explanation:
        'The institution (Johns Hopkins) and lab (Prof. Smith) belong in the Organization ' +
        'and Position fields, not the description. Using all 150 characters for actual work ' +
        'and results communicates far more than prestige signaling.',
      charsBefore: 79,
      charsAfter: 82,
      principle: 'Organization field has the name. Description has the work.',
    },
    {
      id: 'sr_dt_buzzword_to_substance',
      transformType: 'jargon_to_outcome',
      before: 'Utilized advanced computational methods and bioinformatics pipelines for genome analysis',
      after: 'Assembled genome of New England river bacteria; found 2 novel antibiotic resistance genes',
      explanation:
        '"Advanced computational methods" and "bioinformatics pipelines" are empty buzzwords. ' +
        'What did the computation PRODUCE? A genome assembly with specific, important findings. ' +
        'The revised version is also more interesting to read.',
      charsBefore: 86,
      charsAfter: 83,
      principle: 'Replace adjectives (advanced, sophisticated) with nouns (genome, resistance genes).',
    },
    {
      id: 'sr_dt_team_to_individual',
      transformType: 'generic_to_specific',
      before: 'Member of interdisciplinary research team studying climate change impacts',
      after: 'Led soil carbon analysis for 5-university study; my dataset showed 23% higher sequestration than models predicted',
      explanation:
        '"Member of team" tells AOs nothing about the student. Teams have 2 people and 200 people. ' +
        'What was YOUR specific contribution? "Led soil carbon analysis" carves out the student\'s ' +
        'unique role. Adding the finding (23% higher than predicted) shows intellectual ownership.',
      charsBefore: 68,
      charsAfter: 104,
      principle: 'In team research, isolate YOUR contribution. AOs are admitting YOU, not the team.',
    },
  ],

  verbHierarchy: [
    {
      tier: 'power',
      verbs: [
        'Discovered', 'Identified', 'Designed', 'Proposed', 'Developed',
        'Demonstrated', 'Established', 'Pioneered', 'Revealed', 'Characterized',
      ],
      context:
        'Power verbs in research signal intellectual ownership and original contribution. ' +
        'These verbs imply the student was not just executing — they were creating new ' +
        'knowledge or methods. AOs read "Discovered" and think "this student found something new."',
      exampleUsage:
        'Discovered novel protein interaction that explained contradictory results in 3 prior studies',
    },
    {
      tier: 'standard',
      verbs: [
        'Analyzed', 'Investigated', 'Tested', 'Measured', 'Evaluated',
        'Compared', 'Implemented', 'Optimized', 'Collected', 'Quantified',
      ],
      context:
        'Standard verbs describe solid research work but do not signal original contribution. ' +
        'They are appropriate for accurately describing what was done but need strong objects ' +
        'and results to make the description compelling. "Analyzed" is fine; "Analyzed and found" ' +
        'is better.',
      exampleUsage:
        'Analyzed 12,000 patient records using survival models; identified 3 novel risk factors',
    },
    {
      tier: 'weak',
      verbs: [
        'Assisted', 'Helped', 'Participated', 'Contributed', 'Supported',
        'Learned', 'Observed', 'Gained', 'Explored', 'Studied',
      ],
      context:
        'Weak verbs signal passive involvement and are the hallmark of resume padding. ' +
        '"Assisted with research" and "gained experience" tell AOs nothing. If the student ' +
        'truly just assisted, describe the specific assistance: "Prepared 200 tissue samples" ' +
        'is better than "Assisted with sample preparation."',
      exampleUsage:
        'Avoid: "Assisted with data collection for neuroscience study" — replace with specific action',
    },
  ],

  roleExpertise: [
    {
      role: 'Principal Investigator / Lead Researcher',
      expectedSignals: [
        'Articulates the research question and why it matters',
        'Describes experimental design decisions and their rationale',
        'References mentoring or training others in the lab',
        'Connects findings to broader scientific context',
        'Describes publication or presentation of results',
      ],
      differentiators: [
        'Conceived the research question independently (not assigned by mentor)',
        'Secured funding or resources for the project (even small grants)',
        'Made a methodological innovation adopted by others',
        'Results led to follow-up studies or external interest',
        'Invited to present at professional (not student) venue',
      ],
      overclaimingRisks: [
        'Claiming to lead a project clearly beyond HS-level resources or expertise',
        'Describing oneself as PI when actually working under close graduate student supervision',
        'Taking credit for team findings without specifying individual contribution',
        'Claiming a "novel" finding that is well-established in the literature',
      ],
      authenticPatterns: [
        'Describes the evolution from assigned tasks to independent direction',
        'References specific challenges overcome and decisions made',
        'Can explain WHY they pursued this question (intellectual motivation)',
        'Mentions specific feedback from mentor that shaped the project',
      ],
    },
    {
      role: 'Co-Investigator / Research Partner',
      expectedSignals: [
        'Describes specific division of labor within the project',
        'Articulates their unique contribution to the partnership',
        'References collaborative decision-making process',
        'Describes skills or perspective they brought that the partner lacked',
      ],
      differentiators: [
        'Made an independent intellectual contribution that changed the project direction',
        'Brought a complementary skill (e.g., coding to a wet lab project)',
        'Co-authored publication with clearly defined contribution',
        'Project could not have succeeded without their specific input',
      ],
      overclaimingRisks: [
        'Describing the partnership as if they did all the work',
        'Claiming results that were primarily the partner\'s contribution',
        'Using "we" throughout without ever specifying "I"',
      ],
      authenticPatterns: [
        'Uses "I" and "we" in appropriate proportion',
        'Describes specific division: "I handled X while my partner focused on Y"',
        'Acknowledges what they learned from the collaboration',
      ],
    },
    {
      role: 'Research Assistant',
      expectedSignals: [
        'Describes specific tasks performed with scale and frequency',
        'Shows growth from basic tasks to more complex responsibilities over time',
        'References training received and skills developed',
        'Describes their contribution within the larger project context',
      ],
      differentiators: [
        'Earned increasing independence over time (started assigned, ended self-directed)',
        'Made an observation or suggestion that influenced the project',
        'Trained incoming students on techniques they mastered',
        'Contributed to a specific aspect of a publication (figures, data tables)',
      ],
      overclaimingRisks: [
        'Describing standard RA tasks (pipetting, data entry) as if they were original research',
        'Claiming authorship when they are in the acknowledgments section',
        'Using "my research" for the PI\'s long-running project',
        'Inflating a 3-week summer experience into a full research narrative',
      ],
      authenticPatterns: [
        'Specific: "Prepared 200 tissue sections" not "assisted with lab work"',
        'Growth arc: from following protocols to running experiments independently',
        'Honest about scope but specific about contribution',
        'References what the work taught them about research as a process',
      ],
    },
    {
      role: 'Computational / Data Analyst',
      expectedSignals: [
        'Describes the analytical question, not just the tools used',
        'Specifies dataset size and source',
        'Reports specific findings or results of the analysis',
        'Explains why the analysis was necessary for the research',
      ],
      differentiators: [
        'Built a tool, pipeline, or visualization adopted by the lab',
        'Analysis revealed something that changed the project direction',
        'Handled methodological decisions independently (model selection, validation strategy)',
        'Created reproducible workflow that outlasted their involvement',
      ],
      overclaimingRisks: [
        'Listing programming languages as achievements',
        'Describing basic data cleaning as "developed computational pipeline"',
        'Claiming a machine learning "breakthrough" that is actually a homework-level classifier',
        'Name-dropping frameworks without describing what they produced',
      ],
      authenticPatterns: [
        'Problem-first: "To identify X, I built Y" not "Used Y to do stuff"',
        'Includes performance metrics or validation',
        'Describes data challenges (missing data, noise, bias) and how they addressed them',
        'Connects computational output to the biological/scientific question',
      ],
    },
    {
      role: 'Field Researcher / Data Collector',
      expectedSignals: [
        'Describes specific field conditions and logistical challenges',
        'Quantifies collection effort (sites, samples, time)',
        'References data quality protocols followed in the field',
        'Connects field work to the research question',
      ],
      differentiators: [
        'Identified a pattern or anomaly during collection that influenced the study',
        'Developed or improved a field collection protocol',
        'Work required physical endurance, travel, or unusual conditions',
        'Data collected formed a unique or irreplaceable dataset',
      ],
      overclaimingRisks: [
        'Describing a class field trip as "field research"',
        'Claiming to have "collected data" when they accompanied someone else',
        'Overstating the independence of field work done under close supervision',
      ],
      authenticPatterns: [
        'Describes specific sites, conditions, and collection methods',
        'Mentions weather, logistics, or practical challenges realistically',
        'Shows understanding of why systematic collection matters',
        'Connects their specific data to the larger research question',
      ],
    },
  ],

  jargonExceptions: [
    {
      pattern: 'Published in [specific high-impact journal name]',
      whyItsTheException:
        'When a high school student publishes in Nature, Science, Cell, or a recognized ' +
        'journal, the journal name IS the achievement. The prestige of the venue conveys ' +
        'the quality of the work more efficiently than any description could.',
      example:
        'Co-first-author in Nature Communications on CRISPR delivery mechanism — 40+ citations in first year',
    },
    {
      pattern: 'Won [prestigious national/international competition]',
      whyItsTheException:
        'Awards like Regeneron STS finalist, ISEF Grand Award, or Siemens winner are so ' +
        'competitive that naming them IS the strongest possible signal. These are understood ' +
        'by all AOs.',
      example:
        'Regeneron STS Top 40 finalist — presented machine learning approach to predicting earthquake aftershocks',
    },
    {
      pattern: 'Named technique when it IS the innovation',
      whyItsTheException:
        'If the student developed a new technique, naming that technique is the achievement. ' +
        '"Developed novel FRET-based biosensor" is different from "used FRET" — the student ' +
        'CREATED the tool, not just used it.',
      example:
        'Developed novel paper-based diagnostic assay for water contamination — costs $0.02 per test vs $15 commercial alternative',
    },
    {
      pattern: 'Specific model organism when it signals difficulty',
      whyItsTheException:
        'Some model organisms signal extreme difficulty or sophistication. Working with ' +
        'non-human primates, BSL-3 pathogens, or rare specimens implies access, training, ' +
        'and trust that IS the credential.',
      example:
        'One of 3 HS students nationwide approved for BSL-3 lab work — studied live Mycobacterium tuberculosis',
    },
  ],
};
