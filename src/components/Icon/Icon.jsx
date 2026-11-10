/**
 * Stroke icons on a 24×24 grid, drawn around the exact center so they sit centered
 * in round buttons (text glyphs like "+" or "‹" ride the font baseline and drift).
 */
const PATHS = {
  plus: 'M12 5v14M5 12h14',
  close: 'M6 6l12 12M18 6L6 18',
  chevronLeft: 'M14.5 6l-6 6 6 6',
  chevronRight: 'M9.5 6l6 6-6 6',
  swap: 'M7 8h12m0 0l-3.5-3.5M19 8l-3.5 3.5M17 16H5m0 0l3.5-3.5M5 16l3.5 3.5',
  arrowUp: 'M12 19V5m0 0l-6 6m6-6l6 6',
  arrowDown: 'M12 5v14m0 0l-6-6m6 6l6-6',
  equal: 'M6 9.5h12M6 14.5h12',
};

export function Icon({ name, size = 20, strokeWidth = 2, className }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={{ display: 'block', flex: 'none' }}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
