import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Zap, BarChart3, Target, TrendingUp, Copy, Activity, Newspaper } from "lucide-react";

const createBotSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  type: z.enum(["arbitrage", "statistical", "ai", "spread", "copy", "spike", "news"]),
  threshold: z.number().min(0.001).max(0.2),
  maxPositionSize: z.number().min(1).max(10000),
  pollIntervalMs: z.number().min(500).max(60000),
  autoExecute: z.boolean(),
  spikeThreshold: z.number().min(0.01).max(0.2).optional(),
  takeProfitPercent: z.number().min(0.01).max(0.2).optional(),
  stopLossPercent: z.number().min(0.01).max(0.1).optional(),
  correlationThreshold: z.number().min(0.1).max(1).optional(),
  confidenceThreshold: z.number().min(0.1).max(1).optional(),
});

type CreateBotFormData = z.infer<typeof createBotSchema>;

interface CreateBotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateBotFormData) => void;
  isPending?: boolean;
}

const botTypes = [
  { value: "arbitrage", label: "Arbitrage", icon: Zap, description: "Buy YES+NO when sum < $1" },
  { value: "spike", label: "Spike Hunter", icon: Activity, description: "Trade price spikes for quick reversions" },
  { value: "news", label: "News Intelligence", icon: Newspaper, description: "Trade on news correlations with AI analysis" },
  { value: "statistical", label: "Statistical Arbitrage", icon: BarChart3, description: "Correlated market spreads" },
  { value: "ai", label: "AI Model", icon: Target, description: "ML probability predictions" },
  { value: "spread", label: "Spread Farming", icon: TrendingUp, description: "Bid/ask spread capture" },
  { value: "copy", label: "Copy Trading", icon: Copy, description: "Mirror whale traders" },
];

