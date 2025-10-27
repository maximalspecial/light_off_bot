import { q } from '../lib/db.js';
import { log } from '../lib/logger.js';

export type Interval = { start: string; end: string };

export async function getIntervalsForToday(queue: string, region = 'poltava') {
  const [row] = await q<{ intervals: Interval[] }>(
    `select intervals from daily_mode
     where region=$1 and date=current_date
     and queue=$2
     order by version desc limit 1`,
    [region, queue]
  );
  return row?.intervals ?? [];
}

export async function saveDailyMode(region: string, dateISO: string, version: number, queue: string, intervals: Interval[], source_url?: string) {
  await q(
    `insert into daily_mode(region,date,version,queue,intervals,source_url)
     values ($1,$2,$3,$4,$5,$6)`,
    [region, dateISO, version, queue, JSON.stringify(intervals), source_url ?? null]
  );
  console.log('daily_mode saved', { region, dateISO, version, queue });
}

export async function latestVersion(region: string, dateISO: string) {
  const [row] = await q<{ max: number }>(
    `select coalesce(max(version),0) as max from daily_mode where region=$1 and date=$2`,
    [region, dateISO]
  );
  return row?.max ?? 0;
}
