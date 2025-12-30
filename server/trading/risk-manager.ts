import type { RiskMetrics, RiskLimits, Position, Trade } from "@shared/schema";

export class RiskManager {
  private limits: RiskLimits = {
    maxTotalExposure: 0.25,
    maxPositionSize: 0.05,
    maxDailyLoss: 0.10,
    maxCorrelation: 0.7,
    stopLossDefault: 0.15,
    takeProfitDefault: 0.20
  };

  private dailyPnL = 0;
  private peakEquity = 0;
  private currentEquity = 0;
  private tradingHalted = false;

  setLimits(limits: Partial<RiskLimits>): void {
    this.limits = { ...this.limits, ...limits };
  }

  getLimits(): RiskLimits {
    return { ...this.limits };
  }

  updateEquity(equity: number): void {
    this.currentEquity = equity;
    if (equity > this.peakEquity) {
      this.peakEquity = equity;
    }
  }

  recordTrade(trade: Trade): void {
    this.dailyPnL += trade.profitLoss;

    if (this.currentEquity > 0 && Math.abs(this.dailyPnL) / this.currentEquity >= this.limits.maxDailyLoss) {
      this.tradingHalted = true;
    }
  }

  resetDailyPnL(): void {
    this.dailyPnL = 0;
    this.tradingHalted = false;
  }

  isTradingAllowed(): boolean {
    return !this.tradingHalted;
  }

  calculateMetrics(positions: Position[], bankroll: number): RiskMetrics {
    const totalExposure = positions.reduce((sum, p) => sum + (p.entryPrice * p.quantity), 0);
    const exposurePercent = bankroll > 0 ? totalExposure / bankroll : 0;

    const largestPosition = positions.length > 0
      ? Math.max(...positions.map(p => p.entryPrice * p.quantity))
      : 0;

    const currentDrawdown = this.peakEquity > 0
      ? (this.peakEquity - this.currentEquity) / this.peakEquity
      : 0;

    const portfolioHeat = this.calculatePortfolioHeat(positions, bankroll);
    const correlationRisk = this.estimateCorrelationRisk(positions);

    const stdDev = this.estimateStdDev(positions);
    const valueAtRisk = totalExposure * stdDev * 1.65;

    let riskScore: RiskMetrics["riskScore"];
    if (exposurePercent > 0.4 || currentDrawdown > 0.2) {
      riskScore = "critical";
    } else if (exposurePercent > 0.25 || currentDrawdown > 0.1) {
      riskScore = "high";
    } else if (exposurePercent > 0.15 || currentDrawdown > 0.05) {
      riskScore = "medium";
    } else {
      riskScore = "low";
    }

    return {
      totalExposure,
      exposurePercent: exposurePercent * 100,
      largestPosition,
      portfolioHeat,
      correlationRisk,
      valueAtRisk,
      maxDrawdown: currentDrawdown * 100,
      currentDrawdown: currentDrawdown * 100,
      riskScore
    };
  }

  private calculatePortfolioHeat(positions: Position[], bankroll: number): number {
    if (positions.length === 0 || bankroll === 0) return 0;

    let heat = 0;
    for (const pos of positions) {
      const positionValue = pos.entryPrice * pos.quantity;
      const riskAmount = positionValue * (pos.stopLoss ? (pos.entryPrice - pos.stopLoss) / pos.entryPrice : this.limits.stopLossDefault);
      heat += riskAmount / bankroll;
    }

    return heat * 100;
  }

  private estimateCorrelationRisk(positions: Position[]): number {
    if (positions.length < 2) return 0;

    const marketTypes = new Map<string, number>();
    for (const pos of positions) {
      const type = this.classifyMarket(pos.marketQuestion);
      marketTypes.set(type, (marketTypes.get(type) || 0) + 1);
    }

    const maxConcentration = Math.max(...Array.from(marketTypes.values()));
    return (maxConcentration / positions.length) * 100;
  }

  private classifyMarket(question: string): string {
    const q = question.toLowerCase();
    if (q.includes("bitcoin") || q.includes("btc") || q.includes("ethereum") || q.includes("crypto")) {
      return "crypto";
    }
    if (q.includes("trump") || q.includes("biden") || q.includes("election") || q.includes("president")) {
      return "politics";
    }
    if (q.includes("stock") || q.includes("nvidia") || q.includes("tesla") || q.includes("apple")) {
      return "stocks";
    }
    if (q.includes("nfl") || q.includes("nba") || q.includes("super bowl")) {
      return "sports";
    }
    return "other";
  }

  private estimateStdDev(positions: Position[]): number {
    if (positions.length === 0) return 0.1;

    const returns = positions.map(p => (p.currentPrice - p.entryPrice) / p.entryPrice);
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance) || 0.1;
  }

  validatePosition(positionSize: number, bankroll: number, existingPositions: Position[]): { 
    allowed: boolean; 
    reason?: string;
    adjustedSize?: number;
  } {
    if (this.tradingHalted) {
      return { allowed: false, reason: "Trading halted due to daily loss limit" };
    }

    const currentExposure = existingPositions.reduce((sum, p) => sum + (p.entryPrice * p.quantity), 0);
    const newExposure = currentExposure + positionSize;
    const exposurePercent = newExposure / bankroll;

    if (exposurePercent > this.limits.maxTotalExposure) {
      const maxAllowed = (this.limits.maxTotalExposure * bankroll) - currentExposure;
      if (maxAllowed <= 0) {
        return { allowed: false, reason: "Maximum exposure limit reached" };
      }
      return { 
        allowed: true, 
        reason: "Position size reduced to stay within exposure limits",
        adjustedSize: maxAllowed
      };
    }

    const positionPercent = positionSize / bankroll;
    if (positionPercent > this.limits.maxPositionSize) {
      return {
        allowed: true,
        reason: "Position size reduced to maximum allowed",
        adjustedSize: bankroll * this.limits.maxPositionSize
      };
    }

    return { allowed: true };
  }

  calculateStopLoss(entryPrice: number, customPercent?: number): number {
    const percent = customPercent || this.limits.stopLossDefault;
    return entryPrice * (1 - percent);
  }

  calculateTakeProfit(entryPrice: number, customPercent?: number): number {
    const percent = customPercent || this.limits.takeProfitDefault;
    return entryPrice * (1 + percent);
  }

  shouldTriggerStopLoss(position: Position): boolean {
    if (!position.stopLoss) return false;
    return position.currentPrice <= position.stopLoss;
  }

  shouldTriggerTakeProfit(position: Position): boolean {
    if (!position.takeProfit) return false;
    return position.currentPrice >= position.takeProfit;
  }

  getDailyPnL(): number {
    return this.dailyPnL;
  }
}

export const riskManager = new RiskManager();
