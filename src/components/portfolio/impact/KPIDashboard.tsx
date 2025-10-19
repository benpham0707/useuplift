import React, { useState } from 'react';
import { KPICard } from './KPICard';
import { KPIModal } from './KPIModal';

export interface KPI {
  id: string;
  value: string | number;
  label: string;
  context: string;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    change: string;
  };
  significance: string;
}

interface KPIDashboardProps {
  kpis: KPI[];
}

export const KPIDashboard: React.FC<KPIDashboardProps> = ({ kpis }) => {
  const [selectedKpi, setSelectedKpi] = useState<KPI | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KPICard 
            key={kpi.id} 
            kpi={kpi} 
            onOpenModal={setSelectedKpi}
          />
        ))}
      </div>
      
      <KPIModal
        kpi={selectedKpi}
        isOpen={!!selectedKpi}
        onClose={() => setSelectedKpi(null)}
      />
    </>
  );
};