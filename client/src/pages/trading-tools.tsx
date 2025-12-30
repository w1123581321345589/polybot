import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Calculator,
  TrendingUp,
  Zap,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  AlertTriangle,
} from "lucide-react";
import type { KellyResult, SpikeEvent, ArbitrageOpportunity } from "@shared/schema";

export default function TradingTools() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">Trading Tools</h1>
        <p className="text-muted-foreground">Advanced tools for optimized trading</p>
      </div>

      <Tabs defaultValue="kelly" className="space-y-4">
        <TabsList>
          <TabsTrigger value="kelly" data-testid="tab-kelly">
            <Calculator className="w-4 h-4 mr-2" />
            Kelly Calculator
          </TabsTrigger>
          <TabsTrigger value="spikes" data-testid="tab-spikes">
            <Zap className="w-4 h-4 mr-2" />
            Spike Scanner
          </TabsTrigger>
          <TabsTrigger value="arbitrage" data-testid="tab-arbitrage">
            <TrendingUp className="w-4 h-4 mr-2" />
            Arbitrage Scanner
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kelly">
          <KellyCalculatorPanel />
        </TabsContent>

        <TabsContent value="spikes">
          <SpikeScannerPanel />
        </TabsContent>

        <TabsContent value="arbitrage">
          <ArbitrageScannerPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KellyCalculatorPanel() {
  const [currentPrice, setCurrentPrice] = useState("0.45");
  const [estimatedProb, setEstimatedProb] = useState("0.55");
  const [bankroll, setBankroll] = useState("10000");
  const [kellyFraction, setKellyFraction] = useState("0.5");
  const [result, setResult] = useState<KellyResult | null>(null);
  const { toast } = useToast();

  const calculateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/trading/kelly", {
        currentPrice: parseFloat(currentPrice),
        estimatedProbability: parseFloat(estimatedProb),
        bankroll: parseFloat(bankroll),
        kellyFraction: parseFloat(kellyFraction),
        maxPositionPercent: 0.05,
      });
      return res.json();
    },
    onSuccess: (data: KellyResult) => {
      setResult(data);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to calculate", variant: "destructive" });
    },
  });

  const edge = parseFloat(estimatedProb) - parseFloat(currentPrice);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Kelly Criterion Calculator
          </CardTitle>
          <CardDescription>
            Calculate optimal position size based on your edge
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Market Price</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                max="0.99"
                value={currentPrice}
                onChange={(e) => setCurrentPrice(e.target.value)}
                data-testid="input-market-price"
              />
            </div>
            <div className="space-y-2">
              <Label>Your Probability Estimate</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                max="0.99"
                value={estimatedProb}
                onChange={(e) => setEstimatedProb(e.target.value)}
                data-testid="input-estimated-prob"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Bankroll ($)</Label>
              <Input
                type="number"
                min="100"
                value={bankroll}
                onChange={(e) => setBankroll(e.target.value)}
                data-testid="input-bankroll"
              />
            </div>
            <div className="space-y-2">
              <Label>Kelly Fraction (0.25-1.0)</Label>
              <Input
                type="number"
                step="0.05"
                min="0.1"
                max="1"
                value={kellyFraction}
                onChange={(e) => setKellyFraction(e.target.value)}
                data-testid="input-kelly-fraction"
              />
            </div>
          </div>

          <div className="p-3 rounded-md bg-muted">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Calculated Edge:</span>
              <span className={`font-mono font-medium ${edge > 0 ? "text-green-500" : edge < 0 ? "text-red-500" : ""}`}>
                {(edge * 100).toFixed(2)}%
              </span>
            </div>
          </div>

          <Button 
            onClick={() => calculateMutation.mutate()} 
            className="w-full"
            disabled={calculateMutation.isPending}
            data-testid="button-calculate-kelly"
          >
            {calculateMutation.isPending ? "Calculating..." : "Calculate Optimal Position"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
          <CardDescription>Recommended position sizing</CardDescription>
        </CardHeader>
        <CardContent>
          {result ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Position Size</p>
                  <p className="text-2xl font-mono font-bold" data-testid="text-position-size">
                    ${result.positionSize.toFixed(2)}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Kelly Fraction</p>
                  <p className="text-2xl font-mono font-bold">
                    {(result.fraction * 100).toFixed(2)}%
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Edge</p>
                  <p className={`text-xl font-mono font-bold ${result.edge > 0 ? "text-green-500" : "text-red-500"}`}>
                    {(result.edge * 100).toFixed(2)}%
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Confidence</p>
                  <p className="text-xl font-mono font-bold">
                    {(result.confidence * 100).toFixed(0)}%
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center p-4">
                <Badge
                  variant={
                    result.recommendation === "strong_buy" ? "default" :
                    result.recommendation === "buy" ? "secondary" :
                    result.recommendation === "avoid" ? "destructive" : "outline"
                  }
                  className="text-lg px-4 py-2"
                  data-testid="badge-recommendation"
                >
                  {result.recommendation.replace("_", " ").toUpperCase()}
                </Badge>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <Target className="w-12 h-12 mb-2 opacity-50" />
              <p>Enter values and calculate to see results</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SpikeScannerPanel() {
  const { toast } = useToast();
  
  const { data: spikes, isLoading: spikesLoading } = useQuery<SpikeEvent[]>({
    queryKey: ["/api/trading/spikes"],
    refetchInterval: 5000,
  });

  const scanMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/trading/spikes/scan", {
        spikeThreshold: 0.02,
        positionSize: 5,
        takeProfitPercent: 0.03,
        stopLossPercent: 0.02,
        cooldownMs: 30000,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trading/spikes"] });
      toast({
        title: "Scan Complete",
        description: `Found ${data.spikes.length} spikes in ${data.scannedMarkets} markets`,
      });
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Spike Hunter
            </CardTitle>
            <CardDescription>
              Detect rapid price movements for mean-reversion trades
            </CardDescription>
          </div>
          <Button
            onClick={() => scanMutation.mutate()}
            disabled={scanMutation.isPending}
            data-testid="button-scan-spikes"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${scanMutation.isPending ? "animate-spin" : ""}`} />
            Scan Now
          </Button>
        </CardHeader>
        <CardContent>
          {spikesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : spikes && spikes.length > 0 ? (
            <div className="space-y-3">
              {spikes.map((spike) => (
                <div
                  key={spike.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card"
                  data-testid={`spike-event-${spike.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{spike.marketQuestion || spike.marketId}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={spike.direction === "up" ? "default" : "secondary"}>
                        {spike.direction === "up" ? (
                          <ArrowUpRight className="w-3 h-3 mr-1" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3 mr-1" />
                        )}
                        {spike.direction.toUpperCase()}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(spike.detectedAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-mono text-lg font-bold ${spike.direction === "up" ? "text-green-500" : "text-red-500"}`}>
                      {spike.priceChangePercent > 0 ? "+" : ""}{(spike.priceChangePercent * 100).toFixed(2)}%
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ${spike.previousPrice.toFixed(2)} → ${spike.currentPrice.toFixed(2)}
                    </p>
                  </div>
                  <div className="ml-4">
                    <Badge
                      variant={
                        spike.suggestedAction === "buy_yes" ? "default" :
                        spike.suggestedAction === "buy_no" ? "secondary" : "outline"
                      }
                    >
                      {spike.suggestedAction.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Zap className="w-8 h-8 mb-2 opacity-50" />
              <p>No spikes detected recently</p>
              <p className="text-sm">Click "Scan Now" to check for price movements</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ArbitrageScannerPanel() {
  const { toast } = useToast();

  const { data: opportunities, isLoading } = useQuery<ArbitrageOpportunity[]>({
    queryKey: ["/api/trading/arbitrage"],
    refetchInterval: 10000,
  });

  const scanMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/trading/arbitrage/scan", {});
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trading/arbitrage"] });
      toast({
        title: "Scan Complete",
        description: `Found ${data.total} opportunities in ${data.scannedMarkets} markets`,
      });
    },
  });

  const executeMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/trading/arbitrage/${id}/execute`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trading/arbitrage"] });
      toast({ title: "Executed", description: "Arbitrage opportunity executed" });
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Arbitrage Scanner
            </CardTitle>
            <CardDescription>
              Find mispriced markets where YES + NO {"<"} $1.00
            </CardDescription>
          </div>
          <Button
            onClick={() => scanMutation.mutate()}
            disabled={scanMutation.isPending}
            data-testid="button-scan-arbitrage"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${scanMutation.isPending ? "animate-spin" : ""}`} />
            Scan Markets
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : opportunities && opportunities.length > 0 ? (
            <div className="space-y-3">
              {opportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="p-4 rounded-lg border bg-card"
                  data-testid={`arbitrage-opp-${opp.id}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{opp.type.replace("_", " ")}</Badge>
                        <Badge variant={opp.status === "active" ? "default" : "secondary"}>
                          {opp.status}
                        </Badge>
                      </div>
                      <p className="mt-2 font-medium">{opp.market1.question}</p>
                      <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Total Cost</p>
                          <p className="font-mono font-medium">${opp.totalCost.toFixed(4)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Profit</p>
                          <p className="font-mono font-medium text-green-500">
                            ${opp.profit.toFixed(4)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Return</p>
                          <p className="font-mono font-medium text-green-500">
                            +{opp.profitPercent.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => executeMutation.mutate(opp.id)}
                      disabled={opp.status !== "active" || executeMutation.isPending}
                      data-testid={`button-execute-${opp.id}`}
                    >
                      Execute
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <AlertTriangle className="w-8 h-8 mb-2 opacity-50" />
              <p>No arbitrage opportunities found</p>
              <p className="text-sm">Markets are efficiently priced</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
