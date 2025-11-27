/**
 * PIQ Workshop Showcase Section
 * 
 * Showcases the PIQ Narrative Workshop - our fully built product
 * Highlights the 12-dimension analysis, AI coaching, and deep expertise
 */

import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  PenTool, 
  Target, 
  MessageSquare, 
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Layers,
  TrendingUp
} from 'lucide-react';

const PIQShowcase = () => {
  const features = [
    {
      icon: Target,
      title: "12-Dimension Analysis",
      description: "We score your essay across 12 carefully calibrated dimensions that admissions officers actually care about.",
      highlight: "Not generic feedback"
    },
    {
      icon: MessageSquare,
      title: "AI Essay Coach",
      description: "Ask questions about your score, get specific rewrites, and understand exactly how to improve.",
      highlight: "Like having a counselor on call"
    },
    {
      icon: Layers,
      title: "Issue Detection",
      description: "We pinpoint exactly which sentences need work—with before/after examples you can use immediately.",
      highlight: "Surgical precision"
    },
    {
      icon: TrendingUp,
      title: "Progress Tracking",
      description: "Save drafts, track your score changes, and see your improvement over time.",
      highlight: "Watch yourself grow"
    }
  ];

  const analysisPreview = [
    { name: "Opening Hook", score: 8.0, status: "strong" as const },
    { name: "Character Development", score: 7.0, status: "needs_work" as const },
    { name: "Specificity & Evidence", score: 6.5, status: "needs_work" as const },
    { name: "Authentic Voice", score: 8.5, status: "strong" as const },
    { name: "Insight & Reflection", score: 7.5, status: "strong" as const },
    { name: "Coherent Structure", score: 7.0, status: "needs_work" as const },
  ];

  const getStatusColor = (status: "strong" | "needs_work" | "critical") => {
    switch (status) {
      case "strong": return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30";
      case "needs_work": return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30";
      case "critical": return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30";
    }
  };

  return (
    <section className="py-24 bg-gradient-to-b from-background via-primary/5 to-background relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl -z-10" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div 
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
            <Sparkles className="h-4 w-4" />
            Available Now
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            The PIQ Narrative Workshop
          </h2>
          
          <p className="text-xl text-muted-foreground leading-relaxed">
            Our most powerful tool for UC Personal Insight Questions. Built with insights from 
            top college counselors who've helped students get into <span className="text-foreground font-medium">Berkeley, UCLA, and all UC campuses</span>.
          </p>
        </motion.div>

        {/* Main Showcase Grid */}
        <div className="grid lg:grid-cols-2 gap-12 items-start mb-16">
          {/* Left: Feature Cards */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="flex gap-4 p-4 rounded-xl border bg-card hover:shadow-md transition-all duration-300 group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * index }}
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <feature.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{feature.description}</p>
                  <span className="inline-block text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {feature.highlight}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Right: Analysis Preview */}
          <motion.div
            className="bg-card rounded-2xl border shadow-xl overflow-hidden"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            {/* Preview Header */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <PenTool className="h-5 w-5" />
                    <span className="font-semibold">NARRATIVE QUALITY INDEX</span>
                  </div>
                  <p className="text-white/80 text-sm">12-dimension analysis</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold">73<span className="text-xl opacity-60">/100</span></div>
                  <div className="text-sm bg-white/20 rounded-full px-3 py-0.5 mt-1">Competitive</div>
                </div>
              </div>
            </div>

            {/* Quick Navigate */}
            <div className="p-4 border-b bg-muted/30">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">Quick navigate:</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium">Critical (1)</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-medium">Needs Work (4)</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 font-medium">Strong (7)</span>
              </div>
            </div>

            {/* Dimension List Preview */}
            <div className="p-4 space-y-3">
              {analysisPreview.map((dim, i) => (
                <motion.div 
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className={`h-4 w-4 ${dim.status === 'strong' ? 'text-green-500' : 'text-amber-500'}`} />
                    <span className="font-medium text-sm">{dim.name}</span>
                  </div>
                  <span className={`text-sm font-bold px-2 py-0.5 rounded ${getStatusColor(dim.status)}`}>
                    {dim.score}/10
                  </span>
                </motion.div>
              ))}
              <div className="text-center pt-2 text-xs text-muted-foreground">
                + 6 more dimensions analyzed...
              </div>
            </div>
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <Button size="lg" className="h-14 px-10 text-lg" asChild>
            <Link to="/piq-workshop">
              <PenTool className="mr-2 h-5 w-5" />
              Try PIQ Workshop
              <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded-full">Free</span>
            </Link>
          </Button>
          <p className="mt-4 text-sm text-muted-foreground">
            No signup required to try. See your score in under 2 minutes.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default PIQShowcase;
