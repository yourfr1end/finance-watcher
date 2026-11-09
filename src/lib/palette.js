/**
 * Categorical palette for the dark surface (validated with the dataviz skill's
 * validate_palette.js against --bg #0f172a: lightness band, chroma, adjacent CVD ΔE ≥ 8.4,
 * normal-vision ΔE ≥ 19.3, contrast ≥ 3:1).
 * ORDER MATTERS: neighbours in this list are the pairs proven distinguishable —
 * charts place slices in this order, and new categories take colors in this order.
 */
export const COLORS = [
  '#3987e5', // blue
  '#d95926', // orange
  '#199e70', // aqua
  '#c98500', // yellow
  '#d55181', // magenta
  '#008300', // green
  '#9085e9', // violet
  '#e66767', // red
];

/** Neutrals — not identity colors. Two lightness steps so they stay apart when adjacent. */
export const NEUTRAL_COLOR = '#94a3b8'; // "без категории" / "без тега"
export const OTHER_COLOR = '#475569'; // "другое" (folded tail of a chart)

/** Previous palette -> closest current hue (used by the v5 data migration). */
export const LEGACY_COLOR_MAP = {
  '#34d399': '#199e70',
  '#60a5fa': '#3987e5',
  '#f472b6': '#d55181',
  '#fbbf24': '#c98500',
  '#a78bfa': '#9085e9',
  '#f87171': '#e66767',
  '#22d3ee': '#3987e5',
  '#fb923c': '#d95926',
  '#a3e635': '#008300',
  '#e879f9': '#d55181',
  '#94a3b8': '#9085e9',
  '#2dd4bf': '#199e70',
};

export const CATEGORY_ICONS = [
  '🛒', '🍔', '☕', '🍷', '🏠', '💡', '📱', '🌐',
  '🚗', '⛽', '🚕', '🚇', '✈️', '🏨', '🏥', '💊',
  '🦷', '💪', '👕', '👟', '💄', '💇', '🎁', '🎮',
  '🎬', '🎵', '📚', '🎓', '👶', '🐶', '🧸', '🛠️',
  '💳', '🏦', '📈', '💼', '🧾', '❤️', '🎉', '📦',
];

/** Picks the next color in the palette so new items don't all look the same. */
export function nextColor(usedCount) {
  return COLORS[usedCount % COLORS.length];
}

/** Position of a color in the palette (unknown colors go last) — used to order chart slices. */
export function paletteIndex(color) {
  const i = COLORS.indexOf(color);
  return i === -1 ? COLORS.length : i;
}

/** Stable color of a tag inside its category: by position in category.tags. */
export function tagColor(category, tagId) {
  const index = category.tags.findIndex((t) => t.id === tagId);
  return index === -1 ? NEUTRAL_COLOR : COLORS[index % COLORS.length];
}
