import pool from '../config/db.js';

export const createUser = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const result = await pool.query(
            'INSERT INTO users(name, email, password) VALUES($1, $2, $3) RETURNING *',
            [name, email, password]
        );
        res.status(201).json({
            success: true,
            message: "User created",
            data: result.rows[0]
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users');
        res.json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        })
    }
};

export const getUserById = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await pool.query('SELECT * FROM users WHERE id = $1', [id]);

        if (user.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            data: user.rows[0]
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        })
    }
};