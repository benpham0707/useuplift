/**
 * STEM Research — Impressiveness Calibration Domain
 *
 * Covers: laboratory research, field research, computational research,
 * independent investigations, science fair projects, and academic publications.
 *
 * Key insight for AOs: The critical differentiator in STEM research is
 * INDEPENDENCE of thought. Lab shadowing vs. designing your own experiment
 * is the chasm between baseline and impressive. Publication authorship
 * order, IRB involvement, and methodology sophistication are the markers
 * that separate the tiers above.
 */

import type { ImpressivenessDomain } from '../types';

export const STEM_RESEARCH_IMPRESSIVENESS: ImpressivenessDomain = {
  domainId: 'stem_research',
  label: 'STEM Research',
  overview:
    'STEM research is one of the highest-signal activities for selective admissions because it demonstrates intellectual curiosity, self-direction, and tolerance for ambiguity — traits that predict academic success. AOs distinguish sharply between passive lab participation (washing beakers) and genuine intellectual contribution (designing experiments, analyzing data, drawing conclusions). The most impressive applicants don\'t just DO research — they own a question and pursue it with rigor.',

  ladder: [
    // ── BASELINE ──────────────────────────────────────────────────────────
    {
      level: 'baseline',
      description:
        'Lab assistant performing routine tasks — washing glassware, preparing solutions, organizing data entry. Shadowing a researcher or graduate student. Attending a non-selective summer science camp or workshop.',
      whyImpressive:
        'AOs see this as interest signaling, not achievement. It shows the student is curious about science and took initiative to get into a lab, but there is no evidence of independent thinking or meaningful contribution. Thousands of applicants at selective schools have this exact experience. It checks a box but does not differentiate.',
      prevalence:
        'Very common among applicants to selective schools. ~40-50% of STEM-interested applicants list some form of lab exposure or shadowing.',
      applicantPercentile: 'Top 50-60%',
      verificationMarkers: [
        'Mentions specific lab or PI name',
        'Can describe daily tasks but not research questions',
        'Duration is typically a few weeks to one summer',
        'No mention of independent analysis or conclusions',
      ],
      differentiatorFromBelow: 'At least showed initiative to seek out a research environment.',
      differentiatorFromAbove:
        'No independent question, no ownership of methodology, no original analysis. The student was a helper, not a researcher.',
      tierRange: [5, 6],
    },

    // ── NOTABLE ───────────────────────────────────────────────────────────
    {
      level: 'notable',
      description:
        'Independent research project with faculty guidance. Participation in a non-selective or moderately selective summer research program. Completed a structured investigation with data collection and analysis. Regional science fair participation with a self-directed project.',
      whyImpressive:
        'AOs recognize that the student moved beyond observation to participation. Having a faculty mentor who guided (not just supervised) suggests the student asked real questions and showed enough promise for a professor to invest time. The student can articulate a research question and describe their methodology, which signals genuine scientific thinking. This is a real step above shadowing.',
      prevalence:
        'Common among strong STEM applicants. ~20-30% of applicants to T30 schools have a mentored research experience of some kind.',
      applicantPercentile: 'Top 20-30%',
      verificationMarkers: [
        'Names a specific research question or hypothesis',
        'Describes methodology in concrete terms',
        'Has a specific faculty mentor relationship',
        'Duration is at least one semester or full summer',
        'Can describe what they learned from failures or unexpected results',
      ],
      differentiatorFromBelow:
        'Owns a research question and can describe methodology — not just doing assigned tasks.',
      differentiatorFromAbove:
        'Project scope is guided by mentor rather than self-driven. Results are learning outcomes, not field contributions. No external validation (publication, conference, selective program acceptance).',
      tierRange: [4],
    },

    // ── IMPRESSIVE ────────────────────────────────────────────────────────
    {
      level: 'impressive',
      description:
        'Original research conducted at a selective program (SSP, COSMOS, Clark Scholars, SIMR). Conference presentation at a recognized venue. Co-author on a peer-reviewed publication or preprint. State/regional science fair winner. Research resulting in a poster at a professional conference.',
      whyImpressive:
        'This is where AOs start paying real attention. Acceptance to a selective research program means external validators — professors, program directors — already vetted this student as exceptional. A conference presentation or co-authorship means the student contributed enough that professionals in the field considered the work worth sharing. This student doesn\'t just understand the scientific method — they\'ve used it to produce something the field values. At T20 schools, this moves the needle.',
      prevalence:
        'Uncommon. ~5-10% of applicants to T20 schools have genuine, externally validated research contributions.',
      applicantPercentile: 'Top 5-10%',
      verificationMarkers: [
        'Named selective program with known acceptance rate',
        'Specific conference name and presentation format (poster vs. talk)',
        'Co-authorship with position on author list',
        'Describes original contribution distinct from mentor\'s work',
        'Can articulate significance of findings within broader field',
        'Evidence of peer review or editorial process',
      ],
      differentiatorFromBelow:
        'External validation — selective program acceptance, peer review, or professional presentation. Someone outside the student\'s immediate circle judged the work as meritorious.',
      differentiatorFromAbove:
        'Contribution is real but typically incremental or part of a larger lab project. The student was a valued contributor but not the driving intellectual force. First-authorship or field-level recognition is absent.',
      tierRange: [3],
    },

    // ── EXCEPTIONAL ───────────────────────────────────────────────────────
    {
      level: 'exceptional',
      description:
        'First-author publication in a peer-reviewed journal. Acceptance to RSI, PRIMES, or equivalent ultra-selective programs (<5% acceptance). Patent filed based on original research. Finalist at ISEF, Regeneron STS semifinalist, or Siemens semifinalist. Research cited by other publications.',
      whyImpressive:
        'AOs read this and think: "This student is already operating at the level of a graduate student." First-authorship means the student was the primary intellectual driver — they conceived the question, designed the approach, and wrote the paper. RSI/PRIMES acceptance (2-4% acceptance rate) means the most selective evaluators in the country identified this student as extraordinary. A patent means the student produced something novel enough to warrant legal protection. This is the kind of achievement that gets flagged for committee discussion and can single-handedly carry a STEM narrative.',
      prevalence:
        'Rare. ~1-2% of applicants to T10 schools. Fewer than 500 HS students per year nationally achieve this level.',
      applicantPercentile: 'Top 1-2%',
      verificationMarkers: [
        'Journal name, volume, DOI, or preprint server link',
        'First-author position clearly stated',
        'RSI/PRIMES/equivalent program named with cohort year',
        'Patent application number or filing documentation',
        'ISEF project ID or STS application confirmation',
        'Research described with sufficient technical depth to verify originality',
        'Letters of recommendation likely reference the research directly',
      ],
      differentiatorFromBelow:
        'The student is the primary intellectual driver, not a contributor. First-authorship, ultra-selective program acceptance, or patent filing demonstrate ownership of novel ideas.',
      differentiatorFromAbove:
        'Publication is typically in a field-specific or student-focused journal rather than a top-tier venue (Nature, Science, Cell). Recognition is national rather than international. Impact is promising but not yet field-defining.',
      tierRange: [2],
    },

    // ── EXTRAORDINARY ─────────────────────────────────────────────────────
    {
      level: 'extraordinary',
      description:
        'Published in a top-tier journal (Nature, Science, Cell, PNAS). International recognition — invited talks, named awards, or media coverage for research. Multiple patents with commercial application. Research that demonstrably advanced the field — new methodology, significant discovery, or paradigm-shifting finding. Regeneron STS finalist (top 40).',
      whyImpressive:
        'AOs read this with genuine awe — and also heightened scrutiny because it\'s almost unbelievable for a HS student. Publication in Nature/Science means the student\'s work survived the most rigorous peer review in science and was deemed significant enough for the world\'s most competitive venues. This is rarer than winning a gold medal at the Olympics for science. These students are not "promising" — they have already made contributions that professional scientists spend careers pursuing. This is an automatic committee discussion and near-certain admission boost at any school.',
      prevalence:
        'Extraordinarily rare. <0.01% of all applicants. Fewer than 50 HS students per year nationally.',
      applicantPercentile: 'Top 0.01%',
      verificationMarkers: [
        'Top-tier journal name with verifiable DOI',
        'Media coverage or press releases about the research',
        'Named awards from professional scientific societies',
        'Invited presentations at major conferences (not student sessions)',
        'Patent grants (not just filings) with commercial interest',
        'Regeneron STS finalist with project description',
        'Independent verification through Google Scholar or PubMed',
      ],
      differentiatorFromBelow:
        'Publication venue is universally recognized as elite. Impact extends beyond the student\'s immediate research group to the broader field. Recognition is international, not just national.',
      differentiatorFromAbove:
        'This is the ceiling for HS students. There is no level above this — these students have achieved what most PhD candidates aspire to.',
      tierRange: [1],
    },
  ],

  technicalDepthMarkers: [
    {
      term: 'IRB approval',
      meaning:
        'Institutional Review Board approval — required for any research involving human subjects. Involves a formal protocol submission, ethics review, and compliance requirements.',
      hsContext:
        'Extremely rare for HS students to navigate the IRB process. Indicates genuine clinical or behavioral research involvement with institutional support, not casual volunteering. The student had to write a protocol and understand research ethics.',
      indicatesLevel: 'impressive',
      detectionKeywords: ['IRB', 'institutional review board', 'ethics approval', 'human subjects'],
      detectionConfidence: 'high',
    },
    {
      term: 'p-value / statistical significance',
      meaning:
        'Statistical measure indicating whether results are likely due to chance. Proper use implies understanding of hypothesis testing, experimental design, and data analysis.',
      hsContext:
        'Many HS students mention statistics superficially. Genuine understanding — choosing the right test, interpreting confidence intervals, acknowledging limitations — signals real research training beyond AP Statistics.',
      indicatesLevel: 'notable',
      detectionKeywords: [
        'p-value', 'p value', 'statistical significance', 'confidence interval',
        'hypothesis test', 't-test', 'chi-square', 'ANOVA', 'regression analysis',
      ],
      detectionConfidence: 'medium',
    },
    {
      term: 'gel electrophoresis',
      meaning:
        'Laboratory technique for separating DNA, RNA, or proteins by size. A fundamental molecular biology skill.',
      hsContext:
        'Common in AP Biology labs and introductory research. By itself, this is baseline — it indicates lab exposure but not independent research. Becomes notable only when combined with independent experimental design.',
      indicatesLevel: 'baseline',
      detectionKeywords: ['gel electrophoresis', 'agarose gel', 'PAGE', 'SDS-PAGE', 'Western blot'],
      detectionConfidence: 'high',
    },
    {
      term: 'PCR (Polymerase Chain Reaction)',
      meaning:
        'Technique to amplify specific DNA sequences. Foundational in genetics, forensics, and molecular biology.',
      hsContext:
        'Running PCR is a trainable skill — most mentored research students learn it in their first weeks. Designing PCR primers for a specific target gene shows deeper understanding. Mentioning PCR alone is baseline; mentioning primer design or troubleshooting is notable.',
      indicatesLevel: 'notable',
      detectionKeywords: ['PCR', 'polymerase chain reaction', 'primer design', 'amplification', 'qPCR', 'RT-PCR'],
      detectionConfidence: 'medium',
    },
    {
      term: 'Western blot',
      meaning:
        'Technique to detect specific proteins in a sample. More technically demanding than gel electrophoresis.',
      hsContext:
        'Running a Western blot competently requires significant lab training. HS students who can do this independently have spent substantial time in a real research lab. It\'s a signal of genuine bench skills, though the technique itself is standard in any molecular biology lab.',
      indicatesLevel: 'notable',
      detectionKeywords: ['Western blot', 'immunoblot', 'protein detection', 'antibody staining'],
      detectionConfidence: 'high',
    },
    {
      term: 'CRISPR',
      meaning:
        'Gene-editing technology. Using CRISPR in a research project implies access to a sophisticated lab and understanding of molecular genetics.',
      hsContext:
        'Any HS student performing CRISPR experiments is in a serious research environment. However, AOs are wary of CRISPR name-dropping without substance — "I used CRISPR" is less meaningful than "I designed guide RNAs targeting X gene to test Y hypothesis." The design choices matter more than the technique name.',
      indicatesLevel: 'impressive',
      detectionKeywords: ['CRISPR', 'Cas9', 'gene editing', 'guide RNA', 'gRNA', 'knock-out', 'knock-in'],
      detectionConfidence: 'medium',
    },
    {
      term: 'bioinformatics pipeline',
      meaning:
        'Computational workflow for analyzing biological data — genomic sequences, protein structures, gene expression datasets. Combines biology knowledge with programming.',
      hsContext:
        'Building a bioinformatics pipeline requires both biological understanding and programming ability. HS students who can do this are rare — it typically requires mentorship from a computational biology lab. It signals cross-disciplinary capability that AOs value highly for STEM majors.',
      indicatesLevel: 'impressive',
      detectionKeywords: [
        'bioinformatics', 'pipeline', 'genomic analysis', 'sequence alignment',
        'BLAST', 'gene expression', 'RNA-seq', 'transcriptomics', 'proteomics',
      ],
      detectionConfidence: 'medium',
    },
    {
      term: 'first-author',
      meaning:
        'The first-listed author on a publication — in most STEM fields, this denotes the person who did the majority of the work and led the intellectual contribution.',
      hsContext:
        'First-authorship for a HS student is extraordinary. It means a PI trusted this student enough to give them primary credit over graduate students and postdocs. AOs immediately recognize this as exceptional — it transforms the research narrative from "participant" to "leader."',
      indicatesLevel: 'exceptional',
      detectionKeywords: ['first author', 'first-author', 'lead author', 'primary author'],
      detectionConfidence: 'high',
    },
    {
      term: 'peer review',
      meaning:
        'The formal evaluation process where other scientists assess a manuscript before publication. The gold standard for scientific credibility.',
      hsContext:
        'Surviving peer review means the work met professional standards. For a HS student, this is a strong signal that the research was genuine and rigorous. Preprints (non-peer-reviewed) are still notable but carry less weight.',
      indicatesLevel: 'impressive',
      detectionKeywords: ['peer-reviewed', 'peer review', 'refereed journal', 'manuscript accepted', 'publication'],
      detectionConfidence: 'medium',
    },
    {
      term: 'literature review methodology',
      meaning:
        'Systematic review and synthesis of existing research in a field. Requires reading, understanding, and critically evaluating dozens of papers.',
      hsContext:
        'Conducting a genuine literature review — not just Googling and citing a few papers — is a graduate-level skill. HS students who describe reviewing "47 papers" or "meta-analyzing existing studies" show they can engage with a field as a scholar, not just a student.',
      indicatesLevel: 'notable',
      detectionKeywords: [
        'literature review', 'meta-analysis', 'systematic review',
        'reviewed papers', 'existing literature', 'prior research',
      ],
      detectionConfidence: 'low',
    },
    {
      term: 'control group design',
      meaning:
        'Designing experiments with proper controls — positive, negative, and procedural — to isolate variables and ensure valid conclusions.',
      hsContext:
        'Proper control group design is the hallmark of real experimental thinking. Many HS students describe experiments without controls, which signals a cookbook approach. Mentioning specific control designs shows the student understands WHY they did each step, not just WHAT they did.',
      indicatesLevel: 'notable',
      detectionKeywords: [
        'control group', 'negative control', 'positive control',
        'placebo', 'double-blind', 'randomized', 'controlled experiment',
      ],
      detectionConfidence: 'medium',
    },
    {
      term: 'novel methodology / original approach',
      meaning:
        'Developing a new experimental technique, computational method, or analytical framework — not just applying existing methods to a new dataset.',
      hsContext:
        'Creating a genuinely novel methodology is exceptional at any level. For a HS student, it indicates the rare ability to not just use tools but to invent them. This is what separates exceptional from impressive — the student didn\'t just answer a question, they created a new way to ask it.',
      indicatesLevel: 'exceptional',
      detectionKeywords: [
        'novel method', 'new approach', 'developed a technique',
        'original methodology', 'invented', 'designed a new',
      ],
      detectionConfidence: 'low',
    },
  ],
};
