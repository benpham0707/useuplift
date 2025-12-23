import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { ArrowLeft, Sparkles, Gift, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'sign-up' ? 'sign-up' : 'sign-in';
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>(initialMode);
  const [manualReferralCode, setManualReferralCode] = useState('');
  const [showReferralInput, setShowReferralInput] = useState(false);
  const [pendingReferralCode, setPendingReferralCode] = useState<string | null>(null);

  // Capture referral code from URL on mount
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      // Store in localStorage for claiming after signup/login
      const normalizedCode = refCode.trim().toUpperCase();
      localStorage.setItem('pendingReferralCode', normalizedCode);
      setPendingReferralCode(normalizedCode);
    } else {
      // Check if there's already a pending code in localStorage
      const existingCode = localStorage.getItem('pendingReferralCode');
      if (existingCode) {
        setPendingReferralCode(existingCode);
      }
    }
  }, [searchParams]);

  // Sync mode with URL parameter on navigation
  useEffect(() => {
    const urlMode = searchParams.get('mode') === 'sign-up' ? 'sign-up' : 'sign-in';
    setMode(urlMode);
  }, [searchParams]);

  const handleApplyReferralCode = () => {
    if (manualReferralCode.trim()) {
      const normalizedCode = manualReferralCode.trim().toUpperCase();
      localStorage.setItem('pendingReferralCode', normalizedCode);
      setPendingReferralCode(normalizedCode);
      setManualReferralCode('');
      setShowReferralInput(false);
    }
  };

  const handleRemoveReferralCode = () => {
    localStorage.removeItem('pendingReferralCode');
    setPendingReferralCode(null);
    setManualReferralCode('');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hide Clerk's built-in footer links */}
      <style>{`
        .cl-footerAction {
          display: none !important;
        }
      `}</style>
      <div className="flex-1 flex items-center justify-center px-4 py-12 relative">
        
        {/* Back Button */}
        <div className="absolute top-8 left-8 z-20">
          <Link to="/" className="flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-20 items-start">
          
          {/* Left Column - Auth Form */}
          <motion.div 
            layout
            className="max-w-md mx-auto w-full flex flex-col items-center"
          >
            <AnimatePresence mode="wait">
              {mode === 'sign-in' ? (
                <motion.div
                  key="sign-in"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="w-full flex flex-col items-center"
                >
                  <SignIn 
                    routing="hash"
                    forceRedirectUrl="/portfolio-scanner"
                  />
                  <p className="mt-4 text-sm text-muted-foreground">
                    Don't have an account?{' '}
                    <button
                      onClick={() => setMode('sign-up')}
                      className="text-primary font-medium hover:underline transition-colors"
                    >
                      Sign up
                    </button>
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="sign-up"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="w-full flex flex-col items-center"
                >
                  {/* Enhanced Referral Banner */}
                  {pendingReferralCode && mode === 'sign-up' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="w-full mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-2 border-green-300 dark:border-green-700 rounded-xl shadow-sm relative overflow-hidden"
                    >
                      {/* Background decoration */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-green-400/10 rounded-full blur-2xl" />
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-400/10 rounded-full blur-2xl" />

                      <div className="relative flex items-start gap-3">
                        <div className="shrink-0 w-10 h-10 bg-green-500 dark:bg-green-600 rounded-full flex items-center justify-center">
                          <Gift className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-1">
                            You're signing up with a referral code!
                          </h3>
                          <p className="text-xs text-green-700 dark:text-green-300 mb-2">
                            Code: <span className="font-mono font-bold bg-green-100 dark:bg-green-900/50 px-2 py-0.5 rounded">{pendingReferralCode}</span>
                          </p>
                          <div className="space-y-1">
                            <p className="text-xs text-green-800 dark:text-green-200 flex items-center gap-1.5">
                              <span className="text-green-600">✓</span>
                              <span className="font-medium">+10 bonus credits</span>
                            </p>
                            <p className="text-xs text-green-800 dark:text-green-200 flex items-center gap-1.5">
                              <span className="text-green-600">✓</span>
                              <span className="font-medium">10% off all credit packs</span>
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleRemoveReferralCode}
                          className="shrink-0 p-1 hover:bg-green-200 dark:hover:bg-green-800 rounded-md transition-colors"
                          title="Remove referral code"
                        >
                          <X className="w-4 h-4 text-green-700 dark:text-green-300" />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Manual Referral Code Input */}
                  {!pendingReferralCode && mode === 'sign-up' && (
                    <div className="w-full mb-6">
                      {!showReferralInput ? (
                        <button
                          onClick={() => setShowReferralInput(true)}
                          className="w-full p-3 border-2 border-dashed border-muted-foreground/20 hover:border-primary/40 rounded-lg transition-colors group"
                        >
                          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground group-hover:text-primary transition-colors">
                            <Gift className="w-4 h-4" />
                            <span>Have a referral code?</span>
                          </div>
                        </button>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="p-5 border-2 border-primary/20 rounded-lg bg-primary/5"
                        >
                          <div className="flex items-center gap-2 mb-4">
                            <Gift className="w-5 h-5 text-primary" />
                            <span className="text-sm font-semibold">Enter referral code</span>
                          </div>
                          
                          {/* Input on its own line for better visibility */}
                          <div className="space-y-3">
                            <Input
                              placeholder="e.g. ABC123"
                              value={manualReferralCode}
                              onChange={(e) => setManualReferralCode(e.target.value.toUpperCase())}
                              onKeyDown={(e) => e.key === 'Enter' && handleApplyReferralCode()}
                              className="w-full font-mono text-lg h-14 px-5 tracking-widest text-center placeholder:tracking-normal placeholder:text-base"
                              maxLength={20}
                              autoFocus
                            />
                            
                            {/* Buttons below input */}
                            <div className="flex gap-2">
                              <Button
                                onClick={handleApplyReferralCode}
                                disabled={!manualReferralCode.trim()}
                                className="flex-1 h-11 font-medium"
                              >
                                Apply Code
                              </Button>
                              <Button
                                onClick={() => {
                                  setShowReferralInput(false);
                                  setManualReferralCode('');
                                }}
                                variant="outline"
                                className="h-11 px-6"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                          
                          <p className="text-xs text-muted-foreground mt-3 text-center">
                            Get +10 credits and 10% off credit packs when you sign up with a friend's code
                          </p>
                        </motion.div>
                      )}
                    </div>
                  )}

                  <SignUp
                    routing="hash"
                    forceRedirectUrl="/portfolio-scanner"
                  />

                  {/* Terms of Service notice */}
                  <p className="mt-4 text-xs text-muted-foreground text-center max-w-sm">
                    By signing up, you agree to our{' '}
                    <Link to="/terms" target="_blank" className="text-primary hover:underline">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" target="_blank" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <button
                      onClick={() => setMode('sign-in')}
                      className="text-primary font-medium hover:underline transition-colors"
                    >
                      Sign in
                    </button>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Right Column - Visual */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="hidden md:block relative h-[650px] w-full bg-slate-50 dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-2xl sticky top-12"
          >
             {/* Background Gradient & Shapes */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-sky-50 to-white dark:from-indigo-950/30 dark:via-sky-950/30 dark:to-slate-950 z-0" />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10 h-full flex flex-col justify-center px-12 py-12">
              <div className="mb-8">
                <div className="inline-flex items-center rounded-full border bg-white/50 backdrop-blur px-3 py-1 text-xs font-medium text-indigo-600 mb-6 shadow-sm">
                  <Sparkles className="mr-1 h-3 w-3" />
                  Start your journey
                </div>
                <h2 className="text-3xl font-bold tracking-tight mb-4 text-balance">
                  Join 50,000+ students turning their stories into success.
                </h2>
                <p className="text-muted-foreground text-lg">
                  Get personalized guidance, uncover hidden strengths, and build a portfolio that stands out.
                </p>
              </div>

              {/* Mini Testimonial Card */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 max-w-sm mt-auto">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500" />
                  <div>
                    <p className="font-semibold text-sm">Sarah K.</p>
                    <p className="text-xs text-muted-foreground">Class of 2024</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  "Uplift helped me realize my summer job was actually a huge leadership asset for my application."
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
