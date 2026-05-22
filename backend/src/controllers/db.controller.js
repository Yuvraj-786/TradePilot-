import pool from '../config/db.js';

export const dbTest = async(req, res) => {
    try {
        const result = await pool.query(
            'SELECT NOW()'
        );
        res.status(200).json({
            success: true,
            message: "database connection successfull",
            data: result.rows[0]
        })
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
}