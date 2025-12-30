# PolyBot - Polymarket Trading Bot Platform

## Overview

PolyBot is a web-based trading bot platform for Polymarket prediction markets. The application enables users to create, configure, and monitor automated trading bots that execute various strategies including arbitrage detection, statistical arbitrage, AI-powered predictions, spread farming, copy trading, spike hunting, and NEWS INTELLIGENCE. The platform provides real-time market data, execution logs, performance metrics, advanced trading tools (Kelly Criterion calculator, arbitrage scanner, spike detector), backtesting, risk management, and a dashboard for monitoring trading activity. The News Intelligence Bot monitors news sources (Reuters, Bloomberg, CoinDesk, etc.), extracts expert forecasts with AI analysis, and connects news to Polymarket markets for automated trading signals.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state, with automatic refetching for real-time data
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Charts**: Recharts for performance visualization
- **Build Tool**: Vite with hot module replacement

The frontend follows a page-based architecture with shared components. Key pages include Dashboard, Markets, Bots, Trading Tools, Backtest, Risk, News Intelligence, Executions, and Settings. The design system emphasizes data clarity with monospace fonts for numbers and a clean, trading-platform aesthetic.

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **API Pattern**: RESTful JSON API under `/api/*` prefix
- **Development Server**: Vite middleware for HMR during development
- **Production Build**: esbuild bundles server code, Vite builds client assets

The server provides endpoints for:
- Bot configuration CRUD operations (7 bot types: arbitrage, statistical, ai, spread, copy, spike, news)
- Market data fetching from Polymarket API
- Trade execution and history
- Dashboard metrics aggregation
- Execution logs
- Advanced trading tools (/api/trading/*)
  - Kelly Criterion position sizing calculator
  - Spike detection and scanning
  - Binary and cross-platform arbitrage scanning
  - Backtesting engine with equity curves
  - Risk management with exposure limits

### Trading Modules
Located in `server/trading/`:
- **kelly-criterion.ts**: Optimal position sizing based on edge and bankroll
- **spike-detector.ts**: Detects price spikes for mean-reversion trades
- **arbitrage-scanner.ts**: Finds binary YES+NO mispricings and cross-platform opportunities
- **backtesting-engine.ts**: Simulates strategies with historical data
- **risk-manager.ts**: Portfolio metrics, exposure limits, and trading halts
- **news-scraper.ts**: Monitors news sources (Reuters, Bloomberg, CoinDesk, CoinTelegraph, The Block) for market-relevant articles
- **news-analyzer.ts**: Claude AI-powered sentiment and fundamental analysis of news articles with confidence scoring (uses Replit AI Integrations)
- **correlation-detector.ts**: Matches news articles to Polymarket markets using keyword analysis and known correlation patterns

### Data Storage
- **Schema Definition**: Drizzle ORM with PostgreSQL dialect
- **Current Implementation**: In-memory storage (MemStorage class) for development
- **Database Ready**: Schema defined in `shared/schema.ts` with Drizzle, PostgreSQL connection configured via `DATABASE_URL` environment variable
- **Migration**: Drizzle Kit configured for schema migrations (`npm run db:push`)

The storage layer uses an interface pattern (`IStorage`) allowing easy swap between in-memory and persistent database implementations.

### External API Integration
- **Polymarket Gamma API**: Fetches real-time market data including prices, volume, liquidity, and outcomes
- **Data Transformation**: Converts API responses to typed Market objects with calculated spreads and arbitrage opportunities

### Key Design Decisions

1. **Shared Schema Pattern**: TypeScript interfaces in `shared/schema.ts` are used by both frontend and backend, ensuring type safety across the stack.

2. **API Request Wrapper**: The `apiRequest` function in `queryClient.ts` handles all mutations with consistent error handling and response validation.

3. **Component-First UI**: UI components are built as reusable, composable pieces following shadcn/ui patterns with Tailwind variants.

4. **Dark Mode Support**: Theme context with localStorage persistence and system preference detection.

## External Dependencies

### Third-Party Services
- **Polymarket Gamma API** (`https://gamma-api.polymarket.com`): Primary data source for prediction market information

### Database
- **PostgreSQL**: Configured via `DATABASE_URL` environment variable, using Drizzle ORM for queries and migrations

### Key NPM Packages
- **Frontend**: React, TanStack Query, Radix UI primitives, Recharts, Tailwind CSS, Wouter
- **Backend**: Express, Drizzle ORM, Zod (validation), connect-pg-simple (session storage)
- **Build**: Vite, esbuild, TypeScript

### Development Tools
- **Replit Plugins**: Runtime error overlay, cartographer, dev banner (development only)