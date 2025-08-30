import { useState } from 'react';
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
import { createExperience } from '@/app/experiences/api';
import { Trash2, Plus, Edit, ChevronDown } from 'lucide-react';

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
  id?: string;
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

const createEmptyExperience = (): Experience => ({
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
    const updated = [...experiences];
    updated[index] = { ...updated[index], [field]: value };
    setExperiences(updated);
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

  const saveAllExperiences = async () => {
    try {
      setSaving(true);
      const validExperiences = experiences.filter(exp => 
        exp.category && exp.title.trim().length >= 2 && exp.description.trim().length >= 10
      );

      if (validExperiences.length < 3) {
        toast({ 
          title: 'Minimum requirement not met', 
          description: 'Please complete at least 3 experiences before saving.' 
        });
        return;
      }

      const savedIds = [];
      for (const exp of validExperiences) {
        const payload = {
          category: exp.category,
          title: exp.title.trim(),
          organization: exp.organization.trim() || 'Self',
          startDate: exp.startDate,
          endDate: exp.isOngoing ? null : exp.endDate || null,
          isOngoing: exp.isOngoing,
          timeCommitment: exp.timeCommitment,
          totalHours: exp.totalHours ? Number(exp.totalHours) : undefined,
          description: exp.description.trim(),
          responsibilities: exp.responsibilities,
          achievements: exp.achievements,
          challenges: [],
          metrics: {},
          skills: exp.skills,
          verificationUrl: exp.verificationUrl,
          supervisorName: exp.supervisorName || undefined,
          canContact: exp.canContact,
        };

        const res = await createExperience(payload as any);
        savedIds.push(res.id);
      }

      toast({ 
        title: `${savedIds.length} experiences saved!`, 
        description: 'Your experiences have been added to your portfolio.' 
      });
      if (onAdded && savedIds.length > 0) onAdded({ id: savedIds[0] });
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
                    onClick={() => setExpandedIndex(null)}
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
                      <Label className="text-sm font-medium">Title/Role *</Label>
                      <Input 
                        value={experience.title}
                        onChange={(e) => updateExperience(index, 'title', e.target.value)}
                        placeholder="e.g., Team Captain, Volunteer Coordinator"
                        className="mt-2"
                      />
                    </div>

                    {/* Organization */}
                    <div>
                      <Label className="text-sm font-medium">Organization</Label>
                      <Input 
                        value={experience.organization}
                        onChange={(e) => updateExperience(index, 'organization', e.target.value)}
                        placeholder="e.g., National Honor Society, Local Food Bank"
                        className="mt-2"
                      />
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm font-medium">Start Date</Label>
                        <Input 
                          type="date"
                          value={experience.startDate}
                          onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">End Date</Label>
                        <Input 
                          type="date"
                          value={experience.endDate}
                          disabled={experience.isOngoing}
                          onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
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

                    {/* Time Commitment */}
                    <div>
                      <Label className="text-sm font-medium">Time Commitment</Label>
                      <Select 
                        value={experience.timeCommitment} 
                        onValueChange={(v) => updateExperience(index, 'timeCommitment', v)}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select commitment level" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_COMMITMENT.map((t) => (
                            <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Total Hours */}
                    <div>
                      <Label className="text-sm font-medium">Total Hours (approximate)</Label>
                      <Input 
                        type="number"
                        value={experience.totalHours}
                        onChange={(e) => updateExperience(index, 'totalHours', e.target.value)}
                        placeholder="e.g., 100"
                        className="mt-2"
                      />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Description */}
                    <div>
                      <Label className="text-sm font-medium">Description *</Label>
                      <Textarea 
                        value={experience.description}
                        onChange={(e) => updateExperience(index, 'description', e.target.value)}
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

                    {/* Achievements */}
                    <div>
                      <Label className="text-sm font-medium">Achievements</Label>
                      <Input 
                        placeholder="Add achievement and press Enter"
                        className="mt-2"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addChip(index, 'achievements', e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                      <div className="flex flex-wrap gap-2 mt-3 max-h-24 overflow-y-auto">
                        {experience.achievements.map((achievement, achIndex) => (
                          <Badge 
                            key={achIndex} 
                            variant="outline" 
                            className="cursor-pointer text-xs hover:bg-destructive/10"
                            onClick={() => removeChip(index, 'achievements', achievement)}
                          >
                            {achievement} ×
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

                    {/* Contact Information */}
                    <div>
                      <Label className="text-sm font-medium">Supervisor/Contact</Label>
                      <Input 
                        value={experience.supervisorName}
                        onChange={(e) => updateExperience(index, 'supervisorName', e.target.value)}
                        placeholder="Name (optional)"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Verification Link</Label>
                      <Input 
                        value={experience.verificationUrl}
                        onChange={(e) => updateExperience(index, 'verificationUrl', e.target.value)}
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
            <div className="text-xs text-muted-foreground">
              Completion: <span className="font-medium text-primary">{getCompletionRate()}%</span>
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
            <ExperienceCard key={index} experience={experience} index={index} />
          ))}
        </div>
      </div>

      {/* Compact Action Bar */}
      <div className="flex-shrink-0 flex items-center justify-between border-t px-6 py-3 bg-background">
        <Button onClick={addExperience} variant="outline" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Experience
        </Button>
        
        <Button 
          onClick={saveAllExperiences} 
          disabled={saving || getCompletionRate() < 100} 
          className="min-w-[140px]"
        >
          {saving ? 'Saving...' : 'Save All'}
        </Button>
      </div>
    </div>
  );
}