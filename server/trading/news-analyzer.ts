import type { NewsArticle, FundamentalAnalysis } from "@shared/schema";
import Anthropic from "@anthropic-ai/sdk";

// Initialize Anthropic client with Replit AI Integrations
const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

// Fallback keyword patterns for when AI is not available
const SENTIMENT_KEYWORDS = {
  bullish: {
    words: [
      "surge", "rally", "bullish", "gain", "rise", "soar", "jump",
      "approve", "adoption", "optimistic", "breakthrough", "record high",
      "growth", "expansion", "positive", "strong", "boost", "momentum",
      "friendly", "support", "integration", "mainstream",
    ],
    weight: 0.15,
  },
  bearish: {
    words: [
      "crash", "plunge", "bearish", "drop", "fall", "decline", "dump",
      "reject", "ban", "pessimistic", "concern", "record low", "fear",
      "contraction", "negative", "weak", "warning", "delay", "uncertainty",
      "restriction", "lawsuit", "hack", "exploit", "investigate",
    ],
    weight: -0.15,
  },
};

class NewsAnalyzer {
  private analysisCache: Map<string, FundamentalAnalysis> = new Map();
  private useAI: boolean = true;

  // Analyze article using Claude AI
  async analyzeArticle(article: NewsArticle): Promise<FundamentalAnalysis> {
    // Check cache first
    const cached = this.analysisCache.get(article.id);
    if (cached) {
      return cached;
    }

    try {
      if (this.useAI) {
        const analysis = await this.analyzeWithClaude(article);
        this.analysisCache.set(article.id, analysis);
        return analysis;
      }
    } catch (error) {
      console.error("Claude analysis failed, falling back to keyword analysis:", error);
      this.useAI = false; // Disable AI for subsequent calls if it fails
    }

    // Fallback to keyword-based analysis
    const analysis = this.analyzeWithKeywords(article);
    this.analysisCache.set(article.id, analysis);
    return analysis;
  }

