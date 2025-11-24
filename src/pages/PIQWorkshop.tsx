// @ts-nocheck
/**
 * PIQ Narrative Workshop - Pure Frontend Demo
 * 
 * 100% frontend implementation with mock data - NO backend calls.
 * Cloned UI/UX from ExtracurricularWorkshopFinal.tsx
 */

import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowLeft, Loader2, RefreshCcw, Target, TrendingUp, TrendingDown, Minus, AlertTriangle, History, XCircle, CheckCircle, PenTool, Info } from 'lucide-react';
import GradientText from '@/components/ui/GradientText';

// UI Components (NO backend imports)
import { EditorView } from '@/components/portfolio/extracurricular/workshop/views/EditorView';
import { RubricDimensionCard } from '@/components/portfolio/extracurricular/workshop/RubricDimensionCard';
import type { RubricDimension, WritingIssue, EditSuggestion } from '@/components/portfolio/extracurricular/workshop/types';
import ContextualWorkshopChat from '@/components/portfolio/extracurricular/workshop/components/ContextualWorkshopChat';
import { VersionHistory } from '@/components/portfolio/extracurricular/workshop/VersionHistory';

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
  // STATE
  // ============================================================================

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
  
  // Extract active issues from dimensions
  const activeIssues = dimensions.flatMap(d => d.issues).filter(i => i.status !== 'fixed');

  // ============================================================================
  // MOCK ANALYSIS (Simulated delay, no API call)
  // ============================================================================

  const performMockAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
    setIsAnalyzing(false);
    setNeedsReanalysis(false);
    // In real app would update scores - for demo, keep same
  }, []);

  // ============================================================================
  // HANDLERS (Same as ExtracurricularWorkshopFinal)
  // ============================================================================

  const handleDraftChange = useCallback((newDraft: string) => {
    setCurrentDraft(newDraft);
    setNeedsReanalysis(true);
  }, []);

  const handleSave = useCallback(() => {
    const newVersion: DraftVersion = {
      text: currentDraft,
      timestamp: Date.now(),
      score: 73 // Mock score
    };
    const newVersions = draftVersions.slice(0, currentVersionIndex + 1);
    newVersions.push(newVersion);
    setDraftVersions(newVersions);
    setCurrentVersionIndex(newVersions.length - 1);
    
    if (needsReanalysis) {
      performMockAnalysis();
    }
  }, [currentDraft, draftVersions, currentVersionIndex, needsReanalysis, performMockAnalysis]);

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
    performMockAnalysis();
  }, [performMockAnalysis]);

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
  // COMPUTED
  // ============================================================================

  const currentScore = 73;
  const initialScore = initialScoreRef.current;
  const totalIssues = dimensions.reduce((sum, d) => sum + d.issues.length, 0);
  const fixedIssues = dimensions.reduce((sum, d) => sum + d.issues.filter(i => i.status === 'fixed').length, 0);
  const criticalIssues = dimensions.filter(d => d.status === 'critical').length;
  const needsWorkIssues = dimensions.filter(d => d.status === 'needs_work').length;

  const getNQIConfig = () => {
    const nqi = currentScore;
    if (nqi >= 85) return { label: 'Outstanding', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-950/30', border: 'border-green-300 dark:border-green-800' };
    if (nqi >= 70) return { label: 'Solid, Needs Polish', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-950/30', border: 'border-blue-300 dark:border-blue-800' };
    if (nqi >= 55) return { label: 'Needs Significant Work', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-950/30', border: 'border-amber-300 dark:border-amber-800' };
    return { label: 'Critical Issues', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-950/30', border: 'border-red-300 dark:border-red-800' };
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return { gradient: true, colors: ['hsl(250 70% 60%)', 'hsl(185 80% 55%)', 'hsl(280 90% 65%)', 'hsl(250 70% 60%)'] };
    if (score >= 85) return { gradient: false, className: 'text-emerald-600 dark:text-emerald-400' };
    if (score >= 70) return { gradient: false, className: 'text-blue-600 dark:text-blue-400' };
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

  // Generate overview paragraph
  const getOverviewParagraph = (dims: RubricDimension[], score: number): string => {
    const critical = dims.filter(d => d.status === 'critical');
    const needsWork = dims.filter(d => d.status === 'needs_work');
    const good = dims.filter(d => d.status === 'good');
    
    let overview = `Your narrative scores ${score}/100, placing it in the ${
      score >= 85 ? 'elite tier' : score >= 70 ? 'competitive range' : 'developing stage'
    }. `;
    
    if (critical.length > 0) {
      overview += `${critical.length} critical ${critical.length === 1 ? 'dimension requires' : 'dimensions require'} immediate attention to meet baseline standards. `;
    }
    
    if (needsWork.length > 0) {
      overview += `${needsWork.length} ${needsWork.length === 1 ? 'area needs' : 'areas need'} strengthening to reach competitive quality. `;
    }
    
    if (good.length > 0) {
      overview += `${good.length} ${good.length === 1 ? 'dimension is' : 'dimensions are'} performing well and demonstrate strong narrative foundations. `;
    }
    
    const totalIssues = dims.reduce((sum, d) => sum + d.issues.length, 0);
    if (totalIssues > 0) {
      overview += `Focus on resolving the ${totalIssues} flagged ${totalIssues === 1 ? 'issue' : 'issues'} to improve your overall score.`;
    } else {
      overview += `Your essay demonstrates consistent quality across all dimensions.`;
    }
    
    return overview;
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
    const issueTypes = allIssues.map(i => i.rubric_category);
    const mostCommonIssue = issueTypes.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topIssueType = Object.entries(mostCommonIssue)
      .sort((a, b) => b[1] - a[1])[0]?.[0];
    
    let insight = '';
    
    // Strength callout
    if (strongest) {
      insight += `Your ${strongest.name.toLowerCase()} (${strongest.score}/${strongest.maxScore}) is a clear strength. `;
    }
    
    // Weakness callout with specific guidance
    if (criticalDimensions.length > 0) {
      const criticalNames = criticalDimensions.map(d => d.name.toLowerCase()).join(', ');
      insight += `Critical priority: ${criticalNames} ${criticalDimensions.length === 1 ? 'needs' : 'need'} immediate revision—${criticalDimensions[0].issues[0]?.problem || 'address flagged issues'}. `;
    } else if (weakest) {
      insight += `To reach ${score >= 70 ? 'excellence' : 'competitiveness'}, strengthen ${weakest.name.toLowerCase()} (currently ${weakest.score}/${weakest.maxScore})`;
      if (weakest.issues[0]?.problem) {
        insight += `—${weakest.issues[0].problem.split('.')[0]}. `;
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
        <div className="mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="text-center">
            <h1 className="text-xl font-bold text-primary">PIQ Narrative Workshop</h1>
            <p className="text-xs text-muted-foreground">PIQ #{MOCK_PIQ.piqNumber} · {MOCK_PIQ.category}</p>
          </div>
          <div className="w-24" />
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
              <div className="flex items-start justify-between mb-4 pb-4 border-b">
                {/* Left: Title + Icon */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary via-primary/80 to-accent flex items-center justify-center">
                    <PenTool className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <GradientText
                      className="text-base font-extrabold uppercase tracking-wide"
                      colors={["#a855f7", "#8b5cf6", "#c084fc", "#a78bfa", "#a855f7"]}
                    >
                      Narrative Quality Index
                    </GradientText>
                    <p className="text-xs text-muted-foreground">{dimensions.length}-dimension analysis</p>
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
                  <div className="flex items-center gap-1.5 justify-end mt-2">
                    <Button
                      onClick={handleRequestReanalysis}
                      disabled={!needsReanalysis || isAnalyzing}
                      variant={needsReanalysis ? "default" : "secondary"}
                      size="sm"
                      className="h-7 text-xs"
                    >
                      {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RefreshCcw className="w-3 h-3 mr-1" />}
                      {needsReanalysis ? 'Re-analyze' : 'Updated'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowVersionHistory(true)} className="h-7 text-xs">
                      <History className="w-3 h-3 mr-1" /> History
                    </Button>
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

              {/* Interactive Category Boxes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Critical Box */}
                <div className={criticalDimensions.length === 0 ? 'opacity-50' : ''}>
                  <div className="bg-gradient-to-br from-red-50 to-red-100/80 dark:from-red-950/30 dark:to-red-950/20 border-2 border-red-300 dark:border-red-800 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-5 h-5 text-red-600" />
                        <h3 className="text-sm font-bold text-red-700 dark:text-red-400 uppercase tracking-wide">
                          Critical Issues ({criticalDimensions.length})
                        </h3>
                      </div>
                    </div>
                    {criticalDimensions.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        <TooltipProvider>
                          {criticalDimensions.map(dim => (
                            <Tooltip key={dim.id}>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => scrollToDimension(dim.id)}
                                  className="px-3 py-1.5 rounded-lg bg-white/80 dark:bg-red-950/40 hover:bg-white dark:hover:bg-red-950/60 transition-all border border-red-200 dark:border-red-800/50 shadow-sm hover:shadow group"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-foreground group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                                      {dim.name}
                                    </span>
                                    <span className="text-xs font-bold text-red-600 dark:text-red-400">
                                      {dim.score}/{dim.maxScore}
                                    </span>
                                  </div>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="max-w-xs">
                                <div className="space-y-1">
                                  <p className="font-semibold text-xs">{dim.issues.length} issue{dim.issues.length !== 1 ? 's' : ''} found:</p>
                                  {dim.issues.slice(0, 2).map((issue, idx) => (
                                    <p key={idx} className="text-xs text-muted-foreground">• {issue.problem}</p>
                                  ))}
                                  {dim.issues.length > 2 && (
                                    <p className="text-xs text-muted-foreground italic">+{dim.issues.length - 2} more...</p>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </TooltipProvider>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-xs text-muted-foreground italic">No critical issues</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Needs Work Box */}
                <div className={needsWorkDimensions.length === 0 ? 'opacity-50' : ''}>
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100/80 dark:from-amber-950/30 dark:to-amber-950/20 border-2 border-amber-300 dark:border-amber-800 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                        <h3 className="text-sm font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                          Needs Work ({needsWorkDimensions.length})
                        </h3>
                      </div>
                    </div>
                    {needsWorkDimensions.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        <TooltipProvider>
                          {needsWorkDimensions.map(dim => (
                            <Tooltip key={dim.id}>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => scrollToDimension(dim.id)}
                                  className="px-3 py-1.5 rounded-lg bg-white/80 dark:bg-amber-950/40 hover:bg-white dark:hover:bg-amber-950/60 transition-all border border-amber-200 dark:border-amber-800/50 shadow-sm hover:shadow group"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                      {dim.name}
                                    </span>
                                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                                      {dim.score}/{dim.maxScore}
                                    </span>
                                  </div>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="max-w-xs">
                                <div className="space-y-1">
                                  <p className="font-semibold text-xs">{dim.issues.length} issue{dim.issues.length !== 1 ? 's' : ''} found:</p>
                                  {dim.issues.slice(0, 2).map((issue, idx) => (
                                    <p key={idx} className="text-xs text-muted-foreground">• {issue.problem}</p>
                                  ))}
                                  {dim.issues.length > 2 && (
                                    <p className="text-xs text-muted-foreground italic">+{dim.issues.length - 2} more...</p>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </TooltipProvider>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-xs text-muted-foreground italic">None</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Strong Box */}
                <div className={goodDimensions.length === 0 ? 'opacity-50' : ''}>
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/80 dark:from-emerald-950/30 dark:to-emerald-950/20 border-2 border-emerald-300 dark:border-emerald-800 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                        <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                          Strong Areas ({goodDimensions.length})
                        </h3>
                      </div>
                    </div>
                    {goodDimensions.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        <TooltipProvider>
                          {goodDimensions.map(dim => (
                            <Tooltip key={dim.id}>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => scrollToDimension(dim.id)}
                                  className="px-3 py-1.5 rounded-lg bg-white/80 dark:bg-emerald-950/40 hover:bg-white dark:hover:bg-emerald-950/60 transition-all border border-emerald-200 dark:border-emerald-800/50 shadow-sm hover:shadow group"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                      {dim.name}
                                    </span>
                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                      {dim.score}/{dim.maxScore}
                                    </span>
                                  </div>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="max-w-xs">
                                <p className="text-xs">{dim.overview}</p>
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </TooltipProvider>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-xs text-muted-foreground italic">None yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Overview Section */}
              <div className="pt-4 border-t mt-4">
                <h3 className="text-sm font-bold text-foreground mb-2 uppercase tracking-wider">Overview</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {getOverviewParagraph(dimensions, currentScore)}
                </p>
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
                versionHistory={draftVersions}
                canUndo={currentVersionIndex > 0}
                canRedo={currentVersionIndex < draftVersions.length - 1}
                onUndo={handleUndo}
                onRedo={handleRedo}
              />
            </Card>

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
                {dimensions.map((dimension) => (
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
                ))}
              </div>
            </div>
          </div>

          {/* Right column: Chat */}
          <div>
            <Card className="p-6 bg-gradient-to-br from-background/95 via-background/90 to-pink-50/80 dark:from-background/95 dark:via-background/90 dark:to-pink-950/20 backdrop-blur-xl border shadow-lg sticky top-24">
              <ContextualWorkshopChat
                activity={MOCK_PIQ as any}
                currentDraft={currentDraft}
                analysisResult={null}
                teachingCoaching={null}
                currentScore={currentScore}
                initialScore={initialScore}
                hasUnsavedChanges={needsReanalysis}
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
        <VersionHistory
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
