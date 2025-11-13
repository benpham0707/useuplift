import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { MetricType } from './InteractivePortfolioCard';

interface MetricDetailModalProps {
  metricType: MetricType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Hard-coded mock data for metric details
// TODO: Replace with real data from API/props
const getMetricDetails = (metricType: MetricType | null) => {
  if (!metricType) return null;

  const details: Record<MetricType, any> = {
    academic: {
      title: 'Academic Excellence',
      score: 7.8,
      percentile: 72,
      breakdown: [
        { component: 'GPA Impact', score: 8.2, weight: 40 },
        { component: 'Course Rigor', score: 7.5, weight: 35 },
        { component: 'Test Scores', score: 7.7, weight: 25 },
      ],
      strengths: [
        'Consistent upward GPA trend',
        'Strong performance in STEM courses',
        'Advanced placement in mathematics',
      ],
      improvements: [
        'Consider additional AP/IB courses',
        'Strengthen humanities course selection',
      ],
      schoolComparison: [
        { tier: 'Elite Schools', avgScore: 8.5, difference: -0.7 },
        { tier: 'Target Schools', avgScore: 7.6, difference: 0.2 },
        { tier: 'Safety Schools', avgScore: 6.8, difference: 1.0 },
      ],
    },
    leadership: {
      title: 'Leadership Impact',
      score: 8.5,
      percentile: 85,
      breakdown: [
        { component: 'Role Scope', score: 8.8, weight: 40 },
        { component: 'Initiative Quality', score: 8.3, weight: 35 },
        { component: 'Team Impact', score: 8.4, weight: 25 },
      ],
      strengths: [
        'Founded successful student organization',
        'Led team of 20+ members',
        'Demonstrated measurable community impact',
      ],
      improvements: [
        'Document specific leadership outcomes',
        'Expand cross-functional collaboration',
      ],
      schoolComparison: [
        { tier: 'Elite Schools', avgScore: 8.8, difference: -0.3 },
        { tier: 'Target Schools', avgScore: 8.0, difference: 0.5 },
        { tier: 'Safety Schools', avgScore: 7.2, difference: 1.3 },
      ],
    },
    readiness: {
      title: 'College Readiness',
      score: 8.5,
      percentile: 83,
      breakdown: [
        { component: 'Essays', score: 9.0, weight: 50 },
        { component: 'Recommendations', score: 8.2, weight: 30 },
        { component: 'Interview Prep', score: 8.3, weight: 20 },
      ],
      strengths: [
        'Compelling personal narrative',
        'Strong teacher relationships',
        'Well-articulated goals',
      ],
      improvements: [
        'Refine supplemental essays',
        'Practice interview responses',
      ],
      schoolComparison: [
        { tier: 'Elite Schools', avgScore: 8.7, difference: -0.2 },
        { tier: 'Target Schools', avgScore: 8.3, difference: 0.2 },
        { tier: 'Safety Schools', avgScore: 7.5, difference: 1.0 },
      ],
    },
    community: {
      title: 'Community Engagement',
      score: 8.3,
      percentile: 78,
      breakdown: [
        { component: 'Service Hours', score: 8.5, weight: 40 },
        { component: 'Impact Depth', score: 8.0, weight: 35 },
        { component: 'Consistency', score: 8.4, weight: 25 },
      ],
      strengths: [
        '200+ documented service hours',
        'Long-term commitment to causes',
        'Leadership in volunteer organizations',
      ],
      improvements: [
        'Quantify community impact',
        'Diversify service activities',
      ],
      schoolComparison: [
        { tier: 'Elite Schools', avgScore: 8.6, difference: -0.3 },
        { tier: 'Target Schools', avgScore: 8.0, difference: 0.3 },
        { tier: 'Safety Schools', avgScore: 7.3, difference: 1.0 },
      ],
    },
    extracurricular: {
      title: 'Extracurricular Excellence',
      score: 9.1,
      percentile: 92,
      breakdown: [
        { component: 'Depth of Engagement', score: 9.3, weight: 40 },
        { component: 'Achievement Level', score: 8.9, weight: 35 },
        { component: 'Diversity', score: 9.1, weight: 25 },
      ],
      strengths: [
        'National-level recognition',
        '4+ years of consistent participation',
        'Multiple leadership positions',
      ],
      improvements: [
        'Document specific achievements',
        'Show progression over time',
      ],
      schoolComparison: [
        { tier: 'Elite Schools', avgScore: 9.0, difference: 0.1 },
        { tier: 'Target Schools', avgScore: 8.3, difference: 0.8 },
        { tier: 'Safety Schools', avgScore: 7.5, difference: 1.6 },
      ],
    },
    courseRigor: {
      title: 'Course Rigor',
      score: 7.5,
      percentile: 68,
      breakdown: [
        { component: 'AP/IB Courses', score: 7.8, weight: 50 },
        { component: 'Advanced Electives', score: 7.2, weight: 30 },
        { component: 'Dual Enrollment', score: 7.5, weight: 20 },
      ],
      strengths: [
        '8 AP courses completed',
        'Honors track in core subjects',
      ],
      improvements: [
        'Add advanced mathematics courses',
        'Consider college-level coursework',
      ],
      schoolComparison: [
        { tier: 'Elite Schools', avgScore: 8.8, difference: -1.3 },
        { tier: 'Target Schools', avgScore: 7.8, difference: -0.3 },
        { tier: 'Safety Schools', avgScore: 6.5, difference: 1.0 },
      ],
    },
  };

  return details[metricType];
};

// Mock distribution data for bell curve
const distributionData = [
  { score: 0, percentage: 1 },
  { score: 1, percentage: 2 },
  { score: 2, percentage: 5 },
  { score: 3, percentage: 10 },
  { score: 4, percentage: 15 },
  { score: 5, percentage: 20 },
  { score: 6, percentage: 25 },
  { score: 7, percentage: 20 },
  { score: 8, percentage: 15 },
  { score: 9, percentage: 10 },
  { score: 10, percentage: 5 },
];

export const MetricDetailModal: React.FC<MetricDetailModalProps> = ({
  metricType,
  open,
  onOpenChange,
}) => {
  const details = getMetricDetails(metricType);

  if (!details) return null;

  const percentage = (details.score / 10) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <DialogTitle className="text-2xl">{details.title}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Score Overview */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Your Score</div>
                    <div className="text-5xl font-bold text-primary">
                      {details.score.toFixed(1)} <span className="text-2xl text-muted-foreground">/ 10</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Percentile</div>
                    <div className="text-3xl font-bold">{details.percentile}th</div>
                  </div>
                </div>
                <Progress value={percentage} className="h-3" />
              </div>
            </CardContent>
          </Card>

          {/* Distribution Chart */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">How You Compare</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={distributionData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="score" label={{ value: 'Score', position: 'insideBottom', offset: -5 }} />
                    <YAxis label={{ value: 'Percentage', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="percentage"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center mt-2 text-sm text-muted-foreground">
                You are here: <span className="font-bold text-primary">{details.score.toFixed(1)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Breakdown */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Score Breakdown</h3>
              <div className="space-y-4">
                {details.breakdown.map((item: any) => (
                  <div key={item.component}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">{item.component}</span>
                      <span className="text-muted-foreground">
                        {item.score.toFixed(1)}/10 ({item.weight}%)
                      </span>
                    </div>
                    <Progress value={(item.score / 10) * 100} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Strengths & Improvements */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Top Strengths
                </h3>
                <ul className="space-y-2">
                  {details.strengths.map((strength: string, index: number) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  Improvement Areas
                </h3>
                <ul className="space-y-2">
                  {details.improvements.map((improvement: string, index: number) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <span className="text-amber-600 mt-0.5">⚠</span>
                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* School Comparison */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Compared to Accepted Students</h3>
              <div className="space-y-3">
                {details.schoolComparison.map((comp: any) => {
                  const isPositive = comp.difference > 0;
                  return (
                    <div
                      key={comp.tier}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <span className="font-medium">{comp.tier}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">
                          avg: {comp.avgScore.toFixed(1)}
                        </span>
                        <span
                          className={cn(
                            'text-sm font-bold px-2 py-1 rounded',
                            isPositive
                              ? 'bg-green-500/10 text-green-600'
                              : 'bg-red-500/10 text-red-600'
                          )}
                        >
                          {isPositive ? '+' : ''}{comp.difference.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
