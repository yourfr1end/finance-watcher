/**
 * Display currency. Set once per render from settings (see App.jsx) — amounts are stored
 * as plain numbers, the currency only changes how they are shown (no conversion).
 */
let currency = 'RUB';
let money;
let moneyRounded;

function buildFormatters() {
  const base = { style: 'currency', currency, currencyDisplay: 'narrowSymbol' };
  money = new Intl.NumberFormat('ru-RU', { ...base, maximumFractionDigits: 2 });
  moneyRounded = new Intl.NumberFormat('ru-RU', { ...base, maximumFractionDigits: 0 });
}
buildFormatters();

export function setCurrency(code) {
  if (code && code !== currency) {
    currency = code;
    buildFormatters();
  }
}

/** "₽", "$", "€", "₸"… */
export const currencySymbol = (code = currency) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: code, currencyDisplay: 'narrowSymbol' })
    .formatToParts(0)
    .find((p) => p.type === 'currency')?.value ?? code;

export const formatMoney = (value) => money.format(value);

/** 1250.5 -> "1 251 ₽" (charts, KPIs) */
export const formatMoneyRounded = (value) => moneyRounded.format(value);

const compact = new Intl.NumberFormat('ru-RU', { notation: 'compact', maximumFractionDigits: 1 });
/** 12500 -> "12,5 тыс." (axis ticks) */
export const formatCompact = (value) => compact.format(value);

/** "+1 200 ₽" / "−300 ₽" */
export const formatDelta = (value) =>
  `${value > 0 ? '+' : value < 0 ? '−' : ''}${moneyRounded.format(Math.abs(value))}`;

export const CURRENCIES = ['RSD', 'RUB', 'KZT', 'USD', 'EUR'];

const currencyNames = new Intl.DisplayNames(['ru'], { type: 'currency' });
/** "Российский рубль" */
export function currencyName(code) {
  const name = currencyNames.of(code) ?? code;
  return name[0].toUpperCase() + name.slice(1);
}

const plural = new Intl.PluralRules('ru-RU');

/** pluralize(5, ['трата', 'траты', 'трат']) -> 'трат' */
export function pluralize(count, [one, few, many]) {
  const rule = plural.select(count);
  if (rule === 'one') return one;
  if (rule === 'few') return few;
  return many;
}
