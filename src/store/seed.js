const LEGACY_EXPENSES_KEY = 'finance-watcher:expenses';

export const SEED_CATEGORIES = [
  { id: 'cat-groceries', name: 'Продукты', icon: '🛒', color: '#199e70' },
  { id: 'cat-housing', name: 'Жильё', icon: '🏠', color: '#3987e5' },
  { id: 'cat-transport', name: 'Транспорт', icon: '🚇', color: '#c98500' },
  { id: 'cat-cafe', name: 'Кафе и рестораны', icon: '☕', color: '#d95926' },
  { id: 'cat-health', name: 'Здоровье', icon: '💊', color: '#d55181' },
  { id: 'cat-fun', name: 'Развлечения', icon: '🎬', color: '#9085e9' },
].map((c) => ({ ...c, tags: [], createdAt: 0 }));

/** Expenses saved by the first prototype (before the store existed). */
export function loadLegacyExpenses() {
  try {
    const raw = JSON.parse(localStorage.getItem(LEGACY_EXPENSES_KEY));
    if (!Array.isArray(raw)) return [];
    return raw.map((e) => ({ ...e, categoryId: e.categoryId ?? null, tagId: e.tagId ?? null }));
  } catch {
    return [];
  }
}
