# Polymarket Trading Bot Platform - Design Guidelines

## Design Approach
**System-Based Approach**: Drawing from Linear's clean data presentation, Stripe's dashboard clarity, and modern trading platforms like Robinhood for financial interfaces. Priority is data clarity, real-time monitoring, and operational efficiency.

## Core Design Principles
1. **Data First**: Every element serves information delivery - no decorative bloat
2. **Real-time Focus**: Design for constantly updating metrics and live trading data
3. **Scan-ability**: Users need to quickly parse multiple data points simultaneously
4. **Action Clarity**: Trading actions must be immediately recognizable and accessible

## Typography System

**Families**: 
- Primary: Inter (clean, readable at all sizes for data-heavy interfaces)
- Monospace: JetBrains Mono (for numbers, prices, timestamps)

**Scale**:
- Dashboard Headers: text-2xl font-semibold
- Section Titles: text-lg font-medium  
- Data Labels: text-sm font-medium uppercase tracking-wide
- Metric Values: text-3xl font-bold (monospace for numbers)
- Body/Descriptions: text-base
- Secondary Info: text-sm text-gray-600

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, and 8 consistently
- Component padding: p-4 to p-6
- Section gaps: gap-4 to gap-8
- Page margins: px-6 to px-8

**Grid Structure**:
- Dashboard: 12-column grid for flexible metric placement
- Sidebar: Fixed 280px width for navigation/bot controls
- Main content: Fluid with max-w-7xl container

## Component Library

### Navigation & Layout
- **Sidebar Navigation**: Fixed left sidebar with bot selection, strategy types, and quick stats
- **Top Bar**: Real-time connection status, account balance, notification center, profile
- **Breadcrumbs**: Show current bot → strategy → market path

### Dashboard Components
- **Metric Cards**: Compact cards displaying key stats (24h profit, win rate, active positions) with monospace numbers and trend indicators
- **Real-time Charts**: Line/candlestick charts for market prices and profit curves using minimal styling
- **Bot Status Panel**: Live indicators (green=active, amber=paused, red=error) with last execution timestamp
- **Market Table**: Sortable table showing markets, current prices, spreads, and arbitrage opportunities

### Trading Interface
- **Order Entry**: Clean form with market selection, amount input, strategy picker, and large confirm button
- **Position Manager**: List/grid view of active positions with P&L, entry/exit prices, and quick close actions
- **Strategy Configurator**: Settings panels for each bot type (arbitrage threshold, model parameters, etc.)

### Data Visualization
- **Performance Charts**: Area charts for cumulative profit, bar charts for daily returns
- **Market Comparison**: Side-by-side market displays for correlation analysis
- **Execution Log**: Timestamped feed of bot actions with color-coded success/failure states

### Forms & Inputs
- **Numeric Inputs**: Large, monospace text for price/amount entry with clear min/max indicators
- **Toggle Switches**: For bot on/off, auto-execute settings
- **Dropdown Selects**: For market selection, strategy type, timeframes

## Page Structures

### Dashboard (Landing)
- Hero metrics banner: Total P&L, win rate, active bots (full-width, py-8)
- 3-column grid: Active positions | Recent executions | Top opportunities
- Performance chart section (full-width)

### Bot Configuration Page
- 2-column layout: Settings form (left) | Live preview/simulation (right)
- Parameter inputs with real-time validation
- Historical backtest results section below

### Markets Explorer
- Search/filter bar at top
- Market cards in responsive grid (2-4 columns) showing prices, volumes, spreads
- Quick-action buttons on each card for instant bot deployment

### Analytics Page
- Full-width time-range selector
- Multi-chart layout showing profit trends, strategy performance breakdown, market analysis
- Exportable data tables

## Images
**No hero images** - This is a data-focused application. Use icons and charts instead.
- Bot type icons: Simple, recognizable symbols for each strategy (arbitrage, AI, copy-trade)
- Empty states: Minimal illustrations when no data/positions exist
- Logo: Clean wordmark or symbol in top-left of sidebar

## Visual Hierarchy Rules
1. **Profit/Loss numbers**: Largest, boldest text with green/red coding
2. **Active status indicators**: Prominent, always visible
3. **Market prices**: Medium-large monospace
4. **Timestamps/metadata**: Smallest, subtle text
5. **Action buttons**: High contrast, clear CTAs

## Responsive Behavior
- Desktop (1280px+): Full sidebar, multi-column dashboards
- Tablet (768-1279px): Collapsible sidebar, 2-column max
- Mobile (<768px): Bottom nav, single column, swipeable metric cards

## Accessibility & Interactions
- All interactive elements have clear hover states (subtle background change)
- Critical actions (execute trade, stop bot) have confirmation modals
- Real-time updates use subtle animations (number count-ups, gentle color pulses)
- Keyboard navigation for power users (quick actions, market switching)
- High contrast for profit/loss numbers and status indicators