import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import './App.css';

// ─────────────────────────────────────────────────────────────
// CONTEXT
// ─────────────────────────────────────────────────────────────

const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);

// ─────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────

const MOCK_STOCKS = [
  { symbol: 'AAPL',  name: 'Apple Inc.',       price: 189.84, change: 1.24,  pct: 0.66,  sector: 'Technology' },
  { symbol: 'TSLA',  name: 'Tesla Inc.',        price: 242.60, change: -5.31, pct: -2.14, sector: 'Automotive' },
  { symbol: 'NVDA',  name: 'NVIDIA Corp.',      price: 875.40, change: 18.75, pct: 2.19,  sector: 'Technology' },
  { symbol: 'MSFT',  name: 'Microsoft Corp.',   price: 415.22, change: 3.11,  pct: 0.75,  sector: 'Technology' },
  { symbol: 'AMZN',  name: 'Amazon.com Inc.',   price: 185.07, change: -1.85, pct: -0.99, sector: 'Consumer' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.',     price: 165.40, change: 2.30,  pct: 1.41,  sector: 'Technology' },
  { symbol: 'META',  name: 'Meta Platforms',    price: 508.90, change: 7.44,  pct: 1.48,  sector: 'Technology' },
  { symbol: 'RELIANCE', name: 'Reliance Ind.',  price: 2845.0, change: 32.5,  pct: 1.15,  sector: 'Energy' },
  { symbol: 'TCS',   name: 'TCS Ltd.',          price: 3920.0, change: -18.0, pct: -0.46, sector: 'Technology' },
  { symbol: 'INFY',  name: 'Infosys Ltd.',      price: 1785.0, change: 12.5,  pct: 0.71,  sector: 'Technology' },
];

const MOCK_PORTFOLIO = [
  { symbol: 'AAPL',  qty: 10, avgPrice: 175.00, currentPrice: 189.84 },
  { symbol: 'NVDA',  qty: 5,  avgPrice: 820.00, currentPrice: 875.40 },
  { symbol: 'TSLA',  qty: 8,  avgPrice: 260.00, currentPrice: 242.60 },
  { symbol: 'MSFT',  qty: 12, avgPrice: 400.00, currentPrice: 415.22 },
];

const MOCK_TRADES = [
  { id: 1, symbol: 'AAPL',  type: 'BUY',  qty: 10, price: 175.00, date: '2025-05-15', total: 1750.00 },
  { id: 2, symbol: 'NVDA',  type: 'BUY',  qty: 5,  price: 820.00, date: '2025-05-17', total: 4100.00 },
  { id: 3, symbol: 'TSLA',  type: 'SELL', qty: 4,  price: 270.00, date: '2025-05-18', total: 1080.00 },
  { id: 4, symbol: 'MSFT',  type: 'BUY',  qty: 12, price: 400.00, date: '2025-05-19', total: 4800.00 },
  { id: 5, symbol: 'GOOGL', type: 'BUY',  qty: 6,  price: 160.00, date: '2025-05-20', total: 960.00  },
];

const MOCK_AI_INSIGHTS = [
  { id: 1, type: 'warning', message: 'You have 60% capital in Technology sector. Consider diversifying to reduce concentration risk.' },
  { id: 2, type: 'info',    message: 'Your TSLA position shows a paper loss. Avoid panic-selling; the stock is within normal volatility range.' },
  { id: 3, type: 'success', message: 'NVDA trade was well-timed. You entered at a pullback from the 30-day high — solid risk/reward setup.' },
];

const MOCK_CHART_DATA = Array.from({ length: 30 }, (_, i) => ({
  day: `May ${i + 1}`,
  value: 50000 + Math.round(Math.sin(i * 0.4) * 4000 + i * 200 + Math.random() * 1500),
}));

// ─────────────────────────────────────────────────────────────
// ICONS (inline SVGs to avoid extra deps)
// ─────────────────────────────────────────────────────────────

const Icon = {
  Dashboard:  () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  Portfolio:  () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  Trade:      () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  Watchlist:  () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  AI:         () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2a4 4 0 0 1 4 4v1h1a3 3 0 0 1 0 6h-1v1a4 4 0 0 1-8 0v-1H7a3 3 0 0 1 0-6h1V6a4 4 0 0 1 4-4z"/></svg>,
  Settings:   () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Logout:     () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  ArrowUp:    () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15"/></svg>,
  ArrowDown:  () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>,
  Menu:       () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  Sparkle:    () => <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>,
  Plus:       () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Bell:       () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
};

// ─────────────────────────────────────────────────────────────
// MINI LINE CHART (no recharts dependency)
// ─────────────────────────────────────────────────────────────

function SparkLine({ data, color = '#00d4ff', width = 80, height = 32 }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// TICKER BAR
// ─────────────────────────────────────────────────────────────

function TickerBar({ stocks }) {
  const doubled = [...stocks, ...stocks];
  return (
    <div className="ticker-bar">
      <div className="ticker-track">
        {doubled.map((s, i) => (
          <span className="ticker-item" key={i}>
            <span className="ticker-symbol">{s.symbol}</span>
            <span className={s.pct >= 0 ? 'price-up' : 'price-down'}>
              ₹{s.price.toLocaleString()}
            </span>
            <span className={`badge ${s.pct >= 0 ? 'badge-green' : 'badge-red'}`}>
              {s.pct >= 0 ? '+' : ''}{s.pct.toFixed(2)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: 'Dashboard' },
  { to: '/portfolio', label: 'Portfolio',  icon: 'Portfolio' },
  { to: '/trade',     label: 'Trade',      icon: 'Trade'     },
  { to: '/watchlist', label: 'Watchlist',  icon: 'Watchlist' },
  { to: '/ai',        label: 'AI Insights',icon: 'AI'        },
  { to: '/settings',  label: 'Settings',   icon: 'Settings'  },
];

function Sidebar({ collapsed, onToggle, onLogout }) {
  return (
    <nav className={`app-sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'linear-gradient(135deg, var(--accent-cyan), #0099bb)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, fontFamily: 'var(--font-display)', fontWeight: 800,
          fontSize: 14, color: '#080c14'
        }}>TP</div>
        {!collapsed && (
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em' }}>
            Trade<span style={{ color: 'var(--accent-cyan)' }}>Pilot</span>
          </span>
        )}
      </div>

      {/* Links */}
      <div style={{ padding: '12px 8px', flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_LINKS.map(({ to, label, icon }) => {
          const IconComp = Icon[icon];
          return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              title={collapsed ? label : undefined}
            >
              <span className="nav-icon"><IconComp /></span>
              {!collapsed && <span>{label}</span>}
            </NavLink>
          );
        })}
      </div>

      {/* Logout */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border-subtle)' }}>
        <button className="nav-item btn-ghost" style={{ width: '100%', border: 'none', background: 'transparent' }} onClick={onLogout}>
          <span className="nav-icon"><Icon.Logout /></span>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────
// NAVBAR
// ─────────────────────────────────────────────────────────────

function Navbar({ onMenuToggle, user }) {
  const location = useLocation();
  const title = NAV_LINKS.find(l => location.pathname.startsWith(l.to))?.label || 'TradePilot';
  return (
    <header className="app-navbar flex-between">
      <div className="flex gap-md items-center">
        <button className="btn btn-icon btn-ghost" onClick={onMenuToggle}>
          <Icon.Menu />
        </button>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.01em', margin: 0 }}>{title}</h2>
        <div className="flex items-center gap-xs" style={{ marginLeft: 4 }}>
          <span className="live-dot" />
          <span className="text-xs text-muted mono">LIVE</span>
        </div>
      </div>
      <div className="flex items-center gap-md">
        <button className="btn btn-icon btn-ghost" title="Notifications">
          <Icon.Bell />
        </button>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-green))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, color: '#080c14', cursor: 'pointer',
          fontFamily: 'var(--font-display)'
        }}>
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────

function StatCard({ label, value, change, pct, up, sparkData, accent = 'cyan' }) {
  return (
    <div className="card fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      <div className="flex-between" style={{ marginTop: 4 }}>
        <span className={`stat-change ${up ? 'price-up' : 'price-down'}`}>
          {up ? <Icon.ArrowUp /> : <Icon.ArrowDown />}
          {' '}{change} ({pct})
        </span>
        {sparkData && (
          <SparkLine data={sparkData} color={up ? 'var(--accent-green)' : 'var(--accent-red)'} />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// RISK SCORE RING
// ─────────────────────────────────────────────────────────────

function RiskRing({ score = 62, size = 80 }) {
  const level = score < 40 ? 'low' : score < 70 ? 'medium' : 'high';
  const color = score < 40 ? 'var(--accent-green)' : score < 70 ? 'var(--accent-amber)' : 'var(--accent-red)';
  const r = (size / 2) - 6;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="flex-center flex-col" style={{ gap: 6 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border-default)" strokeWidth="5"/>
          <circle
            cx={size/2} cy={size/2} r={r}
            fill="none" stroke={color} strokeWidth="5"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: 'stroke-dasharray 1s ease' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16, color }}>{score}</span>
        </div>
      </div>
      <span className={`badge ${level === 'low' ? 'badge-green' : level === 'medium' ? 'badge-amber' : 'badge-red'}`}>
        {level} risk
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PORTFOLIO TABLE ROW
// ─────────────────────────────────────────────────────────────

function PortfolioRow({ holding }) {
  const pnl = (holding.currentPrice - holding.avgPrice) * holding.qty;
  const pnlPct = ((holding.currentPrice - holding.avgPrice) / holding.avgPrice) * 100;
  const up = pnl >= 0;
  return (
    <tr>
      <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{holding.symbol}</td>
      <td>{holding.qty}</td>
      <td>₹{holding.avgPrice.toFixed(2)}</td>
      <td>₹{holding.currentPrice.toFixed(2)}</td>
      <td className={up ? 'price-up' : 'price-down'}>
        {up ? '+' : ''}₹{pnl.toFixed(2)}<br/>
        <span style={{ fontSize: '0.7rem' }}>({up ? '+' : ''}{pnlPct.toFixed(2)}%)</span>
      </td>
      <td>₹{(holding.currentPrice * holding.qty).toFixed(2)}</td>
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGES
// ─────────────────────────────────────────────────────────────

function Dashboard() {
  const sparkUp   = [40, 42, 38, 45, 50, 47, 55, 60, 58, 65];
  const sparkDown = [65, 60, 62, 55, 50, 52, 45, 42, 44, 38];

  const totalValue = MOCK_PORTFOLIO.reduce((s, h) => s + h.currentPrice * h.qty, 0);
  const totalCost  = MOCK_PORTFOLIO.reduce((s, h) => s + h.avgPrice * h.qty, 0);
  const totalPnL   = totalValue - totalCost;
  const pnlPct     = (totalPnL / totalCost) * 100;

  return (
    <div className="fade-in">
      {/* Stats row */}
      <div className="grid grid-4 gap-md mb-lg stagger">
        <StatCard label="Portfolio Value"  value={`₹${totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} change={`₹${Math.abs(totalPnL).toFixed(0)}`} pct={`${pnlPct.toFixed(2)}%`} up={totalPnL >= 0} sparkData={sparkUp}   />
        <StatCard label="Virtual Balance"  value="₹28,640"   change="₹3,200" pct="11.2%"  up={true}  sparkData={sparkUp}   />
        <StatCard label="Today's P&L"      value="₹+1,248"   change="₹1,248" pct="2.14%"  up={true}  sparkData={sparkUp}   />
        <StatCard label="Total Trades"     value="24"         change="3"      pct="today"  up={true}  sparkData={sparkDown} />
      </div>

      {/* Main content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--space-lg)' }}>

        {/* Portfolio chart placeholder */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Portfolio Growth</span>
            <span className="badge badge-cyan">30D</span>
          </div>
          <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 4, paddingTop: 8 }}>
            {MOCK_CHART_DATA.slice(-20).map((d, i) => {
              const max = Math.max(...MOCK_CHART_DATA.map(x => x.value));
              const min = Math.min(...MOCK_CHART_DATA.map(x => x.value));
              const h = ((d.value - min) / (max - min)) * 160 + 20;
              const isLast = i === 19;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: 200 }}>
                  <div style={{
                    width: '100%', height: h,
                    background: isLast
                      ? 'var(--accent-cyan)'
                      : `rgba(0,212,255,${0.15 + (i / 19) * 0.35})`,
                    borderRadius: '3px 3px 0 0',
                    transition: 'height 0.8s ease',
                    boxShadow: isLast ? 'var(--shadow-glow-cyan)' : 'none'
                  }}/>
                </div>
              );
            })}
          </div>
          <div className="flex-between mt-sm">
            <span className="text-xs text-muted mono">May 4</span>
            <span className="text-xs text-muted mono">May 23</span>
          </div>
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {/* Risk Score */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Risk Score</span>
            </div>
            <div className="flex-center" style={{ padding: '8px 0' }}>
              <RiskRing score={62} />
            </div>
          </div>

          {/* AI Insight */}
          <div className="card">
            <div className="card-header">
              <span className="card-title flex items-center gap-xs">
                <Icon.Sparkle /> AI Insight
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {MOCK_AI_INSIGHTS.slice(0, 2).map(ins => (
                <div key={ins.id} className="ai-chip">
                  <span className="ai-icon"><Icon.Sparkle /></span>
                  <span style={{ fontSize: '0.8rem' }}>{ins.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Holdings table */}
      <div className="card mt-lg">
        <div className="card-header">
          <span className="card-title">Holdings</span>
          <span className="badge badge-muted">{MOCK_PORTFOLIO.length} positions</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="tp-table">
            <thead>
              <tr>
                <th>Symbol</th><th>Qty</th><th>Avg Price</th><th>LTP</th><th>P&amp;L</th><th>Value</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_PORTFOLIO.map(h => <PortfolioRow key={h.symbol} holding={h} />)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Portfolio() {
  return (
    <div className="fade-in">
      <div className="flex-between mb-lg">
        <div>
          <h3 style={{ marginBottom: 4 }}>My Portfolio</h3>
          <p className="text-sm text-muted">Track all your virtual holdings and performance</p>
        </div>
      </div>

      <div className="grid grid-4 gap-md mb-lg stagger">
        {[
          { label: 'Invested', value: '₹11,650', color: 'var(--text-primary)' },
          { label: 'Current',  value: '₹13,248', color: 'var(--accent-cyan)' },
          { label: 'P&L',      value: '+₹1,598', color: 'var(--accent-green)' },
          { label: 'Return',   value: '+13.7%',  color: 'var(--accent-green)' },
        ].map(s => (
          <div className="card" key={s.label}>
            <span className="stat-label">{s.label}</span>
            <span className="stat-value" style={{ color: s.color, marginTop: 6 }}>{s.value}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
        {/* Holdings */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Holdings</span>
          </div>
          <table className="tp-table">
            <thead><tr><th>Stock</th><th>Qty</th><th>P&amp;L</th><th>Alloc</th></tr></thead>
            <tbody>
              {MOCK_PORTFOLIO.map(h => {
                const pnl = (h.currentPrice - h.avgPrice) * h.qty;
                const up = pnl >= 0;
                const alloc = ((h.currentPrice * h.qty) / MOCK_PORTFOLIO.reduce((s, x) => s + x.currentPrice * x.qty, 0) * 100).toFixed(1);
                return (
                  <tr key={h.symbol}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{h.symbol}</td>
                    <td>{h.qty}</td>
                    <td className={up ? 'price-up' : 'price-down'}>{up?'+':''}₹{pnl.toFixed(0)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ height: 4, width: 60, background: 'var(--border-default)', borderRadius: 2 }}>
                          <div style={{ height: '100%', width: `${alloc}%`, background: 'var(--accent-cyan)', borderRadius: 2 }}/>
                        </div>
                        <span className="text-xs mono">{alloc}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Sector distribution */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Sector Distribution</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
            {[
              { sector: 'Technology',  pct: 68, color: 'var(--accent-cyan)'  },
              { sector: 'Automotive',  pct: 16, color: 'var(--accent-amber)' },
              { sector: 'Consumer',    pct: 10, color: 'var(--accent-green)' },
              { sector: 'Energy',      pct: 6,  color: 'var(--accent-purple)'},
            ].map(s => (
              <div key={s.sector}>
                <div className="flex-between mb-sm">
                  <span className="text-sm text-secondary">{s.sector}</span>
                  <span className="text-xs mono" style={{ color: s.color }}>{s.pct}%</span>
                </div>
                <div style={{ height: 6, background: 'var(--border-default)', borderRadius: 3 }}>
                  <div style={{ height: '100%', width: `${s.pct}%`, background: s.color, borderRadius: 3, transition: 'width 1s ease', boxShadow: `0 0 8px ${s.color}55` }}/>
                </div>
              </div>
            ))}
          </div>
          <div className="ai-chip mt-lg">
            <span className="ai-icon"><Icon.Sparkle /></span>
            <span style={{ fontSize: '0.8rem' }}>68% in Technology is above the recommended 40% cap. Consider diversifying.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Trade() {
  const [symbol, setSymbol]     = useState('AAPL');
  const [qty, setQty]           = useState('');
  const [orderType, setOrderType] = useState('MARKET');
  const [limitPrice, setLimitPrice] = useState('');
  const [submitted, setSubmitted] = useState(null);

  const stock = MOCK_STOCKS.find(s => s.symbol === symbol) || MOCK_STOCKS[0];

  const handleOrder = (side) => {
    if (!qty) return;
    setSubmitted({ side, symbol, qty, price: stock.price, total: stock.price * Number(qty) });
    setQty('');
    setTimeout(() => setSubmitted(null), 3500);
  };

  return (
    <div className="fade-in">
      <h3 style={{ marginBottom: 4 }}>Trade Screen</h3>
      <p className="text-sm text-muted mb-lg">Place virtual buy/sell orders and practice market execution</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--space-lg)' }}>
        {/* Stock list */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Market</span>
            <span className="badge badge-cyan flex items-center gap-xs"><span className="live-dot" style={{ width: 5, height: 5 }}/>Live</span>
          </div>
          <table className="tp-table">
            <thead><tr><th>Symbol</th><th>Name</th><th>Price</th><th>Change</th><th>Action</th></tr></thead>
            <tbody>
              {MOCK_STOCKS.map(s => (
                <tr key={s.symbol} onClick={() => setSymbol(s.symbol)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 700, color: symbol === s.symbol ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>{s.symbol}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{s.name}</td>
                  <td className="mono">₹{s.price.toLocaleString()}</td>
                  <td className={s.pct >= 0 ? 'price-up' : 'price-down'}>
                    {s.pct >= 0 ? '+' : ''}{s.pct.toFixed(2)}%
                  </td>
                  <td>
                    <button className="btn btn-sm btn-ghost" onClick={(e) => { e.stopPropagation(); setSymbol(s.symbol); }}>
                      Select
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Order form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Place Order</span>
              <span className="badge badge-cyan">{symbol}</span>
            </div>

            {/* Price display */}
            <div style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 16, textAlign: 'center' }}>
              <div className="stat-label">Current Price</div>
              <div className="stat-value" style={{ fontSize: '2rem', color: stock.pct >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                ₹{stock.price.toLocaleString()}
              </div>
              <span className={`badge ${stock.pct >= 0 ? 'badge-green' : 'badge-red'}`}>
                {stock.pct >= 0 ? '+' : ''}{stock.pct.toFixed(2)}%
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group">
                <label>Stock Symbol</label>
                <select value={symbol} onChange={e => setSymbol(e.target.value)}>
                  {MOCK_STOCKS.map(s => <option key={s.symbol} value={s.symbol}>{s.symbol} — {s.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Order Type</label>
                <select value={orderType} onChange={e => setOrderType(e.target.value)}>
                  <option value="MARKET">Market Order</option>
                  <option value="LIMIT">Limit Order</option>
                </select>
              </div>

              {orderType === 'LIMIT' && (
                <div className="form-group">
                  <label>Limit Price (₹)</label>
                  <input type="number" placeholder="0.00" value={limitPrice} onChange={e => setLimitPrice(e.target.value)} />
                </div>
              )}

              <div className="form-group">
                <label>Quantity</label>
                <input type="number" placeholder="Enter qty" value={qty} onChange={e => setQty(e.target.value)} min="1" />
              </div>

              {qty && (
                <div style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-xs text-muted">Estimated</span>
                  <span className="text-sm mono" style={{ color: 'var(--accent-cyan)' }}>₹{(stock.price * Number(qty)).toFixed(2)}</span>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
                <button className="btn btn-buy" onClick={() => handleOrder('BUY')}>
                  <Icon.Plus /> BUY
                </button>
                <button className="btn btn-sell" onClick={() => handleOrder('SELL')}>
                  SELL
                </button>
              </div>
            </div>
          </div>

          {submitted && (
            <div className="toast toast-success fade-in">
              <Icon.Sparkle />
              <div>
                <strong>{submitted.side} {submitted.symbol}</strong><br/>
                <span style={{ fontSize: '0.8rem' }}>{submitted.qty} shares @ ₹{submitted.price} = ₹{submitted.total.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Balance card */}
          <div className="card">
            <span className="stat-label">Available Balance</span>
            <span className="stat-value" style={{ color: 'var(--accent-cyan)', marginTop: 6 }}>₹28,640</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Watchlist() {
  const [list, setList] = useState(MOCK_STOCKS.slice(0, 6));
  const [input, setInput] = useState('');

  const addStock = () => {
    const found = MOCK_STOCKS.find(s => s.symbol === input.toUpperCase());
    if (found && !list.find(s => s.symbol === found.symbol)) {
      setList([...list, found]);
      setInput('');
    }
  };

  return (
    <div className="fade-in">
      <div className="flex-between mb-lg">
        <div>
          <h3 style={{ marginBottom: 4 }}>Watchlist</h3>
          <p className="text-sm text-muted">Track your favourite stocks</p>
        </div>
        <div className="flex gap-sm">
          <input placeholder="Add symbol…" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addStock()}
            style={{ width: 140 }} />
          <button className="btn btn-primary" onClick={addStock}><Icon.Plus /></button>
        </div>
      </div>

      <div className="grid grid-3 gap-md stagger">
        {list.map(s => (
          <div className="card" key={s.symbol} style={{ cursor: 'default' }}>
            <div className="flex-between mb-md">
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>{s.symbol}</div>
                <div className="text-xs text-muted" style={{ marginTop: 2 }}>{s.name}</div>
              </div>
              <span className="badge badge-muted">{s.sector}</span>
            </div>
            <div className="flex-between">
              <span className="stat-value" style={{ fontSize: '1.25rem' }}>₹{s.price.toLocaleString()}</span>
              <span className={`badge ${s.pct >= 0 ? 'badge-green' : 'badge-red'}`}>
                {s.pct >= 0 ? '+' : ''}{s.pct.toFixed(2)}%
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 12 }}>
              <button className="btn btn-sm btn-buy">Buy</button>
              <button className="btn btn-sm btn-ghost" onClick={() => setList(list.filter(x => x.symbol !== s.symbol))}>Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AIInsights() {
  const [loading, setLoading] = useState(false);
  const [chat, setChat]       = useState([
    { role: 'ai', text: 'Hello! I\'m your TradePilot AI mentor. Ask me anything about trading, your portfolio, or market strategies.' }
  ]);
  const [input, setInput] = useState('');

  const CANNED = {
    'risk':      'Your current risk score is 62/100 (Medium). Your primary risk factor is over-concentration in the Technology sector (68%). Aim to keep any single sector below 40%.',
    'tsla':      'TSLA is currently showing a paper loss of ₹140/share. This is within 1 standard deviation of normal volatility. Avoid panic-selling — evaluate your original thesis before acting.',
    'strategy':  'For beginners, a simple strategy: invest in index ETFs (e.g., NIFTY 50) for the core (70%) and allocate up to 30% in individual stocks you understand well.',
    'default':   'Great question! As a paper trader, focus on process over profits. Every trade is a learning opportunity — track WHY you made the trade and review the outcome.',
  };

  const askAI = () => {
    if (!input.trim()) return;
    const q = input;
    setInput('');
    setChat(prev => [...prev, { role: 'user', text: q }]);
    setLoading(true);
    setTimeout(() => {
      const key = Object.keys(CANNED).find(k => q.toLowerCase().includes(k)) || 'default';
      setChat(prev => [...prev, { role: 'ai', text: CANNED[key] }]);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="fade-in">
      <h3 style={{ marginBottom: 4 }}>AI Insights</h3>
      <p className="text-sm text-muted mb-lg">Behavioral analysis, risk feedback, and your AI learning assistant</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 'var(--space-lg)' }}>
        {/* Insights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {/* Trade feedback */}
          <div className="card">
            <div className="card-header">
              <span className="card-title flex items-center gap-xs"><Icon.Sparkle /> Trade Feedback</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {MOCK_AI_INSIGHTS.map(ins => (
                <div key={ins.id} className="ai-chip" style={{
                  borderLeftColor: ins.type === 'warning' ? 'var(--accent-amber)' : ins.type === 'success' ? 'var(--accent-green)' : 'var(--accent-cyan)',
                  background: ins.type === 'warning' ? 'var(--accent-amber-dim)' : ins.type === 'success' ? 'var(--accent-green-dim)' : 'var(--accent-cyan-dim)'
                }}>
                  <span className="ai-icon" style={{ color: ins.type === 'warning' ? 'var(--accent-amber)' : ins.type === 'success' ? 'var(--accent-green)' : 'var(--accent-cyan)' }}>
                    <Icon.Sparkle />
                  </span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{ins.message}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Behavioral patterns */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Behavioral Patterns</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Overtrading',       score: 25, risk: false },
                { label: 'Emotional Trading', score: 40, risk: true },
                { label: 'Concentration Risk',score: 68, risk: true },
                { label: 'Discipline Score',  score: 72, risk: false },
              ].map(b => (
                <div key={b.label}>
                  <div className="flex-between mb-sm">
                    <span className="text-sm text-secondary">{b.label}</span>
                    <span className={`badge ${b.score > 60 && b.risk ? 'badge-red' : b.score > 40 ? 'badge-amber' : 'badge-green'}`}>
                      {b.score}/100
                    </span>
                  </div>
                  <div style={{ height: 5, background: 'var(--border-default)', borderRadius: 3 }}>
                    <div style={{
                      height: '100%', borderRadius: 3, transition: 'width 1s ease',
                      width: `${b.score}%`,
                      background: b.score > 60 && b.risk ? 'var(--accent-red)' : b.score > 40 ? 'var(--accent-amber)' : 'var(--accent-green)'
                    }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk overview */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Risk Overview</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'center' }}>
              <RiskRing score={62} size={100} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Diversification', val: 'Low', color: 'var(--accent-red)' },
                  { label: 'Stop-loss Usage', val: 'None', color: 'var(--accent-amber)' },
                  { label: 'Volatility Exp.',  val: 'High', color: 'var(--accent-amber)' },
                  { label: 'Consistency',      val: 'Good', color: 'var(--accent-green)' },
                ].map(r => (
                  <div key={r.label} className="flex-between">
                    <span className="text-xs text-muted">{r.label}</span>
                    <span className="text-xs mono" style={{ color: r.color }}>{r.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* AI Chat */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 560 }}>
          <div className="card-header">
            <span className="card-title flex items-center gap-xs">
              <Icon.Sparkle /> AI Mentor
            </span>
            <span className="live-dot"/>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingRight: 4 }}>
            {chat.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '85%', padding: '10px 14px', borderRadius: 'var(--radius-md)',
                  background: msg.role === 'user' ? 'var(--accent-cyan)' : 'var(--bg-primary)',
                  color: msg.role === 'user' ? 'var(--bg-primary)' : 'var(--text-secondary)',
                  fontSize: '0.875rem', lineHeight: 1.6,
                  border: msg.role !== 'user' ? '1px solid var(--border-subtle)' : 'none',
                  fontWeight: msg.role === 'user' ? 500 : 400,
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: 4, padding: '8px 14px' }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-cyan)', animation: `pulse-dot 1s ease-in-out ${i * 0.2}s infinite` }}/>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex gap-sm mt-md" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
            <input
              placeholder="Ask about your trades, risk, strategies…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && askAI()}
              style={{ fontSize: '0.875rem' }}
            />
            <button className="btn btn-primary btn-icon" onClick={askAI}><Icon.Sparkle /></button>
          </div>
          <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {['My risk score', 'TSLA advice', 'Strategy tips'].map(s => (
              <button key={s} className="btn btn-sm btn-ghost" style={{ fontSize: '0.7rem' }} onClick={() => { setInput(s); }}>{s}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Settings() {
  return (
    <div className="fade-in">
      <h3 style={{ marginBottom: 4 }}>Settings</h3>
      <p className="text-sm text-muted mb-lg">Manage your account and preferences</p>
      <div style={{ maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {[
          { label: 'Display Name',   type: 'text',  placeholder: 'John Trader'      },
          { label: 'Email',          type: 'email', placeholder: 'you@example.com'  },
          { label: 'Starting Balance (₹)', type: 'number', placeholder: '100000'  },
        ].map(f => (
          <div className="card" key={f.label}>
            <div className="form-group">
              <label>{f.label}</label>
              <input type={f.type} placeholder={f.placeholder} />
            </div>
          </div>
        ))}
        <button className="btn btn-primary w-full">Save Changes</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// AUTH PAGES
// ─────────────────────────────────────────────────────────────

function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [pass,  setPass]  = useState('');

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, margin: '0 auto 12px',
            background: 'linear-gradient(135deg, var(--accent-cyan), #0099bb)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: '#080c14'
          }}>TP</div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: 6 }}>Welcome back</h2>
          <p className="text-sm text-muted">Sign in to your TradePilot account</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="••••••••" value={pass} onChange={e => setPass(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && login({ name: email.split('@')[0] || 'Trader' })} />
          </div>
          <button className="btn btn-primary w-full" style={{ marginTop: 8 }}
            onClick={() => login({ name: email.split('@')[0] || 'Trader' })}>
            Sign In
          </button>
        </div>

        <div className="divider">or</div>

        <button className="btn btn-ghost w-full" onClick={() => login({ name: 'Demo User' })}>
          Continue with Demo Account
        </button>

        <p className="text-xs text-muted" style={{ textAlign: 'center', marginTop: 20 }}>
          No real money involved. Practice safely.
        </p>
      </div>
    </div>
  );
}

function Signup() {
  const { login } = useAuth();
  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, margin: '0 auto 12px',
            background: 'linear-gradient(135deg, var(--accent-green), #009944)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: '#080c14'
          }}>TP</div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: 6 }}>Start for free</h2>
          <p className="text-sm text-muted">Create your paper trading account</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'Full Name',  type: 'text',     placeholder: 'John Trader'     },
            { label: 'Email',      type: 'email',    placeholder: 'you@example.com' },
            { label: 'Password',   type: 'password', placeholder: '••••••••'        },
          ].map(f => (
            <div className="form-group" key={f.label}>
              <label>{f.label}</label>
              <input type={f.type} placeholder={f.placeholder} />
            </div>
          ))}

          <div style={{ background: 'var(--accent-cyan-dim)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '0.8125rem', color: 'var(--accent-cyan)' }}>
            🎉 You'll start with ₹1,00,000 virtual balance
          </div>

          <button className="btn btn-buy w-full" style={{ marginTop: 4 }} onClick={() => login({ name: 'New Trader' })}>
            Create Account
          </button>
        </div>

        <p className="text-xs text-muted" style={{ textAlign: 'center', marginTop: 20 }}>
          Already have an account? <a href="/login">Sign in</a>
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PROTECTED LAYOUT
// ─────────────────────────────────────────────────────────────

function AppLayout({ user, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="app-wrapper">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} onLogout={onLogout} />
      <div className={`app-main ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <TickerBar stocks={MOCK_STOCKS} />
        <Navbar onMenuToggle={() => setCollapsed(c => !c)} user={user} />
        <main className="app-content">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/trade"     element={<Trade />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/ai"        element={<AIInsights />} />
            <Route path="/settings"  element={<Settings />} />
            <Route path="*"          element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────────────────────

function AppRoutes() {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) {
    return (
      <Routes>
        <Route path="/login"  element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="*"       element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return <AppLayout user={user} onLogout={logout} />;
}

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tp_user')); } catch { return null; }
  });

  const login  = (u) => { setUser(u); localStorage.setItem('tp_user', JSON.stringify(u)); };
  const logout = ()  => { setUser(null); localStorage.removeItem('tp_user'); };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <Router>
        <AppRoutes />
      </Router>
    </AuthContext.Provider>
  );
}