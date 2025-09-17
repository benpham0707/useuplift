import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Code, 
  Database, 
  Server, 
  Smartphone,
  Globe,
  GitBranch,
  Zap,
  Shield,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Monitor,
  Cpu,
  HardDrive,
  Network,
  Eye,
  Download
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';

interface TechnicalProject {
  id: string;
  name: string;
  type: 'web' | 'mobile' | 'backend' | 'fullstack';
  description: string;
  technologies: string[];
  architecture: string;
  codeSnippet: string;
  metrics: {
    users: number;
    uptime: number;
    responseTime: number;
    linesOfCode: number;
    testCoverage: number;
  };
  achievements: string[];
  githubUrl?: string;
  liveUrl?: string;
}

interface TechnicalSkillsShowcaseProps {
  className?: string;
}

export const TechnicalSkillsShowcase: React.FC<TechnicalSkillsShowcaseProps> = ({ className }) => {
  const [selectedProject, setSelectedProject] = useState<string>('garden-app');
  const [selectedTab, setSelectedTab] = useState<string>('portfolio');

  // Hard coded technical projects with comprehensive metrics and code examples
  const technicalProjects: TechnicalProject[] = [
    {
      id: 'garden-app',
      name: 'Community Garden App',
      type: 'fullstack',
      description: 'Real-time collaborative platform for community garden management with offline-first architecture',
      technologies: ['React', 'Node.js', 'PostgreSQL', 'Socket.io', 'PWA', 'Redis'],
      architecture: 'Microservices with event-driven architecture, offline-first design using service workers',
      codeSnippet: `// Offline-first data synchronization strategy
class DataSyncManager {
  private syncQueue: SyncOperation[] = [];
  private isOnline = navigator.onLine;

  async syncData(operation: SyncOperation) {
    if (this.isOnline) {
      try {
        await this.executeSync(operation);
        this.processQueue();
      } catch (error) {
        this.addToQueue(operation);
      }
    } else {
      this.addToQueue(operation);
    }
  }

  private async executeSync(op: SyncOperation) {
    const response = await fetch(\`/api/\${op.endpoint}\`, {
      method: op.method,
      body: JSON.stringify(op.data),
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) throw new Error('Sync failed');
    return response.json();
  }
}`,
      metrics: {
        users: 523,
        uptime: 99.8,
        responseTime: 185,
        linesOfCode: 15420,
        testCoverage: 87
      },
      achievements: [
        'Scaled from 45 to 500+ users without performance degradation',
        'Implemented offline-first architecture for low-connectivity areas',
        'Achieved 99.8% uptime over 6 months in production',
        'Reduced data sync conflicts by 95% with custom conflict resolution'
      ],
      githubUrl: 'https://github.com/user/garden-app',
      liveUrl: 'https://community-garden.app'
    },
    {
      id: 'study-matcher',
      name: 'Study Group Matcher',
      type: 'backend',
      description: 'Machine learning algorithm to match students for optimal study groups based on learning styles and schedules',
      technologies: ['Python', 'FastAPI', 'PostgreSQL', 'scikit-learn', 'Redis', 'Docker'],
      architecture: 'API-first design with ML pipeline and real-time matching engine',
      codeSnippet: `# Advanced matching algorithm with multiple criteria
class StudyGroupMatcher:
    def __init__(self):
        self.compatibility_weights = {
            'learning_style': 0.3,
            'schedule_overlap': 0.4,
            'academic_level': 0.2,
            'subject_expertise': 0.1
        }
    
    def calculate_compatibility(self, student_a, student_b):
        scores = {}
        
        # Learning style compatibility
        style_score = self._learning_style_similarity(
            student_a.learning_style, 
            student_b.learning_style
        )
        scores['learning_style'] = style_score
        
        # Schedule overlap calculation
        overlap_score = self._schedule_overlap(
            student_a.availability, 
            student_b.availability
        )
        scores['schedule_overlap'] = overlap_score
        
        # Weighted final score
        final_score = sum(
            scores[key] * self.compatibility_weights[key] 
            for key in scores
        )
        
        return final_score`,
      metrics: {
        users: 1247,
        uptime: 99.2,
        responseTime: 95,
        linesOfCode: 8750,
        testCoverage: 92
      },
      achievements: [
        'Matched 1,200+ students with 89% satisfaction rate',
        'Reduced study group formation time from weeks to minutes',
        'ML model accuracy improved from 72% to 89% through iteration',
        'Processing 10,000+ matching requests per day'
      ]
    },
    {
      id: 'portfolio-site',
      name: 'Photography Portfolio',
      type: 'web',
      description: 'High-performance portfolio site with e-commerce integration and advanced image optimization',
      technologies: ['React', 'TypeScript', 'Next.js', 'Stripe', 'Cloudinary', 'Vercel'],
      architecture: 'JAMstack architecture with CDN optimization and progressive image loading',
      codeSnippet: `// Advanced image optimization with lazy loading
const OptimizedImage: React.FC<ImageProps> = ({ 
  src, alt, sizes, priority = false 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const generateSrcSet = (baseUrl: string) => {
    const breakpoints = [640, 768, 1024, 1280, 1536];
    return breakpoints
      .map(width => 
        \`\${baseUrl}?w=\${width}&q=80&f=webp \${width}w\`
      )
      .join(', ');
  };

  return (
    <div className="relative overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
      )}
      <img
        src={src}
        srcSet={generateSrcSet(src)}
        sizes={sizes}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={() => setIsLoading(false)}
        onError={() => setError(true)}
        className="transition-opacity duration-300"
      />
    </div>
  );
};`,
      metrics: {
        users: 2845,
        uptime: 99.9,
        responseTime: 45,
        linesOfCode: 5630,
        testCoverage: 78
      },
      achievements: [
        'Page load speed optimized to 0.8 seconds average',
        'SEO score of 98/100 with perfect accessibility',
        'Mobile-first design with 100% responsive layouts',
        'Integrated payment processing with zero failed transactions'
      ],
      githubUrl: 'https://github.com/user/portfolio',
      liveUrl: 'https://photography-portfolio.com'
    }
  ];

  // Hard coded performance metrics data over time
  const performanceData = [
    { month: 'Jan', responseTime: 245, users: 45, uptime: 98.2 },
    { month: 'Feb', responseTime: 220, users: 89, uptime: 98.8 },
    { month: 'Mar', responseTime: 195, users: 156, uptime: 99.1 },
    { month: 'Apr', responseTime: 185, users: 234, uptime: 99.4 },
    { month: 'May', responseTime: 175, users: 345, uptime: 99.6 },
    { month: 'Jun', responseTime: 165, users: 523, uptime: 99.8 }
  ];

  // Hard coded technology stack with mastery levels
  const technologyStack = [
    { category: 'Frontend', technologies: [
      { name: 'React', mastery: 92, projects: 5, yearsUsed: 2.5 },
      { name: 'TypeScript', mastery: 88, projects: 4, yearsUsed: 2 },
      { name: 'Next.js', mastery: 85, projects: 3, yearsUsed: 1.5 },
      { name: 'Tailwind CSS', mastery: 90, projects: 6, yearsUsed: 2 }
    ]},
    { category: 'Backend', technologies: [
      { name: 'Node.js', mastery: 89, projects: 4, yearsUsed: 2.5 },
      { name: 'Python', mastery: 87, projects: 3, yearsUsed: 3 },
      { name: 'PostgreSQL', mastery: 85, projects: 5, yearsUsed: 2 },
      { name: 'Redis', mastery: 78, projects: 2, yearsUsed: 1 }
    ]},
    { category: 'DevOps', technologies: [
      { name: 'Docker', mastery: 82, projects: 3, yearsUsed: 1.5 },
      { name: 'AWS', mastery: 75, projects: 2, yearsUsed: 1 },
      { name: 'Vercel', mastery: 88, projects: 4, yearsUsed: 2 },
      { name: 'Git', mastery: 91, projects: 8, yearsUsed: 3 }
    ]}
  ];

  const selectedProjectData = technicalProjects.find(p => p.id === selectedProject)!;

  const getProjectIcon = (type: string) => {
    const icons = {
      web: Globe,
      mobile: Smartphone,
      backend: Server,
      fullstack: Code
    };
    return icons[type as keyof typeof icons] || Code;
  };

  const getMasteryColor = (mastery: number) => {
    if (mastery >= 90) return 'text-success bg-success/10 border-success/30';
    if (mastery >= 80) return 'text-primary bg-primary/10 border-primary/30';
    if (mastery >= 70) return 'text-accent bg-accent/10 border-accent/30';
    return 'text-muted-foreground bg-muted/10 border-muted/30';
  };

  return (
    <div className={`space-y-8 ${className}`}>
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-card/80 backdrop-blur-xl border border-border/50">
          <TabsTrigger value="portfolio" className="flex items-center gap-2 data-[state=active]:bg-gradient-primary data-[state=active]:text-white">
            <Code className="h-4 w-4" />
            Code Portfolio
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2 data-[state=active]:bg-gradient-primary data-[state=active]:text-white">
            <TrendingUp className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="stack" className="flex items-center gap-2 data-[state=active]:bg-gradient-primary data-[state=active]:text-white">
            <Database className="h-4 w-4" />
            Tech Stack
          </TabsTrigger>
        </TabsList>

        {/* Code Portfolio Tab */}
        <TabsContent value="portfolio" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Project Selector */}
            <div className="space-y-4">
              {technicalProjects.map((project) => {
                const IconComponent = getProjectIcon(project.type);
                return (
                  <Card 
                    key={project.id}
                    className={`cursor-pointer transition-all duration-300 hover:shadow-large ${
                      selectedProject === project.id ? 'ring-2 ring-primary shadow-large' : ''
                    }`}
                    onClick={() => setSelectedProject(project.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-gradient-primary text-white shadow-soft">
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">{project.name}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs capitalize">{project.type}</Badge>
                            <span className="text-xs text-muted-foreground">{project.technologies.length} techs</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Project Details */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="glass-card shadow-large">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-gradient-primary text-white shadow-soft">
                        {React.createElement(getProjectIcon(selectedProjectData.type), { className: "h-6 w-6" })}
                      </div>
                      <div>
                        <CardTitle>{selectedProjectData.name}</CardTitle>
                        <CardDescription>{selectedProjectData.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {selectedProjectData.githubUrl && (
                        <Button variant="outline" size="sm">
                          <GitBranch className="h-4 w-4 mr-2" />
                          Code
                        </Button>
                      )}
                      {selectedProjectData.liveUrl && (
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Live
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Architecture Overview */}
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      Architecture
                    </h4>
                    <p className="text-sm text-muted-foreground">{selectedProjectData.architecture}</p>
                  </div>

                  {/* Technologies Used */}
                  <div>
                    <h4 className="font-semibold mb-3">Technologies Used</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProjectData.technologies.map((tech) => (
                        <Badge key={tech} variant="outline" className="bg-primary/10 text-primary border-primary/30">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Code Snippet */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      Key Implementation
                    </h4>
                    <div className="bg-card border border-border/50 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-sm text-muted-foreground whitespace-pre-wrap">
                        <code>{selectedProjectData.codeSnippet}</code>
                      </pre>
                    </div>
                  </div>

                  {/* Key Achievements */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      Key Achievements
                    </h4>
                    <div className="space-y-2">
                      {selectedProjectData.achievements.map((achievement, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{achievement}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Performance Metrics Tab */}
        <TabsContent value="performance" className="space-y-6">
          {/* Current Metrics Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="glass-card">
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 mx-auto text-primary mb-2" />
                <div className="text-2xl font-bold">{selectedProjectData.metrics.users.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Active Users</div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4 text-center">
                <Shield className="h-8 w-8 mx-auto text-success mb-2" />
                <div className="text-2xl font-bold">{selectedProjectData.metrics.uptime}%</div>
                <div className="text-xs text-muted-foreground">Uptime</div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4 text-center">
                <Zap className="h-8 w-8 mx-auto text-accent mb-2" />
                <div className="text-2xl font-bold">{selectedProjectData.metrics.responseTime}ms</div>
                <div className="text-xs text-muted-foreground">Response Time</div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4 text-center">
                <Code className="h-8 w-8 mx-auto text-primary mb-2" />
                <div className="text-2xl font-bold">{(selectedProjectData.metrics.linesOfCode / 1000).toFixed(1)}K</div>
                <div className="text-xs text-muted-foreground">Lines of Code</div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-8 w-8 mx-auto text-success mb-2" />
                <div className="text-2xl font-bold">{selectedProjectData.metrics.testCoverage}%</div>
                <div className="text-xs text-muted-foreground">Test Coverage</div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Over Time */}
          <Card className="glass-card shadow-large">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-primary text-white shadow-soft">
                  <TrendingUp className="h-5 w-5" />
                </div>
                Performance Trends
              </CardTitle>
              <CardDescription>System performance metrics over the past 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" />
                    <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px'
                      }} 
                    />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="responseTime" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      name="Response Time (ms)"
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="users" 
                      stroke="hsl(var(--success))" 
                      strokeWidth={3}
                      name="Active Users"
                      dot={{ fill: 'hsl(var(--success))', strokeWidth: 2, r: 4 }}
                    />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="uptime" 
                      stroke="hsl(var(--accent))" 
                      strokeWidth={3}
                      name="Uptime (%)"
                      dot={{ fill: 'hsl(var(--accent))', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Technology Stack Tab */}
        <TabsContent value="stack" className="space-y-6">
          {technologyStack.map((category) => (
            <Card key={category.category} className="glass-card shadow-large">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-primary text-white shadow-soft">
                    {category.category === 'Frontend' && <Globe className="h-5 w-5" />}
                    {category.category === 'Backend' && <Server className="h-5 w-5" />}
                    {category.category === 'DevOps' && <Cpu className="h-5 w-5" />}
                  </div>
                  {category.category} Technologies
                </CardTitle>
                <CardDescription>Mastery levels and experience with {category.category.toLowerCase()} technologies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {category.technologies.map((tech) => (
                    <div key={tech.name} className={`p-4 rounded-xl border ${getMasteryColor(tech.mastery)}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">{tech.name}</h4>
                        <Badge variant="secondary">{tech.mastery}%</Badge>
                      </div>
                      <Progress value={tech.mastery} className="mb-3 h-2" />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{tech.projects} projects</span>
                        <span>{tech.yearsUsed} years experience</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};