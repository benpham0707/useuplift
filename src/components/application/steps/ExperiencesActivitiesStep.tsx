import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2 } from 'lucide-react';
import type { ExperiencesActivitiesData, Activity, WorkExperience, VolunteerService, Leadership } from '../types';

interface ExperiencesActivitiesStepProps {
  data: ExperiencesActivitiesData;
  onChange: (data: ExperiencesActivitiesData) => void;
}

const ACTIVITY_CATEGORIES = [
  'Academic (Math, Science, etc.)',
  'Art',
  'Athletics: Club',
  'Athletics: JV/Varsity',
  'Career Oriented',
  'Community Service (Volunteer)',
  'Computer/Technology',
  'Cultural',
  'Dance',
  'Debate/Speech',
  'Environmental',
  'Family Responsibilities',
  'Foreign Exchange',
  'Foreign Language',
  'Internship',
  'Jazz Band',
  'Journalism/Publication',
  'Junior R.O.T.C.',
  'LGBT',
  'Music: Instrumental',
  'Music: Vocal',
  'Religious',
  'Research',
  'Robotics',
  'School Spirit',
  'Science/Math',
  'Social Justice',
  'Student Govt/Politics',
  'Theater/Drama',
  'Work (Paid)',
  'Other'
];

const GRADE_OPTIONS = ['9th', '10th', '11th', '12th', 'Post-graduate'];

