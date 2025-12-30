import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Market data from Polymarket
export interface Market {
  id: string;
  conditionId: string;
  slug: string;
  question: string;
  description: string;
  outcomes: string[];
  outcomePrices: number[];
  volume: number;
  liquidity: number;
  endDate: string;
  active: boolean;
  spread: number;
  arbitrageOpportunity: number;
}

// Bot configuration - now includes "spike" and "news" types
export interface BotConfig {
  id: string;
  name: string;
  type: "arbitrage" | "statistical" | "ai" | "spread" | "copy" | "spike" | "news";
  status: "active" | "paused" | "stopped" | "error";
  settings: ArbitrageSettings | StatisticalSettings | AISettings | SpreadSettings | CopySettings | SpikeSettings | NewsSettings;
  createdAt: string;
  lastExecutedAt: string | null;
  totalProfitLoss: number;
  tradeCount: number;
  winRate: number;
}

export interface ArbitrageSettings {
  threshold: number;
  maxPositionSize: number;
  pollIntervalMs: number;
  targetMarkets: string[];
  autoExecute: boolean;
}

export interface StatisticalSettings {
  correlationThreshold: number;
  spreadThreshold: number;
  marketPairs: Array<{ market1: string; market2: string }>;
  autoExecute: boolean;
}

export interface AISettings {
  modelType: string;
  confidenceThreshold: number;
  maxPositionSize: number;
  autoExecute: boolean;
}

export interface SpreadSettings {
  minSpread: number;
  maxPositionSize: number;
  targetMarkets: string[];
  autoExecute: boolean;
}

export interface CopySettings {
  targetTraders: string[];
  proportionalSize: number;
  maxPositionSize: number;
  autoExecute: boolean;
}

// Spike Hunter Settings
export interface SpikeSettings {
  spikeThreshold: number;       // Min price change to trigger (e.g., 0.02 = 2%)
  positionSize: number;         // Base position size in dollars
  takeProfitPercent: number;    // Take profit target (e.g., 0.03 = 3%)
  stopLossPercent: number;      // Stop loss limit (e.g., 0.02 = 2%)
  pollIntervalMs: number;       // Polling interval in ms
  priceHistoryWindow: number;   // Number of price points to track
  targetMarkets: string[];      // Market IDs to monitor
  autoExecute: boolean;
  cooldownMs: number;           // Cooldown between trades on same market
}

// News Intelligence Bot Settings
export interface NewsSettings {
  sources: string[];            // RSS feeds, news sources to monitor
  keywords: string[];           // Keywords to track (e.g., "bitcoin", "SEC", "trump")
  correlationThreshold: number; // Min correlation score to flag (0-1)
  confidenceThreshold: number;  // Min AI confidence to act (0-1)
  maxPositionSize: number;      // Max position size per signal
  pollIntervalMs: number;       // How often to check for news
  lookbackHours: number;        // How far back to analyze
  autoExecute: boolean;
  categories: string[];         // crypto, politics, sports, economics
}

// Trade execution
export interface Trade {
  id: string;
  botId: string;
  marketId: string;
  marketQuestion: string;
  side: "YES" | "NO";
  action: "BUY" | "SELL";
  price: number;
  amount: number;
  total: number;
  profitLoss: number;
  status: "pending" | "executed" | "failed" | "cancelled";
  timestamp: string;
  reason: string;
}

// Position tracking
export interface Position {
  id: string;
  botId: string;
  marketId: string;
  marketQuestion: string;
  side: "YES" | "NO";
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  unrealizedPL: number;
  openedAt: string;
  stopLoss?: number;
  takeProfit?: number;
}

// Dashboard metrics
export interface DashboardMetrics {
  totalProfitLoss: number;
  todayProfitLoss: number;
  winRate: number;
  totalTrades: number;
  activeBots: number;
  activePositions: number;
  bestPerformingBot: string | null;
  profitHistory: Array<{ date: string; profit: number }>;
}

// Execution log entry
export interface ExecutionLog {
  id: string;
  botId: string;
  botName: string;
  action: string;
  details: string;
  status: "success" | "warning" | "error" | "info";
  timestamp: string;
}

// ============ NEW ADVANCED TRADING TYPES ============

// Kelly Criterion calculation
export interface KellyResult {
  fraction: number;           // Optimal fraction of bankroll
  positionSize: number;       // Dollar amount to bet
  edge: number;               // Calculated edge
  confidence: number;         // Confidence level 0-1
  recommendation: "strong_buy" | "buy" | "hold" | "avoid";
}

export interface KellyInput {
  currentPrice: number;       // Market price (0-1)
  estimatedProbability: number; // Your estimate (0-1)
  bankroll: number;           // Total capital
  kellyFraction: number;      // Fractional Kelly (0.25-1.0)
  maxPositionPercent: number; // Max % of bankroll per position
}

