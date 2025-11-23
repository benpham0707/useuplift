import React from 'react';
import { motion } from 'motion/react';
import { Badge } from '@/components/ui/badge';
import { MapPin, Globe, CheckCircle, AlertCircle, Target } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

interface ComparisonData {
  region: string;
  percentile: string;
  yourScore: number;
  avgScore: number;
  spectrum: { min: number; max: number; position: number };
  schoolContext: string;
  strongFor?: string[];
  competitiveFor?: string[];
  reachingFor?: string[];
}

interface TierData {
  name: string;
  schools: string[];
  gap: number;
  admissionProbability: { min: number; max: number };
  status: 'strong' | 'competitive' | 'challenging';
}

interface CompetitiveComparisonProps {
  local: ComparisonData;
  national: ComparisonData;
  tiers: {
    safety: TierData;
    target: TierData;
    reach: TierData;
  };
}

const MiniSpectrum: React.FC<{ yourScore: number; spectrum: any }> = ({ yourScore, spectrum }) => {
  const position = ((yourScore - spectrum.min) / (spectrum.max - spectrum.min)) * 100;

  return (
    <div className="relative h-6 w-full rounded-full bg-gradient-to-r from-green-500/20 via-amber-500/20 to-red-500/20 border border-border">
      <motion.div
        initial={{ left: 0 }}
        animate={{ left: `${position}%` }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
        style={{ left: `${position}%` }}
      >
        <div className="w-4 h-4 rounded-full bg-primary ring-2 ring-background shadow-lg" />
      </motion.div>
    </div>
  );
};

export const CompetitiveComparison: React.FC<CompetitiveComparisonProps> = ({
  local,
  national,
  tiers,
}) => {
  const [expandedTier, setExpandedTier] = React.useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Two-column comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Local Comparison */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="p-6 rounded-xl bg-gradient-to-br from-primary/5 to-background border"
        >
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">Your State / District</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="text-3xl font-bold text-foreground">{local.percentile}</div>
              <div className="text-sm text-muted-foreground">in {local.region}</div>
            </div>

            <MiniSpectrum yourScore={local.yourScore} spectrum={local.spectrum} />

            <div className="space-y-2">
              {local.strongFor && local.strongFor.length > 0 && (
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <span className="font-semibold text-green-600">Strong for:</span> {local.strongFor.join(', ')}
                  </div>
                </div>
              )}
              {local.competitiveFor && local.competitiveFor.length > 0 && (
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <span className="font-semibold text-amber-600">Competitive for:</span> {local.competitiveFor.join(', ')}
                  </div>
                </div>
              )}
            </div>

            <p className="text-sm text-muted-foreground italic">{local.schoolContext}</p>
          </div>
        </motion.div>

        {/* National Comparison */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="p-6 rounded-xl bg-gradient-to-br from-secondary/5 to-background border"
        >
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-secondary" />
            <h3 className="font-bold text-lg">National Standing</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="text-3xl font-bold text-foreground">{national.percentile}</div>
              <div className="text-sm text-muted-foreground">nationally</div>
            </div>

            <MiniSpectrum yourScore={national.yourScore} spectrum={national.spectrum} />

            <div className="space-y-2">
              {national.competitiveFor && national.competitiveFor.length > 0 && (
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <span className="font-semibold text-amber-600">Competitive for:</span> {national.competitiveFor.join(', ')}
                  </div>
                </div>
              )}
              {national.reachingFor && national.reachingFor.length > 0 && (
                <div className="flex items-start gap-2">
                  <Target className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <span className="font-semibold text-red-600">Reaching for:</span> {national.reachingFor.join(', ')}
                  </div>
                </div>
              )}
            </div>

            <p className="text-sm text-muted-foreground italic">{national.schoolContext}</p>
          </div>
        </motion.div>
      </div>

      {/* School Tier Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="border rounded-xl overflow-hidden"
      >
        <div className="grid grid-cols-3 divide-x bg-muted/30">
          {/* Safety Tier */}
          <Collapsible open={expandedTier === 'safety'} onOpenChange={() => setExpandedTier(expandedTier === 'safety' ? null : 'safety')}>
            <CollapsibleTrigger className="w-full p-4 text-left hover:bg-muted/50 transition-colors">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Safety</h4>
                  <Badge variant="outline" className="text-xs bg-green-500/10 text-green-700 dark:text-green-400">
                    {tiers.safety.admissionProbability.min}-{tiers.safety.admissionProbability.max}%
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground line-clamp-1">
                  {tiers.safety.schools.slice(0, 2).join(', ')}
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  <span className="text-green-600 font-semibold">Above threshold</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedTier === 'safety' ? 'rotate-180' : ''}`} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4">
              <div className="space-y-2 pt-2 border-t">
                <div className="text-xs space-y-1">
                  {tiers.safety.schools.map((school, i) => (
                    <div key={i} className="text-muted-foreground">• {school}</div>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Target Tier */}
          <Collapsible open={expandedTier === 'target'} onOpenChange={() => setExpandedTier(expandedTier === 'target' ? null : 'target')}>
            <CollapsibleTrigger className="w-full p-4 text-left hover:bg-muted/50 transition-colors">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Target</h4>
                  <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400">
                    {tiers.target.admissionProbability.min}-{tiers.target.admissionProbability.max}%
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground line-clamp-1">
                  {tiers.target.schools.slice(0, 2).join(', ')}
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <AlertCircle className="w-3 h-3 text-amber-600" />
                  <span className="text-amber-600 font-semibold">Gap: {Math.abs(tiers.target.gap)} pts</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedTier === 'target' ? 'rotate-180' : ''}`} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4">
              <div className="space-y-2 pt-2 border-t">
                <div className="text-xs space-y-1">
                  {tiers.target.schools.map((school, i) => (
                    <div key={i} className="text-muted-foreground">• {school}</div>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Reach Tier */}
          <Collapsible open={expandedTier === 'reach'} onOpenChange={() => setExpandedTier(expandedTier === 'reach' ? null : 'reach')}>
            <CollapsibleTrigger className="w-full p-4 text-left hover:bg-muted/50 transition-colors">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Reach</h4>
                  <Badge variant="outline" className="text-xs bg-red-500/10 text-red-700 dark:text-red-400">
                    {tiers.reach.admissionProbability.min}-{tiers.reach.admissionProbability.max}%
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground line-clamp-1">
                  {tiers.reach.schools.slice(0, 2).join(', ')}
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <Target className="w-3 h-3 text-red-600" />
                  <span className="text-red-600 font-semibold">Gap: {Math.abs(tiers.reach.gap)} pts</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedTier === 'reach' ? 'rotate-180' : ''}`} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4">
              <div className="space-y-2 pt-2 border-t">
                <div className="text-xs space-y-1">
                  {tiers.reach.schools.map((school, i) => (
                    <div key={i} className="text-muted-foreground">• {school}</div>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </motion.div>
    </div>
  );
};
