const levelFromScore = (score) => {
  if (score >= 70) return "High";
  if (score >= 35) return "Medium";
  return "Low";
};

export const analyzeTrade = ({
  userBalance,
  portfolio,
  symbol,
  action,
  quantity,
  price,
  totalAmount,
}) => {
  let score = 15;

  if (action === "buy") score += 8;
  if (quantity > 10) score += 10;
  if (totalAmount > userBalance * 0.5) score += 20;
  if (portfolio?.holdings?.length >= 3) score += 10;
  if (portfolio?.cashBalance < userBalance * 0.2) score += 8;

  const riskLevel = levelFromScore(score);
  const summary =
    riskLevel === "High"
      ? `Your ${action} order for ${symbol} is high risk because the position size is large relative to your available cash.`
      : `Your ${action} order for ${symbol} looks reasonable. Keep your exposure balanced and monitor the position closely.`;

  const recommendation =
    riskLevel === "High"
      ? "Reduce position size, diversify into low-volatility assets, and consider setting a stop-loss before adding more exposure."
      : "Maintain a structured plan, keep your risk budget aligned, and review the trade after the next market move.";

  return {
    riskScore: Math.min(100, score),
    riskLevel,
    summary,
    recommendation,
  };
};

export const buildBehaviorInsights = ({
  totalTrades = 0,
  recentTrades = [],
  riskScore = 20,
}) => {
  const flags = [];

  if (totalTrades >= 6) {
    flags.push("Overtrading");
  }

  if (riskScore >= 70) {
    flags.push("High risk exposure");
  }

  if (recentTrades.length >= 3) {
    const lastThree = recentTrades.slice(-3);
    const recentLosses = lastThree.filter((trade) => trade.action === "sell" && trade.totalAmount < trade.price * trade.quantity).length;

    if (recentLosses >= 2) {
      flags.push("Panic selling or revenge trading");
    }
  }

  const summary =
    flags.length > 0
      ? `Behavioral scan: ${flags.join(", ")}. Use a pre-trade checklist and review your recent trades before placing another order.`
      : "Behavioral scan: your trading pattern appears disciplined. Continue using position sizing and a risk plan to protect your edge.";

  return {
    flags,
    summary,
    riskLevel: levelFromScore(riskScore),
    riskScore,
  };
};

export const buildRiskSummary = ({
  portfolio,
  user,
  marketSnapshot,
}) => {
  const totalValue = portfolio?.totalValue || user?.virtualBalance || 0;
  const allocation = portfolio?.holdings?.length || 0;
  const marketBias = marketSnapshot?.marketStatus || "Neutral";

  const score = Math.min(
    100,
    Math.max(10, 25 + allocation * 6 + (marketBias === "Bullish" ? 5 : 0))
  );

  return {
    riskScore: score,
    riskLevel: levelFromScore(score),
    summary: `Current portfolio value is ${totalValue.toFixed(2)}. ${marketBias} market conditions are present, so keep leverage low and monitor concentration.`,
    recommendation: allocation >= 4
      ? "Concentrate your holdings and trim the largest position to improve diversification."
      : "Keep adding quality positions gradually and maintain a cash buffer for opportunities.",
  };
};
