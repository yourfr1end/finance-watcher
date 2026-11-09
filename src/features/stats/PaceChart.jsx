import { LineCompare } from '../../components/charts/LineCompare.jsx';
import { addMonths, formatMonth, inMonth } from '../../lib/date.js';
import { formatMoneyRounded } from '../../lib/format.js';
import { COLORS, NEUTRAL_COLOR } from '../../lib/palette.js';
import { useCumulativeByDay } from './useStatsData.js';
import styles from './StatsPage.module.css';
import chartStyles from '../../components/charts/charts.module.css';

/** Cumulative spending of this month (until today) vs the whole previous month. */
export function PaceChart({ currentMonth, selectedKeys }) {
  const prevMonth = addMonths(currentMonth, -1);
  const today = new Date().getDate();
  const current = useCumulativeByDay(currentMonth, selectedKeys, today);
  const previous = useCumulativeByDay(prevMonth, selectedKeys);

  const now = current.values[today - 1] ?? 0;
  const prevSameDay = previous.values[Math.min(today, previous.days) - 1] ?? 0;
  const diff = now - prevSameDay;

  const series = [
    { key: 'prev', label: formatMonth(prevMonth), color: NEUTRAL_COLOR, dashed: true, values: previous.values },
    { key: 'cur', label: formatMonth(currentMonth), color: COLORS[0], values: current.values },
  ];

  return (
    <>
      <p className={styles.lead}>
        К {today}-му числу потрачено <strong>{formatMoneyRounded(now)}</strong>
        {prevSameDay > 0 && (
          <>
            {' '}— на {formatMoneyRounded(Math.abs(diff))} {diff >= 0 ? 'больше' : 'меньше'}, чем {inMonth(prevMonth)} к
            этому дню
          </>
        )}
        .
      </p>
      <div className={chartStyles.legend}>
        {series.map((s) => (
          <span key={s.key} className={chartStyles.legendItem}>
            <span
              className={`${chartStyles.legendLine} ${s.dashed ? chartStyles.legendLineDashed : ''}`}
              style={{ '--swatch': s.color }}
            />
            {s.label}
          </span>
        ))}
      </div>
      <LineCompare
        series={series}
        days={Math.max(current.days, previous.days)}
        formatValue={formatMoneyRounded}
        ariaLabel={`Накопленные траты: ${formatMonth(currentMonth)} ${formatMoneyRounded(now)} к ${today}-му числу, ${formatMonth(prevMonth)} ${formatMoneyRounded(prevSameDay)} к тому же дню`}
      />
    </>
  );
}
