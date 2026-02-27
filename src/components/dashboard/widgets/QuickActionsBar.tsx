import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BookOpen, PenTool, BarChart3, Search } from 'lucide-react';

/**
 * Quick Actions Bar - Horizontal row of primary action buttons
 *
 * Provides quick access to the most commonly used features.
 * Responsive: wraps to 2x2 grid on smaller screens.
 */
export default function QuickActionsBar() {
  const navigate = useNavigate();

  const actions = [
    {
      id: 'journal',
      label: 'New Journal Entry',
      icon: BookOpen,
      route: '/journal',
      description: 'Reflect on your journey'
    },
    {
      id: 'workshop',
      label: 'Open Workshop',
      icon: PenTool,
      route: '/dashboard/workshop',
      description: 'Improve your essays'
    },
    {
      id: 'scanner',
      label: 'Run Scanner',
      icon: BarChart3,
      route: '/dashboard/scanner',
      description: 'Analyze your portfolio'
    },
    {
      id: 'schools',
      label: 'Explore Schools',
      icon: Search,
      route: '/schools',
      description: 'Find your fit'
    }
  ];

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action) => (
          <Button
            key={action.id}
            variant="outline"
            size="lg"
            onClick={() => navigate(action.route)}
            className="flex flex-col sm:flex-row items-center justify-center gap-2 h-auto py-4 px-6 hover:bg-primary/5 hover:border-primary/50 transition-all group"
          >
            <action.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-sm font-medium text-center">{action.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}