import { useState } from 'react';
import { formatCompact } from '../../lib/format.js';
import { ChartTooltip } from './ChartTooltip.jsx';
import { niceMax, useElementWidth } from './useElementWidth.js';
import styles from './charts.module.css';

const PAD = { top: 10, right: 4, bottom: 22, left: 44 };
const SEGMENT_GAP = 2; // surface gap between stacked fills
const RADIUS = 4; // rounded data end (top), square at the baseline

/** rect with only the top corners rounded */
function topRoundedRect(x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h);
  return `M ${x} ${y + h} V ${y + rr} Q ${x} ${y} ${x + rr} ${y} H ${x + w - rr} Q ${x + w} ${y} ${x + w} ${y + rr} V ${y + h} Z`;
}

/**
 * Stacked columns (one per period), parts stacked bottom-up in the given order.
 * columns: { key, label, tooltipTitle, total, parts: { key, label, color, value }[] }[]
 * formatValue: for the tooltip.
 */
export function StackedColumns({ columns, height = 200, formatValue, ariaLabel }) {
  const [ref, width] = useElementWidth();
  const [active, setActive] = useState(null);

  const innerW = Math.max(width - PAD.left - PAD.right, 0);
  const innerH = height - PAD.top - PAD.bottom;
  const max = niceMax(Math.max(0, ...columns.map((c) => c.total)));
  const ticks = [0, max / 2, max];
  const band = columns.length ? innerW / columns.length : 0;
  const barW = Math.max(Math.min(band * 0.62, 40), 4);
  const y = (v) => PAD.top + innerH - (v / max) * innerH;
  const centerX = (i) => PAD.left + band * i + band / 2;

  const activeColumn = active != null ? columns[active] : null;

  return (
    <div ref={ref} className={styles.chart} onPointerLeave={() => setActive(null)}>
      {width > 0 && (
        <svg width={width} height={height} className={styles.svg} role="img" aria-label={ariaLabel}>
          {ticks.map((t) => (
            <g key={t}>
              <line className={styles.grid} x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} />
              <text className={styles.axisText} x={PAD.left - 6} y={y(t)} textAnchor="end" dominantBaseline="central">
                {t === 0 ? '0' : formatCompact(t)}
              </text>
            </g>
          ))}

          {columns.map((c, i) => {
            const x = centerX(i) - barW / 2;
            const dim = active != null && active !== i;
            let base = 0;
            const visible = c.parts.filter((p) => p.value > 0);
            return (
              <g key={c.key} className={styles.column} opacity={dim ? 0.4 : 1}>
                {visible.map((p, j) => {
                  const top = y(base + p.value);
                  const bottom = y(base);
                  base += p.value;
                  const isTop = j === visible.length - 1;
                  // gap above every segment except the top one
                  const h = Math.max(bottom - top - (isTop ? 0 : SEGMENT_GAP), 0);
                  const yTop = isTop ? top : top + SEGMENT_GAP;
                  return isTop ? (
                    <path key={p.key} d={topRoundedRect(x, yTop, barW, h, RADIUS)} fill={p.color} />
                  ) : (
                    <rect key={p.key} x={x} y={yTop} width={barW} height={h} fill={p.color} />
                  );
                })}
                <text className={styles.axisText} x={centerX(i)} y={height - 6} textAnchor="middle">
                  {c.label}
                </text>
                {/* hit target: the whole band, taller than the bar */}
                <rect
                  x={PAD.left + band * i}
                  y={PAD.top}
                  width={band}
                  height={innerH + PAD.bottom}
                  fill="transparent"
                  onPointerEnter={(e) => e.pointerType === 'mouse' && setActive(i)}
                  onClick={() => setActive((prev) => (prev === i ? null : i))}
                />
              </g>
            );
          })}
        </svg>
      )}

      {activeColumn && (
        <ChartTooltip
          x={centerX(active)}
          chartWidth={width}
          title={activeColumn.tooltipTitle ?? activeColumn.label}
          rows={[
            { key: 'total', label: 'Всего', value: formatValue(activeColumn.total), strong: true },
            ...[...activeColumn.parts]
              .filter((p) => p.value > 0)
              .sort((a, b) => b.value - a.value)
              .map((p) => ({ key: p.key, label: p.label, value: formatValue(p.value), color: p.color })),
          ]}
        />
      )}
    </div>
  );
}
