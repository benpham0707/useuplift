import { useState } from "react";
import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Award, Target, ChevronDown } from "lucide-react";
import { PortfolioProgressData } from "./types/portfolioTypes";
import { InteractiveProgressBar } from "./InteractiveProgressBar";
import { ProgressTrajectoryTab } from "./ProgressTrajectoryTab";
import { LocalStandingTab } from "./LocalStandingTab";
import { NationalStandingTab } from "./NationalStandingTab";

interface PortfolioProgressStandingProps {
  data: PortfolioProgressData;
}

export function PortfolioProgressStanding({ data }: PortfolioProgressStandingProps) {
  console.log('PortfolioProgressStanding received data:', {
    hasTrajectory: !!data?.trajectory,
    hasCurrent: !!data?.current,
    hasHistory: !!data?.history,
    trajectoryKeys: data?.trajectory ? Object.keys(data.trajectory) : 'no trajectory',
  });
  
  const { current, history, competitiveStanding, trajectory, projection } = data;
  const [isExpanded, setIsExpanded] = useState(false);

  const growthPoints = history[history.length - 1].score - history[0].score;
  const timeframe = "3 months";

  // Calculate tier progress (hardcoded data - this is placeholder for actual tier thresholds)
  const tierProgress = 75;
  const pointsToNext = 3.2;
  
  // Safety check for trajectory
  if (!trajectory) {
    console.error('Trajectory data is missing:', data);
    return (
      <Card className="bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Loading trajectory data...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 overflow-hidden">
      <CardContent className="p-6">
        {/* Collapsed View */}
        <div className="space-y-6">
          {/* Visual Gauge */}

          {/* Interactive Progress Bar */}
          <InteractiveProgressBar 
            history={history}
            currentScore={current.score}
          />

          {/* Key Stats Row */}
          <div className="grid grid-cols-3 gap-3">
            {/* Growth */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-success/10 to-success/5 rounded-lg p-4 text-center border border-success/20"
            >
              <TrendingUp className="w-5 h-5 mx-auto mb-2 text-success" />
              <div className="text-2xl font-bold text-success">+{growthPoints}</div>
              <div className="text-xs text-muted-foreground">{timeframe}</div>
            </motion.div>

            {/* Percentile */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-4 text-center border border-primary/20"
            >
              <Award className="w-5 h-5 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold text-primary">{current.percentile}</div>
              <div className="text-xs text-muted-foreground">Nationally</div>
            </motion.div>

            {/* Tier Progress */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg p-4 text-center border border-accent/20"
            >
              <Target className="w-5 h-5 mx-auto mb-2 text-accent" />
              <div className="text-2xl font-bold text-accent">{tierProgress}%</div>
              <div className="text-xs text-muted-foreground">{pointsToNext} pts needed</div>
            </motion.div>
          </div>

          {/* Summary Line */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-muted-foreground leading-relaxed bg-muted/30 rounded-lg p-4"
          >
            Your portfolio has grown <span className="font-semibold text-foreground">+{growthPoints} points</span> in {timeframe}, 
            placing you in the <span className="font-semibold text-foreground">{current.percentile}</span> and making 
            you <span className="font-semibold text-foreground">competitive for selective universities</span> like Northwestern 
            and Duke. Adding one more national recognition could move you to the <span className="font-semibold text-foreground">top 10%</span>.
          </motion.div>

          {/* Expand Button */}
          <Button
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full justify-between group"
          >
            <span>View Competitive Analysis</span>
            <ChevronDown 
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
          </Button>
        </div>

        {/* Expanded View */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6 pt-6 border-t"
          >
            <Tabs defaultValue="trajectory" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="trajectory">Progress & Trajectory</TabsTrigger>
                <TabsTrigger value="local">Local Standing</TabsTrigger>
                <TabsTrigger value="national">National Standing</TabsTrigger>
              </TabsList>

              <TabsContent value="trajectory" className="mt-6">
                <ProgressTrajectoryTab 
                  history={history}
                  trajectory={trajectory}
                  projection={projection}
                />
              </TabsContent>

              <TabsContent value="local" className="mt-6">
                <LocalStandingTab 
                  data={competitiveStanding.local}
                  tiers={competitiveStanding.tiers}
                  yourScore={current.score}
                />
              </TabsContent>

              <TabsContent value="national" className="mt-6">
                <NationalStandingTab 
                  data={competitiveStanding.national}
                  tiers={competitiveStanding.tiers}
                  yourScore={current.score}
                />
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
