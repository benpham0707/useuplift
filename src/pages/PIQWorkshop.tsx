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
import { DraftVersionHistory } from '@/components/portfolio/extracurricular/workshop/DraftVersionHistory';

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

  // Generate comprehensive overview paragraph
  const getDetailedOverview = (dims: RubricDimension[], score: number): string => {
    const critical = dims.filter(d => d.status === 'critical');
    const needsWork = dims.filter(d => d.status === 'needs_work');
    const good = dims.filter(d => d.status === 'good').sort((a, b) => b.score - a.score);
    
    // Build comprehensive narrative paragraph
    let overview = '';
    
    // Current standing with context
    const tier = score >= 85 ? 'elite tier' : score >= 70 ? 'competitive range' : score >= 55 ? 'developing stage' : 'needs significant work';
    const tierContext = score >= 85 
      ? 'which places you among the strongest personal insight essays in the admissions pool'
      : score >= 70 
      ? 'which demonstrates solid narrative fundamentals but requires polish to reach the elite tier that commands admissions officers\' attention'
      : score >= 55
      ? 'which indicates a foundation to build upon but needs substantial revision across multiple dimensions to reach competitive admissions quality'
      : 'which indicates fundamental gaps that must be addressed to meet baseline admissions standards';
    
    overview += `Your narrative scores ${score}/100, placing it in the ${tier}, ${tierContext}. `;
    
    // Strengths highlight with specific examples
    if (good.length > 0) {
      const topStrengths = good.slice(0, 2);
      if (topStrengths.length === 1) {
        overview += `Your strongest dimension is ${topStrengths[0].name} (${topStrengths[0].score}/${topStrengths[0].maxScore}), demonstrating ${topStrengths[0].overview.toLowerCase()} `;
      } else {
        overview += `Your strongest dimensions are ${topStrengths[0].name} (${topStrengths[0].score}/${topStrengths[0].maxScore}) and ${topStrengths[1].name} (${topStrengths[1].score}/${topStrengths[1].maxScore}), which show solid narrative craftsmanship. `;
      }
    }
    
    // Priority areas with specific guidance
    if (critical.length > 0) {
      const criticalNames = critical.map(d => d.name).join(', ');
      const firstCriticalIssue = critical[0].issues[0];
      overview += `However, ${criticalNames} ${critical.length === 1 ? 'requires' : 'require'} immediate attention—`;
      if (firstCriticalIssue) {
        overview += `specifically, ${firstCriticalIssue.title.toLowerCase()}. `;
      } else {
        overview += `these are foundational gaps that limit your entire narrative. `;
      }
      overview += `Addressing these critical issues is essential before refining other dimensions. `;
    } else if (needsWork.length > 0) {
      const needsWorkNames = needsWork.map(d => d.name).join(', ');
      const weakest = needsWork.sort((a, b) => a.score - b.score)[0];
      overview += `To reach ${score >= 70 ? 'excellence and distinction' : 'competitive admissions quality'}, focus on strengthening ${needsWorkNames}. `;
      if (weakest.issues[0]) {
        overview += `Start with ${weakest.name} (${weakest.score}/${weakest.maxScore})—${weakest.issues[0].title.toLowerCase()} is the most impactful area for improvement. `;
      }
    }
    
    // Calculate and communicate potential
    const weightedPotential = [...critical, ...needsWork].reduce((sum, dim) => {
      const maxGain = dim.maxScore - dim.score;
      return sum + (maxGain * (dim.weight / 100));
    }, 0);
    const potentialGain = Math.round(weightedPotential * 0.7);
    
    if (potentialGain > 0) {
      const targetScore = score + potentialGain;
      const cycles = critical.length > 0 ? '3-4' : needsWork.length > 2 ? '2-3' : '1-2';
      overview += `With focused revision addressing the flagged issues, you could realistically reach ${targetScore}+ within ${cycles} editing cycles. `;
    }
    
    // Pattern detection with actionable insights
    const allIssues = dims.flatMap(d => d.issues);
    if (allIssues.length >= 3) {
      const specificityIssues = allIssues.filter(i => i.title.toLowerCase().includes('specific'));
      const emotionIssues = allIssues.filter(i => i.title.toLowerCase().includes('emotion') || i.title.toLowerCase().includes('vulnerability'));
      const transformationIssues = allIssues.filter(i => i.title.toLowerCase().includes('transform') || i.title.toLowerCase().includes('growth'));
      
      if (specificityIssues.length >= 2) {
        overview += `A key pattern across multiple dimensions: your essay needs more concrete specificity—replace general statements with precise names, numbers, dates, and sensory details that make scenes vivid and memorable. `;
      } else if (emotionIssues.length >= 2) {
        overview += `A recurring theme: several dimensions need deeper emotional engagement—move beyond describing what happened to showing your internal reactions, vulnerabilities, and the authentic feelings you experienced in those moments. `;
      } else if (transformationIssues.length >= 2) {
        overview += `Multiple dimensions indicate insufficient transformation narrative—admissions officers want to see clear before/after contrasts that prove you\'ve genuinely changed through specific behavioral examples. `;
      }
    }
    
    // Strategic next steps
    const totalIssues = dims.reduce((sum, d) => sum + d.issues.length, 0);
    if (totalIssues > 0) {
      const issueVerb = critical.length > 0 ? 'addressing' : 'refining';
      overview += `Begin by ${issueVerb} the ${totalIssues} flagged ${totalIssues === 1 ? 'issue' : 'issues'} in the dimension analysis below—each includes AI-suggested revisions that demonstrate exactly how to strengthen your narrative while maintaining your authentic voice.`;
    } else {
      overview += `Your essay demonstrates impressive consistency across all dimensions. Continue refining based on the detailed rubric feedback to maximize your admissions impact and ensure every sentence serves your narrative\'s strategic purpose.`;
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
              <div className="mt-6 pt-4">
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
                versionHistory={draftVersions}
                canUndo={currentVersionIndex > 0}
                canRedo={currentVersionIndex < draftVersions.length - 1}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onShowHistory={() => setShowVersionHistory(true)}
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
