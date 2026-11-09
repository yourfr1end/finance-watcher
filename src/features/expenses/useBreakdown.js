import { useMemo } from 'react';
import { NEUTRAL_COLOR, OTHER_COLOR, paletteIndex } from '../../lib/palette.js';

export const NO_CATEGORY_KEY = 'none';
export const OTHER_KEY = 'other';
/** More slices than palette colors would repeat hues — fold the tail into "Другое". */
const MAX_SLICES = 7;

/**
 * rows   — every category of the month, biggest first (legend / table view)
 * slices — what the donut draws: ordered by palette position so neighbours are
 *          the validated-distinguishable color pairs; neutral slices last
 */
export function useBreakdown(byCategory, categoriesById) {
  return useMemo(() => {
    const merged = new Map();
    for (const [id, value] of byCategory) {
      const c = categoriesById.get(id);
      // expenses of deleted categories have categoryId null or a dangling id — both are "без категории"
      const row = c
        ? { key: c.id, label: c.name, icon: c.icon, color: c.color, value: 0 }
        : { key: NO_CATEGORY_KEY, label: 'Без категории', icon: null, color: NEUTRAL_COLOR, value: 0, neutral: true };
      const existing = merged.get(row.key) ?? row;
      existing.value += value;
      merged.set(row.key, existing);
    }
    const rows = [...merged.values()].sort((a, b) => b.value - a.value);

    const named = rows.filter((r) => !r.neutral);
    const kept = named.slice(0, MAX_SLICES);
    const folded = named.slice(MAX_SLICES);
    const slices = [...kept].sort((a, b) => paletteIndex(a.color) - paletteIndex(b.color) || b.value - a.value);
    if (folded.length) {
      slices.push({
        key: OTHER_KEY,
        label: `Другое (${folded.length})`,
        icon: null,
        color: OTHER_COLOR,
        value: folded.reduce((sum, r) => sum + r.value, 0),
        members: new Set(folded.map((r) => r.key)),
      });
    }
    const none = merged.get(NO_CATEGORY_KEY);
    if (none) slices.push(none);

    return { rows, slices };
  }, [byCategory, categoriesById]);
}

/** Predicate for the expense list when a row/slice is selected. */
export function selectionFilter(key, slices, categoriesById) {
  if (key == null) return null;
  if (key === NO_CATEGORY_KEY) return (e) => !categoriesById.has(e.categoryId);
  if (key === OTHER_KEY) {
    const members = slices.find((s) => s.key === OTHER_KEY)?.members ?? new Set();
    return (e) => members.has(e.categoryId);
  }
  return (e) => e.categoryId === key;
}
