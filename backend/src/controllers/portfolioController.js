import pool from "../config/db.js";
import { getQuotes } from "../services/stockService.js";

export const getPortfolio = async (req, res) => {
  try {
    const userId = req.user.id;

    const balanceResult = await pool.query("SELECT balance FROM users WHERE id = $1", [userId]);
    const holdingsResult = await pool.query(
      "SELECT symbol, quantity, avg_price FROM holdings WHERE user_id = $1",
      [userId]
    );

    const symbols = holdingsResult.rows.map((holding) => holding.symbol);
    const quotes = await getQuotes(symbols);
    const quoteMap = new Map(quotes.map((quote) => [quote.symbol, quote]));

    const holdings = holdingsResult.rows.map((holding) => {
      const quote = quoteMap.get(holding.symbol) || { price: 0 };
      const currentPrice = Number(quote.price || 0);
      const marketValue = currentPrice * Number(holding.quantity);
      const avgPrice = Number(holding.avg_price);

      return {
        symbol: holding.symbol,
        quantity: Number(holding.quantity),
        avgPrice,
        currentPrice,
        marketValue,
        unrealizedPnL: marketValue - (avgPrice * Number(holding.quantity)),
      };
    });

    const cashBalance = Number(balanceResult.rows[0]?.balance || 0);
    const totalInvested = holdings.reduce((sum, holding) => sum + holding.avgPrice * holding.quantity, 0);
    const totalValue = cashBalance + holdings.reduce((sum, holding) => sum + holding.marketValue, 0);

    return res.status(200).json({
      success: true,
      data: {
        cashBalance,
        totalInvested,
        totalValue,
        totalPnL: totalValue - totalInvested,
        holdings,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
