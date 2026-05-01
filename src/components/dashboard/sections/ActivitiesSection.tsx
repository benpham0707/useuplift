import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/safeClient';
import { toast } from '@/hooks/use-toast';

interface SectionFormProps {
  profileId: string;
  onSaveComplete: () => void;
}

interface WorkExperience {
  title: string;
  organization: string;
  role: string;
  startDate: string;
  endDate: string;
  hoursPerWeek: number;
  description: string;
}

interface Extracurricular {
  activityName: string;
  role: string;
  yearsInvolved: number;
  hoursPerWeek: number;
  description: string;
}

interface Volunteering {
  organization: string;
  role: string;
  totalHours: number;
  description: string;
}

interface Project {
  name: string;
  description: string;
  technologies: string;
  outcome: string;
}

interface LeadershipRole {
  position: string;
  organization: string;
  responsibilities: string;
  impact: string;
}

interface AcademicHonor {
  name: string;
  level: string;
  year: number;
}

interface Recognition {
  type: string;
  description: string;
  year: number;
}

interface ActivitiesData {
  workExperiences: WorkExperience[];
  extracurriculars: Extracurricular[];
  volunteering: Volunteering[];
  projects: Project[];
  leadershipRoles: LeadershipRole[];
  academicHonors: AcademicHonor[];
  recognition: Recognition[];
}

const emptyWorkExperience = (): WorkExperience => ({
  title: '',
  organization: '',
  role: '',
  startDate: '',
  endDate: '',
  hoursPerWeek: 0,
  description: ''
});

const emptyExtracurricular = (): Extracurricular => ({
  activityName: '',
  role: '',
  yearsInvolved: 0,
  hoursPerWeek: 0,
  description: ''
});

const emptyVolunteering = (): Volunteering => ({
  organization: '',
  role: '',
  totalHours: 0,
  description: ''
});

const emptyProject = (): Project => ({
  name: '',
  description: '',
  technologies: '',
  outcome: ''
});

const emptyLeadershipRole = (): LeadershipRole => ({
  position: '',
  organization: '',
  responsibilities: '',
  impact: ''
});

const emptyAcademicHonor = (): AcademicHonor => ({
  name: '',
  level: '',
  year: new Date().getFullYear()
});

const emptyRecognition = (): Recognition => ({
  type: '',
  description: '',
  year: new Date().getFullYear()
});

