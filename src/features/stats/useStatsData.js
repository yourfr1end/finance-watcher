import { useMemo } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore.js';
import { useCategoriesById } from '../../store/selectors.js';
import { addMonths, monthRange, toMonthKey } from '../../lib/date.js';
import { NEUTRAL_COLOR, OTHER_COLOR, paletteIndex, tagColor } from '../../lib/palette.js';

export const NO_CATEGORY_KEY = 'none';
export const OTHER_KEY = 'other';
const MAX_STACKED = 7; // more parts than palette colors -> fold the tail into "Другое"

/** Category key of an expense: deleted/missing categories count as "без категории". */
const keyOf = (e, categoriesById) => (categoriesById.has(e.categoryId) ? e.categoryId : NO_CATEGORY_KEY);

export function categoryMeta(key, categoriesById) {
  if (key === NO_CATEGORY_KEY) return { key, label: 'Без категории', icon: '❔', color: NEUTRAL_COLOR };
  if (key === OTHER_KEY) return { key, label: 'Другое', icon: '…', color: OTHER_COLOR };
  const c = categoriesById.get(key);
  return { key, label: c.name, icon: c.icon, color: c.color };
}

/** Last `count` month keys ending with `lastMonth`, oldest first. */
export function monthsEndingAt(lastMonth, count) {
  return Array.from({ length: count }, (_, i) => addMonths(lastMonth, i - count + 1));
}

/**
 * Everything the statistics screen draws, for a list of months and a category filter.
 * selectedKeys: Set of category keys, or null = all categories.
 */
export function useStatsData(months, selectedKeys) {
  const expenses = useFinanceStore((s) => s.expenses);
  const categoriesById = useCategoriesById();

  return useMemo(() => {
    const [start] = monthRange(months[0]);
    const [, end] = monthRange(months[months.length - 1]);
    const passes = (e) => !selectedKeys || selectedKeys.has(keyOf(e, categoriesById));

    // ---- period aggregates ----
    const byMonth = new Map(months.map((m) => [m, { total: 0, byCat: new Map() }]));
    const byCat = new Map(); // key -> { total, byTag: Map<tagId|null, total> }
    for (const e of expenses) {
      if (e.date < start || e.date >= end || !passes(e)) continue;
      const key = keyOf(e, categoriesById);
      const month = byMonth.get(toMonthKey(e.date));
      month.total += e.amount;
      month.byCat.set(key, (month.byCat.get(key) ?? 0) + e.amount);
      const cat = byCat.get(key) ?? { total: 0, byTag: new Map() };
      cat.total += e.amount;
      const tagKey = key !== NO_CATEGORY_KEY && e.tagId ? e.tagId : null;
      cat.byTag.set(tagKey, (cat.byTag.get(tagKey) ?? 0) + e.amount);
      byCat.set(key, cat);
    }
    const total = [...byMonth.values()].reduce((sum, m) => sum + m.total, 0);

    // ---- ranked categories with tag drill-down ----
    const ranking = [...byCat]
      .map(([key, { total: value, byTag }]) => {
        const meta = categoryMeta(key, categoriesById);
        const category = categoriesById.get(key);
        const tags = [...byTag]
          .map(([tagId, v]) => {
            const tag = tagId && category?.tags.find((t) => t.id === tagId);
            return tag
              ? { key: tag.id, label: tag.name, color: tagColor(category, tag.id), value: v }
              : { key: 'untagged', label: 'без тега', color: NEUTRAL_COLOR, value: v };
          })
          // a tag deleted from the category falls into "без тега" — merge
          .reduce((acc, t) => {
            const same = acc.find((x) => x.key === t.key);
            if (same) same.value += t.value;
            else acc.push(t);
            return acc;
          }, [])
          .sort((a, b) => b.value - a.value);
        return { ...meta, value, tags };
      })
      .sort((a, b) => b.value - a.value);

    // ---- stacked columns: top categories keep their color, the tail folds into "Другое" ----
    const named = ranking.filter((r) => r.key !== NO_CATEGORY_KEY);
    const stackedKeys = named
      .slice(0, MAX_STACKED)
      .sort((a, b) => paletteIndex(a.color) - paletteIndex(b.color))
      .map((r) => r.key);
    const hasOther = named.length > MAX_STACKED;
    const hasNone = byCat.has(NO_CATEGORY_KEY);
    const partKeys = [...stackedKeys, ...(hasOther ? [OTHER_KEY] : []), ...(hasNone ? [NO_CATEGORY_KEY] : [])];
    const inStack = new Set(stackedKeys);

    const columns = months.map((m) => {
      const { total: monthTotal, byCat: monthByCat } = byMonth.get(m);
      const other = [...monthByCat].reduce(
        (sum, [k, v]) => (k !== NO_CATEGORY_KEY && !inStack.has(k) ? sum + v : sum),
        0,
      );
      return {
        key: m,
        month: m,
        total: monthTotal,
        parts: partKeys.map((k) => ({
          ...categoryMeta(k, categoriesById),
          value: k === OTHER_KEY ? other : (monthByCat.get(k) ?? 0),
        })),
      };
    });

    // ---- KPIs ----
    const monthsWithData = columns.filter((c) => c.total > 0).length;
    const kpis = {
      total,
      averagePerMonth: monthsWithData ? total / monthsWithData : 0,
      monthsWithData,
      top: ranking[0] ?? null,
    };

    return { total, ranking, columns, kpis };
  }, [expenses, categoriesById, months, selectedKeys]);
}

