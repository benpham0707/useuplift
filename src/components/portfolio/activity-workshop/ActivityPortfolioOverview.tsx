import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import {
  GraduationCap, Clock, MapPin, ChevronDown, Sparkles,
  ArrowRight, Rocket, Calendar, Target, Award
} from 'lucide-react';
import GradientText from '@/components/ui/GradientText';
import ActivityMetricTile from './ActivityMetricTile';
import ActivityInsightsPanel from './ActivityInsightsPanel';
import { type ActivityWorkshopPipelineResult, activityTitles } from './mockData';

type MetricId = 'harvard' | 'coherence' | 'activityScore' | 'descriptionScore' | 'spike';

interface Props {
  data: ActivityWorkshopPipelineResult;
}

// Tone-based gradient colors (blue/indigo theme)
const toneToColors = (value: number, max: number): string[] => {
  const ratio = value / max;
  if (ratio >= 0.8) return ['#3b82f6', '#6366f1', '#3b82f6', '#6366f1', '#3b82f6']; // blue-indigo
  if (ratio >= 0.6) return ['#10b981', '#3b82f6', '#10b981', '#3b82f6', '#10b981']; // green-blue
  if (ratio >= 0.4) return ['#f59e0b', '#f97316', '#f59e0b', '#f97316', '#f59e0b']; // amber-orange
  return ['#ef4444', '#f97316', '#ef4444', '#f97316', '#ef4444']; // red-orange
};

const getGlowStyle = (value: number, max: number): React.CSSProperties => {
  const ratio = value / max;
  if (ratio >= 0.8) return { boxShadow: '0 0 15px hsl(220, 90%, 60% / 0.3), 0 0 30px hsl(220, 90%, 60% / 0.15)' };
  if (ratio >= 0.6) return { boxShadow: '0 0 12px hsl(150, 80%, 45% / 0.25), 0 0 24px hsl(150, 80%, 45% / 0.1)' };
  if (ratio >= 0.4) return { boxShadow: '0 0 10px hsl(40, 90%, 55% / 0.25)' };
  return { boxShadow: '0 0 8px hsl(0, 80%, 55% / 0.2)' };
};

const strengthColor = (s: string) => {
  if (s === 'strong' || s === 'transformative') return 'border-l-green-500';
  if (s === 'emerging' || s === 'moderate') return 'border-l-amber-500';
  return 'border-l-muted-foreground';
};

const tierColor = (tier: number) => {
  switch (tier) {
    case 1: return 'bg-amber-500';
    case 2: return 'bg-blue-500';
    case 3: return 'bg-green-500';
    default: return 'bg-muted-foreground';
  }
};

