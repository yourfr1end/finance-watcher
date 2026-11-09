import { useSpendingBetween } from '../../store/selectors.js';
import { addMonths, dayRangeLabel, inMonth, monthRange } from '../../lib/date.js';
import { formatMoney } from '../../lib/format.js';

/**
 * Compares the month with the previous one.
 * For the current (unfinished) month compares like-for-like: days 1..today of both months,
 * otherwise "you spent less" would be shown every month until its last day.
 * -> { text, direction: 'up' | 'down' | 'same' } | null
 */
export function useMonthComparison(month, currentMonth, total) {
  const prev = addMonths(month, -1);
  const [prevStart, prevEnd] = monthRange(prev);
  const isCurrent = month === currentMonth;
  const today = new Date().getDate();
  // same number of days into the previous month (clamped to its length)
  const end = isCurrent ? Math.min(new Date(prevStart).setDate(today + 1), prevEnd) : prevEnd;
  const prevTotal = useSpendingBetween(prevStart, end);

  if (prevTotal <= 0) return null;
  const diff = total - prevTotal;
  const period = isCurrent ? `за ${dayRangeLabel(prev, new Date(end - 1).getDate())}` : inMonth(prev);
  if (Math.abs(diff) < 0.5) return { text: `Столько же, сколько ${period}`, direction: 'same' };
  return {
    text: `На ${formatMoney(Math.abs(diff))} ${diff > 0 ? 'больше' : 'меньше'}, чем ${period}`,
    direction: diff > 0 ? 'up' : 'down',
  };
}
