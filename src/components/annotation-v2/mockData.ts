/**
 * Mock data types for the Annotation V2 workshop UI.
 *
 * These types model the essay canvas at a fidelity suitable for
 * the premium annotation components (EssayCanvas, ParagraphBlock, InsightHighlight).
 * They mirror the real Essay Intelligence profile types in simplified form.
 */

// ────────────────────────────────────────────
// Enums / Unions
// ────────────────────────────────────────────

export type AnnotationSeverity = 'critical' | 'important' | 'suggestion' | 'strength';

export type TeachingMode = 'awareness' | 'consequence' | 'connection' | 'action';

export type StructuralWeight = 'load_bearing' | 'supporting' | 'transitional' | 'decorative';

/**
 * Highlight types — each gets a distinct visual treatment in the essay editor.
 * - feedback: coaching feedback (colored by severity)
 * - voice: authentic voice moment (purple shimmer)
 * - connection: links to another paragraph (cyan dotted)
 * - craft: notable writing technique (indigo accent)
 * - thematic: where a theme surfaces (teal subtle)
 */
export type HighlightType = 'feedback' | 'voice' | 'connection' | 'craft' | 'thematic';

// ────────────────────────────────────────────
// Core Types
// ────────────────────────────────────────────

export interface MockAnnotation {
  id: string;
  paragraphIndex: number;
  /** Character offset within the paragraph text */
  startOffset: number;
  /** Character offset — end (exclusive) */
  endOffset: number;
  severity: AnnotationSeverity;
  teachingMode: TeachingMode;
  /** What kind of highlight this is */
  highlightType: HighlightType;
  /** Short insight title */
  title: string;
  /** Full insight text (can be multi-sentence) */
  insight: string;
  /** Whether this annotation is deferred to a later improvement phase */
  isDeferred: boolean;
  /** Where clicking navigates: which right panel tab + optional context */
  navigateTo: RightTab;
  /** Connected paragraph index (for connection highlights) */
  connectedParagraph?: number;
  /** Connection label (for connection highlights) */
  connectionLabel?: string;
}

/** Which right-panel tab to navigate to */
export type RightTab = 'chat' | 'insights' | 'portrait' | 'roadmap';

export interface MockParagraph {
  index: number;
  text: string;
  structuralRole: string;
  structuralWeight: StructuralWeight;
  /** 0-100 effectiveness score */
  effectiveness: number;
  /** Role icon name (lucide) */
  roleIcon: string;
}

export interface MockConnection {
  id: string;
  fromParagraph: number;
  toParagraph: number;
  label: string;
  strength: number; // 0-1
}

// ────────────────────────────────────────────
// Sample data
// ────────────────────────────────────────────

