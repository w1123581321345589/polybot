import type { KellyInput, KellyResult } from "@shared/schema";

export class KellyCriterion {
  private tradeHistory: Array<{ profitLoss: number; capital: number }> = [];
  private lookbackPeriod: number;
  private scalingFactor: number;

  constructor(lookbackPeriod = 40, scalingFactor = 0.5) {
    this.lookbackPeriod = lookbackPeriod;
    this.scalingFactor = scalingFactor;
  }

  addTrade(profitLoss: number, capital: number): void {
    this.tradeHistory.push({ profitLoss, capital });
    if (this.tradeHistory.length > this.lookbackPeriod) {
      this.tradeHistory.shift();
    }
  }

  calculateKelly(input: KellyInput): KellyResult {
    const { currentPrice, estimatedProbability, bankroll, kellyFraction, maxPositionPercent } = input;

    const edge = estimatedProbability - currentPrice;
    
    if (edge <= 0) {
      return {
        fraction: 0,
        positionSize: 0,
        edge,
        confidence: 0,
        recommendation: "avoid"
      };
    }

    const rawKelly = edge / currentPrice;
    const adjustedKelly = rawKelly * kellyFraction;
    const cappedKelly = Math.min(adjustedKelly, maxPositionPercent);
    const positionSize = bankroll * cappedKelly;
    const confidence = Math.min(edge / 0.15, 1);

    let recommendation: KellyResult["recommendation"];
    if (cappedKelly >= 0.04) {
      recommendation = "strong_buy";
    } else if (cappedKelly >= 0.02) {
      recommendation = "buy";
    } else if (cappedKelly > 0) {
      recommendation = "hold";
    } else {
      recommendation = "avoid";
    }

    return {
      fraction: cappedKelly,
      positionSize: Math.round(positionSize * 100) / 100,
      edge,
      confidence,
      recommendation
    };
  }

  calculateHistoricalMetrics(): { winRate: number; avgWin: number; avgLoss: number; expectancy: number } | null {
    if (this.tradeHistory.length < 10) {
      return null;
    }

    const wins = this.tradeHistory.filter(t => t.profitLoss > 0);
    const losses = this.tradeHistory.filter(t => t.profitLoss <= 0);

    const winRate = wins.length / this.tradeHistory.length;
    const avgWin = wins.length > 0 
      ? wins.reduce((sum, t) => sum + t.profitLoss, 0) / wins.length 
      : 0;
    const avgLoss = losses.length > 0 
      ? Math.abs(losses.reduce((sum, t) => sum + t.profitLoss, 0) / losses.length)
      : 0;

    const expectancy = (winRate * avgWin) - ((1 - winRate) * avgLoss);

    return { winRate, avgWin, avgLoss, expectancy };
  }

  calculateOptimalFraction(): number {
    const metrics = this.calculateHistoricalMetrics();
    if (!metrics || metrics.avgLoss === 0) {
      return 0.02;
    }

    const { winRate, avgWin, avgLoss } = metrics;
    const rewardRisk = avgWin / avgLoss;
    const kelly = (winRate * rewardRisk - (1 - winRate)) / rewardRisk;
    
    return Math.max(0, Math.min(kelly * this.scalingFactor, 0.25));
  }
}

export const kellyCalculator = new KellyCriterion();
