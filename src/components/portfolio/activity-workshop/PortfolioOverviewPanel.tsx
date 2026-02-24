// @ts-nocheck
/**
 * PortfolioOverviewPanel
 *
 * Extracted from ActivityWorkshop.tsx — the 4-tab portfolio overview
 * (Overview, Your Story, Your Edge, Action Plan) that lives inside
 * the hero collapsible.
 *
 * All tab-local state is owned here so parent re-renders don't cascade
 * into this subtree unnecessarily.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  ArrowLeft, ArrowRight, RefreshCcw, Target, TrendingUp, AlertTriangle,
  CheckCircle, Pencil, Check, Lightbulb, Flag,
} from 'lucide-react';
import { activityTitles } from '@/components/portfolio/activity-workshop/mockData';
import type { ActivityWorkshopPipelineResult } from '../../../services/portfolioStrategy/services/activityWorkshop/types';

// ============================================================================
// TYPES
// ============================================================================

interface PortfolioOverviewPanelProps {
  data: ActivityWorkshopPipelineResult;
}

// ============================================================================
// HELPER
// ============================================================================

const getScoreCardColor = (score: number): string => {
  if (score >= 8.0) return 'text-green-500';
  if (score >= 6.0) return 'text-teal-500';
  if (score >= 4.0) return 'text-amber-500';
  return 'text-red-500';
};

// ============================================================================
// COMPONENT
// ============================================================================

const PortfolioOverviewPanel = React.memo(function PortfolioOverviewPanel({ data }: PortfolioOverviewPanelProps) {
  // All state is local — nothing leaks up to the parent
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [isEditingNarrative, setIsEditingNarrative] = useState(false);
  const [narrativeDraft, setNarrativeDraft] = useState('');
  const [expandedStrengths, setExpandedStrengths] = useState<number | null>(null);
  const [expandedOpps, setExpandedOpps] = useState<number | null>(null);

  // Derive data from pipeline result with graceful fallbacks
  const narrativeText = data.scoring?.portfolioRubric?.narrative?.storyLine
    ?? data.scoring?.portfolioRubric?.narrative?.twoSentencePitch
    ?? 'Analysis pending...';

  const spikeArea = data.stage0?.spikeHypothesis?.spikeArea ?? 'Analyzing...';
  const memorableElement = data.scoring?.portfolioRubric?.narrative?.differentiators?.[0] ?? 'Analyzing...';
  const topPriority = data.scoring?.portfolioRubric?.prioritizedRecommendations?.[0]?.recommendation ?? 'Analyzing...';

  const keyStrengths = (data.scoring?.portfolioRubric?.keyStrengths ?? []).map((s: string) => ({ text: s, detail: '' }));
  const keyGaps = (data.scoring?.portfolioRubric?.keyGaps ?? []).map((s: string) => ({ text: s, detail: '' }));

  const strategicPitch = data.teaching?.narrativeTeaching?.twoSentencePitch
    ?? data.stage2?.portfolioTeaching?.twoSentencePitch
    ?? '';
  const currentState = data.stage1?.portfolioTeachingNeeds?.primaryIssue ?? '';
  const strategicDirection = data.stage2?.portfolioTeaching?.strategicDirection ?? '';

  return (
    <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setExpandedSection(null); }} className="w-full">
          <TabsList className="bg-white/10 border border-white/20 w-full justify-start">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70">Overview</TabsTrigger>
            <TabsTrigger value="your-story" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70">Your Story</TabsTrigger>
            <TabsTrigger value="your-edge" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70">Your Edge</TabsTrigger>
            <TabsTrigger value="action-plan" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70">Action Plan</TabsTrigger>
          </TabsList>

          {/* ============ OVERVIEW TAB ============ */}
          <TabsContent value="overview" className="mt-3 space-y-3">

          {expandedSection === null ? (
            <div className="space-y-3 animate-fade-in">
            {/* Portfolio Narrative — blockquote style, clickable for drill-down */}
            <div
              className="border-l-4 border-l-blue-400/50 pl-4 py-1 cursor-pointer hover:bg-white/5 transition-colors duration-200 relative group"
              onClick={() => setExpandedSection('narrative')}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs uppercase tracking-widest text-white/60 font-semibold">Portfolio Narrative</div>
                <div className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                  {!isEditingNarrative && (
                    <button
                      className="p-1 rounded-md hover:bg-white/10 transition"
                      onClick={() => { setNarrativeDraft(narrativeText); setIsEditingNarrative(true); }}
                      aria-label="Edit narrative"
                    >
                      <Pencil className="h-3 w-3 text-white/70" />
                    </button>
                  )}
                  {!isEditingNarrative && (
                    <button className="p-1 rounded-md hover:bg-white/10 transition" aria-label="Regenerate">
                      <RefreshCcw className="h-3 w-3 text-white/70" />
                    </button>
                  )}
                </div>
              </div>
              {!isEditingNarrative ? (
                <div className="flex items-start gap-2">
                  <p className="text-white/90 text-base leading-7 flex-1">{narrativeText}</p>
                  <ArrowRight className="h-3 w-3 text-white/40 mt-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ) : (
                <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                  <Textarea value={narrativeDraft} onChange={(e) => setNarrativeDraft(e.target.value)} placeholder="Write your narrative angle..." className="bg-white/20 text-white placeholder:text-white/60 min-h-[80px] border-white/20" />
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" className="text-white/70" onClick={() => setIsEditingNarrative(false)}>Cancel</Button>
                    <Button size="sm" variant="secondary" onClick={() => setIsEditingNarrative(false)}>
                      <Check className="h-4 w-4 mr-1" /> Save
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Three Quick Insight Cards — clickable for drill-down */}
            <div className="grid md:grid-cols-3 gap-3">
              <div
                className="rounded-xl border border-white/35 bg-white/25 p-3 cursor-pointer hover:bg-white/35 transition-colors duration-200 relative group"
                onClick={() => setExpandedSection('spike')}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Target className="h-3.5 w-3.5 text-blue-400" />
                  <span className="text-xs uppercase tracking-widest text-white/60 font-semibold">Your Spike</span>
                </div>
                <p className="text-white/95 text-sm font-semibold">{spikeArea}</p>
                <ArrowRight className="h-3 w-3 text-white/40 absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <div
                className="rounded-xl border border-white/35 bg-white/25 p-3 cursor-pointer hover:bg-white/35 transition-colors duration-200 relative group"
                onClick={() => setExpandedSection('memorable')}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-xs uppercase tracking-widest text-white/60 font-semibold">What They'll Remember</span>
                </div>
                <p className="text-white/95 text-sm font-semibold">{memorableElement}</p>
                <ArrowRight className="h-3 w-3 text-white/40 absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <div
                className="rounded-xl border border-white/35 bg-white/25 p-3 cursor-pointer hover:bg-white/35 transition-colors duration-200 relative group"
                onClick={() => setExpandedSection('priority')}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Flag className="h-3.5 w-3.5 text-red-400" />
                  <span className="text-xs uppercase tracking-widest text-white/60 font-semibold">#1 Priority</span>
                </div>
                <p className="text-white/95 text-sm font-semibold">{topPriority}</p>
                <ArrowRight className="h-3 w-3 text-white/40 absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            {/* Key Strengths & Opportunities — inline expandable bullets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/25 bg-white/10 p-3 px-4 border-l-4 border-l-green-500">
                <h3 className="text-sm font-semibold text-white mb-2 uppercase tracking-wider">Key Strengths</h3>
                <ul className="space-y-1.5">
                  {(keyStrengths.length > 0 ? keyStrengths : [{ text: 'Analysis pending...', detail: '' }]).map((s, i) => (
                    <li key={i}>
                      <div
                        className="flex items-start gap-2 text-sm text-white/90 cursor-pointer hover:text-white transition-colors"
                        onClick={() => setExpandedStrengths(expandedStrengths === i ? null : i)}
                      >
                        <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span>{s.text}</span>
                      </div>
                      {s.detail && (
                        <div
                          className="overflow-hidden transition-[max-height,opacity] duration-200"
                          style={{ maxHeight: expandedStrengths === i ? '100px' : '0px', opacity: expandedStrengths === i ? 1 : 0 }}
                        >
                          <p className="text-xs text-white/60 ml-6 mt-1 leading-relaxed">{s.detail}</p>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-white/25 bg-white/10 p-3 px-4 border-l-4 border-l-amber-500">
                <h3 className="text-sm font-semibold text-white mb-2 uppercase tracking-wider">Opportunities to Strengthen</h3>
                <ul className="space-y-1.5">
                  {(keyGaps.length > 0 ? keyGaps : [{ text: 'Analysis pending...', detail: '' }]).map((s, i) => (
                    <li key={i}>
                      <div
                        className="flex items-start gap-2 text-sm text-white/90 cursor-pointer hover:text-white transition-colors"
                        onClick={() => setExpandedOpps(expandedOpps === i ? null : i)}
                      >
                        <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                        <span>{s.text}</span>
                      </div>
                      {s.detail && (
                        <div
                          className="overflow-hidden transition-[max-height,opacity] duration-200"
                          style={{ maxHeight: expandedOpps === i ? '100px' : '0px', opacity: expandedOpps === i ? 1 : 0 }}
                        >
                          <p className="text-xs text-white/60 ml-6 mt-1 leading-relaxed">{s.detail}</p>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Strategic Direction */}
            <div className="rounded-xl border border-white/25 bg-white/10 p-3 px-4 space-y-2">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Strategic Direction</h3>
              {strategicPitch && (
                <div className="rounded-lg bg-purple-500/10 border-l-4 border-l-purple-400/60 p-3">
                  <div className="text-xs uppercase tracking-wide text-white/50 mb-1">Coaching Pitch</div>
                  <p className="text-sm text-white/90 leading-relaxed italic">
                    "{strategicPitch}"
                  </p>
                </div>
              )}
              {currentState && (
                <div>
                  <div className="text-xs uppercase tracking-wide text-white/50 mb-0.5">Current State</div>
                  <p className="text-sm text-white/80 leading-relaxed">{currentState}</p>
                </div>
              )}
              {strategicDirection && (
                <div>
                  <div className="text-xs uppercase tracking-wide text-white/50 mb-0.5">Strategic Direction</div>
                  <p className="text-sm text-white/80 leading-relaxed">{strategicDirection}</p>
                </div>
              )}
              <button
                className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer transition-colors mt-1"
                onClick={() => setActiveTab('action-plan')}
              >
                See Full Action Plan →
              </button>
            </div>

            </div>
          ) : (
            /* ============ EXPANDED DETAIL VIEWS ============ */
            <div className="transition-opacity duration-300 animate-fade-in space-y-4">
              <button
                className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white cursor-pointer transition-colors"
                onClick={() => setExpandedSection(null)}
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Overview</span>
              </button>

              {/* ---- SPIKE EXPANDED VIEW ---- */}
              {expandedSection === 'spike' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    Your Spike: {data.stage0?.spikeHypothesis?.spikeArea ?? 'Analyzing...'}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 capitalize">
                      {data.stage0?.spikeHypothesis?.maturity ?? 'unknown'}
                    </span>
                  </h2>
                  {data.stage0?.spikeHypothesis?.evidence && (
                    <div className="border-l-4 border-l-teal-400 pl-4 py-2 mb-3">
                      <h4 className="text-sm font-semibold text-white mb-2">Evidence</h4>
                      <p className="text-sm text-white/80 leading-relaxed">{data.stage0.spikeHypothesis.evidence}</p>
                    </div>
                  )}
                  {data.stage1?.spikeAnalysis && (
                    <div className="border-l-4 border-l-purple-400 pl-4 py-2 mb-3">
                      <h4 className="text-sm font-semibold text-white mb-2">Spike Analysis</h4>
                      <p className="text-sm text-white/80 leading-relaxed">{data.stage1.spikeAnalysis.spikeNarrative ?? ''}</p>
                    </div>
                  )}
                  {(data.stage0?.spikeHypothesis?.spikeActivityIds ?? []).length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-white mb-2 uppercase tracking-wider">Supporting Activities</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {(data.stage0?.spikeHypothesis?.spikeActivityIds ?? []).map((id) => (
                          <span key={id} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            {activityTitles[id] || id}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {data.stage1?.coherenceAnalysis && (
                    <div>
                      <h3 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider">Portfolio Coherence</h3>
                      <div className="flex flex-col items-center gap-1 mb-4 w-fit">
                        <svg width="80" height="80" viewBox="0 0 100 100" className="flex-shrink-0">
                          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                          <circle cx="50" cy="50" r="40" fill="none" stroke="#60a5fa" strokeWidth="8"
                            strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - (data.stage1?.coherenceAnalysis?.score ?? 0) / 100)}
                            strokeLinecap="round" transform="rotate(-90 50 50)" />
                          <text x="50" y="55" textAnchor="middle" className="fill-white text-xl font-bold" fontSize="22">{data.stage1?.coherenceAnalysis?.score ?? 0}</text>
                        </svg>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/30 capitalize">
                          {data.stage1?.coherenceAnalysis?.assessment ?? 'unknown'}
                        </span>
                      </div>
                      {data.stage1?.coherenceAnalysis?.narrativeThread && (
                        <div className="mb-3 mt-3">
                          <h4 className="text-xs font-semibold text-white/80 mb-1">What Ties It Together</h4>
                          <p className="text-sm text-white/70 leading-relaxed">{data.stage1.coherenceAnalysis.narrativeThread}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ---- MEMORABLE EXPANDED VIEW ---- */}
              {expandedSection === 'memorable' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-white">What Sets You Apart</h2>
                  <div className="bg-white/15 border-l-4 border-l-amber-400 rounded-r-lg p-4">
                    <p className="text-sm text-white/90 italic leading-relaxed">"{memorableElement}"</p>
                  </div>
                  {(data.scoring?.portfolioRubric?.narrative?.differentiators ?? []).length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-white mb-2">Your Differentiators</h3>
                      <ul className="space-y-1.5">
                        {(data.scoring?.portfolioRubric?.narrative?.differentiators ?? []).map((d, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                            <span className="text-blue-400 mt-0.5">•</span>
                            <span>{d}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(data.finalNarrative?.positioning?.schoolFit ?? []).length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-white mb-2">School Types That Fit</h3>
                      <div className="flex flex-wrap gap-2">
                        {(data.finalNarrative?.positioning?.schoolFit ?? []).map((t) => (
                          <span key={t} className="text-xs px-3 py-1 rounded-full bg-white/15 text-white/80 border border-white/20">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ---- PRIORITY EXPANDED VIEW ---- */}
              {expandedSection === 'priority' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-white">Your Top Priorities</h2>
                  <div className="space-y-3">
                    {(data.scoring?.portfolioRubric?.prioritizedRecommendations ?? []).map((rec, i) => (
                      <div key={i} className="rounded-xl border border-white/25 bg-white/15 p-4">
                        <h4 className="text-sm font-bold text-white mb-2">{rec.recommendation ?? ''}</h4>
                        <p className="text-sm text-white/80 leading-relaxed mb-2">{rec.impact ?? ''}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/15 text-white/60 capitalize">{rec.effort ?? ''} effort</span>
                      </div>
                    ))}
                    {(data.scoring?.portfolioRubric?.prioritizedRecommendations ?? []).length === 0 && (
                      <p className="text-sm text-white/60">Analysis pending...</p>
                    )}
                  </div>
                  <button
                    className="text-sm text-blue-400 hover:text-blue-300 cursor-pointer transition-colors font-medium"
                    onClick={() => { setExpandedSection(null); setActiveTab('action-plan'); }}
                  >
                    See Full Action Plan →
                  </button>
                </div>
              )}

              {/* ---- NARRATIVE EXPANDED VIEW ---- */}
              {expandedSection === 'narrative' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-white">Your Portfolio Story</h2>
                  <div className="border-l-4 border-l-blue-400/50 pl-4 py-1">
                    <p className="text-white/90 text-base leading-7">{narrativeText}</p>
                  </div>
                  {data.scoring?.portfolioRubric?.narrative?.twoSentencePitch && (
                    <div>
                      <h3 className="text-sm font-semibold text-white mb-2">Two-Sentence Pitch</h3>
                      <p className="text-sm text-white/80 leading-relaxed">
                        {data.scoring.portfolioRubric.narrative.twoSentencePitch}
                      </p>
                    </div>
                  )}
                  {(data.finalNarrative?.story?.emergentTraits ?? []).length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-white mb-2">Character Traits</h3>
                      <div className="flex flex-wrap gap-2">
                        {(data.finalNarrative?.story?.emergentTraits ?? []).map((trait, i) => {
                          const colors = ['bg-green-500/20 text-green-300 border-green-500/30', 'bg-blue-500/20 text-blue-300 border-blue-500/30', 'bg-amber-500/20 text-amber-300 border-amber-500/30', 'bg-purple-500/20 text-purple-300 border-purple-500/30'];
                          return (
                            <span key={i} className={`text-xs px-3 py-1 rounded-full border capitalize ${colors[i % colors.length]}`}>{trait}</span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {(data.finalNarrative?.threads ?? []).length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-white mb-2 uppercase tracking-wider">Narrative Threads Preview</h3>
                      <div className="space-y-3">
                        {(data.finalNarrative?.threads ?? []).map((t, i) => (
                          <div key={i} className="rounded-xl border border-white/20 bg-white/10 p-3">
                            <h4 className="text-sm font-semibold text-white mb-1">{t.name}</h4>
                            <div className="flex flex-wrap gap-1.5 mb-1.5">
                              {(t.activityIds ?? []).map((id) => (
                                <span key={id} className="text-[10px] px-2 py-0.5 rounded-full bg-white/15 text-white/60">{activityTitles[id] || id}</span>
                              ))}
                            </div>
                            <p className="text-xs text-white/70 leading-relaxed">{t.synergy ?? ''}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    className="text-sm text-blue-400 hover:text-blue-300 cursor-pointer transition-colors font-medium"
                    onClick={() => { setExpandedSection(null); setActiveTab('your-story'); }}
                  >
                    Explore all narrative threads →
                  </button>
                </div>
              )}
            </div>
          )}

          </TabsContent>

          {/* ============ YOUR STORY TAB (lazy) ============ */}
          {activeTab === 'your-story' && <div className="mt-4 space-y-4">
            {/* Story Pitch */}
            {data.finalNarrative && (
              <>
                <div className="border-l-4 border-l-blue-400/50 pl-4 py-2">
                  <div className="text-xs uppercase tracking-widest text-white/60 font-semibold mb-2">Your Story Pitch</div>
                  <p className="text-white/90 text-sm leading-relaxed italic">
                    "{data.finalNarrative?.story?.pitch ?? 'Analysis pending...'}"
                  </p>
                </div>

                <div className="rounded-xl border border-white/20 bg-white/10 p-4">
                  <h4 className="text-sm font-semibold text-white mb-1">Unique Angle</h4>
                  <p className="text-sm text-white/80 leading-relaxed">{data.finalNarrative?.story?.uniqueAngle ?? ''}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {(data.finalNarrative?.story?.emergentTraits ?? []).map((trait) => (
                      <span key={trait} className="text-xs px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 capitalize">{trait}</span>
                    ))}
                  </div>
                </div>

                {/* Narrative Threads */}
                {(data.finalNarrative?.threads ?? []).length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider">Narrative Threads</h3>
                    <div className="space-y-3">
                      {(data.finalNarrative?.threads ?? []).map((t, i) => (
                        <div key={i} className="rounded-xl border border-white/20 bg-white/10 p-3">
                          <h4 className="text-sm font-semibold text-white mb-1">{t.name}</h4>
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {(t.activityIds ?? []).map((id) => (
                              <span key={id} className="text-[10px] px-2 py-0.5 rounded-full bg-white/15 text-white/60">
                                {activityTitles[id] || id}
                              </span>
                            ))}
                          </div>
                          <p className="text-xs text-white/70 leading-relaxed">{t.synergy ?? ''}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Elevation Pairs */}
                {(data.finalNarrative?.elevations ?? []).length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider">How Activities Boost Each Other</h3>
                    <div className="space-y-3">
                      {(data.finalNarrative?.elevations ?? []).map((pair, i) => {
                        const badgeStyles = {
                          transformative: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
                          strong: 'bg-green-500/20 text-green-300 border-green-500/30',
                          moderate: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
                          subtle: 'bg-white/15 text-white/60 border-white/20',
                        };
                        return (
                          <div key={i} className="rounded-xl border border-white/20 bg-white/10 p-3">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-sm font-semibold text-white">
                                {activityTitles[pair.elevatingActivityId] || pair.elevatingActivityId} → {activityTitles[pair.elevatedActivityId] || pair.elevatedActivityId}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${badgeStyles[pair.strength] ?? badgeStyles.subtle}`}>{pair.strength}</span>
                            </div>
                            <p className="text-xs text-white/70 leading-relaxed">{pair.mechanism ?? ''}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Coherence */}
                {data.finalNarrative?.coherence && (
                  <div className="rounded-xl border border-white/20 bg-white/10 p-4 flex items-center gap-4">
                    <div className="flex flex-col items-center gap-1">
                      <svg width="64" height="64" viewBox="0 0 100 100" className="flex-shrink-0">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#60a5fa" strokeWidth="8"
                          strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - (data.finalNarrative?.coherence?.score ?? 0) / 100)}
                          strokeLinecap="round" transform="rotate(-90 50 50)" />
                        <text x="50" y="55" textAnchor="middle" className="fill-white text-xl font-bold" fontSize="22">{data.finalNarrative?.coherence?.score ?? 0}</text>
                      </svg>
                      <span className="text-[10px] text-white/50 uppercase tracking-wider">Coherence</span>
                    </div>
                    <p className="text-sm text-white/80 leading-relaxed flex-1">{data.finalNarrative?.coherence?.assessment ?? ''}</p>
                  </div>
                )}
              </>
            )}
            {!data.finalNarrative && (
              <p className="text-sm text-white/60 text-center py-8">Story analysis pending...</p>
            )}
          </div>}

          {/* ============ YOUR EDGE TAB (lazy) ============ */}
          {activeTab === 'your-edge' && <div className="mt-4 space-y-4">
            {/* Harvard Scale Assessment */}
            <div className="rounded-xl border border-white/25 bg-white/15 p-5 text-center">
              <div className="text-xs uppercase tracking-widest text-white/50 font-semibold mb-2">Harvard Scale Rating</div>
              <div className="text-5xl font-bold text-white mb-1">{data.stage3?.finalAssessment?.harvardScale ?? '—'}</div>
              <div className="text-sm text-teal-400 font-medium capitalize">
                {data.scoring?.portfolioRubric?.harvardScale?.description ?? data.stage3?.finalAssessment?.overallStrength ?? ''}
              </div>
              <div className="text-xs text-white/50 mt-1">{data.stage3?.finalAssessment?.confidence ?? 0}% confidence</div>
            </div>

            {/* Activity Rankings */}
            {(data.stage3?.orderedActivities ?? []).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider">Activity Impact Ranking</h3>
                <div className="space-y-2">
                  {(data.stage3?.orderedActivities ?? []).map((act) => (
                    <div key={act.activityId} className="flex items-center gap-3 rounded-lg border border-white/15 bg-white/10 p-3">
                      <span className="text-lg font-bold text-white/40 w-6 text-center">#{act.rank}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-white">{activityTitles[act.activityId] || act.activityId}</span>
                        <p className="text-xs text-white/60 mt-0.5">{act.reason ?? ''}</p>
                      </div>
                      {data.scoring?.activityScores?.find(s => s.activityId === act.activityId) && (
                        <span className={`text-sm font-bold ${getScoreCardColor(
                          data.scoring.activityScores.find(s => s.activityId === act.activityId)!.combinedScore.total
                        )}`}>
                          {data.scoring.activityScores.find(s => s.activityId === act.activityId)!.combinedScore.total.toFixed(1)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Spike */}
            {data.finalNarrative?.spike && (
              <div className="rounded-xl border border-white/20 bg-white/10 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-blue-400" />
                  <h3 className="text-sm font-semibold text-white">Primary Spike</h3>
                </div>
                <p className="text-sm text-white/90 font-medium mb-2">{data.finalNarrative.spike.primarySpike?.area ?? ''}</p>
                <div className="flex flex-wrap gap-1.5">
                  {(data.finalNarrative.spike.primarySpike?.activities ?? []).map((id) => (
                    <span key={id} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {activityTitles[id] || id}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tier Distribution */}
            {data.stage1?.tierDistribution && (
              <div className="rounded-xl border border-white/20 bg-white/10 p-4">
                <h3 className="text-sm font-semibold text-white mb-3">Tier Distribution</h3>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { tier: 1, label: 'Elite', count: data.stage1?.tierDistribution?.tier1 ?? 0, color: 'text-purple-400' },
                    { tier: 2, label: 'Strong', count: data.stage1?.tierDistribution?.tier2 ?? 0, color: 'text-blue-400' },
                    { tier: 3, label: 'Solid', count: data.stage1?.tierDistribution?.tier3 ?? 0, color: 'text-teal-400' },
                    { tier: 4, label: 'Basic', count: data.stage1?.tierDistribution?.tier4 ?? 0, color: 'text-amber-400' },
                  ].map((t) => (
                    <div key={t.tier} className="text-center rounded-lg border border-white/15 bg-white/5 p-2">
                      <div className={`text-2xl font-bold ${t.color}`}>{t.count}</div>
                      <div className="text-[10px] text-white/50 uppercase tracking-wider">Tier {t.tier}</div>
                      <div className="text-[10px] text-white/40">{t.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>}

          {/* ============ ACTION PLAN TAB (lazy) ============ */}
          {activeTab === 'action-plan' && <div className="mt-4 space-y-4">
            {/* Immediate Actions */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 text-[10px] font-bold uppercase">Now</span>
                <span className="uppercase tracking-wider">Immediate Actions</span>
              </h3>
              <div className="space-y-2">
                {(data.stage3?.actionPlan?.immediate ?? []).map((item, i) => (
                  <div key={i} className="rounded-xl border border-white/20 bg-white/10 p-4">
                    <h4 className="text-sm font-semibold text-white mb-1">{item.action ?? ''}</h4>
                    <p className="text-xs text-white/60 leading-relaxed">Impact: {item.impact ?? ''}</p>
                  </div>
                ))}
                {(data.stage3?.actionPlan?.immediate ?? []).length === 0 && (
                  <p className="text-sm text-white/60">No immediate actions identified yet.</p>
                )}
              </div>
            </div>

            {/* Short-term Actions */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase">1-3 mo</span>
                <span className="uppercase tracking-wider">Short-Term Goals</span>
              </h3>
              <div className="space-y-2">
                {(data.stage3?.actionPlan?.shortTerm ?? []).map((item, i) => (
                  <div key={i} className="rounded-xl border border-white/20 bg-white/10 p-4">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-semibold text-white">{item.action ?? ''}</h4>
                      {item.deadline && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/50 whitespace-nowrap">{item.deadline}</span>
                      )}
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed">Impact: {item.impact ?? ''}</p>
                  </div>
                ))}
                {(data.stage3?.actionPlan?.shortTerm ?? []).length === 0 && (
                  <p className="text-sm text-white/60">No short-term goals identified yet.</p>
                )}
              </div>
            </div>

            {/* Long-term Actions */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-bold uppercase">3-6 mo</span>
                <span className="uppercase tracking-wider">Long-Term Vision</span>
              </h3>
              <div className="space-y-2">
                {(data.stage3?.actionPlan?.longTerm ?? []).map((item, i) => (
                  <div key={i} className="rounded-xl border border-white/20 bg-white/10 p-4">
                    <h4 className="text-sm font-semibold text-white mb-1">{item.action ?? ''}</h4>
                    <p className="text-xs text-white/60 leading-relaxed">Impact: {item.impact ?? ''}</p>
                  </div>
                ))}
                {(data.stage3?.actionPlan?.longTerm ?? []).length === 0 && (
                  <p className="text-sm text-white/60">No long-term goals identified yet.</p>
                )}
              </div>
            </div>
          </div>}
        </Tabs>
  );
});

export default PortfolioOverviewPanel;
