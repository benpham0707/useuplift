/**
 * Insufficient Credits Modal - Premium Conversion Experience
 * 
 * A Linear/Stripe-inspired modal with spring physics animations,
 * animated credit visualization, and conversion-focused design.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import GradientZap from '@/components/ui/GradientZap';
import { Sparkles, ArrowRight, Crown } from 'lucide-react';
import { CREDIT_COSTS } from '@/services/credits';

// ============================================================================
// TYPES
// ============================================================================

interface InsufficientCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
  requiredCredits: number;
  actionType: 'analysis' | 'chat';
}

// ============================================================================
// ANIMATION VARIANTS - Using type assertions for framer-motion compatibility
// ============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 28,
    },
  },
};

// ============================================================================
// ANIMATED CREDIT RING COMPONENT
// ============================================================================

function AnimatedCreditRing({
  current,
  required,
}: {
  current: number;
  required: number;
}) {
  const percentage = Math.min(current / required, 1);
  const circumference = 2 * Math.PI * 45;
  const shortfall = required - current;

  return (
    <div className="relative w-32 h-32 mx-auto">
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 blur-xl animate-pulse" />
      
      {/* SVG Ring */}
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        {/* Background ring */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="6"
          className="opacity-30"
        />
        
        {/* Animated progress ring */}
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="url(#creditGradient)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ 
            strokeDashoffset: circumference * (1 - percentage),
            transition: {
              type: 'spring' as const,
              stiffness: 100,
              damping: 20,
              delay: 0.3,
            }
          }}
        />
        
        {/* Gradient definition */}
        <defs>
          <linearGradient id="creditGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring' as const, stiffness: 400, damping: 25, delay: 0.4 }}
          className="text-center"
        >
          <span className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            {current}
          </span>
          <span className="text-lg text-muted-foreground">/{required}</span>
        </motion.div>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xs text-muted-foreground mt-0.5"
        >
          credits
        </motion.span>
      </div>

      {/* Shortfall indicator */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap"
      >
        <span className="text-sm font-medium text-primary">
          Need {shortfall} more
        </span>
      </motion.div>
    </div>
  );
}

// ============================================================================
// VALUE ITEM COMPONENT
// ============================================================================

function ValueItem({ text, delay }: { text: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        type: 'spring' as const, 
        stiffness: 400, 
        damping: 28,
        delay 
      }}
      className="flex items-center gap-3 group"
    >
      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
        <motion.svg 
          className="w-3 h-3" 
          viewBox="0 0 24 24" 
          fill="none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.1 }}
        >
          <motion.path
            d="M5 12l5 5L20 7"
            stroke="hsl(var(--primary))"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ 
              type: 'spring' as const, 
              stiffness: 300, 
              damping: 25, 
              delay: delay + 0.2 
            }}
          />
        </motion.svg>
      </div>
      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
        {text}
      </span>
    </motion.div>
  );
}

// ============================================================================
// PURCHASE CARD COMPONENT
// ============================================================================

