import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { BotCard } from "@/components/bot-card";
import { CreateBotDialog } from "@/components/create-bot-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Bot } from "lucide-react";
import type { BotConfig } from "@shared/schema";

export default function Bots() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: bots, isLoading } = useQuery<BotConfig[]>({
    queryKey: ["/api/bots"],
  });

  const createBotMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/bots", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bots"] });
      setCreateDialogOpen(false);
      toast({
        title: "Bot created",
        description: "Your new trading bot has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create bot",
        variant: "destructive",
      });
    },
  });

  const toggleBotMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "start" | "pause" | "stop" }) => {
      return apiRequest("POST", `/api/bots/${id}/${action}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bots"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update bot",
        variant: "destructive",
      });
    },
  });

  const deleteBotMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/bots/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bots"] });
      setDeleteConfirmId(null);
      toast({
        title: "Bot deleted",
        description: "The bot has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete bot",
        variant: "destructive",
      });
    },
  });

  const handleStart = (id: string) => {
    toggleBotMutation.mutate({ id, action: "start" });
  };

  const handlePause = (id: string) => {
    toggleBotMutation.mutate({ id, action: "pause" });
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      deleteBotMutation.mutate(deleteConfirmId);
    }
  };

  const activeBots = (bots ?? []).filter((b) => b.status === "active").length;
  const pausedBots = (bots ?? []).filter((b) => b.status === "paused").length;

  return (
    <div className="p-6 space-y-6" data-testid="page-bots">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Trading Bots</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure and manage your automated trading strategies
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-bot">
          <Plus className="h-4 w-4 mr-2" />
          Create Bot
        </Button>
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>
          <span className="font-medium text-foreground">{bots?.length ?? 0}</span> total
        </span>
        <span>
          <span className="font-medium text-green-600 dark:text-green-400">{activeBots}</span> active
        </span>
        <span>
          <span className="font-medium text-amber-600 dark:text-amber-400">{pausedBots}</span> paused
        </span>
      </div>

      {isLoading ? (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-[320px]" />
          ))}
        </div>
      ) : (bots ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <Bot className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold mb-1">No bots yet</h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            Create your first trading bot to start automating your Polymarket strategies.
          </p>
          <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-first-bot">
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Bot
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {(bots ?? []).map((bot) => (
            <BotCard
              key={bot.id}
              bot={bot}
              onStart={handleStart}
              onPause={handlePause}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <CreateBotDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={(data) => createBotMutation.mutate(data)}
        isPending={createBotMutation.isPending}
      />

      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bot</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this bot? This action cannot be undone.
              All associated trade history will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
