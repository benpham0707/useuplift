import React, { useState } from 'react';
import { RecognitionOverview, RecognitionOverviewData } from './RecognitionOverview';
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

  const handleViewRecognition = (recognition: RecognitionItem) => {
    setSelectedRecognition(recognition);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="space-y-8">
        {/* Overview Hero */}
        <RecognitionOverview data={overview} recognitions={recognitions} />

        {/* Main Dashboard */}
        <div className="space-y-4">
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
