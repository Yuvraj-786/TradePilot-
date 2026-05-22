import pool from '../config/db.js';

const stockPrice = 200;

export const buyStock = (req, res) => {
    const {user_id, symbol, quantity} = req.body;

    try {
        const user = await pool.query('SELECT balance FROM users WHERE user_id = $1', [user_id]);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
    }
    const totalCost = stockPrice * quantity;

    return res.json({
        success: true,
        message: "buy route working",
        data: {
            "user_id" : user_id,
            "symbol": symbol,
            "quantity": quantity,
            "stockPrice": stockPrice,
            "totalCost": totalCost
        }
    });
}

// export const getUserById = async (req, res) => {
//     const { id } = req.params;

//     try {
//         const user = await pool.query('SELECT * FROM users WHERE id = $1', [id]);

//         if (user.rows.length === 0) {
//             return res.status(404).json({
//                 success: false,
//                 message: "User not found"
//             });
//         }

//         res.json({
//             success: true,
//             data: user.rows[0]
//         });
//     } catch (err) {
//         res.status(500).json({
//             success: false,
//             message: err.message
//         })
//     }
// };