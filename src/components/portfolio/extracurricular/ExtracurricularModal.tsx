import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Gauge, Building2, Info, Award } from 'lucide-react';
import { ExtracurricularItem } from './ExtracurricularCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ExtracurricularWorkshopFinal as ExtracurricularWorkshop } from './workshop/ExtracurricularWorkshopFinal';
import { ExperienceEntry } from '@/core/types/experience';
import GradientText from '@/components/ui/GradientText';

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

/**
 * Convert ExtracurricularItem to ExperienceEntry format for workshop
 */
function convertToExperienceEntry(activity: ExtracurricularItem): ExperienceEntry {
  const description =
    activity.applicationGuidance?.whyItMatters ||
    activity.description ||
    `${activity.role} at ${activity.organization}. ${activity.scores.commitment.hoursPerWeek} hours/week for ${activity.scores.commitment.weeksPerYear} weeks/year.`;

  return {
    id: activity.id,
    user_id: 'current-user',
    title: activity.name,
    organization: activity.organization || '',
    role: activity.role || '',
    category: activity.category as any,
    description_original: description,
    hours_per_week: activity.scores.commitment.hoursPerWeek,
    weeks_per_year: activity.scores.commitment.weeksPerYear,
    start_date: activity.dateRange?.start || '',
    end_date: activity.dateRange?.end || 'Present',
    time_span: `${activity.dateRange?.start || ''} - ${activity.dateRange?.end || 'Present'}`,
    version: 1,
  };
}

