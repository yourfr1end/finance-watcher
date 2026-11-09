const money = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 2,
});

export const formatMoney = (value) => money.format(value);

const moneyRounded = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 });
/** 1250.5 -> "1 251 ₽" (charts, KPIs) */
export const formatMoneyRounded = (value) => moneyRounded.format(value);

const compact = new Intl.NumberFormat('ru-RU', { notation: 'compact', maximumFractionDigits: 1 });
/** 12500 -> "12,5 тыс." (axis ticks) */
export const formatCompact = (value) => compact.format(value);

/** "+1 200 ₽" / "−300 ₽" */
export const formatDelta = (value) =>
  `${value > 0 ? '+' : value < 0 ? '−' : ''}${moneyRounded.format(Math.abs(value))}`;

const plural = new Intl.PluralRules('ru-RU');

/** pluralize(5, ['трата', 'траты', 'трат']) -> 'трат' */
export function pluralize(count, [one, few, many]) {
  const rule = plural.select(count);
  if (rule === 'one') return one;
  if (rule === 'few') return few;
  return many;
}
