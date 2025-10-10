import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { Trash2, Plus, Edit, ChevronDown } from 'lucide-react';
import { apiFetch } from '@/lib/utils';

const EXPERIENCE_TYPE = [
  { id: 'work', label: 'Work' },
  { id: 'volunteer', label: 'Volunteer' },
  { id: 'school_activity', label: 'School activity' },
  { id: 'project', label: 'Personal project' },
] as const;

const TIME_COMMITMENT = [
  { id: 'part_time', label: 'Part-time' },
  { id: 'full_time', label: 'Full-time' },
  { id: 'seasonal', label: 'Seasonal' },
  { id: 'one_time', label: 'One-time' },
] as const;

interface Experience {
  id: string;
  category: string;
  title: string;
  organization: string;
  startDate: string;
  endDate: string;
  isOngoing: boolean;
  timeCommitment: string;
  totalHours: string;
  description: string;
  responsibilities: string[];
  achievements: string[];
  skills: string[];
  verificationUrl: string;
  supervisorName: string;
  canContact: boolean;
}

// Counter to ensure stable IDs
let idCounter = 0;

const createEmptyExperience = (): Experience => ({
  id: `exp_${++idCounter}_${Date.now()}`,
  category: '',
  title: '',
  organization: '',
  startDate: '',
  endDate: '',
  isOngoing: false,
  timeCommitment: '',
  totalHours: '',
  description: '',
  responsibilities: [],
  achievements: [],
  skills: [],
  verificationUrl: '',
  supervisorName: '',
  canContact: false,
});

interface Props {
  onAdded?: (payload: { id: string }) => void;
  onClose?: () => void;
}

