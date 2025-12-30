import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { History, CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react";
import type { ExecutionLog as ExecutionLogType } from "@shared/schema";

interface ExecutionLogProps {
  logs: ExecutionLogType[];
  isLoading?: boolean;
  maxHeight?: string;
}

export function ExecutionLog({
  logs,
  isLoading = false,
  maxHeight = "400px",
}: ExecutionLogProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getStatusIcon = (status: ExecutionLogType["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case "info":
        return <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getStatusBadgeClass = (status: ExecutionLogType["status"]) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "warning":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case "error":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "info":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    }
  };

  if (isLoading) {
    return (
      <Card data-testid="card-execution-log">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Execution Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-4 w-4 rounded-full mt-1" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-execution-log">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Execution Log
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea style={{ height: maxHeight }}>
          <div className="p-4 pt-0">
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <History className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No executions yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Start a bot to see activity here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log, index) => {
                  const showDate =
                    index === 0 ||
                    formatDate(log.timestamp) !== formatDate(logs[index - 1].timestamp);

                  return (
                    <div key={log.id}>
                      {showDate && (
                        <div className="flex items-center gap-2 mb-3">
                          <div className="h-px flex-1 bg-border" />
                          <span className="text-xs text-muted-foreground font-medium">
                            {formatDate(log.timestamp)}
                          </span>
                          <div className="h-px flex-1 bg-border" />
                        </div>
                      )}
                      <div
                        className="flex items-start gap-3 p-2 rounded-md hover-elevate"
                        data-testid={`log-entry-${log.id}`}
                      >
                        <div className="mt-0.5">{getStatusIcon(log.status)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{log.action}</span>
                            <Badge
                              variant="outline"
                              className={`text-xs ${getStatusBadgeClass(log.status)}`}
                            >
                              {log.botName}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                            {log.details}
                          </p>
                          <span className="text-xs text-muted-foreground font-mono mt-1 block">
                            {formatTime(log.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
