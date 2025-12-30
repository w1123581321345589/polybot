import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: LucideIcon;
  isCurrency?: boolean;
  isPercentage?: boolean;
  testId?: string;
}

export function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  isCurrency = false,
  isPercentage = false,
  testId,
}: MetricCardProps) {
  const formatValue = () => {
    if (typeof value === "number") {
      if (isCurrency) {
        const formatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(value);
        return formatted;
      }
      if (isPercentage) {
        return `${value.toFixed(1)}%`;
      }
      return value.toLocaleString();
    }
    return value;
  };

  const isPositive = typeof value === "number" && value > 0;
  const isNegative = typeof value === "number" && value < 0;

  const changeIsPositive = change !== undefined && change > 0;
  const changeIsNegative = change !== undefined && change < 0;

  return (
    <Card data-testid={testId}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div
          className={`text-2xl font-bold font-mono ${
            isCurrency
              ? isPositive
                ? "text-green-600 dark:text-green-400"
                : isNegative
                ? "text-red-600 dark:text-red-400"
                : ""
              : ""
          }`}
          data-testid={testId ? `${testId}-value` : undefined}
        >
          {formatValue()}
        </div>
        {change !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            {changeIsPositive ? (
              <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
            ) : changeIsNegative ? (
              <TrendingDown className="h-3 w-3 text-red-600 dark:text-red-400" />
            ) : (
              <Minus className="h-3 w-3 text-muted-foreground" />
            )}
            <span
              className={`text-xs ${
                changeIsPositive
                  ? "text-green-600 dark:text-green-400"
                  : changeIsNegative
                  ? "text-red-600 dark:text-red-400"
                  : "text-muted-foreground"
              }`}
            >
              {changeIsPositive ? "+" : ""}
              {change.toFixed(2)}%{changeLabel ? ` ${changeLabel}` : ""}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
