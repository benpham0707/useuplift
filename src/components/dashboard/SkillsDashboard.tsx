import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Code, 
  Heart, 
  Brain, 
  Trophy, 
  Zap,
  Target,
  TrendingUp,
  Star,
  Award,
  ChevronRight,
  Radar
} from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar as RechartsRadar, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface SkillCategory {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  mastery: number;
  growth: number;
  skills: Array<{
    name: string;
    level: number;
    evidence: string;
    monthsActive: number;
    projects: string[];
    achievement?: string;
  }>;
}

interface SkillsDashboardProps {
  className?: string;
}

export const SkillsDashboard: React.FC<SkillsDashboardProps> = ({ className }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('technical');
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null);

  // Hard coded data values for comprehensive skills analysis and progression tracking
  const skillCategories: SkillCategory[] = [
    {
      id: 'technical',
      name: 'Technical Skills',
      icon: Code,
      color: 'primary',
      mastery: 85,
      growth: 67,
      skills: [
        {
          name: 'Full-Stack Development',
          level: 90,
          evidence: 'Built scalable platform serving 500+ users',
          monthsActive: 18,
          projects: ['Community Garden App', 'Study Matcher', 'Portfolio Site'],
          achievement: 'Production system with 99.8% uptime'
        },
        {
          name: 'System Architecture',
          level: 85,
          evidence: 'Designed offline-first architecture',
          monthsActive: 12,
          projects: ['Community Garden App', 'Mental Health Hub'],
          achievement: 'Handled 10x user growth without performance loss'
        },
        {
          name: 'Database Design',
          level: 80,
          evidence: 'Optimized queries for complex relationships',
          monthsActive: 15,
          projects: ['Community Garden App', 'Study Matcher'],
          achievement: 'Reduced query time by 75%'
        },
        {
          name: 'UI/UX Design',
          level: 75,
          evidence: 'Achieved 95% user satisfaction',
          monthsActive: 20,
          projects: ['All Projects'],
          achievement: 'Complete interface redesign based on user feedback'
        },
        {
          name: 'DevOps & Deployment',
          level: 70,
          evidence: 'Automated CI/CD pipeline setup',
          monthsActive: 8,
          projects: ['Community Garden App', 'Portfolio Site']
        }
      ]
    },
    {
      id: 'leadership',
      name: 'Leadership Skills',
      icon: Heart,
      color: 'success',
      mastery: 92,
      growth: 85,
      skills: [
        {
          name: 'Adaptive Leadership',
          level: 95,
          evidence: 'Led strategic pivot when initial approach failed',
          monthsActive: 24,
          projects: ['Community Garden App', 'Study Group Formation'],
          achievement: 'Transformed failing project into community success'
        },
        {
          name: 'Team Building',
          level: 88,
          evidence: 'Built diverse development team of 8 volunteers',
          monthsActive: 18,
          projects: ['Community Garden App', 'Mental Health Initiative'],
          achievement: 'Zero team turnover over 18 months'
        },
        {
          name: 'Conflict Resolution',
          level: 90,
          evidence: 'Mediated technical disagreements between stakeholders',
          monthsActive: 20,
          projects: ['Community Garden App', 'Campus Food Waste'],
          achievement: 'Reached consensus on 15+ major decisions'
        },
        {
          name: 'Strategic Planning',
          level: 85,
          evidence: 'Developed 2-year community engagement roadmap',
          monthsActive: 15,
          projects: ['Community Garden App', 'Sustainability Initiative']
        }
      ]
    },
    {
      id: 'communication',
      name: 'Communication Skills',
      icon: Brain,
      color: 'accent',
      mastery: 88,
      growth: 72,
      skills: [
        {
          name: 'Cross-Cultural Communication',
          level: 92,
          evidence: 'Facilitated discussions across 5 different cultural groups',
          monthsActive: 24,
          projects: ['Community Garden App', 'Cultural Exchange Program'],
          achievement: 'Built bridges between traditionally disconnected communities'
        },
        {
          name: 'Technical Translation',
          level: 85,
          evidence: 'Explained complex systems to non-technical stakeholders',
          monthsActive: 20,
          projects: ['All Projects'],
          achievement: '100% stakeholder understanding in technical presentations'
        },
        {
          name: 'Public Speaking',
          level: 80,
          evidence: 'Presented to audiences of 100+ people',
          monthsActive: 16,
          projects: ['Community Garden App', 'Conference Talks']
        },
        {
          name: 'Written Communication',
          level: 88,
          evidence: 'Documentation that reduced onboarding time by 60%',
          monthsActive: 22,
          projects: ['All Projects'],
          achievement: 'Created comprehensive project documentation'
        }
      ]
    }
  ];

  // Hard coded radar chart data for skill distribution visualization
  const radarData = [
    { skill: 'Technical', value: 85, fullMark: 100 },
    { skill: 'Leadership', value: 92, fullMark: 100 },
    { skill: 'Communication', value: 88, fullMark: 100 },
    { skill: 'Problem Solving', value: 90, fullMark: 100 },
    { skill: 'Creativity', value: 78, fullMark: 100 },
    { skill: 'Adaptability', value: 95, fullMark: 100 }
  ];

  // Hard coded progression data for skill development over time
  const progressionData = [
    { month: 'Jan', technical: 45, leadership: 30, communication: 40 },
    { month: 'Mar', technical: 55, leadership: 45, communication: 50 },
    { month: 'May', technical: 65, leadership: 60, communication: 65 },
    { month: 'Jul', technical: 75, leadership: 75, communication: 75 },
    { month: 'Sep', technical: 80, leadership: 85, communication: 82 },
    { month: 'Nov', technical: 85, leadership: 92, communication: 88 }
  ];

  const selectedCategoryData = skillCategories.find(cat => cat.id === selectedCategory);

  const getColorClasses = (color: string) => {
    const colors = {
      primary: 'text-primary border-primary/30 bg-primary/10',
      success: 'text-success border-success/30 bg-success/10',
      accent: 'text-accent border-accent/30 bg-accent/10'
    };
    return colors[color as keyof typeof colors] || colors.primary;
  };

  const getMasteryLabel = (level: number) => {
    if (level >= 90) return { label: 'Expert', color: 'success' };
    if (level >= 80) return { label: 'Advanced', color: 'primary' };
    if (level >= 70) return { label: 'Proficient', color: 'accent' };
    return { label: 'Developing', color: 'muted' };
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Skills Overview Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Radar Chart */}
        <Card className="glass-card shadow-large">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-primary text-white shadow-soft">
                <Radar className="h-5 w-5" />
              </div>
              Skills Distribution
            </CardTitle>
            <CardDescription>Comprehensive view of skill mastery across domains</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="skill" tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }} />
                  <PolarRadiusAxis 
                    angle={30} 
                    domain={[0, 100]} 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <RechartsRadar
                    name="Skills"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Progression Chart */}
        <Card className="glass-card shadow-large">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-success to-success/80 text-white shadow-soft">
                <TrendingUp className="h-5 w-5" />
              </div>
              Skills Progression
            </CardTitle>
            <CardDescription>Development trajectory over the past year</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progressionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="technical" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    name="Technical"
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="leadership" 
                    stroke="hsl(var(--success))" 
                    strokeWidth={3}
                    name="Leadership"
                    dot={{ fill: 'hsl(var(--success))', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="communication" 
                    stroke="hsl(var(--accent))" 
                    strokeWidth={3}
                    name="Communication"
                    dot={{ fill: 'hsl(var(--accent))', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Skills Analysis */}
      <Card className="glass-card shadow-large">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-primary text-white shadow-soft">
              <Target className="h-5 w-5" />
            </div>
            Detailed Skills Analysis
          </CardTitle>
          <CardDescription>Deep dive into each skill category with evidence and achievements</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-card/80 backdrop-blur-xl border border-border/50">
              {skillCategories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <TabsTrigger 
                    key={category.id} 
                    value={category.id}
                    className="flex items-center gap-2 data-[state=active]:bg-gradient-primary data-[state=active]:text-white"
                  >
                    <IconComponent className="h-4 w-4" />
                    {category.name}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {skillCategories.map((category) => (
              <TabsContent key={category.id} value={category.id} className="space-y-6">
                {/* Category Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`p-4 rounded-xl border shadow-soft ${getColorClasses(category.color)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Overall Mastery</span>
                      <Badge variant="secondary">{category.mastery}%</Badge>
                    </div>
                    <Progress value={category.mastery} className="h-2" />
                  </div>
                  <div className={`p-4 rounded-xl border shadow-soft ${getColorClasses(category.color)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Growth Rate</span>
                      <Badge variant="secondary">+{category.growth}%</Badge>
                    </div>
                    <Progress value={category.growth} className="h-2" />
                  </div>
                  <div className={`p-4 rounded-xl border shadow-soft ${getColorClasses(category.color)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Active Skills</span>
                      <Badge variant="secondary">{category.skills.length}</Badge>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-3 w-3 ${i < Math.ceil(category.skills.length / 2) ? 'fill-current' : ''}`} 
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Individual Skills */}
                <div className="space-y-4">
                  {category.skills.map((skill) => {
                    const mastery = getMasteryLabel(skill.level);
                    return (
                      <div 
                        key={skill.name}
                        className="p-6 rounded-xl bg-card/50 border border-border/50 hover:shadow-large transition-all duration-300 cursor-pointer"
                        onMouseEnter={() => setHoveredSkill(skill.name)}
                        onMouseLeave={() => setHoveredSkill(null)}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <h4 className="font-semibold text-lg">{skill.name}</h4>
                              <Badge 
                                variant="secondary" 
                                className={`${mastery.color === 'success' ? 'bg-success/20 text-success' : 
                                  mastery.color === 'primary' ? 'bg-primary/20 text-primary' : 
                                  mastery.color === 'accent' ? 'bg-accent/20 text-accent' : 
                                  'bg-muted/20 text-muted-foreground'}`}
                              >
                                {mastery.label}
                              </Badge>
                              {skill.achievement && (
                                <Badge variant="outline" className="border-warning text-warning">
                                  <Award className="h-3 w-3 mr-1" />
                                  Achievement
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{skill.evidence}</p>
                            {skill.achievement && (
                              <p className="text-sm font-medium text-warning">{skill.achievement}</p>
                            )}
                          </div>
                          <div className="text-right space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold">{skill.level}%</span>
                              <ChevronRight className={`h-4 w-4 transition-transform ${hoveredSkill === skill.name ? 'rotate-90' : ''}`} />
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {skill.monthsActive} months active
                            </div>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <Progress value={skill.level} className="h-2" />
                        </div>

                        {hoveredSkill === skill.name && (
                          <div className="mt-4 p-4 rounded-lg bg-muted/30 border border-border/30 animate-fade-in">
                            <h5 className="font-medium mb-2">Projects Applied:</h5>
                            <div className="flex flex-wrap gap-2">
                              {skill.projects.map((project) => (
                                <Badge key={project} variant="outline" className="text-xs">
                                  {project}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};