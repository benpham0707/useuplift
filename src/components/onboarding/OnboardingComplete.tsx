import { motion } from 'motion/react';
import { CheckCircle, Sparkles } from 'lucide-react';
import { useEffect } from 'react';

interface OnboardingCompleteProps {
  onComplete: () => void;
}

export const OnboardingComplete = ({ onComplete }: OnboardingCompleteProps) => {
  useEffect(() => {
    // Redirect after animation
    const timer = setTimeout(() => {
      onComplete();
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
        className="text-center space-y-6"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 10 }}
          className="flex justify-center"
        >
          <div className="relative">
            <CheckCircle className="h-24 w-24 text-primary" />
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="absolute -top-2 -right-2"
            >
              <Sparkles className="h-8 w-8 text-yellow-500" />
            </motion.div>
          </div>
        </motion.div>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="space-y-2"
        >
          <h1 className="text-4xl font-bold">You're all set!</h1>
          <p className="text-xl text-muted-foreground">Let's build your plan.</p>
        </motion.div>

        {/* Loading indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="flex justify-center"
        >
          <div className="h-1.5 w-32 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              className="h-full w-1/3 bg-primary rounded-full"
            />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
