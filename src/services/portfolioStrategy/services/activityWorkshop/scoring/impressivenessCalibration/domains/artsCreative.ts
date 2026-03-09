/**
 * Visual Arts & Creative Writing — Impressiveness Calibration
 *
 * Covers: Drawing, painting, sculpture, photography, digital art,
 * graphic design, creative writing (fiction, poetry, nonfiction),
 * literary magazine, filmmaking, animation.
 *
 * Key insight for AOs: The arts have fewer standardized competitive
 * ladders than debate or athletics. The Scholastic Art & Writing Awards
 * are the universal benchmark — AOs at every selective school recognize
 * Gold Key and American Visions/Voices. Beyond Scholastic, gallery
 * representation, publication in recognized venues, and juried shows
 * provide external validation.
 */

import type { ImpressivenessDomain, ImpressionEntry, TechnicalDepthMarker } from '../types';

const ladder: ImpressionEntry[] = [
  {
    level: 'baseline',
    description:
      'Takes art classes, maintains a personal portfolio or sketchbook. Contributes to school literary magazine or art club. Has a personal creative practice (writing, drawing, photography) without external exhibition or publication. May have a social media presence for creative work.',
    whyImpressive:
      'Not a differentiator. AOs see "art club member" and "personal portfolio" as standard creative engagement. Without external validation — exhibition, publication, or competition recognition — this signals a hobby rather than demonstrated artistic achievement. Social media followers don\'t count as external validation in admissions contexts.',
    prevalence: 'Very common — a large fraction of applicants have some creative arts involvement.',
    applicantPercentile: 'Top 55-80%',
    verificationMarkers: [
      'Named specific medium or creative discipline',
      'Described body of work (portfolio, collection, manuscript)',
      'Mentioned duration of practice or training',
      'Named school publication or club involvement',
    ],
    differentiatorFromBelow: 'Has a sustained creative practice with a body of work, not just occasional participation.',
    differentiatorFromAbove: 'No external exhibition, publication, or competition recognition. Work hasn\'t been evaluated by anyone outside the school.',
    tierRange: [5, 6],
  },
  {
    level: 'notable',
    description:
      'Editor or leadership role on school literary magazine or art publication. Work displayed in school gallery or community exhibition. Scholastic Art & Writing Awards Honorable Mention or Silver Key at regional level. Published in school or local publications. Completed a sustained body of work (portfolio of 15+ pieces, completed manuscript, short film).',
    whyImpressive:
      'AOs recognize that serving as literary magazine editor requires curatorial judgment and leadership — not just creating but evaluating art. Scholastic Silver Key at regional level means expert judges (working artists, writers, educators) evaluated this student\'s work against thousands of submissions and found it meritorious. Community exhibition shows the student has moved beyond the school context. This is where creative arts start to become a real differentiator.',
    prevalence: 'Moderately common — Scholastic receives ~300,000 submissions annually; Silver Key represents roughly top 10-15% at the regional level.',
    applicantPercentile: 'Top 20-35%',
    verificationMarkers: [
      'Literary magazine editor role with publication name',
      'Exhibition with venue name and description',
      'Scholastic Awards level (Silver Key, Honorable Mention) with category and region',
      'Publication credit with publication name',
      'Described body of work with piece count or word count',
      'Community art show or gallery with venue',
    ],
    differentiatorFromBelow: 'External validation through exhibition, publication, or competition recognition. Work evaluated by judges outside the school.',
    differentiatorFromAbove: 'Regional recognition but not national. School or community-level exhibition but not professional gallery representation.',
    tierRange: [4],
  },
  {
    level: 'impressive',
    description:
      'Scholastic Art & Writing Awards Gold Key at regional level. Work exhibited in a juried show or established gallery. Published in recognized literary journal or magazine (not self-published). Won regional or state art/writing competition. Portfolio accepted to pre-college art program (RISD, SAIC, Pratt). Commissioned work by organization or client.',
    whyImpressive:
      'A Scholastic Gold Key means expert judges identified this work as among the best in the entire region — this is the point where AOs sit up and take notice. Exhibition in a juried show or established gallery means professional curators evaluated and selected this student\'s work. Publication in a recognized literary journal (not a school magazine or self-published platform) means professional editors chose this writing over other submissions. AOs see this as evidence of genuine artistic talent validated by the professional creative community.',
    prevalence: 'Uncommon — Scholastic Gold Key represents roughly top 3-5% of regional submissions.',
    applicantPercentile: 'Top 8-15%',
    verificationMarkers: [
      'Scholastic Gold Key with category, region, and year',
      'Juried show or gallery name with exhibition details',
      'Publication name (recognized journal/magazine, not self-published)',
      'State or regional competition with specific award',
      'Pre-college program acceptance with institution name',
      'Commission with client/organization name and context',
      'Portfolio review score or acceptance from art institution',
    ],
    differentiatorFromBelow: 'Gold Key (top of regional) vs. Silver Key. Professional venue exhibition vs. school/community. Recognized publication vs. school magazine.',
    differentiatorFromAbove: 'Regional excellence but not yet nationally recognized. Strong portfolio but not represented by a gallery or nationally published.',
    tierRange: [3],
  },
  {
    level: 'exceptional',
    description:
      'Scholastic Art & Writing Awards Gold Key at national level (American Visions/American Voices nominee or national medalist). Gallery representation by an established gallery. Published in national literary publication (The Adroit Journal, Kenyon Review, etc.). Won national art or writing competition. National portfolio award. Work acquired by collector or institution.',
    whyImpressive:
      'Scholastic National Gold Medal or American Visions/Voices is THE definitive marker for HS visual arts and creative writing — from ~300,000 submissions, only ~2,000 receive national-level recognition, and American Visions/Voices selects ~60 nationally. Gallery representation means a professional gallerist believes this student\'s work has commercial viability. Publication in a nationally recognized literary journal means editors who routinely publish MFA graduates chose a HS student\'s work. AOs — especially at schools with strong arts programs (Yale, RISD, Columbia, NYU) — immediately recognize these as marks of pre-professional artistic talent.',
    prevalence: 'Rare — Scholastic national medals go to ~2,000 students from ~300,000 submissions (under 1%).',
    applicantPercentile: 'Top 1-3%',
    verificationMarkers: [
      'Scholastic National Gold Medal or Silver Medal with category and year',
      'American Visions or American Voices nominee/winner',
      'Gallery representation with gallery name and location',
      'National publication credit with publication name and piece title',
      'National competition winner with competition name',
      'Acquisition by named collector or institution',
      'Portfolio award from national organization',
    ],
    differentiatorFromBelow: 'National-level recognition vs. regional. Professional gallery representation vs. exhibition. National publication vs. regional.',
    differentiatorFromAbove: 'Pre-professional but not yet professional career. Nationally recognized student artist vs. emerging professional.',
    tierRange: [2],
  },
  {
    level: 'extraordinary',
    description:
      'Work exhibited in a museum or major institution (MoMA, Smithsonian, major city museum). Published book (novel, poetry collection, anthology) with a recognized publisher. Won major national award (Scholastic Gold Portfolio, National Book Award for Young People\'s Literature, YoungArts in Visual Arts or Writing). Solo gallery exhibition. Film screened at major festival (Sundance, TIFF). Featured in major art publication or literary review.',
    whyImpressive:
      'This student has already achieved what most working artists spend a career pursuing. Museum exhibition means institutional curators — the highest arbiters of artistic value — deemed this work worthy of public display alongside established artists. A published book with a recognized publisher means this student\'s writing survived the most competitive selection process in the literary world. AOs understand that this isn\'t a promising student — it\'s an arriving artist who happens to still be in high school. This is a once-in-a-career application.',
    prevalence: 'Extremely rare — perhaps 10-30 HS students nationally per year across all visual arts and writing.',
    applicantPercentile: 'Top 0.05%',
    verificationMarkers: [
      'Museum name with exhibition title and dates',
      'Publisher name with book title and ISBN',
      'Major national award with specific award name and year',
      'Solo exhibition with gallery/venue name',
      'Film festival screening with festival name',
      'Major art/literary publication feature with publication name',
      'Press coverage in named publications',
    ],
    differentiatorFromBelow: 'Institutional validation (museum, publisher, major festival) vs. competition success. Professional career underway.',
    differentiatorFromAbove: 'This is the ceiling for HS visual arts and creative writing.',
    tierRange: [1],
  },
];

