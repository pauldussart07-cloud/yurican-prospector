import { Home, Building2, Users, Settings, Target, Calendar, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from '@/components/ui/sidebar';

const navItems = [
  { title: 'Vision', url: '/', icon: Home },
  { title: 'Marché', url: '/marche', icon: Building2 },
  { title: 'Prospects', url: '/prospects', icon: Users },
  { title: 'Agenda', url: '/agenda', icon: Calendar },
  { title: 'Ciblage', url: '/targeting', icon: Target },
  { title: 'Profil', url: '/profile', icon: User },
  { title: 'Paramétrage', url: '/parametrage', icon: Settings },
];

export function AppSidebar() {
  return (
    <Sidebar className="border-r border-border w-44">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
            Y
          </div>
          <span className="text-xl font-bold">Yurican</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) =>
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'hover:bg-sidebar-accent/50'
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.title === 'Marché' && (
                        <Badge variant="destructive" className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-xs">
                          3
                        </Badge>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