/**
 * Per-category totals of two months (for the comparison block), same category filter.
 * -> { a: total, b: total, rows: [{ key, label, icon, color, a, b, delta }] } sorted by max(a, b)
 */
export function useMonthPair(monthA, monthB, selectedKeys) {
  const expenses = useFinanceStore((s) => s.expenses);
  const categoriesById = useCategoriesById();

  return useMemo(() => {
    const sums = { a: new Map(), b: new Map() };
    const ranges = { a: monthRange(monthA), b: monthRange(monthB) };
    for (const e of expenses) {
      const key = keyOf(e, categoriesById);
      if (selectedKeys && !selectedKeys.has(key)) continue;
      for (const side of ['a', 'b']) {
        const [s, en] = ranges[side];
        if (e.date >= s && e.date < en) sums[side].set(key, (sums[side].get(key) ?? 0) + e.amount);
      }
    }
    const keys = new Set([...sums.a.keys(), ...sums.b.keys()]);
    const rows = [...keys]
      .map((key) => {
        const a = sums.a.get(key) ?? 0;
        const b = sums.b.get(key) ?? 0;
        return { ...categoryMeta(key, categoriesById), a, b, delta: b - a };
      })
      .sort((x, y) => Math.max(y.a, y.b) - Math.max(x.a, x.b));
    const total = (m) => [...m.values()].reduce((s, v) => s + v, 0);
    return { a: total(sums.a), b: total(sums.b), rows };
  }, [expenses, categoriesById, monthA, monthB, selectedKeys]);
}

/**
 * Cumulative spending by day of month: values[d-1] = spent from day 1 to day d.
 * For the current month the series stops at today.
 */
export function useCumulativeByDay(month, selectedKeys, untilDay) {
  const expenses = useFinanceStore((s) => s.expenses);
  const categoriesById = useCategoriesById();

  return useMemo(() => {
    const [start, end] = monthRange(month);
    const days = new Date(end - 1).getDate();
    const daily = new Array(days).fill(0);
    for (const e of expenses) {
      if (e.date < start || e.date >= end) continue;
      if (selectedKeys && !selectedKeys.has(keyOf(e, categoriesById))) continue;
      daily[new Date(e.date).getDate() - 1] += e.amount;
    }
    let acc = 0;
    const values = daily.map((v) => (acc += v));
    return { days, values: untilDay ? values.slice(0, untilDay) : values };
  }, [expenses, categoriesById, month, selectedKeys, untilDay]);
}
