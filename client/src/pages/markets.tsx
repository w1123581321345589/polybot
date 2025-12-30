import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MarketTable } from "@/components/market-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, RefreshCw, TrendingUp, Zap } from "lucide-react";
import type { Market } from "@shared/schema";

export default function Markets() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"volume" | "arbitrage" | "liquidity">("arbitrage");

  const { data: markets, isLoading, refetch, isFetching } = useQuery<Market[]>({
    queryKey: ["/api/markets"],
    refetchInterval: 30000,
  });

  const filteredMarkets = (markets ?? [])
    .filter((market) =>
      market.question.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "volume") return b.volume - a.volume;
      if (sortBy === "liquidity") return b.liquidity - a.liquidity;
      return b.arbitrageOpportunity - a.arbitrageOpportunity;
    });

  const arbitrageOpportunities = filteredMarkets.filter(
    (m) => m.arbitrageOpportunity > 0.005
  ).length;

  return (
    <div className="p-6 space-y-6" data-testid="page-markets">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Markets</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse Polymarket prediction markets and find opportunities
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
          data-testid="button-refresh-markets"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Markets
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono" data-testid="text-total-markets">
              {markets?.length ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Markets
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono" data-testid="text-active-markets">
              {markets?.filter((m) => m.active).length ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Arbitrage Opportunities
            </CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span
                className={`text-2xl font-bold font-mono ${
                  arbitrageOpportunities > 0
                    ? "text-green-600 dark:text-green-400"
                    : ""
                }`}
                data-testid="text-arb-opportunities"
              >
                {arbitrageOpportunities}
              </span>
              {arbitrageOpportunities > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                >
                  Available
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search markets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-markets"
          />
        </div>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-[180px]" data-testid="select-sort-markets">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="arbitrage">Arbitrage Opportunity</SelectItem>
            <SelectItem value="volume">Volume</SelectItem>
            <SelectItem value="liquidity">Liquidity</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <MarketTable markets={filteredMarkets} isLoading={isLoading} showArbitrage />
    </div>
  );
}