export const MOCK_PARAGRAPHS: MockParagraph[] = [
  {
    index: 0,
    text: 'The fluorescent lights of the hospital waiting room hummed a frequency that matched the tremor in my hands. I was sixteen, holding a clipboard that asked me to be an adult.',
    structuralRole: 'SCENE-SETTING ANCHOR',
    structuralWeight: 'load_bearing',
    effectiveness: 82,
    roleIcon: 'Anchor',
  },
  {
    index: 1,
    text: "My mother had always been the translator — not just of Mandarin to English, but of worlds. She decoded report cards for my grandparents, negotiated with landlords in two languages simultaneously, and somehow made our 600-square-foot apartment feel like enough. But that Tuesday, she was the one who couldn't find the words.",
    structuralRole: 'CHARACTER REVELATION',
    structuralWeight: 'load_bearing',
    effectiveness: 91,
    roleIcon: 'User',
  },
  {
    index: 2,
    text: 'The doctor explained the diagnosis in careful, measured English. I watched my mother nod at each sentence, her comprehension a performance. I knew — because I always knew — that she had understood maybe sixty percent.',
    structuralRole: 'TENSION BUILDER',
    structuralWeight: 'supporting',
    effectiveness: 74,
    roleIcon: 'Flame',
  },
  {
    index: 3,
    text: "So I became the translator. Not of language, but of consequence. I researched treatment options at the public library, cross-referencing medical journals I barely understood with WebMD articles I didn't trust. I learned to ask doctors the questions my mother didn't know to ask.",
    structuralRole: 'TRANSFORMATION PIVOT',
    structuralWeight: 'load_bearing',
    effectiveness: 88,
    roleIcon: 'RotateCcw',
  },
  {
    index: 4,
    text: "This is where I discovered that understanding isn't just linguistic — it's structural. The medical system wasn't designed for people like my family. Forms assumed two parents. Insurance presumed employer coverage. Appointment scheduling required daytime availability that shift workers don't have.",
    structuralRole: 'THEMATIC DEEPENING',
    structuralWeight: 'supporting',
    effectiveness: 65,
    roleIcon: 'Layers',
  },
  {
    index: 5,
    text: 'I started building bridges. A spreadsheet that tracked medications, dosages, and side effects in both languages. A calendar system color-coded by urgency. A script for calling insurance companies that anticipated their objections before they raised them.',
    structuralRole: 'EVIDENCE ANCHOR',
    structuralWeight: 'supporting',
    effectiveness: 79,
    roleIcon: 'FileText',
  },
  {
    index: 6,
    text: "What I didn't expect was how this would reshape everything else. In AP Biology, I stopped memorizing pathways and started understanding systems — because I had lived inside one that failed. In debate, I argued healthcare policy not as an abstract position but as something I'd navigated at 3 AM with a Spanish-English medical dictionary and a mother who was trying not to cry.",
    structuralRole: 'CONNECTION WEAVER',
    structuralWeight: 'transitional',
    effectiveness: 71,
    roleIcon: 'Link',
  },
  {
    index: 7,
    text: "My mother is better now. The tremor in my hands has been replaced by something steadier — not confidence exactly, but the knowledge that I can sit in rooms where I don't belong and make them make sense. That's what I want to study: the architecture of systems that were built without people like us in mind, and how to rebuild them so they work.",
    structuralRole: 'RESOLUTION & FORWARD LOOK',
    structuralWeight: 'load_bearing',
    effectiveness: 86,
    roleIcon: 'Compass',
  },
];

