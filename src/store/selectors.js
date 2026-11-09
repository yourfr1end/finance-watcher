import { useMemo } from 'react';
import { monthRange, toDayKey } from '../lib/date.js';
import { useFinanceStore } from './useFinanceStore.js';

/**
 * Map<categoryId | null, { count, total, byTag: Map<tagId | null, { count, total }> }>
 * byTag[null] = expenses of the category without a tag.
 */
export function useCategoryStats() {
  const expenses = useFinanceStore((s) => s.expenses);
  return useMemo(() => {
    const stats = new Map();
    for (const e of expenses) {
      let cat = stats.get(e.categoryId);
      if (!cat) stats.set(e.categoryId, (cat = { count: 0, total: 0, byTag: new Map() }));
      cat.count += 1;
      cat.total += e.amount;
      const tagKey = e.tagId ?? null;
      const tag = cat.byTag.get(tagKey) ?? { count: 0, total: 0 };
      tag.count += 1;
      tag.total += e.amount;
      cat.byTag.set(tagKey, tag);
    }
    return stats;
  }, [expenses]);
}

/**
 * Expenses of one month grouped by day, newest first, plus totals per category.
 * -> { total, count, byCategory: Map<categoryId | null, total>,
 *      days: [{ day: "2026-11-09", total, items: Expense[] }] }
 */
export function useMonthExpenses(monthKey) {
  const expenses = useFinanceStore((s) => s.expenses);
  return useMemo(() => {
    const [start, end] = monthRange(monthKey);
    const items = expenses.filter((e) => e.date >= start && e.date < end).sort((a, b) => b.date - a.date);
    const days = [];
    const byCategory = new Map();
    let total = 0;
    for (const e of items) {
      total += e.amount;
      byCategory.set(e.categoryId, (byCategory.get(e.categoryId) ?? 0) + e.amount);
      const day = toDayKey(e.date);
      let group = days[days.length - 1];
      if (group?.day !== day) days.push((group = { day, total: 0, items: [] }));
      group.total += e.amount;
      group.items.push(e);
    }
    return { total, count: items.length, byCategory, days };
  }, [expenses, monthKey]);
}

/** Sum of expenses with start <= date < end. */
export function useSpendingBetween(start, end) {
  const expenses = useFinanceStore((s) => s.expenses);
  return useMemo(
    () => expenses.reduce((sum, e) => (e.date >= start && e.date < end ? sum + e.amount : sum), 0),
    [expenses, start, end],
  );
}

export function useCategoriesById() {
  const categories = useFinanceStore((s) => s.categories);
  return useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
}
