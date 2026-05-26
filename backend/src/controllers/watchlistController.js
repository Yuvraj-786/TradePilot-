import pool from "../config/db.js";
import { getQuotes } from "../services/stockService.js";

const getSymbols = async (userId) => {
  const result = await pool.query(
    "SELECT symbol FROM watchlists WHERE user_id = $1 ORDER BY created_at ASC",
    [userId]
  );

  return result.rows.map((row) => row.symbol);
};

export const getWatchlist = async (req, res) => {
  try {
    const symbols = await getSymbols(req.user.id);

    return res.status(200).json({
      success: true,
      data: {
        symbols,
        quotes: await getQuotes(symbols),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const addToWatchlist = async (req, res) => {
  try {
    const { symbol } = req.body;

    if (!symbol) {
      return res.status(400).json({
        success: false,
        message: "Symbol is required.",
      });
    }

    const normalized = symbol.toUpperCase().trim();

    await pool.query(
      "INSERT INTO watchlists(user_id, symbol) VALUES($1, $2) ON CONFLICT DO NOTHING",
      [req.user.id, normalized]
    );

    const symbols = await getSymbols(req.user.id);

    return res.status(200).json({
      success: true,
      message: "Symbol added to watchlist.",
      data: {
        symbols,
        quotes: await getQuotes(symbols),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const removeFromWatchlist = async (req, res) => {
  try {
    const symbol = req.params.symbol?.toUpperCase();

    await pool.query(
      "DELETE FROM watchlists WHERE user_id = $1 AND symbol = $2",
      [req.user.id, symbol]
    );

    const symbols = await getSymbols(req.user.id);

    return res.status(200).json({
      success: true,
      message: "Symbol removed from watchlist.",
      data: {
        symbols,
        quotes: await getQuotes(symbols),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
