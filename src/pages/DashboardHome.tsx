import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { seedDashboardData, needsDashboardSeeding } from '@/lib/seedDashboardData';
import { useUserStreak } from '@/hooks/useDashboard';
import {
  Target, Trophy, BookOpen, TrendingUp, Calendar, Clock,
  Award, CheckCircle2, AlertCircle, Zap, GraduationCap,
  Users, ArrowRight, Flame, BarChart3, FileText, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

// Import all widgets
import WelcomeProfileWidget, { type SectionKey } from '@/components/dashboard/WelcomeProfileWidget';
import CharacterStatsWidget from '@/components/dashboard/widgets/CharacterStatsWidget';
import EnhancedCalendarWidget from '@/components/dashboard/widgets/EnhancedCalendarWidget';
import ActivityPortfolioWidget from '@/components/dashboard/widgets/ActivityPortfolioWidget';
import WritingPortfolioWidget from '@/components/dashboard/widgets/WritingPortfolioWidget';
import '@/components/dashboard/dashboard-animations.css';
import '@/components/dashboard/dashboard-enhanced-animations.css';

// Import profile section components
import ProfileSectionModal from '@/components/dashboard/ProfileSectionModal';
import ActivitiesSection from '@/components/dashboard/sections/ActivitiesSection';
import AcademicsSection from '@/components/dashboard/sections/AcademicsSection';
import GoalsSection from '@/components/dashboard/sections/GoalsSection';
import IdentitySection from '@/components/dashboard/sections/IdentitySection';
import FamilySection from '@/components/dashboard/sections/FamilySection';
import SupportSection from '@/components/dashboard/sections/SupportSection';
import GrowthSection from '@/components/dashboard/sections/GrowthSection';

/**
 * Optimized Dashboard Home - Efficient space utilization
 * Minimal scrolling, maximum information density
 */
export default function DashboardHome() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>('');
  const [profileId, setProfileId] = useState<string>('');
  const [applicationStage, setApplicationStage] = useState<'exploring' | 'mid_application' | 'almost_done' | null>(null);
  const [openDrawer, setOpenDrawer] = useState<SectionKey | null>(null);
  const [drawerRefreshKey, setDrawerRefreshKey] = useState(0);

  useEffect(() => {
    const initializeDashboard = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      // Profile facts live in canonical child tables; profiles owns process stage.
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, application_stage')
          .eq('user_id', user.id)
          .maybeSingle() as { data: any; error: any }; // Type assertion for newly added column

        if (profileError) {
          console.error('Error fetching profile name:', profileError);
        }

        if (profileData?.id) {
          setProfileId(profileData.id);
          setApplicationStage(profileData.application_stage ?? null);
          const { data: personal } = await supabase
            .from('personal_information').select('first_name').eq('profile_id', profileData.id).maybeSingle();
          setUserName(personal?.first_name || user.email?.split('@')[0] || 'there');
        } else {
          setUserName(user.email?.split('@')[0] || 'there');
        }
      } catch (error) {
        console.error('Error fetching user name:', error);
        setUserName(user.email?.split('@')[0] || 'there');
      }

      try {
        const needsSeeding = await needsDashboardSeeding(user.id);
        if (needsSeeding) {
          await seedDashboardData(user.id);
        }
      } catch (error) {
        console.error('Error initializing dashboard:', error);
      }

      setLoading(false);
    };

    initializeDashboard();
  }, [user]);

  // Handle section save completion - triggers widget refresh
  const handleSectionSaveComplete = () => {
    setOpenDrawer(null);
    setDrawerRefreshKey(prev => prev + 1); // Forces WelcomeProfileWidget to refetch
  };

  // Section metadata for drawer configuration
  const sectionConfig: Record<SectionKey, { title: string; description: string; time: string }> = {
    activities: {
      title: 'Activities & Experience',
      description: 'Add your activities to unlock portfolio analysis',
      time: '~10 min'
    },
    academic_details: {
      title: 'Academic Details',
      description: 'Complete your academic profile for personalized school recommendations',
      time: '~5 min'
    },
    goals_aspirations: {
      title: 'Goals & Aspirations',
      description: 'Define your goals to get targeted college matches',
      time: '~5 min'
    },
    identity_demographics: {
      title: 'Identity & Demographics',
      description: 'Complete your personal information',
      time: '~5 min'
    },
    family_context: {
      title: 'Family Context',
      description: 'Share your family context and responsibilities',
      time: '~5 min'
    },
    support_network: {
      title: 'Support Network',
      description: 'Add your support network',
      time: '~5 min'
    },
    personal_growth: {
      title: 'Personal Growth',
      description: 'Reflect on your personal growth journey',
      time: '~10 min'
    }
  };

  if (loading) {
    return <DashboardHomeSkeleton />;
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Compact Header Bar */}
      <CompactHeader userName={userName} date={currentDate} />

      {/* Main Dashboard Grid - Maximum Efficiency */}
      <div className="p-4 max-w-[1600px] mx-auto">
        {/* Top Row: Profile Builder + Application Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <WelcomeProfileWidget
            key={drawerRefreshKey}
            onSectionClick={setOpenDrawer}
          />
          <ApplicationProgressCompact />
        </div>
        <StageGuidance stage={applicationStage} />

        {/* Top Priority Section - 3 columns */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
          {/* Left: Key Metrics */}
          <div className="xl:col-span-1 space-y-4">
            <KeyMetricsGrid />
          </div>

          {/* Center: AI Recommendations & Actions */}
          <div className="xl:col-span-1 space-y-4">
            <AICounselorCompact />
            <QuickActionsCompact />
          </div>

          {/* Right: Deadlines & Daily Tasks */}
          <div className="xl:col-span-1 space-y-4">
            <DeadlineTrackerCompact />
            <DailyTasksCompact />
          </div>
        </div>

        {/* Secondary Section - 2 columns for portfolio widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Writing Portfolio */}
          <Card className="p-4 border-gray-200">
            <WritingPortfolioWidget />
          </Card>

          {/* Activity Portfolio */}
          <Card className="p-4 border-gray-200">
            <ActivityPortfolioWidget />
          </Card>

          {/* Character Stats */}
          <Card className="p-4 border-gray-200">
            <CharacterStatsWidget />
          </Card>

          {/* Calendar */}
          <Card className="p-4 border-gray-200">
            <EnhancedCalendarWidget />
          </Card>
        </div>
      </div>

      {/* Profile Section Modals - Render conditionally based on openDrawer state */}
      {profileId && (
        <>
          <ProfileSectionModal
            isOpen={openDrawer === 'activities'}
            onClose={() => setOpenDrawer(null)}
            sectionKey="activities"
            title={sectionConfig.activities.title}
            description={sectionConfig.activities.description}
            estimatedTime={sectionConfig.activities.time}
          >
            <ActivitiesSection
              profileId={profileId}
              onSaveComplete={handleSectionSaveComplete}
            />
          </ProfileSectionModal>

          <ProfileSectionModal
            isOpen={openDrawer === 'academic_details'}
            onClose={() => setOpenDrawer(null)}
            sectionKey="academic_details"
            title={sectionConfig.academic_details.title}
            description={sectionConfig.academic_details.description}
            estimatedTime={sectionConfig.academic_details.time}
          >
            <AcademicsSection
              profileId={profileId}
              onSaveComplete={handleSectionSaveComplete}
            />
          </ProfileSectionModal>

          <ProfileSectionModal
            isOpen={openDrawer === 'goals_aspirations'}
            onClose={() => setOpenDrawer(null)}
            sectionKey="goals_aspirations"
            title={sectionConfig.goals_aspirations.title}
            description={sectionConfig.goals_aspirations.description}
            estimatedTime={sectionConfig.goals_aspirations.time}
          >
            <GoalsSection
              profileId={profileId}
              onSaveComplete={handleSectionSaveComplete}
            />
          </ProfileSectionModal>

          <ProfileSectionModal
            isOpen={openDrawer === 'identity_demographics'}
            onClose={() => setOpenDrawer(null)}
            sectionKey="identity_demographics"
            title={sectionConfig.identity_demographics.title}
            description={sectionConfig.identity_demographics.description}
            estimatedTime={sectionConfig.identity_demographics.time}
          >
            <IdentitySection
              profileId={profileId}
              onSaveComplete={handleSectionSaveComplete}
            />
          </ProfileSectionModal>

          <ProfileSectionModal
            isOpen={openDrawer === 'family_context'}
            onClose={() => setOpenDrawer(null)}
            sectionKey="family_context"
            title={sectionConfig.family_context.title}
            description={sectionConfig.family_context.description}
            estimatedTime={sectionConfig.family_context.time}
          >
            <FamilySection
              profileId={profileId}
              onSaveComplete={handleSectionSaveComplete}
            />
          </ProfileSectionModal>

          <ProfileSectionModal
            isOpen={openDrawer === 'support_network'}
            onClose={() => setOpenDrawer(null)}
            sectionKey="support_network"
            title={sectionConfig.support_network.title}
            description={sectionConfig.support_network.description}
            estimatedTime={sectionConfig.support_network.time}
          >
            <SupportSection
              profileId={profileId}
              onSaveComplete={handleSectionSaveComplete}
            />
          </ProfileSectionModal>

          <ProfileSectionModal
            isOpen={openDrawer === 'personal_growth'}
            onClose={() => setOpenDrawer(null)}
            sectionKey="personal_growth"
            title={sectionConfig.personal_growth.title}
            description={sectionConfig.personal_growth.description}
            estimatedTime={sectionConfig.personal_growth.time}
          >
            <GrowthSection
              profileId={profileId}
              onSaveComplete={handleSectionSaveComplete}
            />
          </ProfileSectionModal>
        </>
      )}
    </div>
  );
}

