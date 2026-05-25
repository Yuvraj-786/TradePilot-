import pool from "../config/db.js";
import { buildBehaviorInsights, buildRiskSummary } from "../services/aiService.js";
import { getMarketSnapshot } from "../services/stockService.js";

export const getInsights = async (req, res) => {
  try {
    const userId = req.user.id;
    const userResult = await pool.query("SELECT id, balance FROM users WHERE id = $1", [userId]);
    const tradesResult = await pool.query(
      "SELECT * FROM orders WHERE user_id = $1 ORDER BY id DESC LIMIT 10",
      [userId]
    );
    const holdingsResult = await pool.query(
      "SELECT symbol, quantity, avg_price FROM holdings WHERE user_id = $1",
      [userId]
    );

    const behavior = buildBehaviorInsights({
      totalTrades: tradesResult.rows.length,
      recentTrades: tradesResult.rows,
      riskScore: 20,
    });

    const marketSnapshot = await getMarketSnapshot();
    const portfolio = {
      totalValue: Number(userResult.rows[0]?.balance || 0),
      holdings: holdingsResult.rows,
      cashBalance: Number(userResult.rows[0]?.balance || 0),
    };

    const risk = buildRiskSummary({
      portfolio,
      user: { virtualBalance: Number(userResult.rows[0]?.balance || 0) },
      marketSnapshot,
    });

    return res.status(200).json({
      success: true,
      data: {
        behavior,
        risk,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getInsightsHistory = async (_req, res) => {
  return res.status(200).json({
    success: true,
    data: [],
  });
};
