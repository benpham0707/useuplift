import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/safeClient';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  AlertTriangle, 
  ExternalLink, 
  LogOut,
  Trash2,
  History,
  Loader2,
  Zap
} from 'lucide-react';
import GradientZap from '@/components/ui/GradientZap';
import { ReferralCard } from '@/components/ReferralCard';
import { useSettingsData, type CreditTransaction } from '@/query/useSettingsData';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/query/queryKeys';

const Settings = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const { getToken } = useClerkAuth();
  const { openUserProfile } = useClerk();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Load settings data from React Query cache
  const {
    data: settingsData,
    isLoading: profileLoading,
  } = useSettingsData(user?.id || null);

  const credits = settingsData?.credits ?? 0;
  const transactions = settingsData?.transactions ?? [];

  // Account deletion mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('No user');

      const { error } = await supabase
        .from('profiles')
        .update({ deleted_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: async () => {
      // Clear all caches
      queryClient.clear();
      // Sign out after deletion
      await signOut();
      navigate('/');
    },
    onError: (error) => {
      console.error('Failed to delete account:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete account. Please try again.',
        variant: 'destructive',
      });
    },
  });

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

  // Redirect if not authenticated
  if (!authLoading && !user) {
    navigate('/auth');
    return null;
  }

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      <div className="max-w-3xl mx-auto p-4 md:p-8 pb-20 space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
          <p className="text-muted-foreground">
            Manage your account, subscription, and preferences.
          </p>
        </div>

        {/* Profile Section */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-primary" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
              <div className="flex items-center gap-4 flex-1">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{user.email}</p>
                  <p className="text-sm text-muted-foreground">
                    ID: {user.id.slice(0, 12)}...
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => openUserProfile()}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Manage
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Credits Overview */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <GradientZap className="h-5 w-5" />
              Credits & Billing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Current Balance</span>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold">{credits ?? 0}</p>
                  <span className="text-sm text-muted-foreground">credits</span>
                </div>
              </div>
              <Zap className="h-8 w-8 text-yellow-500 fill-yellow-500 opacity-20" />
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Button size="sm" onClick={() => navigate('/pricing')}>
              Buy More Credits
            </Button>
          </CardFooter>
        </Card>

        {/* Referral Card */}
        <ReferralCard />

        {/* Credits & History Section */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <CardTitle className="flex items-center gap-2 text-lg">
                <History className="h-5 w-5 text-primary" />
                Transaction History
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-3 text-center border rounded-lg">
                No transactions yet.
              </p>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div 
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">{tx.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs py-0">
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
          </CardContent>
        </Card>

        {/* Account Actions Section */}
        <Card className="border-destructive/20">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Sign Out */}
            <div className="flex flex-row items-center justify-between gap-4 flex-wrap sm:flex-nowrap p-3 rounded-lg border">
              <div className="flex-1 min-w-[220px]">
                <p className="font-medium text-sm">Sign Out</p>
                <p className="text-xs text-muted-foreground">
                  Sign out of your account on this device.
                </p>
              </div>
              <div className="shrink-0">
                <Button variant="outline" size="sm" onClick={() => signOut()}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>

            {/* Delete Account */}
            <div className="flex flex-row items-center justify-between gap-4 flex-wrap sm:flex-nowrap p-3 rounded-lg border border-destructive/30 bg-destructive/5">
              <div className="flex-1 min-w-[220px]">
                <p className="font-medium text-sm text-destructive">Delete Account</p>
                <p className="text-xs text-muted-foreground">
                  Permanently delete your account and all data.
                </p>
              </div>
              <div className="shrink-0">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
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
                        </ul>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteAccountMutation.mutate()}
                        disabled={deleteAccountMutation.isPending}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deleteAccountMutation.isPending ? (
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
