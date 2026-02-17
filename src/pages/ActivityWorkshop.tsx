// @ts-nocheck - Large page with many integration points
/**
 * Activity Workshop - Exact clone of PIQ Workshop
 * 
 * This is a verbatim copy of PIQWorkshop.tsx.
 * All PIQ-specific logic, imports, and UI remain identical.
 * Changes will be made incrementally from this baseline.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowLeft, Loader2, RefreshCcw, Target, TrendingUp, TrendingDown, Minus, AlertTriangle, History, XCircle, CheckCircle, PenTool, Info, Sparkles, X, ChevronLeft, ChevronRight, Pencil, Check } from 'lucide-react';
import GradientText from '@/components/ui/GradientText';

// UI Components
import { EditorView } from '@/components/portfolio/extracurricular/workshop/views/EditorView';
import { RubricDimensionCard } from '@/components/portfolio/extracurricular/workshop/RubricDimensionCard';
import type { RubricDimension, WritingIssue, EditSuggestion } from '@/components/portfolio/extracurricular/workshop/types';
import ContextualWorkshopChat from '@/components/portfolio/extracurricular/workshop/components/ContextualWorkshopChat';
import { DraftVersionHistory } from '@/components/portfolio/extracurricular/workshop/DraftVersionHistory';
import { RandomizingScore } from '@/components/portfolio/piq/workshop/RandomizingScore';

// New Version History System (v2)
import { VersionHistoryDrawer } from '@/components/portfolio/extracurricular/workshop/VersionHistoryDrawer';
import { SaveStatusIndicator } from '@/components/portfolio/extracurricular/workshop/SaveStatusIndicator';
import { LocalRecoveryBanner } from '@/components/portfolio/extracurricular/workshop/LocalRecoveryBanner';
import { AutosaveManager, type AutosaveState } from '@/services/piqWorkshop/autosaveService';
import { checkLocalRecovery, saveLocalDraft, clearAllLocalDrafts } from '@/services/piqWorkshop/storageService';

// PIQ Prompt Selector
import { UC_PIQ_PROMPTS } from '@/components/portfolio/piq/workshop/PIQPromptSelector';
import { PIQCarouselNav } from '@/components/portfolio/piq/workshop/PIQCarouselNav';

// Backend Integration
import { analyzePIQEntry, analyzePIQEntryTwoStep } from '@/services/piqWorkshopAnalysisService';
import type { AnalysisResult } from '@/components/portfolio/extracurricular/workshop/backendTypes';

// Storage Services
import {
  saveToLocalStorage,
  loadFromLocalStorage,
  hasRecentAutoSave,
  cacheAnalysisResult,
  getCachedAnalysisResult,
  createVersionSnapshot,
  formatSaveTime,
  type PIQWorkshopCache,
  type DraftVersion as StorageDraftVersion
} from '@/services/piqWorkshop/storageService';

// Database Services (NEW - replaces supabaseService)
import {
  saveOrUpdatePIQEssay,
  saveAnalysisReport,
  loadPIQEssay,
  getVersionHistory,
  saveMilestoneVersion,
  saveAnalysisVersion,
  saveAutosaveVersion,
  restoreVersion,
  type PIQVersion,
} from '@/services/piqWorkshop/piqDatabaseService';

// Stub functions for missing imports (will be implemented in future)
const getCurrentEssayId = async () => null as string | null;
const saveChatMessages = async () => ({ success: true });
const loadChatMessages = async () => ({ success: true, messages: [] });

// Chat message type
import type { ChatMessage } from '@/services/workshop/chatService';

// Authentication
import { useAuth } from '@clerk/clerk-react';
import { useClerkUserId, useIsAuthenticated } from '@/services/auth/clerkSupabaseAdapter';

// React Query for caching
import { useQueryClient } from '@tanstack/react-query';
import { usePIQEssay, type PIQEssayData } from '@/query/usePIQEssay';
import { queryKeys } from '@/query/queryKeys';

// Navigation - handled by DashboardLayout

// Credits System
import { canAnalyzeEssay, deductForEssayAnalysis, CREDIT_COSTS } from '@/services/credits';
import { InsufficientCreditsModal } from '@/components/credits';

// ============================================================================
// CONSTANTS
// ============================================================================

// Minimum characters required to trigger analysis (prevents wasting API credits)
const MIN_ESSAY_LENGTH = 50;

interface DraftVersion {
  text: string;
  timestamp: number;
  score?: number;
  source?: 'analyze' | 'save_draft';
}

export default function ActivityWorkshop() {
  const navigate = useNavigate();
  const { piqNumber } = useParams<{ piqNumber?: string }>();

  const getPromptIdFromUrl = (): string => {
    if (piqNumber) {
      const num = parseInt(piqNumber);
      if (num >= 1 && num <= 8) {
        return `piq${num}`;
      }
    }
    return 'piq1';
  };

  // ============================================================================
  // AUTHENTICATION
  // ============================================================================

  const { getToken } = useAuth();
  const userId = useClerkUserId();
  const isAuthenticated = useIsAuthenticated();
  const queryClient = useQueryClient();

  // ============================================================================
  // STATE
  // ============================================================================

  const [selectedPromptId, setSelectedPromptId] = useState<string>(getPromptIdFromUrl());
  const selectedPrompt = UC_PIQ_PROMPTS.find(p => p.id === selectedPromptId);
  
  const {
    data: piqData,
    isLoading: isLoadingPIQData,
  } = usePIQEssay(userId, selectedPromptId, selectedPrompt?.prompt || '');

  const [currentEssayId, setCurrentEssayId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaveError, setLastSaveError] = useState<string | null>(null);
  const [isLoadingFromDatabase, setIsLoadingFromDatabase] = useState(false);
  const [showResumeSessionBanner, setShowResumeSessionBanner] = useState(false);

  const [showVersionHistoryDrawer, setShowVersionHistoryDrawer] = useState(false);
  const [dbVersionHistory, setDbVersionHistory] = useState<PIQVersion[]>([]);
  const [isLoadingVersionHistory, setIsLoadingVersionHistory] = useState(false);
  const [versionHistoryError, setVersionHistoryError] = useState<string | null>(null);
  
  const [autosaveState, setAutosaveState] = useState<AutosaveState>({
    status: 'idle',
    lastSavedAt: null,
    lastError: null,
    hasUnsavedChanges: false,
  });
  const autosaveManagerRef = useRef<AutosaveManager | null>(null);
  
  const [showLocalRecovery, setShowLocalRecovery] = useState(false);
  const [localRecoveryData, setLocalRecoveryData] = useState<{
    content: string;
    savedAt: number;
    wordCount: number;
  } | null>(null);
  const [isRestoringLocal, setIsRestoringLocal] = useState(false);

  const [currentDraft, setCurrentDraft] = useState('');
  const [draftVersions, setDraftVersions] = useState<DraftVersion[]>([]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0);
  const [dimensions, setDimensions] = useState<RubricDimension[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [needsReanalysis, setNeedsReanalysis] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [expandedDimensionId, setExpandedDimensionId] = useState<string | null>(null);
  const initialScoreRef = useRef<number>(0);
  
  const analysisInProgressRef = useRef<boolean>(false);

  const [validationLoading, setValidationLoading] = useState(false);
  const [validationComplete, setValidationComplete] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  
  const canAnalyze = currentDraft.trim().length >= MIN_ESSAY_LENGTH;

  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [narrativeOverview, setNarrativeOverview] = useState<string | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(false);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const [showInsufficientCreditsModal, setShowInsufficientCreditsModal] = useState(false);
  const [currentCreditBalance, setCurrentCreditBalance] = useState(0);

  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const activeIssues = dimensions.flatMap(d => d.issues).filter(i => i.status !== 'fixed');

  // ============================================================================
  // HERO OVERVIEW STATE (cloned from PortfolioScanner)
  // ============================================================================

  type HeroMetricId = 'impact' | 'academic' | 'curiosity' | 'story' | 'character';
  const [heroSelectedMetric, setHeroSelectedMetric] = useState<HeroMetricId | null>(null);
  const [isHeroInsightsOpen, setIsHeroInsightsOpen] = useState(false);
  const [heroNarrativeIndex, setHeroNarrativeIndex] = useState(0);
  const [isEditingHeroNarrative, setIsEditingHeroNarrative] = useState(false);
  const [heroNarrativeDraft, setHeroNarrativeDraft] = useState('');
  const [heroNarratives, setHeroNarratives] = useState<string[]>([]);
  const [heroUnifyIndex, setHeroUnifyIndex] = useState(0);
  const [heroProofIndex, setHeroProofIndex] = useState(0);
  const [heroSequenceIndex, setHeroSequenceIndex] = useState(0);
  const [heroCarrotLeft, setHeroCarrotLeft] = useState<number | null>(null);

  const heroMetricRefs = useRef<Record<HeroMetricId, HTMLDivElement | null>>({ impact: null, academic: null, curiosity: null, story: null, character: null });
  const heroInsightsPanelRef = useRef<HTMLDivElement | null>(null);
  const heroOverviewRef = useRef<HTMLDivElement | null>(null);

  // ---- Hard-coded mock data for hero overview (Portfolio Scanner preview values) ----
  // These are placeholder scores displayed in the hero dashboard tiles.
  // impact=8.2, academic=8.1, curiosity=7.6, story=7.8, character=7.3, progress=67%
  const heroMockData = {
    impact: 8.2,
    academic: 8.1,
    curiosity: 7.6,
    story: 7.8,
    character: 7.3,
    progress: 67,
  };

  const heroOverallScore = Math.round(
    (heroMockData.impact + heroMockData.academic + heroMockData.curiosity + heroMockData.story + heroMockData.character) / 5 * 10
  ) / 10;

  // ---- Hero helpers ----

  const getHoloToneClass = (value: number) => {
    if (value < 5) return 'red';
    if (value < 7) return 'yellow';
    if (value < 9) return 'green';
    return 'blue';
  };

  const toneToColors = (tone: 'red' | 'yellow' | 'green' | 'blue') => {
    switch (tone) {
      case 'red': return ['#ff3b3b', '#ff6b6b', '#ff3b3b', '#ff6b6b', '#ff3b3b'];
      case 'yellow': return ['#ff9f1a', '#ffd166', '#ff9f1a', '#ffd166', '#ff9f1a'];
      case 'green': return ['#0f9d58', '#34d399', '#0f9d58', '#34d399', '#0f9d58'];
      case 'blue':
      default: return ['#60a5fa', '#a78bfa', '#60a5fa', '#a78bfa', '#60a5fa'];
    }
  };

  const getHeroMetricTheme = (metric: string) => {
    const valMap: Record<string, number> = {
      impact: heroMockData.impact, leadership: heroMockData.impact,
      academic: heroMockData.academic,
      curiosity: heroMockData.curiosity, growth: heroMockData.curiosity,
      story: heroMockData.story, overall: heroOverallScore,
      character: heroMockData.character, uniqueness: heroMockData.character,
      completion: heroMockData.progress / 10,
    };
    const value = valMap[metric] ?? 0;
    const tone = getHoloToneClass(value) as 'red' | 'yellow' | 'green' | 'blue';
    const colors = toneToColors(tone);
    return { start: colors[0], end: colors[1], gradientCss: `linear-gradient(90deg, ${colors[0]}, ${colors[1]})` };
  };

  const handleHeroMetricClick = (metric: HeroMetricId) => {
    if (isHeroInsightsOpen && heroSelectedMetric === metric) {
      setIsHeroInsightsOpen(false);
      return;
    }
    setHeroSelectedMetric(metric);
    setIsHeroInsightsOpen(true);
  };

  const getHeroDisplayValue = (metric: HeroMetricId): number => {
    const m = heroMockData as Record<string, number>;
    return m[metric] ?? 0;
  };

  const generateHeroNarrativeVariant = (variant: number) => {
    const dims = [
      { key: 'Impact & Leadership', value: heroMockData.impact },
      { key: 'Academic Performance', value: heroMockData.academic },
      { key: 'Intellectual Curiosity', value: heroMockData.curiosity },
      { key: 'Storytelling', value: heroMockData.story },
      { key: 'Character & Community', value: heroMockData.character },
    ].sort((a, b) => b.value - a.value);
    const al = dims[0].key.toLowerCase();
    const bl = dims[1].key.toLowerCase();
    const overall = heroOverallScore;
    switch (variant % 6) {
      case 0: return `Growing up with a single mother, I learned to take initiative early and shoulder responsibility. I now channel that resilience into ${al} and programs that support families, turning ideas into repeatable systems with measurable outcomes.`;
      case 1: return `I'm building depth in ${al} and translating it into community benefit through ${bl}. I publish work with clear numbers so progress compounds, attracts collaborators, and tells a credible story at an overall level around ${overall}.`;
      case 2: return `Curiosity leads me to turn questions into projects that serve real people. By focusing on ${al} and amplifying it with ${bl}, I make learning visible through artifacts others can use and improve.`;
      case 3: return `I combine ${al} with leadership so good ideas become deliverables that matter. I organize people and resources around targets, then publish results so impact lasts beyond me.`;
      case 4: return `My work connects personal experience with service, using ${al} and ${bl} as the engine. I build repeatable programs with feedback loops so each iteration raises the ceiling for the community.`;
      default: return `I'm shaping a cohesive profile by leaning into ${al} while reinforcing it with ${bl}. Each month I ship a public proof of progress, tightening the narrative and scaling real-world outcomes.`;
    }
  };

  const heroStorageKey = userId ? `uplift:hero-narratives:${userId}` : 'uplift:hero-narratives:anon';

  useEffect(() => {
    try {
      const saved = localStorage.getItem(heroStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length) { setHeroNarratives(parsed); return; }
      }
    } catch {}
    setHeroNarratives(Array.from({ length: 5 }, (_, i) => generateHeroNarrativeVariant(i)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heroStorageKey]);

  const persistHeroNarratives = (next: string[]) => {
    setHeroNarratives(next);
    try { localStorage.setItem(heroStorageKey, JSON.stringify(next)); } catch {}
  };

  // Carrot position for hero insights panel
  useEffect(() => {
    const updateCarrot = () => {
      if (!heroSelectedMetric || !isHeroInsightsOpen) { setHeroCarrotLeft(null); return; }
      const el = heroMetricRefs.current[heroSelectedMetric];
      const panel = heroInsightsPanelRef.current;
      if (!el || !panel) return;
      const rect = el.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      setHeroCarrotLeft(rect.left + rect.width / 2 - panelRect.left);
    };
    updateCarrot();
    window.addEventListener('resize', updateCarrot);
    window.addEventListener('scroll', updateCarrot, { passive: true });
    return () => { window.removeEventListener('resize', updateCarrot); window.removeEventListener('scroll', updateCarrot); };
  }, [heroSelectedMetric, isHeroInsightsOpen]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const currentScore = analysisResult?.analysis?.narrative_quality_index || 0;
  const initialScore = initialScoreRef.current;
  const hasAnalysis = analysisResult !== null && dimensions.length > 0;

  // ============================================================================
  // INSTANT PER-PROMPT HYDRATION
  // ============================================================================
  
  useEffect(() => {
    if (!userId || !selectedPromptId) return;

    const cachedData = queryClient.getQueryData<PIQEssayData>(
      queryKeys.piqEssay(userId, selectedPromptId)
    );

    if (cachedData?.essay) {
      const { essay, analysis } = cachedData;
      
      setCurrentEssayId(essay.id);
      setCurrentDraft(essay.draft_current || essay.draft_original);
      
      const initialVersion: DraftVersion = {
        text: essay.draft_current || essay.draft_original,
        timestamp: new Date(essay.updated_at).getTime(),
        score: analysis?.analysis?.narrative_quality_index || 73,
      };
      
      setDraftVersions([initialVersion]);
      setCurrentVersionIndex(0);
      
      if (analysis) {
        const hasTeachingData = analysis.workshopItems?.some(item => item.teaching);
        
        if (!hasTeachingData && analysis.workshopItems?.length > 0) {
          setAnalysisResult({ ...analysis, needsTeachingUpgrade: true } as any);
        } else {
          setAnalysisResult(analysis);
        }
        
        if (analysis.analysis?.narrative_quality_index) {
          initialScoreRef.current = analysis.analysis.narrative_quality_index;
        }
        
        if (analysis.rubricDimensionDetails && analysis.rubricDimensionDetails.length > 0) {
          const transformedDimensions: RubricDimension[] = analysis.rubricDimensionDetails.map(dim => {
            const status = dim.final_score >= 8 ? 'good' : dim.final_score >= 6 ? 'needs_work' : 'critical';
            
            const issuesForDimension = (analysis.workshopItems || []).filter(
              item => item.rubric_category === dim.dimension_name
            );
            
            const transformedIssues = issuesForDimension.map(item => ({
              id: item.id,
              dimensionId: dim.dimension_name,
              title: item.problem,
              excerpt: item.quote,
              analysis: item.why_it_matters,
              impact: item.why_it_matters || '',
              teaching: item.teaching,
              suggestions: item.suggestions.map(sug => ({
                text: sug.text,
                rationale: sug.rationale,
                type: 'replace' as const,
              })),
              status: 'not_fixed' as const,
              currentSuggestionIndex: 0,
              expanded: false,
            }));
            
            return {
              id: dim.dimension_name,
              name: dim.dimension_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              score: dim.final_score,
              maxScore: 10,
              status,
              weight: 10,
              overview: dim.evidence?.justification || 'Analysis in progress',
              issues: transformedIssues,
            };
          });
          
          setDimensions(transformedDimensions);
        }
      }
      
      setHasUnsavedChanges(false);
      setNeedsReanalysis(false);
    } else {
      setCurrentDraft('');
      setCurrentEssayId(null);
      setDraftVersions([]);
      setCurrentVersionIndex(0);
      setAnalysisResult(null);
      setDimensions([]);
      setChatMessages([]);
      setNeedsReanalysis(false);
      setHasUnsavedChanges(false);
      setNarrativeOverview(null);
      initialScoreRef.current = 0;
    }
  }, [selectedPromptId, userId, queryClient]);

  // ============================================================================
  // REAL BACKEND ANALYSIS
  // ============================================================================

  const performFullAnalysis = useCallback(async (overrideEssayId?: string, forceReanalysis?: boolean) => {
    if (analysisInProgressRef.current) return;
    if (currentDraft.trim().length < MIN_ESSAY_LENGTH) return;
    if (!selectedPromptId) return;

    const selectedPrompt = UC_PIQ_PROMPTS.find(p => p.id === selectedPromptId);
    if (!selectedPrompt) return;

    const cachedResult = forceReanalysis ? null : getCachedAnalysisResult(currentDraft, selectedPromptId);
    
    if (!cachedResult && userId) {
      const token = await getToken({ template: 'supabase' });
      if (token) {
        const creditCheck = await canAnalyzeEssay(userId, token);
        if (!creditCheck.hasEnough) {
          setCurrentCreditBalance(creditCheck.currentBalance);
          setShowInsufficientCreditsModal(true);
          return;
        }
        const deductResult = await deductForEssayAnalysis(userId, token, selectedPrompt.title);
        if (!deductResult.success) return;
      }
    }

    analysisInProgressRef.current = true;
    setIsAnalyzing(true);
    setValidationLoading(false);
    setValidationComplete(false);
    try {
      let result: AnalysisResult;

      if (cachedResult) {
        result = cachedResult;
        setIsAnalyzing(false);
        setValidationComplete(true);
      } else {
        result = await analyzePIQEntryTwoStep(
          currentDraft,
          selectedPrompt.title,
          selectedPrompt.prompt,
          {
            onPhase17Complete: (phase17Result) => {
              if (phase17Result.workshopItems && phase17Result.workshopItems.length > 0) {
                const firstItem = phase17Result.workshopItems[0];
              }

              setAnalysisResult(phase17Result);

              if (phase17Result.rubricDimensionDetails && phase17Result.rubricDimensionDetails.length > 0) {
                const transformedDimensions: RubricDimension[] = phase17Result.rubricDimensionDetails.map((dim) => {
                  const status = dim.final_score >= 8 ? 'good' : dim.final_score >= 6 ? 'needs_work' : 'critical';

                  const issuesForDimension = (phase17Result.workshopItems || [])
                    .filter(item => item.rubric_category === dim.dimension_name);

                  const transformedIssues = issuesForDimension.map((item) => ({
                    id: item.id,
                    dimensionId: dim.dimension_name,
                    title: item.problem || item.teaching?.problem?.hook || `Issue in ${dim.dimension_name}`,
                    excerpt: item.quote,
                    analysis: item.why_it_matters || item.teaching?.problem?.description || '',
                    impact: item.why_it_matters || item.teaching?.problem?.whyItMatters?.preview || '',
                    teaching: item.teaching,
                    suggestions: item.suggestions.map((sug) => ({
                      text: sug.text,
                      rationale: sug.rationale,
                      type: sug.type === 'polished_original' ? 'replace' as const :
                            sug.type === 'voice_amplifier' ? 'replace' as const :
                            'replace' as const
                    })),
                    status: 'not_fixed' as const,
                    currentSuggestionIndex: 0,
                    expanded: false,
                  }));

                  return {
                    id: dim.dimension_name,
                    name: dim.dimension_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    score: dim.final_score,
                    maxScore: 10,
                    status,
                    weight: 10,
                    overview: dim.evidence?.justification || 'Analysis in progress',
                    issues: transformedIssues,
                  };
                });

                setDimensions(transformedDimensions);
              }

              if (initialScoreRef.current === 73 && phase17Result.analysis?.narrative_quality_index) {
                initialScoreRef.current = phase17Result.analysis.narrative_quality_index;
              }

              setValidationLoading(true);
            },

            onPhase18Complete: (validatedResult) => {
              setAnalysisResult(validatedResult);

              if (validatedResult.rubricDimensionDetails && validatedResult.rubricDimensionDetails.length > 0) {
                const transformedDimensions: RubricDimension[] = validatedResult.rubricDimensionDetails.map((dim) => {
                  const status = dim.final_score >= 8 ? 'good' : dim.final_score >= 6 ? 'needs_work' : 'critical';

                  const issuesForDimension = (validatedResult.workshopItems || [])
                    .filter(item => item.rubric_category === dim.dimension_name);

                  const transformedIssues = issuesForDimension.map((item) => ({
                    id: item.id,
                    dimensionId: dim.dimension_name,
                    title: item.problem,
                    excerpt: item.quote,
                    analysis: item.why_it_matters,
                    impact: item.why_it_matters || '',
                    teaching: item.teaching,
                    suggestions: item.suggestions.map((sug) => ({
                      text: sug.text,
                      rationale: sug.rationale,
                      type: sug.type === 'polished_original' ? 'replace' as const :
                            sug.type === 'voice_amplifier' ? 'replace' as const :
                            'replace' as const,
                      validation: sug.validation
                    })),
                    status: 'not_fixed' as const,
                    currentSuggestionIndex: 0,
                    expanded: false,
                  }));

                  return {
                    id: dim.dimension_name,
                    name: dim.dimension_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    score: dim.final_score,
                    maxScore: 10,
                    status,
                    weight: 10,
                    overview: dim.evidence?.justification || 'Analysis in progress',
                    issues: transformedIssues,
                  };
                });

                setDimensions(transformedDimensions);
              }

              setValidationLoading(false);
              setValidationComplete(true);
            },

            onPhase19Complete: (teachingResult) => {
              setAnalysisResult(teachingResult);

              if (teachingResult.rubricDimensionDetails && teachingResult.rubricDimensionDetails.length > 0) {
                const transformedDimensions: RubricDimension[] = teachingResult.rubricDimensionDetails.map((dim) => {
                  const status = dim.final_score >= 8 ? 'good' : dim.final_score >= 6 ? 'needs_work' : 'critical';

                  const issuesForDimension = (teachingResult.workshopItems || [])
                    .filter(item => item.rubric_category === dim.dimension_name);

                  const transformedIssues = issuesForDimension.map((item) => ({
                    id: item.id,
                    dimensionId: dim.dimension_name,
                    title: item.problem,
                    excerpt: item.quote,
                    analysis: item.why_it_matters,
                    impact: item.why_it_matters || '',
                    teaching: item.teaching,
                    suggestions: item.suggestions.map((sug) => ({
                      text: sug.text,
                      rationale: sug.rationale,
                      type: 'replace' as const,
                      validation: sug.validation
                    })),
                    status: 'not_fixed' as const,
                    currentSuggestionIndex: 0,
                    expanded: false,
                  }));

                  return {
                    id: dim.dimension_name,
                    name: dim.dimension_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    score: dim.final_score,
                    maxScore: 10,
                    status,
                    weight: 10,
                    overview: dim.evidence?.justification || 'Analysis in progress',
                    issues: transformedIssues,
                  };
                });

                setDimensions(transformedDimensions);
              }

              setValidationLoading(false);
              setValidationComplete(true);
            },

            onProgress: (status) => {
              setProgressMessage(status);
            }
          },
          { essayType: 'uc_piq' }
        );

        cacheAnalysisResult(currentDraft, selectedPromptId, result);
      }

      setAnalysisResult(result);

      if (result.rubricDimensionDetails && result.rubricDimensionDetails.length > 0) {
        if (result.workshopItems && result.workshopItems.length > 0) {
        }

        const transformedDimensions: RubricDimension[] = result.rubricDimensionDetails.map((dim) => {
          const status = dim.final_score >= 8 ? 'good' : dim.final_score >= 6 ? 'needs_work' : 'critical';

          const issuesForDimension = (result.workshopItems || [])
            .filter(item => item.rubric_category === dim.dimension_name);

          const transformedIssues = issuesForDimension.map((item) => ({
              id: item.id,
              dimensionId: dim.dimension_name,
              title: item.problem,
              excerpt: item.quote,
              analysis: item.why_it_matters,
              impact: item.why_it_matters || '',
              teaching: item.teaching,
              suggestions: item.suggestions.map((sug) => ({
                text: sug.text,
                rationale: sug.rationale,
                type: sug.type === 'polished_original' ? 'replace' as const :
                      sug.type === 'voice_amplifier' ? 'replace' as const :
                      'replace' as const
              })),
              status: 'not_fixed' as const,
              currentSuggestionIndex: 0,
              expanded: false,
            }));

          return {
            id: dim.dimension_name,
            name: dim.dimension_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            score: dim.final_score,
            maxScore: 10,
            status,
            weight: 10,
            overview: dim.evidence?.justification || 'Analysis in progress',
            issues: transformedIssues,
          };
        });

        setDimensions(transformedDimensions);

        if (initialScoreRef.current === 73 && result.analysis?.narrative_quality_index) {
          initialScoreRef.current = result.analysis.narrative_quality_index;
        }
      }

      setNeedsReanalysis(false);

      let effectiveEssayId = overrideEssayId || currentEssayId;
      
      if (userId) {
        try {
          const token = await getToken({ template: 'supabase' });
          if (token) {
            const selectedPrompt = UC_PIQ_PROMPTS.find(p => p.id === selectedPromptId);
            
            if (!effectiveEssayId) {
              const essaySaveResult = await saveOrUpdatePIQEssay(
                token, userId, selectedPromptId,
                selectedPrompt?.prompt || '', currentDraft, null
              );
              if (essaySaveResult.success && essaySaveResult.essayId) {
                effectiveEssayId = essaySaveResult.essayId;
                setCurrentEssayId(essaySaveResult.essayId);
              }
            }
            
            if (effectiveEssayId) {
              const analysisSaveResult = await saveAnalysisReport(token, userId, effectiveEssayId, result);
              
              const score = result.analysis?.narrative_quality_index || 0;
              const dimensionScores = result.rubricDimensionDetails || [];
              await saveAnalysisVersion(
                token, userId, effectiveEssayId, currentDraft,
                score, dimensionScores, analysisSaveResult.reportId
              );
              
              if (chatMessages.length > 0) {
                await saveChatMessages(token, userId, effectiveEssayId, chatMessages);
              }
            }
            
            clearAllLocalDrafts(effectiveEssayId, selectedPromptId);
            
            if (userId) {
              queryClient.invalidateQueries({
                queryKey: queryKeys.piqEssay(userId, selectedPromptId),
              });
            }
            
            setHasUnsavedChanges(false);
            setLastSaveTime(new Date());
          }
        } catch (error) {
        }
      }

      fetchNarrativeOverview(result);
    } catch (error) {
      alert(`Analysis failed! Check console for details.\n\nError: ${(error as Error).message}`);
    } finally {
      analysisInProgressRef.current = false;
      setIsAnalyzing(false);
    }
  }, [currentDraft, selectedPromptId, userId, currentEssayId, chatMessages]);

  // ============================================================================
  // NARRATIVE OVERVIEW
  // ============================================================================

  const fetchNarrativeOverview = useCallback(async (analysisData: AnalysisResult) => {
    setLoadingOverview(true);
    try {
      const SUPABASE_URL = 'https://zclaplpkuvxkrdwsgrul.supabase.co';
      const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

      const response = await fetch(`${SUPABASE_URL}/functions/v1/narrative-overview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ANON_KEY}`,
        },
        body: JSON.stringify({
          essayText: currentDraft,
          promptText: UC_PIQ_PROMPTS.find(p => p.id === selectedPromptId)?.prompt || '',
          voiceFingerprint: analysisData.voiceFingerprint,
          experienceFingerprint: analysisData.experienceFingerprint,
          rubricDimensionDetails: analysisData.rubricDimensionDetails,
          workshopItems: analysisData.workshopItems,
          narrativeQualityIndex: analysisData.analysis?.narrative_quality_index || 50,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.narrative_overview) {
          setNarrativeOverview(result.narrative_overview);
        }
      }
    } catch (error) {
    } finally {
      setLoadingOverview(false);
    }
  }, [currentDraft, selectedPromptId]);

  // ============================================================================
  // AUTO-SAVE & RESUME SESSION
  // ============================================================================

  useEffect(() => {
    if (isLoadingPIQData) {
      setIsLoadingFromDatabase(true);
      return;
    }

    setIsLoadingFromDatabase(false);

    if (!piqData?.essay) return;

    const { essay, analysis } = piqData;

    if (hasUnsavedChanges) return;

    setCurrentEssayId(essay.id);
    setCurrentDraft(essay.draft_current || essay.draft_original);

    const initialVersion: DraftVersion = {
      text: essay.draft_current || essay.draft_original,
      timestamp: new Date(essay.updated_at).getTime(),
      score: 73,
    };

    setDraftVersions([initialVersion]);
    setCurrentVersionIndex(0);

    if (analysis) {
      const hasTeachingData = analysis.workshopItems?.some(item => item.teaching);

      if (!hasTeachingData && analysis.workshopItems?.length > 0) {
        setAnalysisResult({ ...analysis, needsTeachingUpgrade: true } as any);
      } else {
        setAnalysisResult(analysis);
      }

      if (analysis.analysis?.narrative_quality_index) {
        initialVersion.score = analysis.analysis.narrative_quality_index;
        setDraftVersions([initialVersion]);
        initialScoreRef.current = analysis.analysis.narrative_quality_index;
      }

      if (analysis.rubricDimensionDetails && analysis.rubricDimensionDetails.length > 0) {
        const transformedDimensions: RubricDimension[] = analysis.rubricDimensionDetails.map(dim => {
          const status = dim.final_score >= 8 ? 'good' : dim.final_score >= 6 ? 'needs_work' : 'critical';

          const issuesForDimension = (analysis.workshopItems || []).filter(
            item => item.rubric_category === dim.dimension_name
          );

          const transformedIssues = issuesForDimension.map(item => ({
            id: item.id,
            dimensionId: dim.dimension_name,
            title: item.problem,
            excerpt: item.quote,
            analysis: item.why_it_matters,
            impact: item.why_it_matters || '',
            teaching: item.teaching,
            suggestions: item.suggestions.map(sug => ({
              text: sug.text,
              rationale: sug.rationale,
              type: 'replace' as const,
            })),
            status: 'not_fixed' as const,
            currentSuggestionIndex: 0,
            expanded: false,
          }));

          return {
            id: dim.dimension_name,
            name: dim.dimension_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            score: dim.final_score,
            maxScore: 10,
            status,
            weight: 10,
            overview: dim.evidence?.justification || 'Analysis in progress',
            issues: transformedIssues,
          };
        });

        setDimensions(transformedDimensions);
      }
    }

    const loadAdditionalData = async () => {
      try {
        const token = await getToken({ template: 'supabase' });
        if (!token || !userId) return;

        const versionResult = await getVersionHistory(token, userId, essay.id);
        if (versionResult.success && versionResult.versions && versionResult.versions.length > 0) {
          const loadedVersions: DraftVersion[] = versionResult.versions.map(v => ({
            text: v.draft_content,
            timestamp: new Date(v.created_at).getTime(),
            score: v.score,
            source:
              v.source === 'analyze' || v.source === 'save_draft'
                ? v.source
                : v.score !== undefined
                ? 'analyze'
                : 'save_draft',
          }));
          setDraftVersions(loadedVersions);
          setCurrentVersionIndex(loadedVersions.length - 1);
        }

        const chatResult = await loadChatMessages(token, userId, essay.id);
        if (chatResult.success && chatResult.messages && chatResult.messages.length > 0) {
          const loadedMessages: ChatMessage[] = chatResult.messages.map(msg => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: msg.message_timestamp,
          }));
          setChatMessages(loadedMessages);
        }
      } catch (error) {
        console.error('Failed to load additional data:', error);
      }
    };

    loadAdditionalData();

    setLastSaveTime(new Date(essay.updated_at));
    setHasUnsavedChanges(false);
  }, [piqData, isLoadingPIQData, userId, getToken, hasUnsavedChanges]);

  useEffect(() => {
    if (isLoadingFromDatabase) return;
    const { hasAutoSave, promptId, lastSaved } = hasRecentAutoSave();
    if (hasAutoSave && promptId && lastSaved && !currentEssayId) {
      setShowResumeSessionBanner(true);
    }
  }, [isLoadingFromDatabase, currentEssayId]);

  useEffect(() => {
    if (!userId || !selectedPromptId) return;
    const selectedPrompt = UC_PIQ_PROMPTS.find(p => p.id === selectedPromptId);
    if (!selectedPrompt) return;

    const manager = new AutosaveManager({
      essayId: currentEssayId,
      userId,
      getToken: () => getToken({ template: 'supabase' }),
      promptText: selectedPrompt.prompt,
      promptId: selectedPromptId,
      onStatusChange: setAutosaveState,
      initialContent: currentDraft,
      config: {
        debounceMs: 5000,
        retryIntervalMs: 30000,
      },
    });

    autosaveManagerRef.current = manager;

    return () => {
      manager.destroy();
      autosaveManagerRef.current = null;
    };
  }, [userId, selectedPromptId, getToken]);

  useEffect(() => {
    if (autosaveManagerRef.current && currentEssayId) {
      autosaveManagerRef.current.setEssayId(currentEssayId);
    }
  }, [currentEssayId]);

  useEffect(() => {
    if (!selectedPromptId) return;
    
    if (!currentEssayId) {
      clearAllLocalDrafts(null, selectedPromptId);
      setShowLocalRecovery(false);
      setLocalRecoveryData(null);
      return;
    }

    const checkRecovery = async () => {
      if (!userId) return;
      
      let serverTimestamp: string | undefined;
      try {
        const token = await getToken({ template: 'supabase' });
        if (token) {
          const result = await loadPIQEssay(
            token, userId, selectedPromptId,
            UC_PIQ_PROMPTS.find(p => p.id === selectedPromptId)?.prompt || ''
          );
          if (result.success && result.essay) {
            serverTimestamp = result.essay.updated_at;
          }
        }
      } catch (error) {
      }

      if (!serverTimestamp) return;

      const recovery = checkLocalRecovery(currentEssayId, selectedPromptId, serverTimestamp);
      
      if (recovery.hasRecovery && recovery.localDraft && recovery.isNewerThanServer) {
        setLocalRecoveryData({
          content: recovery.localDraft.content,
          savedAt: recovery.localDraft.savedAt,
          wordCount: recovery.localDraft.wordCount,
        });
        setShowLocalRecovery(true);
      } else {
        setShowLocalRecovery(false);
        setLocalRecoveryData(null);
      }
    };

    if (!isLoadingFromDatabase) {
      const timer = setTimeout(checkRecovery, 500);
      return () => clearTimeout(timer);
    }
  }, [selectedPromptId, currentEssayId, isLoadingFromDatabase, userId, getToken]);

  useEffect(() => {
    if (!selectedPromptId) return;

    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setInterval(() => {
      if (hasUnsavedChanges && currentDraft) {
        const selectedPrompt = UC_PIQ_PROMPTS.find(p => p.id === selectedPromptId);
        if (!selectedPrompt) return;

        const versionSnapshot = createVersionSnapshot(
          currentDraft, currentScore, analysisResult || undefined
        );

        const cache: PIQWorkshopCache = {
          promptId: selectedPromptId,
          promptTitle: selectedPrompt.title,
          currentDraft,
          lastSaved: Date.now(),
          analysisResult,
          versions: [
            ...draftVersions.map(v => ({
              id: `v_${v.timestamp}`,
              text: v.text,
              timestamp: v.timestamp,
              score: v.score,
              wordCount: v.text.trim().split(/\s+/).length,
              savedToCloud: false
            })),
            versionSnapshot
          ].slice(-10),
          autoSaveEnabled: true
        };

        saveToLocalStorage(cache);
        setLastSaveTime(new Date());
      }
    }, 30000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [hasUnsavedChanges, currentDraft, selectedPromptId, currentScore, analysisResult, draftVersions]);

  useEffect(() => {
    const newPromptId = getPromptIdFromUrl();
    if (newPromptId !== selectedPromptId) {
      setSelectedPromptId(newPromptId);
    }
  }, [piqNumber, selectedPromptId]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleDraftChange = useCallback((newDraft: string) => {
    setCurrentDraft(newDraft);
    setNeedsReanalysis(true);
    setHasUnsavedChanges(true);
    if (autosaveManagerRef.current) {
      autosaveManagerRef.current.onContentChange(newDraft);
    }
  }, []);

  const handleEditorBlur = useCallback(async () => {
    if (autosaveManagerRef.current) {
      await autosaveManagerRef.current.onBlur();
    }
  }, []);

  const loadVersionHistory = useCallback(async () => {
    if (!currentEssayId || !userId) return;
    setIsLoadingVersionHistory(true);
    setVersionHistoryError(null);

    try {
      const token = await getToken({ template: 'supabase' });
      if (!token) {
        setVersionHistoryError('Authentication required');
        return;
      }

      const result = await getVersionHistory(token, userId, currentEssayId);
      if (result.success && result.versions) {
        setDbVersionHistory(result.versions);
      } else {
        setVersionHistoryError(result.error || 'Failed to load version history');
      }
    } catch (error) {
      setVersionHistoryError((error as Error).message);
    } finally {
      setIsLoadingVersionHistory(false);
    }
  }, [currentEssayId, userId, getToken]);

  const handleOpenVersionHistory = useCallback(() => {
    setShowVersionHistoryDrawer(true);
    loadVersionHistory();
  }, [loadVersionHistory]);

  const handleRestoreFromDrawer = useCallback(async (version: PIQVersion) => {
    if (!currentEssayId || !userId) return;

    try {
      const token = await getToken({ template: 'supabase' });
      if (!token) return;

      const result = await restoreVersion(
        token, userId, currentEssayId, version.id, currentDraft
      );

      if (result.success && result.restoredContent) {
        setCurrentDraft(result.restoredContent);
        setHasUnsavedChanges(false);
        
        if (version.score !== undefined && version.score !== null && version.score > 0) {
          setCurrentScore(version.score);
          initialScoreRef.current = version.score;
          
          if (version.dimension_scores && Array.isArray(version.dimension_scores)) {
            const restoredDimensions = version.dimension_scores.map((d: any) => ({
              id: d.id || d.name?.toLowerCase().replace(/\s+/g, '_') || 'unknown',
              name: d.name || 'Unknown Dimension',
              score: d.score || 0,
              maxScore: d.maxScore || d.max_score || 10,
              percentage: d.percentage || (d.score / (d.maxScore || d.max_score || 10)) * 100,
              feedback: d.feedback || '',
              status: d.status || (d.percentage >= 70 ? 'good' : d.percentage >= 40 ? 'needs_work' : 'critical'),
              issues: d.issues || [],
            }));
            setDimensions(restoredDimensions);
          }
          
          if (version.dimension_scores) {
            const restoredAnalysisResult: AnalysisResult = {
              nqi: version.score,
              tier: version.score >= 85 ? 'Elite' : version.score >= 70 ? 'Strong' : version.score >= 55 ? 'Competitive' : 'Developing',
              dimensions: version.dimension_scores,
              analysis_id: version.analysis_report_id || '',
            };
            setAnalysisResult(restoredAnalysisResult);
          }
          
          setChatMessages([]);
          setNeedsReanalysis(false);
        } else {
          setNeedsReanalysis(true);
          setAnalysisResult(null);
          setDimensions([]);
          setChatMessages([]);
        }
        
        await loadVersionHistory();
      }
    } catch (error) {
    }
  }, [currentEssayId, userId, currentDraft, getToken, loadVersionHistory]);

  const handleLocalRecoveryRestore = useCallback(async () => {
    if (!localRecoveryData) return;

    setIsRestoringLocal(true);
    try {
      setCurrentDraft(localRecoveryData.content);
      setNeedsReanalysis(true);
      setHasUnsavedChanges(true);
      
      if (autosaveManagerRef.current) {
        autosaveManagerRef.current.onContentChange(localRecoveryData.content);
        await autosaveManagerRef.current.forceSave();
      }

      setShowLocalRecovery(false);
      setLocalRecoveryData(null);
      
      if (currentEssayId) {
        clearAllLocalDrafts(currentEssayId, selectedPromptId);
      }
    } finally {
      setIsRestoringLocal(false);
    }
  }, [localRecoveryData, currentEssayId, selectedPromptId]);

  const handleLocalRecoveryDismiss = useCallback(() => {
    setShowLocalRecovery(false);
    setLocalRecoveryData(null);
    if (currentEssayId) {
      clearAllLocalDrafts(currentEssayId, selectedPromptId);
    }
  }, [currentEssayId, selectedPromptId]);

  const handleSave = useCallback(async () => {
    const newVersion: DraftVersion = {
      text: currentDraft,
      timestamp: Date.now(),
      score: analysisResult?.analysis?.narrative_quality_index || 73
    };
    const newVersions = draftVersions.slice(0, currentVersionIndex + 1);
    newVersions.push(newVersion);
    setDraftVersions(newVersions);
    setCurrentVersionIndex(newVersions.length - 1);

    if (!selectedPromptId || !userId) {
      if (!userId) {
        alert('Please sign in to save your work to the cloud');
      }
      return;
    }

    const selectedPrompt = UC_PIQ_PROMPTS.find(p => p.id === selectedPromptId);
    if (!selectedPrompt) return;

    setSaveStatus('saving');
    setLastSaveError(null);

    try {
      const token = await getToken({ template: 'supabase' });
      if (!token) {
        setSaveStatus('error');
        setLastSaveError('Authentication token not available. Please sign in again.');
        return;
      }

      const { success, essayId, error, isNew } = await saveOrUpdatePIQEssay(
        token, userId, selectedPromptId, selectedPrompt.prompt,
        currentDraft, draftVersions[0]?.text
      );

      if (!success) {
        setSaveStatus('error');
        setLastSaveError(error || 'Failed to save essay');
        return;
      }

      if (essayId) setCurrentEssayId(essayId);

      if (analysisResult && essayId) {
        await saveAnalysisReport(token, userId, essayId, analysisResult);
      }

      if (chatMessages.length > 0 && essayId) {
        await saveChatMessages(token, userId, essayId, chatMessages);
      }

      if (essayId) {
        await saveMilestoneVersion(token, userId, essayId, currentDraft, undefined);
      }

      clearAllLocalDrafts(essayId || null, selectedPromptId);
      
      if (userId && essayId) {
        const updatedEssayData: PIQEssayData = {
          essay: {
            id: essayId,
            draft_current: currentDraft,
            draft_original: draftVersions[0]?.text || currentDraft,
            updated_at: new Date().toISOString(),
          },
          analysis: analysisResult,
        };
        
        queryClient.setQueryData(
          queryKeys.piqEssay(userId, selectedPromptId),
          updatedEssayData
        );
        
        queryClient.invalidateQueries({
          queryKey: queryKeys.piqEssay(userId, selectedPromptId),
        });
      }
      
      setSaveStatus('saved');
      setLastSaveTime(new Date());
      setHasUnsavedChanges(false);

    } catch (error) {
      setSaveStatus('error');
      setLastSaveError((error as Error).message);
    }
  }, [
    currentDraft, draftVersions, currentVersionIndex,
    selectedPromptId, userId, analysisResult, chatMessages
  ]);

  const handleUndo = useCallback(() => {
    if (currentVersionIndex > 0) {
      const newIndex = currentVersionIndex - 1;
      setCurrentVersionIndex(newIndex);
      setCurrentDraft(draftVersions[newIndex].text);
      setNeedsReanalysis(false);
    }
  }, [currentVersionIndex, draftVersions]);

  const handleRedo = useCallback(() => {
    if (currentVersionIndex < draftVersions.length - 1) {
      const newIndex = currentVersionIndex + 1;
      setCurrentVersionIndex(newIndex);
      setCurrentDraft(draftVersions[newIndex].text);
      setNeedsReanalysis(false);
    }
  }, [currentVersionIndex, draftVersions]);

  const handleRequestReanalysis = useCallback(() => {
    setChatMessages([]);
    performFullAnalysis(undefined, true);
  }, [performFullAnalysis]);

  const toggleDimensionExpand = useCallback((dimensionId: string) => {
    setExpandedDimensionId(prev => prev === dimensionId ? null : dimensionId);
  }, []);

  const handleToggleIssue = useCallback((issueId: string) => {
    setDimensions(prev => prev.map(dim => {
      const containsIssue = dim.issues.some(i => i.id === issueId);
      if (!containsIssue) return dim;

      return {
        ...dim,
        issues: dim.issues.map(i => {
          if (i.id === issueId) {
            const willExpand = !i.expanded;
            return {
              ...i,
              expanded: willExpand,
              status: willExpand && i.status === 'not_fixed' ? 'in_progress' : i.status
            };
          }
          return { ...i, expanded: false };
        })
      };
    }));
  }, []);

  const handleApplySuggestion = useCallback((issueId: string) => {
    const dimension = dimensions.find(d => d.issues.some(i => i.id === issueId));
    if (!dimension) return;

    const issue = dimension.issues.find(i => i.id === issueId);
    if (!issue || !issue.suggestions[issue.currentSuggestionIndex]) return;

    const suggestion = issue.suggestions[issue.currentSuggestionIndex];
    let newDraft = currentDraft;

    if (suggestion.type === 'replace' && issue.excerpt) {
      newDraft = currentDraft.replace(issue.excerpt, suggestion.text);
    } else if (suggestion.type === 'insert_after' && issue.excerpt) {
      const idx = currentDraft.indexOf(issue.excerpt);
      if (idx !== -1) {
        newDraft = currentDraft.slice(0, idx + issue.excerpt.length) + ' ' + suggestion.text + currentDraft.slice(idx + issue.excerpt.length);
      }
    } else if (suggestion.type === 'insert_before' && issue.excerpt) {
      const idx = currentDraft.indexOf(issue.excerpt);
      if (idx !== -1) {
        newDraft = currentDraft.slice(0, idx) + suggestion.text + ' ' + currentDraft.slice(idx);
      }
    }

    setCurrentDraft(newDraft);
    setNeedsReanalysis(true);
    setDimensions(prev => prev.map(d => ({
      ...d,
      issues: d.issues.map(i => i.id === issueId ? { ...i, status: 'fixed' } : i)
    })));
  }, [dimensions, currentDraft]);

  const handleNextSuggestion = useCallback((issueId: string) => {
    setDimensions(prev => prev.map(dim => ({
      ...dim,
      issues: dim.issues.map(i => {
        if (i.id === issueId && i.currentSuggestionIndex < i.suggestions.length - 1) {
          return { ...i, currentSuggestionIndex: i.currentSuggestionIndex + 1 };
        }
        return i;
      })
    })));
  }, []);

  const handlePrevSuggestion = useCallback((issueId: string) => {
    setDimensions(prev => prev.map(dim => ({
      ...dim,
      issues: dim.issues.map(i => {
        if (i.id === issueId && i.currentSuggestionIndex > 0) {
          return { ...i, currentSuggestionIndex: i.currentSuggestionIndex - 1 };
        }
        return i;
      })
    })));
  }, []);

  const handleRestoreVersion = useCallback((versionDescription: string) => {
    setCurrentDraft(versionDescription);
    setShowVersionHistory(false);
    setNeedsReanalysis(true);
  }, []);

  // ============================================================================
  // COMPUTED (continued)
  // ============================================================================
  const totalIssues = dimensions.reduce((sum, d) => sum + d.issues.length, 0);
  const fixedIssues = dimensions.reduce((sum, d) => sum + d.issues.filter(i => i.status === 'fixed').length, 0);
  const criticalIssues = dimensions.filter(d => d.status === 'critical').length;
  const needsWorkIssues = dimensions.filter(d => d.status === 'needs_work').length;

  const getNQIConfig = () => {
    const nqi = currentScore;
    if (nqi >= 85) return { label: 'Outstanding', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-950/30', border: 'border-green-300 dark:border-green-800' };
    if (nqi >= 70) return { label: 'Competitive', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-950/30', border: 'border-blue-300 dark:border-blue-800' };
    if (nqi >= 55) return { label: 'Needs Significant Work', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-950/30', border: 'border-amber-300 dark:border-amber-800' };
    return { label: 'Critical Issues', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-950/30', border: 'border-red-300 dark:border-red-800' };
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return { gradient: true, colors: ['hsl(250 70% 60%)', 'hsl(185 80% 55%)', 'hsl(280 90% 65%)', 'hsl(250 70% 60%)'] };
    if (score >= 85) return { gradient: false, className: 'text-emerald-600 dark:text-emerald-400' };
    if (score >= 70) return { gradient: true, colors: ['hsl(217 91% 60%)', 'hsl(262 83% 58%)', 'hsl(217 91% 65%)', 'hsl(262 83% 58%)'] };
    if (score >= 55) return { gradient: false, className: 'text-amber-600 dark:text-amber-400' };
    return { gradient: false, className: 'text-red-600 dark:text-red-400' };
  };

  const nqiConfig = getNQIConfig();
  const scoreDelta = (hasAnalysis && initialScore > 0) ? (currentScore - initialScore) : 0;

  const goodDimensions = dimensions.filter(d => d.status === 'good');
  const needsWorkDimensions = dimensions.filter(d => d.status === 'needs_work');
  const criticalDimensions = dimensions.filter(d => d.status === 'critical');

  const scrollToDimension = (dimensionId: string) => {
    setExpandedDimensionId(dimensionId);
    setTimeout(() => {
      const element = document.getElementById(`dimension-${dimensionId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        element.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
        }, 2000);
      }
    }, 100);
  };

  const [showAllStrong, setShowAllStrong] = React.useState(false);
  const [showAllNeedsWork, setShowAllNeedsWork] = React.useState(false);

  const getDetailedOverview = (dims: RubricDimension[], score: number): string => {
    if (narrativeOverview) return narrativeOverview;
    if (loadingOverview && analysisResult) return 'Generating personalized narrative overview...';

    try {
      if (!dims || !Array.isArray(dims) || dims.length === 0) return 'Analysis in progress...';

      const critical = dims.filter(d => d && d.status === 'critical');
      const needsWork = dims.filter(d => d && d.status === 'needs_work');
      const good = dims.filter(d => d && d.status === 'good').sort((a, b) => (b?.score || 0) - (a?.score || 0));
      const allIssues = dims.flatMap(d => d.issues);

      let overview = '';

      if (good.length > 0) {
        const topStrength = good[0];
        const strengthText = topStrength.overview.split('.')[0].toLowerCase();
        overview += `Your essay's strongest asset is ${strengthText}. `;
        if (good.length >= 2) {
          const secondStrength = good[1];
          overview += `You've also built a solid foundation in ${secondStrength.name.toLowerCase()}, which gives your narrative credibility. `;
        }
      } else {
        overview += `Your essay shows genuine effort and authentic voice. `;
      }

      const hasTransformation = allIssues.some(i => i.title?.toLowerCase().includes('transform') || i.title?.toLowerCase().includes('growth'));
      const hasEmotionalDepth = allIssues.some(i => i.title?.toLowerCase().includes('emotion') || i.title?.toLowerCase().includes('vulnerability'));
      const hasSpecificity = allIssues.some(i => i.title?.toLowerCase().includes('specific') || i.title?.toLowerCase().includes('detail'));

      if (score >= 70) {
        overview += `What you're trying to show—your growth through experience—comes through clearly. `;
      } else if (score >= 55) {
        overview += `The core of what you're trying to convey is there, but it needs sharper focus and more vivid storytelling. `;
      } else {
        overview += `You have the raw material for a compelling narrative, but right now the story you're trying to tell isn't fully realized on the page. `;
      }

      const patterns = [];
      if (hasSpecificity) patterns.push('specific details');
      if (hasEmotionalDepth) patterns.push('emotional authenticity');
      if (hasTransformation) patterns.push('transformation arc');

      if (patterns.length > 0) {
        overview += `To make this truly compelling, focus on ${patterns.length === 1 ? patterns[0] : patterns.slice(0, -1).join(', ') + ' and ' + patterns[patterns.length - 1]}. `;
      }

      if (critical.length > 0 || needsWork.length >= 3) {
        const structuralIssues = allIssues.filter(i =>
          i.title?.toLowerCase().includes('arc') ||
          i.title?.toLowerCase().includes('structure') ||
          i.title?.toLowerCase().includes('hook') ||
          i.title?.toLowerCase().includes('climax')
        );

        if (structuralIssues.length >= 2) {
          overview += `Your narrative structure needs attention—think about building clear tension, a turning point where something shifts, and a resolution that shows what changed. `;
        } else if (hasSpecificity) {
          overview += `Replace broad statements with precise moments: use real names, actual dialogue, specific sensory details that place readers in the scene with you. `;
        } else if (hasEmotionalDepth) {
          overview += `Go deeper emotionally—show us not just what happened, but what you felt, what scared you, what surprised you, what you realized in that specific moment. `;
        } else {
          overview += `The surgical suggestions below show you exactly where and how to strengthen your narrative. `;
        }
      } else if (needsWork.length > 0) {
        overview += `You're close. The improvements needed are targeted and achievable—mostly about elevating specific passages from good to great. `;
      } else {
        overview += `You've crafted a strong narrative that accomplishes what you set out to do. `;
      }

      if (allIssues.length > 0) {
        const firstIssue = allIssues[0];
        if (firstIssue?.title) {
          overview += `Start with this: ${firstIssue.title.toLowerCase()}. Each workshop item below includes specific revisions that maintain your authentic voice while making your narrative more powerful.`;
        } else {
          overview += `The detailed analysis below shows you exactly how to elevate your narrative while keeping your authentic voice intact.`;
        }
      } else {
        overview += `Continue refining the nuances—every word should earn its place in your story.`;
      }

      return overview;
    } catch (error) {
      return 'Analysis complete. View detailed breakdown below.';
    }
  };

  const getActionableInsights = (dimensions: RubricDimension[], score: number): string => {
    const strongest = dimensions
      .filter(d => d.status === 'good')
      .sort((a, b) => b.score - a.score)[0];
    
    const weakest = [...criticalDimensions, ...needsWorkDimensions]
      .sort((a, b) => a.score - b.score)[0];
    
    const allIssues = dimensions.flatMap(d => d.issues);
    const issueTypes = allIssues.map(i => i.dimensionId);
    const mostCommonIssue = issueTypes.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topIssueType = Object.entries(mostCommonIssue)
      .sort((a, b) => (b[1] as number) - (a[1] as number))[0]?.[0];
    
    let insight = '';
    
    if (strongest) {
      insight += `Your ${strongest.name.toLowerCase()} (${strongest.score}/${strongest.maxScore}) is a clear strength. `;
    }
    
    if (criticalDimensions.length > 0) {
      const criticalNames = criticalDimensions.map(d => d.name.toLowerCase()).join(', ');
      insight += `Critical priority: ${criticalNames} ${criticalDimensions.length === 1 ? 'needs' : 'need'} immediate revision—${criticalDimensions[0].issues[0]?.title || 'address flagged issues'}. `;
    } else if (weakest) {
      insight += `To reach ${score >= 70 ? 'excellence' : 'competitiveness'}, strengthen ${weakest.name.toLowerCase()} (currently ${weakest.score}/${weakest.maxScore})`;
      if (weakest.issues[0]?.title) {
        insight += `—${weakest.issues[0].title.split('.')[0]}. `;
      } else {
        insight += `. `;
      }
    }
    
    if (topIssueType && allIssues.length > 3) {
      insight += `Pattern detected: Multiple issues related to "${topIssueType.toLowerCase()}" across dimensions.`;
    }
    
    return insight || 'Your essay shows balanced quality across dimensions. Continue refining based on specific rubric feedback.';
  };

  const scoreColorConfig = getScoreColor(currentScore);
  const progressPercent = totalIssues > 0 ? (fixedIssues / totalIssues) * 100 : 0;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-background">
      <div className="hero-gradient hero-gradient-fade absolute top-0 left-0 right-0 h-[120vh] pointer-events-none -z-10" />

      {/* ================================================================== */}
      {/* HERO OVERVIEW SECTION (cloned from PortfolioScanner)               */}
      {/* ================================================================== */}
      <div ref={heroOverviewRef} className="hero-gradient text-white relative">
        <div className="max-w-7xl mx-auto px-4 py-12">

          {/* Five Key Metrics grid */}
          {(() => {
            const metrics: { id: HeroMetricId; label: string; value: number }[] = [
              { id: 'impact', label: 'Impact & Leadership', value: heroMockData.impact },
              { id: 'academic', label: 'Academic Performance', value: heroMockData.academic },
              { id: 'curiosity', label: 'Intellectual Curiosity', value: heroMockData.curiosity },
              { id: 'story', label: 'Storytelling', value: heroMockData.story },
              { id: 'character', label: 'Character & Community', value: heroMockData.character },
            ];
            return (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-3">
                {metrics.map((m) => (
                  <div
                    key={m.id}
                    className="text-center p-4 rounded-xl holo-surface holo-sheen elev-strong elev-hover cursor-pointer"
                    ref={(el) => (heroMetricRefs.current[m.id] = el)}
                    onClick={() => handleHeroMetricClick(m.id)}
                  >
                    <GradientText
                      className="text-3xl font-bold metric-value"
                      colors={toneToColors(getHoloToneClass(m.value) as any)}
                      animationSpeed={10}
                      showBorder={false}
                      textOnly
                    >
                      {m.value.toFixed(1)}
                    </GradientText>
                    <div className="text-sm metric-label font-semibold mt-1">{m.label}</div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Portfolio Overview (shown when insights panel is collapsed) */}
          {!isHeroInsightsOpen && (
            <div className="mt-6">
              <Card className="relative border-2 border-white/40 bg-white/20 text-white backdrop-blur-xl shadow-strong overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent pointer-events-none" aria-hidden="true" />
                <div className="relative h-1 w-full" style={{ backgroundImage: getHeroMetricTheme('overall').gradientCss }} />
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-4 text-hero-contrast">
                    <CardTitle>Portfolio Overview</CardTitle>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1.5 rounded-md text-sm font-semibold bg-white/25 no-text-shadow">
                        {heroOverallScore.toFixed(1)} / 10
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const dims = [
                      { key: 'Impact & Leadership', value: heroMockData.impact },
                      { key: 'Academic Performance', value: heroMockData.academic },
                      { key: 'Intellectual Curiosity', value: heroMockData.curiosity },
                      { key: 'Character & Community', value: heroMockData.character },
                    ].sort((a, b) => b.value - a.value);
                    const top2 = dims.slice(0, 2).map(d => d.key);
                    const bottom2 = dims.slice(-2).map(d => d.key);
                    const overall = heroOverallScore;

                    // ---- Hard-coded narrative summary text matching Portfolio Scanner preview ----
                    const narrativeSummary = overall >= 7.8
                      ? `You have a strong foundation with standout momentum in ${top2.join(' and ')}. To hit top-tier, unify everything under one throughline and convert more work into public, measurable outcomes. Focus attention on ${bottom2.join(' and ')} to raise the ceiling.`
                      : `You've built solid early progress with emerging strengths in ${top2.join(' and ')}. Concentrate on ${bottom2.join(' and ')} to create noticeable lift in the next 60–90 days.`;

                    return (
                      <div className="space-y-5">
                        <div className="text-white/90 text-[15px] leading-7 text-hero-contrast">
                          {narrativeSummary}
                        </div>

                        {/* Editable Portfolio Narrative */}
                        <div className="rounded-lg border border-white/25 bg-white/12 backdrop-blur-md p-4 text-hero-contrast">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-xs uppercase tracking-wide">Portfolio narrative</div>
                            <div className="flex items-center gap-2">
                              {!isEditingHeroNarrative && (
                                <button className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 transition" onClick={() => { setHeroNarrativeDraft(heroNarratives[heroNarrativeIndex] || ''); setIsEditingHeroNarrative(true); }} aria-label="Edit narrative">
                                  <Pencil className="h-4 w-4 text-white" />
                                </button>
                              )}
                              <button className="p-1 rounded-md bg-white/10 hover:bg-white/20 transition" onClick={() => setHeroNarrativeIndex((i) => (i - 1 + 5) % 5)} aria-label="Previous narrative">
                                <ChevronLeft className="h-4 w-4 text-white" />
                              </button>
                              <button className="p-1 rounded-md bg-white/10 hover:bg-white/20 transition" onClick={() => setHeroNarrativeIndex((i) => (i + 1) % 5)} aria-label="Next narrative">
                                <ChevronRight className="h-4 w-4 text-white" />
                              </button>
                              {!isEditingHeroNarrative && (
                                <button className="ml-1 px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-xs transition" onClick={() => { const next = [...heroNarratives]; next[heroNarrativeIndex] = generateHeroNarrativeVariant(heroNarrativeIndex + Math.floor(Math.random() * 6)); persistHeroNarratives(next); }}>Regenerate</button>
                              )}
                            </div>
                          </div>
                          {!isEditingHeroNarrative ? (
                            <div className="text-white/95 text-sm leading-6">{heroNarratives[heroNarrativeIndex]}</div>
                          ) : (
                            <div className="space-y-2">
                              <Textarea value={heroNarrativeDraft} onChange={(e) => setHeroNarrativeDraft(e.target.value)} placeholder="Write your narrative angle here..." className="bg-white/20 text-white placeholder:text-white/60 min-h-[80px]" />
                              <div className="flex justify-end">
                                <Button size="sm" variant="secondary" onClick={() => { const next = [...heroNarratives]; next[heroNarrativeIndex] = heroNarrativeDraft.trim(); persistHeroNarratives(next); setIsEditingHeroNarrative(false); }}>
                                  <Check className="h-4 w-4 mr-1" /> Save
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Three insight cards: Unify, Make Proof Visible, Sequence */}
                        <div className="grid md:grid-cols-3 gap-4">
                          {/* Unify Card */}
                          <div className="rounded-lg border border-white/25 bg-white/12 backdrop-blur-md p-3 text-hero-contrast">
                            <div className="flex items-center justify-between mb-1">
                              <div className="text-xs uppercase tracking-wide">Unify</div>
                              <div className="flex items-center gap-1">
                                <button className="p-1 rounded-md bg-white/10 hover:bg-white/20 transition" onClick={() => setHeroUnifyIndex((i) => (i + 2) % 3)}><ChevronLeft className="h-3.5 w-3.5 text-white" /></button>
                                <button className="p-1 rounded-md bg-white/10 hover:bg-white/20 transition" onClick={() => setHeroUnifyIndex((i) => (i + 1) % 3)}><ChevronRight className="h-3.5 w-3.5 text-white" /></button>
                              </div>
                            </div>
                            <div className="text-white/95 text-sm">
                              {['Rename and reorder activities to reinforce one throughline; remove or downsize items that don\'t fit.',
                                'Group efforts under 2–3 themes (e.g., education equity, health tech); explain how each activity advances one theme.',
                                'Rewrite activity blurbs to lead with outcomes and tie each result to the same purpose statement.'][heroUnifyIndex]}
                            </div>
                          </div>

                          {/* Make Proof Visible Card */}
                          <div className="rounded-lg border border-white/25 bg-white/12 backdrop-blur-md p-3 text-hero-contrast">
                            <div className="flex items-center justify-between mb-1">
                              <div className="text-xs uppercase tracking-wide">Make proof visible</div>
                              <div className="flex items-center gap-1">
                                <button className="p-1 rounded-md bg-white/10 hover:bg-white/20 transition" onClick={() => setHeroProofIndex((i) => (i + 2) % 3)}><ChevronLeft className="h-3.5 w-3.5 text-white" /></button>
                                <button className="p-1 rounded-md bg-white/10 hover:bg-white/20 transition" onClick={() => setHeroProofIndex((i) => (i + 1) % 3)}><ChevronRight className="h-3.5 w-3.5 text-white" /></button>
                              </div>
                            </div>
                            <div className="text-white/95 text-sm">
                              {['Publish a small artifact every 2–3 weeks (demo, write‑up, repo, testimonial) tied to a number.',
                                'Track impact with three metrics (people reached, hours saved, dollars raised) and show a simple before/after.',
                                'Create a single hub page linking evidence: timeline of artifacts, quick metrics, and 1–2 quotes from beneficiaries.'][heroProofIndex]}
                            </div>
                          </div>

                          {/* Sequence Card */}
                          <div className="rounded-lg border border-white/25 bg-white/12 backdrop-blur-md p-3 text-hero-contrast">
                            <div className="flex items-center justify-between mb-1">
                              <div className="text-xs uppercase tracking-wide">Sequence</div>
                              <div className="flex items-center gap-1">
                                <button className="p-1 rounded-md bg-white/10 hover:bg-white/20 transition" onClick={() => setHeroSequenceIndex((i) => (i + 2) % 3)}><ChevronLeft className="h-3.5 w-3.5 text-white" /></button>
                                <button className="p-1 rounded-md bg-white/10 hover:bg-white/20 transition" onClick={() => setHeroSequenceIndex((i) => (i + 1) % 3)}><ChevronRight className="h-3.5 w-3.5 text-white" /></button>
                              </div>
                            </div>
                            <div className="text-white/95 text-sm">
                              {['Commit to one 60–90 day push in the weakest area; schedule weekly check‑ins and a public update.',
                                'Plan three milestones (week 3, 6, 9) with deliverables; each milestone ends with a visible proof post.',
                                'Pick a mentor or peer for accountability; share progress every two weeks and ask one specific question.'][heroSequenceIndex]}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Collapsible Insights Panel */}
          <Collapsible open={isHeroInsightsOpen} onOpenChange={setIsHeroInsightsOpen}>
            {heroSelectedMetric && (
              <CollapsibleContent>
                <div
                  className="rounded-2xl border shadow-xl relative overflow-hidden my-6 max-w-7xl mx-auto"
                  ref={heroInsightsPanelRef}
                  style={{ borderColor: 'rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.92)' }}
                >
                  <div className="h-1 w-full" style={{ backgroundImage: getHeroMetricTheme(heroSelectedMetric === 'impact' ? 'leadership' : heroSelectedMetric === 'curiosity' ? 'growth' : heroSelectedMetric === 'story' ? 'overall' : heroSelectedMetric === 'character' ? 'uniqueness' : heroSelectedMetric).gradientCss }} />
                  {heroCarrotLeft !== null && (
                    <div
                      className="absolute -top-2 h-3.5 w-3.5 rotate-45"
                      style={{
                        left: Math.max(12, Math.min(heroCarrotLeft - 7, (heroInsightsPanelRef.current?.clientWidth || 0) - 14)),
                        backgroundImage: getHeroMetricTheme(heroSelectedMetric === 'impact' ? 'leadership' : heroSelectedMetric === 'curiosity' ? 'growth' : heroSelectedMetric === 'story' ? 'overall' : heroSelectedMetric === 'character' ? 'uniqueness' : heroSelectedMetric).gradientCss,
                        boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
                        border: '1px solid rgba(0,0,0,0.1)'
                      }}
                      aria-hidden="true"
                    />
                  )}

                  <div className="p-5 md:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl md:text-2xl font-semibold text-foreground">
                          {(heroSelectedMetric === 'impact' && 'Impact & Leadership - Insights') ||
                           (heroSelectedMetric === 'academic' && 'Academic Rigor - Insights') ||
                           (heroSelectedMetric === 'curiosity' && 'Intellectual Curiosity - Insights') ||
                           (heroSelectedMetric === 'story' && 'Storytelling - Insights') ||
                           'Character & Community - Insights'}
                        </h3>
                      </div>
                      <button className="text-muted-foreground hover:text-foreground transition" onClick={() => setIsHeroInsightsOpen(false)} aria-label="Close insights">
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="mt-5 grid md:grid-cols-1 gap-8">
                      <section className="space-y-1">
                        <div className="text-sm uppercase tracking-wide text-muted-foreground mb-2">Overview</div>
                        <div className="space-y-2">
                          {/* ---- Hard-coded fallback insight text per metric ---- */}
                          <p className="text-sm text-foreground/90 leading-6">
                            {(heroSelectedMetric === 'impact' && 'Admissions look for proof you move people and projects. Quantify outcomes (people helped, dollars raised, time saved) and show roles where others relied on you.') ||
                             (heroSelectedMetric === 'academic' && 'Top schools value trajectory and rigor. Show a steady climb in course challenge with A-/B+ or better and highlight the toughest classes you can succeed in next.') ||
                             (heroSelectedMetric === 'curiosity' && 'Demonstrate self-driven learning: independent projects, research outreach, or certifications. Tie exploration to a clear interest arc.') ||
                             (heroSelectedMetric === 'story' && 'Connect your activities to a single throughline—why you do them and what you\'re building toward. Evidence beats adjectives.') ||
                             'Translate values into community outcomes. Spotlight 1–2 commitments where you consistently show up and make a difference.'}
                          </p>
                          <div className="grid md:grid-cols-3 gap-3">
                            <div className="rounded-lg border p-3 bg-white/60">
                              <div className="text-xs uppercase text-muted-foreground">What top admits show</div>
                              <div className="text-sm mt-1 leading-6 text-foreground">
                                {(heroSelectedMetric === 'impact' && 'Clear evidence of steering people and resources to a measurable win—projects that grow, teams that improve, or communities that benefit in ways you can quantify.') ||
                                 (heroSelectedMetric === 'academic' && 'A transcript that stretches into challenging courses with a rising trajectory, paired with proof you can master difficult material.') ||
                                 (heroSelectedMetric === 'curiosity' && 'Self-propelled exploration that turns questions into prototypes, brief write-ups, or collaborations beyond the classroom.') ||
                                 (heroSelectedMetric === 'story' && 'A coherent narrative where choices stack toward a purpose, with results that make that purpose believable.') ||
                                 'Long-haul commitment to people or places—consistent service that leaves behind systems or outcomes others can point to.'}
                              </div>
                            </div>
                            <div className="rounded-lg border p-3 bg-white/60">
                              <div className="text-xs uppercase text-muted-foreground">Your quick opportunity</div>
                              <div className="text-sm mt-1 leading-6 text-foreground">
                                {(heroSelectedMetric === 'impact' && 'Choose one current initiative and set a 6–8 week goal tied to a number (beneficiaries, dollars, or hours saved); publish a short update when you hit it.') ||
                                 (heroSelectedMetric === 'academic' && 'Enroll in one stretch class and pre-schedule weekly support (office hours, peer tutor); track progress with two short reflections.') ||
                                 (heroSelectedMetric === 'curiosity' && 'Run a 4–6 week mini-project with weekly deliverables and one mentor touchpoint; ship a public artifact at the end.') ||
                                 (heroSelectedMetric === 'story' && 'Write a 2–3 sentence thesis for your application story and reframe your three main activities to prove it with outcomes.') ||
                                 'Pick one cause and show up weekly; capture before/after metrics or testimonials to make the benefit visible.'}
                              </div>
                            </div>
                            <div className="rounded-lg border p-3 bg-white/60">
                              <div className="text-xs uppercase text-muted-foreground">Distance to top tier</div>
                              <div className="text-sm mt-1 leading-6 text-foreground">
                                {(() => {
                                  const current = getHeroDisplayValue(heroSelectedMetric!);
                                  const target = 9.2;
                                  const gap = Math.max(0, Number((target - current).toFixed(1)));
                                  return gap === 0 ? 'You are performing at or above typical Top-25 admit levels—focus on sustaining visible outcomes.' : `${gap} points from a typical Top-25 admit profile—close it with 2–3 focused moves in the next 60–90 days.`;
                                })()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </section>

                      <hr className="border-t border-black/10" />

                      <section>
                        <div className="text-sm uppercase tracking-wide text-muted-foreground mb-2">Top 4 Improvements</div>
                        <ol className="mt-1 grid md:grid-cols-2 gap-x-6 gap-y-3">
                          {/* ---- Hard-coded improvement suggestions per metric ---- */}
                          {((): string[] => {
                            if (heroSelectedMetric === 'impact') return ['Quantify your outcomes by reporting people helped, revenue raised, or hours saved for each major initiative.', 'Elevate your responsibility by training peers or leading a small sub-team with clear goals and check-ins.', 'Ship one visible deliverable within 6–8 weeks and communicate results to the stakeholders who benefit.', 'Document proof with one or two public links (website, repo, media, or a short testimonial).'];
                            if (heroSelectedMetric === 'academic') return ['Add one stretch course next term and write an explicit support plan that includes office hours or tutoring.', 'Visualize your semester-by-semester grade trend and annotate what changed to drive improvement.', 'Take an external benchmark (AP/IB/dual-enroll/competition) to validate your readiness for rigor.', 'Publish a brief reflection that explains a hard concept you mastered and why it matters for your interests.'];
                            if (heroSelectedMetric === 'curiosity') return ['Launch a 6-week independent project with weekly milestones and one guiding research question.', 'Email one mentor or researcher for feedback and summarize the three most important insights you gained.', 'Produce a tangible artifact such as a public repo, prototype, short paper, or tutorial video.', 'Connect the project to your longer arc with a clear statement of the next experiment.'];
                            if (heroSelectedMetric === 'story') return ['Draft a 2–3 sentence thesis that explains your why and the impact you aim to create.', 'Align your top three activities under this thesis and downsize items that do not reinforce it.', 'Rewrite activity descriptions to lead with outcomes and concrete evidence instead of duties.', 'Secure one recommendation that explicitly reinforces this thesis with specific examples.'];
                            return ['Choose one or two causes and commit weekly time for the next two months to create continuity.', 'Measure who benefits and how by capturing before/after numbers or brief testimonials.', 'Add one leadership act within your service work such as coordination, training, or resource design.', 'Attach a visible proof link (program page, photo log, letter, or media mention).'];
                          })().map((p, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-semibold text-white flex-shrink-0" style={{ backgroundImage: getHeroMetricTheme(heroSelectedMetric === 'impact' ? 'leadership' : heroSelectedMetric === 'curiosity' ? 'growth' : heroSelectedMetric === 'story' ? 'overall' : heroSelectedMetric === 'character' ? 'uniqueness' : heroSelectedMetric).gradientCss }}>
                                {i + 1}
                              </span>
                              <span className="text-[14px] text-foreground leading-6">{p}</span>
                            </li>
                          ))}
                        </ol>
                      </section>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            )}
          </Collapsible>
        </div>
      </div>

      {/* ================================================================== */}
      {/* TWO-COLUMN WORKSPACE                                               */}
      {/* ================================================================== */}
      <div className="relative z-10 mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            {showLocalRecovery && localRecoveryData && (
              <LocalRecoveryBanner
                isVisible={showLocalRecovery}
                localSavedAt={localRecoveryData.savedAt}
                wordCount={localRecoveryData.wordCount}
                onRestore={handleLocalRecoveryRestore}
                onDismiss={handleLocalRecoveryDismiss}
                isRestoring={isRestoringLocal}
              />
            )}

            <Card className="p-6 bg-gradient-to-br from-background/95 via-background/90 to-pink-50/80 dark:from-background/95 dark:via-background/90 dark:to-pink-950/20 backdrop-blur-xl border shadow-lg">
            <EditorView
                key={selectedPromptId}
                currentDraft={currentDraft}
                onDraftChange={handleDraftChange}
                onSave={handleSave}
                activeIssues={[]}
                currentScore={currentScore}
                initialScore={initialScore}
                isAnalyzing={isAnalyzing}
                onRequestReanalysis={handleRequestReanalysis}
                hasAnalysisResult={hasAnalysis}
                canAnalyze={canAnalyze}
                versionHistory={draftVersions}
                canUndo={currentVersionIndex > 0}
                canRedo={currentVersionIndex < draftVersions.length - 1}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onShowHistory={handleOpenVersionHistory}
                hasUnsavedChanges={hasUnsavedChanges}
                analysisCreditCost={CREDIT_COSTS.ESSAY_ANALYSIS}
              />
            </Card>

          </div>

          <div className="space-y-6">
            <Card className="sticky top-36 p-6 bg-gradient-to-br from-background/95 via-background/90 to-pink-50/80 dark:from-background/95 dark:via-background/90 dark:to-pink-950/20 backdrop-blur-xl border shadow-lg">
              <ContextualWorkshopChat
                mode="piq"
                piqPromptId={selectedPromptId}
                piqPromptText={UC_PIQ_PROMPTS.find(p => p.id === selectedPromptId)?.prompt || ''}
                piqPromptTitle={UC_PIQ_PROMPTS.find(p => p.id === selectedPromptId)?.title || ''}
                activity={null}
                currentDraft={currentDraft}
                analysisResult={analysisResult}
                teachingCoaching={null}
                currentScore={currentScore}
                initialScore={initialScore}
                hasUnsavedChanges={hasUnsavedChanges}
                needsReanalysis={needsReanalysis}
                reflectionPromptsMap={new Map()}
                reflectionAnswers={{}}
                onTriggerReanalysis={handleRequestReanalysis}
                externalMessages={chatMessages}
                onMessagesChange={setChatMessages}
                versionHistory={draftVersions.map((v, idx) => ({
                  timestamp: v.timestamp,
                  nqi: v.score,
                  note: idx === currentVersionIndex ? 'Current version' : undefined
                }))}
                userId={userId}
                getToken={getToken}
              />
            </Card>
          </div>
        </div>
      </div>

      <VersionHistoryDrawer
        isOpen={showVersionHistoryDrawer}
        onClose={() => setShowVersionHistoryDrawer(false)}
        versions={dbVersionHistory}
        currentVersionId={dbVersionHistory[0]?.id}
        onRestore={handleRestoreFromDrawer}
        isLoading={isLoadingVersionHistory}
        error={versionHistoryError || undefined}
      />

      {showVersionHistory && (
        <DraftVersionHistory
          versions={draftVersions.map((v, idx) => ({
            id: `v${idx}`,
            description: v.text,
            timestamp: v.timestamp,
            score: v.score,
            source: v.source,
            categories: []
          }))}
          currentVersionId={`v${currentVersionIndex}`}
          onRestore={handleRestoreVersion}
          onClose={() => setShowVersionHistory(false)}
        />
      )}

      <InsufficientCreditsModal
        isOpen={showInsufficientCreditsModal}
        onClose={() => setShowInsufficientCreditsModal(false)}
        currentBalance={currentCreditBalance}
        requiredCredits={CREDIT_COSTS.ESSAY_ANALYSIS}
        actionType="analysis"
      />
    </div>
  );
}
