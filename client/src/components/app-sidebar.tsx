import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  TrendingUp,
  Bot,
  History,
  Settings,
  Zap,
  Wrench,
  Shield,
  FlaskConical,
  Newspaper,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

const navigationItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Markets",
    url: "/markets",
    icon: TrendingUp,
  },
  {
    title: "Bots",
    url: "/bots",
    icon: Bot,
  },
  {
    title: "Trading Tools",
    url: "/tools",
    icon: Wrench,
  },
  {
    title: "Backtest",
    url: "/backtest",
    icon: FlaskConical,
  },
  {
    title: "Risk",
    url: "/risk",
    icon: Shield,
  },
  {
    title: "News Intelligence",
    url: "/news",
    icon: Newspaper,
  },
  {
    title: "Executions",
    url: "/executions",
    icon: History,
  },
];

interface AppSidebarProps {
  activeBots?: number;
  connectionStatus?: "connected" | "connecting" | "disconnected";
}

export function AppSidebar({ activeBots = 0, connectionStatus = "connected" }: AppSidebarProps) {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold" data-testid="text-logo">PolyBot</span>
            <span className="text-xs text-muted-foreground">Trading Platform</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`link-nav-${item.title.toLowerCase()}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Quick Stats</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-2 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Bots</span>
                <Badge variant="secondary" data-testid="badge-active-bots">
                  {activeBots}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <div className="flex items-center gap-1.5">
                  <div 
                    className={`h-2 w-2 rounded-full ${
                      connectionStatus === "connected" 
                        ? "bg-green-500" 
                        : connectionStatus === "connecting"
                        ? "bg-amber-500 animate-pulse"
                        : "bg-red-500"
                    }`}
                  />
                  <span className="text-xs capitalize" data-testid="text-connection-status">
                    {connectionStatus}
                  </span>
                </div>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild data-testid="link-settings">
              <Link href="/settings">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