export default function ExperiencesWizard({ onAdded, onClose }: Props) {
  const { toast } = useToast();
  const [experiences, setExperiences] = useState<Experience[]>([
    createEmptyExperience(),
    createEmptyExperience(),
    createEmptyExperience(),
  ]);
  const [saving, setSaving] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [descriptionDrafts, setDescriptionDrafts] = useState<Record<string, string>>({});

  // Ensure stable IDs for any pre-existing items (after hot reloads)
  useEffect(() => {
    setExperiences((prev) => prev.map((e) => e?.id ? e : { ...e, id: `exp_${++idCounter}_${Date.now()}` }));
  }, []);

  // Prefill from experiences_activities
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (!profile?.id) return;
        setProfileId(profile.id);

        const { data: ea } = await supabase
          .from('experiences_activities')
          .select('*')
          .eq('profile_id', profile.id)
          .maybeSingle();
        if (!ea) return;

        const flatten = (arr: any[] | null | undefined) => Array.isArray(arr) ? arr : [];
        const toExp = (item: any, category: string): Experience => ({
          id: `exp_${++idCounter}_${Date.now()}`,
          category,
          title: item.title || '',
          organization: item.organization || '',
          startDate: item.start_date || '',
          endDate: item.end_date || '',
          isOngoing: Boolean(item.is_ongoing),
          timeCommitment: item.time_commitment || '',
          totalHours: item.total_hours?.toString?.() || '',
          description: item.description || '',
          responsibilities: item.responsibilities || [],
          achievements: item.achievements || [],
          skills: item.skills || item.skills_demonstrated?.map?.((s: any) => s.name) || [],
          verificationUrl: item.verification_url || '',
          supervisorName: item.supervisor_name || '',
          canContact: Boolean(item.can_contact),
        });

        const merged: Experience[] = [
          ...flatten(ea.work_experiences as any[]).map((i: any) => toExp(i, 'work')),
          ...flatten(ea.volunteer_service as any[]).map((i: any) => toExp(i, 'volunteer')),
          ...flatten(ea.extracurriculars as any[]).map((i: any) => toExp(i, 'school_activity')),
          ...flatten(ea.personal_projects as any[]).map((i: any) => toExp(i, 'project')),
        ];

        const padded = [...merged];
        while (padded.length < 3) padded.push(createEmptyExperience());
        setExperiences(padded);
        // seed drafts from loaded data
        const seed: Record<string, string> = {};
        padded.forEach((e) => { if (e.id) seed[e.id] = e.description; });
        setDescriptionDrafts(seed);
      } catch {
        // ignore prefill errors
      }
    })();
  }, []);

  const progress = useMemo(() => {
    const valid = experiences.filter(exp => 
      exp.category && exp.title.trim().length >= 2 && exp.description.trim().length >= 10
    );
    const percent = Math.min(100, Math.round((valid.length / 3) * 100));
    return percent;
  }, [experiences]);

  const addExperience = () => {
    setExperiences([...experiences, createEmptyExperience()]);
  };

  const removeExperience = (index: number) => {
    if (experiences.length > 3) {
      setExperiences(experiences.filter((_, i) => i !== index));
      if (expandedIndex === index) setExpandedIndex(null);
    }
  };

  const updateExperience = (index: number, field: keyof Experience, value: any) => {
    setExperiences((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value } as Experience;
      return copy;
    });
  };

  const addChip = (index: number, field: 'responsibilities' | 'achievements' | 'skills', value: string) => {
    const v = value.trim();
    if (!v) return;
    const current = experiences[index][field] as string[];
    if (current.includes(v)) return;
    updateExperience(index, field, [...current, v]);
  };

  const removeChip = (index: number, field: 'responsibilities' | 'achievements' | 'skills', value: string) => {
    const current = experiences[index][field] as string[];
    updateExperience(index, field, current.filter((c) => c !== value));
  };

  const buildPayload = () => {
    const mapItem = (exp: Experience) => ({
      title: exp.title.trim(),
      organization: exp.organization.trim() || null,
      start_date: exp.startDate || null,
      end_date: exp.isOngoing ? null : (exp.endDate || null),
      is_ongoing: Boolean(exp.isOngoing),
      time_commitment: exp.timeCommitment || null,
      total_hours: exp.totalHours ? Number(exp.totalHours) : null,
      description: (descriptionDrafts[exp.id] ?? exp.description).trim(),
      responsibilities: exp.responsibilities || [],
      achievements: exp.achievements || [],
      skills: exp.skills || [],
      verification_url: exp.verificationUrl || null,
      supervisor_name: exp.supervisorName || null,
      can_contact: Boolean(exp.canContact),
    });

    const work = experiences.filter(e => e.category === 'work' && e.title && e.description).map(mapItem);
    const volunteer = experiences.filter(e => e.category === 'volunteer' && e.title && e.description).map(mapItem);
    const school = experiences.filter(e => e.category === 'school_activity' && e.title && e.description).map(mapItem);
    const projects = experiences.filter(e => e.category === 'project' && e.title && e.description).map(mapItem);

    return { work, volunteer, school, projects };
  };

  const upsertExperiences = async (isFinal: boolean) => {
    if (!profileId) throw new Error('Profile not loaded');
    const { work, volunteer, school, projects } = buildPayload();

    const row = {
      profile_id: profileId,
      work_experiences: work,
      volunteer_service: volunteer,
      extracurriculars: school,
      personal_projects: projects,
    } as any;

    const { data: existing, error: fetchErr } = await supabase
      .from('experiences_activities')
      .select('id')
      .eq('profile_id', profileId)
      .maybeSingle();
    if (fetchErr) throw fetchErr;

    if (existing?.id) {
      const { error } = await supabase
        .from('experiences_activities')
        .update(row)
        .eq('id', existing.id as string);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('experiences_activities')
        .insert(row);
      if (error) throw error;
    }

    const bump = isFinal ? 0.75 : 0.45;
    await supabase.from('profiles').update({ completion_score: bump }).eq('id', profileId);

    // Reconcile analytics automatically
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (token) {
        await apiFetch('/api/v1/analytics/reconcile', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
        window.dispatchEvent(new CustomEvent('analytics:reconciled'));
      }
    } catch { /* non-blocking */ }
  };

  const saveAllExperiences = async () => {
    try {
      setSaving(true);
      
      // First, save all current drafts to experiences state
      setExperiences(prevExperiences => 
        prevExperiences.map(exp => ({
          ...exp,
          description: descriptionDrafts[exp.id] ?? exp.description
        }))
      );
      
      // Wait a bit for state to update, then validate
      setTimeout(async () => {
        try {
          const currentExperiences = experiences.map(exp => ({
            ...exp,
            description: descriptionDrafts[exp.id] ?? exp.description
          }));
          
          const validExperiences = currentExperiences.filter(exp => 
            exp.category && exp.title.trim().length >= 2 && exp.description.trim().length >= 10
          );
          
          if (validExperiences.length < 3) {
            toast({ title: 'Minimum requirement not met', description: 'Please complete at least 3 experiences before saving.' });
            setSaving(false);
            return;
          }

          await upsertExperiences(true);
          toast({ title: 'Experiences saved!', description: 'Your experiences have been recorded.' });
          if (onClose) onClose();
        } catch (e: any) {
          toast({ title: 'Save failed', description: e?.message || 'Please try again.' });
        } finally {
          setSaving(false);
        }
      }, 100);
    } catch (e: any) {
      toast({ title: 'Save failed', description: e?.message || 'Please try again.' });
      setSaving(false);
    }
  };

  const saveAndQuit = async () => {
    try {
      setSaving(true);
      await upsertExperiences(false);
      toast({ title: 'Progress saved', description: 'You can come back anytime.' });
      if (onClose) onClose();
    } catch (e: any) {
      toast({ title: 'Save failed', description: e?.message || 'Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const getCompletionRate = () => {
    const validExperiences = experiences.filter(exp => 
      exp.category && exp.title.trim().length >= 2 && exp.description.trim().length >= 10
    );
    return Math.min(100, Math.round((validExperiences.length / 3) * 100));
  };

  const isExperienceComplete = (exp: Experience) => {
    return exp.category && exp.title.trim().length >= 2 && exp.description.trim().length >= 10;
  };

  const ExperienceCard = ({ experience, index }: { experience: Experience; index: number }) => {
    const isExpanded = expandedIndex === index;
    const isComplete = isExperienceComplete(experience);
    const [localTitle, setLocalTitle] = useState(experience.title);
    const [localOrg, setLocalOrg] = useState(experience.organization);
    const [localStartDate, setLocalStartDate] = useState(experience.startDate);
    const [localEndDate, setLocalEndDate] = useState(experience.endDate);
    const [localTotalHours, setLocalTotalHours] = useState(experience.totalHours);
    const [localVerification, setLocalVerification] = useState(experience.verificationUrl);
    const [localDescription, setLocalDescription] = useState(experience.description);

    useEffect(() => {
      setLocalTitle(experience.title);
      setLocalOrg(experience.organization);
      setLocalStartDate(experience.startDate);
      setLocalEndDate(experience.endDate);
      setLocalTotalHours(experience.totalHours);
      setLocalVerification(experience.verificationUrl);
      // Only set description from drafts on mount, not on every draft change
      const initialDesc = descriptionDrafts[experience.id] ?? experience.description;
      setLocalDescription(initialDesc);
    }, [experience.id]);
    
    return (
      <Card className={`transition-all duration-200 ${isExpanded ? 'border-primary shadow-lg' : 'shadow-medium hover:shadow-lg'}`}>
        {/* Collapsed State - Summary View */}
        {!isExpanded && (
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg">
                    {experience.title || `Experience #${index + 1}`}
                  </h3>
                  {isComplete && (
                    <Badge variant="default" className="bg-green-500/10 text-green-700 border-green-500/20">
                      Complete
                    </Badge>
                  )}
                  {experience.category && (
                    <Badge variant="secondary">
                      {EXPERIENCE_TYPE.find(t => t.id === experience.category)?.label}
                    </Badge>
                  )}
                </div>
                
                {experience.organization && (
                  <p className="text-muted-foreground mb-2">{experience.organization}</p>
                )}
                
                {experience.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {experience.description}
                  </p>
                )}
                
                <div className="flex flex-wrap gap-2">
                  {experience.startDate && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      {new Date(experience.startDate).toLocaleDateString()} - {experience.isOngoing ? 'Present' : experience.endDate ? new Date(experience.endDate).toLocaleDateString() : ''}
                    </span>
                  )}
                  {experience.skills.slice(0, 3).map((skill, skillIndex) => (
                    <Badge key={skillIndex} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {experience.skills.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{experience.skills.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExpandedIndex(index)}
                  className="flex items-center gap-1"
                >
                  <Edit className="h-3 w-3" />
                  Edit
                </Button>
                {index >= 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeExperience(index)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        )}

        {/* Expanded State - Full Form */}
        {isExpanded && (
          <>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2">
                  <ChevronDown className="h-5 w-5" />
                  Experience #{index + 1}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Save all current field values to experience
                      const currentDesc = descriptionDrafts[experience.id] ?? experience.description;
                      updateExperience(index, 'title', localTitle);
                      updateExperience(index, 'organization', localOrg);
                      updateExperience(index, 'startDate', localStartDate);
                      updateExperience(index, 'endDate', localEndDate);
                      updateExperience(index, 'totalHours', localTotalHours);
                      updateExperience(index, 'description', currentDesc);
                      updateExperience(index, 'verificationUrl', localVerification);
                      setExpandedIndex(null);
                    }}
                  >
                    Collapse
                  </Button>
                  {index >= 3 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExperience(index)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              <div className="max-h-[70vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Category Selection */}
                    <div>
                      <Label className="text-sm font-medium">Category *</Label>
                      <Select 
                        value={experience.category} 
                        onValueChange={(v) => updateExperience(index, 'category', v)}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPERIENCE_TYPE.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Title/Role */}
                    <div>
                      <Label className="text-sm font-medium" htmlFor={`title-${experience.id}`}>Title/Role *</Label>
                      <Input 
                        id={`title-${experience.id}`}
                        name={`title-${experience.id}`}
                        value={localTitle}
                        onChange={(e) => setLocalTitle(e.target.value)}
                        onBlur={() => updateExperience(index, 'title', localTitle)}
                        placeholder="e.g., Team Captain, Volunteer Coordinator"
                        className="mt-2"
                      />
                    </div>

                    {/* Organization */}
                    <div>
                      <Label className="text-sm font-medium" htmlFor={`org-${experience.id}`}>Organization</Label>
                      <Input 
                        id={`org-${experience.id}`}
                        name={`org-${experience.id}`}
                        value={localOrg}
                        onChange={(e) => setLocalOrg(e.target.value)}
                        onBlur={() => updateExperience(index, 'organization', localOrg)}
                        placeholder="e.g., National Honor Society, Local Food Bank"
                        className="mt-2"
                      />
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm font-medium" htmlFor={`start-${experience.id}`}>Start Date</Label>
                        <Input 
                          type="date"
                          id={`start-${experience.id}`}
                          name={`start-${experience.id}`}
                          value={localStartDate}
                          onChange={(e) => setLocalStartDate(e.target.value)}
                          onBlur={() => updateExperience(index, 'startDate', localStartDate)}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium" htmlFor={`end-${experience.id}`}>End Date</Label>
                        <Input 
                          type="date"
                          id={`end-${experience.id}`}
                          name={`end-${experience.id}`}
                          value={localEndDate}
                          disabled={experience.isOngoing}
                          onChange={(e) => setLocalEndDate(e.target.value)}
                          onBlur={() => updateExperience(index, 'endDate', localEndDate)}
                          className="mt-2"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id={`ongoing-${index}`}
                        checked={experience.isOngoing}
                        onCheckedChange={(checked) => updateExperience(index, 'isOngoing', checked)}
                      />
                      <Label htmlFor={`ongoing-${index}`} className="text-sm">Currently ongoing</Label>
                    </div>

                    {/* Total Hours */}
                    <div>
                      <Label className="text-sm font-medium" htmlFor={`hours-${experience.id}`}>Hours per week (approximate)</Label>
                      <Input 
                        type="number"
                        id={`hours-${experience.id}`}
                        name={`hours-${experience.id}`}
                        value={localTotalHours}
                        onChange={(e) => setLocalTotalHours(e.target.value)}
                        onBlur={() => updateExperience(index, 'totalHours', localTotalHours)}
                        placeholder="e.g., 5"
                        className="mt-2"
                      />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Description */}
                    <div>
                      <Label className="text-sm font-medium" htmlFor={`desc-${experience.id}`}>Description *</Label>
                      <Textarea 
                        id={`desc-${experience.id}`}
                        name={`desc-${experience.id}`}
                        value={localDescription}
                        onChange={(e) => {
                          setLocalDescription(e.target.value);
                        }}
                        onBlur={() => {
                          setDescriptionDrafts((prev) => ({ ...prev, [experience.id]: localDescription }));
                          updateExperience(index, 'description', localDescription);
                        }}
                        placeholder="Describe what you did, your responsibilities, and impact..."
                        className="mt-2 min-h-[150px] resize-none"
                      />
                    </div>

                    {/* Key Responsibilities */}
                    <div>
                      <Label className="text-sm font-medium">Key Responsibilities</Label>
                      <Input 
                        placeholder="Add responsibility and press Enter"
                        className="mt-2"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addChip(index, 'responsibilities', e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                      <div className="flex flex-wrap gap-2 mt-3 max-h-24 overflow-y-auto">
                        {experience.responsibilities.map((resp, respIndex) => (
                          <Badge 
                            key={respIndex} 
                            variant="outline" 
                            className="cursor-pointer text-xs hover:bg-destructive/10"
                            onClick={() => removeChip(index, 'responsibilities', resp)}
                          >
                            {resp} ×
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Skills Developed */}
                    <div>
                      <Label className="text-sm font-medium">Skills Developed</Label>
                      <Input 
                        placeholder="Add skill and press Enter"
                        className="mt-2"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addChip(index, 'skills', e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                      <div className="flex flex-wrap gap-2 mt-3 max-h-24 overflow-y-auto">
                        {experience.skills.map((skill, skillIndex) => (
                          <Badge 
                            key={skillIndex} 
                            variant="secondary" 
                            className="cursor-pointer text-xs hover:bg-destructive/10"
                            onClick={() => removeChip(index, 'skills', skill)}
                          >
                            {skill} ×
                          </Badge>
                        ))}
                      </div>
                    </div>

                    

                    <div>
                      <Label className="text-sm font-medium" htmlFor={`verify-${experience.id}`}>Verification Link</Label>
                      <Input 
                        id={`verify-${experience.id}`}
                        name={`verify-${experience.id}`}
                        value={localVerification}
                        onChange={(e) => setLocalVerification(e.target.value)}
                        onBlur={() => updateExperience(index, 'verificationUrl', localVerification)}
                        placeholder="https://... (optional)"
                        className="mt-2"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id={`contact-${index}`}
                        checked={experience.canContact}
                        onCheckedChange={(checked) => updateExperience(index, 'canContact', checked)}
                      />
                      <Label htmlFor={`contact-${index}`} className="text-sm">OK to contact for verification</Label>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    );
  };

  return (
    <div className="flex flex-col h-full max-h-[95vh]">
      {/* Compact Header Section */}
      <div className="flex-shrink-0 border-b bg-background px-6 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Experiences & Activities</h1>
            <p className="text-sm text-muted-foreground">
              Build your portfolio. <strong className="text-primary">Minimum 3 experiences required.</strong>
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">
                {experiences.filter(exp => isExperienceComplete(exp)).length} of {Math.max(3, experiences.length)} completed
              </span>
            </div>
            <div className="mt-1">
              <Progress value={progress} className="h-2 w-48 ml-auto" />
            </div>
          </div>
        </div>
        
        {/* Compact info box */}
        <div className="bg-primary/5 border border-primary/20 rounded p-3 mt-3">
          <div className="grid md:grid-cols-2 gap-3 text-xs text-muted-foreground">
            <div>
              <span className="font-medium">Leadership:</span> Student government, mentoring, new projects
            </div>
            <div>
              <span className="font-medium">Community:</span> Volunteer work, service projects, work experience
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - Maximum Space */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-6xl mx-auto space-y-4">
          {experiences.map((experience, index) => (
            <ExperienceCard key={experience.id} experience={experience} index={index} />
          ))}
        </div>
      </div>

      {/* Compact Action Bar */}
      <div className="flex-shrink-0 flex items-center justify-between border-t px-6 py-3 bg-background">
        <Button onClick={addExperience} variant="outline" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Experience
        </Button>

        <div className="flex items-center gap-2">
          <Button 
            variant="secondary"
            onClick={saveAndQuit}
            disabled={saving}
          >
            Save & Quit
          </Button>
          <Button 
            onClick={saveAllExperiences} 
            disabled={saving || progress < 100} 
            className="min-w-[140px]"
          >
            {saving ? 'Saving...' : 'Save All'}
          </Button>
        </div>
      </div>
    </div>
  );
}