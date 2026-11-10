import { useState } from 'react';
import { DonutChart } from '../../components/DonutChart/DonutChart.jsx';
import { CategoryIcon } from '../../components/CategoryIcon/CategoryIcon.jsx';
import { Icon } from '../../components/Icon/Icon.jsx';
import { formatMoney, pluralize } from '../../lib/format.js';
import { paint } from '../../lib/palette.js';
import styles from './MonthSummary.module.css';

const COLLAPSED_ROWS = 5;

const formatPercent = (value, total) => {
  const p = (value / total) * 100;
  return p > 0 && p < 1 ? '<1%' : `${Math.round(p)}%`;
};

const ARROWS = { up: 'arrowUp', down: 'arrowDown', same: 'equal' };

/**
 * Donut + ranked legend for one month.
 * selectedKey / onSelect are owned by the page (selection also filters the expense list).
 */
export function MonthSummary({ rows, slices, total, count, comparison, selectedKey, onSelect, animationKey }) {
  const [hoveredKey, setHoveredKey] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const shownKey = hoveredKey ?? selectedKey;
  const shown = rows.find((r) => r.key === shownKey) ?? slices.find((s) => s.key === shownKey) ?? null;
  // a folded category (legend row) highlights the "Другое" slice
  const activeSliceKey = shown ? (slices.find((s) => s.key === shown.key || s.members?.has(shown.key))?.key ?? null) : null;
  const maxValue = rows[0]?.value ?? 0;

  const toggle = (key) => onSelect(selectedKey === key ? null : key);
  const mouseHover = (key) => (e) => e.pointerType === 'mouse' && setHoveredKey(key);

  const hiddenCount = rows.length - COLLAPSED_ROWS;
  // never hide the selected row behind "show all"
  const visibleRows =
    expanded || hiddenCount <= 1 ? rows : rows.filter((r, i) => i < COLLAPSED_ROWS || r.key === selectedKey);

  return (
    <section className={styles.root} aria-label="Траты за месяц по категориям">
      <DonutChart
        segments={slices}
        activeKey={activeSliceKey}
        onSelect={toggle}
        onHover={setHoveredKey}
        animationKey={animationKey}
        ariaLabel={`Траты по категориям: ${rows.map((r) => `${r.label} ${formatPercent(r.value, total)}`).join(', ')}`}
      >
        {shown ? (
          <>
            {shown.icon && <span className={styles.centerIcon}>{shown.icon}</span>}
            <span className={styles.centerLabel}>{shown.label}</span>
            <strong className={styles.centerValue}>{formatMoney(shown.value)}</strong>
            <span className={styles.centerSub}>{formatPercent(shown.value, total)} от месяца</span>
          </>
        ) : (
          <>
            <span className={styles.centerLabel}>Потрачено</span>
            <strong className={styles.centerValue}>{formatMoney(total)}</strong>
            <span className={styles.centerSub}>
              {count} {pluralize(count, ['трата', 'траты', 'трат'])}
            </span>
          </>
        )}
      </DonutChart>

      {comparison && (
        <p className={styles.comparison}>
          <span className={styles.arrow} aria-hidden="true">
            <Icon name={ARROWS[comparison.direction]} size={12} strokeWidth={2.5} />
          </span>
          {comparison.text}
        </p>
      )}

      <ul className={styles.legend} onPointerLeave={() => setHoveredKey(null)}>
        {visibleRows.map((r) => {
          const selected = r.key === selectedKey;
          return (
            <li key={r.key}>
              <button
                type="button"
                className={`${styles.row} ${selected ? styles.rowSelected : ''}`}
                aria-pressed={selected}
                onClick={() => toggle(r.key)}
                onPointerEnter={mouseHover(r.key)}
              >
                <CategoryIcon icon={r.icon} color={r.color} size={32} />
                <span className={styles.main}>
                  <span className={styles.line}>
                    <span className={styles.name}>{r.label}</span>
                    <span className={styles.amount}>{formatMoney(r.value)}</span>
                  </span>
                  <span className={styles.line}>
                    <span className={styles.track} aria-hidden="true">
                      <span
                        className={styles.bar}
                        style={{ width: `${(r.value / maxValue) * 100}%`, background: paint(r.color) }}
                      />
                    </span>
                    <span className={styles.percent}>{formatPercent(r.value, total)}</span>
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {hiddenCount > 1 && (
        <button type="button" className={`btn btn-ghost ${styles.more}`} onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Свернуть' : `Показать все (${rows.length})`}
        </button>
      )}
    </section>
  );
}
