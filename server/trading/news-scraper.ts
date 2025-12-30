import type { NewsArticle } from "@shared/schema";

interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  creator?: string;
}

// News source configurations with RSS feeds
const NEWS_SOURCES = {
  reuters: {
    name: "Reuters",
    feeds: [
      "https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best",
      "https://www.reutersagency.com/feed/?best-topics=tech&post_type=best",
    ],
    category: "general",
  },
  coindesk: {
    name: "CoinDesk",
    feeds: [
      "https://www.coindesk.com/arc/outboundfeeds/rss/",
    ],
    category: "crypto",
  },
  cointelegraph: {
    name: "CoinTelegraph",
    feeds: [
      "https://cointelegraph.com/rss",
    ],
    category: "crypto",
  },
  theblock: {
    name: "The Block",
    feeds: [
      "https://www.theblock.co/rss.xml",
    ],
    category: "crypto",
  },
};

// Simulated news cache (in production, this would use real RSS parsing)
const newsCache: Map<string, NewsArticle[]> = new Map();
let lastFetch: number = 0;

// Generate realistic demo news based on current trends
function generateDemoNews(): NewsArticle[] {
  const now = new Date();
  
  const demoArticles: NewsArticle[] = [
    {
      id: `news-${Date.now()}-1`,
      source: "reuters",
      title: "SEC Delays Decision on Spot Bitcoin ETF Applications",
      summary: "The Securities and Exchange Commission has postponed its ruling on several pending spot Bitcoin ETF applications, citing need for additional public comment.",
      content: "The Securities and Exchange Commission announced today it will delay decisions on multiple spot Bitcoin ETF applications. The regulator requested additional public comments on market manipulation concerns and custody arrangements. Industry analysts expect a final decision by Q2 2025.",
      url: "https://reuters.com/markets/crypto-sec-etf",
      publishedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      author: "Financial Desk",
      category: "crypto",
      keywords: ["SEC", "bitcoin", "ETF", "regulation", "cryptocurrency"],
      sentiment: "bearish",
      importance: "high",
    },
    {
      id: `news-${Date.now()}-2`,
      source: "bloomberg",
      title: "Federal Reserve Signals Potential Rate Cut in Q1",
      summary: "Fed officials indicate openness to lowering interest rates if inflation continues to cool, boosting risk asset sentiment.",
      content: "Federal Reserve Chair Jerome Powell suggested in today's FOMC meeting that the central bank remains data-dependent but sees conditions that could warrant rate reductions in early 2025. Markets rallied on the news, with crypto assets seeing significant inflows.",
      url: "https://bloomberg.com/fed-rate-cut",
      publishedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
      author: "Economics Team",
      category: "economics",
      keywords: ["Federal Reserve", "interest rates", "inflation", "monetary policy"],
      sentiment: "bullish",
      importance: "high",
    },
    {
      id: `news-${Date.now()}-3`,
      source: "coindesk",
      title: "Bitcoin Volatility Spikes as Whale Moves $500M to Exchanges",
      summary: "Large Bitcoin holder transfers significant holdings to major exchanges, signaling potential sell pressure.",
      content: "On-chain analysts detected a transfer of approximately 5,200 BTC worth over $500 million from a dormant wallet to Coinbase and Binance. This pattern historically precedes significant price movements. Traders are positioning for increased volatility.",
      url: "https://coindesk.com/whale-movement",
      publishedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
      author: "Markets Reporter",
      category: "crypto",
      keywords: ["bitcoin", "whale", "volatility", "exchange", "selling pressure"],
      sentiment: "bearish",
      importance: "high",
    },
    {
      id: `news-${Date.now()}-4`,
      source: "theblock",
      title: "Trump Administration Considering Crypto-Friendly Treasury Pick",
      summary: "Sources indicate potential Treasury Secretary nominee has favorable views on digital assets.",
      content: "Multiple sources close to the transition team report that the incoming administration is considering candidates for Treasury Secretary with demonstrated support for cryptocurrency adoption. Markets are interpreting this as bullish for the broader digital asset ecosystem.",
      url: "https://theblock.co/trump-treasury",
      publishedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
      author: "Policy Desk",
      category: "politics",
      keywords: ["Trump", "Treasury", "regulation", "crypto-friendly", "administration"],
      sentiment: "bullish",
      importance: "high",
    },
    {
      id: `news-${Date.now()}-5`,
      source: "cointelegraph",
      title: "Elon Musk Tweets About Dogecoin Integration Plans",
      summary: "Tesla CEO hints at potential payment integration for DOGE, sending meme coin surging.",
      content: "Elon Musk posted on X/Twitter suggesting Tesla may accept Dogecoin for vehicle purchases in 2025. DOGE price jumped 15% within minutes of the post. Polymarket prediction markets for DOGE price targets saw immediate repricing.",
      url: "https://cointelegraph.com/musk-doge",
      publishedAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
      author: "Crypto News",
      category: "crypto",
      keywords: ["Elon Musk", "Dogecoin", "Tesla", "Twitter", "meme coin"],
      sentiment: "bullish",
      importance: "medium",
    },
    {
      id: `news-${Date.now()}-6`,
      source: "reuters",
      title: "China Announces New Tariff Measures on US Goods",
      summary: "Beijing retaliates with 25% tariffs on $50B of American imports, escalating trade tensions.",
      content: "The Chinese Ministry of Commerce announced retaliatory tariffs effective next month, targeting agricultural products, automobiles, and technology components. Analysts warn this could impact global supply chains and corporate earnings.",
      url: "https://reuters.com/china-tariffs",
      publishedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
      author: "Asia Bureau",
      category: "economics",
      keywords: ["China", "tariffs", "trade war", "imports", "geopolitics"],
      sentiment: "bearish",
      importance: "high",
    },
    {
      id: `news-${Date.now()}-7`,
      source: "bloomberg",
      title: "Super Bowl Betting Markets Show Chiefs as Heavy Favorites",
      summary: "Prediction markets and sportsbooks align on Kansas City Chiefs odds heading into playoffs.",
      content: "With playoff seeding nearly locked in, prediction markets are pricing the Kansas City Chiefs as favorites to win Super Bowl LIX. Polymarket shows YES at 32 cents compared to 15 cents for the closest competitor.",
      url: "https://bloomberg.com/super-bowl-odds",
      publishedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
      author: "Sports Business",
      category: "sports",
      keywords: ["Super Bowl", "Chiefs", "NFL", "betting", "odds"],
      sentiment: "neutral",
      importance: "medium",
    },
  ];

  return demoArticles;
}

