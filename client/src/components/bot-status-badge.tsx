import { Badge } from "@/components/ui/badge";
import { Play, Pause, Square, AlertTriangle } from "lucide-react";

interface BotStatusBadgeProps {
  status: "active" | "paused" | "stopped" | "error";
  showIcon?: boolean;
  size?: "sm" | "default";
}

export function BotStatusBadge({ status, showIcon = true, size = "default" }: BotStatusBadgeProps) {
  const config = {
    active: {
      icon: Play,
      label: "Active",
      className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
    },
    paused: {
      icon: Pause,
      label: "Paused",
      className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    },
    stopped: {
      icon: Square,
      label: "Stopped",
      className: "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400 border-gray-200 dark:border-gray-700",
    },
    error: {
      icon: AlertTriangle,
      label: "Error",
      className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
    },
  };

  const { icon: Icon, label, className } = config[status];

  return (
    <Badge
      variant="outline"
      className={`${className} ${size === "sm" ? "text-xs px-1.5 py-0" : ""}`}
      data-testid={`badge-status-${status}`}
    >
      {showIcon && <Icon className={`${size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} mr-1`} />}
      {label}
    </Badge>
  );
}
