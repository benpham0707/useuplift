/**
 * CollegeDetail Page
 *
 * Full college detail view with stats, programs, application info, and actions
 * Includes "Add to List", "Visit Website", and "Report Issue" functionality
 */

import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/safeClient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import type { College, CollegeCategory, ReportType } from '@/lib/types/college';
import { classifyCollege, getSuggestedCategory } from '@/lib/college-classification';
import {
  ArrowLeft,
  ExternalLink,
  MapPin,
  Users,
  DollarSign,
  Calendar,
  FileText,
  Flag,
  Loader2,
  Building2,
  Heart,
  HeartOff,
} from 'lucide-react';

export default function CollegeDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CollegeCategory>(null);
  const [reportType, setReportType] = useState<ReportType>('incorrect_stat');
  const [reportDescription, setReportDescription] = useState('');

  // Fetch college details
  const { data: college, isLoading, error } = useQuery({
    queryKey: ['college', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('colleges')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data as College;
    },
    enabled: !!slug,
  });

  // Check if user has already saved this college
  const { data: savedItem } = useQuery({
    queryKey: ['user-college-item', user?.id, college?.id],
    queryFn: async () => {
      if (!user?.id || !college?.id) return null;

      const { data, error } = await supabase
        .from('user_college_list')
        .select('*')
        .eq('user_id', user.id)
        .eq('college_id', college.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !!college?.id,
  });

  // Fetch user's GPA and test scores for classification
  const { data: userProfile } = useQuery({
    queryKey: ['user-academic-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('academic_journey')
        .select('gpa, standardized_tests')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Save college mutation
  const saveMutation = useMutation({
    mutationFn: async (category: CollegeCategory) => {
      if (!user?.id || !college?.id) throw new Error('Missing user or college');

      const { error } = await supabase
        .from('user_college_list')
        .insert({
          user_id: user.id,
          college_id: college.id,
          category,
          status: 'interested',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-college-item'] });
      queryClient.invalidateQueries({ queryKey: ['user-college-list'] });
      toast({
        title: 'College saved!',
        description: `${college?.name} has been added to your list.`,
      });
      setSaveDialogOpen(false);
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast({
          title: 'Already saved',
          description: 'This college is already on your list.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to save college. Please try again.',
          variant: 'destructive',
        });
      }
    },
  });

  // Remove college mutation
  const removeMutation = useMutation({
    mutationFn: async () => {
      if (!savedItem?.id) throw new Error('No saved item');

      const { error } = await supabase
        .from('user_college_list')
        .delete()
        .eq('id', savedItem.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-college-item'] });
      queryClient.invalidateQueries({ queryKey: ['user-college-list'] });
      toast({
        title: 'Removed from list',
        description: `${college?.name} has been removed from your list.`,
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to remove college. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Report issue mutation
  const reportMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !college?.id) throw new Error('Missing user or college');

      const { error } = await supabase
        .from('college_reports')
        .insert({
          user_id: user.id,
          college_id: college.id,
          report_type: reportType,
          description: reportDescription,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Report submitted',
        description: 'Thank you for helping us improve our data!',
      });
      setReportDialogOpen(false);
      setReportDescription('');
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to submit report. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSaveClick = () => {
    if (!college) return;

    // Get suggested category
    const gpa = userProfile?.gpa || null;
    const sat = (userProfile?.standardized_tests as any)?.sat?.total || null;
    const act = (userProfile?.standardized_tests as any)?.act?.composite || null;

    const suggestion = getSuggestedCategory(college, gpa, sat, act);
    setSelectedCategory(suggestion.category);
    setSaveDialogOpen(true);
  };

  const handleSave = () => {
    saveMutation.mutate(selectedCategory);
  };

  const handleRemove = () => {
    removeMutation.mutate();
  };

  const handleReportSubmit = () => {
    if (!reportDescription.trim()) {
      toast({
        title: 'Description required',
        description: 'Please provide a description of the issue.',
        variant: 'destructive',
      });
      return;
    }
    reportMutation.mutate();
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            We couldn't find that college. It may have been removed or the URL is incorrect.
          </p>
          <Button onClick={() => navigate('/dashboard/colleges')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Colleges
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || !college) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const isSaved = !!savedItem;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header Navigation */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard/colleges')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Colleges
        </Button>
      </div>

      {/* College Header */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 shrink-0 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
              {college.logo_url ? (
                <img
                  src={college.logo_url}
                  alt={`${college.name} logo`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <Building2 className="w-10 h-10 text-slate-400" />
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{college.name}</h1>
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <MapPin className="h-4 w-4" />
                <span>
                  {college.city}, {college.state}
                </span>
                {college.campus_setting && (
                  <>
                    <span>•</span>
                    <span className="capitalize">{college.campus_setting}</span>
                  </>
                )}
                <span>•</span>
                <span className="capitalize">{college.type}</span>
              </div>
              {college.description && (
                <p className="text-slate-700">{college.description}</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            {isSaved ? (
              <Button
                variant="outline"
                onClick={handleRemove}
                disabled={removeMutation.isPending}
              >
                {removeMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <HeartOff className="h-4 w-4 mr-2" />
                )}
                Remove from List
              </Button>
            ) : (
              <Button onClick={handleSaveClick} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Heart className="h-4 w-4 mr-2" />
                )}
                Add to My List
              </Button>
            )}
            {college.website_url && (
              <Button variant="outline" asChild>
                <a href={college.website_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visit Website
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Key Statistics */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Key Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {college.acceptance_rate !== null && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">Acceptance Rate</div>
                <div className="text-2xl font-semibold">{college.acceptance_rate}%</div>
              </div>
            )}
            {college.avg_gpa_min && college.avg_gpa_max && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">GPA Range</div>
                <div className="text-2xl font-semibold">
                  {college.avg_gpa_min} - {college.avg_gpa_max}
                </div>
              </div>
            )}
            {college.avg_sat_min && college.avg_sat_max && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">SAT Range</div>
                <div className="text-2xl font-semibold">
                  {college.avg_sat_min} - {college.avg_sat_max}
                </div>
              </div>
            )}
            {college.avg_act_min && college.avg_act_max && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">ACT Range</div>
                <div className="text-2xl font-semibold">
                  {college.avg_act_min} - {college.avg_act_max}
                </div>
              </div>
            )}
            {college.tuition_out_of_state && (
              <div>
                <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  Tuition (Out-of-State)
                </div>
                <div className="text-2xl font-semibold">
                  ${college.tuition_out_of_state.toLocaleString()}/year
                </div>
              </div>
            )}
            {college.tuition_in_state && college.type === 'public' && (
              <div>
                <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  Tuition (In-State)
                </div>
                <div className="text-2xl font-semibold">
                  ${college.tuition_in_state.toLocaleString()}/year
                </div>
              </div>
            )}
            {college.financial_aid_percentage && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">Financial Aid</div>
                <div className="text-2xl font-semibold">
                  {college.financial_aid_percentage}% receive aid
                </div>
              </div>
            )}
            {college.enrollment_size && (
              <div>
                <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  Enrollment
                </div>
                <div className="text-2xl font-semibold">
                  {college.enrollment_size.toLocaleString()} undergraduates
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Program Highlights */}
      {(college.popular_majors.length > 0 || college.program_strengths.length > 0) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Program Highlights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {college.program_strengths.length > 0 && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2">Strengths</div>
                <div className="flex flex-wrap gap-2">
                  {college.program_strengths.map((strength) => (
                    <Badge key={strength} variant="secondary">
                      {strength}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {college.popular_majors.length > 0 && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  Popular Majors
                </div>
                <div className="flex flex-wrap gap-2">
                  {college.popular_majors.map((major) => (
                    <Badge key={major} variant="outline">
                      {major}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Application Information */}
      {(Object.keys(college.application_deadlines).length > 0 ||
        college.required_materials.length > 0) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Application Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.keys(college.application_deadlines).length > 0 && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Deadlines
                </div>
                <ul className="space-y-1">
                  {Object.entries(college.application_deadlines).map(([key, value]) => (
                    <li key={key} className="text-sm">
                      <span className="font-medium capitalize">
                        {key.replace(/_/g, ' ')}:
                      </span>{' '}
                      {value}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {college.required_materials.length > 0 && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  Required Materials
                </div>
                <ul className="list-disc list-inside space-y-1">
                  {college.required_materials.map((material) => (
                    <li key={material} className="text-sm">
                      {material}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Report Issue Link */}
      <div className="text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setReportDialogOpen(true)}
          className="text-muted-foreground"
        >
          <Flag className="h-4 w-4 mr-2" />
          Report an issue with this data
        </Button>
      </div>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Your College List</DialogTitle>
            <DialogDescription>
              Choose how to categorize {college.name} on your list
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="category">Category</Label>
            <Select
              value={selectedCategory || ''}
              onValueChange={(value) => setSelectedCategory(value as CollegeCategory)}
            >
              <SelectTrigger id="category" className="mt-2">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reach">Reach</SelectItem>
                <SelectItem value="match">Match</SelectItem>
                <SelectItem value="safety">Safety</SelectItem>
              </SelectContent>
            </Select>
            {!selectedCategory && (
              <p className="text-sm text-muted-foreground mt-2">
                Add your GPA and test scores in Settings to get automatic suggestions
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Issue Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report an Issue</DialogTitle>
            <DialogDescription>
              Help us improve our college data by reporting any errors or outdated information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="reportType">Issue Type</Label>
              <Select
                value={reportType}
                onValueChange={(value) => setReportType(value as ReportType)}
              >
                <SelectTrigger id="reportType" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="incorrect_stat">Incorrect Statistic</SelectItem>
                  <SelectItem value="outdated_info">Outdated Information</SelectItem>
                  <SelectItem value="missing_program">Missing Program</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Please describe the issue..."
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                className="mt-2"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReportSubmit} disabled={reportMutation.isPending}>
              {reportMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
