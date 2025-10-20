import React, { useState } from 'react';
import { RecognitionOverview, RecognitionOverviewData } from './RecognitionOverview';
import { FlagshipRecognitionStrip, FlagshipRecognition } from './FlagshipRecognitionStrip';
import { RecognitionDashboard } from './RecognitionDashboard';
import { RecognitionItem } from './RecognitionCard';
import { RecognitionModal } from './RecognitionModal';

interface RecognitionTabProps {
  overview: RecognitionOverviewData;
  recognitions: RecognitionItem[];
}

export const RecognitionTab: React.FC<RecognitionTabProps> = ({ overview, recognitions }) => {
  const [selectedRecognition, setSelectedRecognition] = useState<RecognitionItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Generate top 3 flagship recognitions from sorted data
  const top3: FlagshipRecognition[] = [...recognitions]
    .sort((a, b) => b.scores.portfolioLift.overall - a.scores.portfolioLift.overall)
    .slice(0, 3)
    .map(rec => ({
      id: rec.id,
      name: rec.name,
      whyItMatters: rec.scores.portfolioLift.reasoning.split('.')[0], // First sentence
      portfolioLift: rec.scores.portfolioLift.overall,
      recommendedUse: rec.recommendedUse
    }));

  const handleViewRecognition = (recognition: RecognitionItem) => {
    setSelectedRecognition(recognition);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="space-y-8">
        {/* Overview Hero */}
        <RecognitionOverview data={overview} />

        {/* Top 3 Strip */}
        <FlagshipRecognitionStrip recognitions={top3} />

        {/* Main Dashboard */}
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">All Recognitions</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Sort and filter to prioritize which recognitions to feature in your applications
            </p>
          </div>
          <RecognitionDashboard 
            recognitions={recognitions}
            onViewRecognition={handleViewRecognition}
          />
        </div>
      </div>

      {/* Full-Page Analysis Modal */}
      <RecognitionModal
        recognition={selectedRecognition}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  );
};
