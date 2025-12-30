import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBotConfigSchema, kellyInputSchema, backtestConfigSchema } from "@shared/schema";
import type { Market, SpikeSettings } from "@shared/schema";
import { kellyCalculator } from "./trading/kelly-criterion";
import { spikeDetector } from "./trading/spike-detector";
import { arbitrageScanner } from "./trading/arbitrage-scanner";
import { backtestingEngine } from "./trading/backtesting-engine";
import { riskManager } from "./trading/risk-manager";
import { newsScraper } from "./trading/news-scraper";
import { newsAnalyzer } from "./trading/news-analyzer";
import { correlationDetector } from "./trading/correlation-detector";

// Polymarket API endpoints
const POLYMARKET_GAMMA_API = "https://gamma-api.polymarket.com";

async function fetchPolymarketMarkets(): Promise<Market[]> {
  try {
    const response = await fetch(`${POLYMARKET_GAMMA_API}/markets?limit=50&active=true`);
    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return data.map((market: any) => {
      // Handle both JSON strings and arrays for outcomes/prices
      let outcomes: string[];
      if (Array.isArray(market.outcomes)) {
        outcomes = market.outcomes;
      } else if (typeof market.outcomes === "string") {
        try {
          outcomes = JSON.parse(market.outcomes);
        } catch {
          outcomes = ["Yes", "No"];
        }
      } else {
        outcomes = ["Yes", "No"];
      }

      let prices: number[];
      if (Array.isArray(market.outcomePrices)) {
        prices = market.outcomePrices.map((p: any) => parseFloat(p) || 0.5);
      } else if (typeof market.outcomePrices === "string") {
        try {
          prices = JSON.parse(market.outcomePrices).map((p: any) => parseFloat(p) || 0.5);
        } catch {
          prices = [0.5, 0.5];
        }
      } else {
        prices = [0.5, 0.5];
      }

      const yesPrice = prices[0] || 0.5;
      const noPrice = prices[1] || 0.5;
      const totalPrice = yesPrice + noPrice;
      
      return {
        id: market.id || market.conditionId,
        conditionId: market.conditionId || "",
        slug: market.slug || "",
        question: market.question || "Unknown Market",
        description: market.description || "",
        outcomes,
        outcomePrices: [yesPrice, noPrice],
        volume: parseFloat(market.volume) || 0,
        liquidity: parseFloat(market.liquidity) || 0,
        endDate: market.endDate || "",
        active: market.active !== false,
        spread: Math.abs(yesPrice - noPrice),
        arbitrageOpportunity: totalPrice < 1 ? 1 - totalPrice : 0,
      };
    });
  } catch (error) {
    console.error("Failed to fetch Polymarket markets:", error);
    // Return sample markets if API fails
    return getSampleMarkets();
  }
}

