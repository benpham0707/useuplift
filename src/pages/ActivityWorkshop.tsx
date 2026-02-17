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
import { ArrowLeft, Loader2, RefreshCcw, Target, TrendingUp, TrendingDown, Minus, AlertTriangle, History, XCircle, CheckCircle, PenTool, Info, Sparkles, X, ChevronLeft, ChevronRight, Pencil, Check, Lightbulb, Flag } from 'lucide-react';
import GradientText from '@/components/ui/GradientText';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

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
  // SCORE DASHBOARD + OVERVIEW TAB STATE
  // ============================================================================

  const [expandedScoreCard, setExpandedScoreCard] = useState<number | null>(null);
  const [narrativeVariantIndex, setNarrativeVariantIndex] = useState(0);
  const [isEditingNarrative, setIsEditingNarrative] = useState(false);
  const [narrativeDraft, setNarrativeDraft] = useState('');
  const [spikeIndex, setSpikeIndex] = useState(0);
  const [memorableIndex, setMemorableIndex] = useState(0);
  const [priorityIndex, setPriorityIndex] = useState(0);

  // ---- Hard-coded mock data: Score Dashboard cards with scores, rationale, and improvement suggestions ----
  const scoreCards = [
    { label: 'Activity Strength', score: 7.2, rationale: 'Your activities show solid involvement but could benefit from deeper leadership roles and more quantifiable outcomes. Focus on demonstrating initiative rather than just participation.', improvements: ['Take on a named leadership role in at least one activity', 'Add specific numbers to every description (members recruited, events organized)', 'Document outcomes, not just participation'] },
    { label: 'Spike Depth', score: 8.1, rationale: 'Strong concentration in CS with a clear progression from self-teaching to research. The CS Club founding demonstrates initiative. Deepen by publishing work or competing.', improvements: ['Submit research to a student journal or conference', 'Enter a CS competition (USACO, hackathon)', 'Create a public artifact (GitHub repo, app, blog)'] },
    { label: 'Story Coherence', score: 7.8, rationale: 'Your activities connect well around a theme of building access from scratch. The thread from personal experience to technical solutions is compelling. Tighten by making the grocery/farm jobs explicitly support the narrative.', improvements: ['Rewrite grocery job description to connect to your CS mission', 'Frame farm work as problem-solving under constraint', 'Add a bridge sentence connecting each activity to your core theme'] },
    { label: 'Major Fit', score: 6.5, rationale: 'CS intent is clear from club and research, but admissions wants to see breadth of intellectual curiosity beyond one domain. A humanities or social science pursuit would strengthen this.', improvements: ['Frame research and tutoring as directly supporting your CS trajectory', 'Add technical specifics that connect each activity to your intended major', 'Highlight how non-CS activities developed transferable skills (systems thinking, leadership)'] },
    { label: 'Description Quality', score: 7.4, rationale: 'Descriptions are functional but could be more impactful. Lead with outcomes and numbers rather than role descriptions. Every character should earn its place in the 150-char limit.', improvements: ['Lead every description with the strongest outcome', 'Use specific metrics in at least 3 of 5 descriptions', 'Cut filler words — every character of the 150 limit should earn its place'] },
  ];

  // Refs for caret positioning on score dashboard
  const scoreCardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const scoreContainerRef = useRef<HTMLDivElement>(null);
  const [caretLeftPx, setCaretLeftPx] = useState<number | null>(null);

  // Recalculate caret position on card selection and window resize
  useEffect(() => {
    const recalc = () => {
      if (expandedScoreCard === null || !scoreContainerRef.current) {
        setCaretLeftPx(null);
        return;
      }
      const btn = scoreCardRefs.current[expandedScoreCard];
      const container = scoreContainerRef.current;
      if (btn && container) {
        const btnRect = btn.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        setCaretLeftPx(btnRect.left - containerRect.left + btnRect.width / 2);
      }
    };
    recalc();
    window.addEventListener('resize', recalc);
    return () => window.removeEventListener('resize', recalc);
  }, [expandedScoreCard]);

  // ---- Hard-coded mock data: Portfolio narrative variants ----
  const narrativeVariants = [
    "This student built a CS club from scratch in a school with zero STEM infrastructure while working 20 hours weekly at a grocery store, then leveraged that self-taught foundation to land remote ML research analyzing rural healthcare access—turning personal experience with resource scarcity into technical expertise that addresses it.",
    "A first-generation student who transformed resource constraints into innovation fuel—founding the school's first CS club, securing independent ML research, and connecting grocery-store hustle to a mission of using technology to close access gaps in underserved communities.",
    "From zero STEM resources to ML research: this student's journey from self-teaching programming to founding a CS club to analyzing rural healthcare data tells a story of someone who doesn't wait for infrastructure—they build it, then use it to serve others.",
  ];

  // ---- Hard-coded mock data: Quick insight carousel values ----
  const spikeVariants = ['CS with Social Impact', 'Technical Leadership in Low-Resource Settings', 'Self-Directed STEM Innovation'];
  const memorableVariants = [
    'First-gen student who turns resource scarcity into technical solutions',
    'Built CS infrastructure from nothing while working 20hrs/week',
    'Connects personal hardship to research that helps communities like theirs',
  ];
  const priorityVariants = [
    'Quantify CS Club impact with specific metrics',
    'Strengthen research narrative with publication or presentation',
    'Add external recognition or competition results',
  ];

  const getScoreCardColor = (score: number): string => {
    if (score >= 8.0) return 'text-green-500';
    if (score >= 6.0) return 'text-teal-500';
    if (score >= 4.0) return 'text-amber-500';
    return 'text-red-500';
  };

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
      {/* SCORE DASHBOARD + TABBED OVERVIEW                                  */}
      {/* ================================================================== */}
      <div className="hero-gradient text-white relative">
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-3">

          {/* Score Dashboard: 5 cards + full-width expansion panel */}
          <div ref={scoreContainerRef} className="relative space-y-0">
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {/* ---- OVERALL card: non-expandable, display-only ---- */}
              <div className="flex flex-col items-center">
                <div className="w-full text-center p-4 rounded-xl border border-white/30 bg-white/15 backdrop-blur-xl">
                  <div className={`text-4xl font-bold ${getScoreCardColor(7.8)}`}>
                    7.8
                  </div>
                  <div className="text-xs font-medium text-white/80 mt-1 uppercase tracking-wider">
                    Overall
                  </div>
                </div>
                {/* ---- Hard-coded mock data: Harvard Scale + Competitive badges ---- */}
                <div className="flex flex-col items-center gap-0.5 mt-1">
                  <span className="text-[10px] text-white/50">Harvard Scale 4 — Top 40%</span>
                  <span className="text-[10px] text-teal-400/70 font-medium">Competitive</span>
                </div>
              </div>
              {scoreCards.map((card, idx) => (
                <button
                  key={card.label}
                  ref={(el) => { scoreCardRefs.current[idx] = el; }}
                  onClick={() => setExpandedScoreCard(expandedScoreCard === idx ? null : idx)}
                  className={`w-full text-center p-4 rounded-xl border backdrop-blur-xl transition-all duration-300 cursor-pointer ${
                    expandedScoreCard === idx
                      ? 'border-white/50 bg-white/25 shadow-lg'
                      : 'border-white/20 bg-white/10 hover:bg-white/15 hover:border-white/30'
                  }`}
                >
                  <div className={`text-3xl font-bold ${getScoreCardColor(card.score)}`}>
                    {card.score.toFixed(1)}
                  </div>
                  <div className="text-xs font-medium text-white/80 mt-1 uppercase tracking-wider">
                    {card.label}
                  </div>
                </button>
              ))}
            </div>

            {/* Full-width expansion panel with caret */}
            <div
              className="overflow-hidden transition-all duration-300"
              style={{
                maxHeight: expandedScoreCard !== null ? '400px' : '0px',
                opacity: expandedScoreCard !== null ? 1 : 0,
              }}
            >
              {expandedScoreCard !== null && (
                <div className="relative mt-3">
                  {/* Caret triangle */}
                  {caretLeftPx !== null && (
                    <div
                      className="absolute -top-2 w-4 h-4 bg-white/15 border-t border-l border-white/30 rotate-45 z-10 backdrop-blur-xl"
                      style={{ left: caretLeftPx - 8 }}
                    />
                  )}
                  <div className="rounded-xl border border-white/25 bg-white/15 backdrop-blur-xl p-5">
                    <h4 className="font-bold text-white text-base mb-2">{scoreCards[expandedScoreCard].label}</h4>
                    <p className="text-sm text-white/90 leading-relaxed mb-3">{scoreCards[expandedScoreCard].rationale}</p>
                    <div className="bg-white/10 rounded-lg p-3">
                      <p className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-2">How to improve</p>
                      <ul className="space-y-1.5">
                        {scoreCards[expandedScoreCard].improvements.map((imp, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-white/90">
                            <TrendingUp className="h-3.5 w-3.5 text-teal-400 mt-0.5 flex-shrink-0" />
                            <span>{imp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tab Bar */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="bg-white/10 border border-white/20 backdrop-blur-md w-full justify-start">
              <TabsTrigger value="overview" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70">Overview</TabsTrigger>
              <TabsTrigger value="your-story" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70">Your Story</TabsTrigger>
              <TabsTrigger value="your-edge" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70">Your Edge</TabsTrigger>
              <TabsTrigger value="action-plan" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70">Action Plan</TabsTrigger>
            </TabsList>

            {/* ============ OVERVIEW TAB ============ */}
            <TabsContent value="overview" className="mt-3 space-y-3">

              {/* Portfolio Narrative — blockquote style */}
              <div className="border-l-4 border-l-blue-400/50 pl-4 py-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs uppercase tracking-widest text-white/60 font-semibold">Portfolio Narrative</div>
                  <div className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
                    {!isEditingNarrative && (
                      <button
                        className="p-1 rounded-md hover:bg-white/10 transition"
                        onClick={() => { setNarrativeDraft(narrativeVariants[narrativeVariantIndex]); setIsEditingNarrative(true); }}
                        aria-label="Edit narrative"
                      >
                        <Pencil className="h-3 w-3 text-white/70" />
                      </button>
                    )}
                    <button className="p-1 rounded-md hover:bg-white/10 transition" onClick={() => setNarrativeVariantIndex((i) => (i - 1 + narrativeVariants.length) % narrativeVariants.length)} aria-label="Previous variant">
                      <ChevronLeft className="h-3 w-3 text-white/70" />
                    </button>
                    <button className="p-1 rounded-md hover:bg-white/10 transition" onClick={() => setNarrativeVariantIndex((i) => (i + 1) % narrativeVariants.length)} aria-label="Next variant">
                      <ChevronRight className="h-3 w-3 text-white/70" />
                    </button>
                    {!isEditingNarrative && (
                      <button className="p-1 rounded-md hover:bg-white/10 transition" aria-label="Regenerate">
                        <RefreshCcw className="h-3 w-3 text-white/70" />
                      </button>
                    )}
                  </div>
                </div>
                {!isEditingNarrative ? (
                  <p className="text-white/90 text-base leading-7">{narrativeVariants[narrativeVariantIndex]}</p>
                ) : (
                  <div className="space-y-2">
                    <Textarea value={narrativeDraft} onChange={(e) => setNarrativeDraft(e.target.value)} placeholder="Write your narrative angle..." className="bg-white/20 text-white placeholder:text-white/60 min-h-[80px] border-white/20" />
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" className="text-white/70" onClick={() => setIsEditingNarrative(false)}>Cancel</Button>
                      <Button size="sm" variant="secondary" onClick={() => setIsEditingNarrative(false)}>
                        <Check className="h-4 w-4 mr-1" /> Save
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Three Quick Insight Cards — spotlight treatment */}
              <div className="grid md:grid-cols-3 gap-3">
                {/* YOUR SPIKE */}
                <div className="rounded-xl border border-white/35 bg-white/20 backdrop-blur-2xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5 text-blue-400" />
                      <span className="text-xs uppercase tracking-widest text-white/60 font-semibold">Your Spike</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="p-1 rounded-md hover:bg-white/20 transition" onClick={() => setSpikeIndex((i) => (i - 1 + spikeVariants.length) % spikeVariants.length)}><ChevronLeft className="h-3.5 w-3.5 text-white" /></button>
                      <button className="p-1 rounded-md hover:bg-white/20 transition" onClick={() => setSpikeIndex((i) => (i + 1) % spikeVariants.length)}><ChevronRight className="h-3.5 w-3.5 text-white" /></button>
                    </div>
                  </div>
                  <p className="text-white/95 text-sm font-semibold">{spikeVariants[spikeIndex]}</p>
                </div>

                {/* WHAT THEY'LL REMEMBER */}
                <div className="rounded-xl border border-white/35 bg-white/20 backdrop-blur-2xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                      <span className="text-xs uppercase tracking-widest text-white/60 font-semibold">What They'll Remember</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="p-1 rounded-md hover:bg-white/20 transition" onClick={() => setMemorableIndex((i) => (i - 1 + memorableVariants.length) % memorableVariants.length)}><ChevronLeft className="h-3.5 w-3.5 text-white" /></button>
                      <button className="p-1 rounded-md hover:bg-white/20 transition" onClick={() => setMemorableIndex((i) => (i + 1) % memorableVariants.length)}><ChevronRight className="h-3.5 w-3.5 text-white" /></button>
                    </div>
                  </div>
                  <p className="text-white/95 text-sm font-semibold">{memorableVariants[memorableIndex]}</p>
                </div>

                {/* #1 PRIORITY */}
                <div className="rounded-xl border border-white/35 bg-white/20 backdrop-blur-2xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <Flag className="h-3.5 w-3.5 text-red-400" />
                      <span className="text-xs uppercase tracking-widest text-white/60 font-semibold">#1 Priority</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="p-1 rounded-md hover:bg-white/20 transition" onClick={() => setPriorityIndex((i) => (i - 1 + priorityVariants.length) % priorityVariants.length)}><ChevronLeft className="h-3.5 w-3.5 text-white" /></button>
                      <button className="p-1 rounded-md hover:bg-white/20 transition" onClick={() => setPriorityIndex((i) => (i + 1) % priorityVariants.length)}><ChevronRight className="h-3.5 w-3.5 text-white" /></button>
                    </div>
                  </div>
                  <p className="text-white/95 text-sm font-semibold">{priorityVariants[priorityIndex]}</p>
                </div>
              </div>

              {/* Key Strengths & Opportunities — tighter, stronger borders */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/25 bg-white/10 backdrop-blur-md p-3 px-4 border-l-4 border-l-green-500">
                  <h3 className="text-sm font-semibold text-white mb-2 uppercase tracking-wider">Key Strengths</h3>
                  <ul className="space-y-1.5">
                    {/* ---- Hard-coded mock data: strength bullets ---- */}
                    {['Pioneer initiative in zero-resource environment', 'Clear CS spike with social impact angle', 'Authentic first-gen narrative'].map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-white/90">
                        <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-white/25 bg-white/10 backdrop-blur-md p-3 px-4 border-l-4 border-l-amber-500">
                  <h3 className="text-sm font-semibold text-white mb-2 uppercase tracking-wider">Opportunities to Strengthen</h3>
                  <ul className="space-y-1.5">
                    {/* ---- Hard-coded mock data: opportunity bullets ---- */}
                    {['Limited external recognition', 'Some activities feel disconnected from spike'].map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-white/90">
                        <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Strategic Direction — Coaching Pitch first */}
              <div className="rounded-xl border border-white/25 bg-white/10 backdrop-blur-md p-3 px-4 space-y-2">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Strategic Direction</h3>
                {/* ---- Hard-coded mock data: strategic direction paragraphs ---- */}
                {/* Coaching Pitch — top, visually distinct */}
                <div className="rounded-lg bg-purple-500/10 border-l-4 border-l-purple-400/60 p-3">
                  <div className="text-xs uppercase tracking-wide text-white/50 mb-1">Coaching Pitch</div>
                  <p className="text-sm text-white/90 leading-relaxed italic">
                    "You're not just a CS student — you're someone who saw a gap and built the bridge. The admissions committee will remember the kid who started a CS club with no computers, not the one who joined an existing one. Now make every line of your application prove that story with numbers, outcomes, and artifacts they can point to."
                  </p>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-white/50 mb-0.5">Current State</div>
                  <p className="text-sm text-white/80 leading-relaxed">
                    You have a distinctive profile centered on building CS infrastructure from scratch in a low-resource environment. Your activities demonstrate genuine initiative and a clear connection between personal experience and technical ambition. The foundation is strong but needs more external validation and tighter narrative connections.
                  </p>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-white/50 mb-0.5">Strategic Direction</div>
                  <p className="text-sm text-white/80 leading-relaxed">
                    Double down on the "builder who creates access" angle. Every activity description should reinforce this thread. Seek external recognition (competitions, publications, community partnerships) to validate what you've built. Tighten the connection between your work experiences and your CS mission.
                  </p>
                </div>
              </div>

            </TabsContent>

            {/* ============ PLACEHOLDER TABS ============ */}
            <TabsContent value="your-story" className="mt-4">
              <div className="rounded-xl border border-white/25 bg-white/10 backdrop-blur-md p-8 text-center">
                <p className="text-white/70 text-sm">
                  <span className="font-semibold text-white/90">Your Story</span> — How your activities weave into a compelling narrative. Coming soon.
                </p>
              </div>
            </TabsContent>
            <TabsContent value="your-edge" className="mt-4">
              <div className="rounded-xl border border-white/25 bg-white/10 backdrop-blur-md p-8 text-center">
                <p className="text-white/70 text-sm">
                  <span className="font-semibold text-white/90">Your Edge</span> — Your competitive positioning and school fit analysis. Coming soon.
                </p>
              </div>
            </TabsContent>
            <TabsContent value="action-plan" className="mt-4">
              <div className="rounded-xl border border-white/25 bg-white/10 backdrop-blur-md p-8 text-center">
                <p className="text-white/70 text-sm">
                  <span className="font-semibold text-white/90">Action Plan</span> — Exactly what to do next, prioritized by impact. Coming soon.
                </p>
              </div>
            </TabsContent>
          </Tabs>

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