export const MOCK_ANNOTATIONS: MockAnnotation[] = [
  // ── Feedback highlights (coaching feedback, severity-colored) ──
  {
    id: 'a1',
    paragraphIndex: 0,
    startOffset: 0,
    endOffset: 85,
    severity: 'strength',
    teachingMode: 'awareness',
    highlightType: 'feedback',
    title: 'Sensory precision grounds the reader',
    insight: 'The fluorescent lights and hand tremor create immediate physical presence. This is earned detail — specific enough to feel real without over-explaining.',
    isDeferred: false,
    navigateTo: 'insights',
  },
  {
    id: 'a2',
    paragraphIndex: 0,
    startOffset: 86,
    endOffset: 170,
    severity: 'important',
    teachingMode: 'consequence',
    highlightType: 'feedback',
    title: 'Age reveal could land harder',
    insight: '"I was sixteen" is direct but the clipboard detail does the real work. Consider whether stating the age explicitly is necessary when the scene already conveys youth through helplessness.',
    isDeferred: false,
    navigateTo: 'chat',
  },
  {
    id: 'a4',
    paragraphIndex: 2,
    startOffset: 60,
    endOffset: 131,
    severity: 'suggestion',
    teachingMode: 'action',
    highlightType: 'feedback',
    title: 'Pacing opportunity in the medical scene',
    insight: 'The transition from doctor speaking to mother nodding happens quickly. Slowing this moment — even one sentence of physical description — would let the reader feel the weight before you name it.',
    isDeferred: false,
    navigateTo: 'chat',
  },
  {
    id: 'a6',
    paragraphIndex: 4,
    startOffset: 0,
    endOffset: 95,
    severity: 'critical',
    teachingMode: 'consequence',
    highlightType: 'feedback',
    title: 'Thesis statement is too on-the-nose',
    insight: '"Understanding isn\'t just linguistic — it\'s structural" reads as a thesis statement, which breaks the narrative voice established in P1-P3. The insight is real but the delivery is essayistic rather than experiential.',
    isDeferred: false,
    navigateTo: 'chat',
  },
  {
    id: 'a7',
    paragraphIndex: 4,
    startOffset: 96,
    endOffset: 283,
    severity: 'important',
    teachingMode: 'action',
    highlightType: 'feedback',
    title: 'System critique needs grounding',
    insight: 'The list of systemic failures (two parents, employer coverage, daytime availability) is strong but generic. Anchoring one of these to a specific moment from your experience would make this paragraph as vivid as the hospital scene.',
    isDeferred: false,
    navigateTo: 'chat',
  },
  {
    id: 'a10',
    paragraphIndex: 7,
    startOffset: 142,
    endOffset: 315,
    severity: 'important',
    teachingMode: 'consequence',
    highlightType: 'feedback',
    title: 'Forward look is slightly generic',
    insight: '"The architecture of systems" echoes the thesis problem from P4. The ambition is clear but could be more specific — which systems? Healthcare? Education? Policy? Naming one sharpens the vision.',
    isDeferred: false,
    navigateTo: 'chat',
  },
  {
    id: 'a8',
    paragraphIndex: 6,
    startOffset: 0,
    endOffset: 52,
    severity: 'suggestion',
    teachingMode: 'connection',
    highlightType: 'feedback',
    title: 'Transition feels abrupt',
    insight: '"What I didn\'t expect" is a common essay pivot. The connection between medical navigation and academic transformation is strong, but the bridge sentence could be more distinctive.',
    isDeferred: true,
    navigateTo: 'insights',
  },

  // ── Voice highlights (authentic voice moments — purple shimmer) ──
  {
    id: 'v1',
    paragraphIndex: 2,
    startOffset: 132,
    endOffset: 221,
    severity: 'strength',
    teachingMode: 'awareness',
    highlightType: 'voice',
    title: 'Devastating precision',
    insight: '"Maybe sixty percent" — this is where your voice is most itself. The precision is devastating because it doesn\'t ask the reader to feel anything. It just names what you saw.',
    isDeferred: false,
    navigateTo: 'portrait',
  },
  {
    id: 'v2',
    paragraphIndex: 7,
    startOffset: 0,
    endOffset: 28,
    severity: 'strength',
    teachingMode: 'awareness',
    highlightType: 'voice',
    title: 'Restraint as strength',
    insight: '"My mother is better now." Five words carrying the weight of every preceding paragraph. The simplicity IS the technique. Your voice is most powerful when it trusts the reader.',
    isDeferred: false,
    navigateTo: 'portrait',
  },

  // ── Connection highlights (links between paragraphs — cyan) ──
  {
    id: 'cn1',
    paragraphIndex: 0,
    startOffset: 85,
    endOffset: 170,
    severity: 'strength',
    teachingMode: 'connection',
    highlightType: 'connection',
    title: 'Bookend: Tremor → Steadiness',
    insight: 'The trembling hands here mirror the "something steadier" in P8. This bookend creates the essay\'s emotional arc — the reader will feel the transformation when the image recurs.',
    isDeferred: false,
    navigateTo: 'insights',
    connectedParagraph: 7,
    connectionLabel: 'Tremor → Steadiness arc',
  },
  {
    id: 'cn2',
    paragraphIndex: 1,
    startOffset: 45,
    endOffset: 107,
    severity: 'strength',
    teachingMode: 'connection',
    highlightType: 'connection',
    title: 'Translation metaphor deepens',
    insight: '"Not just of Mandarin to English, but of worlds" — this line establishes the metaphor that transforms in P3 when YOU become the translator. The shift from language to systems is the essay\'s structural spine.',
    isDeferred: false,
    navigateTo: 'insights',
    connectedParagraph: 3,
    connectionLabel: 'Mother translator → Narrator translator',
  },

  // ── Craft highlights (writing techniques — indigo) ──
  {
    id: 'cr1',
    paragraphIndex: 1,
    startOffset: 200,
    endOffset: 316,
    severity: 'strength',
    teachingMode: 'awareness',
    highlightType: 'craft',
    title: 'Sentence-final reversal',
    insight: '"But that Tuesday, she was the one who couldn\'t find the words" — the sentence-final reversal technique. You build expectation with listing her capabilities, then invert it. This is professional-grade craft.',
    isDeferred: false,
    navigateTo: 'portrait',
  },
  {
    id: 'cr2',
    paragraphIndex: 5,
    startOffset: 0,
    endOffset: 265,
    severity: 'strength',
    teachingMode: 'awareness',
    highlightType: 'craft',
    title: 'Tricolon with ascending specificity',
    insight: 'Spreadsheet → Calendar → Script. Three tools, each more sophisticated than the last. This ascending tricolon mirrors the narrator\'s growth from reactive to systematic. The parallelism is invisible but structurally perfect.',
    isDeferred: false,
    navigateTo: 'portrait',
  },

  // ── Thematic highlights (where themes surface — teal) ──
  {
    id: 'th1',
    paragraphIndex: 3,
    startOffset: 0,
    endOffset: 65,
    severity: 'strength',
    teachingMode: 'connection',
    highlightType: 'thematic',
    title: 'Theme: Translation as Power',
    insight: '"So I became the translator. Not of language, but of consequence." — the central theme of the essay crystallizes here. Translation shifts from a linguistic act to a structural one, setting up the systemic argument in P5.',
    isDeferred: false,
    navigateTo: 'portrait',
  },
  {
    id: 'th2',
    paragraphIndex: 6,
    startOffset: 157,
    endOffset: 375,
    severity: 'strength',
    teachingMode: 'awareness',
    highlightType: 'thematic',
    title: 'Theme: Invisible Labor resurfaces',
    insight: 'The 3 AM dictionary and the mother trying not to cry — invisible labor made visible. This moment earns the systemic critique in P5 by showing what the system actually costs real people.',
    isDeferred: false,
    navigateTo: 'portrait',
  },
];

