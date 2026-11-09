const money = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 2,
});

export const formatMoney = (value) => money.format(value);

const plural = new Intl.PluralRules('ru-RU');

/** pluralize(5, ['трата', 'траты', 'трат']) -> 'трат' */
export function pluralize(count, [one, few, many]) {
  const rule = plural.select(count);
  if (rule === 'one') return one;
  if (rule === 'few') return few;
  return many;
}
