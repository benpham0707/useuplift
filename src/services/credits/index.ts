/**
 * Credits Service - Barrel Export
 */

export {
  // Constants
  CREDIT_COSTS,

  // Types
  type CreditTransactionType,
  type CreditBalance,
  type CreditDeductionResult,
  type CreditCheckResult,

  // Client-side (Clerk-JWT authenticated) functions
  getCredits,
  hasEnoughCredits,
  canAnalyzeEssay,
  canSendChatMessage,
  deductCredits,
  deductForEssayAnalysis,
  deductForChatMessage,
  formatCreditCost,

  // Server-side (service-role) atomic debit path — for HTTP routes.
  // See creditsService.ts §"SERVER-SIDE ATOMIC DEBIT PATH".
  type AtomicDebitResult,
  type AtomicDebitErrorReason,
  type AtomicDebitOptions,
  getCreditsServer,
  hasEnoughCreditsServer,
  atomicDebit,
  refundCredits,
} from './creditsService';
