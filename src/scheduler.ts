import 'dotenv/config';
import { q } from './lib/db.js';
import { Telegraf } from 'telegraf';

const bot = new Telegraf(process.env.BOT_TOKEN!);
const REMIND_OFFSET_MIN = parseInt(process.env.REMIND_OFFSET_MIN || '10', 10);

type Interval = { start: string; end: string };

function parseHHMM(dateISO: string, hhmm: string) {
  const [H, M] = hhmm.split(':').map(Number);
  return new Date(`${dateISO}T${String(H).padStart(2,'0')}:${String(M).padStart(2,'0')}:00+02:00`);
}

function intsEqual(a: Interval[], b: Interval[]) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function msgChange(oldInts: Interval[], newInts: Interval[]) {
  const oldStr = oldInts.length ? oldInts.map(i => `${i.start}–${i.end}`).join(', ') : '—';
  const newStr = newInts.length ? newInts.map(i => `${i.start}–${i.end}`).join(', ') : '—';
  return `ОНОВЛЕНО: змінилися інтервали для вашої черги:\n• було: ${oldStr}\n• стало: ${newStr}`;
}

async function run() {
  const dateISO = new Date().toISOString().slice(0,10);

  const rows = await q<any>(
    `with last_versions as (
       select region, queue, max(version) as v from daily_mode where date=$1 group by 1,2
     )
     select dm.region, dm.queue, dm.version, dm.intervals
     from daily_mode dm
     join last_versions lv on lv.region=dm.region and lv.queue=dm.queue and lv.v=dm.version
     where dm.date=$1`,
    [dateISO]
  );

  for (const row of rows) {
    const prev = await q<any>(
      `select intervals from daily_mode
       where region=$1 and date=$2 and queue=$3 and version=$4-1`,
      [row.region, dateISO, row.queue, row.version]
    );
    const oldInts: Interval[] = prev[0]?.intervals ?? [];
    const newInts: Interval[] = row.intervals ?? [];

    if (!intsEqual(oldInts, newInts)) {
      const subs = await q<any>(
        `select u.chat_id, a.id as address_id from subs s
         join addresses a on a.id=s.address_id
         join users u on u.id=s.user_id
         where s.active=true and a.queue=$1`,
        [row.queue]
      );

      for (const s of subs) {
        try { await bot.telegram.sendMessage(s.chat_id, msgChange(oldInts, newInts)); } catch {}
      }

      await q('delete from jobs where date=$1 and queue=$2', [dateISO, row.queue]);
      for (const it of newInts) {
        const offAt = new Date(parseHHMM(dateISO, it.start).getTime() - REMIND_OFFSET_MIN * 60 * 1000);
        const onAt  = new Date(parseHHMM(dateISO, it.end  ).getTime() - REMIND_OFFSET_MIN * 60 * 1000);

        const users = await q<any>(
          `select u.id as user_id, a.id as address_id, u.chat_id from subs s
           join addresses a on a.id=s.address_id
           join users u on u.id=s.user_id
           where s.active=true and a.queue=$1`,
          [row.queue]
        );

        const now = new Date();
        for (const u of users) {
          if (offAt > now) {
            await q('insert into jobs(user_id,address_id,queue,date,kind,run_at) values ($1,$2,$3,$4,$5,$6)',
              [u.user_id, u.address_id, row.queue, dateISO, 'off', offAt]);
          }
          if (onAt > now) {
            await q('insert into jobs(user_id,address_id,queue,date,kind,run_at) values ($1,$2,$3,$4,$5,$6)',
              [u.user_id, u.address_id, row.queue, dateISO, 'on', onAt]);
          }
        }
      }
    }
  }

  const due = await q<any>(
    `select j.*, u.chat_id from jobs j
     join users u on u.id=j.user_id
     where status='scheduled' and run_at <= now()`
  );
  for (const j of due) {
    try {
      const verb = j.kind == 'off' ? 'ймовірне вимкнення' : 'ймовірне вмикання';
      await bot.telegram.sendMessage(j.chat_id, `Нагадування: через ${REMIND_OFFSET_MIN} хв *${verb}*.`, { parse_mode: 'Markdown' });
      await q('update jobs set status=$1 where id=$2', ['sent', j.id]);
    } catch {
      await q('update jobs set status=$1 where id=$2', ['canceled', j.id]);
    }
  }
}

run().catch(e => { console.error(e); process.exit(1); });
