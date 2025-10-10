import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Award, ChevronRight, Lightbulb, Target } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import MagicBento, { BentoCard } from '@/components/ui/MagicBento';
import { ResponsiveContainer, LineChart, Line } from 'recharts';

type DetailedInsights = {
  overallScore?: number;
  narrativeSummary?: string;
  hiddenStrengths?: string[];
  prioritizedRecommendations?: { priority: number; action: string; impact?: string; timeline?: string }[];
  dimensions?: Record<string, {
    score?: number;
    evidence?: string[];
    feedback?: string;
    strengths?: string[];
    growthAreas?: string[];
  }>;
};

const DIMENSION_META: Record<string, { label: string; key: string; tone: 'overall' | 'academic' | 'leadership' | 'growth' | 'uniqueness' | 'completion' }[]> = {
  groups: [
    { label: 'Academic Excellence', key: 'academicExcellence', tone: 'academic' },
    { label: 'Impact & Leadership', key: 'leadershipPotential', tone: 'leadership' },
    { label: 'Intellectual Curiosity', key: 'futureReadiness', tone: 'growth' },
    { label: 'Storytelling', key: 'overall', tone: 'overall' },
    { label: 'Character & Community', key: 'communityImpact', tone: 'uniqueness' },
    { label: 'Future Readiness', key: 'futureReadiness', tone: 'growth' },
  ] as any,
} as any;

