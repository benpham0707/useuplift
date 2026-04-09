/**
 * MyCollegeList Page
 *
 * User's saved college list with Reach/Match/Safety categorization
 * Allows category override, status updates, and removal
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/safeClient';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { UserCollegeListItem, College, CollegeCategory, ApplicationStatus } from '@/lib/types/college';
import { Building2, Loader2, X, ExternalLink, AlertCircle } from 'lucide-react';

export default function MyCollegeList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch user's college list with college details
  const { data: collegeList, isLoading } = useQuery({
    queryKey: ['user-college-list', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('user_college_list')
        .select(`
          *,
          college:colleges(*)
        `)
        .eq('user_id', user.id)
        .order('added_at', { ascending: false });

      if (error) throw error;
      return data as Array<UserCollegeListItem & { college: College }>;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, category }: { id: string; category: CollegeCategory }) => {
      const { error } = await supabase
        .from('user_college_list')
        .update({ category })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-college-list'] });
      toast({
        title: 'Category updated',
        description: 'College category has been updated.',
      });
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ApplicationStatus }) => {
      const { error } = await supabase
        .from('user_college_list')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-college-list'] });
      toast({
        title: 'Status updated',
        description: 'Application status has been updated.',
      });
    },
  });

  // Remove college mutation
  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_college_list')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-college-list'] });
      toast({
        title: 'Removed from list',
        description: 'College has been removed from your list.',
      });
    },
  });

  // Group colleges by category
  const grouped = {
    uncategorized: collegeList?.filter((item) => !item.category) || [],
    reach: collegeList?.filter((item) => item.category === 'reach') || [],
    match: collegeList?.filter((item) => item.category === 'match') || [],
    safety: collegeList?.filter((item) => item.category === 'safety') || [],
  };

  const categoryBadgeColors = {
    reach: 'bg-red-100 text-red-800 border-red-200',
    match: 'bg-green-100 text-green-800 border-green-200',
    safety: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  const CollegeListItem = ({ item }: { item: UserCollegeListItem & { college: College } }) => {
    const { college } = item;

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Logo */}
            <div className="w-12 h-12 shrink-0 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
              {college.logo_url ? (
                <img
                  src={college.logo_url}
                  alt={`${college.name} logo`}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              ) : (
                <Building2 className="w-6 h-6 text-slate-400" />
              )}
            </div>

            {/* College Info */}
            <div className="flex-1 min-w-0">
              <h3
                className="font-semibold text-base mb-1 hover:text-primary cursor-pointer"
                onClick={() => navigate(`/dashboard/colleges/${college.slug}`)}
              >
                {college.name}
              </h3>
              <div className="text-sm text-muted-foreground mb-2">
                {college.city}, {college.state}
                {college.acceptance_rate && ` • ${college.acceptance_rate}% acceptance`}
                {college.tuition_out_of_state && ` • $${(college.tuition_out_of_state / 1000).toFixed(0)}k tuition`}
              </div>

              {/* Actions Row */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Category Selector */}
                <Select
                  value={item.category || 'uncategorized'}
                  onValueChange={(value) =>
                    updateCategoryMutation.mutate({
                      id: item.id,
                      category: value === 'uncategorized' ? null : (value as CollegeCategory),
                    })
                  }
                >
                  <SelectTrigger className="w-[130px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uncategorized">Uncategorized</SelectItem>
                    <SelectItem value="reach">Reach</SelectItem>
                    <SelectItem value="match">Match</SelectItem>
                    <SelectItem value="safety">Safety</SelectItem>
                  </SelectContent>
                </Select>

                {/* Status Selector */}
                <Select
                  value={item.status}
                  onValueChange={(value) =>
                    updateStatusMutation.mutate({
                      id: item.id,
                      status: value as ApplicationStatus,
                    })
                  }
                >
                  <SelectTrigger className="w-[130px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interested">Interested</SelectItem>
                    <SelectItem value="researching">Researching</SelectItem>
                    <SelectItem value="applying">Applying</SelectItem>
                    <SelectItem value="applied">Applied</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="denied">Denied</SelectItem>
                    <SelectItem value="waitlisted">Waitlisted</SelectItem>
                    <SelectItem value="enrolled">Enrolled</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/dashboard/colleges/${college.slug}`)}
                >
                  View
                </Button>

                {/* Remove Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeMutation.mutate(item.id)}
                  disabled={removeMutation.isPending}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const CategorySection = ({
    title,
    items,
    badge,
  }: {
    title: string;
    items: Array<UserCollegeListItem & { college: College }>;
    badge?: React.ReactNode;
  }) => {
    if (items.length === 0) return null;

    return (
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          {badge}
          <span className="text-sm text-muted-foreground">• {items.length} {items.length === 1 ? 'school' : 'schools'}</span>
        </div>
        <div className="space-y-3">
          {items.map((item) => (
            <CollegeListItem key={item.id} item={item} />
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const totalColleges = collegeList?.length || 0;
  const hasUncategorized = grouped.uncategorized.length > 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My College List</h1>
        {totalColleges > 0 && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{totalColleges} total</span>
            {grouped.reach.length > 0 && <span>{grouped.reach.length} Reach</span>}
            {grouped.match.length > 0 && <span>{grouped.match.length} Match</span>}
            {grouped.safety.length > 0 && <span>{grouped.safety.length} Safety</span>}
          </div>
        )}
      </div>

      {/* Empty State */}
      {totalColleges === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No colleges saved yet</h3>
            <p className="text-muted-foreground mb-6">
              Start building your college list by browsing and saving colleges
            </p>
            <Button onClick={() => navigate('/dashboard/colleges')}>
              Browse Colleges
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Balance Check Tip */}
      {totalColleges > 0 && grouped.reach.length >= 5 && grouped.safety.length === 0 && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-yellow-900 mb-1">Balance your list</div>
                <p className="text-sm text-yellow-800">
                  💡 Most counselors recommend at least 2 safety schools. Your list has {grouped.reach.length} reach schools but no safeties.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Uncategorized Section */}
      {hasUncategorized && (
        <CategorySection
          title="Uncategorized"
          items={grouped.uncategorized}
          badge={
            <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
              ⚠ Add your GPA to categorize
            </Badge>
          }
        />
      )}

      {/* Reach Section */}
      <CategorySection
        title="Reach"
        items={grouped.reach}
        badge={<Badge variant="outline" className={categoryBadgeColors.reach}>Reach</Badge>}
      />

      {/* Match Section */}
      <CategorySection
        title="Match"
        items={grouped.match}
        badge={<Badge variant="outline" className={categoryBadgeColors.match}>Match</Badge>}
      />

      {/* Safety Section */}
      <CategorySection
        title="Safety"
        items={grouped.safety}
        badge={<Badge variant="outline" className={categoryBadgeColors.safety}>Safety</Badge>}
      />
    </div>
  );
}