export const MOCK_CONNECTIONS: MockConnection[] = [
  {
    id: 'c1',
    fromParagraph: 0,
    toParagraph: 7,
    label: 'Tremor → Steadiness arc',
    strength: 0.95,
  },
  {
    id: 'c2',
    fromParagraph: 1,
    toParagraph: 3,
    label: 'Mother as translator → Narrator as translator',
    strength: 0.88,
  },
  {
    id: 'c3',
    fromParagraph: 3,
    toParagraph: 5,
    label: 'Translation role → Concrete tools',
    strength: 0.72,
  },
  {
    id: 'c4',
    fromParagraph: 2,
    toParagraph: 6,
    label: 'Comprehension gap → Academic lens',
    strength: 0.65,
  },
  {
    id: 'c5',
    fromParagraph: 4,
    toParagraph: 7,
    label: 'System critique → Rebuild ambition',
    strength: 0.80,
  },
];

export const MOCK_ESSAY_TEXT = MOCK_PARAGRAPHS.map((p) => p.text).join('\n\n');

export const MOCK_STRUCTURAL_ISLANDS = [5]; // P5 is somewhat isolated

// ────────────────────────────────────────────
// Right-Panel Types (Portrait, Roadmap, Phase, Coaching)
// ────────────────────────────────────────────

export type ImpactLevel = 'transformative' | 'significant' | 'incremental';
export type PhaseLevel = 'foundation' | 'architecture' | 'craft' | 'polish' | 'distinction';
export type ThematicStrength = 'dominant' | 'supporting' | 'hinted';

export interface MockPhase {
  level: PhaseLevel;
  reasoning: string;
  focusAreas: string[];
  deferredAreas: string[];
}

export interface MockThematicThread {
  theme: string;
  strength: ThematicStrength;
  description: string;
}

export interface MockArchetype {
  name: string;
  poolDensity: string;
  differentiator: string;
}

export interface MockPortrait {
  centralTension: string;
  essayUnderstandingProse: string;
  voiceSignature: string;
  writerPortrait: string;
  narrativeStrategy: string;
  arcType: string;
  emotionalArc: string;
  memorability: string;
  distinctivenessFactors: string[];
  tellability: string;
  archetype: MockArchetype;
  values: string[];
  thematicThreads: MockThematicThread[];
  throughLine?: string;
  redFlags?: string[];
}

export interface MockRoadmapPriority {
  rank: number;
  description: string;
  impact: ImpactLevel;
  targetParagraphs: number[];
  relatedAnnotationIds: string[];
}

export interface MockProtectedStrength {
  description: string;
  location: string;
  paragraphIndex: number;
}

export interface MockRoadmap {
  transformativeInsight: string;
  priorities: MockRoadmapPriority[];
  protectedStrengths: MockProtectedStrength[];
}

export interface MockScore {
  dimensionId: string;
  label: string;
  score: number;
  maxScore: number;
}

/** Composite type for the full right-panel data */
export interface MockEssayData {
  paragraphs: MockParagraph[];
  annotations: MockAnnotation[];
  connections: MockConnection[];
  essayText: string;
  portrait: MockPortrait;
  phase: MockPhase;
  eqi: number;
  confidence: string;
  roadmap: MockRoadmap;
  scores: MockScore[];
  structuralIslands: number[];
}

// ────────────────────────────────────────────
// Portrait & Roadmap Sample Data
// ────────────────────────────────────────────

