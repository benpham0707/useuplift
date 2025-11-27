import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { useAuth as useClerkAuth, useClerk } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '@/lib/utils';
import { 
  User, 
  CreditCard, 
  Zap, 
  AlertTriangle, 
  ExternalLink, 
  LogOut,
  Trash2,
  History,
  Crown,
  Loader2
} from 'lucide-react';
import GradientZap from '@/components/ui/GradientZap';
import Navigation from '@/components/Navigation';

interface CreditTransaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

const Settings = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const { getToken } = useClerkAuth();
  const { openUserProfile } = useClerk();
  const navigate = useNavigate();
  
  const [credits, setCredits] = useState<number | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  // Load profile data
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/auth');
      return;
    }

    const loadProfile = async () => {
      try {
        setProfileLoading(true);
        
        // Load profile with credits and subscription status
        const { data: profile } = await supabase
          .from('profiles')
          .select('credits, subscription_status')
          .eq('user_id', user.id)
          .maybeSingle() as { data: any; error: any };

        if (profile) {
          setCredits(profile.credits ?? 0);
          setSubscriptionStatus(profile.subscription_status ?? 'none');
        }

        // Load recent transactions
        const { data: txns } = await (supabase as any)
          .from('credit_transactions')
          .select('id, amount, type, description, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10) as { data: CreditTransaction[] | null; error: any };

        if (txns) {
          setTransactions(txns);
        }
      } catch (err) {
        console.error('[Settings] Error loading profile:', err);
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
  }, [user, authLoading, navigate]);

  // Handle Stripe Customer Portal
  const handleManageSubscription = async () => {
    try {
      setIsLoadingPortal(true);
      const token = await getToken();
      
      if (!token) {
        navigate('/auth');
        return;
      }

      const response = await apiFetch('/api/v1/billing/portal', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/settings`,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to open billing portal');
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Portal error:', error);
    } finally {
      setIsLoadingPortal(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      const token = await getToken();
      
      if (!token) {
        navigate('/auth');
        return;
      }

      // Soft-delete profile by setting deleted_at
      const { error } = await supabase
        .from('profiles')
        .update({ deleted_at: new Date().toISOString() })
        .eq('user_id', user?.id);

      if (error) {
        console.error('Delete error:', error);
        return;
      }

      // Sign out after deletion
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Format transaction type for display
  const formatTransactionType = (type: string) => {
    switch (type) {
      case 'subscription_grant':
        return 'Subscription';
      case 'addon_purchase':
        return 'Credit Pack';
      case 'usage':
        return 'Usage';
      case 'bonus':
        return 'Bonus';
      default:
        return type;
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navigation />
      
      <div className="max-w-4xl mx-auto p-4 md:p-8 pb-20 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
          <p className="text-muted-foreground">
            Manage your account, subscription, and preferences.
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4 hidden sm:inline" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="subscription" className="gap-2">
              <Crown className="h-4 w-4 hidden sm:inline" />
              Plan
            </TabsTrigger>
            <TabsTrigger value="credits" className="gap-2">
              <Zap className="h-4 w-4 hidden sm:inline" />
              Credits
            </TabsTrigger>
            <TabsTrigger value="danger" className="gap-2">
              <AlertTriangle className="h-4 w-4 hidden sm:inline" />
              Account
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Your account details managed through Clerk.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">{user.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Account ID: {user.id.slice(0, 12)}...
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" onClick={() => openUserProfile()}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Manage Profile
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  Your Plan
                </CardTitle>
                <CardDescription>
                  Manage your subscription and billing.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg">
                        {subscriptionStatus === 'active' ? 'Pro Plan' : 'Free Plan'}
                      </span>
                      <Badge variant={subscriptionStatus === 'active' ? 'default' : 'secondary'}>
                        {subscriptionStatus === 'active' ? 'Active' : 'No subscription'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {subscriptionStatus === 'active' 
                        ? '100 credits/month with rollover'
                        : 'Pay-as-you-go credits only'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-2xl font-bold">
                      <GradientZap className="h-5 w-5" />
                      {credits ?? 0}
                    </div>
                    <p className="text-xs text-muted-foreground">credits available</p>
                  </div>
                </div>

                {subscriptionStatus === 'active' && (
                  <div className="p-4 border rounded-lg space-y-2">
                    <p className="text-sm font-medium">Subscription Management</p>
                    <p className="text-sm text-muted-foreground">
                      Update payment method, view invoices, or cancel your subscription through the Stripe portal.
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex gap-3">
                {subscriptionStatus === 'active' ? (
                  <Button 
                    onClick={handleManageSubscription}
                    disabled={isLoadingPortal}
                  >
                    {isLoadingPortal ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CreditCard className="h-4 w-4 mr-2" />
                    )}
                    Manage Subscription
                  </Button>
                ) : (
                  <Button onClick={() => navigate('/pricing')}>
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade to Pro
                  </Button>
                )}
                <Button variant="outline" onClick={() => navigate('/pricing')}>
                  View Plans
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Credits Tab */}
          <TabsContent value="credits" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GradientZap className="h-5 w-5" />
                  Credit Balance
                </CardTitle>
                <CardDescription>
                  Your current balance and usage history.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-6 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Available Credits</p>
                    <p className="text-4xl font-bold">{credits ?? 0}</p>
                  </div>
                  <Button onClick={() => navigate('/pricing')}>
                    Buy More
                  </Button>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-medium">Recent Transactions</h3>
                  </div>
                  
                  {transactions.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No transactions yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {transactions.map((tx) => (
                        <div 
                          key={tx.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{tx.description}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant="outline" className="text-xs">
                                {formatTransactionType(tx.type)}
                              </Badge>
                              <span>{formatDate(tx.created_at)}</span>
                            </div>
                          </div>
                          <span className={`font-semibold ${tx.amount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {tx.amount >= 0 ? '+' : ''}{tx.amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Danger Zone Tab */}
          <TabsContent value="danger" className="space-y-6">
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Irreversible actions for your account.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Sign Out */}
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="space-y-1">
                    <p className="font-medium">Sign Out</p>
                    <p className="text-sm text-muted-foreground">
                      Sign out of your account on this device.
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => signOut()}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>

                <Separator />

                {/* Delete Account */}
                <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/30 bg-destructive/5">
                  <div className="space-y-1">
                    <p className="font-medium text-destructive">Delete Account</p>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your account
                          and remove all your data from our servers, including:
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Your profile information</li>
                            <li>All saved essays and analyses</li>
                            <li>Your credit balance ({credits ?? 0} credits)</li>
                            <li>Subscription (if active)</li>
                          </ul>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAccount}
                          disabled={isDeleting}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isDeleting ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-2" />
                          )}
                          Yes, delete my account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
