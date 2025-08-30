import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { createExperience } from '@/app/experiences/api';
import { Trash2, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-foreground">Experiences & Activities</h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Build a comprehensive portfolio of your work, volunteer service, extracurricular activities, and personal projects. 
            <strong className="text-primary"> Minimum 3 experiences required.</strong>
          </p>
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 max-w-4xl mx-auto">
            <h3 className="font-semibold text-primary mb-2">🎯 What colleges want to see:</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <p className="font-medium mb-1">Leadership & Initiative:</p>
                <ul className="space-y-1">
                  <li>• Student government, club officer roles</li>
                  <li>• Starting new organizations or projects</li>
                  <li>• Mentoring or tutoring others</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-1">Community Impact:</p>
                <ul className="space-y-1">
                  <li>• Volunteer work with measurable hours</li>
                  <li>• Community service projects</li>
                  <li>• Work experience and responsibility</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {experiences.map((experience, index) => (
            <Card key={index} className="shadow-medium">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Experience #{index + 1}
                    {index >= 3 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExperience(index)}
                        className="ml-2 p-1 h-6 w-6 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                  >
                    {expandedIndex === index ? 'Collapse' : 'Edit'}
                  </Button>
                </div>
                {experience.category && (
                  <Badge variant="secondary" className="w-fit">
                    {EXPERIENCE_TYPE.find(t => t.id === experience.category)?.label}
                  </Badge>
                )}
              </CardHeader>
              
              {expandedIndex === index && (
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <div>
                      <Label className="text-sm font-medium">Category</Label>
                      <Select 
                        value={experience.category} 
                        onValueChange={(v) => updateExperience(index, 'category', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPERIENCE_TYPE.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Title/Role</Label>
                      <Input 
                        value={experience.title}
                        onChange={(e) => updateExperience(index, 'title', e.target.value)}
                        placeholder="e.g., Team Captain, Volunteer Coordinator"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Organization</Label>
                      <Input 
                        value={experience.organization}
                        onChange={(e) => updateExperience(index, 'organization', e.target.value)}
                        placeholder="e.g., National Honor Society, Local Food Bank"
                        className="mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-sm font-medium">Start Date</Label>
                        <Input 
                          type="date"
                          value={experience.startDate}
                          onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">End Date</Label>
                        <Input 
                          type="date"
                          value={experience.endDate}
                          disabled={experience.isOngoing}
                          onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                          className="mt-1"
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

                    <div>
                      <Label className="text-sm font-medium">Time Commitment</Label>
                      <Select 
                        value={experience.timeCommitment} 
                        onValueChange={(v) => updateExperience(index, 'timeCommitment', v)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select commitment level" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_COMMITMENT.map((t) => (
                            <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Description</Label>
                      <Textarea 
                        value={experience.description}
                        onChange={(e) => updateExperience(index, 'description', e.target.value)}
                        placeholder="Describe what you did, your responsibilities, and impact..."
                        className="mt-1 min-h-[120px]"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Key Responsibilities</Label>
                      <div className="flex gap-2 mt-1">
                        <Input 
                          placeholder="Add responsibility and press Enter"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addChip(index, 'responsibilities', e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {experience.responsibilities.map((resp, respIndex) => (
                          <Badge 
                            key={respIndex} 
                            variant="outline" 
                            className="cursor-pointer text-xs"
                            onClick={() => removeChip(index, 'responsibilities', resp)}
                          >
                            {resp} ×
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Achievements</Label>
                      <div className="flex gap-2 mt-1">
                        <Input 
                          placeholder="Add achievement and press Enter"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addChip(index, 'achievements', e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {experience.achievements.map((achievement, achIndex) => (
                          <Badge 
                            key={achIndex} 
                            variant="outline" 
                            className="cursor-pointer text-xs"
                            onClick={() => removeChip(index, 'achievements', achievement)}
                          >
                            {achievement} ×
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Skills Developed</Label>
                      <div className="flex gap-2 mt-1">
                        <Input 
                          placeholder="Add skill and press Enter"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addChip(index, 'skills', e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {experience.skills.map((skill, skillIndex) => (
                          <Badge 
                            key={skillIndex} 
                            variant="secondary" 
                            className="cursor-pointer text-xs"
                            onClick={() => removeChip(index, 'skills', skill)}
                          >
                            {skill} ×
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Supervisor/Contact</Label>
                        <Input 
                          value={experience.supervisorName}
                          onChange={(e) => updateExperience(index, 'supervisorName', e.target.value)}
                          placeholder="Name (optional)"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Verification Link</Label>
                        <Input 
                          value={experience.verificationUrl}
                          onChange={(e) => updateExperience(index, 'verificationUrl', e.target.value)}
                          placeholder="https://... (optional)"
                          className="mt-1"
                        />
                      </div>
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
                </CardContent>
              )}
              
              {expandedIndex !== index && experience.title && (
                <CardContent>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">{experience.title}</h4>
                    <p className="text-xs text-muted-foreground">{experience.organization}</p>
                    {experience.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {experience.description.slice(0, 100)}...
                      </p>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={addExperience} variant="outline" size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Add Another Experience
            </Button>
            <div className="text-sm text-muted-foreground">
              {experiences.filter(exp => exp.category && exp.title.trim() && exp.description.trim().length >= 10).length} / {Math.max(3, experiences.length)} completed
            </div>
          </div>
          
          <div className="flex gap-4 items-center">
            <div className="text-sm text-muted-foreground">
              Completion: {getCompletionRate()}%
            </div>
            <Button onClick={saveAllExperiences} disabled={saving || getCompletionRate() < 100} size="lg">
              {saving ? 'Saving...' : 'Save All Experiences'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


