import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'motion/react';
import { Trophy, Clock, Target, Award, BarChart3 } from 'lucide-react';
import GradientText from '@/components/ui/GradientText';

interface QuickStatsGridProps {
  stats: {
    activities: number;
    hours: number;
    impactReach: string;
    recognitions: number;
  };
}

const StatCard: React.FC<{
  icon: React.ElementType;
  value: number | string;
  label: string;
  color: string;
  delay: number;
}> = ({ icon: Icon, value, label, color, delay }) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const isNumber = typeof value === 'number';

  useEffect(() => {
    if (!isNumber) return;

    let start = 0;
    const end = value as number;
    const duration = 2000;
    const increment = end / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setAnimatedValue(end);
        clearInterval(timer);
      } else {
        setAnimatedValue(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value, isNumber]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ scale: 1.05 }}
      className="group cursor-pointer"
    >
      <Card className="h-full bg-white/70 backdrop-blur-sm border-2 border-white/50 hover:border-cyan-400/60 shadow-lg shadow-cyan-100/50 hover:shadow-xl hover:shadow-cyan-200/60 transition-all duration-300 overflow-hidden">
        <CardContent className="p-4 relative">
          {/* Background gradient */}
          <div className={`absolute inset-0 bg-gradient-to-br from-${color}-500/5 to-${color}-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
          
          <div className="relative flex flex-col items-center text-center space-y-2">
            <motion.div
              whileHover={{ rotate: 5, scale: 1.1 }}
              className={`w-10 h-10 rounded-full bg-gradient-to-br from-${color}-500 to-${color}-600 flex items-center justify-center shadow-lg group-hover:shadow-${color}-500/50 transition-shadow`}
            >
              <Icon className="w-5 h-5 text-white" />
            </motion.div>
            
            <div className={`text-2xl font-bold bg-gradient-to-r from-${color}-600 to-${color}-500 bg-clip-text text-transparent`}>
              {isNumber ? animatedValue : value}
            </div>
            
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {label}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const QuickStatsGrid: React.FC<QuickStatsGridProps> = ({ stats }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="h-full"
    >
      <Card className="h-full bg-white/80 backdrop-blur-md border-2 border-[#00ffaa]/40 shadow-lg shadow-cyan-300/30 hover:border-[#00ffaa]/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 md:gap-4 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00ffaa] to-[#07c6ff] flex items-center justify-center shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <GradientText
              className="text-base md:text-lg font-extrabold uppercase tracking-wide"
              colors={["#07c6ff", "#00c1ff", "#00ffaa", "#07c6ff"]}
            >
              AT A GLANCE
            </GradientText>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={Trophy}
              value={stats.activities}
              label="Activities"
              color="purple"
              delay={0.6}
            />
            <StatCard
              icon={Clock}
              value={stats.hours}
              label="Hours"
              color="cyan"
              delay={0.7}
            />
            <StatCard
              icon={Target}
              value={stats.impactReach}
              label="Impact"
              color="green"
              delay={0.8}
            />
            <StatCard
              icon={Award}
              value={stats.recognitions}
              label="Recognition"
              color="amber"
              delay={0.9}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
