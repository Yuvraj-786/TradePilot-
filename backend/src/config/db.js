import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// handle connection errors
pool.on('error', (err) => {
    console.error("Unexpected error on idle client", err);
    process.exit(-1);
});

export default pool;
