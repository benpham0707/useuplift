import React from 'react';
import { motion } from 'motion/react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Badge } from '@/components/ui/badge';
import { Target } from 'lucide-react';

interface CompetitiveSpectrumProps {
  yourScore: number;
  spectrum: {
    min: number;
    max: number;
    safetyRange: [number, number];
    targetRange: [number, number];
    reachRange: [number, number];
  };
}

export const CompetitiveSpectrum: React.FC<CompetitiveSpectrumProps> = ({ 
  yourScore, 
  spectrum 
}) => {
  // Calculate position percentage
  const getPosition = (score: number) => {
    return ((score - spectrum.min) / (spectrum.max - spectrum.min)) * 100;
  };

  const yourPosition = getPosition(yourScore);
  const safetyStart = getPosition(spectrum.safetyRange[0]);
  const safetyEnd = getPosition(spectrum.safetyRange[1]);
  const targetStart = getPosition(spectrum.targetRange[0]);
  const targetEnd = getPosition(spectrum.targetRange[1]);
  const reachStart = getPosition(spectrum.reachRange[0]);
  const reachEnd = getPosition(spectrum.reachRange[1]);

  // Determine which zone the user is in
  const getZoneStatus = () => {
    if (yourScore >= spectrum.reachRange[0]) return 'reach';
    if (yourScore >= spectrum.targetRange[0]) return 'target';
    return 'safety';
  };

  const zoneStatus = getZoneStatus();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground">Competitive Standing</h3>
        <Badge variant={zoneStatus === 'reach' ? 'default' : zoneStatus === 'target' ? 'secondary' : 'outline'}>
          {zoneStatus === 'reach' ? 'Reach Zone' : zoneStatus === 'target' ? 'Target Zone' : 'Safety Zone'}
        </Badge>
      </div>

      {/* Spectrum Bar */}
      <div className="relative h-16 w-full">
        {/* Background gradient bar */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-500/30 via-amber-500/30 to-red-500/30 border-2 border-border" />
        
        {/* Zone markers */}
        <div 
          className="absolute top-0 bottom-0 bg-green-500/20 border-l-2 border-r-2 border-green-500/40"
          style={{ left: `${safetyStart}%`, width: `${safetyEnd - safetyStart}%` }}
        />
        <div 
          className="absolute top-0 bottom-0 bg-amber-500/20 border-l-2 border-r-2 border-amber-500/40"
          style={{ left: `${targetStart}%`, width: `${targetEnd - targetStart}%` }}
        />
        <div 
          className="absolute top-0 bottom-0 bg-red-500/20 border-l-2 border-r-2 border-red-500/40"
          style={{ left: `${reachStart}%`, width: `${reachEnd - reachStart}%` }}
        />

        {/* Your position indicator */}
        <HoverCard>
          <HoverCardTrigger asChild>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-pointer z-10"
              style={{ left: `${yourPosition}%` }}
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg ring-4 ring-background">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-full bg-primary/30"
                />
              </div>
            </motion.div>
          </HoverCardTrigger>
          <HoverCardContent className="w-64">
            <div className="space-y-2">
              <h4 className="font-bold text-sm">Your Position</h4>
              <div className="text-2xl font-bold text-primary">{yourScore}</div>
              <p className="text-xs text-muted-foreground">
                You are in the <span className="font-semibold capitalize">{zoneStatus}</span> zone for competitive admissions.
              </p>
            </div>
          </HoverCardContent>
        </HoverCard>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-3 text-xs">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <div>
            <div className="font-semibold text-foreground">Safety</div>
            <div className="text-muted-foreground">{spectrum.safetyRange[0]}-{spectrum.safetyRange[1]}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <div>
            <div className="font-semibold text-foreground">Target</div>
            <div className="text-muted-foreground">{spectrum.targetRange[0]}-{spectrum.targetRange[1]}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div>
            <div className="font-semibold text-foreground">Reach</div>
            <div className="text-muted-foreground">{spectrum.reachRange[0]}-{spectrum.reachRange[1]}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
