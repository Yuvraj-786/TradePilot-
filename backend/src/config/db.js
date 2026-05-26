import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

export const initializeSchema = async () => {
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGSERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        balance NUMERIC(14, 2) NOT NULL DEFAULT 100000,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        symbol TEXT NOT NULL,
        order_type TEXT NOT NULL,
        quantity NUMERIC(14, 4) NOT NULL,
        price NUMERIC(14, 4) NOT NULL,
        total_amount NUMERIC(14, 2) NOT NULL,
        status TEXT NOT NULL DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS holdings (
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        symbol TEXT NOT NULL,
        quantity NUMERIC(14, 4) NOT NULL,
        avg_price NUMERIC(14, 4) NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (user_id, symbol)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS watchlists (
        id SERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        symbol TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE (user_id, symbol)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        default_order_type TEXT DEFAULT 'MARKET',
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      ALTER TABLE IF EXISTS users
      ALTER COLUMN password TYPE TEXT
    `);
  } finally {
    client.release();
  }
};

export default pool;
