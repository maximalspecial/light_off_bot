import 'dotenv/config';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import pg from 'pg';
const { Client } = pg as any;

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const files = readdirSync('sql').sort();
  for (const f of files) {
    const sql = readFileSync(join('sql', f), 'utf8');
    console.log('> applying', f);
    await client.query(sql);
  }

  await client.end();
  console.log('migrations done');
}

main().catch(e => { console.error(e); process.exit(1); });