// Arbitrage opportunity
export interface ArbitrageOpportunity {
  id: string;
  type: "binary" | "multi_market" | "cross_platform";
  market1: { id: string; question: string; price: number; platform: string };
  market2?: { id: string; question: string; price: number; platform: string };
  totalCost: number;
  guaranteedPayout: number;
  profit: number;
  profitPercent: number;
  detectedAt: string;
  expiresAt?: string;
  status: "active" | "expired" | "executed";
}

// Spike detection event
export interface SpikeEvent {
  id: string;
  marketId: string;
  marketQuestion: string;
  priceChange: number;        // Absolute change
  priceChangePercent: number; // Percentage change
  direction: "up" | "down";
  previousPrice: number;
  currentPrice: number;
  volume: number;
  detectedAt: string;
  confidence: number;
  suggestedAction: "buy_yes" | "buy_no" | "wait";
}

// Price history for spike detection
export interface PricePoint {
  marketId: string;
  price: number;
  timestamp: number;
  volume?: number;
}

// Real-time market feed
export interface MarketFeed {
  marketId: string;
  conditionId: string;
  question: string;
  yesPrice: number;
  noPrice: number;
  spread: number;
  volume24h: number;
  lastUpdate: number;
  priceHistory: PricePoint[];
}

// Backtesting types
export interface BacktestConfig {
  strategy: "arbitrage" | "spike" | "statistical" | "kelly";
  startDate: string;
  endDate: string;
  initialCapital: number;
  settings: Record<string, any>;
}

export interface BacktestResult {
  id: string;
  config: BacktestConfig;
  totalReturn: number;
  totalReturnPercent: number;
  maxDrawdown: number;
  sharpeRatio: number;
  winRate: number;
  totalTrades: number;
  profitFactor: number;
  equityCurve: Array<{ date: string; equity: number }>;
  trades: BacktestTrade[];
  runAt: string;
}

export interface BacktestTrade {
  entryDate: string;
  exitDate: string;
  marketId: string;
  side: "YES" | "NO";
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  profitLoss: number;
  profitLossPercent: number;
}

// Risk management
export interface RiskMetrics {
  totalExposure: number;        // Total capital at risk
  exposurePercent: number;      // % of bankroll exposed
  largestPosition: number;      // Largest single position
  portfolioHeat: number;        // Risk-adjusted exposure
  correlationRisk: number;      // Correlated positions risk
  valueAtRisk: number;          // 95% VaR
  maxDrawdown: number;          // Historical max drawdown
  currentDrawdown: number;      // Current drawdown from peak
  riskScore: "low" | "medium" | "high" | "critical";
}

export interface RiskLimits {
  maxTotalExposure: number;     // Max % of bankroll deployed
  maxPositionSize: number;      // Max single position %
  maxDailyLoss: number;         // Stop trading if exceeded
  maxCorrelation: number;       // Max portfolio correlation
  stopLossDefault: number;      // Default stop loss %
  takeProfitDefault: number;    // Default take profit %
}

// Cross-platform comparison (Polymarket vs Kalshi)
export interface CrossPlatformPrice {
  marketDescription: string;
  polymarketPrice: number | null;
  kalshiPrice: number | null;
  priceDifference: number | null;
  arbitrageAvailable: boolean;
  lastUpdated: string;
}

// ============ NEWS INTELLIGENCE TYPES ============

// News article from any source
export interface NewsArticle {
  id: string;
  source: string;           // reuters, bloomberg, coindesk, twitter, etc.
  title: string;
  summary: string;
  content: string;
  url: string;
  publishedAt: string;
  author?: string;
  category: string;         // crypto, politics, economics, sports
  keywords: string[];
  sentiment: "bullish" | "bearish" | "neutral";
  importance: "high" | "medium" | "low";
}

// AI-extracted fundamental analysis
export interface FundamentalAnalysis {
  newsId: string;
  extractedEvents: string[];          // Major events identified
  policyChanges: string[];            // Policy/regulatory changes
  economicIndicators: string[];       // Economic data releases
  expertForecasts: string[];          // Expert predictions
  sentiment: number;                  // -1 to 1 scale
  confidence: number;                 // AI confidence 0-1
  analyzedAt: string;
}

// News-to-market correlation
export interface NewsMarketCorrelation {
  id: string;
  newsId: string;
  newsTitle: string;
  newsSource: string;
  marketId: string;
  marketQuestion: string;
  correlationScore: number;           // 0-1, how related
  predictedImpact: number;            // Expected price movement (-1 to 1)
  suggestedSide: "YES" | "NO";
  confidence: number;
  reasoning: string;                  // AI explanation
  detectedAt: string;
  status: "new" | "acted" | "expired";
}

