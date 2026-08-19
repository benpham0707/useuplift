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
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Home,
  BarChart3,
  Target,
  GraduationCap,
  PenTool,
  Zap,
  Settings,
  User,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/safeClient';
import GradientZap from '@/components/ui/GradientZap';

const navItems = [
  {
    title: 'Home',
    href: '/dashboard',
    icon: Home,
  },
  {
    title: 'Scanner',
    href: '/dashboard/scanner',
    icon: BarChart3,
  },
  {
    title: 'Insights',
    href: '/dashboard/insights',
    icon: Target,
  },
  {
    title: 'Colleges',
    href: '/dashboard/colleges',
    icon: GraduationCap,
  },
  {
    title: 'Workshop',
    href: '/dashboard/workshop',
    icon: PenTool,
  },
  {
    title: 'Pricing',
    href: '/dashboard/pricing',
    icon: Zap,
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);
  const { state } = useSidebar();

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
        const profile = data as { credits?: number | string | null } | null;
        const value = Number(profile?.credits ?? 0);
        setCredits(Number.isFinite(value) ? value : 0);
      } catch (err) {
        emitCreditsLoadFailure(err);
        setCredits(0);
      }
    };
    loadCredits();
    const onUpdated = () => loadCredits();
    window.addEventListener('credits:updated', onUpdated);
    return () => window.removeEventListener('credits:updated', onUpdated);
  }, [user]);

  // Check if a route is active (including child routes like /dashboard/workshop/:piqNumber)
  const isActive = (href: string) => {
    // Exact match for home to avoid matching all /dashboard/* routes
    if (href === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    // Existing logic for workshop (handles :piqNumber param)
    if (href === '/dashboard/workshop') {
      return location.pathname.startsWith('/dashboard/workshop');
    }
    // Exact match for all other routes
    return location.pathname === href;
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-3 group-data-[collapsible=icon]:p-2">
        <div className={`flex h-10 items-center ${state === 'collapsed' ? 'justify-center' : 'justify-between'}`}>
          {state === 'expanded' && <Link to="/" className="flex min-w-0 items-center gap-2">
            <img
              src="/uplift_logo_lr.png"
              alt="Uplift"
              className="h-8 w-auto object-contain"
            />
          </Link>}
          <SidebarTrigger className="h-9 w-9 shrink-0" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const menuButton = (
                  <SidebarMenuButton asChild isActive={isActive(item.href)}>
                    <Link to={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                );

                return (
                  <SidebarMenuItem key={item.href}>
                    {state === 'collapsed' ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          {menuButton}
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          {item.title}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      menuButton
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4 group-data-[collapsible=icon]:p-2">
        {/* Credits Display */}
        {user && (
          <div className="mb-3 group-data-[collapsible=icon]:mb-2">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="w-full justify-start gap-2 border-primary/20 hover:bg-primary/10 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
            >
              <Link to="/pricing">
                <GradientZap className="h-4 w-4" />
                <span className="group-data-[collapsible=icon]:hidden">{credits ?? 0} Credits</span>
              </Link>
            </Button>
          </div>
        )}

        <SidebarSeparator className="mb-3 group-data-[collapsible=icon]:mx-0 group-data-[collapsible=icon]:mb-2" />

        {/* User Info & Sign Out */}
        {user && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-2 py-1 text-sm text-sidebar-foreground/70 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
              <User className="h-4 w-4" />
              <span className="truncate group-data-[collapsible=icon]:hidden">{user.email}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut()}
              className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
            >
              <LogOut className="h-4 w-4" />
              <span className="group-data-[collapsible=icon]:hidden">Sign Out</span>
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

function emitCreditsLoadFailure(error: unknown) {
  console.warn('[AppSidebar] Could not load credits', error);
}
