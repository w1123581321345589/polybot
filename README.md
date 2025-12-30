# PolyBot - Polymarket Trading Bot Platform

A comprehensive web-based trading bot platform for [Polymarket](https://polymarket.com) prediction markets. Create, configure, and monitor automated trading bots with real-time market data, advanced trading tools, and professional-grade analytics.

## Features

### 7 Automated Trading Strategies

- **Arbitrage Detection** - Find YES+NO binary mispricings for risk-free profits
- **Statistical Arbitrage** - Trade based on statistical price deviations and mean reversion
- **AI Probability Models** - Leverage AI-powered probability predictions
- **Spread Farming** - Profit from bid-ask spread differences
- **Copy Trading** - Mirror successful trader strategies
- **Spike Hunting** - Trade rapid price movements for quick mean-reversion profits
- **News Intelligence** - Claude AI-powered news analysis with market correlation detection

### News Intelligence Bot

The News Intelligence Bot monitors news sources 24/7 to predict Polymarket movements before the market reacts:

- **Multi-Source Monitoring** - Reuters, Bloomberg, CoinDesk, CoinTelegraph, The Block
- **Claude AI Analysis** - Intelligent sentiment and fundamental analysis using Anthropic's Claude
- **Market Correlation** - Automatically matches news to relevant Polymarket markets
- **Known Patterns** - SEC announcements → crypto, Fed decisions → risk assets, Elon tweets → DOGE
- **Trading Signals** - Generates actionable buy/sell signals with confidence scoring
- **4-Hour Signal Expiry** - Time-sensitive signals that reflect market reaction windows

### Advanced Trading Tools

- **Kelly Criterion Calculator** - Optimal position sizing based on edge and bankroll
- **Arbitrage Scanner** - Real-time binary and cross-platform arbitrage detection
- **Spike Detector** - Monitor price movements across all markets
- **Backtesting Engine** - Test strategies against historical data with equity curves
- **Risk Management** - Portfolio exposure limits, daily P&L tracking, and trading halts

### Real-Time Dashboard

- Live market data from Polymarket API
- Bot performance metrics and execution logs
- Portfolio analytics with Sharpe ratio, max drawdown, and win rates
- Dark/light theme support

## Current Status

| Feature | Status | Notes |
|---------|--------|-------|
| 7 Bot Types | Built | All strategies implemented with configuration UI |
| News Intelligence | Built | Claude AI-powered analysis, demo news data |
| Trading Tools | Built | Kelly, arbitrage, spikes, backtesting, risk |
| Dashboard & UI | Built | Full responsive UI with dark/light mode |
| Data Storage | In-Memory | PostgreSQL ready, just needs activation |
| Trade Execution | Detection Only | Would need Polymarket CLOB API for live trading |
| Authentication | Not Built | No user login system yet |
| Notifications | Not Built | No email/push alerts yet |

## Tech Stack

### Frontend
- React 18 with TypeScript
- TanStack Query for server state management
- shadcn/ui component library (Radix UI primitives)
- Tailwind CSS with theme support
- Recharts for data visualization
- Wouter for client-side routing

### Backend
- Node.js with Express
- TypeScript (ESM modules)
- Drizzle ORM with PostgreSQL
- Zod schema validation
- RESTful API design

### AI Integration
- Anthropic Claude (via Replit AI Integrations)
- Sentiment and fundamental news analysis
- Automatic fallback to keyword-based analysis

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (optional - uses in-memory storage by default)

### Installation

```bash
# Clone the repository
git clone https://github.com/nicholasb4711/PolyBot.git
cd PolyBot

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5000`

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | No (uses in-memory storage) |
| `SESSION_SECRET` | Session encryption key | Yes |
| `AI_INTEGRATIONS_ANTHROPIC_API_KEY` | Claude API key (via Replit) | Auto-configured |
| `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` | Claude API URL (via Replit) | Auto-configured |

## API Endpoints

### Bots
- `GET /api/bots` - List all bots
- `POST /api/bots` - Create new bot
- `GET /api/bots/:id` - Get bot details
- `PATCH /api/bots/:id` - Update bot
- `DELETE /api/bots/:id` - Delete bot
- `POST /api/bots/:id/start` - Start bot
- `POST /api/bots/:id/stop` - Stop bot

### Markets
- `GET /api/markets` - Fetch Polymarket markets
- `POST /api/markets/refresh` - Refresh market data

### Trading Tools
- `POST /api/trading/kelly` - Calculate Kelly Criterion position size
- `GET /api/trading/spikes` - Get detected price spikes
- `GET /api/trading/arbitrage/binary` - Scan for binary arbitrage
- `GET /api/trading/arbitrage/cross-platform` - Scan cross-platform opportunities
- `POST /api/trading/backtest` - Run strategy backtest
- `GET /api/trading/risk/metrics` - Get portfolio risk metrics
- `POST /api/trading/risk/limits` - Update risk limits

### News Intelligence
- `POST /api/news/scan` - Full news scan pipeline (fetch → analyze → correlate → signal)
- `GET /api/news/headlines` - Get latest news headlines
- `GET /api/news/signals` - Get active trading signals
- `GET /api/news/correlations` - Get news-market correlations
- `GET /api/news/patterns` - Get known correlation patterns
- `POST /api/news/analyze` - Analyze a single article with Claude

## Project Structure

```
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities and query client
│   │   └── pages/          # Page components (including news.tsx)
├── server/                 # Backend Express server
│   ├── trading/            # Trading strategy modules
│   │   ├── kelly-criterion.ts
│   │   ├── spike-detector.ts
│   │   ├── arbitrage-scanner.ts
│   │   ├── backtesting-engine.ts
│   │   ├── risk-manager.ts
│   │   ├── news-scraper.ts      # News source monitoring
│   │   ├── news-analyzer.ts     # Claude AI analysis
│   │   └── correlation-detector.ts  # Market correlation
│   ├── routes.ts           # API endpoints
│   └── storage.ts          # Data storage layer
└── shared/                 # Shared TypeScript types
    └── schema.ts           # Database schema and types
```

## Bot Configuration

Each bot type has specific configuration options:

### News Intelligence Settings
- `sources` - News sources to monitor (reuters, bloomberg, coindesk, etc.)
- `categories` - Categories to track (crypto, politics, economics, sports)
- `correlationThreshold` - Minimum news-market match score (0.1-1.0)
- `confidenceThreshold` - Minimum AI confidence for signals (0.1-1.0)
- `lookbackHours` - How far back to scan for news
- `pollIntervalMs` - How often to scan for new articles

### Spike Hunter Settings
- `spikeThreshold` - Minimum price change to trigger (0.01-0.50)
- `positionSize` - Size per trade in dollars
- `takeProfitPercent` - Take profit percentage
- `stopLossPercent` - Stop loss percentage
- `cooldownMinutes` - Wait time between trades

### Arbitrage Bot Settings
- `threshold` - Minimum spread for opportunity
- `maxPositionSize` - Maximum position size
- `autoExecute` - Automatically execute trades

## Future Enhancements

- [ ] Connect to real news APIs (RSS feeds, news services)
- [ ] Integrate Polymarket CLOB API for live trade execution
- [ ] Enable PostgreSQL for persistent data storage
- [ ] Add user authentication system
- [ ] Implement email/push notifications for signals
- [ ] Train ML models for AI probability bot
- [ ] Add whale wallet tracking for copy trading

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Disclaimer

This software is for educational purposes only. Trading prediction markets involves significant risk. Past performance does not guarantee future results. Always trade responsibly and never risk more than you can afford to lose.