// Trading signal from news analysis
export interface NewsSignal {
  id: string;
  correlations: NewsMarketCorrelation[];
  aggregateSentiment: number;
  aggregateConfidence: number;
  suggestedAction: "strong_buy" | "buy" | "hold" | "sell" | "strong_sell";
  targetMarket: {
    id: string;
    question: string;
    currentPrice: number;
  };
  positionSize: number;
  reasoning: string;
  createdAt: string;
  expiresAt: string;
  status: "active" | "executed" | "expired" | "cancelled";
}

// Historical correlation pattern
export interface CorrelationPattern {
  id: string;
  pattern: string;                    // "SEC regulation -> crypto markets -5-10%"
  sourceType: string;                 // "regulatory", "tweet", "economic"
  averageImpact: number;              // Average price movement
  averageTimeToImpact: number;        // Hours until market moves
  occurrences: number;                // Times this pattern appeared
  accuracy: number;                   // How often prediction was correct
  examples: Array<{
    newsEvent: string;
    marketMove: number;
    date: string;
  }>;
}

// Insert schemas for Zod validation - settings validated per bot type
export const insertBotConfigSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["arbitrage", "statistical", "ai", "spread", "copy", "spike", "news"]),
  settings: z.record(z.any()).default({}),
}).transform((data) => {
  // Apply defaults based on bot type
  const defaultSettings: Record<string, Record<string, any>> = {
    arbitrage: {
      threshold: 0.01,
      maxPositionSize: 100,
      pollIntervalMs: 3000,
      targetMarkets: [],
      autoExecute: false,
    },
    spike: {
      spikeThreshold: 0.02,
      positionSize: 100,
      takeProfitPercent: 0.03,
      stopLossPercent: 0.02,
      pollIntervalMs: 3000,
      priceHistoryWindow: 20,
      targetMarkets: [],
      autoExecute: false,
      cooldownMs: 30000,
    },
    statistical: {
      correlationThreshold: 0.8,
      spreadThreshold: 0.05,
      marketPairs: [],
      autoExecute: false,
    },
    ai: {
      modelType: "ensemble",
      confidenceThreshold: 0.65,
      maxPositionSize: 200,
      autoExecute: false,
    },
    spread: {
      minSpread: 0.05,
      maxPositionSize: 100,
      targetMarkets: [],
      autoExecute: false,
    },
    copy: {
      targetTraders: [],
      proportionalSize: 1,
      maxPositionSize: 100,
      autoExecute: false,
    },
    news: {
      sources: ["reuters", "bloomberg", "coindesk"],
      keywords: [],
      correlationThreshold: 0.7,
      confidenceThreshold: 0.65,
      maxPositionSize: 100,
      pollIntervalMs: 60000,
      lookbackHours: 24,
      autoExecute: false,
      categories: ["crypto", "politics", "economics"],
    },
  };

  return {
    name: data.name,
    type: data.type,
    settings: { ...defaultSettings[data.type], ...data.settings },
  };
});

export const insertArbitrageSettingsSchema = z.object({
  threshold: z.number().min(0.001).max(0.1),
  maxPositionSize: z.number().min(1).max(10000),
  pollIntervalMs: z.number().min(1000).max(60000),
  targetMarkets: z.array(z.string()),
  autoExecute: z.boolean(),
});

export const insertSpikeSettingsSchema = z.object({
  spikeThreshold: z.number().min(0.01).max(0.2),
  positionSize: z.number().min(1).max(1000),
  takeProfitPercent: z.number().min(0.01).max(0.2),
  stopLossPercent: z.number().min(0.01).max(0.1),
  pollIntervalMs: z.number().min(500).max(10000),
  priceHistoryWindow: z.number().min(5).max(100),
  targetMarkets: z.array(z.string()),
  autoExecute: z.boolean(),
  cooldownMs: z.number().min(1000).max(300000),
});

export const kellyInputSchema = z.object({
  currentPrice: z.number().min(0.01).max(0.99),
  estimatedProbability: z.number().min(0.01).max(0.99),
  bankroll: z.number().min(1),
  kellyFraction: z.number().min(0.1).max(1.0).default(0.5),
  maxPositionPercent: z.number().min(0.01).max(0.25).default(0.05),
});

export const backtestConfigSchema = z.object({
  strategy: z.enum(["arbitrage", "spike", "statistical", "kelly"]),
  startDate: z.string(),
  endDate: z.string(),
  initialCapital: z.number().min(100),
  settings: z.record(z.any()),
});

export type InsertBotConfig = z.infer<typeof insertBotConfigSchema>;
export type InsertArbitrageSettings = z.infer<typeof insertArbitrageSettingsSchema>;
export type InsertSpikeSettings = z.infer<typeof insertSpikeSettingsSchema>;
export type KellyInputType = z.infer<typeof kellyInputSchema>;
export type BacktestConfigType = z.infer<typeof backtestConfigSchema>;
