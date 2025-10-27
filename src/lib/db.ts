import 'dotenv/config';
import pg from 'pg';
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
export async function q<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const r = await pool.query(sql, params);
  return r.rows as T[];
}
