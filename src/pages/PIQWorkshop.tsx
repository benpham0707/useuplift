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
import { useNavigate } from 'react-router-dom';
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

// PIQ Prompt Selector
import { PIQPromptSelector, UC_PIQ_PROMPTS } from '@/components/portfolio/piq/workshop/PIQPromptSelector';
import { PIQCarouselNav } from '@/components/portfolio/piq/workshop/PIQCarouselNav';

// Backend Integration
import { analyzePIQEntry } from '@/services/piqWorkshopAnalysisService';
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
  getCurrentEssayId
} from '@/services/piqWorkshop/piqDatabaseService';

// Authentication
import { useAuth } from '@clerk/clerk-react';
import { useClerkUserId, useIsAuthenticated } from '@/services/auth/clerkSupabaseAdapter';

// ============================================================================
// MOCK DATA - Hardcoded for demonstration
// ============================================================================

// HARDCODED DATA: Sample PIQ response
const MOCK_PIQ = {
  id: "piq-1",
  piqNumber: 1,
  prompt: "Describe an example of your leadership experience in which you have positively influenced others, helped resolve disputes or contributed to group efforts over time.",
  description: "During my junior year, I founded the Environmental Action Club at my school with just three members. Initially, our beach cleanups attracted only a handful of students, but I knew we needed to think bigger. I spent weeks researching plastic pollution data and crafting a proposal for the administration. The breakthrough came when I presented to the school board, armed with statistics showing our campus generated over 2,000 plastic bottles weekly. My voice shook, but I pushed through. The board approved funding for water refill stations across all buildings. Within one semester, we reduced single-use plastic waste by 47% and grew our club to 45 active members. More importantly, I learned that leadership isn't about having all the answers—it's about channeling collective passion into measurable change that outlasts your involvement.",
  wordCount: 142,
  category: "leadership"
};

