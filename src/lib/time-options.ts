import type { TimeFormat } from '@/db/child';

export function formatTime(date: Date, format: TimeFormat = '24h') {
  if (format === '12h') {
    const hours24 = date.getHours();
    const period = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
    return `${hours12}:${String(date.getMinutes()).padStart(2, '0')} ${period}`;
  }
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
