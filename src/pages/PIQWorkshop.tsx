// @ts-nocheck - Large page with many integration points
/**
 * PIQ Narrative Workshop - Full Backend Integration
 *
 * Integrated with full surgical workshop backend including:
 * - Voice Fingerprint (4 dimensions)
 * - Experience Fingerprint (anti-convergence system)
 * - 12-Dimension Rubric Analysis
 * - Workshop Items with surgical fixes
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowLeft, Loader2, RefreshCcw, Target, TrendingUp, TrendingDown, Minus, AlertTriangle, History, XCircle, CheckCircle, PenTool, Info } from 'lucide-react';
import GradientText from '@/components/ui/GradientText';

// UI Components
import { EditorView } from '@/components/portfolio/extracurricular/workshop/views/EditorView';
import { RubricDimensionCard } from '@/components/portfolio/extracurricular/workshop/RubricDimensionCard';
import type { RubricDimension, WritingIssue, EditSuggestion } from '@/components/portfolio/extracurricular/workshop/types';
import ContextualWorkshopChat from '@/components/portfolio/extracurricular/workshop/components/ContextualWorkshopChat';
import { DraftVersionHistory } from '@/components/portfolio/extracurricular/workshop/DraftVersionHistory';
import { RandomizingScore } from '@/components/portfolio/piq/workshop/RandomizingScore';

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
  saveVersion,
} from '@/services/piqWorkshop/piqDatabaseService';

// Stub functions for missing imports (will be implemented in future)
const saveVersionToHistory = saveVersion;
const getCurrentEssayId = async () => null as string | null;
const saveChatMessages = async () => ({ success: true });
const loadChatMessages = async () => ({ success: true, messages: [] });

// Chat message type
import type { ChatMessage } from '@/services/workshop/chatService';

// Authentication
import { useAuth } from '@clerk/clerk-react';
import { useClerkUserId, useIsAuthenticated } from '@/services/auth/clerkSupabaseAdapter';

// Navigation
import Navigation from '@/components/Navigation';

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
  score?: number; // Optional - undefined for 'save_draft' versions
  source?: 'analyze' | 'save_draft'; // Optional - 'analyze' has score, 'save_draft' doesn't
}

export default function PIQWorkshop() {
  const navigate = useNavigate();
  const { piqNumber } = useParams<{ piqNumber?: string }>();

  // Convert URL param to prompt ID (e.g., "1" -> "piq1")
  const getPromptIdFromUrl = (): string => {
    if (piqNumber) {
      const num = parseInt(piqNumber);
      if (num >= 1 && num <= 8) {
        return `piq${num}`;
      }
    }
    return 'piq1'; // Default to PIQ 1
  };

  // ============================================================================
  // AUTHENTICATION
  // ============================================================================

  const { getToken } = useAuth();
  const userId = useClerkUserId();
  const isAuthenticated = useIsAuthenticated();

  // ============================================================================
  // STATE
  // ============================================================================

  // Database state (NEW)
  const [currentEssayId, setCurrentEssayId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaveError, setLastSaveError] = useState<string | null>(null);
  const [isLoadingFromDatabase, setIsLoadingFromDatabase] = useState(false);
  const [showResumeSessionBanner, setShowResumeSessionBanner] = useState(false);

  const [currentDraft, setCurrentDraft] = useState('');
  const [draftVersions, setDraftVersions] = useState<DraftVersion[]>([]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0);
  const [dimensions, setDimensions] = useState<RubricDimension[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [needsReanalysis, setNeedsReanalysis] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [expandedDimensionId, setExpandedDimensionId] = useState<string | null>(null);
  const initialScoreRef = useRef<number>(0);

  // Phase 18 validation state
  const [validationLoading, setValidationLoading] = useState(false);
  const [validationComplete, setValidationComplete] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  
  // Track if essay has enough content to analyze
  const canAnalyze = currentDraft.trim().length >= MIN_ESSAY_LENGTH;

  // NEW: Full Backend Integration State
  const [selectedPromptId, setSelectedPromptId] = useState<string>(getPromptIdFromUrl()); // Based on URL param
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [narrativeOverview, setNarrativeOverview] = useState<string | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(false);

  // Chat state (for persistence)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Credits modal state
  const [showInsufficientCreditsModal, setShowInsufficientCreditsModal] = useState(false);
  const [currentCreditBalance, setCurrentCreditBalance] = useState(0);

  // Caching & Save State
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Extract active issues from dimensions
  const activeIssues = dimensions.flatMap(d => d.issues).filter(i => i.status !== 'fixed');

  // ============================================================================
  // COMPUTED VALUES (must be before useEffect hooks)
  // ============================================================================

  const currentScore = analysisResult?.analysis?.narrative_quality_index || 0;
  const initialScore = initialScoreRef.current;
  const hasAnalysis = analysisResult !== null && dimensions.length > 0;

  // ============================================================================
  // REAL BACKEND ANALYSIS - Full Surgical Workshop
  // ============================================================================

  const performFullAnalysis = useCallback(async (overrideEssayId?: string) => {
    console.log('🔍 performFullAnalysis called');
    console.log('   Current draft length:', currentDraft.length);
    console.log('   Selected prompt:', selectedPromptId);
    console.log('   Override essay ID:', overrideEssayId || 'none');
    
    // Guard: Prevent analyzing empty or too-short essays
    if (currentDraft.trim().length < MIN_ESSAY_LENGTH) {
      console.warn(`Essay too short (${currentDraft.trim().length} chars) - need at least ${MIN_ESSAY_LENGTH} chars to analyze`);
      return;
    }

    if (!selectedPromptId) {
      console.warn('No prompt selected - cannot analyze');
      return;
    }

    const selectedPrompt = UC_PIQ_PROMPTS.find(p => p.id === selectedPromptId);
    if (!selectedPrompt) {
      console.warn('Invalid prompt selection');
      return;
    }

    // Check if analysis is cached FIRST (before credit check)
    const cachedResult = getCachedAnalysisResult(currentDraft, selectedPromptId);
    
    // Only check/deduct credits if NOT cached
    if (!cachedResult && userId) {
      const token = await getToken({ template: 'supabase' });
      if (token) {
        const creditCheck = await canAnalyzeEssay(userId, token);
        console.log(`💳 Credit check: ${creditCheck.currentBalance} credits available, ${creditCheck.required} required`);
        
        if (!creditCheck.hasEnough) {
          console.warn(`❌ Insufficient credits: ${creditCheck.currentBalance}/${creditCheck.required}`);
          setCurrentCreditBalance(creditCheck.currentBalance);
          setShowInsufficientCreditsModal(true);
          return;
        }
        
        // Deduct credits IMMEDIATELY before analysis starts
        const deductResult = await deductForEssayAnalysis(userId, token, selectedPrompt.title);
        if (deductResult.success) {
          console.log(`💳 Deducted ${CREDIT_COSTS.ESSAY_ANALYSIS} credits upfront. New balance: ${deductResult.newBalance}`);
        } else {
          console.warn('⚠️ Failed to deduct credits:', deductResult.error);
          // Don't proceed if deduction fails
          return;
        }
      }
    }

    setIsAnalyzing(true);
    setValidationLoading(false);
    setValidationComplete(false);
    try {
      let result: AnalysisResult;

      if (cachedResult) {
        console.log('✅ Using cached analysis result - skipping API call (no credits charged)');
        result = cachedResult;
        setIsAnalyzing(false);
        setValidationComplete(true);
      } else {
        console.log('🔄 No cache found - calling two-step backend analysis');
        // Call TWO-STEP surgical workshop backend (Phase 17 + Phase 18)
        result = await analyzePIQEntryTwoStep(
          currentDraft,
          selectedPrompt.title,
          selectedPrompt.prompt,
          {
            // Phase 17 complete - display suggestions immediately
            onPhase17Complete: (phase17Result) => {
              console.log('📊 Phase 17 complete - displaying suggestions');
              setAnalysisResult(phase17Result);

              // Transform backend dimensions to UI dimensions
              if (phase17Result.rubricDimensionDetails && phase17Result.rubricDimensionDetails.length > 0) {
                const transformedDimensions: RubricDimension[] = phase17Result.rubricDimensionDetails.map((dim) => {
                  const status = dim.final_score >= 8 ? 'good' : dim.final_score >= 6 ? 'needs_work' : 'critical';

                  const issuesForDimension = (phase17Result.workshopItems || [])
                    .filter(item => item.rubric_category === dim.dimension_name);

                  const transformedIssues = issuesForDimension.map((item) => ({
                    id: item.id,
                    dimensionId: dim.dimension_name,
                    title: item.problem,
                    excerpt: item.quote,
                    analysis: item.why_it_matters,
                    impact: item.why_it_matters || '',
                    teaching: item.teaching, // Phase 19 teaching guidance
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

              // Update initial score ref on first analysis
              if (initialScoreRef.current === 73 && phase17Result.analysis?.narrative_quality_index) {
                initialScoreRef.current = phase17Result.analysis.narrative_quality_index;
              }

              // Phase 17 done, but Phase 18 still loading
              setIsAnalyzing(false);
              setValidationLoading(true);
            },

            // Phase 18 complete - add quality scores
            onPhase18Complete: (validatedResult) => {
              console.log('✨ Phase 18 complete - adding quality scores');
              setAnalysisResult(validatedResult);

              // Re-transform dimensions with validation data
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
                    teaching: item.teaching, // Phase 19 teaching guidance
                    suggestions: item.suggestions.map((sug) => ({
                      text: sug.text,
                      rationale: sug.rationale,
                      type: sug.type === 'polished_original' ? 'replace' as const :
                            sug.type === 'voice_amplifier' ? 'replace' as const :
                            'replace' as const,
                      // Include validation data for UI display
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

            // Phase 19 complete - teaching guidance available
            onPhase19Complete: (teachingResult) => {
              console.log('📚 Phase 19 complete - adding teaching guidance');
              setAnalysisResult(teachingResult);

              // Re-transform dimensions with teaching data
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
                    teaching: item.teaching, // NOW POPULATED from Phase 19!
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

            // Progress updates
            onProgress: (status) => {
              console.log('📍', status);
              setProgressMessage(status);
            }
          },
          { essayType: 'uc_piq' }
        );

        // Cache the result
        cacheAnalysisResult(currentDraft, selectedPromptId, result);
        console.log('✅ Analysis result cached for future use');
      }

      console.log('📊 Backend result received - FULL OBJECT:');
      console.log(JSON.stringify(result, null, 2));

      setAnalysisResult(result);

      console.log('📊 Result properties:');
      console.log('   - rubricDimensionDetails:', result.rubricDimensionDetails?.length || 0, 'dimensions');
      console.log('   - workshopItems:', result.workshopItems?.length || 0, 'items');
      console.log('   - voiceFingerprint type:', typeof result.voiceFingerprint, result.voiceFingerprint ? 'PRESENT' : 'MISSING');
      console.log('   - experienceFingerprint type:', typeof result.experienceFingerprint, result.experienceFingerprint ? 'PRESENT' : 'MISSING');

      // Transform backend dimensions to UI dimensions
      if (result.rubricDimensionDetails && result.rubricDimensionDetails.length > 0) {
        console.log('📝 Transforming dimensions...');
        console.log('📦 Workshop Items:', result.workshopItems?.length || 0);
        if (result.workshopItems && result.workshopItems.length > 0) {
          console.log('🔍 Workshop item categories:', result.workshopItems.map(item => item.rubric_category));
        }

        const transformedDimensions: RubricDimension[] = result.rubricDimensionDetails.map((dim) => {
          const status = dim.final_score >= 8 ? 'good' : dim.final_score >= 6 ? 'needs_work' : 'critical';

          // Transform workshop items to issues
          const issuesForDimension = (result.workshopItems || [])
            .filter(item => item.rubric_category === dim.dimension_name);

          console.log(`   - ${dim.dimension_name}: ${dim.final_score}/10, ${issuesForDimension.length} issues found`);

          const transformedIssues = issuesForDimension.map((item) => ({
              id: item.id,
              dimensionId: dim.dimension_name,
              title: item.problem,
              excerpt: item.quote,
              analysis: item.why_it_matters,
              impact: item.why_it_matters || '',
              teaching: item.teaching, // Phase 19 teaching guidance
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

        console.log(`✅ Transformed ${transformedDimensions.length} dimensions with ${transformedDimensions.reduce((sum, d) => sum + d.issues.length, 0)} total issues`);
        console.log('🔄 About to call setDimensions with transformed data...');
        setDimensions(transformedDimensions);
        console.log('✅ setDimensions completed successfully');

        // Update initial score ref on first analysis
        if (initialScoreRef.current === 73 && result.analysis?.narrative_quality_index) {
          console.log(`📊 Updating initial score from ${initialScoreRef.current} to ${result.analysis.narrative_quality_index}`);
          initialScoreRef.current = result.analysis.narrative_quality_index;
        }
      } else {
        console.warn('⚠️  No rubricDimensionDetails in result - using mock dimensions');
        console.log('   Result keys:', Object.keys(result));
        // Keep mock dimensions if backend doesn't return rubric details
      }

      setNeedsReanalysis(false);
      console.log('✅ Analysis complete - UI updated');

      // AUTO-SAVE: Essay, Analysis, Version History, and Chat
      // This ensures everything persists when user switches PIQs
      let effectiveEssayId = overrideEssayId || currentEssayId;
      
      if (userId) {
        try {
          const token = await getToken({ template: 'supabase' });
          if (token) {
            const selectedPrompt = UC_PIQ_PROMPTS.find(p => p.id === selectedPromptId);
            
            // Step 1: Save essay first if no essayId exists
            if (!effectiveEssayId) {
              console.log('📤 Saving essay before analysis (first time)...');
              const essaySaveResult = await saveOrUpdatePIQEssay(
                token,
                userId,
                selectedPromptId,
                selectedPrompt?.prompt || '',
                currentDraft,
                null // new essay
              );
              
              if (essaySaveResult.success && essaySaveResult.essayId) {
                effectiveEssayId = essaySaveResult.essayId;
                setCurrentEssayId(essaySaveResult.essayId);
                console.log('✅ Essay saved:', essaySaveResult.essayId);
              } else {
                console.warn('⚠️  Failed to save essay:', essaySaveResult.error);
              }
            }
            
            // Step 2: Save analysis result
            if (effectiveEssayId) {
              console.log('📤 Saving analysis result...');
              const analysisSaveResult = await saveAnalysisReport(token, userId, effectiveEssayId, result);
              if (analysisSaveResult.success) {
                console.log('✅ Analysis saved:', analysisSaveResult.reportId);
              } else {
                console.warn('⚠️  Failed to save analysis:', analysisSaveResult.error);
              }
              
              // Step 3: Save version to history (source='analyze')
              console.log('📤 Saving version to history...');
              const versionResult = await saveVersionToHistory(
                token,
                userId,
                effectiveEssayId,
                currentDraft,
                'analyze'
              );
              if (versionResult.success) {
                console.log(`✅ Version ${versionResult.versionNumber} saved to history`);
              } else {
                console.warn('⚠️  Failed to save version:', versionResult.error);
              }
              
              // Step 4: Save chat messages if present
              if (chatMessages.length > 0) {
                console.log('📤 Saving chat messages...');
                const chatSaveResult = await saveChatMessages(token, userId, effectiveEssayId, chatMessages);
                if (chatSaveResult.success) {
                  console.log(`✅ Chat messages saved (${chatMessages.length} messages)`);
                } else {
                  console.warn('⚠️  Failed to save chat:', chatSaveResult.error);
                }
              }
            }
            
            setHasUnsavedChanges(false);
            setLastSaveTime(new Date());
            
          } else {
            console.warn('⚠️  No Clerk token available - skipping auto-save');
          }
        } catch (error) {
          console.error('❌ Error during auto-save:', error);
        }
      }

      // Call separate narrative overview endpoint (non-blocking)
      fetchNarrativeOverview(result);
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      console.error('Full error object:', error);
      console.error('Error message:', (error as Error).message);
      console.error('Error stack:', (error as Error).stack);

      // Show alert to user - DO NOT SILENTLY FAIL
      alert(`Analysis failed! Check console for details.\n\nError: ${(error as Error).message}`);
    } finally {
      setIsAnalyzing(false);
    }
  }, [currentDraft, selectedPromptId, userId, currentEssayId, chatMessages]);

  // NO auto-analysis - wait for user to click "Analyze" button

  // ============================================================================
  // NARRATIVE OVERVIEW - Separate API Call
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
          console.log('✅ Narrative overview loaded');
        }
      } else {
        console.warn('⚠️  Narrative overview failed, using frontend fallback');
      }
    } catch (error) {
      console.error('Failed to fetch narrative overview:', error);
      // Silently fall back to frontend-generated overview
    } finally {
      setLoadingOverview(false);
    }
  }, [currentDraft, selectedPromptId]);

  // ============================================================================
  // AUTO-SAVE & RESUME SESSION
  // ============================================================================

  // Load from database on mount (NEW)
  useEffect(() => {
    async function loadFromDatabase() {
      if (!userId || !selectedPromptId) {
        console.log('⏭️  Skipping database load: no user or prompt selected');
        return;
      }

      const selectedPrompt = UC_PIQ_PROMPTS.find(p => p.id === selectedPromptId);
      if (!selectedPrompt) {
        console.warn('Invalid prompt selection on mount');
        return;
      }

      // Reset all PIQ-specific state when switching prompts
      console.log('🔄 Resetting state for new PIQ...');
      setCurrentDraft('');
      setAnalysisResult(null);
      setDimensions([]);
      setDraftVersions([]);
      setCurrentEssayId(null);
      setNeedsReanalysis(false);
      setHasUnsavedChanges(false);
      setNarrativeOverview(null);
      setChatMessages([]); // Reset chat when switching PIQs

      setIsLoadingFromDatabase(true);
      console.log(`📥 Loading essay from database for prompt: ${selectedPromptId}`);

      try {
        const token = await getToken({ template: 'supabase' });
        if (!token) {
          console.warn('⚠️  No Clerk token available - skipping database load');
          setIsLoadingFromDatabase(false);
          return;
        }

        const { success, essay, analysis, error } = await loadPIQEssay(
          token,
          userId,
          selectedPromptId,
          selectedPrompt.prompt
        );

        if (!success) {
          console.error('❌ Failed to load from database:', error);
          setIsLoadingFromDatabase(false);
          return;
        }

        if (essay) {
          console.log(`✅ Loaded essay from database: ${essay.id} (version ${essay.version})`);

          // Update state with database data
          setCurrentEssayId(essay.id);
          setCurrentDraft(essay.draft_current || essay.draft_original);

          // Create initial version from loaded essay
          const initialVersion: DraftVersion = {
            text: essay.draft_current || essay.draft_original,
            timestamp: new Date(essay.updated_at).getTime(),
            score: 73 // Will be updated if analysis is available
          };

          setDraftVersions([initialVersion]);
          setCurrentVersionIndex(0);

          // Load analysis if available
          if (analysis) {
            console.log(`✅ Loaded analysis from database: NQI ${analysis.analysis?.narrative_quality_index}`);
            setAnalysisResult(analysis);

            // Update initial version with actual score
            if (analysis.analysis?.narrative_quality_index) {
              initialVersion.score = analysis.analysis.narrative_quality_index;
              setDraftVersions([initialVersion]);
              initialScoreRef.current = analysis.analysis.narrative_quality_index;
            }

            // Transform analysis to UI dimensions (same logic as performFullAnalysis)
            if (analysis.rubricDimensionDetails && analysis.rubricDimensionDetails.length > 0) {
              const transformedDimensions: RubricDimension[] = analysis.rubricDimensionDetails.map((dim) => {
                const status = dim.final_score >= 8 ? 'good' : dim.final_score >= 6 ? 'needs_work' : 'critical';

                const issuesForDimension = (analysis.workshopItems || [])
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
            }
          }

          // Load version history from database
          console.log('📥 Loading version history...');
          const versionResult = await getVersionHistory(token, userId, essay.id);
          if (versionResult.success && versionResult.versions && versionResult.versions.length > 0) {
            // Transform database versions to UI format
            const loadedVersions: DraftVersion[] = versionResult.versions.map(v => ({
              text: v.draft_content,
              timestamp: new Date(v.created_at).getTime(),
              score: v.score, // May be undefined for 'save_draft' versions
              // Map source to our simplified types (analyze or save_draft)
              source: (v.source === 'analyze' || v.source === 'save_draft') 
                ? v.source 
                : (v.score !== undefined ? 'analyze' : 'save_draft')
            }));
            setDraftVersions(loadedVersions);
            setCurrentVersionIndex(loadedVersions.length - 1);
            console.log(`✅ Loaded ${loadedVersions.length} versions from history`);
          } else {
            // No version history - use current essay as single version
            console.log('📭 No version history found, using current essay');
          }

          // Load chat messages for this essay
          console.log('📥 Loading chat messages...');
          const chatResult = await loadChatMessages(token, userId, essay.id);
          if (chatResult.success && chatResult.messages && chatResult.messages.length > 0) {
            const loadedMessages: ChatMessage[] = chatResult.messages.map(msg => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              timestamp: msg.message_timestamp
            }));
            setChatMessages(loadedMessages);
            console.log(`✅ Loaded ${loadedMessages.length} chat messages`);
          } else {
            console.log('📭 No chat messages found for this essay');
          }

          setLastSaveTime(new Date(essay.updated_at));
          setHasUnsavedChanges(false);
          console.log('✅ Database load complete');

        } else {
          console.log('📭 No saved essay in database for this prompt');
          // Fall through to localStorage check
        }

      } catch (error) {
        console.error('❌ Unexpected error loading from database:', error);
      } finally {
        setIsLoadingFromDatabase(false);
      }
    }

    loadFromDatabase();
  }, [userId, selectedPromptId]); // Only run when user or prompt changes

  // Resume session on mount (fallback to localStorage if database has nothing)
  useEffect(() => {
    // Only check localStorage if we're not loading from database
    if (isLoadingFromDatabase) return;

    const { hasAutoSave, promptId, lastSaved } = hasRecentAutoSave();

    if (hasAutoSave && promptId && lastSaved && !currentEssayId) {
      setShowResumeSessionBanner(true);
      console.log(`📦 Found auto-save from ${formatSaveTime(lastSaved)} for prompt ${promptId}`);
    }
  }, [isLoadingFromDatabase, currentEssayId]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!selectedPromptId) return;

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
    }

    // Set up auto-save timer
    autoSaveTimerRef.current = setInterval(() => {
      if (hasUnsavedChanges && currentDraft) {
        const selectedPrompt = UC_PIQ_PROMPTS.find(p => p.id === selectedPromptId);
        if (!selectedPrompt) return;

        // Create version snapshot
        const versionSnapshot = createVersionSnapshot(
          currentDraft,
          currentScore,
          analysisResult || undefined
        );

        // Build cache object
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
          ].slice(-10), // Keep last 10 versions
          autoSaveEnabled: true
        };

        saveToLocalStorage(cache);
        setLastSaveTime(new Date());
        setHasUnsavedChanges(false);
        console.log('✅ Auto-saved to localStorage');
      }
    }, 30000); // 30 seconds

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [hasUnsavedChanges, currentDraft, selectedPromptId, currentScore, analysisResult, draftVersions]);

  // Sync selectedPromptId when URL changes
  useEffect(() => {
    const newPromptId = getPromptIdFromUrl();
    if (newPromptId !== selectedPromptId) {
      setSelectedPromptId(newPromptId);
      setNeedsReanalysis(true);
    }
  }, [piqNumber]);


  // ============================================================================
  // HANDLERS (Same as ExtracurricularWorkshopFinal)
  // ============================================================================

  const handleDraftChange = useCallback((newDraft: string) => {
    setCurrentDraft(newDraft);
    setNeedsReanalysis(true);
    setHasUnsavedChanges(true);
  }, []);

  const handleSave = useCallback(async () => {
    console.log('💾 handleSave called');

    // 1. Update local state (keep existing logic for UI responsiveness)
    const newVersion: DraftVersion = {
      text: currentDraft,
      timestamp: Date.now(),
      score: analysisResult?.analysis?.narrative_quality_index || 73
    };
    const newVersions = draftVersions.slice(0, currentVersionIndex + 1);
    newVersions.push(newVersion);
    setDraftVersions(newVersions);
    setCurrentVersionIndex(newVersions.length - 1);

    // 2. Save to database (NEW)
    if (!selectedPromptId || !userId) {
      console.warn('Cannot save to database: missing prompt or userId');
      if (!userId) {
        alert('Please sign in to save your work to the cloud');
      }
      // Still allow local save
      return;
    }

    const selectedPrompt = UC_PIQ_PROMPTS.find(p => p.id === selectedPromptId);
    if (!selectedPrompt) {
      console.warn('Cannot save: invalid prompt selection');
      return;
    }

    setSaveStatus('saving');
    setLastSaveError(null);

    try {
      // Get Clerk token
      const token = await getToken({ template: 'supabase' });
      if (!token) {
        console.error('❌ No Clerk token available');
        setSaveStatus('error');
        setLastSaveError('Authentication token not available. Please sign in again.');
        return;
      }

      // Save essay to database
      console.log('📤 Saving essay to database...');
      const { success, essayId, error, isNew } = await saveOrUpdatePIQEssay(
        token,
        userId,
        selectedPromptId,
        selectedPrompt.prompt,
        currentDraft,
        draftVersions[0]?.text // Use first version as original
      );

      if (!success) {
        console.error('❌ Failed to save essay:', error);
        setSaveStatus('error');
        setLastSaveError(error || 'Failed to save essay');
        // Don't block the user - they can try again
        return;
      }

      // Update current essay ID
      if (essayId) {
        setCurrentEssayId(essayId);
      }

      console.log(`✅ Essay ${isNew ? 'created' : 'updated'}: ${essayId}`);

      // Save analysis result if present
      if (analysisResult && essayId) {
        console.log('📤 Saving analysis result to database...');
        const analysisResult2 = await saveAnalysisReport(token, userId, essayId, analysisResult);

        if (!analysisResult2.success) {
          console.warn('⚠️  Failed to save analysis result:', analysisResult2.error);
          // Non-blocking - analysis can be regenerated
        } else {
          console.log('✅ Analysis result saved:', analysisResult2.reportId);
        }
      }

      // Save chat messages if present
      if (chatMessages.length > 0 && essayId) {
        console.log('📤 Saving chat messages to database...');
        const chatSaveResult = await saveChatMessages(token, userId, essayId, chatMessages);

        if (!chatSaveResult.success) {
          console.warn('⚠️  Failed to save chat messages:', chatSaveResult.error);
          // Non-blocking - chat can be regenerated
        } else {
          console.log(`✅ Chat messages saved (${chatMessages.length} messages)`);
        }
      }

      // Save version to history (source='save_draft' - no analysis)
      if (essayId) {
        console.log('📤 Saving version to history (draft only)...');
        const versionResult = await saveVersionToHistory(
          token,
          userId,
          essayId,
          currentDraft,
          'save_draft'
        );
        if (versionResult.success) {
          console.log(`✅ Version ${versionResult.versionNumber} saved to history (not reanalyzed)`);
        } else {
          console.warn('⚠️  Failed to save version:', versionResult.error);
        }
      }

      setSaveStatus('saved');
      setLastSaveTime(new Date());
      setHasUnsavedChanges(false);

      console.log('✅ Save complete (draft only - no analysis triggered)');

      // NOTE: Save Draft does NOT trigger re-analysis
      // User must click "Analyze" button to run analysis

    } catch (error) {
      console.error('❌ Unexpected error during save:', error);
      setSaveStatus('error');
      setLastSaveError((error as Error).message);
    }
  }, [
    currentDraft,
    draftVersions,
    currentVersionIndex,
    selectedPromptId,
    userId,
    analysisResult,
    chatMessages
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
    performFullAnalysis(); // Use REAL backend analysis
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
  const scoreDelta = currentScore - initialScore;

  // Filter dimensions by status for hover tooltips
  const goodDimensions = dimensions.filter(d => d.status === 'good');
  const needsWorkDimensions = dimensions.filter(d => d.status === 'needs_work');
  const criticalDimensions = dimensions.filter(d => d.status === 'critical');

  // Scroll to specific dimension in rubric
  const scrollToDimension = (dimensionId: string) => {
    setExpandedDimensionId(dimensionId);
    // Wait for expansion to render/animate slightly
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

  // State for expandable dimension sections
  const [showAllStrong, setShowAllStrong] = React.useState(false);
  const [showAllNeedsWork, setShowAllNeedsWork] = React.useState(false);

  // Generate narrative-focused, empowering overview
  const getDetailedOverview = (dims: RubricDimension[], score: number): string => {
    // Use API-generated overview if available
    if (narrativeOverview) {
      return narrativeOverview;
    }

    // Loading state
    if (loadingOverview && analysisResult) {
      return 'Generating personalized narrative overview...';
    }

    // Fallback to frontend-generated overview
    try {
      if (!dims || !Array.isArray(dims) || dims.length === 0) {
        return 'Analysis in progress...';
      }

      const critical = dims.filter(d => d && d.status === 'critical');
      const needsWork = dims.filter(d => d && d.status === 'needs_work');
      const good = dims.filter(d => d && d.status === 'good').sort((a, b) => (b?.score || 0) - (a?.score || 0));
      const allIssues = dims.flatMap(d => d.issues);

    let overview = '';

    // Lead with understanding their narrative's core strength/intent
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

    // What the essay is trying to convey (narrative intent)
    const hasTransformation = allIssues.some(i => i.title.toLowerCase().includes('transform') || i.title.toLowerCase().includes('growth'));
    const hasEmotionalDepth = allIssues.some(i => i.title.toLowerCase().includes('emotion') || i.title.toLowerCase().includes('vulnerability'));
    const hasSpecificity = allIssues.some(i => i.title.toLowerCase().includes('specific') || i.title.toLowerCase().includes('detail'));

    if (score >= 70) {
      overview += `What you're trying to show—your growth through experience—comes through clearly. `;
    } else if (score >= 55) {
      overview += `The core of what you're trying to convey is there, but it needs sharper focus and more vivid storytelling. `;
    } else {
      overview += `You have the raw material for a compelling narrative, but right now the story you're trying to tell isn't fully realized on the page. `;
    }

    // Pattern detection - what would make it more compelling
    const patterns = [];
    if (hasSpecificity) patterns.push('specific details');
    if (hasEmotionalDepth) patterns.push('emotional authenticity');
    if (hasTransformation) patterns.push('transformation arc');

    if (patterns.length > 0) {
      overview += `To make this truly compelling, focus on ${patterns.length === 1 ? patterns[0] : patterns.slice(0, -1).join(', ') + ' and ' + patterns[patterns.length - 1]}. `;
    }

    // Overarching improvements - narrative structure or depth
    if (critical.length > 0 || needsWork.length >= 3) {
      // Multiple structural issues
      const structuralIssues = allIssues.filter(i =>
        i.title.toLowerCase().includes('arc') ||
        i.title.toLowerCase().includes('structure') ||
        i.title.toLowerCase().includes('hook') ||
        i.title.toLowerCase().includes('climax')
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
      // Good foundation, needs polish
      overview += `You're close. The improvements needed are targeted and achievable—mostly about elevating specific passages from good to great. `;
    } else {
      // Strong essay
      overview += `You've crafted a strong narrative that accomplishes what you set out to do. `;
    }

    // Encouraging close with concrete next step
    if (allIssues.length > 0) {
      const firstIssue = allIssues[0];
      if (firstIssue) {
        overview += `Start with this: ${firstIssue.title.toLowerCase()}. Each workshop item below includes specific revisions that maintain your authentic voice while making your narrative more powerful.`;
      } else {
        overview += `The detailed analysis below shows you exactly how to elevate your narrative while keeping your authentic voice intact.`;
      }
    } else {
      overview += `Continue refining the nuances—every word should earn its place in your story.`;
    }

    return overview;
    } catch (error) {
      console.error('Error in getDetailedOverview:', error);
      return 'Analysis complete. View detailed breakdown below.';
    }
  };

  // Get actionable insights from actual dimension data
  const getActionableInsights = (dimensions: RubricDimension[], score: number): string => {
    // Find strongest dimension
    const strongest = dimensions
      .filter(d => d.status === 'good')
      .sort((a, b) => b.score - a.score)[0];
    
    // Find weakest non-good dimension
    const weakest = [...criticalDimensions, ...needsWorkDimensions]
      .sort((a, b) => a.score - b.score)[0];
    
    // Get most common issue type across all dimensions
    const allIssues = dimensions.flatMap(d => d.issues);
    const issueTypes = allIssues.map(i => i.dimensionId);
    const mostCommonIssue = issueTypes.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topIssueType = Object.entries(mostCommonIssue)
      .sort((a, b) => (b[1] as number) - (a[1] as number))[0]?.[0];
    
    let insight = '';
    
    // Strength callout
    if (strongest) {
      insight += `Your ${strongest.name.toLowerCase()} (${strongest.score}/${strongest.maxScore}) is a clear strength. `;
    }
    
    // Weakness callout with specific guidance
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
    
    // Pattern detection
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
      {/* Main Navigation with credits */}
      <Navigation />

      {/* Gradient background */}
      <div className="hero-gradient hero-gradient-fade absolute top-0 left-0 right-0 h-[120vh] pointer-events-none -z-10" />

      {/* Sticky PIQ header */}
      <div className="sticky top-16 z-40 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-b shadow-sm">
        {/* Main header row */}
        <div className="mx-auto px-4 py-3 flex items-center justify-center gap-4">
          {/* Center: PIQ Carousel Navigation - static positioning */}
          <div className="flex-1 flex justify-center">
            <PIQCarouselNav
              currentPromptId={selectedPromptId || 'piq1'}
              onPromptChange={setSelectedPromptId}
            />
          </div>

          {/* Right: Save Status */}
          <div className="flex items-center gap-2 min-w-[120px] justify-end absolute right-4">
            {saveStatus === 'saving' && (
              <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </div>
            )}
            {saveStatus === 'saved' && lastSaveTime && (
              <div className="flex flex-col items-end gap-0.5">
                <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span>Saved</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatSaveTime(lastSaveTime.getTime())}
                </span>
              </div>
            )}
            {saveStatus === 'error' && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 cursor-help">
                      <XCircle className="w-4 h-4" />
                      <span>Error</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">{lastSaveError || 'Failed to save'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {!isAuthenticated && (
              <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                <span>Sign in to save</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 mx-auto px-4 py-4 space-y-6">
        {/* Hero section */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Narrative Quality Index Card - Professional Data-Dense Design */}
            <Card className={`flex-1 p-5 ${!isAnalyzing && !hasAnalysis ? 'hidden' : ''}`}>
              {isAnalyzing ? (
                /* ENHANCED LOADING STATE */
                <div className="flex flex-col items-center justify-center py-12 space-y-6 text-center">
                  <div className="relative">
                    {/* Gradient Spinner */}
                    <div className="w-16 h-16 rounded-full border-4 border-transparent border-t-blue-500 border-r-purple-500 border-b-pink-500 animate-spin" />
                    <Target className="w-8 h-8 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold">Analyzing Your PIQ Essay</h3>
                    <p className="text-muted-foreground">
                      Evaluating across 11 narrative dimensions...
                    </p>
                  </div>

                  {/* Spinning Score Preview */}
                  <div className="flex flex-col items-center gap-2 py-2">
                    <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Calculating Score</span>
                    <div className="flex items-baseline gap-1">
                      <RandomizingScore score={0} isAnalyzing={true} className="text-5xl font-extrabold text-primary" />
                      <span className="text-xl text-muted-foreground">/100</span>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground animate-pulse bg-muted/50 px-4 py-2 rounded-full">
                    This will finish in 2-3 minutes...
                  </div>
                </div>
              ) : hasAnalysis ? (
              /* Analysis Results */
              <>
              {/* Header with Score & Actions */}
              <div className="flex items-start justify-between mb-4 pb-4">
                {/* Left: Title + Icon */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary via-primary/80 to-accent flex items-center justify-center shadow-lg">
                    <PenTool className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <div>
                    <GradientText
                      className="text-2xl font-extrabold uppercase tracking-wide"
                      colors={["#a855f7", "#8b5cf6", "#c084fc", "#a78bfa", "#a855f7"]}
                    >
                      Narrative Quality Index
                    </GradientText>
                    <p className="text-sm text-muted-foreground font-medium">{dimensions.length}-dimension analysis</p>
                  </div>
                </div>
                
                {/* Right: Score + Actions */}
                <div className="text-right">
                  <div className="flex items-baseline gap-2 justify-end mb-2">
                    {scoreColorConfig.gradient ? (
                      <div className="relative">
                         <RandomizingScore 
                            score={currentScore} 
                            isAnalyzing={isAnalyzing} 
                            className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[hsl(250,70%,60%)] via-[hsl(185,80%,55%)] to-[hsl(280,90%,65%)]"
                         />
                      </div>
                    ) : (
                      <RandomizingScore 
                         score={currentScore} 
                         isAnalyzing={isAnalyzing} 
                         className={`text-4xl font-extrabold ${scoreColorConfig.className}`} 
                      />
                    )}
                    <span className="text-xl font-semibold text-muted-foreground">/100</span>
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <Badge className={`${nqiConfig.bg} ${nqiConfig.color} border ${nqiConfig.border} px-2 py-0.5 text-xs`}>
                      {nqiConfig.label}
                    </Badge>
                    {scoreDelta !== 0 && (
                      <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded ${
                        scoreDelta > 0 ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {scoreDelta > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {scoreDelta > 0 ? '+' : ''}{scoreDelta}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4 pb-4 border-b">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground font-medium">Issues Resolved</span>
                  <span className="font-semibold">{fixedIssues}/{totalIssues} ({Math.round(progressPercent)}%)</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>

              {/* Compact Category Quick Links */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-medium text-muted-foreground">Quick navigate:</span>
                
                {/* Critical Badge */}
                <TooltipProvider delayDuration={750}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => {
                          if (criticalDimensions.length > 0) {
                            scrollToDimension(criticalDimensions[0].id);
                          }
                        }}
                        disabled={criticalDimensions.length === 0}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                          criticalDimensions.length > 0
                            ? 'bg-red-100 text-red-700 border border-red-300 hover:bg-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/60'
                            : 'bg-gray-100 text-gray-400 border border-gray-200 dark:bg-gray-900 dark:text-gray-600 dark:border-gray-800 cursor-not-allowed'
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Critical ({criticalDimensions.length})
                      </button>
                    </TooltipTrigger>
                    {criticalDimensions.length > 0 && (
                      <TooltipContent side="bottom" className="max-w-xs">
                        <div className="space-y-1">
                          <p className="font-semibold text-xs mb-2">Critical Dimensions:</p>
                          {criticalDimensions.map((dim) => (
                            <button
                              key={dim.id}
                              onClick={() => scrollToDimension(dim.id)}
                              className="w-full text-left text-xs hover:bg-muted/50 rounded p-1 transition-colors group"
                            >
                              <span className="font-medium group-hover:underline underline-offset-2 decoration-red-300 dark:decoration-red-700">• {dim.name}</span> ({dim.score}/{dim.maxScore})
                              {dim.issues.length > 0 && (
                                <p className="text-muted-foreground ml-3 mt-0.5">{dim.issues[0].title}</p>
                              )}
                            </button>
                          ))}
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>

                {/* Needs Work Badge */}
                <TooltipProvider delayDuration={750}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => {
                          if (needsWorkDimensions.length > 0) {
                            scrollToDimension(needsWorkDimensions[0].id);
                          }
                        }}
                        disabled={needsWorkDimensions.length === 0}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                          needsWorkDimensions.length > 0
                            ? 'bg-amber-100 text-amber-700 border border-amber-300 hover:bg-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-950/60'
                            : 'bg-gray-100 text-gray-400 border border-gray-200 dark:bg-gray-900 dark:text-gray-600 dark:border-gray-800 cursor-not-allowed'
                        }`}
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Needs Work ({needsWorkDimensions.length})
                      </button>
                    </TooltipTrigger>
                    {needsWorkDimensions.length > 0 && (
                      <TooltipContent side="bottom" className="max-w-xs">
                        <div className="space-y-1">
                          <p className="font-semibold text-xs mb-2">Needs Work Dimensions:</p>
                          {needsWorkDimensions.map((dim) => (
                            <button
                              key={dim.id}
                              onClick={() => scrollToDimension(dim.id)}
                              className="w-full text-left text-xs hover:bg-muted/50 rounded p-1 transition-colors group"
                            >
                              <span className="font-medium group-hover:underline underline-offset-2 decoration-amber-300 dark:decoration-amber-700">• {dim.name}</span> ({dim.score}/{dim.maxScore})
                              {dim.issues.length > 0 && (
                                <p className="text-muted-foreground ml-3 mt-0.5">{dim.issues[0].title}</p>
                              )}
                            </button>
                          ))}
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>

                {/* Strong Badge */}
                <TooltipProvider delayDuration={750}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => {
                          if (goodDimensions.length > 0) {
                            scrollToDimension(goodDimensions[0].id);
                          }
                        }}
                        disabled={goodDimensions.length === 0}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                          goodDimensions.length > 0
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-300 hover:bg-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-950/60'
                            : 'bg-gray-100 text-gray-400 border border-gray-200 dark:bg-gray-900 dark:text-gray-600 dark:border-gray-800 cursor-not-allowed'
                        }`}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Strong ({goodDimensions.length})
                      </button>
                    </TooltipTrigger>
                    {goodDimensions.length > 0 && (
                      <TooltipContent side="bottom" className="max-w-xs">
                        <div className="space-y-1">
                          <p className="font-semibold text-xs mb-2">Strong Dimensions:</p>
                          {goodDimensions.slice(0, 5).map((dim) => (
                            <button
                              key={dim.id}
                              onClick={() => scrollToDimension(dim.id)}
                              className="w-full text-left text-xs hover:bg-muted/50 rounded p-1 transition-colors group"
                            >
                              <span className="font-medium group-hover:underline underline-offset-2 decoration-emerald-300 dark:decoration-emerald-700">• {dim.name}</span> ({dim.score}/{dim.maxScore})
                            </button>
                          ))}
                          {goodDimensions.length > 5 && (
                            <p className="text-xs text-muted-foreground italic">+{goodDimensions.length - 5} more...</p>
                          )}
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Essay Overview Section */}
              <div className="mt-3 pt-3">
                <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Info className="w-4 h-4 text-primary/60" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-primary/70">Essay Overview</h3>
                      <p className="text-xs text-muted-foreground">Analysis summary</p>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {getDetailedOverview(dimensions, currentScore)}
                  </p>
                </div>
              </div>
              </>
              ) : null}
            </Card>
          </div>
        </div>

        {/* Main workshop area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column: Editor + Rubric */}
          <div className="space-y-6">
            {/* Editor */}
            <Card className="p-6 bg-gradient-to-br from-background/95 via-background/90 to-pink-50/80 dark:from-background/95 dark:via-background/90 dark:to-pink-950/20 backdrop-blur-xl border shadow-lg">
            <EditorView
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
                onShowHistory={() => setShowVersionHistory(true)}
                hasUnsavedChanges={hasUnsavedChanges}
                analysisCreditCost={CREDIT_COSTS.ESSAY_ANALYSIS}
              />
            </Card>

            {/* Rubric dimensions */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 dark:bg-purple-400/10 ring-1 ring-purple-500/20">
                  <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <GradientText
                  className="text-2xl font-bold"
                  colors={["#9333ea", "#a855f7", "#c084fc", "#e9d5ff", "#9333ea"]}
                  animationSpeed={8}
                >
                  11-Dimension Analysis
                </GradientText>
              </div>

              <div className="space-y-4">
                {dimensions && Array.isArray(dimensions) && dimensions.length > 0 ? (
                  dimensions.map((dimension) => dimension ? (
                    <div id={`dimension-${dimension.id}`} key={dimension.id}>
                      <RubricDimensionCard
                        dimension={dimension}
                        isExpanded={expandedDimensionId === dimension.id}
                        onToggleExpand={() => toggleDimensionExpand(dimension.id)}
                        onToggleIssue={handleToggleIssue}
                        onApplySuggestion={handleApplySuggestion}
                        onNextSuggestion={handleNextSuggestion}
                        onPrevSuggestion={handlePrevSuggestion}
                      />
                    </div>
                  ) : null)
                ) : (
                  <Card className="p-8 border-dashed border-2 flex flex-col items-center justify-center text-center bg-muted/10">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Target className="w-6 h-6 text-primary/60" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Analysis Rubric</h3>
                    <p className="text-muted-foreground text-sm max-w-[250px] mx-auto">
                      {isLoadingFromDatabase 
                        ? 'Loading your saved essay...'
                        : 'Click "Analyze" in the editor to see your 11-dimension analysis here.'
                      }
                    </p>
                  </Card>
                )}
              </div>
            </div>
          </div>

          {/* Right column: PIQ Prompt Selector + Chat */}
          <div className="space-y-6">
            {/* Chat */}
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

      {/* Version history modal */}
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

      {/* Insufficient Credits Modal */}
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
