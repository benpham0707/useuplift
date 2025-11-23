import { useState } from "react";
import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, BarChart3 } from "lucide-react";
import { PortfolioProgressData } from "./types/portfolioTypes";
import { InteractiveProgressBar } from "./InteractiveProgressBar";
import { CompetitiveComparison } from "./CompetitiveComparison";

interface PortfolioProgressStandingProps {
  data: PortfolioProgressData;
}

export function PortfolioProgressStanding({ data }: PortfolioProgressStandingProps) {
  const { current, history, competitiveStanding } = data;
  
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);

  const growthPoints = history[history.length - 1].score - history[0].score;

  return (
    <Card className="bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <CardContent className="p-6">
        {/* Always Visible Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="pb-6 mb-6 border-b space-y-6"
        >
          {/* Hero Stats */}
          <div className="text-center">
            {/* Large Score Display */}
            <div className="text-7xl font-bold bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent mb-2">
              {current.score}
            </div>
            
            {/* Tier Badge */}
            <Badge variant="secondary" className="text-base px-4 py-1.5 mb-4">
              {current.tier}
            </Badge>

            {/* Compact 3-stat Grid */}
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <div className="text-lg font-semibold">{current.score}/100</div>
                <div className="text-xs text-muted-foreground">Score</div>
              </div>
              <div>
                <div className="text-lg font-semibold">{current.percentile}</div>
                <div className="text-xs text-muted-foreground">Percentile</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-green-600">+{growthPoints}</div>
                <div className="text-xs text-muted-foreground">Growth</div>
              </div>
            </div>
          </div>

          {/* Interactive Progress Bar */}
          <InteractiveProgressBar 
            history={history}
            currentScore={current.score}
          />
        </motion.div>

        {/* Expandable Detail Section */}
        <Collapsible open={isComparisonOpen} onOpenChange={setIsComparisonOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 rounded-lg transition-colors">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-primary" />
              <div className="text-left">
                <div className="font-semibold">How do you compare?</div>
                <div className="text-sm text-muted-foreground">
                  See your standing vs others in your area and nationally
                </div>
              </div>
            </div>
            <ChevronDown 
              className={`w-5 h-5 text-muted-foreground transition-transform ${
                isComparisonOpen ? 'rotate-180' : ''
              }`} 
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="px-5 pb-5 pt-4">
            <CompetitiveComparison
              local={competitiveStanding.local}
              national={competitiveStanding.national}
              tiers={competitiveStanding.tiers}
            />
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
