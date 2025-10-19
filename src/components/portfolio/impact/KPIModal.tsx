import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { KPI } from './KPIDashboard';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPIModalProps {
  kpi: KPI | null;
  isOpen: boolean;
  onClose: () => void;
}

export const KPIModal: React.FC<KPIModalProps> = ({ kpi, isOpen, onClose }) => {
  if (!kpi) return null;

  const getTrendIcon = (direction: 'up' | 'down' | 'stable') => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      case 'stable':
        return <Minus className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-3xl font-extrabold text-primary">
            {kpi.value}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-foreground">{kpi.label}</h3>
            {kpi.trend && (
              <div className="flex items-center gap-2">
                {getTrendIcon(kpi.trend.direction)}
                <span className="text-muted-foreground">{kpi.trend.change}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">Context</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {kpi.context}
            </p>
          </div>

          <div className="p-4 bg-primary/5 rounded-lg space-y-2">
            <h4 className="text-sm font-semibold text-foreground">Why This Matters</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {kpi.significance}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};