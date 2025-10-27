export function nowKyiv() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: process.env.TZ || 'Europe/Kyiv' }));
}
