/**
 * Coming Soon Section
 * 
 * Showcases Portfolio Scanner / Portfolio Insights that's in development
 * Creates anticipation and shows the broader vision
 */

import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  ScanLine, 
  TrendingUp, 
  Users, 
  Target,
  Bell,
  CheckCircle,
  Sparkles
} from 'lucide-react';

const ComingSoonSection = () => {
  const previewMetrics = [
    { label: "Impact & Leadership", score: 8.2, color: "text-blue-500" },
    { label: "Academic Performance", score: 8.1, color: "text-purple-500" },
    { label: "Intellectual Curiosity", score: 7.6, color: "text-cyan-500" },
    { label: "Storytelling", score: 7.8, color: "text-amber-500" },
    { label: "Character & Community", score: 7.3, color: "text-green-500" },
  ];

  const upcomingFeatures = [
    {
      icon: ScanLine,
      title: "Full Portfolio Analysis",
      description: "Scan your activities, grades, awards, and experiences to get a comprehensive profile score."
    },
    {
      icon: Target,
      title: "Gap Detection",
      description: "See what's missing compared to successful applicants in your target major."
    },
    {
      icon: TrendingUp,
      title: "Progress Roadmap",
      description: "Get actionable recommendations to strengthen your application month by month."
    },
    {
      icon: Users,
      title: "Peer Comparison",
      description: "Understand where you stand compared to other applicants (anonymized data)."
    }
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-100 via-cyan-50 to-purple-100 dark:from-violet-950/30 dark:via-cyan-950/20 dark:to-purple-950/30 -z-10" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          className="text-center max-w-3xl mx-auto mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-300 dark:border-violet-700 bg-violet-100 dark:bg-violet-900/50 px-4 py-1.5 text-sm font-medium text-violet-700 dark:text-violet-300 mb-6">
            <Sparkles className="h-4 w-4" />
            Coming Soon
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Portfolio Insights
          </h2>
          
          <p className="text-xl text-muted-foreground leading-relaxed">
            While you're perfecting your PIQs, we're building something bigger—a complete portfolio scanner 
            that shows you exactly where you stand and what to do next.
          </p>
        </motion.div>

        {/* Preview Card */}
        <motion.div 
          className="max-w-4xl mx-auto mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-background/80 backdrop-blur-sm rounded-2xl border shadow-2xl overflow-hidden">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-cyan-500 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <ScanLine className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Portfolio Overview</h3>
                    <p className="text-white/80 text-sm">5 dimensions analyzed</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">7.8<span className="text-xl opacity-60">/10</span></div>
                  <Button size="sm" variant="secondary" className="mt-1 text-xs h-7">
                    View full insights
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Metrics Preview */}
            <div className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
                {previewMetrics.map((metric, i) => (
                  <motion.div
                    key={i}
                    className="text-center p-4 rounded-xl border bg-muted/30"
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                  >
                    <div className={`text-2xl font-bold ${metric.color}`}>{metric.score}</div>
                    <div className="text-xs text-muted-foreground mt-1">{metric.label}</div>
                  </motion.div>
                ))}
              </div>
              
              {/* Sample Insight */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-violet-50 to-cyan-50 dark:from-violet-950/20 dark:to-cyan-950/20 border">
                <p className="text-sm text-foreground/90 leading-relaxed">
                  <span className="font-semibold">Quick Summary:</span> You have a strong foundation with standout momentum in Impact & Leadership and Academic Rigor. 
                  To hit top-tier, unify everything under one throughline and convert more work into public, measurable outcomes. 
                  Focus attention on Character & Community and Personal Growth.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Upcoming Features */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {upcomingFeatures.map((feature, index) => (
            <motion.div
              key={index}
              className="bg-background rounded-xl p-6 border shadow-sm text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <div className="h-12 w-12 mx-auto rounded-xl bg-gradient-to-br from-violet-500/10 to-cyan-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400 mb-4">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Waitlist CTA */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <Button 
            size="lg" 
            variant="outline" 
            className="h-12 px-8 border-violet-300 dark:border-violet-700 hover:bg-violet-50 dark:hover:bg-violet-950/50" 
            asChild
          >
            <Link to="/waitlist">
              <Bell className="mr-2 h-4 w-4" />
              Get notified when it launches
            </Link>
          </Button>
          <p className="mt-4 text-sm text-muted-foreground">
            Join 500+ students already on the waitlist
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default ComingSoonSection;
