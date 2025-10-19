import React, { useState } from 'react';
import { InitiativeCard } from './InitiativeCard';
import { InitiativeModal } from './InitiativeModal';

export interface Initiative {
  id: string;
  name: string;
  beneficiary: {
    who: string;
    demographics?: string;
  };
  timeSpan: {
    start: string;
    end?: string;
    duration: string;
  };
  outcome: {
    primary: string;
    secondary?: string[];
    evidence: string[];
  };
  resources: {
    funding?: string;
    partners: string[];
    volunteers?: number;
  };
  durability: {
    status: 'ongoing' | 'handed-off' | 'completed';
    successor?: string;
  };
}

interface ImpactLedgerProps {
  initiatives: Initiative[];
}

export const ImpactLedger: React.FC<ImpactLedgerProps> = ({ initiatives }) => {
  const [selectedInitiative, setSelectedInitiative] = useState<Initiative | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {initiatives.map((initiative) => (
          <InitiativeCard
            key={initiative.id}
            initiative={initiative}
            onOpenModal={setSelectedInitiative}
          />
        ))}
      </div>

      <InitiativeModal
        initiative={selectedInitiative}
        isOpen={!!selectedInitiative}
        onClose={() => setSelectedInitiative(null)}
      />
    </>
  );
};