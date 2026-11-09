import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { LEGACY_COLOR_MAP } from '../lib/palette.js';
import { loadLegacyExpenses, SEED_CATEGORIES } from './seed.js';

// Declared before the store: persist hydrates (and runs migrate) synchronously at module load.
export const DEFAULT_SETTINGS = { theme: 'dark', currency: 'RUB' };

const OLD_SEED_TAG_IDS = new Set([
  // v1
  'tag-required', 'tag-regular', 'tag-leisure',
  // v2
  'tag-lunch', 'tag-dinner', 'tag-bar', 'tag-coffee', 'tag-taxi', 'tag-metro', 'tag-utilities', 'tag-pharmacy',
]);
// v3 seed ids: t-groc-0, t-cafe-2, ...
const OLD_SEED_TAG_ID_PATTERN = /^t-(groc|house|trans|cafe|health|fun)-\d+$/;

const uid = () => crypto.randomUUID();
export const normalize = (name) => name.trim().toLocaleLowerCase('ru-RU');

/**
 * Data model
 *   Category { id, name, icon, color, tags: Tag[], createdAt }
 *   Tag      { id, name }  — belongs to one category, splits its spending ("обед", "ужин", "бар")
 *   Expense  { id, title, amount, date, categoryId: string | null, tagId: string | null }
 *              tagId is optional and always refers to a tag of expense's category
 */
export const useFinanceStore = create(
  persist(
    (set, get) => ({
      categories: SEED_CATEGORIES,
      expenses: loadLegacyExpenses(),
      settings: DEFAULT_SETTINGS,

      // ---- settings ----
      /** theme: 'dark' | 'light' | 'system'; currency: ISO 4217 code (display only, no conversion) */
      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      // ---- categories ----
      addCategory: ({ name, icon, color, tags }) => {
        const category = { id: uid(), name: name.trim(), icon, color, tags, createdAt: Date.now() };
        set((s) => ({ categories: [...s.categories, category] }));
        return category.id;
      },

      /** If tags were removed, expenses that used them become untagged. */
      updateCategory: (id, patch) =>
        set((s) => {
          const categories = s.categories.map((c) =>
            c.id === id ? { ...c, ...patch, name: (patch.name ?? c.name).trim() } : c,
          );
          if (!patch.tags) return { categories };
          const tagIds = new Set(patch.tags.map((t) => t.id));
          const expenses = s.expenses.map((e) =>
            e.categoryId === id && e.tagId && !tagIds.has(e.tagId) ? { ...e, tagId: null } : e,
          );
          return { categories, expenses };
        }),

      /** Expenses are kept and become "uncategorized". */
      deleteCategory: (id) =>
        set((s) => ({
          categories: s.categories.filter((c) => c.id !== id),
          expenses: s.expenses.map((e) => (e.categoryId === id ? { ...e, categoryId: null, tagId: null } : e)),
        })),

      isCategoryNameTaken: (name, exceptId) =>
        get().categories.some((c) => c.id !== exceptId && normalize(c.name) === normalize(name)),

      /** Adds a tag to a category (or returns the existing one with the same name). */
      addCategoryTag: (categoryId, name) => {
        const category = get().categories.find((c) => c.id === categoryId);
        if (!category) return null;
        const existing = category.tags.find((t) => normalize(t.name) === normalize(name));
        if (existing) return existing.id;
        const tag = { id: uid(), name: name.trim() };
        set((s) => ({
          categories: s.categories.map((c) => (c.id === categoryId ? { ...c, tags: [...c.tags, tag] } : c)),
        }));
        return tag.id;
      },

      // ---- expenses ----
      /** date — timestamp of when the money was spent (defaults to now). */
      addExpense: ({ title, amount, categoryId = null, tagId = null, date = Date.now() }) =>
        set((s) => ({
          expenses: [{ id: uid(), title: title.trim(), amount, categoryId, tagId, date }, ...s.expenses],
        })),

      updateExpense: (id, { title, amount, categoryId, tagId, date }) =>
        set((s) => ({
          expenses: s.expenses.map((e) =>
            e.id === id
              ? { ...e, title: title.trim(), amount, categoryId, tagId: tagId ?? null, date: date ?? e.date }
              : e,
          ),
        })),

      removeExpense: (id) => set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),
    }),
    {
      name: 'finance-watcher',
      version: 6,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ categories, expenses, settings }) => ({ categories, expenses, settings }),
      // settings added later than other fields: fill gaps with defaults on every load
      merge: (persisted, current) => ({
        ...current,
        ...persisted,
        settings: { ...DEFAULT_SETTINGS, ...persisted?.settings },
      }),
      migrate,
    },
  ),
);

/**
 * v1/v2 had global tags (state.tags) referenced by category.tagIds and (v2) expense.tagIds.
 * v3: tags live inside their category; an expense has at most one tag.
 */
function migrate(persisted, version) {
  if (version < 3) {
    const globalTags = new Map((persisted.tags ?? []).map((t) => [t.id, t]));
    persisted.categories = (persisted.categories ?? []).map(({ tagIds = [], ...c }) => ({
      ...c,
      tags: c.tags ?? tagIds.map((id) => globalTags.get(id)).filter(Boolean).map(({ id, name }) => ({ id, name })),
    }));
    const tagsOf = new Map(persisted.categories.map((c) => [c.id, new Set(c.tags.map((t) => t.id))]));
    persisted.expenses = (persisted.expenses ?? []).map(({ tagIds = [], ...e }) => ({
      ...e,
      categoryId: e.categoryId ?? null,
      tagId: e.tagId ?? tagIds.find((id) => tagsOf.get(e.categoryId)?.has(id)) ?? null,
    }));
    delete persisted.tags;
  }
  if (version < 4) {
    // v4: default tags are no longer seeded — drop ones that came from older seeds
    const isSeedTag = (id) => OLD_SEED_TAG_IDS.has(id) || OLD_SEED_TAG_ID_PATTERN.test(id);
    persisted.categories = persisted.categories.map((c) => ({ ...c, tags: c.tags.filter((t) => !isSeedTag(t.id)) }));
    persisted.expenses = persisted.expenses.map((e) => (e.tagId && isSeedTag(e.tagId) ? { ...e, tagId: null } : e));
  }
  if (version < 5) {
    // v5: new chart-safe palette — move categories off the old colors
    persisted.categories = persisted.categories.map((c) => ({ ...c, color: LEGACY_COLOR_MAP[c.color] ?? c.color }));
  }
  if (version < 6) {
    // v6: settings (theme, currency); existing users keep the dark theme they had
    persisted.settings = { ...DEFAULT_SETTINGS, ...persisted.settings };
  }
  return persisted;
}
