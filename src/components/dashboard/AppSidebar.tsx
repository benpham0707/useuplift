import { Link, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  BarChart3,
  Target,
  PenTool,
  Zap,
  Settings,
  User,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import GradientZap from '@/components/ui/GradientZap';

const navItems = [
  {
    title: 'Scanner',
    href: '/portfolio-scanner',
    icon: BarChart3,
  },
  {
    title: 'Insights',
    href: '/portfolio-insights',
    icon: Target,
  },
  {
    title: 'Workshop',
    href: '/piq-workshop',
    icon: PenTool,
  },
  {
    title: 'Pricing',
    href: '/pricing',
    icon: Zap,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);

  // Load credits
  useEffect(() => {
    if (!user) return;
    const loadCredits = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('credits')
          .eq('user_id', user.id)
          .maybeSingle();
        if (error) throw error;
        const value = Number((data as any)?.credits ?? 0);
        setCredits(Number.isFinite(value) ? value : 0);
      } catch (err) {
        setCredits(0);
      }
    };
    loadCredits();
    const onUpdated = () => loadCredits();
    window.addEventListener('credits:updated', onUpdated);
    return () => window.removeEventListener('credits:updated', onUpdated);
  }, [user]);

  // Check if a route is active (including child routes like /piq-workshop/:piqNumber)
  const isActive = (href: string) => {
    if (href === '/piq-workshop') {
      return location.pathname.startsWith('/piq-workshop');
    }
    return location.pathname === href;
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <Link to="/" className="flex items-center gap-2">
          <img 
            src="/uplift_logo_lr.png" 
            alt="Uplift" 
            className="h-8 w-auto object-contain" 
          />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)}>
                    <Link to={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        {/* Credits Display */}
        {user && (
          <div className="mb-3">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="w-full justify-start gap-2 border-primary/20 hover:bg-primary/10"
            >
              <Link to="/pricing">
                <GradientZap className="h-4 w-4" />
                <span>{credits ?? 0} Credits</span>
              </Link>
            </Button>
          </div>
        )}

        <SidebarSeparator className="mb-3" />

        {/* User Info & Sign Out */}
        {user && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-2 py-1 text-sm text-sidebar-foreground/70">
              <User className="h-4 w-4" />
              <span className="truncate">{user.email}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut()}
              className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