export default function ActivitiesSection({ profileId, onSaveComplete }: SectionFormProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [data, setData] = useState<ActivitiesData>({
    workExperiences: [],
    extracurriculars: [],
    volunteering: [],
    projects: [],
    leadershipRoles: [],
    academicHonors: [],
    recognition: []
  });

  // Load existing data
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: existingData, error } = await supabase
          .from('experiences_activities')
          .select('*')
          .eq('profile_id', profileId)
          .maybeSingle();

        if (error) throw error;

        if (existingData) {
          setData({
            workExperiences: Array.isArray(existingData.work_experiences) ? existingData.work_experiences : [],
            extracurriculars: Array.isArray(existingData.extracurriculars) ? existingData.extracurriculars : [],
            volunteering: Array.isArray(existingData.volunteer_service) ? existingData.volunteer_service : [],
            projects: Array.isArray(existingData.personal_projects) ? existingData.personal_projects : [],
            leadershipRoles: Array.isArray(existingData.leadership_roles) ? existingData.leadership_roles : [],
            academicHonors: Array.isArray(existingData.academic_honors) ? existingData.academic_honors : [],
            recognition: Array.isArray(existingData.formal_recognition) ? existingData.formal_recognition : []
          });
        }
      } catch (err) {
        console.error('[ActivitiesSection] Error loading data:', err);
        toast({
          title: 'Error',
          description: 'Failed to load activities data',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [profileId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('experiences_activities')
        .upsert({
          profile_id: profileId,
          work_experiences: data.workExperiences,
          extracurriculars: data.extracurriculars,
          volunteer_service: data.volunteering,
          personal_projects: data.projects,
          leadership_roles: data.leadershipRoles,
          academic_honors: data.academicHonors,
          formal_recognition: data.recognition,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'profile_id'
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Activities saved successfully'
      });

      onSaveComplete();
    } catch (err) {
      console.error('[ActivitiesSection] Error saving data:', err);
      toast({
        title: 'Error',
        description: 'Failed to save activities',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const totalEntries =
    data.workExperiences.length +
    data.extracurriculars.length +
    data.volunteering.length +
    data.projects.length +
    data.leadershipRoles.length +
    data.academicHonors.length +
    data.recognition.length;

  if (isLoading) {
    return <div className="p-4 text-sm text-gray-500">Loading activities...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Activities & Experience</h3>
        <p className="text-sm text-gray-600">
          Tell us about your activities, work, and achievements. Start with whatever comes to mind — you can always add more later.
        </p>
        <p className="text-xs text-gray-500">{totalEntries} activities added</p>
      </div>

      <Accordion type="multiple" className="space-y-2">
        {/* Work Experience */}
        <AccordionItem value="work">
          <AccordionTrigger className="text-sm font-medium">
            Work Experience ({data.workExperiences.length})
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              {data.workExperiences.map((exp, idx) => (
                <Card key={idx} className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium">Entry {idx + 1}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setData(prev => ({
                          ...prev,
                          workExperiences: prev.workExperiences.filter((_, i) => i !== idx)
                        }))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Job Title</Label>
                        <Input
                          value={exp.title}
                          onChange={e => {
                            const updated = [...data.workExperiences];
                            updated[idx].title = e.target.value;
                            setData({ ...data, workExperiences: updated });
                          }}
                          placeholder="Software Intern"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Organization</Label>
                        <Input
                          value={exp.organization}
                          onChange={e => {
                            const updated = [...data.workExperiences];
                            updated[idx].organization = e.target.value;
                            setData({ ...data, workExperiences: updated });
                          }}
                          placeholder="Company Name"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Role</Label>
                        <Input
                          value={exp.role}
                          onChange={e => {
                            const updated = [...data.workExperiences];
                            updated[idx].role = e.target.value;
                            setData({ ...data, workExperiences: updated });
                          }}
                          placeholder="Developer"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Hours/Week</Label>
                        <Input
                          type="number"
                          value={exp.hoursPerWeek}
                          onChange={e => {
                            const updated = [...data.workExperiences];
                            updated[idx].hoursPerWeek = parseInt(e.target.value) || 0;
                            setData({ ...data, workExperiences: updated });
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Start Date</Label>
                        <Input
                          type="month"
                          value={exp.startDate}
                          onChange={e => {
                            const updated = [...data.workExperiences];
                            updated[idx].startDate = e.target.value;
                            setData({ ...data, workExperiences: updated });
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">End Date</Label>
                        <Input
                          type="month"
                          value={exp.endDate}
                          onChange={e => {
                            const updated = [...data.workExperiences];
                            updated[idx].endDate = e.target.value;
                            setData({ ...data, workExperiences: updated });
                          }}
                          placeholder="Leave empty if current"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Description</Label>
                      <Textarea
                        value={exp.description}
                        onChange={e => {
                          const updated = [...data.workExperiences];
                          updated[idx].description = e.target.value;
                          setData({ ...data, workExperiences: updated });
                        }}
                        placeholder="What did you do? What did you learn?"
                        rows={3}
                      />
                    </div>
                  </div>
                </Card>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setData(prev => ({
                  ...prev,
                  workExperiences: [...prev.workExperiences, emptyWorkExperience()]
                }))}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Work Experience
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Extracurriculars */}
        <AccordionItem value="extracurriculars">
          <AccordionTrigger className="text-sm font-medium">
            Extracurricular Activities ({data.extracurriculars.length})
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              {data.extracurriculars.map((activity, idx) => (
                <Card key={idx} className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium">Entry {idx + 1}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setData(prev => ({
                          ...prev,
                          extracurriculars: prev.extracurriculars.filter((_, i) => i !== idx)
                        }))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Activity Name</Label>
                        <Input
                          value={activity.activityName}
                          onChange={e => {
                            const updated = [...data.extracurriculars];
                            updated[idx].activityName = e.target.value;
                            setData({ ...data, extracurriculars: updated });
                          }}
                          placeholder="Debate Team"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Role/Position</Label>
                        <Input
                          value={activity.role}
                          onChange={e => {
                            const updated = [...data.extracurriculars];
                            updated[idx].role = e.target.value;
                            setData({ ...data, extracurriculars: updated });
                          }}
                          placeholder="Team Captain"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Years Involved</Label>
                        <Input
                          type="number"
                          value={activity.yearsInvolved}
                          onChange={e => {
                            const updated = [...data.extracurriculars];
                            updated[idx].yearsInvolved = parseInt(e.target.value) || 0;
                            setData({ ...data, extracurriculars: updated });
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Hours/Week</Label>
                        <Input
                          type="number"
                          value={activity.hoursPerWeek}
                          onChange={e => {
                            const updated = [...data.extracurriculars];
                            updated[idx].hoursPerWeek = parseInt(e.target.value) || 0;
                            setData({ ...data, extracurriculars: updated });
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Description & Achievements</Label>
                      <Textarea
                        value={activity.description}
                        onChange={e => {
                          const updated = [...data.extracurriculars];
                          updated[idx].description = e.target.value;
                          setData({ ...data, extracurriculars: updated });
                        }}
                        placeholder="What did you accomplish?"
                        rows={3}
                      />
                    </div>
                  </div>
                </Card>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setData(prev => ({
                  ...prev,
                  extracurriculars: [...prev.extracurriculars, emptyExtracurricular()]
                }))}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Extracurricular
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Volunteering */}
        <AccordionItem value="volunteering">
          <AccordionTrigger className="text-sm font-medium">
            Volunteering ({data.volunteering.length})
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              {data.volunteering.map((vol, idx) => (
                <Card key={idx} className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium">Entry {idx + 1}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setData(prev => ({
                          ...prev,
                          volunteering: prev.volunteering.filter((_, i) => i !== idx)
                        }))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Organization</Label>
                        <Input
                          value={vol.organization}
                          onChange={e => {
                            const updated = [...data.volunteering];
                            updated[idx].organization = e.target.value;
                            setData({ ...data, volunteering: updated });
                          }}
                          placeholder="Local Food Bank"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Role</Label>
                        <Input
                          value={vol.role}
                          onChange={e => {
                            const updated = [...data.volunteering];
                            updated[idx].role = e.target.value;
                            setData({ ...data, volunteering: updated });
                          }}
                          placeholder="Volunteer Coordinator"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Total Hours</Label>
                        <Input
                          type="number"
                          value={vol.totalHours}
                          onChange={e => {
                            const updated = [...data.volunteering];
                            updated[idx].totalHours = parseInt(e.target.value) || 0;
                            setData({ ...data, volunteering: updated });
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Description</Label>
                      <Textarea
                        value={vol.description}
                        onChange={e => {
                          const updated = [...data.volunteering];
                          updated[idx].description = e.target.value;
                          setData({ ...data, volunteering: updated });
                        }}
                        placeholder="What did you do?"
                        rows={3}
                      />
                    </div>
                  </div>
                </Card>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setData(prev => ({
                  ...prev,
                  volunteering: [...prev.volunteering, emptyVolunteering()]
                }))}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Volunteering
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Projects */}
        <AccordionItem value="projects">
          <AccordionTrigger className="text-sm font-medium">
            Projects ({data.projects.length})
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              {data.projects.map((proj, idx) => (
                <Card key={idx} className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium">Entry {idx + 1}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setData(prev => ({
                          ...prev,
                          projects: prev.projects.filter((_, i) => i !== idx)
                        }))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div>
                      <Label className="text-xs">Project Name</Label>
                      <Input
                        value={proj.name}
                        onChange={e => {
                          const updated = [...data.projects];
                          updated[idx].name = e.target.value;
                          setData({ ...data, projects: updated });
                        }}
                        placeholder="My iOS App"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Technologies/Skills Used</Label>
                      <Input
                        value={proj.technologies}
                        onChange={e => {
                          const updated = [...data.projects];
                          updated[idx].technologies = e.target.value;
                          setData({ ...data, projects: updated });
                        }}
                        placeholder="Swift, Firebase, UI/UX Design"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Description</Label>
                      <Textarea
                        value={proj.description}
                        onChange={e => {
                          const updated = [...data.projects];
                          updated[idx].description = e.target.value;
                          setData({ ...data, projects: updated });
                        }}
                        placeholder="What did you build?"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Outcome/Impact</Label>
                      <Textarea
                        value={proj.outcome}
                        onChange={e => {
                          const updated = [...data.projects];
                          updated[idx].outcome = e.target.value;
                          setData({ ...data, projects: updated });
                        }}
                        placeholder="What was the result?"
                        rows={2}
                      />
                    </div>
                  </div>
                </Card>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setData(prev => ({
                  ...prev,
                  projects: [...prev.projects, emptyProject()]
                }))}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Project
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Leadership Roles */}
        <AccordionItem value="leadership">
          <AccordionTrigger className="text-sm font-medium">
            Leadership Roles ({data.leadershipRoles.length})
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              {data.leadershipRoles.map((role, idx) => (
                <Card key={idx} className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium">Entry {idx + 1}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setData(prev => ({
                          ...prev,
                          leadershipRoles: prev.leadershipRoles.filter((_, i) => i !== idx)
                        }))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Position</Label>
                        <Input
                          value={role.position}
                          onChange={e => {
                            const updated = [...data.leadershipRoles];
                            updated[idx].position = e.target.value;
                            setData({ ...data, leadershipRoles: updated });
                          }}
                          placeholder="President"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Organization</Label>
                        <Input
                          value={role.organization}
                          onChange={e => {
                            const updated = [...data.leadershipRoles];
                            updated[idx].organization = e.target.value;
                            setData({ ...data, leadershipRoles: updated });
                          }}
                          placeholder="Student Council"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Responsibilities</Label>
                      <Textarea
                        value={role.responsibilities}
                        onChange={e => {
                          const updated = [...data.leadershipRoles];
                          updated[idx].responsibilities = e.target.value;
                          setData({ ...data, leadershipRoles: updated });
                        }}
                        placeholder="What were your responsibilities?"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Impact</Label>
                      <Textarea
                        value={role.impact}
                        onChange={e => {
                          const updated = [...data.leadershipRoles];
                          updated[idx].impact = e.target.value;
                          setData({ ...data, leadershipRoles: updated });
                        }}
                        placeholder="What impact did you have?"
                        rows={2}
                      />
                    </div>
                  </div>
                </Card>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setData(prev => ({
                  ...prev,
                  leadershipRoles: [...prev.leadershipRoles, emptyLeadershipRole()]
                }))}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Leadership Role
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Academic Honors */}
        <AccordionItem value="honors">
          <AccordionTrigger className="text-sm font-medium">
            Academic Honors ({data.academicHonors.length})
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              {data.academicHonors.map((honor, idx) => (
                <Card key={idx} className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium">Entry {idx + 1}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setData(prev => ({
                          ...prev,
                          academicHonors: prev.academicHonors.filter((_, i) => i !== idx)
                        }))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Honor/Award Name</Label>
                        <Input
                          value={honor.name}
                          onChange={e => {
                            const updated = [...data.academicHonors];
                            updated[idx].name = e.target.value;
                            setData({ ...data, academicHonors: updated });
                          }}
                          placeholder="Honor Roll"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Level</Label>
                        <Select
                          value={honor.level}
                          onValueChange={value => {
                            const updated = [...data.academicHonors];
                            updated[idx].level = value;
                            setData({ ...data, academicHonors: updated });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="school">School</SelectItem>
                            <SelectItem value="regional">Regional</SelectItem>
                            <SelectItem value="state">State</SelectItem>
                            <SelectItem value="national">National</SelectItem>
                            <SelectItem value="international">International</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Year</Label>
                        <Input
                          type="number"
                          value={honor.year}
                          onChange={e => {
                            const updated = [...data.academicHonors];
                            updated[idx].year = parseInt(e.target.value) || new Date().getFullYear();
                            setData({ ...data, academicHonors: updated });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setData(prev => ({
                  ...prev,
                  academicHonors: [...prev.academicHonors, emptyAcademicHonor()]
                }))}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Academic Honor
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Recognition */}
        <AccordionItem value="recognition">
          <AccordionTrigger className="text-sm font-medium">
            Recognition ({data.recognition.length})
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              {data.recognition.map((rec, idx) => (
                <Card key={idx} className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium">Entry {idx + 1}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setData(prev => ({
                          ...prev,
                          recognition: prev.recognition.filter((_, i) => i !== idx)
                        }))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Type</Label>
                        <Input
                          value={rec.type}
                          onChange={e => {
                            const updated = [...data.recognition];
                            updated[idx].type = e.target.value;
                            setData({ ...data, recognition: updated });
                          }}
                          placeholder="Award, Publication, etc."
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Year</Label>
                        <Input
                          type="number"
                          value={rec.year}
                          onChange={e => {
                            const updated = [...data.recognition];
                            updated[idx].year = parseInt(e.target.value) || new Date().getFullYear();
                            setData({ ...data, recognition: updated });
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Description</Label>
                      <Textarea
                        value={rec.description}
                        onChange={e => {
                          const updated = [...data.recognition];
                          updated[idx].description = e.target.value;
                          setData({ ...data, recognition: updated });
                        }}
                        placeholder="Details about this recognition"
                        rows={3}
                      />
                    </div>
                  </div>
                </Card>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setData(prev => ({
                  ...prev,
                  recognition: [...prev.recognition, emptyRecognition()]
                }))}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Recognition
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="pt-4 border-t">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full"
        >
          {isSaving ? 'Saving...' : 'Save & Close'}
        </Button>
      </div>
    </div>
  );
}
