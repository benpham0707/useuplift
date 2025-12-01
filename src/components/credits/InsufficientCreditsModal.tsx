/**
 * Insufficient Credits Modal
 * 
 * Displays when a user tries to perform an action without enough credits.
 * Shows current balance, required credits, and links to pricing page.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GradientZap from '@/components/ui/GradientZap';
import { AlertTriangle, Sparkles, MessageCircle, FileText } from 'lucide-react';
import { CREDIT_COSTS, formatCreditCost } from '@/services/credits';

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
// COMPONENT
// ============================================================================

export function InsufficientCreditsModal({
  isOpen,
  onClose,
  currentBalance,
  requiredCredits,
  actionType,
}: InsufficientCreditsModalProps) {
  const navigate = useNavigate();
  const shortfall = requiredCredits - currentBalance;

  const handleGetCredits = () => {
    onClose();
    navigate('/pricing');
  };

  const actionLabel = actionType === 'analysis' ? 'Essay Analysis' : 'Chat Message';
  const ActionIcon = actionType === 'analysis' ? FileText : MessageCircle;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <DialogTitle className="text-xl">Insufficient Credits</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            You need more credits to use {actionLabel.toLowerCase()}.
          </DialogDescription>
        </DialogHeader>

        {/* Credit Balance Display */}
        <div className="space-y-4 py-4">
          {/* Current Balance */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-2">
              <GradientZap className="w-5 h-5" />
              <span className="font-medium">Your Balance</span>
            </div>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {currentBalance} {currentBalance === 1 ? 'credit' : 'credits'}
            </Badge>
          </div>

          {/* Required Credits */}
          <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center gap-2">
              <ActionIcon className="w-5 h-5 text-primary" />
              <span className="font-medium">{actionLabel} Cost</span>
            </div>
            <Badge className="text-lg px-3 py-1 bg-primary">
              {requiredCredits} {requiredCredits === 1 ? 'credit' : 'credits'}
            </Badge>
          </div>

          {/* Shortfall */}
          <div className="text-center p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-300">
              You need <span className="font-bold">{shortfall} more {shortfall === 1 ? 'credit' : 'credits'}</span> to continue
            </p>
          </div>
        </div>

        {/* Credit Costs Reference */}
        <div className="text-xs text-muted-foreground border-t pt-4 space-y-1">
          <p className="font-medium mb-2">Credit costs:</p>
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5" />
            <span>Full Essay Analysis: <strong>{CREDIT_COSTS.ESSAY_ANALYSIS} credits</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <MessageCircle className="w-3.5 h-3.5" />
            <span>AI Coach Chat Message: <strong>{CREDIT_COSTS.CHAT_MESSAGE} credit</strong></span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleGetCredits} className="gap-2">
            <Sparkles className="w-4 h-4" />
            Get Credits
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default InsufficientCreditsModal;
