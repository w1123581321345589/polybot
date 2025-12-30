import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  Shield,
  AlertTriangle,
  TrendingDown,
  Activity,
  Settings,
  RefreshCw,
  DollarSign,
  Percent,
} from "lucide-react";
import type { RiskMetrics, RiskLimits } from "@shared/schema";

export default function Risk() {
  const { toast } = useToast();

  const { data: metrics, isLoading: metricsLoading } = useQuery<RiskMetrics>({
    queryKey: ["/api/trading/risk/metrics"],
    refetchInterval: 5000,
  });

  const { data: limits, isLoading: limitsLoading } = useQuery<RiskLimits>({
    queryKey: ["/api/trading/risk/limits"],
  });

  const { data: dailyData } = useQuery<{ dailyPnL: number; tradingAllowed: boolean }>({
    queryKey: ["/api/trading/risk/daily-pnl"],
    refetchInterval: 5000,
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/trading/risk/reset-daily", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trading/risk/daily-pnl"] });
      toast({ title: "Reset", description: "Daily P&L has been reset" });
    },
  });

  const getRiskColor = (score: RiskMetrics["riskScore"]) => {
    switch (score) {
      case "low": return "text-green-500";
      case "medium": return "text-yellow-500";
      case "high": return "text-orange-500";
      case "critical": return "text-red-500";
      default: return "";
    }
  };

  const getRiskBadgeVariant = (score: RiskMetrics["riskScore"]) => {
    switch (score) {
      case "low": return "default" as const;
      case "medium": return "secondary" as const;
      case "high": return "destructive" as const;
      case "critical": return "destructive" as const;
      default: return "outline" as const;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Risk Management</h1>
          <p className="text-muted-foreground">Monitor exposure, limits, and portfolio risk</p>
        </div>
        {dailyData && !dailyData.tradingAllowed && (
          <Badge variant="destructive" className="text-lg px-4 py-2">
            <AlertTriangle className="w-4 h-4 mr-2" />
            TRADING HALTED
          </Badge>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Risk Score"
          icon={<Shield className="w-4 h-4" />}
          isLoading={metricsLoading}
        >
          {metrics && (
            <div className="text-center">
              <Badge variant={getRiskBadgeVariant(metrics.riskScore)} className="text-lg px-4 py-2">
                {metrics.riskScore.toUpperCase()}
              </Badge>
            </div>
          )}
        </MetricCard>

        <MetricCard
          title="Total Exposure"
          icon={<DollarSign className="w-4 h-4" />}
          isLoading={metricsLoading}
        >
          {metrics && (
            <>
              <p className="text-2xl font-mono font-bold" data-testid="text-total-exposure">
                ${metrics.totalExposure.toFixed(2)}
              </p>
              <Progress value={metrics.exposurePercent} className="mt-2" />
              <p className="text-sm text-muted-foreground mt-1">
                {metrics.exposurePercent.toFixed(1)}% of bankroll
              </p>
            </>
          )}
        </MetricCard>

        <MetricCard
          title="Daily P&L"
          icon={<Activity className="w-4 h-4" />}
          isLoading={!dailyData}
        >
          {dailyData && (
            <>
              <p className={`text-2xl font-mono font-bold ${dailyData.dailyPnL >= 0 ? "text-green-500" : "text-red-500"}`}>
                {dailyData.dailyPnL >= 0 ? "+" : ""}${dailyData.dailyPnL.toFixed(2)}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => resetMutation.mutate()}
                className="mt-2"
                data-testid="button-reset-daily"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Reset
              </Button>
            </>
          )}
        </MetricCard>

        <MetricCard
          title="Max Drawdown"
          icon={<TrendingDown className="w-4 h-4" />}
          isLoading={metricsLoading}
        >
          {metrics && (
            <>
              <p className="text-2xl font-mono font-bold text-red-500">
                -{metrics.maxDrawdown.toFixed(2)}%
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Current: -{metrics.currentDrawdown.toFixed(2)}%
              </p>
            </>
          )}
        </MetricCard>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Portfolio Metrics
            </CardTitle>
            <CardDescription>Detailed risk analysis</CardDescription>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : metrics ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <span className="text-muted-foreground">Portfolio Heat</span>
                  <span className="font-mono font-medium">{metrics.portfolioHeat.toFixed(2)}%</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <span className="text-muted-foreground">Correlation Risk</span>
                  <span className="font-mono font-medium">{metrics.correlationRisk.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <span className="text-muted-foreground">Value at Risk (95%)</span>
                  <span className="font-mono font-medium text-red-500">
                    -${metrics.valueAtRisk.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <span className="text-muted-foreground">Largest Position</span>
                  <span className="font-mono font-medium">${metrics.largestPosition.toFixed(2)}</span>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <RiskLimitsPanel limits={limits} isLoading={limitsLoading} />
      </div>
    </div>
  );
}

function MetricCard({
  title,
  icon,
  isLoading,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  isLoading: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-10 w-full" /> : children}
      </CardContent>
    </Card>
  );
}

function RiskLimitsPanel({ limits, isLoading }: { limits?: RiskLimits; isLoading: boolean }) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<RiskLimits>>({});

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<RiskLimits>) => {
      return apiRequest("POST", "/api/trading/risk/limits", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trading/risk/limits"] });
      setEditing(false);
      toast({ title: "Updated", description: "Risk limits updated successfully" });
    },
  });

  const handleEdit = () => {
    if (limits) {
      setFormData(limits);
    }
    setEditing(true);
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Risk Limits
          </CardTitle>
          <CardDescription>Configure trading constraints</CardDescription>
        </div>
        {!editing ? (
          <Button variant="outline" size="sm" onClick={handleEdit} data-testid="button-edit-limits">
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
              Save
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : limits ? (
          <div className="space-y-4">
            <LimitRow
              label="Max Total Exposure"
              value={limits.maxTotalExposure}
              isPercent
              editing={editing}
              onChange={(v) => setFormData({ ...formData, maxTotalExposure: v })}
            />
            <LimitRow
              label="Max Position Size"
              value={limits.maxPositionSize}
              isPercent
              editing={editing}
              onChange={(v) => setFormData({ ...formData, maxPositionSize: v })}
            />
            <LimitRow
              label="Max Daily Loss"
              value={limits.maxDailyLoss}
              isPercent
              editing={editing}
              onChange={(v) => setFormData({ ...formData, maxDailyLoss: v })}
            />
            <LimitRow
              label="Default Stop Loss"
              value={limits.stopLossDefault}
              isPercent
              editing={editing}
              onChange={(v) => setFormData({ ...formData, stopLossDefault: v })}
            />
            <LimitRow
              label="Default Take Profit"
              value={limits.takeProfitDefault}
              isPercent
              editing={editing}
              onChange={(v) => setFormData({ ...formData, takeProfitDefault: v })}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function LimitRow({
  label,
  value,
  isPercent,
  editing,
  onChange,
}: {
  label: string;
  value: number;
  isPercent?: boolean;
  editing: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
      <Label className="text-muted-foreground">{label}</Label>
      {editing ? (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-24 text-right"
          />
          {isPercent && <Percent className="w-4 h-4 text-muted-foreground" />}
        </div>
      ) : (
        <span className="font-mono font-medium">
          {isPercent ? `${(value * 100).toFixed(0)}%` : value.toFixed(2)}
        </span>
      )}
    </div>
  );
}
