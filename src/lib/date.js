/**
 * Date helpers. All keys are in the user's local time zone:
 *   monthKey "2026-11", dayKey "2026-11-09" (same format as <input type="date">).
 */

const pad = (n) => String(n).padStart(2, '0');

export const toMonthKey = (ts) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};

export const toDayKey = (ts) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const currentMonthKey = () => toMonthKey(Date.now());

export const isMonthKey = (value) => typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);

/** [start, end) timestamps of a month */
export function monthRange(monthKey) {
  const [y, m] = monthKey.split('-').map(Number);
  return [new Date(y, m - 1, 1).getTime(), new Date(y, m, 1).getTime()];
}

export function addMonths(monthKey, delta) {
  const [y, m] = monthKey.split('-').map(Number);
  return toMonthKey(new Date(y, m - 1 + delta, 1));
}

const monthFormat = new Intl.DateTimeFormat('ru-RU', { month: 'long' });

/** "Ноябрь 2026" */
export function formatMonth(monthKey) {
  const [start] = monthRange(monthKey);
  const name = monthFormat.format(start);
  return `${name[0].toUpperCase()}${name.slice(1)} ${monthKey.slice(0, 4)}`;
}

const dayFormat = new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });

/** "Сегодня" / "Вчера" / "пятница, 7 ноября" */
export function formatDay(dayKey, now = Date.now()) {
  if (dayKey === toDayKey(now)) return 'Сегодня';
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (dayKey === toDayKey(yesterday)) return 'Вчера';
  return dayFormat.format(dayKeyToDate(dayKey));
}

const MONTHS_PREPOSITIONAL = [
  'январе', 'феврале', 'марте', 'апреле', 'мае', 'июне',
  'июле', 'августе', 'сентябре', 'октябре', 'ноябре', 'декабре',
];
const MONTHS_GENITIVE = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

/** "в октябре" */
export const inMonth = (monthKey) => `в ${MONTHS_PREPOSITIONAL[Number(monthKey.slice(5)) - 1]}`;

/** "1–10 октября" (or "1 октября" for a single day) */
export function dayRangeLabel(monthKey, lastDay) {
  const month = MONTHS_GENITIVE[Number(monthKey.slice(5)) - 1];
  return lastDay <= 1 ? `1 ${month}` : `1–${lastDay} ${month}`;
}

export function dayKeyToDate(dayKey) {
  const [y, m, d] = dayKey.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Timestamp for a picked day, keeping the time of day from `timeSource`
 * (so expenses within one day stay in the order they were entered).
 */
export function withDay(dayKey, timeSource = Date.now()) {
  const date = dayKeyToDate(dayKey);
  const t = new Date(timeSource);
  date.setHours(t.getHours(), t.getMinutes(), t.getSeconds(), t.getMilliseconds());
  return date.getTime();
}

export function shiftDay(dayKey, delta) {
  const date = dayKeyToDate(dayKey);
  date.setDate(date.getDate() + delta);
  return toDayKey(date);
}
