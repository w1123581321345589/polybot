import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import Dashboard from "@/pages/dashboard";
import Markets from "@/pages/markets";
import Bots from "@/pages/bots";
import Executions from "@/pages/executions";
import Settings from "@/pages/settings";
import TradingTools from "@/pages/trading-tools";
import Risk from "@/pages/risk";
import Backtest from "@/pages/backtest";
import News from "@/pages/news";
import NotFound from "@/pages/not-found";
import type { BotConfig } from "@shared/schema";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/markets" component={Markets} />
      <Route path="/bots" component={Bots} />
      <Route path="/executions" component={Executions} />
      <Route path="/tools" component={TradingTools} />
      <Route path="/risk" component={Risk} />
      <Route path="/backtest" component={Backtest} />
      <Route path="/news" component={News} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { data: bots } = useQuery<BotConfig[]>({
    queryKey: ["/api/bots"],
    refetchInterval: 10000,
  });

  const activeBots = (bots ?? []).filter((b) => b.status === "active").length;

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={sidebarStyle}>
      <div className="flex h-screen w-full">
        <AppSidebar activeBots={activeBots} connectionStatus="connected" />
        <SidebarInset className="flex flex-col flex-1 overflow-hidden">
          <header className="flex h-14 items-center justify-between gap-4 border-b px-4 shrink-0">
            <div className="flex items-center gap-2">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
            </div>
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto">
            <Router />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AppContent />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
