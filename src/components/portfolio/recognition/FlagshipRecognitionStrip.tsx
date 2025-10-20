import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FlagshipRecognition {
  id: string;
  name: string;
  whyItMatters: string;
  portfolioLift: number;
  recommendedUse: string;
}

interface FlagshipRecognitionStripProps {
  recognitions: FlagshipRecognition[];
}

const icons = [Trophy, Medal, Award];

const getRecommendedUseBadge = (use: string) => {
  const badges = {
    flagship: { label: 'FLAGSHIP', icon: '⭐', gradient: 'from-amber-500 to-yellow-400' },
    bridge: { label: 'BRIDGE', icon: '🌉', gradient: 'from-blue-500 to-cyan-400' },
    support: { label: 'SUPPORT', icon: '📋', gradient: 'from-green-500 to-emerald-400' }
  };
  return badges[use as keyof typeof badges] || badges.flagship;
};

export const FlagshipRecognitionStrip: React.FC<FlagshipRecognitionStripProps> = ({ recognitions }) => {
  const top3 = recognitions.slice(0, 3);

  return (
    <Card className="border-primary/20 overflow-hidden">
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h3 className="text-xl font-bold text-foreground">Your Top 3 Recognitions</h3>
          <span className="text-xs text-muted-foreground">(Highest Portfolio Lift)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {top3.map((rec, idx) => {
            const Icon = icons[idx];
            const badge = getRecommendedUseBadge(rec.recommendedUse);
            
            return (
              <div
                key={rec.id}
                className="relative p-5 rounded-xl border-2 border-primary/20 bg-gradient-to-br from-background to-muted/30 hover:border-primary/40 transition-all group"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={cn(
                    'p-2 rounded-lg bg-gradient-to-br shrink-0',
                    idx === 0 ? 'from-amber-500/20 to-yellow-400/20' :
                    idx === 1 ? 'from-blue-500/20 to-cyan-400/20' :
                    'from-green-500/20 to-emerald-400/20'
                  )}>
                    <Icon className={cn(
                      'w-5 h-5',
                      idx === 0 ? 'text-amber-500' :
                      idx === 1 ? 'text-blue-500' :
                      'text-green-500'
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-foreground text-sm leading-tight mb-1 line-clamp-2">
                      {rec.name}
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-primary">
                        Lift: {rec.portfolioLift.toFixed(1)}/10
                      </span>
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          'text-xs px-2 py-0 h-5 bg-gradient-to-r text-white',
                          badge.gradient
                        )}
                      >
                        {badge.icon} {badge.label}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground">Why it matters:</span> {rec.whyItMatters}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
