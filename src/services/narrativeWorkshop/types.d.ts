/**
 * Narrative Workshop Type System
 *
 * World-class type definitions for the most sophisticated narrative analysis
 * and generation system ever built. This system performs multi-layered deep
 * analysis through multiple LLM calls and deterministic pattern matching to
 * understand essays at their very essence.
 *
 * Architecture:
 * Stage 1: Holistic Understanding (overview)
 * Stage 2: Deep Dive Analysis (6 parallel focused analyses)
 * Stage 3: Grammar & Writing Style (deterministic + LLM)
 * Stage 4: Contextualization & Synthesis (aggregate everything)
 * Stage 5: Specific Insights (sentence-level precision)
 */
export interface NarrativeEssayInput {
    essayText: string;
    essayType?: 'personal_statement' | 'uc_piq' | 'why_us' | 'supplemental' | 'activity_essay';
    promptText?: string;
    maxWords?: number;
    targetSchools?: string[];
    studentContext?: {
        intendedMajor?: string;
        culturalBackground?: string;
        academicStrength?: 'strong' | 'moderate' | 'developing';
        voicePreference?: 'concise' | 'warm' | 'understated';
    };
}
export interface HolisticUnderstanding {
    centralTheme: string;
    narrativeThread: string;
    primaryVoice: 'conversational' | 'reflective' | 'analytical' | 'poetic' | 'matter-of-fact';
    voiceConsistency: number;
    essayStructure: 'chronological' | 'thematic' | 'moment-focused' | 'montage' | 'circular' | 'unclear';
    numberOfDistinctSections: number;
    transitionQuality: number;
    keyMoments: Array<{
        type: 'opening' | 'conflict' | 'turning_point' | 'reflection' | 'conclusion';
        sentenceRange: [number, number];
        description: string;
        effectiveness: number;
    }>;
    identifiedThemes: string[];
    emotionalArc: string;
    universalInsight: string | null;
    overallCoherence: number;
    authenticitySignals: string[];
    redFlags: string[];
    firstImpression: string;
    estimatedStrengthTier: 'exceptional' | 'strong' | 'competent' | 'developing' | 'weak';
    comparisonToTypicalEssay: string;
    analyzedAt: string;
    tokensUsed: number;
}
export interface OpeningAnalysis {
    hookType: 'scene' | 'dialogue' | 'provocative_claim' | 'question' | 'generic' | 'none';
    hookStrength: number;
    hookQuote: string;
    hookAnalysis: string;
    hasOpeningScene: boolean;
    sceneVividness: number;
    sensoryDetails: string[];
    temporalAnchor: string | null;
    spatialAnchor: string | null;
    contextClarity: number;
    missingContext: string[];
    readerEngagement: number;
    improvementSuggestions: string[];
    weakExample: string | null;
    strongExample: string | null;
    tokensUsed: number;
}
export interface BodyDevelopmentAnalysis {
    narrativeProgression: number;
    specificityLevel: number;
    quantificationPresence: number;
    characterGrowth: number;
    agencyDemonstration: number;
    relationshipDevelopment: number;
    concreteExamples: string[];
    vagueStatements: string[];
    showVsTell: {
        showing: number;
        telling: number;
        balance: string;
    };
    pacingRating: number;
    rushedSections: string[];
    belaboredSections: string[];
    detectedIssues: Array<{
        type: string;
        severity: 'critical' | 'major' | 'minor';
        quote: string;
        explanation: string;
        suggestion: string;
    }>;
    tokensUsed: number;
}
export interface ClimaxTurningPointAnalysis {
    hasIdentifiableClimax: boolean;
    climaxLocation: number | null;
    climaxDescription: string;
    climaxStrength: number;
    hasTurningPoint: boolean;
    turningPointType: 'realization' | 'decision' | 'event' | 'conversation' | 'none';
    turningPointQuote: string | null;
    turningPointDepth: number;
    stakesPresent: boolean;
    stakesClarity: number;
    stakesDescription: string;
    emotionalInvestment: number;
    conflictPresent: boolean;
    conflictType: 'internal' | 'external' | 'both' | 'none';
    conflictComplexity: number;
    vulnerabilityPresent: boolean;
    vulnerabilityMoments: Array<{
        quote: string;
        type: 'emotional' | 'intellectual' | 'limitation_admission';
        depth: number;
    }>;
    improvementSuggestions: string[];
    tokensUsed: number;
}
export interface ConclusionReflectionAnalysis {
    conclusionType: 'forward_looking' | 'circular' | 'reflective' | 'summary' | 'weak';
    conclusionStrength: number;
    conclusionQuote: string;
    reflectionPresent: boolean;
    reflectionDepth: number;
    reflectionType: 'surface' | 'moderate' | 'deep' | 'profound';
    meaningMakingPresent: boolean;
    universalInsight: string | null;
    microToMacro: {
        present: boolean;
        specificExperience: string | null;
        universalLesson: string | null;
        connectionQuality: number;
    };
    intellectualMaturity: number;
    philosophicalDepth: number;
    nuancedThinking: string[];
    clichesDetected: string[];
    genericStatements: string[];
    futureConnectionPresent: boolean;
    futureConnectionDescription: string | null;
    improvementSuggestions: string[];
    tokensUsed: number;
}
export interface CharacterDevelopmentAnalysis {
    protagonistClarity: number;
    agencyLevel: number;
    interiorityPresent: boolean;
    interiorityDepth: number;
    emotionsExpressed: Array<{
        emotion: string;
        specificity: 'specific' | 'generic';
        quote: string;
    }>;
    voiceAuthenticity: number;
    authenticMarkers: string[];
    inauthenticMarkers: string[];
    dialoguePresent: boolean;
    dialogueCount: number;
    dialogueQuality: number;
    dialogueExamples: string[];
    relationshipsPortrayed: Array<{
        person: string;
        relationship: string;
        depth: number;
        impact: string;
    }>;
    beforeState: string | null;
    afterState: string | null;
    growthClarity: number;
    improvementSuggestions: string[];
    tokensUsed: number;
}
export interface StakesTensionAnalysis {
    tensionPresent: boolean;
    tensionLevel: number;
    tensionSources: string[];
    stakesEstablished: boolean;
    stakesType: 'personal' | 'relational' | 'academic' | 'community' | 'unclear';
    stakesHeight: number;
    conflictMarkers: string[];
    conflictDensity: number;
    suspenseBuilding: number;
    readerInvestment: number;
    resolutionPresent: boolean;
    resolutionSatisfying: boolean;
    resolutionDescription: string | null;
    improvementSuggestions: string[];
    tokensUsed: number;
}
export interface DeepDiveAnalyses {
    opening: OpeningAnalysis;
    bodyDevelopment: BodyDevelopmentAnalysis;
    climaxTurningPoint: ClimaxTurningPointAnalysis;
    conclusionReflection: ConclusionReflectionAnalysis;
    characterDevelopment: CharacterDevelopmentAnalysis;
    stakesTension: StakesTensionAnalysis;
    totalTokensUsed: number;
    analysesCompletedAt: string;
}
export interface GrammarAnalysis {
    sentenceCount: number;
    averageSentenceLength: number;
    sentenceLengthVariance: number;
    shortSentences: number;
    longSentences: number;
    sentenceVarietyScore: number;
    activeVoiceCount: number;
    passiveVoiceCount: number;
    passiveVoiceRatio: number;
    weakVerbs: string[];
    strongVerbs: string[];
    totalWords: number;
    uniqueWords: number;
    lexicalDiversity: number;
    clichePhrases: string[];
    overusedWords: Array<{
        word: string;
        count: number;
    }>;
    dashUsage: number;
    semicolonUsage: number;
    colonUsage: number;
    fragmentCount: number;
    punctuationEffectiveness: number;
    grammaticalErrors: Array<{
        type: string;
        quote: string;
        correction: string;
    }>;
    redFlags: string[];
    greenFlags: string[];
}
export interface WritingStyleAnalysis {
    formalityLevel: number;
    energyLevel: number;
    warmth: number;
    confidence: number;
    rhythmQuality: number;
    flowAnalysis: string;
    jarringTransitions: string[];
    smoothTransitions: string[];
    imageryPresent: boolean;
    imageryStrength: number;
    sensoryDetailCount: number;
    sensoryExamples: string[];
    metaphorsPresent: boolean;
    metaphorQuality: number;
    metaphorExamples: string[];
    clichedMetaphors: string[];
    originalPhrases: string[];
    genericPhrases: string[];
    styleComparison: string;
    styleStrengths: string[];
    styleWeaknesses: string[];
    tokensUsed: number;
}
export interface GrammarStyleAnalysis {
    grammar: GrammarAnalysis;
    style: WritingStyleAnalysis;
    overallCraftScore: number;
    topStrengths: string[];
    topWeaknesses: string[];
    improvementPriorities: string[];
}
export interface SynthesizedInsights {
    overallQualityScore: number;
    impressionLabel: 'exceptional' | 'compelling' | 'competent' | 'developing' | 'weak';
    oneLineSummary: string;
    dimensionScores: {
        openingPower: number;
        narrativeArc: number;
        characterInteriority: number;
        showDontTell: number;
        reflectionMeaningMaking: number;
        dialogueAction: number;
        originalityVoice: number;
        structurePacing: number;
        sentenceCraft: number;
        contextConstraints: number;
        schoolFit: number;
        ethicalHumility: number;
    };
    topStrengths: Array<{
        strength: string;
        evidence: string[];
        rarityFactor: string;
        whyItMatters: string;
    }>;
    criticalGaps: Array<{
        gap: string;
        impact: string;
        evidence: string[];
        fixComplexity: 'easy' | 'moderate' | 'challenging';
    }>;
    opportunities: Array<{
        opportunity: string;
        currentState: string;
        potentialState: string;
        captureStrategy: string;
        estimatedImpact: number;
    }>;
    officerPerspective: {
        firstImpression: string;
        credibilityAssessment: string;
        memorabilityFactor: number;
        emotionalImpact: number;
        intellectualImpact: number;
        concernsFlags: string[];
        positiveSignals: string[];
    };
    comparativeContext: {
        vsTypicalApplicant: string;
        vsTop10Percent: string;
        competitiveAdvantages: string[];
        competitiveWeaknesses: string[];
        percentileEstimate: string;
    };
    improvementRoadmap: {
        quickWins: Array<{
            action: string;
            timeEstimate: string;
            impactEstimate: string;
            difficulty: 'easy';
        }>;
        strategicMoves: Array<{
            action: string;
            timeEstimate: string;
            impactEstimate: string;
            difficulty: 'moderate';
        }>;
        transformativeMoves: Array<{
            action: string;
            timeEstimate: string;
            impactEstimate: string;
            difficulty: 'challenging';
        }>;
        aspirationalTarget: string;
    };
    keyInsights: string[];
    tokensUsed: number;
    synthesizedAt: string;
}
export interface SentenceLevelInsight {
    insightId: string;
    sentenceIndex: number;
    sentenceText: string;
    paragraphIndex: number;
    essaySection: 'opening' | 'body' | 'climax' | 'conclusion';
    issueType: string;
    issueCategory: string;
    severity: 'critical' | 'major' | 'minor';
    whatWeDetected: string;
    whyItMatters: string;
    impactOnScore: string;
    surroundingContext: {
        beforeSentence: string | null;
        afterSentence: string | null;
    };
    weakExample: string | null;
    strongExample: string | null;
    whatToNotice: string;
    solutions: Array<{
        approach: string;
        difficulty: 'easy' | 'moderate' | 'challenging';
        timeEstimate: string;
        impactEstimate: string;
        steps?: string[];
        transferablePrinciple: string;
    }>;
    beforeText: string;
    suggestedAfter: string;
    rationale: string;
    preFillledChatPrompt: string;
    suggestedFollowUps: string[];
}
export interface GeneralInsight {
    insightId: string;
    insightType: 'strength' | 'gap' | 'opportunity';
    title: string;
    description: string;
    evidence: string[];
    impactAssessment: string;
    rarityFactor?: string;
    fixComplexity?: 'easy' | 'moderate' | 'challenging';
    actionableSteps: string[];
    estimatedImpact: string;
}
export interface SpecificInsights {
    sentenceLevelInsights: SentenceLevelInsight[];
    generalInsights: GeneralInsight[];
    bySection: {
        opening: SentenceLevelInsight[];
        body: SentenceLevelInsight[];
        climax: SentenceLevelInsight[];
        conclusion: SentenceLevelInsight[];
    };
    bySeverity: {
        critical: SentenceLevelInsight[];
        major: SentenceLevelInsight[];
        minor: SentenceLevelInsight[];
    };
    byDimension: Record<string, SentenceLevelInsight[]>;
    prioritizedInsights: SentenceLevelInsight[];
}
export interface NarrativeWorkshopAnalysis {
    input: NarrativeEssayInput;
    stage1_holisticUnderstanding: HolisticUnderstanding;
    stage2_deepDiveAnalyses: DeepDiveAnalyses;
    stage3_grammarStyleAnalysis: GrammarStyleAnalysis;
    stage4_synthesizedInsights: SynthesizedInsights;
    stage5_specificInsights: SpecificInsights;
    analysisId: string;
    analyzedAt: string;
    totalTokensUsed: number;
    performanceMetrics: {
        stage1Ms: number;
        stage2Ms: number;
        stage3Ms: number;
        stage4Ms: number;
        stage5Ms: number;
        totalMs: number;
    };
    overallScore: number;
    topPriorities: string[];
    quickSummary: string;
}
export interface NarrativeWorkshopOptions {
    depth?: 'quick' | 'standard' | 'comprehensive';
    includeStage1?: boolean;
    includeStage2?: boolean;
    includeStage3?: boolean;
    includeStage4?: boolean;
    includeStage5?: boolean;
    temperature?: number;
    maxTokensPerCall?: number;
    focusAreas?: Array<'opening' | 'body' | 'climax' | 'conclusion' | 'style' | 'grammar'>;
    maxInsightsPerSeverity?: {
        critical: number;
        major: number;
        minor: number;
    };
}
export interface NarrativePattern {
    patternId: string;
    patternName: string;
    category: string;
    severity: 'critical' | 'major' | 'minor';
    detectionRegex?: RegExp;
    detectionFunction?: (text: string) => boolean;
    technicalExplanation: string;
    whyItMatters: string;
    commonIn: string;
    weakExample: string;
    strongExample: string;
    quickFix?: string;
    deepFix?: string;
}
export type { NarrativeEssayInput, NarrativeWorkshopAnalysis, NarrativeWorkshopOptions, HolisticUnderstanding, DeepDiveAnalyses, GrammarStyleAnalysis, SynthesizedInsights, SpecificInsights, OpeningAnalysis, BodyDevelopmentAnalysis, ClimaxTurningPointAnalysis, ConclusionReflectionAnalysis, CharacterDevelopmentAnalysis, StakesTensionAnalysis, GrammarAnalysis, WritingStyleAnalysis, SentenceLevelInsight, GeneralInsight, NarrativePattern, };
//# sourceMappingURL=types.d.ts.map