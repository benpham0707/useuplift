import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  Lightbulb, 
  ChevronDown, 
  ChevronRight, 
  Star, 
  Clock, 
  TrendingUp,
  Filter,
  Search,
  Brain,
  Globe,
  Users,
  Building,
  Palette,
  Code,
  Heart,
  Award,
  Target,
  PlayCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProjectDiscovery = () => {
  const navigate = useNavigate();
  const [expandedProjects, setExpandedProjects] = useState<string[]>(['ai-study-planner']);
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('impact');

  // Hard coded data for suggested project ideas with comprehensive discovery information
  const suggestedProjects = [
    {
      id: 'ai-study-planner',
      title: 'AI-Powered Study Planner',
      category: 'Academic Enhancement',
      description: 'Personalized study schedule optimization using machine learning to adapt to your learning patterns',
      estimatedTime: '6-8 weeks',
      impactScore: 8.5,
      skillsRequired: ['React', 'Python', 'Machine Learning'],
      uniquenessRating: 'High',
      icon: Brain,
      detailedFindings: [
        'Market gap: Current study apps lack personalization',
        '78% of students report difficulty with time management',
        'ML integration opportunity largely unexplored in education'
      ],
      skillsDeveloped: [
        'Machine Learning algorithms',
        'User behavior analysis',
        'Educational technology design',
        'Data visualization'
      ],
      potentialOutcomes: [
        'Patent-worthy algorithm development',
        'Research publication opportunity',
        'Startup potential with university partnerships',
        'Strong portfolio piece for tech roles'
      ],
      impactAssessment: {
        userBase: '10K+ students initially',
        problemSeverity: 'High',
        solutionNovelty: 'Very High',
        marketPotential: 'Significant'
      }
    },
    {
      id: 'campus-sustainability',
      title: 'Campus Sustainability Tracker',
      category: 'Environmental Impact',
      description: 'Real-time tracking of campus environmental metrics with student engagement features',
      estimatedTime: '4-6 weeks',
      impactScore: 9.2,
      skillsRequired: ['IoT', 'Data Visualization', 'Mobile Development'],
      uniquenessRating: 'Very High',
      icon: Globe,
      detailedFindings: [
        'Universities prioritizing sustainability metrics',
        'Student engagement in environmental initiatives low',
        'Real-time data tracking systems underdeveloped'
      ],
      skillsDeveloped: [
        'IoT sensor integration',
        'Environmental data analysis',
        'Mobile app development',
        'Community engagement strategies'
      ],
      potentialOutcomes: [
        'University partnership opportunities',
        'Environmental award eligibility',
        'Research collaboration potential',
        'Green technology portfolio development'
      ],
      impactAssessment: {
        userBase: '5K+ campus community',
        problemSeverity: 'Very High',
        solutionNovelty: 'High',
        marketPotential: 'Growing'
      }
    },
    {
      id: 'peer-mentorship',
      title: 'Peer Mentorship Platform',
      category: 'Community Building',
      description: 'Connect students across different academic years for mentorship and knowledge sharing',
      estimatedTime: '5-7 weeks',
      impactScore: 7.8,
      skillsRequired: ['Full-Stack Development', 'UI/UX Design', 'Database Design'],
      uniquenessRating: 'Medium',
      icon: Users,
      detailedFindings: [
        'Existing mentorship programs lack scalability',
        '65% of students interested in peer mentoring',
        'Digital platforms for mentorship underutilized'
      ],
      skillsDeveloped: [
        'Community platform development',
        'Matching algorithm design',
        'User engagement optimization',
        'Social impact measurement'
      ],
      potentialOutcomes: [
        'University administration recognition',
        'Social impact award consideration',
        'Leadership development opportunity',
        'Community organizing experience'
      ],
      impactAssessment: {
        userBase: '2K+ students',
        problemSeverity: 'Medium',
        solutionNovelty: 'Medium',
        marketPotential: 'Moderate'
      }
    },
    {
      id: 'local-business-connector',
      title: 'Local Business Connector',
      category: 'Economic Development',
      description: 'Platform connecting students with local businesses for internships and projects',
      estimatedTime: '8-10 weeks',
      impactScore: 8.9,
      skillsRequired: ['Business Development', 'Web Development', 'Marketing'],
      uniquenessRating: 'High',
      icon: Building,
      detailedFindings: [
        'Local businesses struggle to find student talent',
        'Students seek real-world experience opportunities',
        'Geographic proximity advantage underutilized'
      ],
      skillsDeveloped: [
        'Business relationship management',
        'Partnership development',
        'Economic impact analysis',
        'Platform architecture'
      ],
      potentialOutcomes: [
        'Entrepreneurship award eligibility',
        'Local government recognition',
        'Business network expansion',
        'Economic development contribution'
      ],
      impactAssessment: {
        userBase: '1K+ students, 200+ businesses',
        problemSeverity: 'High',
        solutionNovelty: 'High',
        marketPotential: 'Very High'
      }
    },
    {
      id: 'creative-collaboration',
      title: 'Creative Collaboration Hub',
      category: 'Arts & Media',
      description: 'Digital space for artists, writers, and creators to collaborate on multimedia projects',
      estimatedTime: '6-8 weeks',
      impactScore: 7.3,
      skillsRequired: ['Creative Direction', 'Web Development', 'Content Management'],
      uniquenessRating: 'Medium',
      icon: Palette,
      detailedFindings: [
        'Creative students often work in isolation',
        'Cross-disciplinary collaboration limited',
        'Digital tools for creative teamwork inadequate'
      ],
      skillsDeveloped: [
        'Creative project management',
        'Multimedia platform development',
        'Artist community building',
        'Digital portfolio curation'
      ],
      potentialOutcomes: [
        'Arts grant funding opportunity',
        'Creative industry connections',
        'Portfolio diversification',
        'Cultural impact measurement'
      ],
      impactAssessment: {
        userBase: '800+ creative students',
        problemSeverity: 'Medium',
        solutionNovelty: 'Medium',
        marketPotential: 'Niche but growing'
      }
    },
    {
      id: 'research-network',
      title: 'Student Research Network',
      category: 'Academic Research',
      description: 'Platform for sharing research interests, finding collaborators, and tracking progress',
      estimatedTime: '7-9 weeks',
      impactScore: 8.1,
      skillsRequired: ['Research Methods', 'Database Design', 'Academic Writing'],
      uniquenessRating: 'High',
      icon: Search,
      detailedFindings: [
        'Research collaboration across departments limited',
        'Graduate students seek undergraduate assistance',
        'Research project visibility and documentation poor'
      ],
      skillsDeveloped: [
        'Academic research methodologies',
        'Collaborative platform design',
        'Research data management',
        'Academic networking'
      ],
      potentialOutcomes: [
        'Research publication co-authorship',
        'Academic conference presentations',
        'Graduate school application strength',
        'Faculty collaboration opportunities'
      ],
      impactAssessment: {
        userBase: '1.5K+ research students',
        problemSeverity: 'Medium-High',
        solutionNovelty: 'High',
        marketPotential: 'Academic focused'
      }
    }
  ];

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => 
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const getUniquenessBadgeColor = (uniqueness: string) => {
    switch (uniqueness) {
      case 'Very High':
        return 'bg-green-100 text-green-800';
      case 'High':
        return 'bg-blue-100 text-blue-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAndSortedProjects = suggestedProjects
    .filter(project => {
      if (filterCategory === 'all') return true;
      return project.category.toLowerCase().includes(filterCategory.toLowerCase());
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'impact':
          return b.impactScore - a.impactScore;
        case 'uniqueness':
          const uniquenessOrder = { 'Very High': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
          return uniquenessOrder[b.uniquenessRating as keyof typeof uniquenessOrder] - 
                 uniquenessOrder[a.uniquenessRating as keyof typeof uniquenessOrder];
        case 'time':
          return a.estimatedTime.localeCompare(b.estimatedTime);
        default:
          return 0;
      }
    });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb Navigation */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/project-incubation">Project Incubation</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Project Discovery</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/project-incubation')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Hub</span>
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-foreground">Project Discovery</h1>
              <p className="text-lg text-muted-foreground mt-2">
                Explore curated project ideas tailored to your goals and interests
              </p>
            </div>
          </div>
        </div>

        {/* Filters and Sorting */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="academic">Academic Enhancement</SelectItem>
                  <SelectItem value="environmental">Environmental Impact</SelectItem>
                  <SelectItem value="community">Community Building</SelectItem>
                  <SelectItem value="economic">Economic Development</SelectItem>
                  <SelectItem value="arts">Arts & Media</SelectItem>
                  <SelectItem value="research">Academic Research</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="impact">Sort by Impact Score</SelectItem>
                <SelectItem value="uniqueness">Sort by Uniqueness</SelectItem>
                <SelectItem value="time">Sort by Time Estimate</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredAndSortedProjects.length} project idea{filteredAndSortedProjects.length !== 1 ? 's' : ''} available
          </div>
        </div>

        {/* Project Discovery Cards */}
        <div className="space-y-6">
          {filteredAndSortedProjects.map((project) => {
            const IconComponent = project.icon;
            const isExpanded = expandedProjects.includes(project.id);
            
            return (
              <Card key={project.id} className="hover:shadow-lg transition-all duration-200">
                <Collapsible 
                  open={isExpanded}
                  onOpenChange={() => toggleProject(project.id)}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <IconComponent className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-xl flex items-center space-x-2">
                              <span>{project.title}</span>
                            </CardTitle>
                            <CardDescription className="mt-1">
                              {project.description}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex flex-col items-end space-y-2">
                            <div className="flex items-center space-x-2">
                              <Badge className={getUniquenessBadgeColor(project.uniquenessRating)}>
                                {project.uniquenessRating} Uniqueness
                              </Badge>
                              <Badge variant="outline" className="flex items-center space-x-1">
                                <Star className="h-3 w-3" />
                                <span>{project.impactScore}</span>
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>{project.estimatedTime}</span>
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column */}
                        <div className="space-y-4">
                          {/* Detailed Findings */}
                          <div>
                            <h4 className="font-semibold mb-2 flex items-center space-x-2">
                              <Search className="h-4 w-4" />
                              <span>Key Findings</span>
                            </h4>
                            <ul className="space-y-1 text-sm">
                              {project.detailedFindings.map((finding, index) => (
                                <li key={index} className="flex items-start space-x-2">
                                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                                  <span>{finding}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Skills Developed */}
                          <div>
                            <h4 className="font-semibold mb-2 flex items-center space-x-2">
                              <TrendingUp className="h-4 w-4" />
                              <span>Skills You'll Develop</span>
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {project.skillsDeveloped.map((skill) => (
                                <Badge key={skill} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-4">
                          {/* Potential Outcomes */}
                          <div>
                            <h4 className="font-semibold mb-2 flex items-center space-x-2">
                              <Award className="h-4 w-4" />
                              <span>Potential Outcomes</span>
                            </h4>
                            <ul className="space-y-1 text-sm">
                              {project.potentialOutcomes.map((outcome, index) => (
                                <li key={index} className="flex items-start space-x-2">
                                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                                  <span>{outcome}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Impact Assessment */}
                          <div>
                            <h4 className="font-semibold mb-2 flex items-center space-x-2">
                              <Target className="h-4 w-4" />
                              <span>Impact Assessment</span>
                            </h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">User Base:</span>
                                <div className="font-medium">{project.impactAssessment.userBase}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Problem Severity:</span>
                                <div className="font-medium">{project.impactAssessment.problemSeverity}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Solution Novelty:</span>
                                <div className="font-medium">{project.impactAssessment.solutionNovelty}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Market Potential:</span>
                                <div className="font-medium">{project.impactAssessment.marketPotential}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between pt-6 mt-6 border-t">
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <span>Required Skills:</span>
                          {project.skillsRequired.slice(0, 2).map((skill) => (
                            <Badge key={skill} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {project.skillsRequired.length > 2 && (
                            <span className="text-xs">+{project.skillsRequired.length - 2} more</span>
                          )}
                        </div>
                        <div className="flex space-x-3">
                          <Button variant="outline">
                            Learn More
                          </Button>
                          <Button className="flex items-center space-x-2">
                            <PlayCircle className="h-4 w-4" />
                            <span>Start Planning</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProjectDiscovery;