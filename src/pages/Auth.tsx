import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'sign-up' ? 'sign-up' : 'sign-in';
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>(initialMode);

  // Sync mode with URL parameter on navigation
  useEffect(() => {
    const urlMode = searchParams.get('mode') === 'sign-up' ? 'sign-up' : 'sign-in';
    setMode(urlMode);
  }, [searchParams]);

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
                  <SignUp 
                    routing="hash"
                    forceRedirectUrl="/portfolio-scanner"
                  />
                  <p className="mt-4 text-sm text-muted-foreground">
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