export const MOCK_PORTRAIT: MockPortrait = {
  centralTension: 'The pull between navigating systems designed to exclude your family and building something that ensures no other family is left to navigate alone.',
  essayUnderstandingProse: `This essay does something quietly devastating: it reframes a story of family hardship into a story of systems thinking. The writer doesn't ask the reader to feel sorry for them — they ask the reader to see what they saw: a medical system that assumes English fluency, two-parent households, and daytime availability. And then they show what they did about it.

The narrative architecture is sophisticated. It opens with physical vulnerability (trembling hands, a clipboard demanding adulthood), establishes the mother as the original translator, then documents the precise moment when that translation had to be inherited. The middle paragraphs build a bridge between crisis and craft — spreadsheets, color-coded calendars, insurance scripts — showing that this student didn't just endure a difficult situation but reverse-engineered it.

What makes this essay memorable is its restraint. "My mother is better now" carries the weight of every preceding paragraph in five words. The writer trusts the reader to feel the relief without performing it.`,
  voiceSignature: 'Precise and structural, with moments of devastating simplicity. The writer builds complex observations through short, declarative sentences that accumulate force. There is a confidence in the prose that comes from having lived through something and understood it, rather than from rhetorical skill alone.',
  writerPortrait: 'A systems thinker who learned systems thinking not from a textbook but from 3 AM phone calls with insurance companies. Someone who sees patterns — in medical forms, in language barriers, in power structures — and responds not with anger but with spreadsheets and scripts. Deeply practical, deeply principled.',
  narrativeStrategy: 'Crisis → Inheritance → Engineering → Synthesis → Forward Vision. The structure mirrors the writer\'s own cognitive journey: from overwhelmed teenager to systematic problem-solver.',
  arcType: 'The Reluctant Systems Engineer',
  emotionalArc: 'Vulnerability → Responsibility → Competence → Structural Understanding → Purposeful Ambition. The arc avoids the trap of "everything is fine now" by ending with aspiration rather than resolution.',
  memorability: 'In a reading pool of 30+ essays, this would be remembered as "the translator essay" or "the spreadsheet student." The progression from trembling hands to insurance scripts creates a vivid, retellable narrative spine. The five-word resolution ("My mother is better now") is a strong memory anchor.',
  distinctivenessFactors: [
    'Systems thinking as narrative engine',
    'Specific tools (spreadsheets, color-coded calendars, scripts)',
    'Translation metaphor that deepens across paragraphs',
    'Devastating restraint in the resolution',
    'Immigrant family context handled without sentiment',
  ],
  tellability: 'Very high. An admissions officer could retell this in committee with one sentence: "The student who became the family translator — not just of language, but of the entire medical system — and built tools to decode it." The concrete details (insurance scripts, color-coded calendars) make it easy to recall and advocate for.',
  archetype: {
    name: 'The Reluctant Systems Engineer',
    poolDensity: 'Moderate — immigrant family medical stories exist, but the systems-engineering angle is rare',
    differentiator: 'Most immigrant stories center the emotional journey. This one centers the structural analysis — what the system looks like from the inside, and what it takes to make it work for people it wasn\'t designed for.',
  },
  values: ['Systems Thinking', 'Family Responsibility', 'Structural Equity', 'Practical Problem-Solving', 'Restrained Honesty'],
  thematicThreads: [
    { theme: 'Translation as Power', strength: 'dominant', description: 'From linguistic translation to systemic translation — the central metaphor that drives every paragraph.' },
    { theme: 'Invisible Labor', strength: 'supporting', description: 'The work of decoding systems that were built to exclude — spreadsheets, scripts, research at 3 AM.' },
    { theme: 'Inherited Responsibility', strength: 'supporting', description: 'The moment when the mother\'s role passed to the child, and what that inheritance meant.' },
    { theme: 'Structural Inequity', strength: 'hinted', description: 'The medical system\'s assumptions (two parents, employer coverage, daytime availability) as quiet violence.' },
  ],
  throughLine: 'From the trembling hands holding a clipboard to the steady hands building tools to decode systems — every paragraph traces the transformation from helpless participant to deliberate architect.',
  redFlags: [],
};

export const MOCK_PHASE: MockPhase = {
  level: 'craft',
  reasoning: 'Foundation (structure, central tension) and architecture (narrative arc, evidence flow) are solid. The work now is at the craft level: tightening the thesis statement in P4, grounding the systemic critique with a specific moment, and polishing the forward-looking close.',
  focusAreas: ['Thesis delivery in P4 (show, don\'t state)', 'Grounding systemic critique with specifics', 'Forward vision precision'],
  deferredAreas: ['Sentence-level rhythm', 'Transition polish', 'Punctuation refinement'],
};

