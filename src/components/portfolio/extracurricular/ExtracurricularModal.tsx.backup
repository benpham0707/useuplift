import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Gauge, Layers, Target, Sparkles, Info, CheckCircle2 } from 'lucide-react';
import GradientText from '@/components/ui/GradientText';
import { ExtracurricularItem } from './ExtracurricularCard';

interface ExtracurricularModalProps {
  activity: ExtracurricularItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getScoreColor = (score: number) => {
  if (score >= 9.0) return 'text-amber-600 dark:text-amber-400';
  if (score >= 7.5) return 'text-green-600 dark:text-green-400';
  if (score >= 6.0) return 'text-blue-600 dark:text-blue-400';
  return 'text-muted-foreground';
};

export const ExtracurricularModal: React.FC<ExtracurricularModalProps> = ({ activity, open, onOpenChange }) => {
  const [draft, setDraft] = React.useState<string>('');

  React.useEffect(() => {
    if (!activity) return;
    // Seed draft from existing guidance if available
    const seed = activity.applicationGuidance?.whyItMatters || '';
    setDraft(seed);
  }, [activity]);

  if (!activity) return null;

  const contribution = activity.scores.portfolioContribution;
  const contributionOverall = Number(contribution.overall?.toFixed(1));

  const colorForScore = (s: number) => getScoreColor(s);

  // Simple rubric for activity narrative fit using available fields
  type RubricItem = {
    title: string;
    description: string;
    weight: number;
    score: number;
    suggestions: string[];
  };

  const computeNarrativeRubric = (text: string): RubricItem[] => {
    const length = text.trim().length;
    const hasNumbers = /(\d|%)/.test(text) || (activity.scores.commitment.totalHours > 0);
    const mentionsRole = /(I\s+(led|founded|organized|built|researched)|as (captain|president|director|founder))/i.test(text) || !!activity.role;
    const hasCausality = /(which led to|resulted in|enabling|therefore|as a result)/i.test(text);
    const hasReflection = /(I learned|taught me|I realized|I discovered)/i.test(text);
    const lengthScore = length >= 80 && length <= 240 ? 8.5 : 6.5;

    const items: RubricItem[] = [
      {
        title: 'Portfolio/Thematic Fit',
        description: 'Connects activity to your academic spine and application themes.',
        weight: 0.28,
        score: Math.min(10, Math.max(5.5, 6.5 + (contribution.breakdown.narrativeAlignment / 10))),
        suggestions: [
          'Name your academic focus or theme explicitly (e.g., "public-interest technology").',
          'State how this activity advances that spine in one clause.'
        ]
      },
      {
        title: 'Evidence & Specificity',
        description: 'Uses numbers and concrete outcomes (hours, beneficiaries, metrics).',
        weight: 0.22,
        score: hasNumbers ? 8.5 : 5.5,
        suggestions: [
          `Add hours and duration (e.g., ${activity.scores.commitment.hoursPerWeek}h/wk · ${activity.scores.commitment.weeksPerYear}w/yr).`,
          ...(activity.impactMetrics?.tangibilityLevel ? [`Mention impact tangibility: ${activity.impactMetrics.tangibilityLevel}.`] : []),
          ...(activity.scores.impact.metrics?.[0]?.label ? [`Include one metric: ${activity.scores.impact.metrics[0].label} → ${activity.scores.impact.metrics[0].value}.`] : [])
        ]
      },
      {
        title: 'Role Clarity & Agency',
        description: 'Crisp statement of your role and decisions you owned.',
        weight: 0.18,
        score: mentionsRole ? 8.0 : 5.5,
        suggestions: [
          'Lead with a first-person action verb: "I led", "I built", "I designed".',
          'State one decision you made or process you owned.'
        ]
      },
      {
        title: 'Causality & Reflection',
        description: 'Links actions to outcomes and includes one learning insight.',
        weight: 0.18,
        score: (hasCausality ? 8 : 6.5) + (hasReflection ? 1 : 0),
        suggestions: [
          'Add a cause→effect connector: "which led to" or "resulted in".',
          'Close with one sentence on what you learned.'
        ]
      },
      {
        title: 'Tone & Economy',
        description: 'Avoids buzzwords; concise and specific (~80–200 words).',
        weight: 0.14,
        score: lengthScore,
        suggestions: [
          'Remove adjectives like "impactful"; replace with one precise number.',
          'Trim to essentials; prefer one metric over two generic claims.'
        ]
      }
    ];
    return items.map(i => ({ ...i, score: Math.max(0, Math.min(10, Number(i.score.toFixed(1)))) }));
  };

  const rubric = computeNarrativeRubric(draft || '');
  const weightedOverall = Math.max(0, Math.min(10, Number((rubric.reduce((acc, r) => acc + r.score * r.weight, 0) / rubric.reduce((a, r) => a + r.weight, 0)).toFixed(1))));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-primary" />
            <span>{activity.name}</span>
            <Badge variant="secondary" className="ml-2">{activity.category}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6">
          <Tabs defaultValue="contribution">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="contribution" className="flex items-center gap-2">
                <Layers className="w-4 h-4" /> Contribution
              </TabsTrigger>
              <TabsTrigger value="narrative" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Narrative Workshop
              </TabsTrigger>
            </TabsList>

            <TabsContent value="contribution" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-muted-foreground">Portfolio Contribution</CardTitle>
                    <CardDescription>Overall weight in application</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {contributionOverall >= 9.0 ? (
                      <GradientText className="text-4xl font-extrabold" colors={["hsl(250 70% 60%)","hsl(185 80% 55%)","hsl(280 90% 65%)","hsl(250 70% 60%)"]} textOnly>
                        {contributionOverall}/10
                      </GradientText>
                    ) : (
                      <div className={`text-4xl font-bold ${colorForScore(contributionOverall)}`}>{contributionOverall}/10</div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-muted-foreground">Commitment</CardTitle>
                    <CardDescription>Hours and durability</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-semibold">{activity.scores.commitment.totalHours} hours</div>
                    <div className="text-sm text-muted-foreground">{activity.scores.commitment.hoursPerWeek}h/wk · {activity.scores.commitment.weeksPerYear}w/yr</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-muted-foreground">Impact</CardTitle>
                    <CardDescription>Quantified outcomes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${colorForScore(activity.scores.impact.overall)}`}>{activity.scores.impact.overall.toFixed(1)}/10</div>
                    {activity.scores.impact.metrics?.length ? (
                      <div className="mt-2 text-sm text-muted-foreground">
                        {activity.scores.impact.metrics.slice(0, 2).map((m, i) => (
                          <div key={i} className="flex items-center gap-2"><Target className="w-3.5 h-3.5 text-primary" /> {m.label}: <span className="font-medium">{m.value}</span></div>
                        ))}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </div>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="breakdown">
                  <AccordionTrigger className="px-4">
                    <div className="flex items-center gap-2"><Info className="w-4 h-4 text-primary" /> Contribution Breakdown</div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Commitment Depth</CardTitle>
                          <CardDescription>Longevity and intensity</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className={`text-xl font-semibold ${colorForScore(contribution.breakdown.commitmentDepth)}`}>{contribution.breakdown.commitmentDepth.toFixed(1)}/10</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Leadership Trajectory</CardTitle>
                          <CardDescription>Role growth over time</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className={`text-xl font-semibold ${colorForScore(contribution.breakdown.leadershipTrajectory)}`}>{contribution.breakdown.leadershipTrajectory.toFixed(1)}/10</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Impact Scale</CardTitle>
                          <CardDescription>Scope of outcomes</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className={`text-xl font-semibold ${colorForScore(contribution.breakdown.impactScale)}`}>{contribution.breakdown.impactScale.toFixed(1)}/10</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Narrative Alignment</CardTitle>
                          <CardDescription>Reinforces your spine</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className={`text-xl font-semibold ${colorForScore(contribution.breakdown.narrativeAlignment)}`}>{contribution.breakdown.narrativeAlignment.toFixed(1)}/10</div>
                        </CardContent>
                      </Card>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>

            <TabsContent value="narrative" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card className="shadow-sm border-0">
                    <CardHeader>
                      <CardTitle>Narrative Draft</CardTitle>
                      <CardDescription>Write a concise, evidence-based description</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        placeholder="Describe your activity with metrics, role, and outcomes..."
                        className="min-h-[220px]"
                      />
                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <div>
                          Word count: {draft.trim().split(/\s+/).filter(Boolean).length}
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className={`w-4 h-4 ${weightedOverall >= 8 ? 'text-green-600' : 'text-muted-foreground'}`} />
                          <span>Rubric score: {weightedOverall.toFixed(1)}/10</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-1 space-y-4">
                  {rubric.map((r, idx) => (
                    <Card key={idx} className="shadow-sm border-0">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">{r.title}</CardTitle>
                          <div className={`text-sm font-semibold ${colorForScore(r.score)}`}>{r.score.toFixed(1)}/10</div>
                        </div>
                        <CardDescription>{r.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                          {r.suggestions.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                        <div className="mt-3">
                          <Button size="sm" variant="secondary" onClick={() => {
                            const withTip = draft ? `${draft} ${r.suggestions[0]}` : r.suggestions[0];
                            setDraft(withTip);
                          }}>Apply tip</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExtracurricularModal;