// HARDCODED DATA: Mock analysis with realistic scores (73/100 NQI)
const MOCK_DIMENSIONS: RubricDimension[] = [
  {
    id: 'voice_integrity',
    name: 'Voice Integrity',
    score: 7.5,
    maxScore: 10,
    status: 'good',
    weight: 15,
    overview: 'Authentic voice with genuine nervousness shown. Good use of first-person narrative. Could deepen emotional vulnerability.',
    issues: [
      {
        id: 'issue-voice-1',
        dimensionId: 'voice_integrity',
        title: 'Limited Vulnerability - Missing Emotional Depth',
        excerpt: 'My voice shook, but I pushed through.',
        analysis: 'You mention nervousness but don\'t let readers feel it. Elite essays show physical symptoms and internal conflict.',
        impact: 'Costing you 5-8 points in Voice Integrity. Officers read thousands of essays—physical details make yours memorable.',
        suggestions: [
          {
            text: 'My palms left wet marks on the presentation slides. I could feel my pulse in my throat as I faced the board members, their skeptical expressions making my carefully rehearsed pitch feel suddenly hollow.',
            rationale: 'Notice the specific physical details: wet palms, pulse in throat. Creates tension readers can feel.',
            type: 'replace'
          },
          {
            text: 'When I stood to present, my hands trembled so badly I had to grip the podium. The board\'s silence felt like judgment, and every statistic I\'d memorized scattered like leaves in my mind.',
            rationale: 'Shows physical manifestation of anxiety AND its mental impact. Vulnerability signals authenticity.',
            type: 'replace'
          }
        ],
        status: 'not_fixed',
        currentSuggestionIndex: 0,
        expanded: false
      }
    ]
  },
  {
    id: 'specificity_evidence',
    name: 'Specificity & Evidence',
    score: 8.2,
    maxScore: 10,
    status: 'good',
    weight: 20,
    overview: 'Strong quantified impact with specific metrics: 2,000 bottles, 47% reduction, 45 members. Excellent use of concrete data.',
    issues: []
  },
  {
    id: 'transformative_impact',
    name: 'Transformative Impact',
    score: 6.5,
    maxScore: 10,
    status: 'needs_work',
    weight: 15,
    overview: 'Shows growth but transformation is stated rather than shown. Need before/after contrast.',
    issues: [
      {
        id: 'issue-transform-1',
        dimensionId: 'transformative_impact',
        title: 'Transformation Stated, Not Shown',
        excerpt: 'I learned that leadership isn\'t about having all the answers',
        analysis: 'This is a cliché conclusion. Elite essays show transformation through specific before/after contrasts with concrete examples.',
        impact: 'Costing you 6-10 points in Transformative Impact—the highest-weighted category.',
        suggestions: [
          {
            text: 'Before: I used to plan every club meeting down to the minute, cutting off members when they diverged from my agenda. After: Now I listen when Mia suggests a campus art installation, even though it wasn\'t in my original plan—and it becomes our most successful campaign.',
            rationale: 'Specific before behavior with concrete action. Clear after behavior showing different approach. Outcome validates the change.',
            type: 'replace'
          },
          {
            text: 'My first meeting agenda had every second scheduled. When Emma raised her hand to suggest partnering with local businesses, I dismissed it—"That\'s not what we\'re here for." Six months later, I found myself cold-calling restaurants for donations, using Emma\'s exact idea. The difference? Now I asked: "What else should I consider?"',
            rationale: 'Shows specific controlling behavior, admits mistake, demonstrates changed approach through action and dialogue.',
            type: 'replace'
          }
        ],
        status: 'not_fixed',
        currentSuggestionIndex: 0,
        expanded: false
      }
    ]
  },
  {
    id: 'role_clarity',
    name: 'Role Clarity & Ownership',
    score: 7.8,
    maxScore: 10,
    status: 'good',
    weight: 10,
    overview: 'Clear founder/president role. Good ownership of specific actions: research, proposal, presentation.',
    issues: []
  },
  {
    id: 'narrative_arc',
    name: 'Narrative Arc & Stakes',
    score: 6.0,
    maxScore: 10,
    status: 'needs_work',
    weight: 12,
    overview: 'Basic chronology present but stakes could be higher. Missing turning point drama.',
    issues: [
      {
        id: 'issue-arc-1',
        dimensionId: 'narrative_arc',
        title: 'Missing Dialogue & Scene Details',
        excerpt: 'The breakthrough came when I presented to the school board',
        analysis: 'You tell us about the presentation but don\'t show it. Elite essays use dialogue and scene details to create dramatic tension.',
        impact: 'Missing opportunity to show leadership under pressure.',
        suggestions: [
          {
            text: '"These numbers represent real environmental harm," I said, my voice steadier now as I pointed to the chart. Board member Johnson leaned forward: "And you\'re confident students will actually use these stations?" I met his eyes. "Sir, forty-five students signed up after our last cleanup. They\'re waiting for us to make this easy."',
            rationale: 'Dialogue makes the scene real. Shows you handling objections. Demonstrates confidence growth.',
            type: 'insert_after'
          }
        ],
        status: 'not_fixed',
        currentSuggestionIndex: 0,
        expanded: false
      }
    ]
  },
  {
    id: 'initiative_leadership',
    name: 'Initiative & Leadership',
    score: 8.0,
    maxScore: 10,
    status: 'good',
    weight: 12,
    overview: 'Strong initiative shown: founding club, research, proposal, presentation. Clear leader actions.',
    issues: []
  },
  {
    id: 'community_collaboration',
    name: 'Community & Collaboration',
    score: 7.2,
    maxScore: 10,
    status: 'good',
    weight: 8,
    overview: 'Shows group growth (3 to 45 members) but individual members remain unnamed. Could add more human connection.',
    issues: []
  },
  {
    id: 'reflection_meaning',
    name: 'Reflection & Meaning',
    score: 6.8,
    maxScore: 10,
    status: 'needs_work',
    weight: 10,
    overview: 'Generic reflection about leadership. Needs personal insight rooted in specific moments.',
    issues: [
      {
        id: 'issue-reflect-1',
        dimensionId: 'reflection_meaning',
        title: 'Generic Reflection - Lacks Personal Insight',
        excerpt: 'leadership isn\'t about having all the answers—it\'s about channeling collective passion',
        analysis: 'This could apply to anyone. Elite essays connect insight to specific moments that reveal personal values.',
        impact: 'Reflection is 10% of your score. Generic insights don\'t distinguish you.',
        suggestions: [
          {
            text: 'Standing in the cafeteria three months later, I watched students line up at the refill station we fought for, and realized: the 47% reduction mattered less than seeing Sarah—a freshman who joined after our first beach cleanup—now leading her own recycling initiative. Real leadership means building systems that don\'t need you.',
            rationale: 'Ties insight to specific image. Names a person. Reveals value: sustainability of impact over personal glory.',
            type: 'replace'
          }
        ],
        status: 'not_fixed',
        currentSuggestionIndex: 0,
        expanded: false
      }
    ]
  },
  {
    id: 'craft_language',
    name: 'Craft & Language Quality',
    score: 7.5,
    maxScore: 10,
    status: 'good',
    weight: 8,
    overview: 'Clear writing with good flow. Effective use of statistics. Some sentences could be more dynamic.',
    issues: []
  },
  {
    id: 'fit_trajectory',
    name: 'Fit & Trajectory',
    score: 7.0,
    maxScore: 10,
    status: 'good',
    weight: 8,
    overview: 'Shows environmental interest and leadership potential. Could connect more explicitly to future goals.',
    issues: []
  },
  {
    id: 'time_investment',
    name: 'Time Investment',
    score: 8.5,
    maxScore: 10,
    status: 'excellent',
    weight: 7,
    overview: 'Clear sustained involvement: junior year, research period, one semester of results. Good longitudinal commitment.',
    issues: []
  }
];