  // Use Claude for intelligent news analysis
  private async analyzeWithClaude(article: NewsArticle): Promise<FundamentalAnalysis> {
    const prompt = `Analyze this news article for trading signal generation on prediction markets.

ARTICLE:
Title: ${article.title}
Source: ${article.source}
Published: ${article.publishedAt}
Summary: ${article.summary}
Content: ${article.content}

Provide your analysis in the following JSON format (respond ONLY with valid JSON):
{
  "extractedEvents": ["list of key events mentioned"],
  "policyChanges": ["any regulatory or policy changes mentioned"],
  "economicIndicators": ["any economic data or indicators mentioned"],
  "expertForecasts": ["any predictions or forecasts from experts"],
  "sentiment": <number from -1 (very bearish) to 1 (very bullish)>,
  "confidence": <number from 0 to 1 indicating how confident you are in this analysis>,
  "reasoning": "brief explanation of your sentiment assessment"
}

Focus on:
- How this news might affect prediction markets (politics, crypto, economics)
- Time-sensitive events that could move prices
- Expert predictions with specific numbers/dates
- Regulatory decisions that impact markets`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    // Extract text content from response
    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    // Parse JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse JSON from Claude response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      newsId: article.id,
      extractedEvents: parsed.extractedEvents || [],
      policyChanges: parsed.policyChanges || [],
      economicIndicators: parsed.economicIndicators || [],
      expertForecasts: parsed.expertForecasts || [],
      sentiment: Math.max(-1, Math.min(1, parsed.sentiment || 0)),
      confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
      analyzedAt: new Date().toISOString(),
    };
  }

  // Fallback keyword-based analysis
  private analyzeWithKeywords(article: NewsArticle): FundamentalAnalysis {
    const fullText = `${article.title} ${article.summary} ${article.content}`;
    
    const extractedEvents = this.extractEvents(fullText);
    const policyChanges = this.extractPatternMatches(fullText, [
      /regulation/i, /ban/i, /approve/i, /reject/i, /legislation/i,
      /SEC/i, /CFTC/i, /Fed/i, /Treasury/i,
    ]);
    const economicIndicators = this.extractPatternMatches(fullText, [
      /inflation/i, /CPI/i, /GDP/i, /unemployment/i,
      /interest rate/i, /rate cut/i, /rate hike/i,
    ]);
    const expertForecasts = this.extractForecasts(fullText);
    
    const sentiment = this.calculateSentiment(fullText);
    const confidence = this.calculateConfidence(article, extractedEvents.length);

    return {
      newsId: article.id,
      extractedEvents,
      policyChanges,
      economicIndicators,
      expertForecasts,
      sentiment,
      confidence,
      analyzedAt: new Date().toISOString(),
    };
  }

  private extractEvents(text: string): string[] {
    const events: string[] = [];
    const eventPatterns = [
      /announces?.*(?:plan|decision|ruling|measure)/gi,
      /(?:SEC|Fed|Treasury|Congress).*(?:approve|reject|delay|consider)/gi,
      /(?:bitcoin|ethereum|crypto).*(?:ETF|halving|upgrade)/gi,
    ];

    for (const pattern of eventPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        events.push(...matches.slice(0, 3));
      }
    }

    return Array.from(new Set(events));
  }

  private extractPatternMatches(text: string, patterns: RegExp[]): string[] {
    const matches: string[] = [];
    
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        const match = text.match(pattern);
        if (match) {
          const index = text.toLowerCase().indexOf(match[0].toLowerCase());
          const start = Math.max(0, index - 20);
          const end = Math.min(text.length, index + match[0].length + 50);
          matches.push(text.slice(start, end).trim());
        }
      }
    }

    return Array.from(new Set(matches)).slice(0, 5);
  }

  private extractForecasts(text: string): string[] {
    const forecasts: string[] = [];
    const forecastPatterns = [
      /analyst[s]? (?:expect|predict|forecast|see)/gi,
      /(?:could|may|might|likely to) (?:reach|hit|drop|rise)/gi,
      /(?:by |in )(?:Q[1-4]|20\d\d)/gi,
    ];

    for (const pattern of forecastPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        forecasts.push(...matches.slice(0, 2));
      }
    }

    return Array.from(new Set(forecasts)).slice(0, 5);
  }

  private calculateSentiment(text: string): number {
    const lowerText = text.toLowerCase();
    let sentiment = 0;
    let matchCount = 0;

    for (const word of SENTIMENT_KEYWORDS.bullish.words) {
      const regex = new RegExp(`\\b${word}\\b`, "gi");
      const matches = lowerText.match(regex);
      if (matches) {
        sentiment += matches.length * SENTIMENT_KEYWORDS.bullish.weight;
        matchCount += matches.length;
      }
    }

    for (const word of SENTIMENT_KEYWORDS.bearish.words) {
      const regex = new RegExp(`\\b${word}\\b`, "gi");
      const matches = lowerText.match(regex);
      if (matches) {
        sentiment += matches.length * SENTIMENT_KEYWORDS.bearish.weight;
        matchCount += matches.length;
      }
    }

    if (matchCount > 0) {
      sentiment = Math.max(-1, Math.min(1, sentiment / Math.sqrt(matchCount)));
    }

    return Math.round(sentiment * 100) / 100;
  }

  private calculateConfidence(article: NewsArticle, eventCount: number): number {
    let confidence = 0.5;

    if (article.importance === "high") confidence += 0.2;
    if (article.importance === "medium") confidence += 0.1;

    if (["reuters", "bloomberg"].includes(article.source)) confidence += 0.15;

    if (eventCount >= 3) confidence += 0.15;
    else if (eventCount >= 1) confidence += 0.1;

    const ageHours = (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60);
    if (ageHours < 1) confidence += 0.1;
    else if (ageHours < 4) confidence += 0.05;

    return Math.min(0.95, Math.round(confidence * 100) / 100);
  }

  // Analyze multiple articles for aggregate sentiment
  async analyzeMultiple(articles: NewsArticle[]): Promise<{
    analyses: FundamentalAnalysis[];
    aggregateSentiment: number;
    aggregateConfidence: number;
    topEvents: string[];
  }> {
    const analyses = await Promise.all(
      articles.map(article => this.analyzeArticle(article))
    );

    let totalWeight = 0;
    let weightedSentiment = 0;
    let weightedConfidence = 0;

    for (const analysis of analyses) {
      const weight = analysis.confidence;
      weightedSentiment += analysis.sentiment * weight;
      weightedConfidence += analysis.confidence * weight;
      totalWeight += weight;
    }

    const aggregateSentiment = totalWeight > 0 ? weightedSentiment / totalWeight : 0;
    const aggregateConfidence = totalWeight > 0 ? weightedConfidence / totalWeight : 0;

    const allEvents = analyses.flatMap(a => a.extractedEvents);
    const topEvents = Array.from(new Set(allEvents)).slice(0, 10);

    return {
      analyses,
      aggregateSentiment: Math.round(aggregateSentiment * 100) / 100,
      aggregateConfidence: Math.round(aggregateConfidence * 100) / 100,
      topEvents,
    };
  }

  // Reset AI availability (useful for testing or retrying)
  enableAI(): void {
    this.useAI = true;
  }

  // Clear analysis cache
  clearCache(): void {
    this.analysisCache.clear();
  }
}

export const newsAnalyzer = new NewsAnalyzer();