export const ExtracurricularModal: React.FC<ExtracurricularModalProps> = ({
  activity,
  open,
  onOpenChange
}) => {
  const handleSave = (updatedEntry: ExperienceEntry) => {
    // Update activity with new description
    // In production, this would call an API to persist changes
    console.log('Saving updated description:', updatedEntry.description_original);
  };

  if (!activity) return null;

  const { scores } = activity;
  const scoreColor = getScoreColor(scores.portfolioContribution.overall);

  const buildContributionOverview = () => {
    const parts: string[] = [];
    parts.push(`This activity earns an overall portfolio contribution score of ${scores.portfolioContribution.overall.toFixed(1)}/10.`);
    parts.push(`Commitment depth is rated ${scores.portfolioContribution.breakdown.commitmentDepth.toFixed(1)}/10 and leadership trajectory is ${scores.portfolioContribution.breakdown.leadershipTrajectory.toFixed(1)}/10.`);
    return parts.join(' ');
  };

  const getTierSummary = (overall: number) => {
    if (overall >= 9) return { label: 'Exceptional', context: 'top few percent of high school extracurriculars' };
    if (overall >= 8) return { label: 'Top-tier', context: 'well above most activities listed by applicants' };
    if (overall >= 7) return { label: 'Strong', context: 'notable and above average among peers' };
    return { label: 'Moderate', context: 'competitive but common in selective applicant pools' };
  };

  const getPercentileBand = (overall: number) => {
    if (overall >= 9.5) return '≈ top 1-2%';
    if (overall >= 9) return '≈ top 3-5%';
    if (overall >= 8.5) return '≈ top 6-10%';
    if (overall >= 8) return '≈ top 11-15%';
    if (overall >= 7.5) return '≈ top 20-25%';
    if (overall >= 7) return '≈ top 30%';
    return '≈ top 50%';
  };

  const buildComparativeText = () => {
    const { overall, breakdown } = scores.portfolioContribution;
    const tier = getTierSummary(overall);
    const pieces: string[] = [];
    pieces.push(`${tier.label} relative standing — ${tier.context}.`);

    const commitmentLevel = breakdown.commitmentDepth >= 9 ? 'exceptional' : breakdown.commitmentDepth >= 8 ? 'strong' : breakdown.commitmentDepth >= 7 ? 'credible' : 'emerging';
    pieces.push(`Commitment depth is ${commitmentLevel} (${breakdown.commitmentDepth.toFixed(1)}/10), and leadership trajectory indicates ${(breakdown.leadershipTrajectory >= 8 ? 'significant growth and responsibility' : breakdown.leadershipTrajectory >= 7 ? 'notable development' : 'steady participation')} (${breakdown.leadershipTrajectory.toFixed(1)}/10).`);
    return pieces.join(' ');
  };

  const buildOfficerImplication = () => {
    const overall = scores.portfolioContribution.overall;
    const tier = getTierSummary(overall).label.toLowerCase();
    const commitment = scores.portfolioContribution.breakdown.commitmentDepth;
    const leadership = scores.portfolioContribution.breakdown.leadershipTrajectory;

    const commitmentRead = commitment >= 9 ? 'deep, sustained commitment' : commitment >= 8 ? 'strong commitment' : commitment >= 7 ? 'credible involvement' : 'moderate engagement';
    const leadershipRead = leadership >= 9 ? 'exceptional growth trajectory' : leadership >= 8 ? 'notable leadership development' : leadership >= 7 ? 'steady progression' : 'consistent participation';

    const leadTreatment = overall >= 9 ? 'centerpiece activity' : overall >= 8 ? 'primary supporting activity' : overall >= 7 ? 'supporting activity' : 'context activity';

    const s1 = `Reads as a ${tier} activity and will be handled as a ${leadTreatment} in file.`;
    const s2 = `With ${commitmentRead} and ${leadershipRead}, this demonstrates sustained engagement rather than surface-level participation.`;
    const s3 = overall >= 9
      ? 'Frames the applicant as deeply invested with tangible outcomes; reviewers expect brief evidence of impact rather than lengthy justification.'
      : overall >= 8
      ? 'Frames the applicant as committed and growing; reviewers will look for concise evidence of progression and outcomes.'
      : overall >= 7
      ? 'Frames the applicant as credibly involved; reviewers will weight sustained engagement and specific contributions.'
      : 'Adds breadth but is unlikely to differentiate; reviewers will look for concrete impact or leadership pairing to elevate significance.';

    return `${s1} ${s2} ${s3}`;
  };

  const getPositionVerdict = () => {
    const overall = scores.portfolioContribution.overall;
    const narrative = scores.portfolioContribution.breakdown.narrativeAlignment;
    if (overall >= 9 && narrative >= 8) {
      return { label: 'Flagship candidate', level: 'flagship', rationale: 'very high contribution paired with strong relevance to the academic narrative' };
    }
    if (overall >= 8 && narrative >= 7) {
      return { label: 'Primary supporting (bridge)', level: 'bridge', rationale: 'strong sustained engagement with good thematic fit' };
    }
    if (overall >= 7 && narrative >= 6) {
      return { label: 'Supporting activity', level: 'support', rationale: 'credible involvement that adds context but does not define the narrative' };
    }
    if (narrative < 5) {
      return { label: 'Low relevance (footnote)', level: 'footnote', rationale: 'impact is difficult to connect to intended major or story' };
    }
    return { label: 'Context activity', level: 'context', rationale: 'helpful breadth but unlikely to influence a committee decision by itself' };
  };

  const buildUpgradeAdvice = () => {
    const { breakdown } = scores.portfolioContribution;
    const suggestions: string[] = [];
    if (breakdown.narrativeAlignment < 7) {
      suggestions.push('Increase relevance: tie outcomes directly to intended major (e.g., project application, research continuation, or domain-specific contribution).');
    }
    if (breakdown.leadershipTrajectory < 8) {
      suggestions.push('Pursue expanded leadership responsibility or initiate a new dimension within the activity.');
    }
    if (breakdown.impactScale < 8) {
      suggestions.push('Document broader reach or measurable outcomes to signal scalable impact beyond individual participation.');
    }
    return suggestions.length ? suggestions.join(' ') : 'Maintain trajectory and document outcomes; current positioning is already strong.';
  };

  const buildCommitmentInsight = () => {
    const c = scores.portfolioContribution.breakdown.commitmentDepth;
    const hours = scores.commitment.totalHours;
    return `Scored ${c.toFixed(1)}/10 based on ${hours.toLocaleString()} total hours. This indicates sustained, deep investment rather than superficial participation, elevating credibility.`;
  };

  const buildLeadershipInsight = () => {
    const l = scores.portfolioContribution.breakdown.leadershipTrajectory;
    const band = l >= 9 ? 'exceptional growth' : l >= 8 ? 'strong progression' : l >= 7 ? 'steady development' : 'consistent involvement';
    return `Scored ${l.toFixed(1)}/10 given ${band}. Activities demonstrating clear advancement in responsibility carry higher weight in committee review.`;
  };

  const buildRelevanceInsight = () => {
    const align = scores.portfolioContribution.breakdown.narrativeAlignment;
    return `Alignment score of ${align.toFixed(1)}/10. This makes it ${align >= 8 ? 'very easy' : align >= 7 ? 'straightforward' : align >= 6 ? 'moderately clear' : 'challenging'} for an admissions officer to connect the activity to the academic narrative and intended major.`;
  };

  // Render metric text with gradient when score is very high
  const renderMetricText = (score: number, content: React.ReactNode, className = '') => {
    if (score >= 9) {
      return (
        <GradientText
          className={`${className}`}
          colors={["hsl(250 70% 60%)","hsl(185 80% 55%)","hsl(280 90% 65%)","hsl(250 70% 60%)"]}
          textOnly
        >
          {content}
        </GradientText>
      );
    }
    return <span className={`${getScoreColor(score)} ${className}`}>{content}</span>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <DialogTitle className="text-3xl font-extrabold leading-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {activity.name}
              </DialogTitle>
              <div className="text-base text-muted-foreground">
                {activity.organization} • {activity.role}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-8 pt-4">
          <Tabs defaultValue="contribution" className="w-full space-y-6">
            <TabsList className="grid w-full grid-cols-2 gap-1 bg-muted/50 backdrop-blur border rounded-xl p-1">
              <TabsTrigger value="contribution" className="rounded-lg transition-colors data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Portfolio Contribution</TabsTrigger>
              <TabsTrigger value="narrative" className="rounded-lg transition-colors data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Narrative Workshop</TabsTrigger>
            </TabsList>

            {/* Portfolio Contribution Tab */}
            <TabsContent value="contribution" className="space-y-6">
              {/* Overview */}
              <Card className="border bg-muted/20">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary via-primary/80 to-accent flex items-center justify-center">
                        <Award className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <GradientText
                        className="text-base md:text-lg font-extrabold uppercase tracking-wide"
                        colors={["#a855f7", "#8b5cf6", "#c084fc", "#a78bfa", "#a855f7"]}
                      >
                        Portfolio Contribution Overview
                      </GradientText>
                    </div>
                    <div className="text-right">
                      <div className="flex items-baseline justify-end gap-1">
                        {scores.portfolioContribution.overall >= 9.0 ? (
                          <GradientText
                            className="text-4xl font-extrabold metric-value"
                            colors={["hsl(250 70% 60%)","hsl(185 80% 55%)","hsl(280 90% 65%)","hsl(250 70% 60%)"]}
                            textOnly
                          >
                            {scores.portfolioContribution.overall.toFixed(1)}
                          </GradientText>
                        ) : (
                          <span className={`${scoreColor} text-4xl font-extrabold`}>{scores.portfolioContribution.overall.toFixed(1)}</span>
                        )}
                        <span className="text-muted-foreground font-medium">/10</span>
                      </div>
                      {(() => { const tier = getTierSummary(scores.portfolioContribution.overall); return (
                        <div className="text-xs text-muted-foreground">{tier.label} • {getPercentileBand(scores.portfolioContribution.overall)}</div>
                      ); })()}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold mb-1 text-primary">Comparative position</h4>
                      <p className="text-sm text-foreground/80 leading-relaxed">
                        {buildComparativeText()}
                      </p>
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                        <div>
                          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Estimated percentile</div>
                          <div className="font-medium">{renderMetricText(scores.portfolioContribution.overall, getPercentileBand(scores.portfolioContribution.overall))}</div>
                        </div>
                        <div>
                          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Recommended use</div>
                          <div className="font-medium capitalize">{activity.recommendedUse}</div>
                        </div>
                        <div>
                          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Commitment depth</div>
                          <div className="font-medium">{renderMetricText(scores.portfolioContribution.breakdown.commitmentDepth, `${scores.portfolioContribution.breakdown.commitmentDepth.toFixed(1)}/10`)}</div>
                        </div>
                      </div>
                    </div>
                    <div className="border-t" />
                    <div>
                      <h4 className="text-sm font-semibold mb-1 text-primary">Positioning verdict</h4>
                      {(() => { const v = getPositionVerdict(); return (
                        <p className="text-sm text-foreground/80 leading-relaxed"><span className="font-medium">{v.label}.</span> This is due to {v.rationale}.</p>
                      ); })()}
                      <div className="mt-2 text-sm text-muted-foreground">Upgrade path: {buildUpgradeAdvice()}</div>
                    </div>
                    <div className="border-t" />
                    <div>
                      <h4 className="text-sm font-semibold mb-1 text-primary">Implications for the admissions officer</h4>
                      <div className="space-y-2">
                        <p className="text-sm text-foreground/80 leading-relaxed">
                          {buildOfficerImplication()}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Specifics (stacked, single-open accordion) */}
              <Accordion type="single" collapsible className="rounded-xl border bg-card divide-y">
                <AccordionItem value="commitment">
                  <AccordionTrigger className="px-4 data-[state=open]:bg-primary/5">
                    <div className="flex w-full items-center gap-3">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary"><Gauge className="h-3.5 w-3.5" /></span>
                      <span className="text-sm font-semibold text-primary">Commitment Depth</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-muted-foreground">
                              <Info className="h-3.5 w-3.5" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="max-w-xs text-sm">Total hours and consistency of engagement; higher indicates sustained, deep investment.</div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <span className="ml-auto text-xs font-semibold">{renderMetricText(scores.portfolioContribution.breakdown.commitmentDepth, `${scores.portfolioContribution.breakdown.commitmentDepth.toFixed(1)}/10`)}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4">
                    <div className="space-y-3 text-sm text-foreground/80">
                      <h4 className="text-base font-semibold text-primary">Commitment details</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Total hours</div>
                          <div className="font-medium">{renderMetricText(scores.portfolioContribution.breakdown.commitmentDepth, `${scores.commitment.totalHours.toLocaleString()} hrs`)}</div>
                        </div>
                        <div>
                          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Hours/week</div>
                          <div className="font-medium">{renderMetricText(scores.portfolioContribution.breakdown.commitmentDepth, `${scores.commitment.hoursPerWeek}/week`)}</div>
                        </div>
                        <div>
                          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Consistency</div>
                          <div className="font-medium">{renderMetricText(scores.commitment.consistencyScore, `${scores.commitment.consistencyScore.toFixed(1)}/10`)}</div>
                        </div>
                      </div>
                      <h5 className="text-sm font-semibold text-primary">Why this scored as it did</h5>
                      <div className="text-foreground/80">{buildCommitmentInsight()}</div>
                      <h5 className="text-sm font-semibold mt-2 text-primary">How this strengthens the profile</h5>
                      <div className="text-foreground/80">Deep commitment demonstrates genuine interest rather than résumé padding; this increases credibility and signals capacity for sustained academic work.</div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="leadership">
                  <AccordionTrigger className="px-4 data-[state=open]:bg-primary/5">
                    <div className="flex w-full items-center gap-3">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary"><Building2 className="h-3.5 w-3.5" /></span>
                      <span className="text-sm font-semibold text-primary">Leadership Trajectory</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-muted-foreground">
                              <Info className="h-3.5 w-3.5" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="max-w-xs text-sm">Growth in responsibility and role progression over time.</div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <span className="ml-auto text-xs font-semibold">{renderMetricText(scores.portfolioContribution.breakdown.leadershipTrajectory, `${scores.portfolioContribution.breakdown.leadershipTrajectory.toFixed(1)}/10`)}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4">
                    <div className="space-y-3 text-sm text-foreground/80">
                      <h4 className="text-base font-semibold text-primary">Leadership details</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Current role</div>
                          <div className="font-medium">{activity.role}</div>
                        </div>
                        <div>
                          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Trajectory score</div>
                          <div className="font-medium">{renderMetricText(scores.portfolioContribution.breakdown.leadershipTrajectory, `${scores.portfolioContribution.breakdown.leadershipTrajectory.toFixed(1)}/10`)}</div>
                        </div>
                      </div>
                      <h5 className="text-sm font-semibold text-primary">Why this scored as it did</h5>
                      <div className="text-foreground/80">{buildLeadershipInsight()}</div>
                      <h5 className="text-sm font-semibold mt-2 text-primary">How this strengthens the profile</h5>
                      <div className="text-foreground/80">Leadership progression demonstrates initiative and capacity for greater responsibility; this signals readiness for college-level independence and project ownership.</div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="relevance">
                  <AccordionTrigger className="px-4 data-[state=open]:bg-primary/5">
                    <div className="flex w-full items-center gap-3">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary"><Info className="h-3.5 w-3.5" /></span>
                      <span className="text-sm font-semibold text-primary">Narrative Alignment</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-muted-foreground">
                              <Info className="h-3.5 w-3.5" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="max-w-xs text-sm">Closeness to intended major and narrative; higher means easier connection to the applicant's academic story.</div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <span className="ml-auto text-xs font-semibold">{renderMetricText(scores.portfolioContribution.breakdown.narrativeAlignment, `${scores.portfolioContribution.breakdown.narrativeAlignment.toFixed(1)}/10`)}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4">
                    <div className="space-y-3 text-sm text-foreground/80">
                      <h4 className="text-base font-semibold text-primary">Narrative alignment details</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Alignment score</div>
                          <div className="font-medium">{renderMetricText(scores.portfolioContribution.breakdown.narrativeAlignment, `${scores.portfolioContribution.breakdown.narrativeAlignment.toFixed(1)}/10`)}</div>
                        </div>
                        <div className="sm:col-span-2">
                          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Category</div>
                          <div className="font-medium capitalize">{activity.category}</div>
                        </div>
                      </div>
                      <h5 className="text-sm font-semibold text-primary">Why this scored as it did</h5>
                      <div className="text-foreground/80">{buildRelevanceInsight()}</div>
                      <h5 className="text-sm font-semibold mt-2 text-primary">How this strengthens the profile</h5>
                      <div className="text-foreground/80">High relevance reduces cognitive load for the admissions officer, making the case for fit and progression more immediate across the application.</div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

            </TabsContent>

            {/* Narrative Workshop Tab */}
            <TabsContent value="narrative" className="space-y-6">
              <ExtracurricularWorkshop activity={activity} />
            </TabsContent>

          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExtracurricularModal;
