import { useLayoutEffect, useRef, useState } from 'react';
import styles from './charts.module.css';

/**
 * Tooltip anchored at x (px from the chart's left edge), clamped inside the chart width.
 * rows: { key, label, value, color?, dashed?, strong? }[]
 */
export function ChartTooltip({ x, chartWidth, title, rows }) {
  const ref = useRef(null);
  const [tipWidth, setTipWidth] = useState(0);

  useLayoutEffect(() => {
    setTipWidth(ref.current?.offsetWidth ?? 0);
  }, [title, rows.length]);

  const left = Math.min(Math.max(x - tipWidth / 2, 0), Math.max(chartWidth - tipWidth, 0));

  return (
    <div ref={ref} className={styles.tooltip} style={{ left }} role="status">
      <div className={styles.tooltipTitle}>{title}</div>
      {rows.map((r) => (
        <div key={r.key} className={`${styles.tooltipRow} ${r.strong ? styles.tooltipStrong : ''}`}>
          {r.color && (
            <span
              className={`${styles.tooltipSwatch} ${r.dashed ? styles.tooltipSwatchDashed : ''}`}
              style={{ '--swatch': r.color }}
              aria-hidden="true"
            />
          )}
          <span className={styles.tooltipLabel}>{r.label}</span>
          <span className={styles.tooltipValue}>{r.value}</span>
        </div>
      ))}
    </div>
  );
}
