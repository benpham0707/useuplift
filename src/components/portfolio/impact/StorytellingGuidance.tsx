import React, { useState } from 'react';
import { InsightCard } from './InsightCard';
import { InsightModal } from './InsightModal';

export interface GuidanceInsight {
  id: string;
  type: 'strength' | 'opportunity' | 'consideration' | 'strategy';
  headline: string;
  detail: string;
  actionable?: string;
}

interface StorytellingGuidanceProps {
  insights: GuidanceInsight[];
}

export const StorytellingGuidance: React.FC<StorytellingGuidanceProps> = ({ insights }) => {
  const [selectedInsight, setSelectedInsight] = useState<GuidanceInsight | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {insights.map((insight) => (
          <InsightCard
            key={insight.id}
            insight={insight}
            onExpand={setSelectedInsight}
          />
        ))}
      </div>

      <InsightModal
        insight={selectedInsight}
        isOpen={!!selectedInsight}
        onClose={() => setSelectedInsight(null)}
      />
    </>
  );
};