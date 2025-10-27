import 'dotenv/config';
import { latestVersion, saveDailyMode } from './services/dailyMode.js';

async function run() {
  const region = 'poltava';
  const dateISO = new Date().toISOString().slice(0,10);
  const version = (await latestVersion(region, dateISO)) + 1;

  // TODO: Реальний парсер офіційних оголошень (щогодини). Поки — демо дані.
  const intervals = [{ start: '13:00', end: '14:30' }, { start: '19:00', end: '22:30' }];
  await saveDailyMode(region, dateISO, version, '5', intervals, 'https://official.example/news/123');
}

run().catch(e => { console.error(e); process.exit(1); });
