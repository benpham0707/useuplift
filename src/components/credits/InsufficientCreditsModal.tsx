/**
 * Insufficient Credits Modal - Premium Conversion Experience
 * 
 * A conversion-optimized modal that transforms a friction moment into
 * a value demonstration with inline purchase options.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/utils';
import { 
  Sparkles, 
  Clock, 
  DollarSign, 
  HelpCircle, 
  Bot,
  Zap, 
  Coins, 
  Target, 
  Fingerprint, 
  BarChart3, 
  Eye,
  GraduationCap, 
  Lock, 
  Shield, 
  Users, 
  Check, 
  Loader2,
  ArrowRight,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
// ANIMATED PROGRESS RING COMPONENT
// ============================================================================

function ProgressRing({ 
  current, 
  required, 
  size = 80 
}: { 
  current: number; 
  required: number; 
  size?: number;
}) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(current / required, 1);
  const offset = circumference - progress * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-foreground">{current}</span>
        <span className="text-xs text-muted-foreground">/ {required}</span>
      </div>
    </div>
  );
}

// ============================================================================
// COMPARISON ITEM COMPONENT
// ============================================================================

interface ComparisonItemProps {
  icon: React.ElementType;
  text: string;
  variant: 'pain' | 'solution';
}

function ComparisonItem({ icon: Icon, text, variant }: ComparisonItemProps) {
  const isPain = variant === 'pain';
  
  return (
    <div className={cn(
      "flex items-start gap-3 p-3 rounded-lg transition-all duration-200",
      isPain 
        ? "bg-muted/40 text-muted-foreground" 
        : "bg-primary/5 text-foreground"
    )}>
      <Icon className={cn(
        "w-4 h-4 mt-0.5 shrink-0",
        isPain ? "text-muted-foreground/70" : "text-primary"
      )} />
      <span className="text-sm leading-snug">{text}</span>
    </div>
  );
}

// ============================================================================
// VALUE PROPOSITION ITEM COMPONENT
// ============================================================================

interface ValueItemProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

function ValueItem({ icon: Icon, title, description }: ValueItemProps) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-br from-background to-muted/30 border border-border/50 hover:border-primary/20 transition-all duration-200">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="space-y-0.5">
        <h4 className="text-sm font-medium text-foreground">{title}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
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
  const { getToken, userId } = useAuth();
  const [processingType, setProcessingType] = useState<string | null>(null);
  
  const shortfall = requiredCredits - currentBalance;
  const actionLabel = actionType === 'analysis' ? 'Essay Analysis' : 'AI Coach Chat';

  // Handle Stripe checkout
  const handleCheckout = async (type: string) => {
    if (!userId) {
      onClose();
      navigate('/auth');
      return;
    }

    try {
      setProcessingType(type);
      const token = await getToken();
      
      if (!token) {
        onClose();
        navigate('/auth');
        return;
      }

      const response = await apiFetch('/api/v1/billing/checkout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          successUrl: `${window.location.origin}${window.location.pathname}?success=true`,
          cancelUrl: `${window.location.origin}${window.location.pathname}?canceled=true`,
        }),
      });

      if (!response.ok) {
        throw new Error('Checkout failed');
      }
      
      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      // Silent fail - user can try again
    } finally {
      setProcessingType(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden gap-0">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 p-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Section */}
        <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 px-6 pt-8 pb-6">
          <div className="flex items-start gap-5">
            {/* Progress Ring */}
            <ProgressRing current={currentBalance} required={requiredCredits} />
            
            {/* Header Text */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold text-foreground">
                  Unlock Your Expert Analysis
                </h2>
              </div>
              <p className="text-muted-foreground">
                You're <span className="font-semibold text-foreground">{shortfall} {shortfall === 1 ? 'credit' : 'credits'}</span> away from feedback that 
                takes counselors weeks — delivered in seconds.
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-6">
          
          {/* Pain Point vs Solution Comparison */}
          <div className="grid grid-cols-2 gap-4">
            {/* Pain Points Column */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Traditional Path
              </h3>
              <ComparisonItem 
                icon={Clock} 
                text="1-2 weeks per revision cycle" 
                variant="pain" 
              />
              <ComparisonItem 
                icon={DollarSign} 
                text="$200-500/hr consultants" 
                variant="pain" 
              />
              <ComparisonItem 
                icon={HelpCircle} 
                text='"Make it more compelling"' 
                variant="pain" 
              />
              <ComparisonItem 
                icon={Bot} 
                text="Generic AI flattens your voice" 
                variant="pain" 
              />
            </div>
            
            {/* Solutions Column */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">
                Your PIQ Workshop
              </h3>
              <ComparisonItem 
                icon={Zap} 
                text="Instant, unlimited iterations" 
                variant="solution" 
              />
              <ComparisonItem 
                icon={Coins} 
                text="~$1 per full analysis" 
                variant="solution" 
              />
              <ComparisonItem 
                icon={Target} 
                text="Line-by-line specific fixes" 
                variant="solution" 
              />
              <ComparisonItem 
                icon={Fingerprint} 
                text="Preserves YOUR authentic voice" 
                variant="solution" 
              />
            </div>
          </div>

          {/* Value Proposition - What You'll Unlock */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">What You'll Unlock</h3>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Lock className="w-3 h-3" />
                <span>Advanced features</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <ValueItem 
                icon={BarChart3}
                title="12-Dimension Narrative Score"
                description="The same rubric elite essays score 90+ on"
              />
              <ValueItem 
                icon={Eye}
                title="Show, Don't Tell Detection"
                description="Find where you're summarizing and create scenes"
              />
              <ValueItem 
                icon={Fingerprint}
                title="Voice Fingerprint Analysis"
                description="Your unique markers, preserved and enhanced"
              />
              <ValueItem 
                icon={GraduationCap}
                title="Trained on Admitted Essays"
                description="Patterns from Harvard, Princeton, Stanford"
              />
            </div>
          </div>

          {/* Purchase Options */}
          <div className="space-y-3 pt-2">
            {/* Primary Option - Quick Top-Up */}
            <div className="relative p-4 rounded-xl border-2 border-primary bg-gradient-to-br from-primary/5 to-primary/10 overflow-hidden">
              {/* Sale Badge */}
              <div className="absolute top-0 right-0">
                <Badge className="rounded-none rounded-bl-lg bg-red-500 hover:bg-red-500 text-white text-xs px-2 py-1">
                  50% OFF
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-foreground">50 Credits</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-foreground">$5</span>
                    <span className="text-sm text-muted-foreground line-through">$10</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    10 full analyses • Never expires
                  </p>
                </div>
                
                <Button 
                  size="lg"
                  onClick={() => handleCheckout('addon_50')}
                  disabled={processingType !== null}
                  className="gap-2 px-6"
                >
                  {processingType === 'addon_50' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Get Credits
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Secondary Option - Subscription */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="font-medium text-foreground">Pro Plan</span>
                  <Badge variant="outline" className="text-xs">Best Value</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="line-through">$20</span> <span className="font-semibold text-foreground">$10/mo</span> • 100 credits/month + rollover
                </p>
              </div>
              
              <Button 
                variant="outline"
                onClick={() => handleCheckout('pro_monthly')}
                disabled={processingType !== null}
                className="gap-2"
              >
                {processingType === 'pro_monthly' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Subscribe'
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Trust Footer */}
        <div className="px-6 py-4 bg-muted/30 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                <span>Secure checkout via Stripe</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span>Instant delivery</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>1,000+ students</span>
              </div>
            </div>
            
            <button 
              onClick={onClose}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default InsufficientCreditsModal;
