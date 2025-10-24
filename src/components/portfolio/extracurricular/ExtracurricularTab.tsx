import React from 'react';
import { ExtracurricularOverview, ExtracurricularOverviewData } from './ExtracurricularOverview';
import { ExtracurricularDashboard } from './ExtracurricularDashboard';
import { ExtracurricularItem } from './ExtracurricularCard';

interface ExtracurricularTabProps {
  overview: ExtracurricularOverviewData;
  activities: ExtracurricularItem[];
}

export const ExtracurricularTab: React.FC<ExtracurricularTabProps> = ({ overview, activities }) => {
  return (
    <div className="space-y-8">
      {/* Overview Hero */}
      <ExtracurricularOverview data={overview} activities={activities} />

      {/* Main Dashboard */}
      <div className="space-y-4">
        <ExtracurricularDashboard activities={activities} />
      </div>
    </div>
  );
};
