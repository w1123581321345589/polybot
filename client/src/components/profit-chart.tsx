import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface ProfitChartProps {
  data: Array<{ date: string; profit: number }>;
  title?: string;
}

export function ProfitChart({ data, title = "Performance" }: ProfitChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const minProfit = Math.min(...data.map((d) => d.profit));
  const maxProfit = Math.max(...data.map((d) => d.profit));
  const isAllPositive = minProfit >= 0;
  const isAllNegative = maxProfit <= 0;

  return (
    <Card data-testid="card-profit-chart">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="profitGradientPositive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(34, 197, 94)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="rgb(34, 197, 94)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="profitGradientNegative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(239, 68, 68)" stopOpacity={0} />
                  <stop offset="100%" stopColor="rgb(239, 68, 68)" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                dy={10}
              />
              <YAxis
                tickFormatter={formatCurrency}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                dx={-10}
                width={70}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const value = payload[0].value as number;
                    return (
                      <div className="rounded-md border bg-popover px-3 py-2 shadow-md">
                        <p className="text-xs text-muted-foreground">
                          {formatDate(payload[0].payload.date)}
                        </p>
                        <p
                          className={`text-sm font-mono font-semibold ${
                            value >= 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {formatCurrency(value)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="profit"
                stroke={isAllNegative ? "rgb(239, 68, 68)" : "rgb(34, 197, 94)"}
                strokeWidth={2}
                fill={
                  isAllPositive
                    ? "url(#profitGradientPositive)"
                    : isAllNegative
                    ? "url(#profitGradientNegative)"
                    : "url(#profitGradientPositive)"
                }
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
