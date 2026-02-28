/**
 * InsightDetailView — Full detail view with tabbed navigation.
 *
 * Sticky header with back button + rank + title.
 * Tab bar: Overview | Description | Next Steps.
 * Transform content is integrated into the Description tab.
 * Each tab renders its section component in a scrollable area.
 * Quick-encouragement activities get simplified tabs.
 */
import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  BarChart3,
  FileText,
  Compass,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ActivityInsightData } from './insightTypes';
import {
  getRoleConfig,
} from './insightTypes';
import { OverviewTab } from './sections/CelebrationTab';
import { ActivityWorkshopDescription } from '@/components/workshop/ActivityWorkshopDescription';
import { NextStepsTab } from './sections/NextStepsTab';

interface InsightDetailViewProps {
  data: ActivityInsightData;
  onBack: () => void;
}

type TabValue = 'overview' | 'description' | 'next-steps';

const InsightDetailViewInner = function InsightDetailView({ data, onBack }: InsightDetailViewProps) {
  const roleCfg = getRoleConfig(data.storyRole);
  const hasDescription = data.descriptionOptimization !== null;

  // Active tab — only the selected tab's component is mounted
  const [activeTab, setActiveTab] = useState<TabValue>('overview');

  // Entrance animation flag
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className={`flex flex-col h-full transition-[opacity,transform] duration-200 ${
        entered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
      }`}
    >
      {/* ── Sticky Header — compact ── */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-3 py-2">
        <div className="flex items-center gap-2">
          {/* Back button */}
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Back</span>
          </button>

          {/* Rank + Title + badges — single row */}
          <span className="text-xs font-bold text-muted-foreground/35">#{data.rank}</span>
          <h2 className="text-sm font-semibold truncate flex-1 min-w-0">{data.title}</h2>
        </div>
      </div>

      {/* ── Tabbed Content (lazy: only active tab mounts) ── */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="flex-shrink-0 w-full justify-start rounded-none border-b bg-transparent px-4 pt-1 pb-0 h-auto gap-0">
          <TabsTrigger
            value="overview"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 pb-2 pt-1.5 text-xs font-medium"
          >
            <BarChart3 className="h-3.5 w-3.5 mr-1.5 hidden sm:inline-block" />
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="description"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 pb-2 pt-1.5 text-xs font-medium"
          >
            <FileText className="h-3.5 w-3.5 mr-1.5 hidden sm:inline-block" />
            Description
          </TabsTrigger>
          <TabsTrigger
            value="next-steps"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 pb-2 pt-1.5 text-xs font-medium"
          >
            <Compass className="h-3.5 w-3.5 mr-1.5 hidden sm:inline-block" />
            Next Steps
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'overview' && <OverviewTab data={data} />}
          {activeTab === 'description' && (
            hasDescription && data.descriptionOptimization ? (
              <ActivityWorkshopDescription
                optimization={data.descriptionOptimization}
                improvementTeaching={data.improvementTeaching}
                accentColor={roleCfg.accent}
                scoreProjection={data.transformation?.expectedScoreImprovement ?? null}
                transformation={data.transformation}
              />
            ) : (
              <div className="rounded-lg border bg-card p-6 text-center">
                <FileText className="h-5 w-5 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">
                  {data.teachingDepth === 'quick'
                    ? 'Run a full analysis to see description optimization suggestions.'
                    : 'Description optimization data is being prepared.'}
                </p>
              </div>
            )
          )}
          {activeTab === 'next-steps' && <NextStepsTab data={data} />}
        </div>
      </Tabs>
    </div>
  );
};

export const InsightDetailView = React.memo(InsightDetailViewInner);