function getSampleMarkets(): Market[] {
  return [
    {
      id: "btc-100k-2025",
      conditionId: "0x123",
      slug: "bitcoin-100k-2025",
      question: "Will Bitcoin reach $100,000 by end of 2025?",
      description: "Resolves YES if BTC/USD reaches $100,000 on any major exchange",
      outcomes: ["Yes", "No"],
      outcomePrices: [0.42, 0.55],
      volume: 2500000,
      liquidity: 850000,
      endDate: "2025-12-31",
      active: true,
      spread: 0.13,
      arbitrageOpportunity: 0.03,
    },
    {
      id: "eth-5k-2025",
      conditionId: "0x456",
      slug: "ethereum-5k-2025",
      question: "Will Ethereum reach $5,000 by end of 2025?",
      description: "Resolves YES if ETH/USD reaches $5,000 on any major exchange",
      outcomes: ["Yes", "No"],
      outcomePrices: [0.38, 0.60],
      volume: 1800000,
      liquidity: 620000,
      endDate: "2025-12-31",
      active: true,
      spread: 0.22,
      arbitrageOpportunity: 0.02,
    },
    {
      id: "trump-2028",
      conditionId: "0x789",
      slug: "trump-2028-election",
      question: "Will Trump run for President in 2028?",
      description: "Resolves YES if Trump announces presidential candidacy for 2028",
      outcomes: ["Yes", "No"],
      outcomePrices: [0.25, 0.72],
      volume: 5200000,
      liquidity: 1200000,
      endDate: "2028-11-01",
      active: true,
      spread: 0.47,
      arbitrageOpportunity: 0.03,
    },
    {
      id: "fed-rate-cut",
      conditionId: "0xabc",
      slug: "fed-rate-cut-jan-2025",
      question: "Will the Fed cut rates in January 2025?",
      description: "Resolves YES if the Federal Reserve cuts the federal funds rate",
      outcomes: ["Yes", "No"],
      outcomePrices: [0.65, 0.34],
      volume: 3100000,
      liquidity: 980000,
      endDate: "2025-02-01",
      active: true,
      spread: 0.31,
      arbitrageOpportunity: 0.01,
    },
    {
      id: "super-bowl-2025",
      conditionId: "0xdef",
      slug: "super-bowl-lix-winner",
      question: "Will the Kansas City Chiefs win Super Bowl LIX?",
      description: "Resolves YES if Chiefs win Super Bowl LIX",
      outcomes: ["Yes", "No"],
      outcomePrices: [0.28, 0.70],
      volume: 4500000,
      liquidity: 1500000,
      endDate: "2025-02-09",
      active: true,
      spread: 0.42,
      arbitrageOpportunity: 0.02,
    },
    {
      id: "ai-agi-2025",
      conditionId: "0x111",
      slug: "agi-by-2025",
      question: "Will AGI be achieved by end of 2025?",
      description: "Resolves based on expert consensus on AGI achievement",
      outcomes: ["Yes", "No"],
      outcomePrices: [0.08, 0.90],
      volume: 890000,
      liquidity: 320000,
      endDate: "2025-12-31",
      active: true,
      spread: 0.82,
      arbitrageOpportunity: 0.02,
    },
    {
      id: "spacex-starship",
      conditionId: "0x222",
      slug: "starship-orbital-2025",
      question: "Will Starship complete orbital flight by March 2025?",
      description: "Resolves YES if SpaceX Starship completes full orbital flight",
      outcomes: ["Yes", "No"],
      outcomePrices: [0.72, 0.26],
      volume: 1200000,
      liquidity: 450000,
      endDate: "2025-03-31",
      active: true,
      spread: 0.46,
      arbitrageOpportunity: 0.02,
    },
    {
      id: "nvidia-stock",
      conditionId: "0x333",
      slug: "nvidia-200-2025",
      question: "Will NVIDIA stock reach $200 by end of Q1 2025?",
      description: "Resolves YES if NVDA reaches $200 per share",
      outcomes: ["Yes", "No"],
      outcomePrices: [0.55, 0.43],
      volume: 2800000,
      liquidity: 920000,
      endDate: "2025-03-31",
      active: true,
      spread: 0.12,
      arbitrageOpportunity: 0.02,
    },
  ];
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Initialize markets and feed price data to spike detector
  const markets = await fetchPolymarketMarkets();
  await storage.setMarkets(markets);
  
  // Feed initial prices to spike detector
  for (const market of markets) {
    spikeDetector.recordPrice(market.id, market.outcomePrices[0]);
  }

  // Dashboard metrics
  app.get("/api/dashboard/metrics", async (_req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });

  // Recent execution logs
  app.get("/api/executions/recent", async (_req, res) => {
    try {
      const logs = await storage.getExecutionLogs(10);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch logs" });
    }
  });

  // All execution logs
  app.get("/api/executions", async (_req, res) => {
    try {
      const logs = await storage.getExecutionLogs();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch logs" });
    }
  });

  // Markets
  app.get("/api/markets", async (_req, res) => {
    try {
      // Refresh markets from API occasionally
      const cached = await storage.getMarkets();
      if (cached.length === 0) {
        const fresh = await fetchPolymarketMarkets();
        await storage.setMarkets(fresh);
        res.json(fresh);
      } else {
        res.json(cached);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch markets" });
    }
  });

  // Top markets (sorted by arbitrage opportunity)
  app.get("/api/markets/top", async (_req, res) => {
    try {
      const markets = await storage.getMarkets();
      const sorted = [...markets]
        .sort((a, b) => b.arbitrageOpportunity - a.arbitrageOpportunity)
        .slice(0, 10);
      res.json(sorted);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch top markets" });
    }
  });

  // Refresh markets
  app.post("/api/markets/refresh", async (_req, res) => {
    try {
      const fresh = await fetchPolymarketMarkets();
      await storage.setMarkets(fresh);
      
      // Feed updated prices to spike detector for real-time detection
      for (const market of fresh) {
        spikeDetector.recordPrice(market.id, market.outcomePrices[0]);
      }
      
      res.json(fresh);
    } catch (error) {
      res.status(500).json({ error: "Failed to refresh markets" });
    }
  });

  // Bots CRUD
  app.get("/api/bots", async (_req, res) => {
    try {
      const bots = await storage.getBots();
      res.json(bots);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bots" });
    }
  });

  app.get("/api/bots/:id", async (req, res) => {
    try {
      const bot = await storage.getBot(req.params.id);
      if (!bot) {
        return res.status(404).json({ error: "Bot not found" });
      }
      res.json(bot);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bot" });
    }
  });

  app.post("/api/bots", async (req, res) => {
    try {
      const parsed = insertBotConfigSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      
      // Schema transform applies proper defaults based on bot type
      const { name, type, settings } = parsed.data;
      const bot = await storage.createBot(name, type, settings);
      
      await storage.addExecutionLog({
        botId: bot.id,
        botName: bot.name,
        action: "Bot Created",
        details: `New ${type} bot "${name}" created`,
        status: "success",
        timestamp: new Date().toISOString(),
      });
      
      res.status(201).json(bot);
    } catch (error) {
      res.status(500).json({ error: "Failed to create bot" });
    }
  });

  app.post("/api/bots/:id/start", async (req, res) => {
    try {
      const bot = await storage.updateBot(req.params.id, { 
        status: "active",
        lastExecutedAt: new Date().toISOString(),
      });
      if (!bot) {
        return res.status(404).json({ error: "Bot not found" });
      }
      
      await storage.addExecutionLog({
        botId: bot.id,
        botName: bot.name,
        action: "Bot Started",
        details: `Bot "${bot.name}" is now running`,
        status: "success",
        timestamp: new Date().toISOString(),
      });
      
      res.json(bot);
    } catch (error) {
      res.status(500).json({ error: "Failed to start bot" });
    }
  });

  app.post("/api/bots/:id/pause", async (req, res) => {
    try {
      const bot = await storage.updateBot(req.params.id, { status: "paused" });
      if (!bot) {
        return res.status(404).json({ error: "Bot not found" });
      }
      
      await storage.addExecutionLog({
        botId: bot.id,
        botName: bot.name,
        action: "Bot Paused",
        details: `Bot "${bot.name}" has been paused`,
        status: "warning",
        timestamp: new Date().toISOString(),
      });
      
      res.json(bot);
    } catch (error) {
      res.status(500).json({ error: "Failed to pause bot" });
    }
  });

  app.post("/api/bots/:id/stop", async (req, res) => {
    try {
      const bot = await storage.updateBot(req.params.id, { status: "stopped" });
      if (!bot) {
        return res.status(404).json({ error: "Bot not found" });
      }
      
      await storage.addExecutionLog({
        botId: bot.id,
        botName: bot.name,
        action: "Bot Stopped",
        details: `Bot "${bot.name}" has been stopped`,
        status: "info",
        timestamp: new Date().toISOString(),
      });
      
      res.json(bot);
    } catch (error) {
      res.status(500).json({ error: "Failed to stop bot" });
    }
  });

  app.delete("/api/bots/:id", async (req, res) => {
    try {
      const bot = await storage.getBot(req.params.id);
      if (!bot) {
        return res.status(404).json({ error: "Bot not found" });
      }
      
      const deleted = await storage.deleteBot(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Bot not found" });
      }
      
      await storage.addExecutionLog({
        botId: req.params.id,
        botName: bot.name,
        action: "Bot Deleted",
        details: `Bot "${bot.name}" has been deleted`,
        status: "info",
        timestamp: new Date().toISOString(),
      });
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete bot" });
    }
  });

  // Trades
  app.get("/api/trades", async (_req, res) => {
    try {
      const trades = await storage.getTrades();
      res.json(trades);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trades" });
    }
  });

  // Positions
  app.get("/api/positions", async (_req, res) => {
    try {
      const positions = await storage.getPositions();
      res.json(positions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch positions" });
    }
  });

  // ============ ADVANCED TRADING ENDPOINTS ============

  // Kelly Criterion Calculator
  app.post("/api/trading/kelly", async (req, res) => {
    try {
      const parsed = kellyInputSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid input", details: parsed.error.errors });
      }
      const result = kellyCalculator.calculateKelly(parsed.data);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to calculate Kelly" });
    }
  });

  app.get("/api/trading/kelly/metrics", async (_req, res) => {
    try {
      const metrics = kellyCalculator.calculateHistoricalMetrics();
      const optimalFraction = kellyCalculator.calculateOptimalFraction();
      res.json({ metrics, optimalFraction });
    } catch (error) {
      res.status(500).json({ error: "Failed to get Kelly metrics" });
    }
  });

  // Spike Detection
  app.get("/api/trading/spikes", async (_req, res) => {
    try {
      const spikes = spikeDetector.getRecentSpikes();
      res.json(spikes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch spikes" });
    }
  });

  app.post("/api/trading/spikes/scan", async (req, res) => {
    try {
      const markets = await storage.getMarkets();
      const settings: SpikeSettings = {
        spikeThreshold: req.body.spikeThreshold || 0.02,
        positionSize: req.body.positionSize || 5,
        takeProfitPercent: req.body.takeProfitPercent || 0.03,
        stopLossPercent: req.body.stopLossPercent || 0.02,
        pollIntervalMs: req.body.pollIntervalMs || 1000,
        priceHistoryWindow: req.body.priceHistoryWindow || 30,
        targetMarkets: req.body.targetMarkets || [],
        autoExecute: req.body.autoExecute || false,
        cooldownMs: req.body.cooldownMs || 30000,
      };
      const spikes = spikeDetector.analyzeMarkets(markets, settings);
      res.json({ spikes, scannedMarkets: markets.length });
    } catch (error) {
      res.status(500).json({ error: "Failed to scan for spikes" });
    }
  });

  app.get("/api/trading/spikes/history/:marketId", async (req, res) => {
    try {
      const history = spikeDetector.getPriceHistory(req.params.marketId);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch price history" });
    }
  });

  // Arbitrage Scanner
  app.get("/api/trading/arbitrage", async (_req, res) => {
    try {
      const opportunities = arbitrageScanner.getActiveOpportunities();
      res.json(opportunities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch arbitrage opportunities" });
    }
  });

  app.post("/api/trading/arbitrage/scan", async (_req, res) => {
    try {
      const markets = await storage.getMarkets();
      const binary = arbitrageScanner.scanBinaryArbitrage(markets);
      const multiMarket = arbitrageScanner.scanMultiMarketArbitrage(markets);
      res.json({ 
        binary, 
        multiMarket, 
        total: binary.length + multiMarket.length,
        scannedMarkets: markets.length 
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to scan for arbitrage" });
    }
  });

  app.get("/api/trading/arbitrage/cross-platform", async (_req, res) => {
    try {
      const markets = await storage.getMarkets();
      const comparison = arbitrageScanner.simulateCrossPlatformPrices(markets);
      res.json(comparison);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cross-platform prices" });
    }
  });

  app.post("/api/trading/arbitrage/:id/execute", async (req, res) => {
    try {
      arbitrageScanner.markExecuted(req.params.id);
      await storage.addExecutionLog({
        botId: "arbitrage-scanner",
        botName: "Arbitrage Scanner",
        action: "Arbitrage Executed",
        details: `Executed arbitrage opportunity ${req.params.id}`,
        status: "success",
        timestamp: new Date().toISOString(),
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to execute arbitrage" });
    }
  });

  // Backtesting
  app.post("/api/trading/backtest", async (req, res) => {
    try {
      const parsed = backtestConfigSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid config", details: parsed.error.errors });
      }
      const markets = await storage.getMarkets();
      const days = req.body.days || 30;
      const historicalData = backtestingEngine.generateMockHistoricalData(markets, days);
      const result = await backtestingEngine.runBacktest(parsed.data, historicalData);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to run backtest" });
    }
  });

  app.get("/api/trading/backtest/results", async (_req, res) => {
    try {
      const results = backtestingEngine.getResults();
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch backtest results" });
    }
  });

  app.get("/api/trading/backtest/:id", async (req, res) => {
    try {
      const result = backtestingEngine.getResult(req.params.id);
      if (!result) {
        return res.status(404).json({ error: "Backtest not found" });
      }
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch backtest result" });
    }
  });

  // Risk Management
  app.get("/api/trading/risk/metrics", async (_req, res) => {
    try {
      const positions = await storage.getPositions();
      const bankroll = 10000;
      const metrics = riskManager.calculateMetrics(positions, bankroll);
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to calculate risk metrics" });
    }
  });

  app.get("/api/trading/risk/limits", async (_req, res) => {
    try {
      const limits = riskManager.getLimits();
      res.json(limits);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch risk limits" });
    }
  });

  app.post("/api/trading/risk/limits", async (req, res) => {
    try {
      riskManager.setLimits(req.body);
      const limits = riskManager.getLimits();
      await storage.addExecutionLog({
        botId: "risk-manager",
        botName: "Risk Manager",
        action: "Limits Updated",
        details: `Updated risk limits: ${JSON.stringify(limits)}`,
        status: "info",
        timestamp: new Date().toISOString(),
      });
      res.json(limits);
    } catch (error) {
      res.status(500).json({ error: "Failed to update risk limits" });
    }
  });

  app.post("/api/trading/risk/validate", async (req, res) => {
    try {
      const { positionSize, bankroll } = req.body;
      const positions = await storage.getPositions();
      const validation = riskManager.validatePosition(positionSize, bankroll, positions);
      res.json(validation);
    } catch (error) {
      res.status(500).json({ error: "Failed to validate position" });
    }
  });

  app.get("/api/trading/risk/daily-pnl", async (_req, res) => {
    try {
      const dailyPnL = riskManager.getDailyPnL();
      const tradingAllowed = riskManager.isTradingAllowed();
      res.json({ dailyPnL, tradingAllowed });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch daily P&L" });
    }
  });

  app.post("/api/trading/risk/reset-daily", async (_req, res) => {
    try {
      riskManager.resetDailyPnL();
      res.json({ success: true, message: "Daily P&L reset" });
    } catch (error) {
      res.status(500).json({ error: "Failed to reset daily P&L" });
    }
  });

  // ============ NEWS INTELLIGENCE ENDPOINTS ============

  // Fetch latest news
  app.get("/api/news", async (req, res) => {
    try {
      const { sources, keywords, categories, lookbackHours } = req.query;
      
      const options: {
        sources?: string[];
        keywords?: string[];
        categories?: string[];
        lookbackHours?: number;
      } = {};

      if (sources) options.sources = String(sources).split(",");
      if (keywords) options.keywords = String(keywords).split(",");
      if (categories) options.categories = String(categories).split(",");
      if (lookbackHours) options.lookbackHours = parseInt(String(lookbackHours));

      const articles = await newsScraper.fetchNews(options);
      res.json(articles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch news" });
    }
  });

  // Get latest headlines
  app.get("/api/news/headlines", async (req, res) => {
    try {
      const limit = parseInt(String(req.query.limit || "10"));
      const headlines = await newsScraper.getLatestHeadlines(limit);
      res.json(headlines);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch headlines" });
    }
  });

  // Get high importance news
  app.get("/api/news/important", async (_req, res) => {
    try {
      const articles = await newsScraper.getHighImportanceNews();
      res.json(articles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch important news" });
    }
  });

  // Get available news sources
  app.get("/api/news/sources", async (_req, res) => {
    try {
      const sources = newsScraper.getAvailableSources();
      res.json(sources);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sources" });
    }
  });

  // Analyze a specific news article
  app.post("/api/news/analyze", async (req, res) => {
    try {
      const { article } = req.body;
      if (!article) {
        return res.status(400).json({ error: "Article required" });
      }
      const analysis = await newsAnalyzer.analyzeArticle(article);
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ error: "Failed to analyze article" });
    }
  });

  // Analyze multiple articles for aggregate sentiment
  app.post("/api/news/analyze-batch", async (req, res) => {
    try {
      const { articles } = req.body;
      if (!articles || !Array.isArray(articles)) {
        return res.status(400).json({ error: "Articles array required" });
      }
      const result = await newsAnalyzer.analyzeMultiple(articles);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to analyze articles" });
    }
  });

  // Detect correlations between news and markets
  app.post("/api/news/correlations", async (req, res) => {
    try {
      const { article, analysis } = req.body;
      if (!article || !analysis) {
        return res.status(400).json({ error: "Article and analysis required" });
      }
      
      // Get current markets and set them in the detector
      const markets = await storage.getMarkets();
      correlationDetector.setMarkets(markets);
      
      const correlations = await correlationDetector.detectCorrelations(article, analysis);
      res.json(correlations);
    } catch (error) {
      res.status(500).json({ error: "Failed to detect correlations" });
    }
  });

  // Get recent correlations
  app.get("/api/news/correlations", async (req, res) => {
    try {
      const limit = parseInt(String(req.query.limit || "20"));
      const correlations = correlationDetector.getRecentCorrelations(limit);
      res.json(correlations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch correlations" });
    }
  });

  // Generate trading signal from correlations
  app.post("/api/news/signal", async (req, res) => {
    try {
      const { correlations, maxPositionSize } = req.body;
      if (!correlations || !Array.isArray(correlations)) {
        return res.status(400).json({ error: "Correlations array required" });
      }
      
      const signal = correlationDetector.generateSignal(correlations, maxPositionSize || 100);
      if (!signal) {
        return res.status(200).json({ message: "No actionable signal generated" });
      }
      
      await storage.addExecutionLog({
        botId: "news-intelligence",
        botName: "News Intelligence",
        action: "Signal Generated",
        details: `${signal.suggestedAction.toUpperCase()}: ${signal.targetMarket.question.slice(0, 50)}... (confidence: ${(signal.aggregateConfidence * 100).toFixed(0)}%)`,
        status: "info",
        timestamp: new Date().toISOString(),
      });
      
      res.json(signal);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate signal" });
    }
  });

  // Get active signals
  app.get("/api/news/signals", async (_req, res) => {
    try {
      correlationDetector.cleanupExpiredSignals();
      const signals = correlationDetector.getActiveSignals();
      res.json(signals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch signals" });
    }
  });

  // Get known correlation patterns
  app.get("/api/news/patterns", async (_req, res) => {
    try {
      const patterns = correlationDetector.getKnownPatterns();
      res.json(patterns);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch patterns" });
    }
  });

  // Full news scan: fetch, analyze, correlate, and generate signals
  app.post("/api/news/scan", async (req, res) => {
    try {
      const { sources, keywords, categories, lookbackHours, maxPositionSize } = req.body;

      // Step 1: Fetch news
      const articles = await newsScraper.fetchNews({
        sources: sources || ["reuters", "bloomberg", "coindesk"],
        keywords: keywords || [],
        categories: categories || ["crypto", "politics", "economics"],
        lookbackHours: lookbackHours || 24,
      });

      if (articles.length === 0) {
        return res.json({ articles: [], analyses: [], correlations: [], signals: [] });
      }

      // Step 2: Analyze articles
      const analysisResult = await newsAnalyzer.analyzeMultiple(articles);

      // Step 3: Get markets and detect correlations
      const markets = await storage.getMarkets();
      correlationDetector.setMarkets(markets);

      const allCorrelations = [];
      for (let i = 0; i < articles.length; i++) {
        const correlations = await correlationDetector.detectCorrelations(
          articles[i],
          analysisResult.analyses[i]
        );
        allCorrelations.push(...correlations);
      }

      // Step 4: Generate signals
      const signals = [];
      if (allCorrelations.length > 0) {
        const signal = correlationDetector.generateSignal(allCorrelations, maxPositionSize || 100);
        if (signal) {
          signals.push(signal);
          
          await storage.addExecutionLog({
            botId: "news-intelligence",
            botName: "News Intelligence",
            action: "News Scan Complete",
            details: `Analyzed ${articles.length} articles, found ${allCorrelations.length} correlations, generated ${signals.length} signal(s)`,
            status: "success",
            timestamp: new Date().toISOString(),
          });
        }
      }

      res.json({
        articles: articles.slice(0, 10),
        analyses: analysisResult,
        correlations: allCorrelations.slice(0, 20),
        signals,
      });
    } catch (error) {
      console.error("News scan error:", error);
      res.status(500).json({ error: "Failed to complete news scan" });
    }
  });

  return httpServer;
}
