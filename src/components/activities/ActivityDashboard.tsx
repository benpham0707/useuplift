/**
 * ActivityDashboard — Standalone layout wrapper for the Hero Card list.
 *
 * Provides header controls (filter, add) and a stagger-animated grid.
 * Can render from real ActivityInsightData[] or fallback mock data.
 */
import { ActivityHeroCard } from "./ActivityHeroCard";
import GradientText from "@/components/ui/GradientText";
import { LayoutGrid, ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ActivityInsightData } from "../portfolio/activity-workshop/insightTypes";

interface ActivityDashboardProps {
  insights: ActivityInsightData[];
  onSelectActivity?: (activityId: string) => void;
}

export default function ActivityDashboard({
  insights,
  onSelectActivity,
}: ActivityDashboardProps) {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 p-8">
      {/* Header Controls */}
      <div className="flex items-center justify-between pb-4 border-b border-border/30">
        <div>
          <h1 className="text-3xl font-black tracking-tighter italic uppercase text-foreground">
            My <GradientText>Activities</GradientText>
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            Manage your profile&apos;s core pillars
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full gap-2 font-bold text-xs"
          >
            <ListFilter size={14} /> Filter
          </Button>
          <Button
            size="sm"
            className="rounded-full gap-2 font-bold text-xs bg-foreground text-background hover:bg-foreground/90"
          >
            <LayoutGrid size={14} /> Add New Activity
          </Button>
        </div>
      </div>

      {/* Hero Card List */}
      <div className="grid grid-cols-1 gap-6" style={{ perspective: 1000 }}>
        {insights.map((activity, idx) => (
          <ActivityHeroCard
            key={activity.activityId}
            index={idx}
            data={activity}
            onSelect={onSelectActivity}
          />
        ))}
      </div>
    </div>
  );
}