export function CreateBotDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending = false,
}: CreateBotDialogProps) {
  const form = useForm<CreateBotFormData>({
    resolver: zodResolver(createBotSchema),
    defaultValues: {
      name: "",
      type: "arbitrage",
      threshold: 0.01,
      maxPositionSize: 100,
      pollIntervalMs: 3000,
      autoExecute: false,
      spikeThreshold: 0.02,
      takeProfitPercent: 0.03,
      stopLossPercent: 0.02,
      correlationThreshold: 0.7,
      confidenceThreshold: 0.65,
    },
  });

  const handleSubmit = (data: CreateBotFormData) => {
    let settings: Record<string, any>;
    
    if (data.type === "spike") {
      settings = {
        spikeThreshold: data.spikeThreshold || 0.02,
        positionSize: data.maxPositionSize,
        takeProfitPercent: data.takeProfitPercent || 0.03,
        stopLossPercent: data.stopLossPercent || 0.02,
        pollIntervalMs: data.pollIntervalMs,
        priceHistoryWindow: 20,
        targetMarkets: [],
        autoExecute: data.autoExecute,
        cooldownMs: 30000,
      };
    } else if (data.type === "news") {
      settings = {
        sources: ["reuters", "bloomberg", "coindesk"],
        keywords: [],
        correlationThreshold: data.correlationThreshold || 0.7,
        confidenceThreshold: data.confidenceThreshold || 0.65,
        maxPositionSize: data.maxPositionSize,
        pollIntervalMs: data.pollIntervalMs,
        lookbackHours: 24,
        autoExecute: data.autoExecute,
        categories: ["crypto", "politics", "economics"],
      };
    } else {
      settings = {
        threshold: data.threshold,
        maxPositionSize: data.maxPositionSize,
        pollIntervalMs: data.pollIntervalMs,
        targetMarkets: [],
        autoExecute: data.autoExecute,
      };
    }
    
    onSubmit({
      name: data.name,
      type: data.type,
      settings,
    } as any);
    form.reset();
  };

  const selectedType = form.watch("type");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Bot</DialogTitle>
          <DialogDescription>
            Configure a new trading bot to automate your Polymarket strategy.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bot Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="My Arbitrage Bot"
                      {...field}
                      data-testid="input-bot-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Strategy Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-bot-type">
                        <SelectValue placeholder="Select strategy" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {botTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {botTypes.find((t) => t.value === selectedType)?.description}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedType === "arbitrage" && (
              <>
                <FormField
                  control={form.control}
                  name="threshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Profit Threshold: {(field.value * 100).toFixed(1)}%
                      </FormLabel>
                      <FormControl>
                        <Slider
                          min={0.1}
                          max={10}
                          step={0.1}
                          value={[field.value * 100]}
                          onValueChange={([val]) => field.onChange(val / 100)}
                          data-testid="slider-threshold"
                        />
                      </FormControl>
                      <FormDescription>
                        Minimum spread required to execute trade
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pollIntervalMs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Poll Interval: {(field.value / 1000).toFixed(1)}s</FormLabel>
                      <FormControl>
                        <Slider
                          min={1000}
                          max={60000}
                          step={1000}
                          value={[field.value]}
                          onValueChange={([val]) => field.onChange(val)}
                          data-testid="slider-poll-interval"
                        />
                      </FormControl>
                      <FormDescription>
                        How often to check for opportunities
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {selectedType === "spike" && (
              <>
                <FormField
                  control={form.control}
                  name="spikeThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Spike Threshold: {((field.value || 0.02) * 100).toFixed(1)}%
                      </FormLabel>
                      <FormControl>
                        <Slider
                          min={1}
                          max={20}
                          step={0.5}
                          value={[(field.value || 0.02) * 100]}
                          onValueChange={([val]) => field.onChange(val / 100)}
                          data-testid="slider-spike-threshold"
                        />
                      </FormControl>
                      <FormDescription>
                        Minimum price movement to trigger a trade
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="takeProfitPercent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Take Profit: {((field.value || 0.03) * 100).toFixed(1)}%
                        </FormLabel>
                        <FormControl>
                          <Slider
                            min={1}
                            max={20}
                            step={0.5}
                            value={[(field.value || 0.03) * 100]}
                            onValueChange={([val]) => field.onChange(val / 100)}
                            data-testid="slider-take-profit"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="stopLossPercent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Stop Loss: {((field.value || 0.02) * 100).toFixed(1)}%
                        </FormLabel>
                        <FormControl>
                          <Slider
                            min={1}
                            max={10}
                            step={0.5}
                            value={[(field.value || 0.02) * 100]}
                            onValueChange={([val]) => field.onChange(val / 100)}
                            data-testid="slider-stop-loss"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="pollIntervalMs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Poll Interval: {(field.value / 1000).toFixed(1)}s</FormLabel>
                      <FormControl>
                        <Slider
                          min={500}
                          max={10000}
                          step={500}
                          value={[field.value]}
                          onValueChange={([val]) => field.onChange(val)}
                          data-testid="slider-spike-poll"
                        />
                      </FormControl>
                      <FormDescription>
                        How often to check for price spikes
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {selectedType === "news" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="correlationThreshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Correlation: {((field.value || 0.7) * 100).toFixed(0)}%
                        </FormLabel>
                        <FormControl>
                          <Slider
                            min={10}
                            max={100}
                            step={5}
                            value={[(field.value || 0.7) * 100]}
                            onValueChange={([val]) => field.onChange(val / 100)}
                            data-testid="slider-correlation"
                          />
                        </FormControl>
                        <FormDescription>
                          Min news-market match
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confidenceThreshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Confidence: {((field.value || 0.65) * 100).toFixed(0)}%
                        </FormLabel>
                        <FormControl>
                          <Slider
                            min={10}
                            max={100}
                            step={5}
                            value={[(field.value || 0.65) * 100]}
                            onValueChange={([val]) => field.onChange(val / 100)}
                            data-testid="slider-confidence"
                          />
                        </FormControl>
                        <FormDescription>
                          Min AI confidence
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="pollIntervalMs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scan Interval: {(field.value / 1000 / 60).toFixed(1)} min</FormLabel>
                      <FormControl>
                        <Slider
                          min={60000}
                          max={600000}
                          step={60000}
                          value={[field.value]}
                          onValueChange={([val]) => field.onChange(val)}
                          data-testid="slider-news-poll"
                        />
                      </FormControl>
                      <FormDescription>
                        How often to scan for news
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="maxPositionSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Position Size: ${field.value}</FormLabel>
                  <FormControl>
                    <Slider
                      min={1}
                      max={10000}
                      step={10}
                      value={[field.value]}
                      onValueChange={([val]) => field.onChange(val)}
                      data-testid="slider-max-position"
                    />
                  </FormControl>
                  <FormDescription>
                    Maximum amount to invest per trade
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="autoExecute"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Auto Execute</FormLabel>
                    <FormDescription>
                      Automatically execute trades when opportunities are found
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-auto-execute"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel-create-bot"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} data-testid="button-create-bot">
                {isPending ? "Creating..." : "Create Bot"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
