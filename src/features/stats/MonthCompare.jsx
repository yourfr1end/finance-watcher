import { useId, useMemo, useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore.js';
import { CategoryIcon } from '../../components/CategoryIcon/CategoryIcon.jsx';
import { Icon } from '../../components/Icon/Icon.jsx';
import { addMonths, formatMonthShort, toMonthKey } from '../../lib/date.js';
import { formatDelta, formatMoneyRounded } from '../../lib/format.js';
import { NEUTRAL_COLOR, paint } from '../../lib/palette.js';
import { useMonthPair } from './useStatsData.js';
import styles from './StatsPage.module.css';

/** Months from the first expense (at least 12 back) up to the current one, newest first. */
function useMonthOptions(currentMonth) {
  const expenses = useFinanceStore((s) => s.expenses);
  return useMemo(() => {
    const first = expenses.reduce((min, e) => Math.min(min, e.date), Date.now());
    const firstKey = [toMonthKey(first), addMonths(currentMonth, -11)].sort()[0];
    const list = [];
    for (let m = currentMonth; m >= firstKey; m = addMonths(m, -1)) list.push(m);
    return list;
  }, [expenses, currentMonth]);
}

export function MonthCompare({ currentMonth, selectedKeys }) {
  const options = useMonthOptions(currentMonth);
  const [monthA, setMonthA] = useState(addMonths(currentMonth, -1));
  const [monthB, setMonthB] = useState(currentMonth);
  const { a, b, rows } = useMonthPair(monthA, monthB, selectedKeys);
  const idA = useId();
  const idB = useId();

  const max = Math.max(0, ...rows.flatMap((r) => [r.a, r.b]));
  const totalDelta = b - a;
  const swap = () => {
    setMonthA(monthB);
    setMonthB(monthA);
  };

  const monthOptions = options.map((m) => (
    <option key={m} value={m}>
      {formatMonthShort(m)}
    </option>
  ));

  return (
    <>
      <div className={styles.pair}>
        <label className={styles.pairField} htmlFor={idA}>
          <span className={styles.pairSwatch} style={{ background: paint(NEUTRAL_COLOR) }} aria-hidden="true" />
          <select id={idA} className="input" value={monthA} onChange={(e) => setMonthA(e.target.value)}>
            {monthOptions}
          </select>
        </label>
        <button type="button" className={`btn btn-ghost ${styles.swap}`} onClick={swap} aria-label="Поменять местами">
          <Icon name="swap" size={20} />
        </button>
        <label className={styles.pairField} htmlFor={idB}>
          <span className={`${styles.pairSwatch} ${styles.pairSwatchColor}`} aria-hidden="true" />
          <select id={idB} className="input" value={monthB} onChange={(e) => setMonthB(e.target.value)}>
            {monthOptions}
          </select>
        </label>
      </div>

      <div className={styles.pairTotals}>
        <span>
          {formatMoneyRounded(a)} → <strong>{formatMoneyRounded(b)}</strong>
        </span>
        {a > 0 && (
          <span className={styles.deltaBadge}>
            {formatDelta(totalDelta)} ({totalDelta >= 0 ? '+' : '−'}
            {Math.abs(Math.round((totalDelta / a) * 100))}%)
          </span>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="empty">В этих месяцах трат нет.</p>
      ) : (
        <ul className={styles.compare}>
          {rows.map((r) => (
            <li key={r.key} className={styles.compareRow}>
              <CategoryIcon icon={r.icon} color={r.color} size={28} />
              <div className={styles.compareMain}>
                <div className={styles.rankLine}>
                  <span className={styles.rankName}>{r.label}</span>
                  <span className={styles.delta} data-direction={r.delta > 0 ? 'up' : r.delta < 0 ? 'down' : 'same'}>
                    {formatDelta(r.delta)}
                  </span>
                </div>
                <div className={styles.pairBars}>
                  <span className={styles.pairBarLine}>
                    <span className={styles.track}>
                      <span
                        className={styles.bar}
                        style={{ width: `${(r.a / max) * 100}%`, background: paint(NEUTRAL_COLOR) }}
                      />
                    </span>
                    <span className={styles.pairValue}>{formatMoneyRounded(r.a)}</span>
                  </span>
                  <span className={styles.pairBarLine}>
                    <span className={styles.track}>
                      <span
                        className={styles.bar}
                        style={{ width: `${(r.b / max) * 100}%`, background: paint(r.color) }}
                      />
                    </span>
                    <span className={styles.pairValue}>{formatMoneyRounded(r.b)}</span>
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
