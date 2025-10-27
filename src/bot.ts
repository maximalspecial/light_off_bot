import 'dotenv/config';
import { Telegraf } from 'telegraf';
import { q } from './lib/db.js';
import { getIntervalsForToday } from './services/dailyMode.js';
import { resolveAddress } from './services/addressResolver.js';
import { renderIntervals } from './ui/templates.js';

const bot = new Telegraf(process.env.BOT_TOKEN!);

bot.start(async (ctx) => {
  await ensureUser(ctx);
  return ctx.reply('Введіть адресу у форматі: "Кременчук, Халаменюка 12"\nАбо команда /address');
});

bot.command('address', async (ctx) => {
  await ensureUser(ctx);
  return ctx.reply('Надішліть адресу одним повідомленням: "Кременчук, Халаменюка 12"');
});

bot.command('today', async (ctx) => {
  const u = await getUser(ctx);
  if (!u) return ctx.reply('Спочатку задайте адресу: /address');
  const a = await getLastAddress(u.id);
  if (!a) return ctx.reply('Спочатку задайте адресу: /address');

  const intervals = await getIntervalsForToday(a.queue);
  return ctx.replyWithMarkdown(renderIntervals(a.city, a.street, a.house, a.queue, a.subgroup ?? undefined, intervals, new Date().toLocaleTimeString('uk-UA', { timeZone: process.env.TZ || 'Europe/Kyiv' })));
});

bot.on('text', async (ctx) => {
  await ensureUser(ctx);
  const txt = ctx.message.text.trim();
  const [cityPart, rest] = txt.split(',').map(s => s.trim());
  if (!cityPart || !rest) return ctx.reply('Будь ласка, формат: "Кременчук, Халаменюка 12"');

  const m = rest.match(/^(.+?)\s+(\S+)$/);
  if (!m) return ctx.reply('Не знайшов номер будинку. Формат: "Кременчук, Халаменюка 12"');

  const [, street, house] = m;
  const u = await getUser(ctx);
  const addr = await resolveAddress(u!.id, cityPart, street, house);

  await upsertSub(u!.id, addr.id);

  const intervals = await getIntervalsForToday(addr.queue);
  return ctx.replyWithMarkdown(renderIntervals(addr.city, addr.street, addr.house, addr.queue, addr.subgroup ?? undefined, intervals, new Date().toLocaleTimeString('uk-UA', { timeZone: process.env.TZ || 'Europe/Kyiv' })));
});

async function ensureUser(ctx: any) {
  const chatId = ctx.chat.id;
  await q('insert into users(chat_id) values ($1) on conflict (chat_id) do nothing', [chatId]);
}

async function getUser(ctx: any) {
  const [u] = await q<any>('select * from users where chat_id=$1', [ctx.chat.id]);
  return u;
}

async function getLastAddress(userId: number) {
  const [a] = await q<any>('select * from addresses where user_id=$1 order by updated_at desc limit 1', [userId]);
  return a;
}

async function upsertSub(userId: number, addressId: number) {
  const [s] = await q<any>('select * from subs where user_id=$1 and address_id=$2', [userId, addressId]);
  if (!s) await q('insert into subs(user_id,address_id,active) values ($1,$2,true)', [userId, addressId]);
}

const mode = process.env.BOT_MODE || 'polling';
if (mode === 'webhook') {
  // TODO: додати http-сервер і setWebhook
  console.log('Webhook mode не реалізовано в цьому PoC');
} else {
  bot.launch().then(() => console.log('Bot polling started'));
}

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
