import { Button } from '@/components/ui/button';
import { motion } from 'motion/react';
import { ArrowRight, PenTool, CheckCircle, Sparkles, Target } from 'lucide-react';
import { Link } from 'react-router-dom';

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden border-b bg-gradient-to-b from-background via-primary/5 to-background pt-12 pb-20 lg:pt-20 lg:pb-32">
      {/* Background decorations */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl -z-10" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          
          {/* Left: Copy */}
          <div className="flex-1 space-y-8 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium bg-primary/10 text-primary mb-6">
                <Sparkles className="h-3 w-3 mr-1.5" />
                PIQ Workshop Available Now
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-foreground">
                Craft essays that{' '}
                <span className="bg-gradient-to-r from-primary via-violet-500 to-indigo-500 bg-clip-text text-transparent">
                  admissions officers remember.
                </span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Our AI-powered workshop analyzes your UC PIQ essays across <span className="font-medium text-foreground">12 dimensions</span> that 
                top counselors say matter most—then shows you exactly how to improve, with specific rewrites and real-time coaching.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Button size="lg" className="text-base h-12 px-8 w-full sm:w-auto" asChild>
                <Link to="/piq-workshop">
                  <PenTool className="mr-2 h-4 w-4" />
                  Try PIQ Workshop Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-base h-12 px-8 w-full sm:w-auto" asChild>
                <Link to="/waitlist">
                  <Target className="mr-2 h-4 w-4" />
                  Join Portfolio Waitlist
                </Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex items-center justify-center lg:justify-start gap-4 text-xs text-muted-foreground"
            >
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>No signup required</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Get your score in 2 minutes</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Built with top counselors</span>
              </div>
            </motion.div>
          </div>

          {/* Right: Visual - Score Preview */}
          <motion.div
            className="flex-1 relative w-full max-w-md lg:max-w-lg"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="relative">
              {/* Main Score Card */}
              <motion.div 
                className="bg-card border rounded-2xl shadow-2xl overflow-hidden"
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 100,
                  damping: 20
                }}
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PenTool className="h-5 w-5" />
                      <span className="font-bold text-sm">NARRATIVE QUALITY INDEX</span>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold">73<span className="text-lg opacity-60">/100</span></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Competitive</span>
                    <span className="text-xs text-white/70">+73 from baseline</span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="p-4 border-b">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-2 rounded-lg bg-red-50 dark:bg-red-950/30">
                      <div className="text-lg font-bold text-red-600 dark:text-red-400">1</div>
                      <div className="text-[10px] text-red-600/70 dark:text-red-400/70">Critical</div>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                      <div className="text-lg font-bold text-amber-600 dark:text-amber-400">4</div>
                      <div className="text-[10px] text-amber-600/70 dark:text-amber-400/70">Needs Work</div>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-green-50 dark:bg-green-950/30">
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">7</div>
                      <div className="text-[10px] text-green-600/70 dark:text-green-400/70">Strong</div>
                    </div>
                  </div>
                </div>

                {/* Sample Dimensions */}
                <div className="p-4 space-y-2">
                  {[
                    { name: "Opening Hook", score: 8.0, color: "text-green-600" },
                    { name: "Authentic Voice", score: 8.5, color: "text-green-600" },
                    { name: "Character Development", score: 7.0, color: "text-amber-600" },
                    { name: "Specificity & Evidence", score: 6.5, color: "text-amber-600" },
                  ].map((dim, i) => (
                    <motion.div 
                      key={i}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                    >
                      <span className="text-sm font-medium">{dim.name}</span>
                      <span className={`text-sm font-bold ${dim.color}`}>{dim.score}/10</span>
                    </motion.div>
                  ))}
                  <div className="text-center pt-2">
                    <span className="text-xs text-muted-foreground">+ 8 more dimensions analyzed</span>
                  </div>
                </div>
              </motion.div>

              {/* Floating AI Coach bubble */}
              <motion.div
                className="absolute -bottom-4 -right-4 bg-card border rounded-xl shadow-lg p-3 max-w-[200px]"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
              >
                <div className="flex items-start gap-2">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-3 w-3 text-white" />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    "Replace your abstract opening with that concrete scene where you cleared your throat three times..."
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
