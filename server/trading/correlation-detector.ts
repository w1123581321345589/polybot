import type { 
  NewsArticle, 
  FundamentalAnalysis, 
  NewsMarketCorrelation, 
  NewsSignal,
  CorrelationPattern,
  Market 
} from "@shared/schema";
import { newsAnalyzer } from "./news-analyzer";

// Known correlation patterns
const KNOWN_PATTERNS: CorrelationPattern[] = [
  {
    id: "sec-crypto-regulation",
    pattern: "SEC regulatory announcements -> crypto market movement",
    sourceType: "regulatory",
    averageImpact: -0.08,
    averageTimeToImpact: 4,
    occurrences: 47,
    accuracy: 0.72,
    examples: [
      { newsEvent: "SEC sues Coinbase", marketMove: -0.12, date: "2023-06-06" },
      { newsEvent: "SEC delays ETF decision", marketMove: -0.05, date: "2024-01-15" },
    ],
  },
  {
    id: "elon-crypto-tweets",
    pattern: "Elon Musk crypto tweets -> DOGE/meme coin surge",
    sourceType: "tweet",
    averageImpact: 0.15,
    averageTimeToImpact: 1,
    occurrences: 23,
    accuracy: 0.78,
    examples: [
      { newsEvent: "Tesla accepts Bitcoin", marketMove: 0.20, date: "2021-02-08" },
      { newsEvent: "Musk tweets about DOGE", marketMove: 0.12, date: "2024-03-15" },
    ],
  },
  {
    id: "fed-rate-risk-assets",
    pattern: "Fed rate decisions -> risk asset repricing",
    sourceType: "economic",
    averageImpact: 0.06,
    averageTimeToImpact: 2,
    occurrences: 35,
    accuracy: 0.68,
    examples: [
      { newsEvent: "Fed signals rate cuts", marketMove: 0.08, date: "2024-12-10" },
      { newsEvent: "Unexpected rate hike", marketMove: -0.10, date: "2023-09-20" },
    ],
  },
  {
    id: "trump-tariff-trade",
    pattern: "Trump tariff announcements -> trade market movement",
    sourceType: "geopolitical",
    averageImpact: -0.05,
    averageTimeToImpact: 6,
    occurrences: 18,
    accuracy: 0.65,
    examples: [
      { newsEvent: "New China tariffs announced", marketMove: -0.07, date: "2024-11-20" },
    ],
  },
];

// Keyword to market category mapping
const KEYWORD_MARKET_MAP: Record<string, string[]> = {
  bitcoin: ["crypto", "btc", "bitcoin"],
  ethereum: ["crypto", "eth", "ethereum"],
  SEC: ["crypto", "regulation", "etf"],
  Fed: ["economics", "rates", "inflation"],
  election: ["politics", "president", "vote"],
  Trump: ["politics", "president", "tariff"],
  tariff: ["trade", "china", "economics"],
  inflation: ["economics", "fed", "rates"],
};

class CorrelationDetector {
  private correlations: NewsMarketCorrelation[] = [];
  private signals: NewsSignal[] = [];
  private markets: Market[] = [];

  setMarkets(markets: Market[]): void {
    this.markets = markets;
  }

  // Find correlations between news and markets
  async detectCorrelations(
    article: NewsArticle,
    analysis: FundamentalAnalysis
  ): Promise<NewsMarketCorrelation[]> {
    const correlations: NewsMarketCorrelation[] = [];
    
    if (this.markets.length === 0) {
      return correlations;
    }

    // Extract keywords from the article
    const extractedKeywords = this.extractKeywords(`${article.title} ${article.summary}`);
    const articleKeywords = new Set([
      ...article.keywords,
      ...Array.from(extractedKeywords),
    ]);

    // Find matching markets
    for (const market of this.markets) {
      const correlation = this.calculateMarketCorrelation(
        article,
        analysis,
        market,
        articleKeywords
      );

      if (correlation && correlation.correlationScore >= 0.5) {
        correlations.push(correlation);
      }
    }

    // Sort by correlation score
    correlations.sort((a, b) => b.correlationScore - a.correlationScore);

    // Store top correlations
    this.correlations.push(...correlations.slice(0, 10));
    
    // Keep only recent correlations
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    this.correlations = this.correlations.filter(
      c => new Date(c.detectedAt).getTime() > cutoff
    );

    return correlations.slice(0, 10);
  }