function StageGuidance({ stage }: { stage: 'exploring' | 'mid_application' | 'almost_done' | null }) {
  const copy = stage === 'exploring'
    ? ['Start with discovery', 'Tell us what you want in a college to get better matches.']
    : stage === 'mid_application'
      ? ['Keep your applications moving', 'Prioritize deadlines, essays, and the information that improves your plan.']
      : stage === 'almost_done'
        ? ['Finish with confidence', 'Use your dashboard to check requirements and submit on time.']
        : ['Build your plan at your pace', 'Add what matters when you need a more personalized recommendation.'];
  return <Card className="mb-4 p-4 border-primary/20 bg-primary/5"><h2 className="font-semibold">{copy[0]}</h2><p className="mt-1 text-sm text-muted-foreground">{copy[1]}</p></Card>;
}

/**
 * Compact Header Component
 *
 * Displays greeting, date, and critical metrics
 */
function CompactHeader({ userName, date }: { userName: string; date: string }) {
  const { currentStreak } = useUserStreak();

  // Get time-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-[1600px] mx-auto">
        {/* Greeting and Date */}
        <div className="mb-3">
          <h2 className="text-xl font-bold text-gray-900">
            {greeting}{userName ? `, ${userName}` : ''}!
          </h2>
          <p className="text-sm text-gray-500">{date}</p>
        </div>

        {/* Metrics Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* Inline Critical Metrics */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-500" />
                <div>
                  <span className="text-lg font-bold text-gray-900">47</span>
                  <span className="text-xs text-gray-500 ml-1">days left</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <div>
                  <span className="text-lg font-bold text-gray-900">85%</span>
                  <span className="text-xs text-gray-500 ml-1">strength</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-purple-500" />
                <div>
                  <span className="text-lg font-bold text-gray-900">92</span>
                  <span className="text-xs text-gray-500 ml-1">profile score</span>
                </div>
              </div>
            </div>
          </div>

          {/* Streak Badge */}
          {currentStreak > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-full">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-orange-700">{currentStreak} day streak</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Compact Application Progress Card
 */
function ApplicationProgressCompact() {
  const sections = [
    { label: 'Profile', value: 100, color: 'bg-green-500' },
    { label: 'Essays', value: 58, color: 'bg-blue-500' },
    { label: 'Activities', value: 75, color: 'bg-purple-500' },
    { label: 'Recs', value: 50, color: 'bg-orange-500' }
  ];

  const overallProgress = Math.round(sections.reduce((acc, s) => acc + s.value, 0) / sections.length);

  return (
    <Card className="p-4 border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Application Progress</h3>
        <span className="text-2xl font-bold text-blue-600">{overallProgress}%</span>
      </div>

      <div className="space-y-2">
        {sections.map((section) => (
          <div key={section.label} className="flex items-center gap-3">
            <span className="text-xs text-gray-600 w-16">{section.label}</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${section.color} transition-all duration-500`}
                style={{ width: `${section.value}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-700 w-10 text-right">
              {section.value}%
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/**
 * Key Metrics Grid
 */
function KeyMetricsGrid() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Card className="p-3 border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Essays Done</p>
            <p className="text-xl font-bold text-gray-900">7/12</p>
          </div>
          <BookOpen className="w-5 h-5 text-blue-500" />
        </div>
      </Card>

      <Card className="p-3 border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Schools</p>
            <p className="text-xl font-bold text-gray-900">8</p>
          </div>
          <GraduationCap className="w-5 h-5 text-purple-500" />
        </div>
      </Card>

      <Card className="p-3 border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Tasks Left</p>
            <p className="text-xl font-bold text-gray-900">23</p>
          </div>
          <Target className="w-5 h-5 text-green-500" />
        </div>
      </Card>

      <Card className="p-3 border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Match Score</p>
            <p className="text-xl font-bold text-gray-900">A+</p>
          </div>
          <Award className="w-5 h-5 text-yellow-500" />
        </div>
      </Card>
    </div>
  );
}

/**
 * AI Counselor Compact View
 */
function AICounselorCompact() {
  const recommendations = [
    {
      priority: 'urgent',
      title: 'Complete Common App essay',
      time: '2 hrs',
      icon: <FileText className="w-4 h-4" />
    },
    {
      priority: 'high',
      title: 'Add Science Olympiad details',
      time: '30 min',
      icon: <Trophy className="w-4 h-4" />
    },
    {
      priority: 'medium',
      title: 'Request teacher rec',
      time: '15 min',
      icon: <Users className="w-4 h-4" />
    }
  ];

  const priorityColors = {
    urgent: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-blue-100 text-blue-700'
  };

  return (
    <Card className="p-4 border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">AI Recommendations</h3>
        <Badge variant="outline" className="text-xs">3 tasks</Badge>
      </div>

      <div className="space-y-2">
        {recommendations.map((rec, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded ${priorityColors[rec.priority as keyof typeof priorityColors]}`}>
                {rec.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{rec.title}</p>
                <p className="text-xs text-gray-500">{rec.time}</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
          </div>
        ))}
      </div>
    </Card>
  );
}

/**
 * Quick Actions Compact
 */
function QuickActionsCompact() {
  const actions = [
    { label: 'Write Essay', icon: <BookOpen className="w-4 h-4" />, count: 3, color: 'bg-blue-500' },
    { label: 'Portfolio Review', icon: <BarChart3 className="w-4 h-4" />, count: 1, color: 'bg-purple-500' },
    { label: 'Mock Interview', icon: <Users className="w-4 h-4" />, count: 0, color: 'bg-green-500' },
    { label: 'Find Colleges', icon: <GraduationCap className="w-4 h-4" />, count: 12, color: 'bg-orange-500' }
  ];

  return (
    <Card className="p-4 border-gray-200">
      <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => (
          <button
            key={action.label}
            className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-left group"
          >
            <div className="flex items-center justify-between mb-1">
              <div className={`p-1.5 rounded ${action.color} text-white`}>
                {action.icon}
              </div>
              {action.count > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {action.count}
                </Badge>
              )}
            </div>
            <p className="text-xs font-medium text-gray-700">{action.label}</p>
          </button>
        ))}
      </div>
    </Card>
  );
}

/**
 * Deadline Tracker Compact
 */
function DeadlineTrackerCompact() {
  const deadlines = [
    { school: 'Stanford', type: 'REA', days: 47, status: 'on-track' },
    { school: 'MIT', type: 'EA', days: 47, status: 'on-track' },
    { school: 'Harvard', type: 'REA', days: 47, status: 'at-risk' },
    { school: 'Yale', type: 'REA', days: 47, status: 'on-track' }
  ];

  const statusColors = {
    'on-track': 'text-green-600 bg-green-50',
    'at-risk': 'text-orange-600 bg-orange-50',
    'behind': 'text-red-600 bg-red-50'
  };

  return (
    <Card className="p-4 border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Upcoming Deadlines</h3>
        <Clock className="w-4 h-4 text-gray-400" />
      </div>

      <div className="space-y-2">
        {deadlines.map((deadline) => (
          <div key={deadline.school} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
              <span className="text-sm font-medium text-gray-900">{deadline.school}</span>
              <Badge variant="outline" className="text-xs">{deadline.type}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[deadline.status as keyof typeof statusColors]}`}>
                {deadline.days}d
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/**
 * Daily Tasks Compact
 */
function DailyTasksCompact() {
  const tasks = [
    { task: 'Review essay feedback', done: true },
    { task: 'Update activities list', done: false },
    { task: 'Schedule counselor meeting', done: false },
    { task: 'Submit test scores', done: false }
  ];

  const completedCount = tasks.filter(t => t.done).length;

  return (
    <Card className="p-4 border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Today's Tasks</h3>
        <span className="text-xs font-medium text-gray-500">
          {completedCount}/{tasks.length} done
        </span>
      </div>

      <div className="space-y-2">
        {tasks.map((task, index) => (
          <div key={index} className="flex items-center gap-2">
            <button
              className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                task.done
                  ? 'bg-blue-500 border-blue-500'
                  : 'border-gray-300 hover:border-blue-400'
              }`}
            >
              {task.done && <CheckCircle2 className="w-3 h-3 text-white" />}
            </button>
            <span className={`text-sm ${task.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
              {task.task}
            </span>
          </div>
        ))}
      </div>

      <Button size="sm" variant="outline" className="w-full mt-3">
        View All Tasks
      </Button>
    </Card>
  );
}

/**
 * Loading skeleton
 */
function DashboardHomeSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-[1600px] mx-auto">
          <Skeleton className="h-8 w-48" />
        </div>
      </div>

      <div className="p-4 max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    </div>
  );
}