export default function ExperiencesActivitiesStep({ data, onChange }: ExperiencesActivitiesStepProps) {
  const [activeTab, setActiveTab] = useState('activities');

  const addActivity = () => {
    const newActivity: Activity = {
      id: Date.now().toString(),
      category: '',
      name: '',
      organization: '',
      description: '',
      position: '',
      hoursPerWeek: 0,
      weeksPerYear: 0,
      grades: [],
      leadership: false,
      awards: []
    };
    onChange({
      ...data,
      activities: [...data.activities, newActivity]
    });
  };

  const updateActivity = (id: string, field: keyof Activity, value: any) => {
    onChange({
      ...data,
      activities: data.activities.map(activity =>
        activity.id === id ? { ...activity, [field]: value } : activity
      )
    });
  };

  const removeActivity = (id: string) => {
    onChange({
      ...data,
      activities: data.activities.filter(activity => activity.id !== id)
    });
  };

  const addWorkExperience = () => {
    const newWork: WorkExperience = {
      id: Date.now().toString(),
      employer: '',
      position: '',
      description: '',
      startDate: '',
      endDate: '',
      hoursPerWeek: 0,
      paid: true
    };
    onChange({
      ...data,
      workExperience: [...data.workExperience, newWork]
    });
  };

  const updateWorkExperience = (id: string, field: keyof WorkExperience, value: any) => {
    onChange({
      ...data,
      workExperience: data.workExperience.map(work =>
        work.id === id ? { ...work, [field]: value } : work
      )
    });
  };

  const removeWorkExperience = (id: string) => {
    onChange({
      ...data,
      workExperience: data.workExperience.filter(work => work.id !== id)
    });
  };

  const addVolunteerService = () => {
    const newVolunteer: VolunteerService = {
      id: Date.now().toString(),
      organization: '',
      description: '',
      startDate: '',
      endDate: '',
      hoursPerWeek: 0,
      totalHours: 0
    };
    onChange({
      ...data,
      volunteerService: [...data.volunteerService, newVolunteer]
    });
  };

  const updateVolunteerService = (id: string, field: keyof VolunteerService, value: any) => {
    onChange({
      ...data,
      volunteerService: data.volunteerService.map(volunteer =>
        volunteer.id === id ? { ...volunteer, [field]: value } : volunteer
      )
    });
  };

  const removeVolunteerService = (id: string) => {
    onChange({
      ...data,
      volunteerService: data.volunteerService.filter(volunteer => volunteer.id !== id)
    });
  };

  const addLeadership = () => {
    const newLeadership: Leadership = {
      id: Date.now().toString(),
      position: '',
      organization: '',
      description: '',
      startDate: '',
      endDate: '',
      impact: ''
    };
    onChange({
      ...data,
      leadership: [...data.leadership, newLeadership]
    });
  };

  const updateLeadership = (id: string, field: keyof Leadership, value: any) => {
    onChange({
      ...data,
      leadership: data.leadership.map(leader =>
        leader.id === id ? { ...leader, [field]: value } : leader
      )
    });
  };

  const removeLeadership = (id: string) => {
    onChange({
      ...data,
      leadership: data.leadership.filter(leader => leader.id !== id)
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-muted-foreground">
          List your most important extracurricular activities, employment, awards, and leadership roles. 
          Quality over quantity - focus on activities that are most meaningful to you.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="work">Work Experience</TabsTrigger>
          <TabsTrigger value="volunteer">Volunteer Service</TabsTrigger>
          <TabsTrigger value="leadership">Leadership</TabsTrigger>
        </TabsList>

        <TabsContent value="activities" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Extracurricular Activities</h3>
            <Button onClick={addActivity} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Activity
            </Button>
          </div>

          {data.activities.map((activity) => (
            <Card key={activity.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base">Activity #{data.activities.indexOf(activity) + 1}</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeActivity(activity.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Category *</Label>
                    <Select
                      value={activity.category}
                      onValueChange={(value) => updateActivity(activity.id, 'category', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {ACTIVITY_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Activity Name *</Label>
                    <Input
                      value={activity.name}
                      onChange={(e) => updateActivity(activity.id, 'name', e.target.value)}
                      placeholder="e.g., Varsity Soccer, Student Government"
                    />
                  </div>
                  <div>
                    <Label>Organization/School</Label>
                    <Input
                      value={activity.organization || ''}
                      onChange={(e) => updateActivity(activity.id, 'organization', e.target.value)}
                      placeholder="Where did this take place?"
                    />
                  </div>
                  <div>
                    <Label>Position/Leadership Title</Label>
                    <Input
                      value={activity.position || ''}
                      onChange={(e) => updateActivity(activity.id, 'position', e.target.value)}
                      placeholder="e.g., Captain, President, Member"
                    />
                  </div>
                  <div>
                    <Label>Hours per week</Label>
                    <Input
                      type="number"
                      min="0"
                      value={activity.hoursPerWeek}
                      onChange={(e) => updateActivity(activity.id, 'hoursPerWeek', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Weeks per year</Label>
                    <Input
                      type="number"
                      min="0"
                      max="52"
                      value={activity.weeksPerYear}
                      onChange={(e) => updateActivity(activity.id, 'weeksPerYear', Number(e.target.value))}
                    />
                  </div>
                </div>

                <div>
                  <Label>Grades participated</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {GRADE_OPTIONS.map((grade) => (
                      <div key={grade} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${activity.id}-grade-${grade}`}
                          checked={activity.grades.includes(grade)}
                          onCheckedChange={(checked) => {
                            const newGrades = checked
                              ? [...activity.grades, grade]
                              : activity.grades.filter(g => g !== grade);
                            updateActivity(activity.id, 'grades', newGrades);
                          }}
                        />
                        <Label htmlFor={`${activity.id}-grade-${grade}`} className="text-sm">
                          {grade}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Checkbox
                      id={`${activity.id}-leadership`}
                      checked={activity.leadership || false}
                      onCheckedChange={(checked) => updateActivity(activity.id, 'leadership', checked)}
                    />
                    <Label htmlFor={`${activity.id}-leadership`}>
                      This activity involved leadership responsibilities
                    </Label>
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={activity.description}
                    onChange={(e) => updateActivity(activity.id, 'description', e.target.value)}
                    placeholder="Describe your role, responsibilities, and achievements (150 words max)"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {activity.description.length}/150 words
                  </p>
                </div>

                <div>
                  <Label>Awards/Recognition (if any)</Label>
                  <Input
                    value={activity.awards?.join(', ') || ''}
                    onChange={(e) => updateActivity(activity.id, 'awards', 
                      e.target.value.split(',').map(award => award.trim()).filter(Boolean)
                    )}
                    placeholder="List any awards or recognition received"
                  />
                </div>
              </CardContent>
            </Card>
          ))}

          {data.activities.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No activities added yet. Click "Add Activity" to get started.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="work" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Work Experience</h3>
            <Button onClick={addWorkExperience} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Work Experience
            </Button>
          </div>

          {data.workExperience.map((work) => (
            <Card key={work.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base">Job #{data.workExperience.indexOf(work) + 1}</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeWorkExperience(work.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Employer *</Label>
                    <Input
                      value={work.employer}
                      onChange={(e) => updateWorkExperience(work.id, 'employer', e.target.value)}
                      placeholder="Company or organization name"
                    />
                  </div>
                  <div>
                    <Label>Position *</Label>
                    <Input
                      value={work.position}
                      onChange={(e) => updateWorkExperience(work.id, 'position', e.target.value)}
                      placeholder="Job title"
                    />
                  </div>
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="month"
                      value={work.startDate}
                      onChange={(e) => updateWorkExperience(work.id, 'startDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>End Date (leave blank if current)</Label>
                    <Input
                      type="month"
                      value={work.endDate || ''}
                      onChange={(e) => updateWorkExperience(work.id, 'endDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Hours per week</Label>
                    <Input
                      type="number"
                      min="0"
                      value={work.hoursPerWeek}
                      onChange={(e) => updateWorkExperience(work.id, 'hoursPerWeek', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${work.id}-paid`}
                        checked={work.paid}
                        onCheckedChange={(checked) => updateWorkExperience(work.id, 'paid', checked)}
                      />
                      <Label htmlFor={`${work.id}-paid`}>
                        This was paid employment
                      </Label>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Job Description</Label>
                  <Textarea
                    value={work.description}
                    onChange={(e) => updateWorkExperience(work.id, 'description', e.target.value)}
                    placeholder="Describe your responsibilities and accomplishments"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          ))}

          {data.workExperience.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No work experience added yet. Click "Add Work Experience" to get started.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="volunteer" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Volunteer Service</h3>
            <Button onClick={addVolunteerService} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Volunteer Service
            </Button>
          </div>

          {data.volunteerService.map((volunteer) => (
            <Card key={volunteer.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base">
                    Volunteer Service #{data.volunteerService.indexOf(volunteer) + 1}
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeVolunteerService(volunteer.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Organization *</Label>
                    <Input
                      value={volunteer.organization}
                      onChange={(e) => updateVolunteerService(volunteer.id, 'organization', e.target.value)}
                      placeholder="Organization name"
                    />
                  </div>
                  <div>
                    <Label>Hours per week</Label>
                    <Input
                      type="number"
                      min="0"
                      value={volunteer.hoursPerWeek}
                      onChange={(e) => updateVolunteerService(volunteer.id, 'hoursPerWeek', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="month"
                      value={volunteer.startDate}
                      onChange={(e) => updateVolunteerService(volunteer.id, 'startDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>End Date (leave blank if ongoing)</Label>
                    <Input
                      type="month"
                      value={volunteer.endDate || ''}
                      onChange={(e) => updateVolunteerService(volunteer.id, 'endDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Total Hours (if known)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={volunteer.totalHours || ''}
                      onChange={(e) => updateVolunteerService(volunteer.id, 'totalHours', 
                        e.target.value ? Number(e.target.value) : undefined
                      )}
                    />
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={volunteer.description}
                    onChange={(e) => updateVolunteerService(volunteer.id, 'description', e.target.value)}
                    placeholder="Describe your volunteer work and its impact"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          ))}

          {data.volunteerService.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No volunteer service added yet. Click "Add Volunteer Service" to get started.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="leadership" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Leadership Experience</h3>
            <Button onClick={addLeadership} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Leadership Role
            </Button>
          </div>

          {data.leadership.map((leader) => (
            <Card key={leader.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base">
                    Leadership Role #{data.leadership.indexOf(leader) + 1}
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeLeadership(leader.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Position *</Label>
                    <Input
                      value={leader.position}
                      onChange={(e) => updateLeadership(leader.id, 'position', e.target.value)}
                      placeholder="e.g., President, Captain, Team Leader"
                    />
                  </div>
                  <div>
                    <Label>Organization *</Label>
                    <Input
                      value={leader.organization}
                      onChange={(e) => updateLeadership(leader.id, 'organization', e.target.value)}
                      placeholder="Organization or team name"
                    />
                  </div>
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="month"
                      value={leader.startDate}
                      onChange={(e) => updateLeadership(leader.id, 'startDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>End Date (leave blank if current)</Label>
                    <Input
                      type="month"
                      value={leader.endDate || ''}
                      onChange={(e) => updateLeadership(leader.id, 'endDate', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={leader.description}
                    onChange={(e) => updateLeadership(leader.id, 'description', e.target.value)}
                    placeholder="Describe your leadership responsibilities"
                    rows={2}
                  />
                </div>

                <div>
                  <Label>Impact & Achievements</Label>
                  <Textarea
                    value={leader.impact}
                    onChange={(e) => updateLeadership(leader.id, 'impact', e.target.value)}
                    placeholder="What did you accomplish in this role? How did you make a difference?"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          ))}

          {data.leadership.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No leadership roles added yet. Click "Add Leadership Role" to get started.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}