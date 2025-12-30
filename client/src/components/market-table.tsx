import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, ExternalLink } from "lucide-react";
import type { Market } from "@shared/schema";

interface MarketTableProps {
  markets: Market[];
  isLoading?: boolean;
  showArbitrage?: boolean;
  onSelectMarket?: (market: Market) => void;
}

export function MarketTable({
  markets,
  isLoading = false,
  showArbitrage = true,
  onSelectMarket,
}: MarketTableProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const formatPrice = (price: number) => {
    return `${(price * 100).toFixed(1)}¢`;
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  if (isLoading) {
    return (
      <Card data-testid="card-markets">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Markets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 flex-1" />
                <Skeleton className="h-12 w-20" />
                <Skeleton className="h-12 w-20" />
                <Skeleton className="h-12 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-markets">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Markets
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Market</TableHead>
              <TableHead className="text-right">YES</TableHead>
              <TableHead className="text-right">NO</TableHead>
              <TableHead className="text-right">Volume</TableHead>
              {showArbitrage && <TableHead className="text-right">Arb</TableHead>}
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {markets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showArbitrage ? 6 : 5} className="text-center py-8">
                  <p className="text-muted-foreground">No markets available</p>
                </TableCell>
              </TableRow>
            ) : (
              markets.map((market) => {
                const yesPrice = market.outcomePrices[0] || 0;
                const noPrice = market.outcomePrices[1] || 0;
                const totalPrice = yesPrice + noPrice;
                const hasArbitrage = totalPrice < 0.99;

                return (
                  <TableRow
                    key={market.id}
                    className="hover-elevate cursor-pointer"
                    onClick={() => onSelectMarket?.(market)}
                    data-testid={`row-market-${market.id}`}
                  >
                    <TableCell className="max-w-[300px]">
                      <div className="space-y-1">
                        <p className="font-medium text-sm line-clamp-2">
                          {market.question}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {market.active ? (
                            <Badge variant="secondary" className="text-xs">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Resolved
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatCurrency(market.liquidity)} liquidity
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono text-sm text-green-600 dark:text-green-400">
                        {formatPrice(yesPrice)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono text-sm text-red-600 dark:text-red-400">
                        {formatPrice(noPrice)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono text-sm text-muted-foreground">
                        {formatCurrency(market.volume)}
                      </span>
                    </TableCell>
                    {showArbitrage && (
                      <TableCell className="text-right">
                        {hasArbitrage ? (
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-mono"
                          >
                            +{formatPercentage(1 - totalPrice)}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground font-mono">
                            {formatPercentage(1 - totalPrice)}
                          </span>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(
                            `https://polymarket.com/event/${market.slug}`,
                            "_blank"
                          );
                        }}
                        data-testid={`button-open-market-${market.id}`}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
