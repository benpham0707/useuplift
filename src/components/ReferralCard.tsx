import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useToast } from '@/hooks/use-toast';
import { Share2, Copy, Check, Users, Gift, Loader2 } from 'lucide-react';

interface ReferralStats {
  code: string;
  shareLink: string;
  stats: {
    totalReferrals: number;
    signupBonuses: number;
    purchaseBonuses: number;
    totalCreditsEarned: number;
  };
}

export const ReferralCard = () => {
  const { getToken } = useClerkAuth();
  const { toast } = useToast();
  const [referralData, setReferralData] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch('/api/v1/referrals/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReferralData(data);
      } else {
        setError('Failed to load referral data');
      }
    } catch (error) {
      console.error('Failed to load referral data:', error);
      setError('Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!referralData) return;

    try {
      await navigator.clipboard.writeText(referralData.shareLink);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Share2 className="h-5 w-5 text-primary" />
            Refer a Friend
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error || !referralData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Share2 className="h-5 w-5 text-primary" />
            Refer a Friend
          </CardTitle>
          <CardDescription>
            Share your link and earn rewards when friends join
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center py-4">
            {error || 'Failed to load referral data'}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={loadReferralData}
            className="w-full"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Share2 className="h-5 w-5 text-primary" />
          Refer a Friend
        </CardTitle>
        <CardDescription>
          Share your link and earn rewards when friends join
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Referral Code & Link */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Input
              value={referralData.shareLink}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={copyToClipboard}
              className="shrink-0"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Your referral code: <span className="font-mono font-bold">{referralData.code}</span>
          </p>
        </div>

        {/* How It Works */}
        <div className="p-4 bg-secondary/30 rounded-lg space-y-3">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Gift className="h-4 w-4 text-primary" />
            How Referrals Work
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>Your friend gets <strong>+10 credits</strong> & <strong>10% off</strong> all packs</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>You get <strong>+25 credits</strong> when they sign up</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>You get <strong>+25 credits</strong> when they make their first purchase</span>
            </li>
          </ul>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg border bg-card">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Referrals</span>
            </div>
            <p className="text-2xl font-bold">{referralData.stats.totalReferrals}</p>
          </div>
          <div className="p-3 rounded-lg border bg-card">
            <div className="flex items-center gap-2 mb-1">
              <Gift className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Credits Earned</span>
            </div>
            <p className="text-2xl font-bold">{referralData.stats.totalCreditsEarned}</p>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="pt-3 border-t space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Signup bonuses earned</span>
            <span className="font-medium">{referralData.stats.signupBonuses} × 25 = {referralData.stats.signupBonuses * 25} credits</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Purchase bonuses earned</span>
            <span className="font-medium">{referralData.stats.purchaseBonuses} × 25 = {referralData.stats.purchaseBonuses * 25} credits</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
