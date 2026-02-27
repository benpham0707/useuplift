import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePortfolioSuggestions } from '@/hooks/useDashboard';
import { Sparkles, X, ChevronRight, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/safeClient';
import { useAuth } from '@/hooks/useAuth';

/**
 * Activity Portfolio Widget - AI-powered portfolio insights
 *
 * Displays portfolio score and personalized improvement suggestions
 * with dismissible cards and navigation to relevant tools.
 */
export default function ActivityPortfolioWidget() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { suggestions, loading, dismissSuggestion } = usePortfolioSuggestions();
  const [portfolioScore, setPortfolioScore] = useState<number | null>(null);
  const [scoreLoading, setScoreLoading] = useState(true);

  // Load portfolio score
  useEffect(() => {
    const loadPortfolioScore = async () => {
      if (!user) {
        setScoreLoading(false);
        return;
      }

      try {
        // Try to get the latest assessment report
        const { data } = await supabase
          .from('assessment_reports')
          .select('overall_score')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (data) {
          setPortfolioScore(data.overall_score);
        }
      } catch (error) {
        console.error('Error loading portfolio score:', error);
      } finally {
        setScoreLoading(false);
      }
    };

    loadPortfolioScore();
  }, [user]);

  if (loading || scoreLoading) {
    return <ActivityPortfolioWidgetSkeleton />;
  }

  const handleSuggestionClick = (link?: string) => {
    if (link) {
      navigate(link);
    }
  };

  const handleDismiss = (e: React.MouseEvent, suggestionId: string) => {
    e.stopPropagation();
    dismissSuggestion(suggestionId);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Leadership: 'bg-purple-100 text-purple-800 border-purple-200',
      'Community Service': 'bg-blue-100 text-blue-800 border-blue-200',
      'Academic Enrichment': 'bg-green-100 text-green-800 border-green-200',
      Sports: 'bg-orange-100 text-orange-800 border-orange-200',
      Arts: 'bg-pink-100 text-pink-800 border-pink-200',
      default: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[category] || colors.default;
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>Portfolio Insights</CardTitle>
          </div>
          {portfolioScore !== null && (
            <Badge variant="secondary" className="text-lg font-bold px-3 py-1">
              <Target className="h-3 w-3 mr-1" />
              {portfolioScore.toFixed(1)}/10
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        {suggestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Complete your portfolio scan
              </p>
              <p className="text-xs text-muted-foreground">
                Get personalized insights to strengthen your application
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard/scanner')}
              className="mt-2"
            >
              Run Scanner
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                onClick={() => handleSuggestionClick(suggestion.related_link)}
                className={cn(
                  "relative p-3 rounded-lg border bg-card transition-all",
                  "hover:shadow-sm hover:border-primary/30",
                  suggestion.related_link && "cursor-pointer"
                )}
              >
                {/* Dismiss Button */}
                <button
                  onClick={(e) => handleDismiss(e, suggestion.id)}
                  className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Dismiss suggestion"
                >
                  <X className="h-3 w-3" />
                </button>

                {/* Suggestion Content */}
                <div className="space-y-2 pr-6">
                  <Badge
                    variant="outline"
                    className={cn("text-xs", getCategoryColor(suggestion.category))}
                  >
                    {suggestion.category}
                  </Badge>
                  <p className="text-sm text-foreground">
                    {suggestion.suggestion_text}
                  </p>
                  {suggestion.related_link && (
                    <div className="flex items-center gap-1 text-xs text-primary">
                      <span>Improve this</span>
                      <ChevronRight className="h-3 w-3" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {suggestions.length > 0 && (
        <CardFooter className="pt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard/insights')}
            className="w-full"
          >
            View all insights →
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

/**
 * Loading skeleton for Activity Portfolio Widget
 */
function ActivityPortfolioWidgetSkeleton() {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-40" />
          </div>
          <Skeleton className="h-7 w-20" />
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 rounded-lg border">
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-8 w-full" />
      </CardFooter>
    </Card>
  );
}