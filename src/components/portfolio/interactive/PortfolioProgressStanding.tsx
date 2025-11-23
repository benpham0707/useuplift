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
  const { current, history, competitiveStanding, trajectory, projection } = data;
  const [isExpanded, setIsExpanded] = useState(false);

  const growthPoints = history[history.length - 1].score - history[0].score;
  const timeframe = "3 months";

  // Calculate tier progress (hardcoded data - this is placeholder for actual tier thresholds)
  const tierProgress = 75;
  const pointsToNext = 3.2;

  return (
    <Card className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 overflow-hidden">
      <CardContent className="p-6">
        {/* Collapsed View */}
        <div className="space-y-6">
          {/* Visual Gauge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Circular Progress Ring */}
            <div className="relative inline-flex items-center justify-center w-48 h-48 mb-4">
              {/* Background ring */}
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="hsl(var(--muted))"
                  strokeWidth="8"
                  fill="none"
                />
                {/* Progress ring with gradient */}
                <defs>
                  <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="50%" stopColor="hsl(var(--secondary))" />
                    <stop offset="100%" stopColor="hsl(var(--accent))" />
                  </linearGradient>
                </defs>
                <motion.circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="url(#progress-gradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: "0 552.9" }}
                  animate={{ strokeDasharray: `${(current.score / 100) * 552.9} 552.9` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  style={{ filter: "drop-shadow(0 0 8px hsl(var(--primary) / 0.4))" }}
                />
              </svg>

              {/* Score in center */}
              <div className="relative z-10">
                <div className="text-6xl font-extrabold bg-gradient-to-br from-primary via-secondary to-accent bg-clip-text text-transparent">
                  {current.score}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Portfolio Score</div>
              </div>
            </div>

            {/* Tier Badge */}
            <Badge variant="secondary" className="text-base px-4 py-1.5">
              {current.tier}
            </Badge>
          </motion.div>

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
