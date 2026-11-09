import styles from './DonutChart.module.css';

// geometry in viewBox units (rendered ~260px wide -> 1 unit ≈ 2.2px)
const VIEW = 120;
const C = VIEW / 2;
const R = 44; // ring center line
const WIDTH = 18;
const R_OUT = R + WIDTH / 2;
const R_IN = R - WIDTH / 2;
const CORNER = 1.6; // stroke in the slice color + round join = softly rounded corners
const HALF_GAP = 1.7; // linear half gap between slices (incl. CORNER/2) -> ~4px visible gap
const MIN_SPAN = 0.16; // rad (~9°): smallest slice still reads as a distinct block
const POP = 4; // how far the active slice moves outward
const LABEL_MIN_SPAN = 0.5; // rad (~8%): big enough slices get an icon on the ring
const MAX_LABELS = 4;

/** point on a circle; angle measured clockwise from 12 o'clock */
const polar = (angle, r) => [C + r * Math.sin(angle), C - r * Math.cos(angle)];

/**
 * Annular sector with parallel-sided gaps: the gap is offset by the same
 * *distance* on both radii, so it doesn't taper toward the center.
 */
function sectorPath(start, end, rIn, rOut, halfGap) {
  const o0 = start + halfGap / rOut;
  const o1 = end - halfGap / rOut;
  const i0 = start + halfGap / rIn;
  const i1 = Math.max(end - halfGap / rIn, i0);
  const large = o1 - o0 > Math.PI ? 1 : 0;
  const [ax, ay] = polar(o0, rOut);
  const [bx, by] = polar(o1, rOut);
  const [cx, cy] = polar(i1, rIn);
  const [dx, dy] = polar(i0, rIn);
  return `M ${ax} ${ay} A ${rOut} ${rOut} 0 ${large} 1 ${bx} ${by} L ${cx} ${cy} A ${rIn} ${rIn} 0 ${large} 0 ${dx} ${dy} Z`;
}

/**
 * Angles for each value. Tiny values are lifted to MIN_SPAN and the extra room is
 * taken proportionally from the rest — exact numbers live in the legend.
 */
export function layoutSpans(values) {
  const full = 2 * Math.PI;
  const total = values.reduce((a, b) => a + b, 0);
  if (total <= 0) return values.map(() => 0);
  if (values.length < 2 || values.length * MIN_SPAN >= full) return values.map((v) => (v / total) * full);

  const fixed = new Set();
  let spans = [];
  for (;;) {
    const freeTotal = values.reduce((sum, v, i) => (fixed.has(i) ? sum : sum + v), 0);
    const room = full - fixed.size * MIN_SPAN;
    spans = values.map((v, i) => (fixed.has(i) ? MIN_SPAN : (v / freeTotal) * room));
    const tooSmall = spans.findIndex((s, i) => !fixed.has(i) && s < MIN_SPAN);
    if (tooSmall === -1) return spans;
    // fix the smallest offenders first, then re-distribute
    spans.forEach((s, i) => !fixed.has(i) && s < MIN_SPAN && fixed.add(i));
  }
}

/**
 * Donut chart in plain SVG.
 * segments: { key, label, value, color, icon? }[] — clockwise from 12 o'clock, in the given order.
 * activeKey: highlighted slice (pops out, others dim). onSelect(key) on click,
 * onHover(key | null) on mouse hover (touch uses click only).
 * animationKey: change it to replay the intro animation (e.g. on month change).
 * children render in the hole.
 */
export function DonutChart({ segments, activeKey, onSelect, onHover, ariaLabel, animationKey, children }) {
  const spans = layoutSpans(segments.map((s) => s.value));
  const single = segments.length === 1;

  let cursor = 0;
  const arcs = segments.map((s, i) => {
    const start = cursor;
    cursor += spans[i];
    return { ...s, start, end: cursor, mid: start + spans[i] / 2, span: spans[i] };
  });

  const labelled = new Set(
    arcs
      .filter((a) => a.icon && a.span >= LABEL_MIN_SPAN)
      .sort((a, b) => b.span - a.span)
      .slice(0, MAX_LABELS)
      .map((a) => a.key),
  );

  const hover = (key) => (e) => {
    if (e.pointerType === 'mouse') onHover?.(key);
  };

  return (
    <div className={styles.root}>
      <svg
        key={animationKey}
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        className={styles.svg}
        role="img"
        aria-label={ariaLabel}
        onPointerLeave={hover(null)}
      >
        <circle cx={C} cy={C} r={R} fill="none" stroke="var(--surface)" strokeWidth={WIDTH} />

        {arcs.map((a) => {
          const active = a.key === activeKey;
          const dim = activeKey != null && !active;
          const [dx, dy] = active ? polar(a.mid, POP).map((v) => v - C) : [0, 0];
          const [lx, ly] = polar(a.mid, R);
          return (
            <g
              key={a.key}
              className={styles.slice}
              style={{ transform: `translate(${dx}px, ${dy}px)`, opacity: dim ? 0.35 : 1 }}
              onClick={() => onSelect?.(a.key)}
              onPointerEnter={hover(a.key)}
            >
              <title>{a.label}</title>
              {single ? (
                <circle cx={C} cy={C} r={R} fill="none" stroke={a.color} strokeWidth={WIDTH} />
              ) : (
                <path
                  d={sectorPath(a.start, a.end, R_IN, R_OUT, HALF_GAP)}
                  fill={a.color}
                  stroke={a.color}
                  strokeWidth={CORNER}
                  strokeLinejoin="round"
                />
              )}
              {/* invisible, larger, gapless sector = comfortable hit target */}
              {!single && <path d={sectorPath(a.start, a.end, R_IN - 6, R_OUT + 6, 0)} fill="transparent" />}
              {labelled.has(a.key) && (
                <text x={lx} y={ly} className={styles.icon} textAnchor="middle" dominantBaseline="central">
                  {a.icon}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className={styles.center}>{children}</div>
    </div>
  );
}
