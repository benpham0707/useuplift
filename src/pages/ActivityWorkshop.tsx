// @ts-nocheck - Large page with many integration points
/**
 * Activity Workshop
 *
 * Activity portfolio analysis page with score dashboard, results tabs,
 * activity input form, and AI chat panel.
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// Badge, Progress, Textarea imports removed (moved to extracted components or unused)
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
// Tooltip imports removed (moved to extracted components or unused)
import { ChevronDown, MessageCircle, PanelRightClose, PanelRightOpen, ListChecks, BarChart3 } from 'lucide-react';
// GradientText import removed (unused)
// Tabs imports moved to PortfolioOverviewPanel
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import type { ImperativePanelHandle } from 'react-resizable-panels';
import { ActivityInputForm } from '@/components/portfolio/activity-workshop/ActivityInputForm';
import type { ActivityFormData } from '@/components/portfolio/activity-workshop/ActivityCard';
import { MOCK_DATA } from '@/components/portfolio/activity-workshop/mockData';
import { ActivityInsightsList } from '@/components/portfolio/activity-workshop/ActivityInsightsList';
import PortfolioOverviewPanel from '@/components/portfolio/activity-workshop/PortfolioOverviewPanel';
import ScoreDashboard from '@/components/portfolio/activity-workshop/ScoreDashboard';

// UI Components
import type { RubricDimension, WritingIssue, EditSuggestion } from '@/components/portfolio/extracurricular/workshop/types';
import ContextualWorkshopChat from '@/components/portfolio/extracurricular/workshop/components/ContextualWorkshopChat';
import { DraftVersionHistory } from '@/components/portfolio/extracurricular/workshop/DraftVersionHistory';

// New Version History System (v2)
import { VersionHistoryDrawer } from '@/components/portfolio/extracurricular/workshop/VersionHistoryDrawer';
import { SaveStatusIndicator } from '@/components/portfolio/extracurricular/workshop/SaveStatusIndicator';
import { LocalRecoveryBanner } from '@/components/portfolio/extracurricular/workshop/LocalRecoveryBanner';
import { AutosaveManager, type AutosaveState } from '@/services/piqWorkshop/autosaveService';
import { checkLocalRecovery, saveLocalDraft, clearAllLocalDrafts } from '@/services/piqWorkshop/storageService';

// PIQ Prompt Selector (still referenced in handler code; will be fully replaced when API is wired)
import { UC_PIQ_PROMPTS } from '@/components/portfolio/piq/workshop/PIQPromptSelector';

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
  // LAYOUT STATE
  // ============================================================================

  const [leftPanelTab, setLeftPanelTab] = useState<'activities' | 'results'>('results');
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
  const chatPanelRef = useRef<ImperativePanelHandle>(null);

  const handleToggleChat = useCallback(() => {
    const panel = chatPanelRef.current;
    if (!panel) return;
    if (isChatOpen) {
      panel.collapse();
    } else {
      panel.expand();
    }
    setIsChatOpen(!isChatOpen);
  }, [isChatOpen]);

  // ============================================================================
  // SCORE DASHBOARD + OVERVIEW TAB STATE
  // ============================================================================

  // Score dashboard + portfolio overview state moved to extracted components

  // scoreCards data moved to ScoreDashboard component

  // Score card refs + caret effect moved to ScoreDashboard component

  // Narrative variants + carousel data moved to PortfolioOverviewPanel component

  // getScoreCardColor moved to ScoreDashboard + PortfolioOverviewPanel

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


  // Portfolio overview extracted to <PortfolioOverviewPanel />
  // Score dashboard extracted to <ScoreDashboard />

  // Stable references for ContextualWorkshopChat props to prevent re-renders
  const stableReflectionPromptsMap = useMemo(() => new Map(), []);
  const stableReflectionAnswers = useMemo(() => ({}), []);
  const piqPromptText = useMemo(
    () => UC_PIQ_PROMPTS.find(p => p.id === selectedPromptId)?.prompt || '',
    [selectedPromptId]
  );
  const piqPromptTitle = useMemo(
    () => UC_PIQ_PROMPTS.find(p => p.id === selectedPromptId)?.title || '',
    [selectedPromptId]
  );
  const chatVersionHistory = useMemo(
    () => draftVersions.map((v, idx) => ({
      timestamp: v.timestamp,
      nqi: v.score,
      note: idx === currentVersionIndex ? 'Current version' : undefined,
    })),
    [draftVersions, currentVersionIndex]
  );

  // Stable callback for ActivityInputForm
  const handleAnalyzeActivities = useCallback((_activities: any) => {
    setLeftPanelTab('results');
  }, []);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="hero-gradient hero-gradient-fade absolute top-0 left-0 right-0 h-[120vh] pointer-events-none -z-10" />

      {/* ================================================================== */}
      {/* SCORE DASHBOARD + TABBED OVERVIEW                                  */}
      {/* ================================================================== */}
      <div className="hero-gradient text-white relative flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-3">

          {/* Score Dashboard — extracted memoized component */}
          <ScoreDashboard data={MOCK_DATA} />

          {/* Portfolio Overview — collapsible below score cards */}
          <Collapsible open={isOverviewOpen} onOpenChange={setIsOverviewOpen}>
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between py-2 px-1 text-white/80 hover:text-white transition-colors">
                <span className="text-sm font-semibold uppercase tracking-wider">Portfolio Overview</span>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOverviewOpen ? 'rotate-180' : ''}`} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-3 pb-2">
                <PortfolioOverviewPanel data={MOCK_DATA} />
              </div>
            </CollapsibleContent>
          </Collapsible>

        </div>
      </div>

      {/* ================================================================== */}
      {/* RESIZABLE TWO-PANEL WORKSPACE                                      */}
      {/* ================================================================== */}
      <div className="flex-1 min-h-[500px] px-4 py-4">
        <ResizablePanelGroup direction="horizontal" className="rounded-lg border bg-background shadow-lg">

          {/* ============ LEFT PANEL ============ */}
          <ResizablePanel defaultSize={65} minSize={40}>
            <div className="h-full flex flex-col overflow-hidden">
              {/* Left Panel Tab Switcher */}
              <div className="flex-shrink-0 border-b bg-muted/30 px-4 py-2">
                <div className="flex gap-1">
                  <button
                    onClick={() => setLeftPanelTab('activities')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      leftPanelTab === 'activities'
                        ? 'bg-background shadow-sm text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                    }`}
                  >
                    <ListChecks className="h-4 w-4" />
                    My Activities
                  </button>
                  <button
                    onClick={() => setLeftPanelTab('results')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      leftPanelTab === 'results'
                        ? 'bg-background shadow-sm text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                    }`}
                  >
                    <BarChart3 className="h-4 w-4" />
                    Activity Insights
                  </button>
                </div>
              </div>

              {/* Left Panel Content */}
              <div className="flex-1 overflow-y-auto">
                {leftPanelTab === 'activities' ? (
                  /* ============ MY ACTIVITIES TAB ============ */
                  <div className="p-6">
                    <ActivityInputForm
                      onAnalyze={handleAnalyzeActivities}
                      isAnalyzing={isAnalyzing}
                    />
                  </div>
                ) : (
                  /* ============ ACTIVITY INSIGHTS TAB ============ */
                  <div className="p-4">
                    <ActivityInsightsList data={MOCK_DATA} />
                  </div>
                )}
              </div>
            </div>
          </ResizablePanel>

          {/* ============ RESIZE HANDLE ============ */}
          <ResizableHandle withHandle />

          {/* ============ RIGHT PANEL (Chat) ============ */}
          <ResizablePanel
            ref={chatPanelRef}
            defaultSize={35}
            minSize={25}
            collapsible
            collapsedSize={0}
            onCollapse={() => setIsChatOpen(false)}
            onExpand={() => setIsChatOpen(true)}
          >
            <div className="h-full flex flex-col overflow-hidden">
              {/* Chat Panel Header */}
              <div className="flex-shrink-0 border-b bg-muted/30 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">AI Coach</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleChat}
                  className="h-7 w-7 p-0"
                >
                  <PanelRightClose className="h-4 w-4" />
                </Button>
              </div>

              {/* Chat Content */}
              <div className="flex-1 overflow-hidden">
                <ContextualWorkshopChat
                  mode="piq"
                  piqPromptId={selectedPromptId}
                  piqPromptText={piqPromptText}
                  piqPromptTitle={piqPromptTitle}
                  activity={null}
                  currentDraft={currentDraft}
                  analysisResult={analysisResult}
                  teachingCoaching={null}
                  currentScore={currentScore}
                  initialScore={initialScore}
                  hasUnsavedChanges={hasUnsavedChanges}
                  needsReanalysis={needsReanalysis}
                  reflectionPromptsMap={stableReflectionPromptsMap}
                  reflectionAnswers={stableReflectionAnswers}
                  onTriggerReanalysis={handleRequestReanalysis}
                  externalMessages={chatMessages}
                  onMessagesChange={setChatMessages}
                  versionHistory={chatVersionHistory}
                  userId={userId}
                  getToken={getToken}
                />
              </div>
            </div>
          </ResizablePanel>

        </ResizablePanelGroup>

        {/* Collapsed chat toggle button — visible when chat is closed */}
        {!isChatOpen && (
          <button
            onClick={handleToggleChat}
            className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-3 rounded-l-lg bg-purple-600 text-white shadow-lg hover:bg-purple-700 transition-colors z-20"
          >
            <PanelRightOpen className="h-4 w-4" />
            <span className="text-xs font-medium [writing-mode:vertical-lr] rotate-180">Chat</span>
          </button>
        )}
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
