import { useQuery } from "@tanstack/react-query";
import { MetricCard } from "@/components/metric-card";
import { ProfitChart } from "@/components/profit-chart";
import { ExecutionLog } from "@/components/execution-log";
import { MarketTable } from "@/components/market-table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign,
  TrendingUp,
  Activity,
  Bot,
  Target,
  Briefcase,
} from "lucide-react";
import type { DashboardMetrics, ExecutionLog as ExecutionLogType, Market } from "@shared/schema";

export default function Dashboard() {
  const { data: metrics, isLoading: metricsLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: recentLogs, isLoading: logsLoading } = useQuery<ExecutionLogType[]>({
    queryKey: ["/api/executions/recent"],
  });

  const { data: topMarkets, isLoading: marketsLoading } = useQuery<Market[]>({
    queryKey: ["/api/markets/top"],
  });

  return (
    <div className="p-6 space-y-6" data-testid="page-dashboard">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor your trading bot performance
          </p>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {metricsLoading ? (
          <>
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-[120px]" />
            ))}
          </>
        ) : (
          <>
            <MetricCard
              title="Total P&L"
              value={metrics?.totalProfitLoss ?? 0}
              change={metrics?.todayProfitLoss ? (metrics.todayProfitLoss / (metrics.totalProfitLoss || 1)) * 100 : 0}
              changeLabel="today"
              icon={DollarSign}
              isCurrency
              testId="card-total-pnl"
            />
            <MetricCard
              title="Today's P&L"
              value={metrics?.todayProfitLoss ?? 0}
              icon={TrendingUp}
              isCurrency
              testId="card-today-pnl"
            />
            <MetricCard
              title="Win Rate"
              value={metrics?.winRate ?? 0}
              icon={Target}
              isPercentage
              testId="card-win-rate"
            />
            <MetricCard
              title="Total Trades"
              value={metrics?.totalTrades ?? 0}
              icon={Activity}
              testId="card-total-trades"
            />
            <MetricCard
              title="Active Bots"
              value={metrics?.activeBots ?? 0}
              icon={Bot}
              testId="card-active-bots"
            />
            <MetricCard
              title="Open Positions"
              value={metrics?.activePositions ?? 0}
              icon={Briefcase}
              testId="card-open-positions"
            />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {metricsLoading ? (
            <Skeleton className="h-[380px]" />
          ) : (
            <ProfitChart
              data={metrics?.profitHistory ?? []}
              title="Performance (30 Days)"
            />
          )}
        </div>
        <div>
          <ExecutionLog
            logs={recentLogs ?? []}
            isLoading={logsLoading}
            maxHeight="336px"
          />
        </div>
      </div>

      <div>
        <MarketTable
          markets={(topMarkets ?? []).slice(0, 5)}
          isLoading={marketsLoading}
          showArbitrage
        />
      </div>
    </div>
  );
}