const ActivityPortfolioOverview: React.FC<Props> = ({ data }) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricId | null>(null);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [carrotLeft, setCarrotLeft] = useState<number | null>(null);
  const [actionPlanOpen, setActionPlanOpen] = useState<Record<string, boolean>>({});
  const metricRefs = useRef<Record<MetricId, HTMLDivElement | null>>({ harvard: null, coherence: null, activityScore: null, descriptionScore: null, spike: null });
  const panelRef = useRef<HTMLDivElement | null>(null);

  const { stage0, stage1, stage3, finalNarrative, scoring } = data;
  const harvard = stage3.finalAssessment.harvardScale;
  const harvardLabels: Record<number, string> = { 1: 'Outstanding', 2: 'Very Strong', 3: 'Competitive', 4: 'Developing', 5: 'Needs Work', 6: 'Weak' };

  // Average scores
  const avgActivity = scoring ? (scoring.activityScores.reduce((s, a) => s + a.activityScore.total, 0) / scoring.activityScores.length) : 0;
  const avgDescription = scoring ? (scoring.activityScores.reduce((s, a) => s + a.descriptionScore.total, 0) / scoring.activityScores.length) : 0;

  const handleMetricClick = (metric: MetricId) => {
    if (isInsightsOpen && selectedMetric === metric) {
      setIsInsightsOpen(false);
      return;
    }
    setSelectedMetric(metric);
    setIsInsightsOpen(true);

    // Calculate carrot position
    requestAnimationFrame(() => {
      const el = metricRefs.current[metric];
      const panel = panelRef.current;
      if (el && panel) {
        const rect = el.getBoundingClientRect();
        const panelRect = panel.getBoundingClientRect();
        setCarrotLeft(rect.left + rect.width / 2 - panelRect.left);
      }
    });
  };

  const tierDist = stage1.tierDistribution;
  const totalActivities = tierDist.tier1 + tierDist.tier2 + tierDist.tier3 + tierDist.tier4;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl md:text-4xl font-bold">
          <GradientText colors={['#3b82f6', '#6366f1', '#3b82f6', '#6366f1', '#3b82f6']} animationSpeed={8}>
            Activity Workshop
          </GradientText>
        </h1>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 capitalize">
            <Sparkles className="h-3 w-3 mr-1" />
            {stage0.narrativeIdentity.archetype}
          </Badge>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Confidence</span>
            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all"
                style={{ width: `${stage3.finalAssessment.confidence}%` }}
              />
            </div>
            <span className="font-medium text-foreground">{stage3.finalAssessment.confidence}%</span>
          </div>
        </div>
      </div>

      {/* Harvard Scale Gauge */}
      <div className="flex flex-col items-center gap-2">
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 120 120" className="w-full h-full">
            <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="52"
              fill="none"
              stroke="url(#harvardGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${((7 - harvard) / 6) * 327} 327`}
              transform="rotate(-90 60 60)"
              className="transition-all duration-700"
            />
            <defs>
              <linearGradient id="harvardGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
            <text x="60" y="55" textAnchor="middle" className="fill-foreground text-2xl font-bold" fontSize="28">{harvard}/6</text>
            <text x="60" y="75" textAnchor="middle" className="fill-muted-foreground text-xs" fontSize="11">{harvardLabels[harvard]}</text>
          </svg>
        </div>
        <p className="text-xs text-muted-foreground">Harvard Scale</p>
      </div>

      {/* 5 Metric Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <ActivityMetricTile
          label="Harvard Scale" value={harvard} maxValue={6}
          onClick={() => handleMetricClick('harvard')} isSelected={selectedMetric === 'harvard'}
          tileRef={(el) => { metricRefs.current.harvard = el; }}
          colors={toneToColors(7 - harvard, 6)} glowStyle={getGlowStyle(7 - harvard, 6)}
        />
        <ActivityMetricTile
          label="Coherence" value={stage1.coherenceAnalysis.score} maxValue={100}
          onClick={() => handleMetricClick('coherence')} isSelected={selectedMetric === 'coherence'}
          tileRef={(el) => { metricRefs.current.coherence = el; }}
          colors={toneToColors(stage1.coherenceAnalysis.score, 100)} glowStyle={getGlowStyle(stage1.coherenceAnalysis.score, 100)}
        />
        <ActivityMetricTile
          label="Activity Score" value={avgActivity.toFixed(1)} maxValue={10}
          onClick={() => handleMetricClick('activityScore')} isSelected={selectedMetric === 'activityScore'}
          tileRef={(el) => { metricRefs.current.activityScore = el; }}
          colors={toneToColors(avgActivity, 10)} glowStyle={getGlowStyle(avgActivity, 10)}
        />
        <ActivityMetricTile
          label="Description Score" value={avgDescription.toFixed(1)} maxValue={10}
          onClick={() => handleMetricClick('descriptionScore')} isSelected={selectedMetric === 'descriptionScore'}
          tileRef={(el) => { metricRefs.current.descriptionScore = el; }}
          colors={toneToColors(avgDescription, 10)} glowStyle={getGlowStyle(avgDescription, 10)}
        />
        <ActivityMetricTile
          label="Spike" value={stage0.spikeHypothesis.maturity} suffix=""
          onClick={() => handleMetricClick('spike')} isSelected={selectedMetric === 'spike'}
          tileRef={(el) => { metricRefs.current.spike = el; }}
          colors={stage0.spikeHypothesis.maturity === 'mature' ? ['#3b82f6', '#6366f1', '#3b82f6'] : stage0.spikeHypothesis.maturity === 'developing' ? ['#10b981', '#3b82f6', '#10b981'] : ['#f59e0b', '#f97316', '#f59e0b']}
          glowStyle={getGlowStyle(stage0.spikeHypothesis.maturity === 'mature' ? 9 : stage0.spikeHypothesis.maturity === 'developing' ? 7 : 5, 10)}
        />
      </div>

      {/* Insights Panel */}
      {isInsightsOpen && selectedMetric && (
        <div ref={panelRef} className="animate-in slide-in-from-top-2 duration-300">
          <ActivityInsightsPanel selectedMetric={selectedMetric} data={data} carrotLeft={carrotLeft} />
        </div>
      )}

      {/* Tier Distribution */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Award className="h-4 w-4 text-blue-500" />
            Tier Distribution
          </h3>
          <div className="flex h-4 rounded-full overflow-hidden bg-muted">
            {tierDist.tier1 > 0 && <div className={`${tierColor(1)} transition-all`} style={{ width: `${(tierDist.tier1 / totalActivities) * 100}%` }} />}
            {tierDist.tier2 > 0 && <div className={`${tierColor(2)} transition-all`} style={{ width: `${(tierDist.tier2 / totalActivities) * 100}%` }} />}
            {tierDist.tier3 > 0 && <div className={`${tierColor(3)} transition-all`} style={{ width: `${(tierDist.tier3 / totalActivities) * 100}%` }} />}
            {tierDist.tier4 > 0 && <div className={`${tierColor(4)} transition-all`} style={{ width: `${(tierDist.tier4 / totalActivities) * 100}%` }} />}
          </div>
          <div className="flex gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> T1: {tierDist.tier1}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> T2: {tierDist.tier2}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> T3: {tierDist.tier3}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-muted-foreground" /> T4: {tierDist.tier4}</span>
          </div>
        </CardContent>
      </Card>

      {/* Context Badges */}
      <div className="flex flex-wrap gap-2 justify-center">
        {stage0.contextualFactors.firstGenIndicators && (
          <Badge variant="secondary" className="gap-1"><GraduationCap className="h-3 w-3" /> First-Gen</Badge>
        )}
        {stage0.contextualFactors.hasWorkFamilyObligations && (
          <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Works 20 hrs/week</Badge>
        )}
        {stage0.contextualFactors.hasResourceConstraints && (
          <Badge variant="secondary" className="gap-1"><MapPin className="h-3 w-3" /> Rural</Badge>
        )}
      </div>

      {/* Story Pitch */}
      {finalNarrative && (
        <Card className="border-l-4 border-l-blue-500 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <p className="text-lg italic text-foreground leading-relaxed">
              "{finalNarrative.story.pitch}"
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {finalNarrative.story.emergentTraits.map((trait) => (
                <Badge key={trait} variant="outline" className="capitalize text-xs">{trait}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Narrative Threads */}
      {finalNarrative && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Narrative Threads</h3>
          {finalNarrative.threads.map((thread, i) => {
            const matchingStage0 = stage0.narrativeThreads.find(t => t.thread === thread.name);
            const strength = matchingStage0?.strength || 'emerging';
            return (
              <Card key={i} className={`border-l-4 ${strengthColor(strength)} bg-card/80 backdrop-blur-sm`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-medium text-foreground text-sm">{thread.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{thread.synergy}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] capitalize shrink-0">{strength}</Badge>
                  </div>
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {thread.activityIds.map(id => (
                      <Badge key={id} variant="outline" className="text-[10px]">{activityTitles[id] || id}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Elevations */}
      {finalNarrative && finalNarrative.elevations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Top Elevations</h3>
          {finalNarrative.elevations.map((elev, i) => (
            <Card key={i} className={`border-l-4 ${strengthColor(elev.strength)} bg-card/80 backdrop-blur-sm`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <span>{activityTitles[elev.elevatingActivityId] || elev.elevatingActivityId}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span>{activityTitles[elev.elevatedActivityId] || elev.elevatedActivityId}</span>
                  <Badge variant="secondary" className="text-[10px] capitalize ml-auto">{elev.strength}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{elev.mechanism}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recommended Activity Order */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Target className="h-4 w-4 text-blue-500" />
          Recommended Activity Order
        </h3>
        <Card className="bg-card/80 backdrop-blur-sm border-border/50">
          <CardContent className="p-4 space-y-2">
            {stage3.orderedActivities.map((item) => (
              <div key={item.rank} className="flex items-start gap-3 text-sm">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">
                  {item.rank}
                </span>
                <div>
                  <span className="font-medium text-foreground">{activityTitles[item.activityId] || item.activityId}</span>
                  <p className="text-xs text-muted-foreground">{item.reason}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Action Plan */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Rocket className="h-4 w-4 text-blue-500" />
          Action Plan
        </h3>
        {[
          { key: 'immediate', label: 'Do Now', icon: Rocket, items: stage3.actionPlan.immediate },
          { key: 'shortTerm', label: 'Next Months', icon: Calendar, items: stage3.actionPlan.shortTerm },
          { key: 'longTerm', label: 'Long-Term', icon: Target, items: stage3.actionPlan.longTerm },
        ].map(({ key, label, icon: Icon, items }) => (
          <Collapsible key={key} open={actionPlanOpen[key] ?? false} onOpenChange={(open) => setActionPlanOpen(p => ({ ...p, [key]: open }))}>
            <Card className="bg-card/80 backdrop-blur-sm border-border/50">
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors rounded-lg">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Icon className="h-4 w-4 text-blue-500" />
                    {label}
                    <Badge variant="secondary" className="text-[10px]">{items.length}</Badge>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${actionPlanOpen[key] ? 'rotate-180' : ''}`} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 pb-4 px-4 space-y-3">
                  {items.map((item, i) => (
                    <div key={i} className="text-sm border-l-2 border-blue-500/30 pl-3">
                      <p className="text-foreground">{item.action}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.impact}</p>
                    </div>
                  ))}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
      </div>
    </div>
  );
};

export default ActivityPortfolioOverview;