class NewsScraper {
  private articles: NewsArticle[] = [];
  private lastUpdate: number = 0;
  private updateInterval = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.refreshNews();
  }

  async refreshNews(): Promise<void> {
    const now = Date.now();
    if (now - this.lastUpdate < this.updateInterval) {
      return;
    }

    // In production, this would parse actual RSS feeds
    // For demo, we use generated realistic news
    this.articles = generateDemoNews();
    this.lastUpdate = now;
  }

  async fetchNews(options: {
    sources?: string[];
    keywords?: string[];
    categories?: string[];
    lookbackHours?: number;
  } = {}): Promise<NewsArticle[]> {
    await this.refreshNews();

    let filtered = [...this.articles];

    // Filter by source
    if (options.sources && options.sources.length > 0) {
      filtered = filtered.filter(a => options.sources!.includes(a.source));
    }

    // Filter by keywords
    if (options.keywords && options.keywords.length > 0) {
      const lowerKeywords = options.keywords.map(k => k.toLowerCase());
      filtered = filtered.filter(article => {
        const textToSearch = `${article.title} ${article.summary} ${article.content}`.toLowerCase();
        return lowerKeywords.some(keyword => textToSearch.includes(keyword));
      });
    }

    // Filter by category
    if (options.categories && options.categories.length > 0) {
      filtered = filtered.filter(a => options.categories!.includes(a.category));
    }

    // Filter by lookback time
    if (options.lookbackHours) {
      const cutoff = Date.now() - options.lookbackHours * 60 * 60 * 1000;
      filtered = filtered.filter(a => new Date(a.publishedAt).getTime() > cutoff);
    }

    // Sort by publish date (newest first)
    filtered.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    return filtered;
  }

  async getLatestHeadlines(limit: number = 10): Promise<NewsArticle[]> {
    await this.refreshNews();
    return this.articles.slice(0, limit);
  }

  async getHighImportanceNews(): Promise<NewsArticle[]> {
    await this.refreshNews();
    return this.articles.filter(a => a.importance === "high");
  }

  getAvailableSources(): string[] {
    return Object.keys(NEWS_SOURCES);
  }

  getSourceInfo(sourceId: string) {
    return NEWS_SOURCES[sourceId as keyof typeof NEWS_SOURCES];
  }
}

export const newsScraper = new NewsScraper();
