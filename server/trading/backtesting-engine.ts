import type { BacktestConfig, BacktestResult, BacktestTrade, Market } from "@shared/schema";

export class BacktestingEngine {
  private results: BacktestResult[] = [];

  async runBacktest(config: BacktestConfig, historicalData: Market[][]): Promise<BacktestResult> {
    const trades: BacktestTrade[] = [];
    let equity = config.initialCapital;
    const equityCurve: Array<{ date: string; equity: number }> = [];
    let peakEquity = equity;
    let maxDrawdown = 0;

    for (let i = 1; i < historicalData.length; i++) {
      const prevMarkets = historicalData[i - 1];
      const currMarkets = historicalData[i];
      const date = new Date(Date.now() - (historicalData.length - i) * 86400000).toISOString().split("T")[0];

      const dayTrades = this.simulateTrades(config, prevMarkets, currMarkets, equity);
      
      for (const trade of dayTrades) {
        equity += trade.profitLoss;
        trades.push(trade);
      }

      equityCurve.push({ date, equity });

      if (equity > peakEquity) {
        peakEquity = equity;
      }
      const currentDrawdown = (peakEquity - equity) / peakEquity;
      if (currentDrawdown > maxDrawdown) {
        maxDrawdown = currentDrawdown;
      }
    }

    const wins = trades.filter(t => t.profitLoss > 0);
    const losses = trades.filter(t => t.profitLoss <= 0);
    const totalProfit = wins.reduce((sum, t) => sum + t.profitLoss, 0);
    const totalLoss = Math.abs(losses.reduce((sum, t) => sum + t.profitLoss, 0));

    const returns = trades.map(t => t.profitLossPercent);
    const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
    const stdReturn = returns.length > 1 
      ? Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / (returns.length - 1))
      : 0;
    const sharpeRatio = stdReturn > 0 ? (avgReturn / stdReturn) * Math.sqrt(252) : 0;

    const result: BacktestResult = {
      id: `backtest-${Date.now()}`,
      config,
      totalReturn: equity - config.initialCapital,
      totalReturnPercent: ((equity - config.initialCapital) / config.initialCapital) * 100,
      maxDrawdown: maxDrawdown * 100,
      sharpeRatio,
      winRate: trades.length > 0 ? (wins.length / trades.length) * 100 : 0,
      totalTrades: trades.length,
      profitFactor: totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0,
      equityCurve,
      trades,
      runAt: new Date().toISOString()
    };

    this.results.push(result);
    if (this.results.length > 20) {
      this.results.shift();
    }

    return result;
  }

  private simulateTrades(
    config: BacktestConfig,
    prevMarkets: Market[],
    currMarkets: Market[],
    equity: number
  ): BacktestTrade[] {
    const trades: BacktestTrade[] = [];
    const positionSize = equity * (config.settings.positionPercent || 0.02);

    switch (config.strategy) {
      case "spike":
        trades.push(...this.simulateSpikeTrades(prevMarkets, currMarkets, positionSize, config.settings));
        break;
      case "arbitrage":
        trades.push(...this.simulateArbitrageTrades(currMarkets, positionSize, config.settings));
        break;
      case "kelly":
        trades.push(...this.simulateKellyTrades(prevMarkets, currMarkets, equity, config.settings));
        break;
      default:
        break;
    }

    return trades;
  }

  private simulateSpikeTrades(
    prevMarkets: Market[],
    currMarkets: Market[],
    positionSize: number,
    settings: Record<string, any>
  ): BacktestTrade[] {
    const trades: BacktestTrade[] = [];
    const spikeThreshold = settings.spikeThreshold || 0.02;

    for (const curr of currMarkets) {
      const prev = prevMarkets.find(m => m.id === curr.id);
      if (!prev) continue;

      const priceChange = Math.abs(curr.outcomePrices[0] - prev.outcomePrices[0]);
      const priceChangePercent = priceChange / prev.outcomePrices[0];

      if (priceChangePercent > spikeThreshold) {
        const entryPrice = curr.outcomePrices[0];
        const reversionAmount = priceChange * 0.5;
        const exitPrice = curr.outcomePrices[0] > prev.outcomePrices[0]
          ? entryPrice - reversionAmount
          : entryPrice + reversionAmount;

        const quantity = positionSize / entryPrice;
        const profitLoss = quantity * (exitPrice - entryPrice) * (curr.outcomePrices[0] > prev.outcomePrices[0] ? -1 : 1);

        trades.push({
          entryDate: new Date().toISOString(),
          exitDate: new Date().toISOString(),
          marketId: curr.id,
          side: curr.outcomePrices[0] > prev.outcomePrices[0] ? "NO" : "YES",
          entryPrice,
          exitPrice,
          quantity,
          profitLoss,
          profitLossPercent: (profitLoss / positionSize) * 100
        });
      }
    }

    return trades;
  }

  private simulateArbitrageTrades(
    markets: Market[],
    positionSize: number,
    settings: Record<string, any>
  ): BacktestTrade[] {
    const trades: BacktestTrade[] = [];
    const minProfit = settings.minProfit || 0.02;

    for (const market of markets) {
      const totalCost = market.outcomePrices[0] + market.outcomePrices[1];
      if (totalCost < 1 - minProfit) {
        const profit = (1 - totalCost) * positionSize;
        trades.push({
          entryDate: new Date().toISOString(),
          exitDate: new Date().toISOString(),
          marketId: market.id,
          side: "YES",
          entryPrice: totalCost,
          exitPrice: 1,
          quantity: positionSize / totalCost,
          profitLoss: profit,
          profitLossPercent: ((1 - totalCost) / totalCost) * 100
        });
      }
    }

    return trades;
  }

  private simulateKellyTrades(
    prevMarkets: Market[],
    currMarkets: Market[],
    equity: number,
    settings: Record<string, any>
  ): BacktestTrade[] {
    const trades: BacktestTrade[] = [];
    const kellyFraction = settings.kellyFraction || 0.5;

    for (const curr of currMarkets) {
      const estimatedProb = 0.5 + (Math.random() - 0.5) * 0.3;
      const currentPrice = curr.outcomePrices[0];
      const edge = estimatedProb - currentPrice;

      if (edge > 0.05) {
        const fraction = Math.min((edge / currentPrice) * kellyFraction, 0.05);
        const positionSize = equity * fraction;
        
        const outcomeWin = Math.random() < estimatedProb;
        const profitLoss = outcomeWin ? positionSize * (1 / currentPrice - 1) : -positionSize;

        trades.push({
          entryDate: new Date().toISOString(),
          exitDate: new Date().toISOString(),
          marketId: curr.id,
          side: "YES",
          entryPrice: currentPrice,
          exitPrice: outcomeWin ? 1 : 0,
          quantity: positionSize / currentPrice,
          profitLoss,
          profitLossPercent: (profitLoss / positionSize) * 100
        });
      }
    }

    return trades;
  }

  generateMockHistoricalData(markets: Market[], days: number): Market[][] {
    const history: Market[][] = [];

    for (let d = 0; d < days; d++) {
      const dayMarkets = markets.map(m => ({
        ...m,
        outcomePrices: m.outcomePrices.map(p => {
          const change = (Math.random() - 0.5) * 0.1;
          return Math.max(0.01, Math.min(0.99, p + change));
        }),
        volume: m.volume * (0.5 + Math.random())
      }));
      history.push(dayMarkets);
    }

    return history;
  }

  getResults(): BacktestResult[] {
    return this.results;
  }

  getResult(id: string): BacktestResult | undefined {
    return this.results.find(r => r.id === id);
  }
}

export const backtestingEngine = new BacktestingEngine();