  private calculateMarketCorrelation(
    article: NewsArticle,
    analysis: FundamentalAnalysis,
    market: Market,
    articleKeywords: Set<string>
  ): NewsMarketCorrelation | null {
    const marketText = `${market.question} ${market.description}`.toLowerCase();
    const marketKeywords = this.extractKeywords(marketText);

    // Calculate keyword overlap
    let overlapCount = 0;
    for (const keyword of Array.from(articleKeywords)) {
      if (marketKeywords.has(keyword.toLowerCase())) {
        overlapCount++;
      }
    }

    if (overlapCount === 0) {
      return null;
    }

    // Calculate correlation score
    const keywordScore = Math.min(1, overlapCount / 3);
    
    // Check against known patterns
    let patternBoost = 0;
    for (const pattern of KNOWN_PATTERNS) {
      const patternKeywords = pattern.pattern.toLowerCase();
      for (const keyword of Array.from(articleKeywords)) {
        if (patternKeywords.includes(keyword.toLowerCase())) {
          patternBoost = Math.max(patternBoost, pattern.accuracy * 0.3);
        }
      }
    }

    // Factor in news importance
    const importanceBoost = article.importance === "high" ? 0.2 : 
                           article.importance === "medium" ? 0.1 : 0;

    const correlationScore = Math.min(0.95, keywordScore + patternBoost + importanceBoost);

    if (correlationScore < 0.5) {
      return null;
    }

    // Determine predicted impact and suggested side
    const predictedImpact = analysis.sentiment * correlationScore * 0.1;
    const suggestedSide = predictedImpact > 0 ? "YES" : "NO";

    // Generate reasoning
    const reasoning = this.generateReasoning(article, market, analysis, correlationScore);

    return {
      id: `corr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      newsId: article.id,
      newsTitle: article.title,
      newsSource: article.source,
      marketId: market.id,
      marketQuestion: market.question,
      correlationScore: Math.round(correlationScore * 100) / 100,
      predictedImpact: Math.round(predictedImpact * 100) / 100,
      suggestedSide,
      confidence: analysis.confidence,
      reasoning,
      detectedAt: new Date().toISOString(),
      status: "new",
    };
  }

  private extractKeywords(text: string): Set<string> {
    const keywords = new Set<string>();
    const words = text.toLowerCase().split(/\W+/);
    
    // Add known important keywords
    for (const [key, related] of Object.entries(KEYWORD_MARKET_MAP)) {
      if (words.some(w => w.includes(key.toLowerCase()))) {
        keywords.add(key.toLowerCase());
        related.forEach(r => keywords.add(r.toLowerCase()));
      }
    }

    // Add any capitalized words (likely proper nouns)
    const properNouns = text.match(/\b[A-Z][a-z]+\b/g) || [];
    properNouns.forEach((noun: string) => keywords.add(noun.toLowerCase()));

    return keywords;
  }

  private generateReasoning(
    article: NewsArticle,
    market: Market,
    analysis: FundamentalAnalysis,
    correlationScore: number
  ): string {
    const sentiment = analysis.sentiment > 0 ? "bullish" : analysis.sentiment < 0 ? "bearish" : "neutral";
    const strength = correlationScore > 0.8 ? "strong" : correlationScore > 0.6 ? "moderate" : "weak";
    
    return `${article.source} reports ${sentiment} news with ${strength} correlation to "${market.question.slice(0, 50)}...". ` +
           `Sentiment score: ${analysis.sentiment.toFixed(2)}, confidence: ${(analysis.confidence * 100).toFixed(0)}%. ` +
           `Keywords matched: ${article.keywords.slice(0, 3).join(", ")}.`;
  }

  // Generate actionable signals from correlations
  generateSignal(
    correlations: NewsMarketCorrelation[],
    maxPositionSize: number = 100
  ): NewsSignal | null {
    if (correlations.length === 0) {
      return null;
    }

    // Group correlations by market
    const marketCorrelations = new Map<string, NewsMarketCorrelation[]>();
    for (const corr of correlations) {
      const existing = marketCorrelations.get(corr.marketId) || [];
      existing.push(corr);
      marketCorrelations.set(corr.marketId, existing);
    }

    // Find market with strongest aggregate signal
    let bestMarket: { id: string; question: string; currentPrice: number } | null = null;
    let bestCorrelations: NewsMarketCorrelation[] = [];
    let bestScore = 0;

    for (const [marketId, corrs] of Array.from(marketCorrelations.entries())) {
      const avgScore = corrs.reduce((sum: number, c: NewsMarketCorrelation) => sum + c.correlationScore, 0) / corrs.length;
      if (avgScore > bestScore) {
        bestScore = avgScore;
        bestCorrelations = corrs;
        const market = this.markets.find(m => m.id === marketId);
        if (market) {
          bestMarket = {
            id: market.id,
            question: market.question,
            currentPrice: market.outcomePrices[0] || 0.5,
          };
        }
      }
    }

    if (!bestMarket) {
      return null;
    }

    // Calculate aggregate metrics
    const aggregateSentiment = bestCorrelations.reduce((sum, c) => sum + c.predictedImpact, 0) / bestCorrelations.length;
    const aggregateConfidence = bestCorrelations.reduce((sum, c) => sum + c.confidence, 0) / bestCorrelations.length;

    // Determine action
    let suggestedAction: NewsSignal["suggestedAction"];
    if (aggregateSentiment > 0.05 && aggregateConfidence > 0.7) suggestedAction = "strong_buy";
    else if (aggregateSentiment > 0.02 && aggregateConfidence > 0.6) suggestedAction = "buy";
    else if (aggregateSentiment < -0.05 && aggregateConfidence > 0.7) suggestedAction = "strong_sell";
    else if (aggregateSentiment < -0.02 && aggregateConfidence > 0.6) suggestedAction = "sell";
    else suggestedAction = "hold";

    // Calculate position size based on confidence
    const positionSize = Math.round(maxPositionSize * aggregateConfidence);

    // Generate reasoning
    const reasoning = `Based on ${bestCorrelations.length} news correlation(s): ` +
                     bestCorrelations.slice(0, 3).map(c => c.newsTitle.slice(0, 40)).join("; ") +
                     `. Aggregate sentiment: ${(aggregateSentiment * 100).toFixed(1)}%, confidence: ${(aggregateConfidence * 100).toFixed(0)}%.`;

    const signal: NewsSignal = {
      id: `signal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      correlations: bestCorrelations,
      aggregateSentiment: Math.round(aggregateSentiment * 100) / 100,
      aggregateConfidence: Math.round(aggregateConfidence * 100) / 100,
      suggestedAction,
      targetMarket: bestMarket,
      positionSize,
      reasoning,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours
      status: "active",
    };

    this.signals.push(signal);
    return signal;
  }

  // Get all recent correlations
  getRecentCorrelations(limit: number = 20): NewsMarketCorrelation[] {
    return this.correlations
      .sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime())
      .slice(0, limit);
  }

  // Get active signals
  getActiveSignals(): NewsSignal[] {
    const now = Date.now();
    return this.signals.filter(
      s => s.status === "active" && new Date(s.expiresAt).getTime() > now
    );
  }

  // Get known patterns
  getKnownPatterns(): CorrelationPattern[] {
    return KNOWN_PATTERNS;
  }

  // Expire old signals
  cleanupExpiredSignals(): void {
    const now = Date.now();
    this.signals = this.signals.map(signal => {
      if (signal.status === "active" && new Date(signal.expiresAt).getTime() < now) {
        return { ...signal, status: "expired" as const };
      }
      return signal;
    });
  }
}

export const correlationDetector = new CorrelationDetector();
