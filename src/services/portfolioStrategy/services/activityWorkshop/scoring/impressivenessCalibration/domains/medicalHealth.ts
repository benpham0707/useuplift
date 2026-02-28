/**
 * Medical & Health — Impressiveness Calibration Domain
 *
 * Covers: clinical volunteering, EMT/first responder certification,
 * clinical research, public health initiatives, health education,
 * shadowing, hospital programs, and health-related community service.
 *
 * Key insight for AOs: Medical/health activities are the MOST inflated
 * category in college applications. Every pre-med lists "hospital
 * volunteering." The differentiator is DEPTH — did the student observe
 * medicine, participate in it, or advance it? AOs at T20 schools can
 * instantly tell the difference between "filed papers in a hospital"
 * and "conducted IRB-approved clinical research."
 */

import type { ImpressivenessDomain } from '../types';

export const MEDICAL_HEALTH_IMPRESSIVENESS: ImpressivenessDomain = {
  domainId: 'medical_health',
  label: 'Medical & Health',
  overview:
    'Medical and health activities are the most common extracurricular listed by pre-med applicants — and therefore the category where differentiation is hardest. AOs at selective schools see hundreds of "volunteered at a hospital" descriptions per cycle, and most are indistinguishable. The progression that matters is: observer → participant → contributor → leader → innovator. Hospital volunteering (even 500 hours of it) is baseline. What separates tiers is the NATURE of involvement: delivering magazines vs. conducting clinical research, shadowing a doctor vs. earning EMT certification and responding to emergencies, joining a health club vs. founding a health initiative that measurably improved community outcomes.',

  ladder: [
    // ── BASELINE ──────────────────────────────────────────────────────────
    {
      level: 'baseline',
      description:
        'Hospital volunteering in non-clinical roles — gift shop, front desk, patient transport, meal delivery. Health club member at school. Physician shadowing (observation only). Basic first aid training or health-related coursework.',
      whyImpressive:
        'AOs view this as the bare minimum for a pre-med narrative. Hospital volunteering is so common that it\'s essentially expected rather than differentiating. Shadowing is passive by definition — the student watched, they didn\'t do. Gift shop and front desk volunteering involves zero medical knowledge or patient care. AOs specifically look past these activities to find evidence of deeper engagement. Listing 200 hours of gift shop volunteering is worse than listing 50 hours of meaningful clinical involvement because it suggests the student prioritized hours over substance.',
      prevalence:
        'Nearly universal among pre-med applicants. ~60-70% of applicants to selective schools who indicate medical interest list hospital volunteering or shadowing.',
      applicantPercentile: 'Top 60-70%',
      verificationMarkers: [
        'Hospital or clinic name mentioned',
        'Hour count emphasized over responsibilities',
        'Vague descriptions: "helped patients," "assisted staff"',
        'No mention of specific medical knowledge gained',
        'Shadowing described as observation without active participation',
      ],
      differentiatorFromBelow:
        'At least demonstrated enough interest in healthcare to show up consistently and engage with the medical environment.',
      differentiatorFromAbove:
        'No clinical skills, no patient care responsibility, no medical knowledge application. The student was in a hospital but not doing medicine. AOs specifically distinguish between "being in a medical setting" and "doing medical work."',
      tierRange: [5, 6],
    },

    // ── NOTABLE ───────────────────────────────────────────────────────────
    {
      level: 'notable',
      description:
        'EMT certification with active service. Sustained clinical volunteering with direct patient interaction (200+ hours in patient-facing roles). Peer health educator or CNA certification. Organized health awareness campaigns at school or in community. Research assistant in a clinical or public health lab.',
      whyImpressive:
        'AOs recognize the qualitative jump from observation to action. EMT certification requires real medical training (150+ hours of coursework plus clinical rotations and a national exam) — a HS student who earned it and actively responds to emergencies has demonstrated commitment and capability that shadowing never can. Direct patient interaction (not just being in the same building) shows the student can handle the emotional and interpersonal demands of healthcare. Peer health education demonstrates the ability to translate medical knowledge for others. This level says: "I didn\'t just watch medicine — I practiced it."',
      prevalence:
        'Moderately common among serious pre-med applicants. ~15-25% of pre-med applicants at T30 schools have EMT certification, CNA, or genuinely clinical volunteer experience.',
      applicantPercentile: 'Top 15-25%',
      verificationMarkers: [
        'EMT certification number or training program named',
        'Specific patient care responsibilities described',
        'CNA license or peer educator program named',
        'Direct patient contact hours distinguished from total hours',
        'Describes specific patient interactions or medical scenarios handled',
        'Health campaign with scope and audience described',
      ],
      differentiatorFromBelow:
        'Active medical participation rather than passive observation. The student has earned credentials, handled patient care responsibilities, or applied medical knowledge in practice.',
      differentiatorFromAbove:
        'Skills and involvement are still within established roles and programs. The student is participating in the healthcare system, not advancing it. No original research, no novel health initiatives with measurable outcomes, no publications.',
      tierRange: [4],
    },

    // ── IMPRESSIVE ────────────────────────────────────────────────────────
    {
      level: 'impressive',
      description:
        'Clinical research with IRB approval — data collection, patient recruitment, or analysis for a formal study. Published case study or case report (co-author). Founded or led a health initiative with measurable community impact (e.g., increased screening rates, established a free clinic, health literacy program reaching 500+ people). Regional or state public health competition winner.',
      whyImpressive:
        'AOs recognize that IRB-approved clinical research is qualitatively different from any other medical activity. IRB approval means an institutional ethics board reviewed and approved the student\'s involvement with human subjects — this requires understanding of research ethics, HIPAA compliance, and protocol design. A published case study means the student contributed to medical knowledge, however modestly. Leading a health initiative with measurable outcomes shows the rare combination of medical knowledge, organizational ability, and community impact. These students are already thinking like physicians — not just treating patients but improving systems.',
      prevalence:
        'Uncommon. ~5-10% of pre-med applicants at T20 schools have genuine clinical research involvement or a health initiative with measurable outcomes.',
      applicantPercentile: 'Top 5-10%',
      verificationMarkers: [
        'IRB protocol number or institutional approval referenced',
        'Specific study design described (retrospective, prospective, cohort)',
        'Published case study with journal name and co-author position',
        'Health initiative with specific metrics: people served, outcomes measured',
        'HIPAA training completion mentioned',
        'PI or faculty mentor named with their department/institution',
        'Can describe their specific contribution to the research project',
      ],
      differentiatorFromBelow:
        'Original contribution to medical knowledge or community health outcomes. The student is not just participating in healthcare — they are advancing it through research or systemic improvement. External validation through IRB, publication, or measurable community impact.',
      differentiatorFromAbove:
        'Research contribution is genuine but typically as a co-author or research assistant rather than leading the study. Health initiative impact is local/regional rather than national. The student contributed meaningfully but wasn\'t the primary driver of a major project.',
      tierRange: [3],
    },

    // ── EXCEPTIONAL ───────────────────────────────────────────────────────
    {
      level: 'exceptional',
      description:
        'Co-author on a peer-reviewed clinical paper in a recognized medical journal. Founded a health organization with measurable, sustained outcomes — free clinic serving 1,000+ patients, screening program that detected X conditions, mental health initiative adopted by school district. National health competition finalist. Clinical research presented at a professional medical conference (AMA, specialty society). Patient-outcome data showing direct health impact from student-led initiative.',
      whyImpressive:
        'AOs read these achievements and see a future physician-leader, not just a future pre-med student. Co-authorship on a clinical paper means the student\'s contribution was significant enough for a medical researcher to include them on a publication that will exist in the medical literature permanently. A health organization with sustained, measurable outcomes demonstrates that the student can conceive, build, and maintain a system that improves health at scale. National competition recognition or conference presentation means the student\'s work was evaluated by medical professionals and found meritorious. These students are already making the kind of impact that medical schools seek in their strongest applicants.',
      prevalence:
        'Rare. ~1-2% of pre-med applicants at T10 schools. Genuine clinical publications and large-scale health initiatives by HS students are uncommon enough to be noteworthy.',
      applicantPercentile: 'Top 1-2%',
      verificationMarkers: [
        'Journal name, article title, and author position on clinical paper',
        'Organization with verifiable presence: website, news coverage, 501(c)(3)',
        'Specific outcome data: patients served, conditions detected, lives impacted',
        'Conference name and presentation format (poster vs. oral)',
        'National competition name and finalist status',
        'Longevity — initiative has been running for 1+ years, not a one-time event',
        'Letters of recommendation from clinical mentors referencing the work directly',
      ],
      differentiatorFromBelow:
        'Scale and permanence of impact. The student\'s work has been validated by medical professionals (publication, conference) or has created lasting systemic change in community health. This isn\'t a one-time event — it\'s sustained contribution.',
      differentiatorFromAbove:
        'Publication is co-authored rather than first-authored in a top medical journal. Health initiative is impactful but regional rather than national. The student is exceptional within the HS context but hasn\'t yet achieved recognition at the highest professional level.',
      tierRange: [2],
    },

    // ── EXTRAORDINARY ─────────────────────────────────────────────────────
    {
      level: 'extraordinary',
      description:
        'First-author publication in a peer-reviewed clinical journal. Research involvement in an NIH-funded study with named contribution. Collaboration with WHO, CDC, or equivalent national/international health organization. Health innovation with patent or commercial application. Founded organization adopted as a model by other communities or scaled nationally. Health policy contribution — testimony, advisory role, or authored policy brief adopted by a government entity.',
      whyImpressive:
        'AOs are genuinely astonished by these achievements — and also apply heightened scrutiny because they\'re so exceptional for a HS student. First-author clinical publication means the student drove a study that met the standards of peer-reviewed medical literature, a feat that many MD/PhD candidates spend years pursuing. NIH-funded research involvement indicates the student was valuable enough to be included in a federally funded project — these grants have strict rules about personnel. WHO/CDC collaboration means the student\'s work reached the level of international or national health policy. These students have already made contributions to medicine that most physicians never achieve. AOs don\'t evaluate these applications — they champion them.',
      prevalence:
        'Extraordinarily rare. <0.01% of all applicants. Fewer than 30-50 HS students nationally per year achieve this level in medical/health activities.',
      applicantPercentile: 'Top 0.01%',
      verificationMarkers: [
        'First-author clinical publication with DOI and journal name',
        'NIH grant number or funded project name',
        'WHO/CDC collaboration documented with specific program or initiative',
        'Patent filing for health innovation with application number',
        'Organization replicated in multiple communities with documentation',
        'Policy contribution with government body named',
        'Media coverage from health or mainstream outlets',
        'Independent verification through PubMed, Google Scholar, or organizational records',
      ],
      differentiatorFromBelow:
        'Impact at the highest professional or policy level. The student\'s work has been recognized not just by the medical community but by national or international health organizations. The contribution is permanent — published, patented, or adopted into policy.',
      differentiatorFromAbove:
        'This is the ceiling for HS medical/health activities. These students have achieved what many career physicians and researchers aspire to. There is no higher level of health-related achievement for a HS student.',
      tierRange: [1],
    },
  ],

  technicalDepthMarkers: [
    {
      term: 'IRB-approved research',
      meaning:
        'Research involving human subjects that has been reviewed and approved by an Institutional Review Board. Requires a formal protocol, informed consent procedures, and ongoing compliance.',
      hsContext:
        'IRB approval for a HS student is a strong signal of genuine clinical research involvement. It means a formal institution (hospital, university) vetted the student\'s research plan and deemed it ethically sound. The student had to understand research ethics, write a protocol, and navigate institutional bureaucracy — none of which is trivial.',
      indicatesLevel: 'impressive',
      detectionKeywords: ['IRB', 'IRB-approved', 'institutional review board', 'ethics approval', 'human subjects research'],
      detectionConfidence: 'high',
    },
    {
      term: 'HIPAA compliance',
      meaning:
        'Health Insurance Portability and Accountability Act — federal law protecting patient health information. HIPAA training is required for anyone handling protected health information (PHI).',
      hsContext:
        'Completing HIPAA training indicates the student had access to actual patient data, which means they were trusted enough by a clinical institution to handle sensitive information. This is a step beyond basic volunteering — it implies a real role in the clinical or research workflow.',
      indicatesLevel: 'notable',
      detectionKeywords: ['HIPAA', 'patient privacy', 'protected health information', 'PHI', 'HIPAA certified', 'HIPAA training'],
      detectionConfidence: 'high',
    },
    {
      term: 'patient contact hours',
      meaning:
        'Hours spent in direct interaction with patients, as opposed to administrative, logistical, or observational time in a medical setting.',
      hsContext:
        'AOs distinguish sharply between total volunteer hours and patient contact hours. 500 hours in a hospital gift shop is less meaningful than 100 hours of direct patient interaction. Specific patient contact hour counts signal that the student understands this distinction and had genuinely clinical involvement.',
      indicatesLevel: 'notable',
      detectionKeywords: ['patient contact', 'direct patient care', 'bedside', 'patient interaction', 'clinical hours', 'patient-facing'],
      detectionConfidence: 'medium',
    },
    {
      term: 'clinical shadowing vs. clinical research',
      meaning:
        'Shadowing is passive observation of a physician at work. Clinical research is active participation in a study involving patient data, specimens, or outcomes.',
      hsContext:
        'This is the most important distinction in medical activities. Many students conflate the two, but AOs don\'t. Shadowing is baseline — watching a doctor work. Clinical research means contributing to the generation of medical knowledge. A student who clearly distinguishes their research role from mere observation demonstrates medical sophistication.',
      indicatesLevel: 'notable',
      detectionKeywords: ['clinical research', 'not just shadowing', 'research role', 'data collection', 'patient recruitment', 'chart review'],
      detectionConfidence: 'medium',
    },
    {
      term: 'EMT certification',
      meaning:
        'Emergency Medical Technician certification — requires 150+ hours of training, clinical rotations, psychomotor skills testing, and passing the NREMT national exam.',
      hsContext:
        'EMT certification is one of the strongest medical activity signals for a HS student because it\'s objective, rigorous, and functional. The student can actually provide emergency medical care — they didn\'t just watch, they qualified. Active EMT service (riding ambulance shifts) is even stronger because it demonstrates the ability to perform under life-or-death pressure.',
      indicatesLevel: 'notable',
      detectionKeywords: ['EMT', 'EMT-B', 'EMT-A', 'NREMT', 'emergency medical technician', 'paramedic', 'ambulance'],
      detectionConfidence: 'high',
    },
    {
      term: 'CPR/BLS certification',
      meaning:
        'Cardiopulmonary Resuscitation and Basic Life Support certification. Standard requirement for healthcare workers.',
      hsContext:
        'CPR/BLS alone is baseline — many schools offer it, and it requires only a few hours of training. However, it becomes notable when paired with active use (EMT service, lifeguarding with actual rescues, or as a prerequisite for clinical research access). On its own, it signals interest but not depth.',
      indicatesLevel: 'baseline',
      detectionKeywords: ['CPR', 'BLS', 'basic life support', 'CPR certified', 'AED', 'first responder'],
      detectionConfidence: 'high',
    },
    {
      term: 'retrospective study',
      meaning:
        'Research design that analyzes existing data (medical records, past outcomes) to identify patterns. Common in clinical research because it doesn\'t require new patient recruitment.',
      hsContext:
        'Participation in a retrospective study (chart review, database analysis) is a common entry point for HS students into clinical research. It\'s less logistically complex than prospective studies but still requires HIPAA training, IRB awareness, and data analysis skills. It signals real involvement in the clinical research process.',
      indicatesLevel: 'impressive',
      detectionKeywords: ['retrospective', 'chart review', 'medical records', 'database analysis', 'retrospective cohort', 'case-control'],
      detectionConfidence: 'medium',
    },
    {
      term: 'prospective study',
      meaning:
        'Research design that follows patients forward in time, collecting new data as events unfold. More rigorous and logistically demanding than retrospective studies.',
      hsContext:
        'Involvement in a prospective clinical study is exceptional for a HS student because these studies require sustained time commitment (months to years), active patient recruitment, and ongoing data collection. It indicates a deep, long-term research relationship with a clinical team.',
      indicatesLevel: 'exceptional',
      detectionKeywords: ['prospective', 'longitudinal', 'follow-up study', 'patient enrollment', 'cohort study', 'prospective cohort'],
      detectionConfidence: 'medium',
    },
    {
      term: 'chart review',
      meaning:
        'Systematic review of patient medical records to extract data for research. A common methodology in retrospective clinical studies.',
      hsContext:
        'Chart review requires HIPAA training and institutional trust — the student is handling real patient records. While it\'s a relatively routine research task, it demonstrates genuine integration into a clinical research team and exposure to real medical data, which is notably above basic volunteering.',
      indicatesLevel: 'notable',
      detectionKeywords: ['chart review', 'medical records review', 'patient charts', 'electronic health records', 'EHR', 'EMR'],
      detectionConfidence: 'high',
    },
    {
      term: 'informed consent process',
      meaning:
        'The ethical and legal process of obtaining patient agreement to participate in research. Requires explaining the study, risks, benefits, and alternatives in understandable language.',
      hsContext:
        'A HS student involved in the informed consent process has been trusted with direct patient interaction in a research context. This is rare — most labs shield HS students from patient-facing research duties. Involvement signals exceptional trust from the research team and comfort with sensitive interpersonal interactions.',
      indicatesLevel: 'impressive',
      detectionKeywords: ['informed consent', 'patient consent', 'consent process', 'consenting patients', 'research consent'],
      detectionConfidence: 'high',
    },
  ],
};
