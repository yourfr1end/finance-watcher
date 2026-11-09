import { useLayoutEffect, useRef, useState } from 'react';

/** [ref, width] — width of the element, kept in sync with ResizeObserver. */
export function useElementWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    setWidth(el.clientWidth);
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, width];
}

/** Rounds the axis max up to 1 / 2 / 2.5 / 5 × 10ⁿ so ticks are readable. */
export function niceMax(value) {
  if (!(value > 0)) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const n = value / magnitude;
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return nice * magnitude;
}