export const MOCK_ROADMAP: MockRoadmap = {
  transformativeInsight: 'Your essay already does the hardest thing — it has a genuine structural insight delivered through lived experience. The remaining work is about trusting the scenes to teach the reader, rather than telling them what to learn. Every place where you explain what the reader can already see is an opportunity to show something new instead.',
  priorities: [
    {
      rank: 1,
      description: 'Rewrite the thesis statement in P4 so the insight emerges from experience rather than announcement. "Understanding isn\'t just linguistic — it\'s structural" tells us what to think instead of letting us discover it.',
      impact: 'transformative',
      targetParagraphs: [4],
      relatedAnnotationIds: ['a6'],
    },
    {
      rank: 2,
      description: 'Ground the systemic critique in P4 with a specific moment — one insurance call, one form that didn\'t fit, one appointment that couldn\'t be scheduled. The list is strong but generic.',
      impact: 'transformative',
      targetParagraphs: [4],
      relatedAnnotationIds: ['a7'],
    },
    {
      rank: 3,
      description: 'Sharpen the forward vision in P7 — "the architecture of systems" echoes the thesis problem. Name a specific system. Healthcare policy? Medical interpreting infrastructure? Patient advocacy design?',
      impact: 'significant',
      targetParagraphs: [7],
      relatedAnnotationIds: ['a10'],
    },
    {
      rank: 4,
      description: 'Add a beat of physical description to the medical scene transition in P2 — let the reader sit in the comprehension gap before you name the sixty percent.',
      impact: 'significant',
      targetParagraphs: [2],
      relatedAnnotationIds: ['a4'],
    },
    {
      rank: 5,
      description: 'Consider making the "What I didn\'t expect" transition in P6 more distinctive — it\'s currently a common essay pivot that slightly undermines the prose quality.',
      impact: 'incremental',
      targetParagraphs: [6],
      relatedAnnotationIds: ['a8'],
    },
  ],
  protectedStrengths: [
    {
      description: 'The "My mother is better now" five-word resolution — devastating in its restraint.',
      location: 'P7, opening line',
      paragraphIndex: 7,
    },
    {
      description: 'The "sixty percent" specificity — transforms an abstract communication gap into something visceral.',
      location: 'P2, final sentence',
      paragraphIndex: 2,
    },
    {
      description: 'The translation metaphor deepening ("not just of Mandarin to English, but of worlds") — does triple duty.',
      location: 'P1, second sentence',
      paragraphIndex: 1,
    },
  ],
};

export const MOCK_SCORES: MockScore[] = [
  { dimensionId: 'voice', label: 'Voice & Authenticity', score: 8.2, maxScore: 10 },
  { dimensionId: 'narrative', label: 'Narrative Arc', score: 8.5, maxScore: 10 },
  { dimensionId: 'craft', label: 'Writing Craft', score: 7.4, maxScore: 10 },
  { dimensionId: 'authenticity', label: 'Emotional Authenticity', score: 9.1, maxScore: 10 },
  { dimensionId: 'insight', label: 'Depth of Insight', score: 7.8, maxScore: 10 },
  { dimensionId: 'structure', label: 'Structure & Flow', score: 8.0, maxScore: 10 },
  { dimensionId: 'specificity', label: 'Specificity', score: 8.6, maxScore: 10 },
  { dimensionId: 'impact', label: 'Reader Impact', score: 8.3, maxScore: 10 },
  { dimensionId: 'originality', label: 'Originality', score: 7.2, maxScore: 10 },
  { dimensionId: 'growth', label: 'Growth Evidence', score: 7.9, maxScore: 10 },
  { dimensionId: 'fit', label: 'Institutional Fit', score: 7.5, maxScore: 10 },
];

/** Composite mock data for the full right-panel experience */
export const MOCK_ESSAY_DATA: MockEssayData = {
  paragraphs: MOCK_PARAGRAPHS,
  annotations: MOCK_ANNOTATIONS,
  connections: MOCK_CONNECTIONS,
  essayText: MOCK_ESSAY_TEXT,
  portrait: MOCK_PORTRAIT,
  phase: MOCK_PHASE,
  eqi: 81,
  confidence: 'Deep',
  roadmap: MOCK_ROADMAP,
  scores: MOCK_SCORES,
  structuralIslands: MOCK_STRUCTURAL_ISLANDS,
};
