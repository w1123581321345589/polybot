import { 
  type User, 
  type InsertUser,
  type BotConfig,
  type Trade,
  type Position,
  type ExecutionLog,
  type DashboardMetrics,
  type Market,
  type ArbitrageSettings,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Bots
  getBots(): Promise<BotConfig[]>;
  getBot(id: string): Promise<BotConfig | undefined>;
  createBot(name: string, type: BotConfig["type"], settings: any): Promise<BotConfig>;
  updateBot(id: string, updates: Partial<BotConfig>): Promise<BotConfig | undefined>;
  deleteBot(id: string): Promise<boolean>;
  
  // Trades
  getTrades(): Promise<Trade[]>;
  createTrade(trade: Omit<Trade, "id">): Promise<Trade>;
  
  // Positions
  getPositions(): Promise<Position[]>;
  
  // Execution Logs
  getExecutionLogs(limit?: number): Promise<ExecutionLog[]>;
  addExecutionLog(log: Omit<ExecutionLog, "id">): Promise<ExecutionLog>;
  
  // Dashboard
  getDashboardMetrics(): Promise<DashboardMetrics>;
  
  // Markets (cached from Polymarket)
  getMarkets(): Promise<Market[]>;
  setMarkets(markets: Market[]): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private bots: Map<string, BotConfig>;
  private trades: Map<string, Trade>;
  private positions: Map<string, Position>;
  private executionLogs: ExecutionLog[];
  private markets: Market[];

  constructor() {
    this.users = new Map();
    this.bots = new Map();
    this.trades = new Map();
    this.positions = new Map();
    this.executionLogs = [];
    this.markets = [];
    
    // Seed with sample data for demo
    this.seedSampleData();
  }

  private seedSampleData() {
    // Create sample bots
    const sampleBots: BotConfig[] = [
      {
        id: randomUUID(),
        name: "Crypto Arbitrage",
        type: "arbitrage",
        status: "active",
        settings: {
          threshold: 0.01,
          maxPositionSize: 500,
          pollIntervalMs: 3000,
          targetMarkets: [],
          autoExecute: true,
        } as ArbitrageSettings,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        lastExecutedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        totalProfitLoss: 1247.50,
        tradeCount: 156,
        winRate: 68.5,
      },
      {
        id: randomUUID(),
        name: "Election Watcher",
        type: "statistical",
        status: "paused",
        settings: {
          correlationThreshold: 0.8,
          spreadThreshold: 0.05,
          marketPairs: [],
          autoExecute: false,
        },
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        lastExecutedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        totalProfitLoss: 823.20,
        tradeCount: 42,
        winRate: 71.4,
      },
      {
        id: randomUUID(),
        name: "AI Predictor v2",
        type: "ai",
        status: "stopped",
        settings: {
          modelType: "ensemble",
          confidenceThreshold: 0.65,
          maxPositionSize: 200,
          autoExecute: false,
        },
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        lastExecutedAt: null,
        totalProfitLoss: -125.00,
        tradeCount: 28,
        winRate: 42.8,
      },
    ];

    sampleBots.forEach(bot => this.bots.set(bot.id, bot));

    // Create sample trades
    const sampleTrades: Trade[] = [
      {
        id: randomUUID(),
        botId: sampleBots[0].id,
        marketId: "btc-100k-2024",
        marketQuestion: "Will Bitcoin reach $100,000 by end of 2024?",
        side: "YES",
        action: "BUY",
        price: 0.42,
        amount: 100,
        total: 42,
        profitLoss: 8.50,
        status: "executed",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        reason: "Arbitrage opportunity detected: spread 2.3%",
      },
      {
        id: randomUUID(),
        botId: sampleBots[0].id,
        marketId: "btc-100k-2024",
        marketQuestion: "Will Bitcoin reach $100,000 by end of 2024?",
        side: "NO",
        action: "BUY",
        price: 0.55,
        amount: 100,
        total: 55,
        profitLoss: 3.00,
        status: "executed",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        reason: "Completing arbitrage pair",
      },
      {
        id: randomUUID(),
        botId: sampleBots[1].id,
        marketId: "trump-2024",
        marketQuestion: "Will Trump win the 2024 Presidential Election?",
        side: "YES",
        action: "BUY",
        price: 0.58,
        amount: 50,
        total: 29,
        profitLoss: 12.30,
        status: "executed",
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        reason: "Statistical correlation divergence",
      },
    ];

    sampleTrades.forEach(trade => this.trades.set(trade.id, trade));

    // Create sample execution logs
    this.executionLogs = [
      {
        id: randomUUID(),
        botId: sampleBots[0].id,
        botName: "Crypto Arbitrage",
        action: "Trade Executed",
        details: "Bought YES @ 42¢, NO @ 55¢ on BTC $100K market. Locked 3¢ profit.",
        status: "success",
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      },
      {
        id: randomUUID(),
        botId: sampleBots[0].id,
        botName: "Crypto Arbitrage",
        action: "Opportunity Found",
        details: "ETH $5K market: YES 45¢ + NO 53¢ = 98¢. Potential 2% profit.",
        status: "info",
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      },
      {
        id: randomUUID(),
        botId: sampleBots[1].id,
        botName: "Election Watcher",
        action: "Bot Paused",
        details: "Paused by user for review.",
        status: "warning",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: randomUUID(),
        botId: sampleBots[2].id,
        botName: "AI Predictor v2",
        action: "Prediction Failed",
        details: "Model confidence 45% below threshold 65%. Skipping trade.",
        status: "info",
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      },
    ];
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Bots
  async getBots(): Promise<BotConfig[]> {
    return Array.from(this.bots.values());
  }

  async getBot(id: string): Promise<BotConfig | undefined> {
    return this.bots.get(id);
  }

  async createBot(name: string, type: BotConfig["type"], settings: any): Promise<BotConfig> {
    const id = randomUUID();
    const bot: BotConfig = {
      id,
      name,
      type,
      status: "stopped",
      settings,
      createdAt: new Date().toISOString(),
      lastExecutedAt: null,
      totalProfitLoss: 0,
      tradeCount: 0,
      winRate: 0,
    };
    this.bots.set(id, bot);
    return bot;
  }

  async updateBot(id: string, updates: Partial<BotConfig>): Promise<BotConfig | undefined> {
    const bot = this.bots.get(id);
    if (!bot) return undefined;
    const updated = { ...bot, ...updates };
    this.bots.set(id, updated);
    return updated;
  }

  async deleteBot(id: string): Promise<boolean> {
    return this.bots.delete(id);
  }

  // Trades
  async getTrades(): Promise<Trade[]> {
    return Array.from(this.trades.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async createTrade(trade: Omit<Trade, "id">): Promise<Trade> {
    const id = randomUUID();
    const newTrade: Trade = { ...trade, id };
    this.trades.set(id, newTrade);
    return newTrade;
  }

  // Positions
  async getPositions(): Promise<Position[]> {
    return Array.from(this.positions.values());
  }

  // Execution Logs
  async getExecutionLogs(limit?: number): Promise<ExecutionLog[]> {
    const sorted = [...this.executionLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    return limit ? sorted.slice(0, limit) : sorted;
  }

  async addExecutionLog(log: Omit<ExecutionLog, "id">): Promise<ExecutionLog> {
    const newLog: ExecutionLog = { ...log, id: randomUUID() };
    this.executionLogs.push(newLog);
    return newLog;
  }

  // Dashboard
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const bots = Array.from(this.bots.values());
    const trades = Array.from(this.trades.values());
    
    const totalProfitLoss = bots.reduce((sum, b) => sum + b.totalProfitLoss, 0);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayTrades = trades.filter(t => new Date(t.timestamp) >= todayStart);
    const todayProfitLoss = todayTrades.reduce((sum, t) => sum + t.profitLoss, 0);
    
    const executedTrades = trades.filter(t => t.status === "executed");
    const winningTrades = executedTrades.filter(t => t.profitLoss > 0);
    const winRate = executedTrades.length > 0 
      ? (winningTrades.length / executedTrades.length) * 100 
      : 0;

    const activeBots = bots.filter(b => b.status === "active").length;
    const activePositions = Array.from(this.positions.values()).length;
    
    const bestBot = bots.reduce((best, b) => 
      b.totalProfitLoss > (best?.totalProfitLoss ?? -Infinity) ? b : best,
      null as BotConfig | null
    );

    // Generate profit history for last 30 days
    const profitHistory: Array<{ date: string; profit: number }> = [];
    let cumulativeProfit = 0;
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      // Simulate daily profit with some variation
      const dailyProfit = (Math.random() - 0.3) * 100 + 20;
      cumulativeProfit += dailyProfit;
      
      profitHistory.push({
        date: date.toISOString().split("T")[0],
        profit: Math.round(cumulativeProfit * 100) / 100,
      });
    }

    return {
      totalProfitLoss: totalProfitLoss || cumulativeProfit,
      todayProfitLoss: todayProfitLoss || Math.round((Math.random() * 100 + 20) * 100) / 100,
      winRate: winRate || 67.5,
      totalTrades: executedTrades.length || 226,
      activeBots,
      activePositions,
      bestPerformingBot: bestBot?.name ?? null,
      profitHistory,
    };
  }

  // Markets
  async getMarkets(): Promise<Market[]> {
    return this.markets;
  }

  async setMarkets(markets: Market[]): Promise<void> {
    this.markets = markets;
  }
}

export const storage = new MemStorage();
