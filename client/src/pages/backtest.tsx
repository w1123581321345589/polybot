import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Play, History, TrendingUp, TrendingDown, Target, BarChart3 } from "lucide-react";
import type { BacktestResult, BacktestConfig } from "@shared/schema";

export default function Backtest() {
  const { toast } = useToast();
  const [strategy, setStrategy] = useState<BacktestConfig["strategy"]>("spike");
  const [initialCapital, setInitialCapital] = useState("10000");
  const [days, setDays] = useState("30");
  const [currentResult, setCurrentResult] = useState<BacktestResult | null>(null);

  const { data: results, isLoading: resultsLoading } = useQuery<BacktestResult[]>({
    queryKey: ["/api/trading/backtest/results"],
  });

  const runMutation = useMutation({
    mutationFn: async () => {
      const config: BacktestConfig = {
        strategy,
        startDate: new Date(Date.now() - parseInt(days) * 86400000).toISOString(),
        endDate: new Date().toISOString(),
        initialCapital: parseFloat(initialCapital),
        settings: {
          spikeThreshold: 0.02,
          positionPercent: 0.02,
          kellyFraction: 0.5,
          minProfit: 0.02,
        },
      };
      const res = await apiRequest("POST", "/api/trading/backtest", {
        ...config,
        days: parseInt(days),
      });
      return res.json();
    },
    onSuccess: (data: BacktestResult) => {
      setCurrentResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/trading/backtest/results"] });
      toast({
        title: "Backtest Complete",
        description: `${data.totalTrades} trades simulated with ${data.totalReturnPercent.toFixed(2)}% return`,
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to run backtest", variant: "destructive" });
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">Backtesting</h1>
        <p className="text-muted-foreground">Test strategies against historical data</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="w-5 h-5" />
              Run Backtest
            </CardTitle>
            <CardDescription>Configure and execute simulation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Strategy</Label>
              <Select value={strategy} onValueChange={(v) => setStrategy(v as BacktestConfig["strategy"])}>
                <SelectTrigger data-testid="select-strategy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spike">Spike Hunter</SelectItem>
                  <SelectItem value="arbitrage">Arbitrage</SelectItem>
                  <SelectItem value="kelly">Kelly Criterion</SelectItem>
                  <SelectItem value="statistical">Statistical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Initial Capital ($)</Label>
              <Input
                type="number"
                min="100"
                value={initialCapital}
                onChange={(e) => setInitialCapital(e.target.value)}
                data-testid="input-initial-capital"
              />
            </div>

            <div className="space-y-2">
              <Label>Simulation Days</Label>
              <Input
                type="number"
                min="7"
                max="365"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                data-testid="input-days"
              />
            </div>

            <Button
              onClick={() => runMutation.mutate()}
              className="w-full"
              disabled={runMutation.isPending}
              data-testid="button-run-backtest"
            >
              {runMutation.isPending ? (
                <>Running...</>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Simulation
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Results
            </CardTitle>
            <CardDescription>Performance metrics and equity curve</CardDescription>
          </CardHeader>
          <CardContent>
            {runMutation.isPending ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
            ) : currentResult ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Total Return</p>
                    <p className={`text-xl font-mono font-bold ${currentResult.totalReturn >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {currentResult.totalReturn >= 0 ? "+" : ""}${currentResult.totalReturn.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {currentResult.totalReturnPercent >= 0 ? "+" : ""}{currentResult.totalReturnPercent.toFixed(2)}%
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Win Rate</p>
                    <p className="text-xl font-mono font-bold">{currentResult.winRate.toFixed(1)}%</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Sharpe Ratio</p>
                    <p className="text-xl font-mono font-bold">{currentResult.sharpeRatio.toFixed(2)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Max Drawdown</p>
                    <p className="text-xl font-mono font-bold text-red-500">
                      -{currentResult.maxDrawdown.toFixed(2)}%
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 rounded-lg bg-muted text-center">
                    <p className="text-sm text-muted-foreground">Total Trades</p>
                    <p className="text-lg font-mono font-bold">{currentResult.totalTrades}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted text-center">
                    <p className="text-sm text-muted-foreground">Profit Factor</p>
                    <p className="text-lg font-mono font-bold">
                      {currentResult.profitFactor === Infinity ? "∞" : currentResult.profitFactor.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted text-center">
                    <p className="text-sm text-muted-foreground">Strategy</p>
                    <Badge variant="outline">{currentResult.config.strategy}</Badge>
                  </div>
                </div>

                {currentResult.equityCurve.length > 0 && (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={currentResult.equityCurve}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10 }}
                          tickFormatter={(v) => v.slice(5)}
                          className="text-muted-foreground"
                        />
                        <YAxis
                          tick={{ fontSize: 10 }}
                          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                          className="text-muted-foreground"
                        />
                        <Tooltip
                          formatter={(value: number) => [`$${value.toFixed(2)}`, "Equity"]}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Line
                          type="monotone"
                          dataKey="equity"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <Target className="w-12 h-12 mb-2 opacity-50" />
                <p>Configure parameters and run a backtest</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Previous Results
          </CardTitle>
          <CardDescription>Historical backtest runs</CardDescription>
        </CardHeader>
        <CardContent>
          {resultsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : results && results.length > 0 ? (
            <div className="space-y-3">
              {results.slice(0, 5).map((result) => (
                <div
                  key={result.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card cursor-pointer hover-elevate"
                  onClick={() => setCurrentResult(result)}
                  data-testid={`backtest-result-${result.id}`}
                >
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">{result.config.strategy}</Badge>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(result.runAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {result.totalTrades} trades
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-mono font-bold ${result.totalReturn >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {result.totalReturn >= 0 ? "+" : ""}${result.totalReturn.toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {result.winRate.toFixed(0)}% win rate
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-24 text-muted-foreground">
              <History className="w-8 h-8 mb-2 opacity-50" />
              <p>No previous backtests</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
