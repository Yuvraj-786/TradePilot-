import pool from '../config/db.js';


// POST /api/buy
export const buyStock = async (req, res) => {

    const { user_id, symbol, quantity, stockPrice } = req.body;

    if (!user_id || !symbol || !quantity || !stockPrice) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const totalCost = Number((quantity * stockPrice).toFixed(2));

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Check and Deduct Balance
        const balanceResult = await client.query(
            `UPDATE users 
             SET balance = balance - $1 
             WHERE id = $2 
             RETURNING balance`,
            [totalCost, user_id]
        );

        if (balanceResult.rows.length === 0) {
            throw new Error("User not found");
        }

        const newBalance = balanceResult.rows[0].balance;

        if (newBalance < 0) {
            throw new Error("Insufficient balance");
        }

        // 2. Insert Order
        await client.query(
            `INSERT INTO orders 
             (user_id, symbol, order_type, quantity, price, total_amount, status) 
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [user_id, symbol, 'buy', quantity, stockPrice, totalCost, 'completed']
        );

        // 3. Upsert Holdings (Update average price correctly)
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
            [user_id, symbol, quantity, stockPrice]
        );

        await client.query('COMMIT');

        return res.status(200).json({
            success: true,
            message: "Buy order executed successfully",
            data: {
                symbol,
                quantity,
                price: stockPrice,
                totalCost,
                remainingBalance: newBalance
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Buy Order Error:", error);

        // Handle specific errors
        if (error.message === "Insufficient balance") {
            return res.status(400).json({
                success: false,
                message: "Insufficient balance"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to process buy order"
        });
    } finally {
        client.release();
    }
};