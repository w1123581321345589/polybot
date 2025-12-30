import type { SpikeEvent, PricePoint, Market, SpikeSettings } from "@shared/schema";

export class SpikeDetector {
  private priceHistory: Map<string, PricePoint[]> = new Map();
  private cooldowns: Map<string, number> = new Map();
  private detectedSpikes: SpikeEvent[] = [];

  constructor(private defaultWindowSize = 30) {}

  recordPrice(marketId: string, price: number, volume?: number): void {
    const history = this.priceHistory.get(marketId) || [];
    history.push({
      marketId,
      price,
      timestamp: Date.now(),
      volume
    });

    if (history.length > this.defaultWindowSize) {
      history.shift();
    }

    this.priceHistory.set(marketId, history);
  }

  detectSpike(marketId: string, settings: SpikeSettings): SpikeEvent | null {
    const history = this.priceHistory.get(marketId);
    if (!history || history.length < 3) {
      return null;
    }

    const cooldownEnd = this.cooldowns.get(marketId) || 0;
    if (Date.now() < cooldownEnd) {
      return null;
    }

    const currentPrice = history[history.length - 1].price;
    const recentPrices = history.slice(-Math.min(5, history.length));
    const avgRecentPrice = recentPrices.slice(0, -1).reduce((sum, p) => sum + p.price, 0) / (recentPrices.length - 1);
    
    const priceChange = currentPrice - avgRecentPrice;
    const priceChangePercent = Math.abs(priceChange / avgRecentPrice);

    if (priceChangePercent < settings.spikeThreshold) {
      return null;
    }

    const direction = priceChange > 0 ? "up" : "down";
    const confidence = Math.min(priceChangePercent / (settings.spikeThreshold * 2), 1);

    let suggestedAction: SpikeEvent["suggestedAction"] = "wait";
    if (direction === "up" && confidence > 0.6) {
      suggestedAction = "buy_no";
    } else if (direction === "down" && confidence > 0.6) {
      suggestedAction = "buy_yes";
    }

    const spike: SpikeEvent = {
      id: `spike-${marketId}-${Date.now()}`,
      marketId,
      marketQuestion: "",
      priceChange,
      priceChangePercent,
      direction,
      previousPrice: avgRecentPrice,
      currentPrice,
      volume: history[history.length - 1].volume || 0,
      detectedAt: new Date().toISOString(),
      confidence,
      suggestedAction
    };

    this.detectedSpikes.push(spike);
    if (this.detectedSpikes.length > 100) {
      this.detectedSpikes.shift();
    }

    this.cooldowns.set(marketId, Date.now() + settings.cooldownMs);

    return spike;
  }

  analyzeMarkets(markets: Market[], settings: SpikeSettings): SpikeEvent[] {
    const spikes: SpikeEvent[] = [];

    for (const market of markets) {
      const yesPrice = market.outcomePrices[0];
      this.recordPrice(market.id, yesPrice, market.volume);

      const spike = this.detectSpike(market.id, settings);
      if (spike) {
        spike.marketQuestion = market.question;
        spikes.push(spike);
      }
    }

    return spikes;
  }

  getRecentSpikes(limit = 20): SpikeEvent[] {
    return this.detectedSpikes.slice(-limit).reverse();
  }

  getPriceHistory(marketId: string): PricePoint[] {
    return this.priceHistory.get(marketId) || [];
  }

  clearHistory(): void {
    this.priceHistory.clear();
    this.cooldowns.clear();
    this.detectedSpikes = [];
  }
}

export const spikeDetector = new SpikeDetector();
