import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const FinalCTA = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/20 -z-10" />
      
      {/* Animated Progress Bar Loop */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-border/30">
        <motion.div
          className="h-full bg-primary"
          animate={{ 
            width: ["0%", "70%", "100%"],
            opacity: [1, 1, 0],
            x: ["0%", "0%", "100%"] // resetting
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity,
            times: [0, 0.8, 1],
            ease: "easeInOut"
          }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
        <motion.h2 
          className="text-4xl font-bold tracking-tight sm:text-5xl mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Ready to see your story clearly?
        </motion.h2>
        
        <motion.p 
          className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Join the early access list and get your first portfolio scan when we open the next batch.
        </motion.p>

        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Button size="lg" className="h-12 px-8 text-base opacity-50 cursor-not-allowed" disabled>
            Join early access
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <p className="text-xs text-muted-foreground">
            Portfolio scanner coming soon. Check back later!
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default FinalCTA;
