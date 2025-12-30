import type { ArbitrageOpportunity, Market, CrossPlatformPrice } from "@shared/schema";

export class ArbitrageScanner {
  private opportunities: ArbitrageOpportunity[] = [];
  private readonly TRANSACTION_FEE = 0.02;

  scanBinaryArbitrage(markets: Market[]): ArbitrageOpportunity[] {
    const newOpportunities: ArbitrageOpportunity[] = [];

    for (const market of markets) {
      if (market.outcomes.length !== 2) continue;

      const yesPrice = market.outcomePrices[0];
      const noPrice = market.outcomePrices[1];
      const totalCost = yesPrice + noPrice;

      const netCost = totalCost + this.TRANSACTION_FEE;
      if (netCost < 1) {
        const profit = 1 - netCost;
        const profitPercent = (profit / netCost) * 100;

        const opportunity: ArbitrageOpportunity = {
          id: `arb-${market.id}-${Date.now()}`,
          type: "binary",
          market1: {
            id: market.id,
            question: market.question,
            price: yesPrice,
            platform: "polymarket"
          },
          market2: {
            id: market.id,
            question: `${market.question} (NO)`,
            price: noPrice,
            platform: "polymarket"
          },
          totalCost: netCost,
          guaranteedPayout: 1,
          profit,
          profitPercent,
          detectedAt: new Date().toISOString(),
          status: "active"
        };

        newOpportunities.push(opportunity);
      }
    }

    this.opportunities = [
      ...newOpportunities,
      ...this.opportunities.filter(o => 
        Date.now() - new Date(o.detectedAt).getTime() < 300000
      )
    ].slice(0, 50);

    return newOpportunities;
  }

  scanMultiMarketArbitrage(markets: Market[]): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = [];
    const marketGroups = this.groupSimilarMarkets(markets);

    for (const group of marketGroups) {
      if (group.length < 2) continue;

      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const m1 = group[i];
          const m2 = group[j];

          const m1YesPrice = m1.outcomePrices[0];
          const m2NoPrice = m2.outcomePrices[1];

          if (m1YesPrice + m2NoPrice < 0.98) {
            opportunities.push({
              id: `multi-${m1.id}-${m2.id}-${Date.now()}`,
              type: "multi_market",
              market1: { id: m1.id, question: m1.question, price: m1YesPrice, platform: "polymarket" },
              market2: { id: m2.id, question: m2.question, price: m2NoPrice, platform: "polymarket" },
              totalCost: m1YesPrice + m2NoPrice,
              guaranteedPayout: 1,
              profit: 1 - (m1YesPrice + m2NoPrice) - this.TRANSACTION_FEE,
              profitPercent: ((1 - m1YesPrice - m2NoPrice) / (m1YesPrice + m2NoPrice)) * 100,
              detectedAt: new Date().toISOString(),
              status: "active"
            });
          }
        }
      }
    }

    return opportunities;
  }

  private groupSimilarMarkets(markets: Market[]): Market[][] {
    const groups: Map<string, Market[]> = new Map();

    for (const market of markets) {
      const keywords = this.extractKeywords(market.question);
      const key = keywords.slice(0, 3).join("-");

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(market);
    }

    return Array.from(groups.values()).filter(g => g.length >= 2);
  }

  private extractKeywords(text: string): string[] {
    const stopWords = new Set(["will", "the", "a", "an", "in", "on", "at", "by", "to", "of", "for"]);
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w))
      .slice(0, 5);
  }

  simulateCrossPlatformPrices(markets: Market[]): CrossPlatformPrice[] {
    return markets.slice(0, 10).map(market => {
      const polyPrice = market.outcomePrices[0];
      const kalshiPrice = polyPrice + (Math.random() - 0.5) * 0.08;
      const clampedKalshi = Math.max(0.01, Math.min(0.99, kalshiPrice));
      const diff = Math.abs(polyPrice - clampedKalshi);

      return {
        marketDescription: market.question,
        polymarketPrice: polyPrice,
        kalshiPrice: clampedKalshi,
        priceDifference: diff,
        arbitrageAvailable: diff > 0.03,
        lastUpdated: new Date().toISOString()
      };
    });
  }

  getActiveOpportunities(): ArbitrageOpportunity[] {
    return this.opportunities.filter(o => o.status === "active");
  }

  markExecuted(opportunityId: string): void {
    const opp = this.opportunities.find(o => o.id === opportunityId);
    if (opp) {
      opp.status = "executed";
    }
  }
}

export const arbitrageScanner = new ArbitrageScanner();
