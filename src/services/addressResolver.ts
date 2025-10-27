import { q } from '../lib/db.js';
import { log } from '../lib/logger.js';

/**
 * TODO: Реалізуй реальний он-деманд резолв з офіційної форми.
 * Поки — заглушка: повертає queue/subgroup із кешу або "5/2".
 */
export async function resolveAddress(userId: number, city: string, street: string, house: string) {
  const [row] = await q<any>(
    'select * from addresses where user_id=$1 and city=$2 and street=$3 and house=$4 limit 1',
    [userId, city, street, house]
  );
  if (row) return row;

  const queue = '5', subgroup = '2', source_url = 'https://official.example/form';
  const [inserted] = await q<any>(
    `insert into addresses(user_id, region, city, street, house, queue, subgroup, source_url)
     values ($1,$2,$3,$4,$5,$6,$7,$8) returning *`,
    [userId, 'poltava', city, street, house, queue, subgroup, source_url]
  );
  log.info({ city, street, house, queue, subgroup }, 'address resolved (stub)');
  return inserted;
}
