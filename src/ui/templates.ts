import type { Interval } from '../services/dailyMode.js';

export function renderIntervals(city: string, street: string, house: string, queue: string, subgroup?: string, intervals: Interval[] = [], updatedAt?: string) {
  const header = `Ваша адреса: *${city}, ${street} ${house}*\nЧерга: *${queue}*${subgroup ? `, підгрупа: *${subgroup}*` : ''}`;
  const body = intervals.length
    ? `Сьогодні діють інтервали:\n` + intervals.map(i => `• ${i.start}–${i.end}`).join('\n')
    : `На сьогодні даних немає або не прогнозується.`;
  const footer = `_Останнє оновлення: ${updatedAt ?? '—'}_\n\nАварійні/превентивні відключення можливі поза графіком.`;
  return `${header}\n${body}\n${footer}`;
}

export function renderChangeMsg(oldInts: Interval[], newInts: Interval[]) {
  const oldStr = oldInts.length ? oldInts.map(i => `${i.start}–${i.end}`).join(', ') : '—';
  const newStr = newInts.length ? newInts.map(i => `${i.start}–${i.end}`).join(', ') : '—';
  return `ОНОВЛЕНО: змінилися інтервали для вашої черги:\n• було: ${oldStr}\n• стало: ${newStr}`;
}