export default function PortfolioInsights() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { search } = useLocation();
  const qp = useMemo(() => new URLSearchParams(search), [search]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overall, setOverall] = useState<number | null>(null);
  const [dimensions, setDimensions] = useState<Record<string, number>>({});
  const [detailed, setDetailed] = useState<DetailedInsights | null>(null);

  useEffect(() => {
    let cancelled = false;
    const normalizeDimensions = (raw: any): Record<string, any> => {
      if (!raw || typeof raw !== 'object') return {};
      const map: Record<string, string> = {
        academic: 'academicExcellence',
        leadership: 'leadershipPotential',
        growth: 'futureReadiness',
        readiness: 'futureReadiness',
        community: 'communityImpact',
        uniqueness: 'uniqueValue',
        overall: 'overall',
        academicExcellence: 'academicExcellence',
        leadershipPotential: 'leadershipPotential',
        futureReadiness: 'futureReadiness',
        communityImpact: 'communityImpact',
      };
      const result: Record<string, any> = {};
      Object.entries(raw).forEach(([key, val]) => {
        const target = map[key] || key;
        result[target] = val as any;
      });
      return result;
    };
    async function fetchInsights() {
      try {
        setLoading(true);
        setError(null);
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;
        const resp = await fetch('/api/v1/analytics/portfolio-strength', {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        if (!resp.ok) throw new Error(await resp.text());
        const json = await resp.json();
        if (cancelled) return;
        setOverall(typeof json?.overall === 'number' ? Number(json.overall) : null);
        const normalizedDims = normalizeDimensions(json?.dimensions || {});
        setDimensions(normalizedDims);
        const normalizedDetailed = json?.detailed ? {
          ...json.detailed,
          dimensions: normalizeDimensions(json.detailed.dimensions || {})
        } : null;
        setDetailed(normalizedDetailed);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load insights');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (user) fetchInsights();
    return () => { cancelled = true; };
  }, [user]);

  const targetTop25 = 9.2;
  const gapToTop25 = overall ? Math.max(0, Number((targetTop25 - overall).toFixed(1))) : null;
  const initialAnchor = qp.get('metric');

  useEffect(() => {
    if (loading || error || !initialAnchor) return;
    const el = document.querySelector(`[data-dim-key="${initialAnchor}"]`);
    if (el && 'scrollIntoView' in el) {
      (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [loading, error, initialAnchor]);

  // Build Bento cards using analytics data
  const getToneColor = (tone: string) => {
    switch (tone) {
      case 'academic': return '#6366f1';
      case 'leadership': return '#22c55e';
      case 'growth': return '#06b6d4';
      case 'uniqueness': return '#f59e0b';
      case 'overall': return '#a78bfa';
      case 'completion': return '#94a3b8';
      default: return '#8b5cf6';
    }
  };

  const buildSparklineData = (score: number | null) => {
    if (score === null || typeof score !== 'number') return [] as { v: number }[];
    const s = Math.max(0, Math.min(10, score));
    const pts = [s - 0.7, s - 0.2, s - 0.5, s - 0.1, s].map(v => Math.max(0, Math.min(10, Number(v.toFixed(2)))));
    return pts.map(v => ({ v }));
  };
  const bentoCards: BentoCard[] = [
    {
      content: (
        <div className="h-full flex flex-col">
          <div className="card__header mb-3">
            <div className="card__label text-purple-300">Overview</div>
          </div>
          <div className="card__content">
            <h2 className="card__title text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Award className="h-5 w-5" /> Overall Readiness
            </h2>
            <div className="flex items-end gap-3">
              <div className="text-5xl font-bold leading-none text-white">{overall?.toFixed(1) ?? '—'}</div>
              <div className="text-sm mb-2 text-white/80">/ 10</div>
            </div>
            {gapToTop25 !== null && (
              <p className="mt-3 text-sm text-white/90">{gapToTop25 === 0 ? 'You are at top-tier level.' : `${gapToTop25} points from typical Top-25 admit profile`}</p>
            )}
            <div className="mt-4">
              <Progress value={Math.min(100, Math.max(0, (overall || 0) * 10))} className="h-2 bg-white/25" />
            </div>
          </div>
        </div>
      ),
      className: 'span-2'
    },
    {
      content: (
        <div className="h-full flex flex-col">
          <div className="card__header mb-3">
            <div className="card__label text-purple-300">Narrative</div>
          </div>
          <div className="card__content">
            <h2 className="card__title text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Lightbulb className="h-5 w-5" /> Narrative Summary
            </h2>
            <p className="text-white/95 leading-7">
              {detailed?.narrativeSummary || 'We will summarize your unique value once your profile has enough data.'}
            </p>
          </div>
        </div>
      )
    },
    {
      content: (
        <div className="h-full flex flex-col overflow-hidden">
          <div className="card__header mb-3">
            <div className="card__label text-purple-300">Recommendations</div>
          </div>
          <div className="card__content flex-1 overflow-auto">
            <h2 className="card__title text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Target className="h-5 w-5" /> Prioritized Recommendations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(detailed?.prioritizedRecommendations || []).map((rec, i) => (
                <Card key={i} className="bg-white/85 border-white/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>{rec.action}</span>
                      <Badge variant="secondary">#{rec.priority}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-1">
                    {rec.impact && <div>Impact: {rec.impact}</div>}
                    {rec.timeline && <div>Timeline: {rec.timeline}</div>}
                  </CardContent>
                </Card>
              ))}
              {(!detailed?.prioritizedRecommendations || detailed.prioritizedRecommendations.length === 0) && (
                <div className="text-sm text-white/90">Recommendations will appear here after your initial assessment.</div>
              )}
            </div>
          </div>
        </div>
      ),
      className: 'span-2'
    },
    {
      content: (
        <div className="h-full flex flex-col overflow-hidden">
          <div className="card__header mb-3">
            <div className="card__label text-purple-300">Dimensions</div>
          </div>
          <div className="card__content flex-1 overflow-auto">
            <h2 className="card__title text-xl font-bold text-white mb-2">Dimensional Insights</h2>
            <div className="grid md:grid-cols-2 gap-3">
              {(DIMENSION_META.groups as any).map((m: any, idx: number) => {
                const dim = detailed?.dimensions?.[m.key] || {};
                const score = typeof dim?.score === 'number' ? Number(dim.score) : (dimensions as any)?.[m.key] || null;
                const isSelected = initialAnchor === m.key;
                const spark = buildSparklineData(score);
                const color = getToneColor(m.tone || 'overall');
                return (
                  <Card key={m.key} data-dim-key={m.key} className={`bg-white/85 border ${isSelected ? 'ring-2 ring-purple-400' : 'border-white/30'}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        <div className="flex items-start justify-between gap-2">
                          <span>{m.label}</span>
                          <div className="flex items-end gap-2">
                            <div className="h-8 w-24">
                              {spark.length > 0 && (
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={spark} margin={{ top: 6, right: 0, bottom: 0, left: 0 }}>
                                    <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} />
                                  </LineChart>
                                </ResponsiveContainer>
                              )}
                            </div>
                            <div className="flex items-end gap-1 text-muted-foreground">
                              <span className="text-xl font-bold text-foreground">{score !== null ? score.toFixed(1) : '—'}</span>
                              <span className="text-xs mb-1">/10</span>
                            </div>
                          </div>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-2">
                      {idx % 2 === 0 && dim.feedback && <div className="text-sm text-muted-foreground">{dim.feedback}</div>}
                      {idx % 2 === 1 && (
                        <div>
                          <div className="text-[11px] uppercase text-muted-foreground mb-1">Progress</div>
                          <Progress value={Math.min(100, Math.max(0, (score || 0) * 10))} className="h-1.5" />
                        </div>
                      )}
                      {dim.strengths?.length > 0 && (
                        <div>
                          <div className="text-[11px] uppercase text-muted-foreground mb-1">Strengths</div>
                          <ul className="list-disc pl-5 text-sm space-y-1">
                            {dim.strengths.slice(0, 3).map((s, i) => (<li key={i}>{s}</li>))}
                          </ul>
                        </div>
                      )}
                      {dim.growthAreas?.length > 0 && (
                        <div>
                          <div className="text-[11px] uppercase text-muted-foreground mb-1">Top Improvements</div>
                          <ol className="list-decimal pl-5 text-sm space-y-1">
                            {dim.growthAreas.slice(0, 3).map((s, i) => (<li key={i}>{s}</li>))}
                          </ol>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      ),
      className: 'gpa-card'
    },
    {
      content: (
        <div className="h-full flex flex-col">
          <div className="card__header mb-3">
            <div className="card__label text-purple-300">Opportunities</div>
          </div>
          <div className="card__content">
            <h2 className="card__title text-xl font-bold text-white mb-2">Opportunity Deltas</h2>
            {(() => {
              const entries = Object.entries((detailed?.dimensions || {})).map(([key, val]: any) => ({
                key,
                score: typeof val?.score === 'number' ? Number(val.score) : (dimensions as any)?.[key] ?? null,
                growthAreas: val?.growthAreas || [],
              })).filter(e => e.score !== null);
              const target = 9.2;
              const sorted = entries
                .map(e => ({ ...e, gap: Math.max(0, Number((target - (e.score as number)).toFixed(1))) }))
                .sort((a, b) => b.gap - a.gap)
                .slice(0, 3);
              if (sorted.length === 0) return <div className="text-sm text-white/90">No gaps identified yet—complete your assessment for tailored opportunities.</div>;
              return (
                <div className="space-y-3">
                  {sorted.map((e) => (
                    <Card key={e.key} className="bg-white/85 border border-white/30">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center justify-between">
                          <span>{(DIMENSION_META.groups as any).find((g: any) => g.key === e.key)?.label || e.key}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">Gap {e.gap}</Badge>
                            <Badge variant="secondary">{(e.score as number).toFixed(1)}/10</Badge>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm text-muted-foreground space-y-1">
                        {(e.growthAreas || []).slice(0, 2).map((ga: string, idx: number) => (
                          <div key={idx}>• {ga}</div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )
    },
    {
      content: (
        <div className="h-full flex flex-col">
          <div className="card__header mb-3">
            <div className="card__label text-purple-300">Signals</div>
          </div>
          <div className="card__content">
            <h2 className="card__title text-xl font-bold text-white mb-2">Hidden Strengths</h2>
            {detailed?.hiddenStrengths?.length ? (
              <div className="flex flex-wrap gap-2">
                {detailed.hiddenStrengths.map((s, i) => (
                  <Badge key={i} variant="secondary">{s}</Badge>
                ))}
              </div>
            ) : (
              <div className="text-sm text-white/90">We’ll surface subtle strengths once there’s enough data.</div>
            )}
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-white/70 dark:bg-black/30 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/portfolio-scanner')} className="mr-1">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-semibold">All Insights</h1>
          </div>
          <div className="text-sm text-muted-foreground">Updated automatically as your profile evolves</div>
        </div>
      </div>

      <div className="w-full p-6 bg-white">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="text-muted-foreground">Loading insights…</div>
          ) : error ? (
            <div className="text-destructive">{error}</div>
          ) : (
            <MagicBento 
              cards={bentoCards}
              textAutoHide={false}
              enableStars={true}
              enableSpotlight={true}
              enableBorderGlow={true}
              enableTilt={true}
              enableMagnetism={false}
              clickEffect={false}
              particleCount={6}
              glowColor="147, 51, 234"
              spotlightRadius={200}
            />
          )}
        </div>
      </div>
    </div>
  );
}