function PurchaseCard({
  title,
  subtitle,
  price,
  priceDetail,
  isPrimary,
  badge,
  onClick,
  delay,
}: {
  title: string;
  subtitle: string;
  price: string;
  priceDetail: string;
  isPrimary?: boolean;
  badge?: string;
  onClick: () => void;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        type: 'spring' as const, 
        stiffness: 400, 
        damping: 28,
        delay 
      }}
      whileHover={{
        y: -4,
        transition: { type: 'spring' as const, stiffness: 400, damping: 25 },
      }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative p-4 rounded-xl cursor-pointer transition-all duration-300
        ${isPrimary
          ? 'bg-gradient-to-br from-primary/10 via-purple-500/10 to-primary/5 border-2 border-primary/30 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10'
          : 'bg-muted/30 border border-border hover:border-primary/30 hover:bg-muted/50'
        }
      `}
      onClick={onClick}
    >
      {/* Badge */}
      {badge && (
        <div className="absolute -top-2.5 left-4">
          <span className="px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-gradient-to-r from-primary to-purple-500 text-primary-foreground rounded-full">
            {badge}
          </span>
        </div>
      )}

      <div className="space-y-3">
        {/* Header */}
        <div>
          <h4 className={`font-semibold ${isPrimary ? 'text-foreground' : 'text-muted-foreground'}`}>
            {title}
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1">
          <span className={`text-2xl font-bold ${isPrimary ? 'bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent' : 'text-foreground'}`}>
            {price}
          </span>
          <span className="text-xs text-muted-foreground">{priceDetail}</span>
        </div>

        {/* CTA Button */}
        <Button
          size="sm"
          className={`w-full gap-2 ${isPrimary ? 'gradient-primary' : ''}`}
          variant={isPrimary ? 'default' : 'outline'}
        >
          {isPrimary ? <Sparkles className="w-3.5 h-3.5" /> : <Crown className="w-3.5 h-3.5" />}
          {isPrimary ? 'Get Credits' : 'Go Pro'}
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function InsufficientCreditsModal({
  isOpen,
  onClose,
  currentBalance,
  requiredCredits,
  actionType,
}: InsufficientCreditsModalProps) {
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowContent(true);
    }
  }, [isOpen]);

  const handleGetCredits = () => {
    onClose();
    navigate('/pricing');
  };

  const handleGoPro = () => {
    onClose();
    navigate('/pricing?plan=pro');
  };

  const valueProps = [
    '12-dimension narrative analysis',
    'Line-by-line improvements',
    'AI coach for follow-up questions',
    'Voice preservation insights',
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md overflow-hidden bg-background/95 backdrop-blur-xl border-border/50">
        <AnimatePresence mode="wait">
          {showContent && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-6"
            >
              {/* Header */}
              <DialogHeader>
                <motion.div 
                  variants={itemVariants} 
                  className="flex items-center gap-3"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-purple-500/40 rounded-full blur-lg animate-pulse" />
                    <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                      <GradientZap className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-semibold">
                      You're one step away
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Your {actionType === 'analysis' ? 'analysis' : 'conversation'} is ready to continue
                    </p>
                  </div>
                </motion.div>
              </DialogHeader>

              {/* Credit Ring */}
              <motion.div variants={itemVariants} className="py-4">
                <AnimatedCreditRing
                  current={currentBalance}
                  required={requiredCredits}
                />
              </motion.div>

              {/* Value Props */}
              <motion.div variants={itemVariants} className="space-y-2.5 py-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  What you'll unlock
                </p>
                <div className="space-y-2">
                  {valueProps.map((prop, i) => (
                    <ValueItem key={prop} text={prop} delay={0.4 + i * 0.08} />
                  ))}
                </div>
              </motion.div>

              {/* Purchase Options */}
              <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 pt-2">
                <PurchaseCard
                  title="Quick Top-Up"
                  subtitle="50 credits"
                  price="$5"
                  priceDetail="one-time"
                  isPrimary
                  badge="Best Value"
                  onClick={handleGetCredits}
                  delay={0.6}
                />
                <PurchaseCard
                  title="Pro Plan"
                  subtitle="100 credits/mo"
                  price="$10"
                  priceDetail="/month"
                  onClick={handleGoPro}
                  delay={0.65}
                />
              </motion.div>

              {/* Credit costs reference */}
              <motion.div 
                variants={itemVariants}
                className="text-center pt-2 border-t border-border/50"
              >
                <p className="text-[11px] text-muted-foreground">
                  Analysis: {CREDIT_COSTS.ESSAY_ANALYSIS} credits • Chat: {CREDIT_COSTS.CHAT_MESSAGE} credit
                </p>
              </motion.div>

              {/* Maybe Later */}
              <motion.div variants={itemVariants} className="text-center">
                <button
                  onClick={onClose}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Maybe later
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

export default InsufficientCreditsModal;
