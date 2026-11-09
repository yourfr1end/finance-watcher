import { useState } from 'react';
import { formatCompact } from '../../lib/format.js';
import { paint } from '../../lib/palette.js';
import { ChartTooltip } from './ChartTooltip.jsx';
import { niceMax, useElementWidth } from './useElementWidth.js';
import styles from './charts.module.css';

const PAD = { top: 10, right: 10, bottom: 22, left: 44 };

/**
 * Lines over days 1..days with a crosshair. Single y-axis.
 * series: { key, label, color, dashed?, values: number[] }  — values[d - 1] = value on day d;
 *         a shorter array simply ends the line (e.g. the current month ends today).
 * formatValue: for the tooltip.
 */
export function LineCompare({ series, days, height = 200, formatValue, ariaLabel }) {
  const [ref, width] = useElementWidth();
  const [day, setDay] = useState(null);

  const innerW = Math.max(width - PAD.left - PAD.right, 0);
  const innerH = height - PAD.top - PAD.bottom;
  const max = niceMax(Math.max(0, ...series.flatMap((s) => s.values)));
  const ticks = [0, max / 2, max];
  const x = (d) => PAD.left + ((d - 1) / Math.max(days - 1, 1)) * innerW;
  const y = (v) => PAD.top + innerH - (v / max) * innerH;
  const xTicks = [1, 10, 20, days].filter((d, i, a) => d <= days && a.indexOf(d) === i);

  const pickDay = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left - PAD.left) / innerW;
    setDay(Math.min(Math.max(Math.round(ratio * (days - 1)) + 1, 1), days));
  };

  return (
    <div ref={ref} className={styles.chart}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          className={styles.svg}
          role="img"
          aria-label={ariaLabel}
          onPointerMove={pickDay}
          onPointerDown={pickDay}
          onPointerLeave={(e) => e.pointerType === 'mouse' && setDay(null)}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line className={styles.grid} x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} />
              <text className={styles.axisText} x={PAD.left - 6} y={y(t)} textAnchor="end" dominantBaseline="central">
                {t === 0 ? '0' : formatCompact(t)}
              </text>
            </g>
          ))}
          {xTicks.map((d) => (
            <text key={d} className={styles.axisText} x={x(d)} y={height - 6} textAnchor="middle">
              {d}
            </text>
          ))}

          {series.map((s) =>
            s.values.length > 0 ? (
              <path
                key={s.key}
                d={s.values.map((v, i) => `${i ? 'L' : 'M'} ${x(i + 1)} ${y(v)}`).join(' ')}
                fill="none"
                style={{ stroke: paint(s.color) }}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeDasharray={s.dashed ? '5 4' : undefined}
              />
            ) : null,
          )}

          {day != null && (
            <g pointerEvents="none">
              <line className={styles.crosshair} x1={x(day)} x2={x(day)} y1={PAD.top} y2={PAD.top + innerH} />
              {series.map((s) =>
                day <= s.values.length ? (
                  <circle
                    key={s.key}
                    cx={x(day)}
                    cy={y(s.values[day - 1])}
                    r={4.5}
                    style={{ fill: paint(s.color), stroke: 'var(--bg)' }}
                    strokeWidth={2}
                  />
                ) : null,
              )}
            </g>
          )}

          {/* transparent capture layer so pointer events fire over empty plot area */}
          <rect x={PAD.left} y={PAD.top} width={innerW} height={innerH} fill="transparent" />
        </svg>
      )}

      {day != null && (
        <ChartTooltip
          x={x(day)}
          chartWidth={width}
          title={`${day}-е число`}
          rows={series.map((s) => ({
            key: s.key,
            label: s.label,
            value: day <= s.values.length ? formatValue(s.values[day - 1]) : '—',
            color: s.color,
            dashed: s.dashed,
          }))}
        />
      )}
    </div>
  );
}