const technicalDepthMarkers: TechnicalDepthMarker[] = [
  {
    term: 'Scholastic Art & Writing Awards',
    meaning:
      'The largest and most prestigious recognition program for creative teens in the US, run by the Alliance for Young Artists & Writers. Three levels: regional (Gold Key, Silver Key, Honorable Mention), then national (Gold Medal, Silver Medal, American Visions/Voices).',
    hsContext:
      'The universal benchmark for HS creative arts, equivalent to All-State in music. ~300,000 submissions annually. Regional Gold Key is impressive; National Gold Medal is exceptional; American Visions/Voices is extraordinary. AOs at every selective school recognize Scholastic Awards.',
    indicatesLevel: 'impressive',
    detectionKeywords: ['scholastic', 'gold key', 'silver key', 'scholastic art', 'scholastic writing', 'american visions', 'american voices', 'gold medal', 'silver medal'],
    detectionConfidence: 'high',
  },
  {
    term: 'Gallery representation',
    meaning:
      'A professional art gallery has agreed to represent the artist — displaying, marketing, and selling their work in exchange for a commission (typically 50%). This is a professional relationship, not just a one-time exhibition.',
    hsContext:
      'Gallery representation for a HS student is extremely rare and signals that a commercial gallerist believes the work has market value and artistic merit worthy of their reputation. This is fundamentally different from a school or community exhibition.',
    indicatesLevel: 'exceptional',
    detectionKeywords: ['gallery representation', 'represented by', 'gallery artist', 'gallery shows', 'solo show', 'solo exhibition'],
    detectionConfidence: 'medium',
  },
  {
    term: 'Publication credits',
    meaning:
      'Published work (writing, photography, illustration) in a recognized publication. The publication\'s selectivity determines the achievement level: school magazine < local newspaper < regional journal < national literary magazine.',
    hsContext:
      'Publication in a recognized literary journal (The Adroit Journal, Kenyon Review, AGNI, Ploughshares) means professional editors who typically publish MFA graduates chose a HS student\'s work. This is a very strong signal. Self-publishing on Medium or Wattpad does not count.',
    indicatesLevel: 'impressive',
    detectionKeywords: ['published in', 'publication', 'journal', 'magazine', 'literary magazine', 'anthology', 'featured in'],
    detectionConfidence: 'medium',
  },
  {
    term: 'Portfolio review / acceptance',
    meaning:
      'Formal evaluation of an artist\'s body of work by institutional reviewers (art schools, pre-college programs, competitions). Portfolio acceptance indicates that experts assessed the work as meeting professional or pre-professional standards.',
    hsContext:
      'Portfolio review acceptance at competitive institutions (RISD Pre-College, SAIC Early College, Pratt) confirms that trained evaluators see professional potential. The portfolio itself (15-20 pieces showing range and depth) is a significant body of work.',
    indicatesLevel: 'notable',
    detectionKeywords: ['portfolio review', 'portfolio accepted', 'portfolio submission', 'pre-college', 'portfolio award'],
    detectionConfidence: 'medium',
  },
  {
    term: 'Juried show / juried exhibition',
    meaning:
      'An art exhibition where submissions are reviewed and selected by a jury of experts (typically professional artists, curators, or professors). Acceptance means the work met professional curatorial standards.',
    hsContext:
      'Being accepted into a juried show means competing against other artists (often including adults) and being selected by qualified judges. This is external validation of artistic quality that school exhibitions can\'t provide.',
    indicatesLevel: 'impressive',
    detectionKeywords: ['juried show', 'juried exhibition', 'juried', 'selected for exhibition', 'accepted into show'],
    detectionConfidence: 'medium',
  },
  {
    term: 'Commission work',
    meaning:
      'Art or writing created at the request (and payment) of a specific client. A commission means someone valued the artist\'s work enough to pay for a custom creation.',
    hsContext:
      'Commissioned work for a HS student shows that external parties value their art commercially. The nature of the commission matters: a school mural commission is different from a private collector\'s commission.',
    indicatesLevel: 'notable',
    detectionKeywords: ['commissioned', 'commission', 'client work', 'hired to', 'paid to create', 'custom work'],
    detectionConfidence: 'medium',
  },
  {
    term: 'Art school early admission / pre-college program',
    meaning:
      'Acceptance to a pre-college or early admission program at a recognized art school or conservatory (RISD, SAIC, CalArts, Pratt, SVA, Parsons). These competitive programs evaluate portfolios and admit students for intensive summer or academic-year study.',
    hsContext:
      'Pre-college acceptance confirms that art school faculty see this student as having the skill and potential to succeed in a professional art education environment. Programs like RISD Pre-College accept ~20-30% of applicants.',
    indicatesLevel: 'impressive',
    detectionKeywords: ['risd', 'saic', 'calarts', 'pratt', 'sva', 'parsons', 'pre-college', 'early admission', 'summer intensive', 'art school'],
    detectionConfidence: 'high',
  },
  {
    term: 'Literary award',
    meaning:
      'Recognition for creative writing from an established literary organization. Examples: Scholastic Writing Awards, YoungArts Writing, Nancy Thorp Poetry Contest, Foyle Young Poets, Princeton University Poetry Prize.',
    hsContext:
      'Named literary awards carry weight because they involve judging by published authors and literary professionals. The specific award and its selectivity determine the level: school-level contests are baseline; national awards judged by established writers are exceptional.',
    indicatesLevel: 'impressive',
    detectionKeywords: ['literary award', 'writing award', 'poetry prize', 'fiction award', 'writing competition', 'writing contest', 'nancy thorp', 'foyle young poets'],
    detectionConfidence: 'medium',
  },
];

export const ARTS_CREATIVE_IMPRESSIVENESS: ImpressivenessDomain = {
  domainId: 'arts_creative',
  label: 'Visual Arts & Creative Writing',
  overview:
    'The visual arts and creative writing have fewer standardized competitive ladders than athletics or debate, making external validation more critical. The Scholastic Art & Writing Awards are the universal benchmark — AOs at every selective school recognize Gold Key and national medals. Beyond Scholastic, the key signals are professional-world validation: gallery representation, publication in recognized journals, juried exhibitions, and commissioned work. The challenge is distinguishing "I like to draw" from "my work was selected by professional curators" — the gap is enormous.',
  ladder,
  technicalDepthMarkers,
};
