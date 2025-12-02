import { ReactNode, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollText, Shield, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface RequireTermsAcceptedProps {
  children: ReactNode;
}

const RequireTermsAccepted = ({ children }: RequireTermsAcceptedProps) => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    const checkTermsAccepted = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('terms_accepted_at')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error checking terms acceptance:', error);
          // If there's an error, let them through (fail open) but log it
          setHasAcceptedTerms(true);
        } else if (data?.terms_accepted_at) {
          setHasAcceptedTerms(true);
        } else {
          setHasAcceptedTerms(false);
        }
      } catch (err) {
        console.error('Error checking terms:', err);
        setHasAcceptedTerms(true); // Fail open
      } finally {
        setLoading(false);
      }
    };

    checkTermsAccepted();
  }, [user, authLoading]);

  const handleAcceptTerms = async () => {
    if (!user || !isChecked) return;

    setIsSubmitting(true);
    try {
      // Use upsert to handle case where profile doesn't exist yet
      // This ensures terms acceptance is saved even if webhook didn't create profile
      const { data, error } = await supabase
        .from('profiles')
        .upsert(
          {
            user_id: user.id,
            terms_accepted_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id',
            ignoreDuplicates: false,
          }
        )
        .select('terms_accepted_at')
        .single();

      if (error) {
        console.error('Error accepting terms:', error);
        alert('There was an error saving your acceptance. Please try again.');
      } else if (data?.terms_accepted_at) {
        setHasAcceptedTerms(true);
      } else {
        console.error('Terms acceptance not saved - no data returned');
        alert('There was an error saving your acceptance. Please try again.');
      }
    } catch (err) {
      console.error('Error accepting terms:', err);
      alert('There was an error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Not logged in - let RequireVerified handle the redirect
    return <>{children}</>;
  }

  if (hasAcceptedTerms) {
    return <>{children}</>;
  }

  // Show Terms acceptance UI
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <Card className="border-2">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <ScrollText className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Welcome to Uplift!</CardTitle>
            <CardDescription className="text-base mt-2">
              Before you get started, please review and accept our Terms of Service.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Key Points Summary */}
            <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Key Points
              </h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>You retain ownership of all your essays and content</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>AI suggestions are guidance tools, not guarantees of admission</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>You must be at least 13 years old to use Uplift</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Your data is protected according to our Privacy Policy</span>
                </li>
              </ul>
            </div>

            {/* Links to full documents */}
            <div className="flex justify-center gap-4 text-sm">
              <Link
                to="/terms"
                target="_blank"
                className="text-primary hover:underline flex items-center gap-1"
              >
                <ScrollText className="h-3.5 w-3.5" />
                Terms of Service
              </Link>
              <Link
                to="/privacy"
                target="_blank"
                className="text-primary hover:underline flex items-center gap-1"
              >
                <Shield className="h-3.5 w-3.5" />
                Privacy Policy
              </Link>
            </div>

            {/* Checkbox */}
            <div className="flex items-start space-x-3 pt-2">
              <Checkbox
                id="terms-checkbox"
                checked={isChecked}
                onCheckedChange={(checked) => setIsChecked(checked === true)}
                className="mt-0.5"
              />
              <label
                htmlFor="terms-checkbox"
                className="text-sm leading-relaxed cursor-pointer"
              >
                I have read and agree to the{' '}
                <Link to="/terms" target="_blank" className="text-primary hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" target="_blank" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleAcceptTerms}
              disabled={!isChecked || isSubmitting}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Continue to Uplift
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default RequireTermsAccepted;