interface DraftVersion {
  text: string;
  timestamp: number;
  score: number;
}

export default function PIQWorkshop() {
  const navigate = useNavigate();

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

  const [currentDraft, setCurrentDraft] = useState(MOCK_PIQ.description);
  const [draftVersions, setDraftVersions] = useState<DraftVersion[]>([
    { text: MOCK_PIQ.description, timestamp: Date.now(), score: 73 }
  ]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0);
  const [dimensions, setDimensions] = useState<RubricDimension[]>(MOCK_DIMENSIONS);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [needsReanalysis, setNeedsReanalysis] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [expandedDimensionId, setExpandedDimensionId] = useState<string | null>(null);
  const initialScoreRef = useRef<number>(73);

  // NEW: Full Backend Integration State
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>('piq1'); // Default to PIQ #1
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [narrativeOverview, setNarrativeOverview] = useState<string | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(false);

  // Caching & Save State
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll-based carousel positioning
  const [scrollY, setScrollY] = useState(0);
  const SCROLL_THRESHOLD = 200; // pixels to start transition
  const MAX_OFFSET = 40; // max horizontal shift in pixels
  const scrollProgress = Math.min(scrollY / SCROLL_THRESHOLD, 1);
  const scrollOffset = -MAX_OFFSET * scrollProgress; // negative to shift left

  // Extract active issues from dimensions
  const activeIssues = dimensions.flatMap(d => d.issues).filter(i => i.status !== 'fixed');

  // ============================================================================
  // COMPUTED VALUES (must be before useEffect hooks)
  // ============================================================================

  const currentScore = analysisResult?.analysis?.narrative_quality_index || 73;
  const initialScore = initialScoreRef.current;

  // ============================================================================
  // REAL BACKEND ANALYSIS - Full Surgical Workshop
  // ============================================================================

  const performFullAnalysis = useCallback(async () => {
    console.log('🔍 performFullAnalysis called');
    console.log('   Current draft length:', currentDraft.length);
    console.log('   Selected prompt:', selectedPromptId);
    if (!selectedPromptId) {
      console.warn('No prompt selected - cannot analyze');
      return;
    }

    setIsAnalyzing(true);
    try {
      const selectedPrompt = UC_PIQ_PROMPTS.find(p => p.id === selectedPromptId);
      if (!selectedPrompt) {
        throw new Error('Invalid prompt selection');
      }

      // Check if analysis is cached for this exact text
      const cachedResult = getCachedAnalysisResult(currentDraft, selectedPromptId);

      let result: AnalysisResult;

      if (cachedResult) {
        console.log('✅ Using cached analysis result - skipping API call');
        result = cachedResult;
      } else {
        console.log('🔄 No cache found - calling backend analysis (100+ seconds)');
        // Call FULL surgical workshop backend (100+ seconds)
        result = await analyzePIQEntry(
          currentDraft,
          selectedPrompt.title,
          selectedPrompt.prompt,
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
              impact: `Severity: ${item.severity}`,
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
      setHasUnsavedChanges(false);
      console.log('✅ Analysis complete - UI updated');

      // AUTO-SAVE analysis result to database (NEW)
      if (userId && currentEssayId) {
        console.log('📤 Auto-saving analysis result to database...');
        try {
          const token = await getToken({ template: 'supabase' });
          if (token) {
            const saveResult = await saveAnalysisReport(token, userId, currentEssayId, result);
            if (saveResult.success) {
              console.log('✅ Analysis auto-saved to database:', saveResult.reportId);
            } else {
              console.warn('⚠️  Failed to auto-save analysis:', saveResult.error);
              // Non-blocking - don't interrupt user flow
            }
          } else {
            console.warn('⚠️  No Clerk token available - skipping analysis auto-save');
          }
        } catch (error) {
          console.error('❌ Error getting Clerk token:', error);
        }
      } else if (userId) {
        console.log('📝 Essay not saved yet - skipping analysis auto-save');
        // Analysis will be saved next time user saves the essay
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
  }, [currentDraft, selectedPromptId, userId, currentEssayId]);

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
                  impact: `Severity: ${item.severity}`,
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

  // Scroll tracking for carousel positioning
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Manual save to cloud
  const handleSaveToCloud = useCallback(async () => {
    if (!selectedPromptId || !currentDraft) {
      console.warn('Cannot save to cloud: missing prompt or draft');
      return;
    }

    const selectedPrompt = UC_PIQ_PROMPTS.find(p => p.id === selectedPromptId);
    if (!selectedPrompt) return;

    // Create version snapshot
    const versionSnapshot = createVersionSnapshot(
      currentDraft,
      currentScore,
      analysisResult || undefined
    );

    // Save to cloud (TODO: Re-implement cloud save functionality)
    console.log('Version snapshot created:', versionSnapshot);
    alert('Version saved locally!');
  }, [selectedPromptId, currentDraft, currentScore, analysisResult]);

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

      setSaveStatus('saved');
      setLastSaveTime(new Date());
      setHasUnsavedChanges(false);

      console.log('✅ Save complete');

    } catch (error) {
      console.error('❌ Unexpected error during save:', error);
      setSaveStatus('error');
      setLastSaveError((error as Error).message);
    }

    // 3. Re-analyze if needed (but don't trigger auto-save during analysis)
    if (needsReanalysis) {
      console.log('🔄 Triggering re-analysis after save...');
      await performFullAnalysis();
    }
  }, [
    currentDraft,
    draftVersions,
    currentVersionIndex,
    selectedPromptId,
    userId,
    analysisResult,
    needsReanalysis,
    performFullAnalysis
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
    const element = document.getElementById(`dimension-${dimensionId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      element.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
      }, 2000);
    }
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
      {/* Gradient background */}
      <div className="hero-gradient hero-gradient-fade absolute top-0 left-0 right-0 h-[120vh] pointer-events-none -z-10" />

      {/* Sticky header */}
      <div className="sticky top-0 z-50 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-b shadow-sm">
        <div className="mx-auto px-4 py-4 flex items-center justify-between gap-4 relative">
          {/* Left: Back button */}
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          {/* Center: PIQ Carousel Navigation - with dynamic scroll-based positioning */}
          <div 
            className="absolute left-1/2 transition-transform duration-300 ease-out"
            style={{
              transform: `translateX(calc(-50% + ${scrollOffset}px))`
            }}
          >
            <PIQCarouselNav
              currentPromptId={selectedPromptId}
              onPromptChange={setSelectedPromptId}
            />
          </div>

          {/* Right: Save Status */}
          <div className="flex items-center gap-2 min-w-[120px] justify-end ml-auto">
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
      <div className="relative z-10 mx-auto px-4 py-12 space-y-6">
        {/* Hero section */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Narrative Quality Index Card - Professional Data-Dense Design */}
            <Card className="flex-1 p-5">
              
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
                      <GradientText className="text-4xl font-extrabold" colors={scoreColorConfig.colors} textOnly>
                        {currentScore}
                      </GradientText>
                    ) : (
                      <span className={`text-4xl font-extrabold ${scoreColorConfig.className}`}>
                        {currentScore}
                      </span>
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
                <TooltipProvider>
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
                            <div key={dim.id} className="text-xs">
                              <span className="font-medium">• {dim.name}</span> ({dim.score}/{dim.maxScore})
                              {dim.issues.length > 0 && (
                                <p className="text-muted-foreground ml-3 mt-0.5">{dim.issues[0].title}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>

                {/* Needs Work Badge */}
                <TooltipProvider>
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
                            <div key={dim.id} className="text-xs">
                              <span className="font-medium">• {dim.name}</span> ({dim.score}/{dim.maxScore})
                              {dim.issues.length > 0 && (
                                <p className="text-muted-foreground ml-3 mt-0.5">{dim.issues[0].title}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>

                {/* Strong Badge */}
                <TooltipProvider>
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
                            <div key={dim.id} className="text-xs">
                              <span className="font-medium">• {dim.name}</span> ({dim.score}/{dim.maxScore})
                            </div>
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
                hasAnalysisResult={analysisResult !== null}
                versionHistory={draftVersions}
                canUndo={currentVersionIndex > 0}
                canRedo={currentVersionIndex < draftVersions.length - 1}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onShowHistory={() => setShowVersionHistory(true)}
                onSaveToCloud={handleSaveToCloud}
              />
            </Card>

            {/* PIQ Prompt Selector - Moved from right column */}
            {selectedPromptId && (
              <Card className="p-6 bg-gradient-to-br from-background/95 via-background/90 to-pink-50/80 dark:from-background/95 dark:via-background/90 dark:to-pink-950/20 backdrop-blur-xl border shadow-lg">
                <PIQPromptSelector
                  selectedPromptId={selectedPromptId}
                  onPromptSelect={(promptId) => {
                    setSelectedPromptId(promptId);
                    setNeedsReanalysis(true);
                    setHasUnsavedChanges(true);
                  }}
                />
              </Card>
            )}

            {/* Rubric dimensions */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-primary">11-Dimension Analysis</h2>
                <Badge variant="outline" className="gap-2">
                  <Target className="w-3 h-3" />
                  {dimensions.length} Categories
                </Badge>
              </div>

              <div className="space-y-4">
                {dimensions && Array.isArray(dimensions) && dimensions.length > 0 ? (
                  dimensions.map((dimension) => dimension ? (
                    <RubricDimensionCard
                      key={dimension.id}
                      dimension={dimension}
                      isExpanded={expandedDimensionId === dimension.id}
                      onToggleExpand={() => toggleDimensionExpand(dimension.id)}
                      onToggleIssue={handleToggleIssue}
                      onApplySuggestion={handleApplySuggestion}
                      onNextSuggestion={handleNextSuggestion}
                      onPrevSuggestion={handlePrevSuggestion}
                    />
                  ) : null)
                ) : (
                  <div className="text-center p-8 text-muted-foreground">
                    No analysis data yet. Click "Analyze" to get started.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right column: PIQ Prompt Selector + Chat */}
          <div className="space-y-6">
            {/* Chat */}
            <Card className="p-6 bg-gradient-to-br from-background/95 via-background/90 to-pink-50/80 dark:from-background/95 dark:via-background/90 dark:to-pink-950/20 backdrop-blur-xl border shadow-lg sticky top-28">
              <ContextualWorkshopChat
                activity={MOCK_PIQ as any}
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
            categories: []
          }))}
          currentVersionId={`v${currentVersionIndex}`}
          onRestore={handleRestoreVersion}
          onClose={() => setShowVersionHistory(false)}
        />
      )}
    </div>
  );
}
