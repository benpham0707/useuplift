import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InteractivePortfolioCardBento } from '@/components/portfolio/interactive/InteractivePortfolioCardBento';
import { Rocket, Target, TrendingUp, LayoutDashboard, Award, MapPin, FileText, Lightbulb, Sparkles } from 'lucide-react';
import { HolisticSummary, renderRich } from '../portfolioInsightsData';
import { ChevronLeft, ChevronRight, CheckCircle, Circle, AlertTriangle } from 'lucide-react';
import { NavigationControls } from '../NavigationControls';
import { ScoreIndicator } from '../ScoreIndicator';
import { ImpactTab } from './ImpactTab';
import { RecognitionTab } from '../recognition/RecognitionTab';
import { ExtracurricularTab } from '../extracurricular/ExtracurricularTab';

interface OverviewTabProps {
  summary: HolisticSummary;
  onNavigateToTab?: (tab: string) => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ summary, onNavigateToTab, activeTab = 'overview', onTabChange }) => {
  const overall100 = Math.round(summary.overallScore * 10);
  const insight = summary.overarchingInsight;

  if (!insight) return null;

  return (
    <div className="space-y-8">
      {/* Interactive Portfolio Card - Bento Layout */}
      <InteractivePortfolioCardBento
        overallScore={overall100}
        tierName={summary.tierName}
        percentile={summary.tierPercentile}
        metrics={{
          academic: 7.8,
          leadership: 8.5,
          readiness: 8.5,
          community: 8.3,
          extracurricular: 9.1,
          courseRigor: 7.5,
        }}
        achievements={summary.achievements || []}
        schoolComparisons={summary.schoolComparisons || []}
        tierProgress={{
          currentTier: summary.tierName,
          nextTier: 'Platinum Achiever',
          progress: 75,
          pointsNeeded: 3.2,
        }}
      />

      {/* Tab Navigation */}
      {onTabChange && (
        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7 h-auto gap-2 bg-muted/50 p-2">
            <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-background">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="impact" className="flex items-center gap-2 data-[state=active]:bg-background">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Impact</span>
            </TabsTrigger>
            <TabsTrigger value="recognition" className="flex items-center gap-2 data-[state=active]:bg-background">
              <Award className="w-4 h-4" />
              <span className="hidden sm:inline">Recognition</span>
            </TabsTrigger>
            <TabsTrigger value="evidence" className="flex items-center gap-2 data-[state=active]:bg-background">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Extracurricular</span>
            </TabsTrigger>
            <TabsTrigger value="coherence" className="flex items-center gap-2 data-[state=active]:bg-background">
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:inline">Coherence</span>
            </TabsTrigger>
            <TabsTrigger value="trajectory" className="flex items-center gap-2 data-[state=active]:bg-background">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Trajectory</span>
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="flex items-center gap-2 data-[state=active]:bg-background">
              <Lightbulb className="w-4 h-4" />
              <span className="hidden sm:inline">Actions</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-8">
            <OverviewContent insight={insight} onNavigateToTab={onNavigateToTab} />
          </TabsContent>

          <TabsContent value="impact" className="mt-8">
            {insight.impactData && insight.recognitionData && (
              <ImpactTab overarchingInsight={insight} />
            )}
          </TabsContent>

          <TabsContent value="recognition" className="mt-8">
            {insight.recognitionOverview && insight.recognitionItems && (
              <RecognitionTab 
                overview={insight.recognitionOverview}
                recognitions={insight.recognitionItems}
              />
            )}
          </TabsContent>

          <TabsContent value="trajectory" className="mt-8">
            <div className="text-center py-12">
              <p className="text-muted-foreground">Trajectory & Durability tab coming soon...</p>
            </div>
          </TabsContent>

          <TabsContent value="coherence" className="mt-8">
            <div className="text-center py-12">
              <p className="text-muted-foreground">Coherence (with contextual factors) coming soon...</p>
            </div>
          </TabsContent>

          <TabsContent value="evidence" className="mt-8">
            {insight.extracurricularOverview && insight.extracurricularItems && (
              <ExtracurricularTab 
                overview={insight.extracurricularOverview}
                activities={insight.extracurricularItems}
              />
            )}
          </TabsContent>

          <TabsContent value="recommendations" className="mt-8">
            <div className="text-center py-12">
              <p className="text-muted-foreground">Recommendations tab coming soon...</p>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

// Separate component for overview content
const OverviewContent: React.FC<{ insight: any; onNavigateToTab?: (tab: string) => void }> = ({ insight, onNavigateToTab }) => {
  const [spineIndex, setSpineIndex] = React.useState(0);
  const [spikeIndex, setSpikeIndex] = React.useState(0);
  const [liftIndex, setLiftIndex] = React.useState(0);
  const [blindSpotIndex, setBlindSpotIndex] = React.useState(0);
  const [storyIndex, setStoryIndex] = React.useState(0);

  const { verdictOptions, storyTellingOptions } = insight;

  // Auto-select highest-scored options on mount
  React.useEffect(() => {
    const findHighestIndex = (options: any[]) => {
      if (!options || options.length === 0) return 0;
      return options.reduce((maxIdx, curr, idx, arr) => 
        curr.score > arr[maxIdx].score ? idx : maxIdx, 0
      );
    };

    setSpineIndex(findHighestIndex(verdictOptions.spine));
    setSpikeIndex(findHighestIndex(verdictOptions.spike));
    setLiftIndex(findHighestIndex(verdictOptions.lift));
    setBlindSpotIndex(findHighestIndex(verdictOptions.blind_spots || []));
    setStoryIndex(findHighestIndex(storyTellingOptions));
  }, [verdictOptions, storyTellingOptions]);

  const currentSpine = verdictOptions.spine[spineIndex];
  const currentSpike = verdictOptions.spike[spikeIndex];
  const currentLift = verdictOptions.lift[liftIndex];
  const currentBlindSpot = verdictOptions.blind_spots?.[blindSpotIndex];
  const currentStory = storyTellingOptions[storyIndex];

  // Map strategic positioning → characteristic trait tags
  const getTraitsForPositioning = React.useCallback((positioning: string): string[] => {
    const mapping: Record<string, string[]> = {
      'Civic-Tech Builder': ['Proactive', 'Entrepreneur', 'Community-Oriented', 'Innovative'],
      'Education Equity Advocate': ['Empathetic', 'Advocate', 'Equity-Driven', 'Collaborative'],
      'Technical Systems Architect': ['Systems Thinker', 'Analytical', 'Builder', 'Reliable'],
      'Policy-to-Action Translator': ['Bridge-Builder', 'Communicator', 'Impact-Oriented', 'Resourceful']
    };
    return mapping[positioning] || ['Proactive', 'Entrepreneur', 'Impact-Oriented'];
  }, []);
  
  // Use tags from API if available, else fallback to static mapping
  const traitTags = currentStory?.tags && currentStory.tags.length > 0 
    ? currentStory.tags 
    : getTraitsForPositioning(currentStory.positioning);

  const isHighestScore = (options: any[], index: number) => {
    if (!options || options.length === 0) return false;
    return options[index].score === Math.max(...options.map(o => o.score));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* SPINE - Full width at top (most important) */}
      <Card className="relative overflow-hidden shadow-sm hover:shadow-md transition-shadow border-0">
        <div className="p-7 md:p-8 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <Target className="w-6 h-6 text-primary" />
                <h3 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Your Narrative Thread</h3>
              </div>
              <p className="text-sm md:text-base text-muted-foreground">
                The cohesive story connecting all your activities
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <ScoreIndicator 
                score={currentSpine.score} 
                isRecommended={isHighestScore(verdictOptions.spine, spineIndex)}
              />
              <NavigationControls
                current={spineIndex}
                total={verdictOptions.spine.length}
                onPrev={() => setSpineIndex(prev => Math.max(0, prev - 1))}
                onNext={() => setSpineIndex(prev => Math.min(verdictOptions.spine.length - 1, prev + 1))}
              />
            </div>
          </div>
          
          <p className="text-lg md:text-xl leading-relaxed text-foreground">
            {renderRich(currentSpine.text)}
          </p>

          {currentSpine.reasoning && (
            <p className="text-sm text-muted-foreground pt-3 border-t">
              <strong>Why this works:</strong> {currentSpine.reasoning}
            </p>
          )}
        </div>
      </Card>

      {/* SPIKE & LIFT - Side by side (more room for each) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SPIKE - What to amplify */}
        <Card className="relative overflow-hidden shadow-sm hover:shadow-md transition-shadow border-0">
          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-foreground" />
                  <h3 className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">What Stands Out</h3>
                </div>
                <p className="text-sm text-muted-foreground">Your strongest differentiators</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <ScoreIndicator 
                  score={currentSpike.score}
                  isRecommended={isHighestScore(verdictOptions.spike, spikeIndex)}
                />
                <NavigationControls
                  current={spikeIndex}
                  total={verdictOptions.spike.length}
                  onPrev={() => setSpikeIndex(prev => Math.max(0, prev - 1))}
                  onNext={() => setSpikeIndex(prev => Math.min(verdictOptions.spike.length - 1, prev + 1))}
                />
              </div>
            </div>
            
            <p className="text-lg leading-relaxed text-foreground/90">
              {renderRich(currentSpike.text)}
            </p>

            {currentSpike.reasoning && (
              <p className="text-sm text-muted-foreground pt-2 border-t">
                {currentSpike.reasoning}
              </p>
            )}
          </div>
        </Card>

        {/* LIFT - Biggest improvement */}
        <Card className="relative overflow-hidden shadow-sm hover:shadow-md transition-shadow border-0">
          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-foreground" />
                  <h3 className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">What to Improve</h3>
                </div>
                <p className="text-sm text-muted-foreground">Critical gaps to address</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <ScoreIndicator 
                  score={currentLift.score}
                  isRecommended={isHighestScore(verdictOptions.lift, liftIndex)}
                />
                <NavigationControls
                  current={liftIndex}
                  total={verdictOptions.lift.length}
                  onPrev={() => setLiftIndex(prev => Math.max(0, prev - 1))}
                  onNext={() => setLiftIndex(prev => Math.min(verdictOptions.lift.length - 1, prev + 1))}
                />
              </div>
            </div>
            
            <p className="text-lg leading-relaxed text-foreground/90">
              {renderRich(currentLift.text)}
            </p>

            {currentLift.reasoning && (
              <p className="text-sm text-muted-foreground pt-2 border-t">
                {currentLift.reasoning}
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* BLIND SPOTS - Full width (Unintended Signals) */}
      {currentBlindSpot && verdictOptions.blind_spots && (
        <Card className="relative overflow-hidden shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-amber-500/60 border-y-0 border-r-0 bg-gradient-to-r from-amber-50/50 to-transparent">
          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <h3 className="text-xl md:text-2xl font-extrabold text-amber-700">Unintended Signals</h3>
                </div>
                <p className="text-sm text-amber-600/80">Potential blind spots in your narrative</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <ScoreIndicator 
                  score={currentBlindSpot.score}
                  isRecommended={isHighestScore(verdictOptions.blind_spots, blindSpotIndex)}
                />
                <NavigationControls
                  current={blindSpotIndex}
                  total={verdictOptions.blind_spots.length}
                  onPrev={() => setBlindSpotIndex(prev => Math.max(0, prev - 1))}
                  onNext={() => setBlindSpotIndex(prev => Math.min(verdictOptions.blind_spots!.length - 1, prev + 1))}
                />
              </div>
            </div>
            
            <p className="text-lg leading-relaxed text-foreground/90">
              {renderRich(currentBlindSpot.text)}
            </p>

            {currentBlindSpot.reasoning && (
              <p className="text-sm text-muted-foreground pt-2 border-t border-amber-200/30">
                {currentBlindSpot.reasoning}
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Story Coherence */}
      <Card className="shadow-sm border-0">
        <div className="p-7 md:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              <h3 className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Story Coherence</h3>
            </div>
            <span className="text-2xl font-extrabold text-primary">{insight.storyCoherencePercent}%</span>
          </div>
          {/* Custom progress with milestone markers and interactive checklists */}
          <MilestoneProgress 
            percent={insight.storyCoherencePercent}
            context={(() => {
              // Personalize recommendations using selected story positioning and likely primary artifact
              const theme = currentStory?.positioning as string | undefined;
              const primaryArtifact = (() => {
                const seg = (currentStory?.narrative || []).find((s: any) => typeof s !== 'string') as any;
                return seg?.text as string | undefined;
              })();
              return { theme, primaryArtifact } as { theme?: string; primaryArtifact?: string };
            })()}
            completionByMilestone={(() => {
              const mapping: Record<number, boolean[]> = {};
              const pct = insight.storyCoherencePercent;
              milestones.forEach((m) => {
                const total = m.checklist.length;
                const ratio = Math.max(0, Math.min(1, pct / m.pct));
                // Slightly conservative rounding so there are visible TODOs on upcoming milestones
                const completedCount = Math.min(total, Math.max(0, Math.floor(ratio * total + (ratio === 1 ? 0 : -0.1))));
                mapping[m.pct] = m.checklist.map((_, i) => i < completedCount);
              });
              return mapping;
            })()}
          />
          <p className="text-lg text-foreground/90 leading-relaxed mt-5 md:mt-6">
            {renderRich(insight.storyCoherenceLine)}
          </p>
          {/* Brief rubric */}
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Rubric highlights:</span> unified theme across activities and essays, quantified impact, minimal duplication, and cross-validation in recommendations and honors.
          </div>
        </div>
      </Card>

      {/* How to Tell This Story */}
      <Card className="relative overflow-hidden shadow-sm border-0">
        <div className="p-7 md:p-8 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <p className="text-sm text-muted-foreground uppercase tracking-wide">
                Strategic Positioning
              </p>
              <h3 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{currentStory.positioning}</h3>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <ScoreIndicator 
                score={currentStory.score}
                isRecommended={isHighestScore(storyTellingOptions, storyIndex)}
              />
              <NavigationControls
                current={storyIndex}
                total={storyTellingOptions.length}
                onPrev={() => setStoryIndex(prev => Math.max(0, prev - 1))}
                onNext={() => setStoryIndex(prev => Math.min(storyTellingOptions.length - 1, prev + 1))}
              />
            </div>
          </div>
          
          <p className="text-lg leading-relaxed text-foreground/90">
            {renderRich(currentStory.narrative)}
          </p>

          {currentStory.reasoning && (
            <p className="text-sm text-muted-foreground pt-3 border-t">
              <strong>Rationale:</strong> {currentStory.reasoning}
            </p>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            {traitTags.map((trait) => (
              <Badge
                key={trait}
                variant="outline"
                className="px-3 py-1 rounded-full bg-gradient-to-r from-indigo-600/10 to-purple-600/10 border-indigo-500/30 text-foreground shadow-[0_0_12px_rgba(99,102,241,0.12)]"
              >
                #{trait}
              </Badge>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};

// Milestone progress with hoverable checklist popups every 20%
const milestones = [
  {
    pct: 20,
    label: 'Needs Foundation',
    tagline: 'Missing many elements; start with basics',
    checklist: [
      'Define a single narrative theme (spine)',
      'Ensure at least 1 major activity aligns to theme',
      'Remove duplicated activities across resume/sections',
      'Draft personal statement framing the theme'
    ]
  },
  {
    pct: 40,
    label: 'Good Foundation',
    tagline: 'Core elements present; deepen alignment',
    checklist: [
      '2–3 activities explicitly reinforce the theme',
      'Add quantified metrics to at least 2 activities',
      'Ensure recommenders speak to the same theme',
      'Reduce repetitive descriptions across activities'
    ]
  },
  {
    pct: 60,
    label: 'Above Average',
    tagline: 'Strong UC contender',
    checklist: [
      'Most essays and activities clearly align',
      'Public outcomes: publish artifacts or links',
      'Show progression and leadership within theme',
      'Cross-validate claims with external references'
    ]
  },
  {
    pct: 80,
    label: 'Ivy Average',
    tagline: 'Average among Ivy admits',
    checklist: [
      'Multiple quantified outcomes across projects',
      'Independent initiative with sustained impact',
      'Minimal redundancy; each component adds new signal',
      'Third-party validation (awards, publications, partners)'
    ]
  },
  {
    pct: 100,
    label: 'Top-tier',
    tagline: 'Top-of-the-top candidate',
    checklist: [
      'Unified narrative across all materials',
      'Compelling public impact with scale and durability',
      'Elite validations and strong advocacy in recs',
      'Clear “committee sound bite” summarizing profile'
    ]
  }
];

type CoherenceContext = { theme?: string; primaryArtifact?: string };
const MilestoneProgress: React.FC<{ percent: number; completionByMilestone?: Record<number, boolean[]>; context?: CoherenceContext }> = ({ percent, completionByMilestone, context }) => {
  const [activeIdx, setActiveIdx] = React.useState<number | null>(null);
  const [page, setPage] = React.useState<'todo' | 'done'>('todo');
  const [animatedPercent, setAnimatedPercent] = React.useState(0);
  const [shouldAnimate, setShouldAnimate] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const getAlign = (pct: number): 'start' | 'center' | 'end' => {
    if (pct >= 99) return 'end';
    if (pct <= 10) return 'start';
    return 'center';
  };
  const getAlignOffset = (pct: number): number => {
    // Add subtle horizontal bias so the 100% popup hugs the page right edge without overlapping 80%
    if (pct >= 99) return 36; // nudge further right at top-tier
    if (pct >= 90) return 20;
    if (pct <= 10) return -20; // slight left bias for low milestones
    return 0;
  };

  // Animate fill on mount and when percent changes
  React.useEffect(() => {
    if (!shouldAnimate) {
      setAnimatedPercent(0);
      return;
    }
    let raf: number;
    let start: number | null = null;
    const duration = 6000; // ms - slower fill
    const target = Math.min(100, Math.max(0, percent));

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const step = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min(1, (ts - start) / duration);
      const eased = easeOutCubic(progress);
      setAnimatedPercent(target * eased);
      if (progress < 1) raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [percent, shouldAnimate]);

  // Start animation when the bar enters viewport
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting) {
        setShouldAnimate(true);
        observer.disconnect();
      }
    }, { threshold: 0.35 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Determine completion for a milestone either from provided analysis or a heuristic fallback
  const getCompletionForMilestone = React.useCallback((idx: number): boolean[] => {
    const m = milestones[idx];
    const provided = completionByMilestone?.[m.pct];
    if (provided && provided.length === m.checklist.length) return provided;
    // Heuristic: proportionally complete items based on progress toward the milestone threshold
    const ratio = Math.max(0, Math.min(1, percent / m.pct));
    const completedCount = Math.round(ratio * m.checklist.length);
    return m.checklist.map((_, i) => i < completedCount);
  }, [percent, completionByMilestone]);

  // Map a generic requirement into concrete coherence recommendations
  type Recommendation = { title: string; steps: string[] };
  const buildRecommendations = React.useCallback((requirement: string): Recommendation[] => {
    const theme = (context?.theme || 'your core theme').toLowerCase();
    const artifact = context?.primaryArtifact || 'your primary project';
    const req = requirement.toLowerCase();

    const recs: Recommendation[] = [];

    const push = (title: string, steps: string[]) => recs.push({ title, steps });

    if (req.includes('public outcomes') || req.includes('publish')) {
      push(`Publish visible outcomes from ${artifact}`, [
        `Create an impact hub: one page listing artifacts, links, and before/after snapshots for ${artifact}.`,
        'Attach 2–3 proof links in activities and essays (demo video, repo, live site).',
        'Add an "Evidence" line in your resume entries pointing to the same links.'
      ]);
    }

    if (req.includes('quantified') || req.includes('metrics')) {
      push('Quantify outcomes across activities', [
        `For each activity: add people served, frequency, and results (e.g., 118 weekly users, 12pt retention gain).`,
        `Write one-sentence metrics blurbs and reuse in essays and honors to reinforce ${theme}.`,
        'Update top 3 activities with before/after numbers and link sources.'
      ]);
    }

    if (req.includes('leadership') || req.includes('progression')) {
      push(`Show progression and leadership within ${theme}`, [
        'Add a 3-stage timeline (starter → operator → leader) with dates and scope increases.',
        'Rename roles/titles to reflect growth (member → coordinator → director).',
        'Include a short “what changed under you” line for each stage.'
      ]);
    }

    if (req.includes('recommenders')) {
      push('Align recommenders to the throughline', [
        `Send a 5‑bullet recommender brief highlighting ${theme} and 2 concrete outcomes to reference.`,
        'Ask them to mention the same artifact links you publish in the impact hub.',
        'Follow up with a single-sentence “committee sound bite” to quote.'
      ]);
    }

    if (req.includes('redundancy') || req.includes('duplication')) {
      push('Remove redundancy and make each component add new signal', [
        'Merge overlapping activities; keep the one with the strongest outcome and link others as sub-items.',
        'Rename items to highlight distinct contributions (build, operate, teach, validate).',
        'Trim repeated descriptions; add one unique proof link per item instead.'
      ]);
    }

    if (req.includes('third-party') || req.includes('validation') || req.includes('awards') || req.includes('partners')) {
      push('Secure third‑party validation', [
        `Submit ${artifact} to 2 relevant comps or showcases; list deadlines on a mini roadmap.`,
        'Get a partner MOU or testimonial quote; place it on the impact hub.',
        'Push an open-source or release tag and add a changelog entry.'
      ]);
    }

    if (req.includes('independent') || req.includes('sustained')) {
      push('Demonstrate independent, sustained initiative', [
        'Set a two‑week release cadence and publish a public changelog.',
        'Schedule 3 future milestones (v1.1, partner pilot, student handoff) with dates.',
        'Document ownership: who maintains it when you are busy; add the runbook link.'
      ]);
    }

    if (req.includes('cross-validate') || req.includes('references')) {
      push('Cross‑validate claims across materials', [
        'Add inline citations in essays linking to artifacts and awards.',
        'Mirror the same numbers in activities, honors, and the impact hub.',
        'Ensure at least two independent sources back each major claim.'
      ]);
    }

    if (req.includes('unified narrative') || req.includes('spine') || req.includes('theme')) {
      push('Tighten the unified narrative', [
        `Write a one‑sentence thesis: “I build ${theme} via ${artifact}.”`,
        'Map each activity to the thesis with a 6‑word label showing contribution.',
        'Open the personal statement with the thesis, then show proof links.'
      ]);
    }

    // Default: when no rule matched, propose coherence scaffolding
    if (recs.length === 0) {
      push('Increase narrative coherence', [
        `State ${theme} explicitly in your personal statement and top activities.`,
        `Create an evidence hub for ${artifact} with 3 proof links.`,
        'Cross‑link those proofs across resume, essays, and honors.'
      ]);
    }

    return recs;
  }, [context]);

  const glowFactor = Math.max(0.15, Math.min(0.95, animatedPercent / 100));

  return (
    <div ref={containerRef} className="relative">
      {/* Track */}
      <div className="relative h-4 w-full rounded-full bg-muted overflow-hidden">
        {/* Filled portion */}
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500"
          style={{
            width: `${animatedPercent}%`,
            boxShadow: `inset 0 0 ${10 + glowFactor * 24}px rgba(59,130,246,${0.25 + glowFactor * 0.40}), 0 0 ${6 + glowFactor * 20}px rgba(56,189,248,${0.22 + glowFactor * 0.45}), 0 0 ${4 + glowFactor * 16}px rgba(99,102,241,${0.15 + glowFactor * 0.30})`,
            filter: `drop-shadow(0 0 ${4 + glowFactor * 14}px rgba(56,189,248,${0.18 + glowFactor * 0.35})) saturate(${1 + glowFactor * 0.4})`
          }}
        />
        {/* Inner glow overlay following fill */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0"
          style={{ width: `${animatedPercent}%` }}
        >
          <div
            className="h-full w-full bg-gradient-to-r from-sky-300/40 via-cyan-300/25 to-transparent"
            style={{ filter: `blur(${2 + glowFactor * 2}px)`, opacity: 0.6 + glowFactor * 0.2 }}
          />
        </div>
        {/* Tip glow */}
        <div
          className="pointer-events-none absolute top-0 bottom-0"
          style={{ left: `calc(${animatedPercent}% - ${8 + glowFactor * 18}px)`, width: `${16 + glowFactor * 36}px` }}
        >
          <div
            className="h-full w-full rounded-full"
            style={{ backgroundColor: 'rgba(103, 232, 249, 0.5)', filter: `blur(${10 + glowFactor * 6}px)` }}
          />
        </div>
        {/* Gloss overlay */}
        <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/25 via-white/10 to-transparent" />
        {/* Scanline accent */}
        <div className="pointer-events-none absolute -inset-x-6 -top-1 h-2 bg-gradient-to-r from-transparent via-white/35 to-transparent rounded-full blur-sm" />
      </div>

      {/* Milestone markers */}
      {milestones.map((m, idx) => (
        <div
          key={m.pct}
          className="absolute top-0 h-4 w-0"
          style={{ left: `${m.pct}%` }}
        >
          <HoverCard openDelay={120} closeDelay={100} open={activeIdx === idx} onOpenChange={(o) => {
            if (o) {
              setActiveIdx(idx);
              // Default to TODO page if there are any pending items across cumulative milestones up to this point
              const cumulativeHasTodo = milestones
                .slice(0, idx + 1)
                .some((_, mi) => getCompletionForMilestone(mi).some((d) => !d));
              const hasTodo = cumulativeHasTodo;
              setPage(hasTodo ? 'todo' : 'done');
            } else {
              setActiveIdx(null);
            }
          }}>
            <HoverCardTrigger asChild>
              <button type="button" className="relative block h-4 focus:outline-none" aria-label={`Milestone ${m.pct}%`}>
                {/* Centered tick relative to bar height */}
                <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
                  <div className="w-[3px] h-6 rounded-full bg-gradient-to-b from-sky-400 via-cyan-400 to-sky-500 shadow-[0_0_10px_rgba(56,189,248,0.6)]" />
                  <div className="absolute -inset-1 rounded-full bg-sky-400/20 blur-sm" />
                </div>
                {/* Percentage label anchored below bar */}
                <div className="absolute left-1/2 -translate-x-1/2 top-[calc(100%+10px)] text-[10px] text-muted-foreground font-medium">{m.pct}%</div>
              </button>
            </HoverCardTrigger>
            <HoverCardContent
              side="top"
              align={getAlign(m.pct)}
              alignOffset={getAlignOffset(m.pct)}
              sideOffset={12}
              avoidCollisions={true}
              collisionPadding={8}
              className="w-[520px] z-50 p-0 rounded-2xl overflow-hidden border-2 data-[state=open]:duration-200 data-[state=closed]:duration-150"
              style={{
                maxWidth: 'min(520px, calc(100vw - 16px))',
                // Gradient border that respects rounded corners using background-clip technique
                background: `linear-gradient(0deg, rgba(255,255,255,0.72), rgba(255,255,255,0.72)) padding-box, linear-gradient(135deg, rgba(99,102,241,${0.45 + Math.max(0, Math.min(1, (m.pct - 60) / 40)) * 0.35}), rgba(34,211,238,${0.45 + Math.max(0, Math.min(1, (m.pct - 60) / 40)) * 0.35})) border-box`,
                border: '2px solid transparent',
                boxShadow: `0 10px ${12 + Math.max(0, Math.min(1, (m.pct - 60) / 40)) * 24}px rgba(34,211,238,${0.18 + Math.max(0, Math.min(1, (m.pct - 60) / 40)) * 0.30}), 0 0 ${10 + Math.max(0, Math.min(1, (m.pct - 60) / 40)) * 20}px rgba(99,102,241,${0.12 + Math.max(0, Math.min(1, (m.pct - 60) / 40)) * 0.28})`,
                borderRadius: 16
              }}
            >
              <div className="relative rounded-[14px] p-4 bg-background">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      {(() => {
                        const hg = Math.max(0, Math.min(1, (m.pct - 60) / 40));
                        return (
                          <>
                            <div
                              className="text-lg md:text-xl font-extrabold"
                              style={{
                                backgroundImage: 'linear-gradient(90deg, #6366F1, #22D3EE)',
                                WebkitBackgroundClip: 'text',
                                color: 'transparent',
                                textShadow: hg > 0 ? `0 0 ${2 + hg * 6}px rgba(34,211,238,${0.3 + 0.4 * hg})` : undefined
                              }}
                            >
                              {m.label}
                            </div>
                            <div className="text-xs md:text-sm text-foreground/80 italic">{m.tagline}</div>
                          </>
                        );
                      })()}
                    </div>
                    {/* right side spacer retained for alignment */}
                    <div className="w-[88px]" />
                  </div>
                  {(() => {
                    const g = Math.max(0, Math.min(1, (m.pct - 60) / 40));
                    return (
                      <div
                        className="absolute top-2 right-2 rounded-xl px-3 py-1.5 text-xs font-extrabold text-white border"
                        style={{
                          backgroundImage: 'linear-gradient(90deg, #22D3EE, #6366F1)',
                          borderColor: `rgba(255,255,255,${0.6})`,
                          boxShadow: `0 4px ${10 + g * 16}px rgba(34,211,238,${0.35 + g * 0.35}), 0 0 ${8 + g * 14}px rgba(99,102,241,${0.25 + g * 0.35})`
                        }}
                      >
                        {m.pct}%
                      </div>
                    );
                  })()}
                {/* Checklist pages: TODO vs Completed */}
                {(() => {
                  const glow = Math.max(0, Math.min(1, (m.pct - 60) / 40));
                  const styleBox = {
                    backgroundColor: 'transparent'
                  } as React.CSSProperties;

                  // Build cumulative list of requirements up to this milestone (earlier + current)
                  const aggregated = milestones.slice(0, idx + 1).flatMap((mm, mi) => {
                    const comp = getCompletionForMilestone(mi);
                    return mm.checklist.map((t, i) => ({ text: t, done: comp[i], pct: mm.pct }));
                  });
                  // Personalize for coherence: inject theme/artifact context into generic checklist labels
                  const personalize = (text: string) => {
                    const theme = context?.theme || 'your core theme';
                    const artifact = context?.primaryArtifact || 'your primary project';
                    return text
                      .replace('theme', theme.toLowerCase())
                      .replace('Public outcomes: publish artifacts or links', `Public outcomes: publish artifacts or links from ${artifact}`)
                      .replace('leadership within theme', `leadership within ${theme.toLowerCase()}`)
                      .replace('recommenders', 'recommenders reference the same throughline');
                  };
                  const items = aggregated.map((it) => ({ text: personalize(it.text), done: it.done }));
                  const todoItems = items.filter((x) => !x.done);
                  const doneItems = items.filter((x) => x.done);
                  const showing = (page === 'todo' ? todoItems : doneItems);
                  const pageTitle = page === 'todo' ? 'Improve coherence to reach this milestone' : 'Completed coherence signals';

                  return (
                    <div
                      className="border rounded-lg p-4 bg-background/95 shadow-sm max-h-80 overflow-y-auto pr-2"
                      style={styleBox}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <button
                          className={`p-1.5 rounded-md ${page === 'todo' ? 'opacity-50 cursor-default' : 'hover:bg-muted'}`}
                          onClick={() => setPage('todo')}
                          aria-label="Show items to do"
                          disabled={page === 'todo'}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <div
                          className="text-sm font-bold"
                          style={{
                            backgroundImage: glow > 0 ? 'linear-gradient(90deg, #6366F1, #22D3EE)' : undefined,
                            WebkitBackgroundClip: glow > 0 ? 'text' : undefined,
                            color: glow > 0 ? 'transparent' : undefined,
                            textShadow: glow > 0 ? `0 0 ${2 + glow * 6}px rgba(34,211,238,${0.5 * glow})` : undefined
                          }}
                        >
                          {pageTitle} ({showing.length})
                        </div>
                        <button
                          className={`p-1.5 rounded-md ${page === 'done' ? 'opacity-50 cursor-default' : 'hover:bg-muted'}`}
                          onClick={() => setPage('done')}
                          aria-label="Show completed items"
                          disabled={page === 'done'}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                      {showing.length === 0 ? (
                        <div className="text-xs text-muted-foreground text-center py-2">No items here yet.</div>
                      ) : page === 'done' ? (
                        <ul className="space-y-2">
                          {showing.map((item, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5" />
                              <span className="text-sm text-foreground">{item.text}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        // TODO page: render like completed items with inline, detailed steps beneath each
                        <ul className="space-y-3">
                          {showing.map((item, i) => (
                            <li key={i}>
                              <div className="flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                                <span className="text-sm text-foreground font-medium">{item.text}</span>
                              </div>
                              {buildRecommendations(item.text).map((rec, ri) => (
                                <div key={ri} className="ml-6 mt-1">
                                  <div className="text-[13px] font-semibold text-foreground">{rec.title}</div>
                                  <ul className="list-disc pl-5 mt-1 space-y-1">
                                    {rec.steps.map((s, si) => (
                                      <li key={si} className="text-[13px] leading-5 text-foreground/90">{s}</li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </li>
                          ))}
                        </ul>
                      )}
                      {page === 'todo' && doneItems.length > 0 && (
                        <div className="text-[11px] text-muted-foreground mt-2 text-center">
                          Completed coherence signals → use the right arrow
                        </div>
                      )}
                    </div>
                  );
                })()}
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
      ))}
    </div>
  );
};
