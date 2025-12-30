import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BotStatusBadge } from "./bot-status-badge";
import {
  Play,
  Pause,
  Settings,
  Trash2,
  TrendingUp,
  Target,
  Zap,
  Copy,
  BarChart3,
} from "lucide-react";
import type { BotConfig } from "@shared/schema";

interface BotCardProps {
  bot: BotConfig;
  onStart?: (botId: string) => void;
  onPause?: (botId: string) => void;
  onStop?: (botId: string) => void;
  onConfigure?: (botId: string) => void;
  onDelete?: (botId: string) => void;
}

const botTypeConfig = {
  arbitrage: {
    icon: Zap,
    label: "Arbitrage",
    description: "YES+NO pricing gaps",
  },
  statistical: {
    icon: BarChart3,
    label: "Stat Arb",
    description: "Correlated markets",
  },
  ai: {
    icon: Target,
    label: "AI Model",
    description: "ML predictions",
  },
  spread: {
    icon: TrendingUp,
    label: "Spread",
    description: "Bid/ask farming",
  },
  copy: {
    icon: Copy,
    label: "Copy Trade",
    description: "Mirror whales",
  },
};

export function BotCard({
  bot,
  onStart,
  onPause,
  onStop,
  onConfigure,
  onDelete,
}: BotCardProps) {
  const typeConfig = botTypeConfig[bot.type];
  const TypeIcon = typeConfig.icon;

  const formatCurrency = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}$${Math.abs(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return "Never";
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className="flex flex-col" data-testid={`card-bot-${bot.id}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
              <TypeIcon className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base truncate">{bot.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {typeConfig.label}
                </Badge>
              </div>
            </div>
          </div>
          <BotStatusBadge status={bot.status} />
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        <p className="text-sm text-muted-foreground">{typeConfig.description}</p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              Total P&L
            </p>
            <p
              className={`text-lg font-bold font-mono ${
                bot.totalProfitLoss >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
              data-testid={`text-bot-pnl-${bot.id}`}
            >
              {formatCurrency(bot.totalProfitLoss)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              Win Rate
            </p>
            <p className="text-lg font-bold font-mono" data-testid={`text-bot-winrate-${bot.id}`}>
              {bot.winRate.toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Trades</span>
            <span className="font-mono">{bot.tradeCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last Run</span>
            <span className="font-mono text-xs">{formatTime(bot.lastExecutedAt)}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex items-center gap-2 border-t pt-4">
        {bot.status === "active" ? (
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={() => onPause?.(bot.id)}
            data-testid={`button-pause-bot-${bot.id}`}
          >
            <Pause className="h-4 w-4 mr-1" />
            Pause
          </Button>
        ) : (
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={() => onStart?.(bot.id)}
            data-testid={`button-start-bot-${bot.id}`}
          >
            <Play className="h-4 w-4 mr-1" />
            Start
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onConfigure?.(bot.id)}
          data-testid={`button-configure-bot-${bot.id}`}
        >
          <Settings className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete?.(bot.id)}
          data-testid={`button-delete-bot-${bot.id}`}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </CardFooter>
    </Card>
  );
}
