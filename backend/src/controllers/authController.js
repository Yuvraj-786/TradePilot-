import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

const createToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET || "tradepilot-dev-secret", {
    expiresIn: "7d",
  });

const buildUserResponse = async (userId) => {
  const userResult = await pool.query(
    "SELECT u.id, u.name, u.email, u.balance, p.default_order_type FROM users u LEFT JOIN user_preferences p ON p.user_id = u.id WHERE u.id = $1",
    [userId]
  );

  const user = userResult.rows[0];

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    balance: Number(user.balance),
    defaultOrderType: user.default_order_type || "MARKET",
  };
};

export const register = async (req, res) => {
  const client = await pool.connect();

  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required.",
      });
    }

    await client.query("BEGIN");

    const existingUser = await client.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existingUser.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        message: "Email already registered.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await client.query(
      "INSERT INTO users(name, email, password) VALUES($1, $2, $3) RETURNING id, name, email, balance",
      [name, email, hashedPassword]
    );

    await client.query(
      "INSERT INTO user_preferences(user_id, default_order_type) VALUES($1, 'MARKET')",
      [user.rows[0].id]
    );

    await client.query("COMMIT");

    const token = createToken(user.rows[0].id);
    const responseUser = await buildUserResponse(user.rows[0].id);

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      token,
      user: responseUser,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    client.release();
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = createToken(user.id);
    const responseUser = await buildUserResponse(user.id);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: responseUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const demoLogin = async (_req, res) => {
  const client = await pool.connect();

  try {
    const email = "demo@tradepilot.local";
    const name = "Demo Trader";
    const password = "demo-account";

    await client.query("BEGIN");

    let userResult = await client.query("SELECT id FROM users WHERE email = $1", [email]);

    if (userResult.rows.length === 0) {
      const hashedPassword = await bcrypt.hash(password, 10);
      userResult = await client.query(
        "INSERT INTO users(name, email, password) VALUES($1, $2, $3) RETURNING id",
        [name, email, hashedPassword]
      );
    }

    await client.query(
      `INSERT INTO user_preferences(user_id, default_order_type)
       VALUES($1, 'MARKET')
       ON CONFLICT (user_id) DO NOTHING`,
      [userResult.rows[0].id]
    );

    await client.query("COMMIT");

    const token = createToken(userResult.rows[0].id);
    const responseUser = await buildUserResponse(userResult.rows[0].id);

    return res.status(200).json({
      success: true,
      message: "Demo account ready.",
      token,
      user: responseUser,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    client.release();
  }
};

export const getProfile = async (req, res) => {
  const user = await buildUserResponse(req.user.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found.",
    });
  }

  return res.status(200).json({
    success: true,
    user,
  });
};

export const updateProfile = async (req, res) => {
  const client = await pool.connect();

  try {
    const { name, email, balance, defaultOrderType } = req.body;
    const userId = req.user.id;

    if (
      name === undefined &&
      email === undefined &&
      balance === undefined &&
      defaultOrderType === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update.",
      });
    }

    await client.query("BEGIN");

    if (email !== undefined) {
      const emailCheck = await client.query("SELECT id FROM users WHERE email = $1 AND id <> $2", [email, userId]);
      if (emailCheck.rows.length > 0) {
        await client.query("ROLLBACK");
        return res.status(409).json({
          success: false,
          message: "Email already registered.",
        });
      }
    }

    const fields = [];
    const values = [];
    let idx = 1;

    if (name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(name);
    }

    if (email !== undefined) {
      fields.push(`email = $${idx++}`);
      values.push(email);
    }

    if (balance !== undefined) {
      fields.push(`balance = $${idx++}`);
      values.push(Number(balance));
    }

    if (fields.length > 0) {
      values.push(userId);
      await client.query(
        `UPDATE users SET ${fields.join(", ")} WHERE id = $${idx}`,
        values
      );
    }

    if (defaultOrderType !== undefined) {
      await client.query(
        `INSERT INTO user_preferences(user_id, default_order_type)
         VALUES($1, $2)
         ON CONFLICT (user_id) DO UPDATE SET default_order_type = EXCLUDED.default_order_type, updated_at = NOW()`,
        [userId, defaultOrderType]
      );
    }

    await client.query("COMMIT");
    const responseUser = await buildUserResponse(userId);

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: responseUser,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    client.release();
  }
};
