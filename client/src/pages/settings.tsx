import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import {
  Moon,
  Sun,
  Bell,
  Shield,
  Wallet,
  AlertTriangle,
} from "lucide-react";

export default function Settings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="p-6 space-y-6 max-w-3xl" data-testid="page-settings">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your trading platform preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            Appearance
          </CardTitle>
          <CardDescription>
            Customize how the platform looks and feels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Dark Mode</Label>
              <p className="text-sm text-muted-foreground">
                Switch between light and dark themes
              </p>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              data-testid="switch-dark-mode"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Connection
          </CardTitle>
          <CardDescription>
            Connect your wallet to execute trades on Polymarket
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <Wallet className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">No wallet connected</p>
                <p className="text-sm text-muted-foreground">
                  Connect a wallet to start trading
                </p>
              </div>
            </div>
            <Button variant="outline" data-testid="button-connect-wallet">
              Connect Wallet
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            You'll need to connect a wallet with USDC to execute trades on Polymarket.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Configure how you want to be notified about bot activity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Trade Executions</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when trades are executed
              </p>
            </div>
            <Switch defaultChecked data-testid="switch-notify-trades" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Arbitrage Opportunities</Label>
              <p className="text-sm text-muted-foreground">
                Alert when profitable opportunities are found
              </p>
            </div>
            <Switch defaultChecked data-testid="switch-notify-arb" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Bot Errors</Label>
              <p className="text-sm text-muted-foreground">
                Get alerted if a bot encounters an error
              </p>
            </div>
            <Switch defaultChecked data-testid="switch-notify-errors" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Risk Management
          </CardTitle>
          <CardDescription>
            Set global limits to protect your capital
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="max-daily-loss">Max Daily Loss ($)</Label>
              <Input
                id="max-daily-loss"
                type="number"
                placeholder="500"
                defaultValue="500"
                data-testid="input-max-daily-loss"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-position">Max Single Position ($)</Label>
              <Input
                id="max-position"
                type="number"
                placeholder="1000"
                defaultValue="1000"
                data-testid="input-max-position"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-Stop on Max Loss</Label>
              <p className="text-sm text-muted-foreground">
                Automatically stop all bots if daily loss limit is reached
              </p>
            </div>
            <Switch defaultChecked data-testid="switch-auto-stop" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-amber-200 dark:border-amber-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5" />
            Disclaimer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This platform is for educational purposes only. Trading on prediction markets involves
            significant risk. Past performance does not guarantee future results. Never trade with
            money you cannot afford to lose. You are solely responsible for your trading decisions.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" data-testid="button-reset-settings">
          Reset to Defaults
        </Button>
        <Button data-testid="button-save-settings">Save Settings</Button>
      </div>
    </div>
  );
}
