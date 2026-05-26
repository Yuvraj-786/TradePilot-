
# TradePilot — Frontend Redesign Plan

Rebuild the entire frontend as a professional paper-trading platform. Frontend-only (mock data); backend/AI wiring comes later. Inspiration: the Jiade-style dashboard screenshots (last 3 uploads) — clean financial dashboard, sidebar nav, card-based KPIs, rich charts, light + dark mode.

## Design System

- **Theme**: Light + dark mode with a theme toggle (persisted in localStorage). Default: dark.
- **Palette** (semantic tokens in `src/styles.css`, all `oklch`):
  - `--background`, `--foreground`, `--card`, `--muted`, `--border`
  - `--primary` (electric cyan/blue — brand accent, matches TradePilot logo)
  - `--bull` (green — gains, buy)
  - `--bear` (red — losses, sell)
  - `--warning` (amber — risk/medium)
  - Sector palette for distribution charts
- **Typography**: Modern sans (Inter for UI, JetBrains Mono for numbers/tickers).
- **Components**: Reusable `StatCard`, `Sparkline`, `PriceChange`, `StockRow`, `RiskGauge`, `SectionCard`, `Sidebar`, `TopTicker`, `ThemeToggle`.
- **Charts**: Recharts (line, area, bar, pie, candlestick-style).

## Pages & Routes

Each gets its own TanStack Start route file with proper `head()` metadata.

**Public**
1. `/` — Landing page: hero, feature highlights (AI analysis, risk scoring, behavioral insights), how-it-works, CTA to sign up.
2. `/login` — Sign in form + "Continue with demo account".
3. `/signup` — Registration form.

**Protected (under `_authenticated` layout with sidebar + top ticker)**
4. `/dashboard` — KPI cards (Portfolio Value, Virtual Balance, Today's P&L, Total Trades), portfolio growth chart, risk score gauge, AI insight panel, holdings table.
5. `/portfolio` — Invested/Current/P&L/Return cards, holdings table with allocation bars, sector distribution, AI diversification note.
6. `/trade` — Market list (live-style table) + place-order panel (symbol, order type, qty, Buy/Sell).
7. `/watchlist` — Add-symbol input + grid of stock cards with price, change, Buy/Remove.
8. `/ai-insights` — Trade feedback cards, behavioral patterns (progress bars: overtrading, emotional, concentration), risk overview, AI mentor chat panel with quick-prompt chips.
9. `/backtesting` — Strategy picker (MA, RSI, Momentum), date range, run button, results chart + metrics.
10. `/learn` — Educational tutorials grid (market basics, risk mgmt, psychology).
11. `/settings` — Display name, email, starting balance, theme preference, save.

## Shared Layout

- **Sidebar** (collapsible on mobile): TradePilot logo, nav items (Dashboard, Portfolio, Trade, Watchlist, AI Insights, Backtesting, Learn, Settings), Logout at bottom.
- **TopBar**: Hamburger, page title + LIVE indicator, notifications bell, avatar dropdown, theme toggle.
- **Top Ticker**: Auto-scrolling stock ticker (mock data) across the top of authenticated pages.

## Mock Data Layer

`src/lib/mock/` with: `stocks.ts` (symbols + prices + changes), `portfolio.ts` (holdings), `trades.ts` (history), `insights.ts` (AI feedback). A small `useTicker` hook fakes live price wobble via `setInterval` so the UI feels alive.

## Technical Notes

- TanStack Start file-based routes in `src/routes/`. `_authenticated.tsx` layout route renders sidebar + ticker + `<Outlet />`.
- No real auth yet — `_authenticated` just renders; login redirects to `/dashboard`.
- All colors via semantic tokens (no raw hex in components). Light + dark variants defined in `src/styles.css`.
- Replace placeholder `index.tsx` with real landing page.
- Recharts added via `bun add recharts`.

## Out of Scope (later phases)

- Lovable Cloud / auth backend
- Real stock API integration (Finnhub, etc.)
- AI Gateway wiring for the mentor chatbot
- Strategy execution engine

## Next Step After Approval

Since this is a design-led rebuild, once approved I'll generate 3 visual design directions (varying density, chart style, accent treatment) for you to pick from, then build the chosen one across all pages.
