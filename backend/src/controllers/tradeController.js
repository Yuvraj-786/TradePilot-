import pool from "../config/db.js";
import { analyzeTrade } from "../services/aiService.js";
import { getQuote } from "../services/stockService.js";

const getUserId = (req) => req.user?.id || req.body.user_id;

export const buyStock = async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = getUserId(req);
    const { symbol, quantity } = req.body;

    if (!userId || !symbol || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields.",
      });
    }

    const quote = await getQuote(symbol);
    const price = quote.price;
    const totalCost = Number((Number(quantity) * price).toFixed(2));

    await client.query("BEGIN");

    const balanceResult = await client.query(
      "UPDATE users SET balance = balance - $1 WHERE id = $2 RETURNING balance",
      [totalCost, userId]
    );

    if (balanceResult.rows.length === 0) {
      throw new Error("User not found");
    }

    const newBalance = balanceResult.rows[0].balance;
    if (newBalance < 0) {
      throw new Error("Insufficient balance");
    }

    await client.query(
      "INSERT INTO orders (user_id, symbol, order_type, quantity, price, total_amount, status) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [userId, symbol.toUpperCase(), "buy", Number(quantity), price, totalCost, "completed"]
    );

    await client.query(
      `INSERT INTO holdings (user_id, symbol, quantity, avg_price)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, symbol)
       DO UPDATE SET
         quantity = holdings.quantity + EXCLUDED.quantity,
         avg_price = (
           (holdings.quantity * holdings.avg_price) +
           (EXCLUDED.quantity * EXCLUDED.avg_price)
         ) / (holdings.quantity + EXCLUDED.quantity)
      `,
      [userId, symbol.toUpperCase(), Number(quantity), price]
    );

    await client.query("COMMIT");

    const aiResult = analyzeTrade({
      userBalance: newBalance,
      portfolio: { cashBalance: newBalance, holdings: [] },
      symbol: symbol.toUpperCase(),
      action: "buy",
      quantity: Number(quantity),
      price,
      totalAmount: totalCost,
    });

    return res.status(200).json({
      success: true,
      message: "Buy order executed successfully",
      data: {
        symbol: symbol.toUpperCase(),
        quantity: Number(quantity),
        price,
        totalCost,
        remainingBalance: newBalance,
        ai: aiResult,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");

    if (error.message === "Insufficient balance") {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    client.release();
  }
};

export const sellStock = async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = getUserId(req);
    const { symbol, quantity } = req.body;

    if (!userId || !symbol || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields.",
      });
    }

    const quote = await getQuote(symbol);
    const price = quote.price;
    const totalAmount = Number((Number(quantity) * price).toFixed(2));
    const tradeQty = Number(quantity);

    await client.query("BEGIN");

    const holdingResult = await client.query(
      "SELECT quantity FROM holdings WHERE user_id = $1 AND symbol = $2 FOR UPDATE",
      [userId, symbol.toUpperCase()]
    );

    if (holdingResult.rows.length === 0 || Number(holdingResult.rows[0].quantity) < tradeQty) {
      throw new Error("Insufficient shares to sell");
    }

    const balanceResult = await client.query(
      "UPDATE users SET balance = balance + $1 WHERE id = $2 RETURNING balance",
      [totalAmount, userId]
    );

    await client.query(
      "INSERT INTO orders (user_id, symbol, order_type, quantity, price, total_amount, status) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [userId, symbol.toUpperCase(), "sell", tradeQty, price, totalAmount, "completed"]
    );

    if (Number(holdingResult.rows[0].quantity) === tradeQty) {
      await client.query(
        "DELETE FROM holdings WHERE user_id = $1 AND symbol = $2",
        [userId, symbol.toUpperCase()]
      );
    } else {
      await client.query(
        "UPDATE holdings SET quantity = quantity - $1 WHERE user_id = $2 AND symbol = $3",
        [tradeQty, userId, symbol.toUpperCase()]
      );
    }

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: "Sell order executed successfully",
      data: {
        symbol: symbol.toUpperCase(),
        quantity: Number(quantity),
        price,
        totalAmount,
        remainingBalance: balanceResult.rows[0].balance,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");

    if (error.message === "Insufficient shares to sell") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    client.release();
  }
};

export const createTrade = async (req, res) => {
  return buyStock(req, res);
};

export const getTrades = async (req, res) => {
  try {
    const userId = getUserId(req);
    const result = await pool.query(
      "SELECT * FROM orders WHERE user_id = $1 ORDER BY id DESC",
      [userId]
    );

    return res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
