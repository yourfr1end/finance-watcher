import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useFinanceStore } from '../../store/useFinanceStore.js';
import { useCategoriesById, useMonthExpenses } from '../../store/selectors.js';
import { CategoryIcon } from '../../components/CategoryIcon/CategoryIcon.jsx';
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog.jsx';
import { Fab } from '../../components/Fab/Fab.jsx';
import { Modal } from '../../components/Modal/Modal.jsx';
import { HeaderButton, PageHeader } from '../../components/PageHeader/PageHeader.jsx';
import { TagChip } from '../../components/TagChip/TagChip.jsx';
import {
  addMonths,
  currentMonthKey,
  formatDay,
  formatMonth,
  isMonthKey,
  monthRange,
  toDayKey,
  toMonthKey,
} from '../../lib/date.js';
import { formatMoney, pluralize } from '../../lib/format.js';
import { tagColor } from '../../lib/palette.js';
import { ExpenseForm } from './ExpenseForm.jsx';
import { MonthSummary } from './MonthSummary.jsx';
import { selectionFilter, useBreakdown } from './useBreakdown.js';
import { useMonthComparison } from './useMonthComparison.js';
import styles from './ExpensesPage.module.css';

/** Selected month lives in the URL (?month=2026-10) so back button and links work. */
function useSelectedMonth() {
  const [params, setParams] = useSearchParams();
  const current = currentMonthKey();
  const raw = params.get('month');
  const month = isMonthKey(raw) && raw <= current ? raw : current;
  const setMonth = (key) => setParams(key === current ? {} : { month: key });
  return [month, setMonth, current];
}

export function ExpensesPage() {
  const expenses = useFinanceStore((s) => s.expenses);
  const addExpense = useFinanceStore((s) => s.addExpense);
  const updateExpense = useFinanceStore((s) => s.updateExpense);
  const removeExpense = useFinanceStore((s) => s.removeExpense);
  const categoriesById = useCategoriesById();

  const [month, setMonth, currentMonth] = useSelectedMonth();
  const { total, count, byCategory, days } = useMonthExpenses(month);
  const { rows, slices } = useBreakdown(byCategory, categoriesById);
  const comparison = useMonthComparison(month, currentMonth, total);

  // selected category in the chart; scoped to the month it was picked in
  const [selection, setSelection] = useState({ month: null, key: null });
  const selected =
    selection.month === month
      ? (rows.find((r) => r.key === selection.key) ?? slices.find((s) => s.key === selection.key) ?? null)
      : null;
  const selectCategory = (key) => setSelection({ month, key });

  const visibleDays = useMemo(() => {
    const match = selectionFilter(selected?.key, slices, categoriesById);
    if (!match) return days;
    return days
      .map((g) => {
        const items = g.items.filter(match);
        return { ...g, items, total: items.reduce((sum, e) => sum + e.amount, 0) };
      })
      .filter((g) => g.items.length > 0);
  }, [days, selected?.key, slices, categoriesById]);
  const visibleCount = visibleDays.reduce((n, g) => n + g.items.length, 0);

  /** null — closed; { id: null } — create; { id } — edit */
  const [editing, setEditing] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // several expenses in a row usually share a category — preselect the most recent one
  const lastCategoryId = expenses.reduce((best, e) => (e.categoryId && (!best || e.date > best.date) ? e : best), null)
    ?.categoryId;
  // adding while looking at a past month: default to its last day instead of today
  const defaultDay = month === currentMonth ? undefined : toDayKey(monthRange(month)[1] - 1);

  const editingExpense = editing?.id ? expenses.find((e) => e.id === editing.id) : null;
  const deletingExpense = expenses.find((e) => e.id === deletingId);
  const close = () => setEditing(null);

  const handleSubmit = (values) => {
    if (editingExpense) updateExpense(editingExpense.id, values);
    else addExpense(values);
    close();
    // follow the expense if it landed in another month
    const savedMonth = toMonthKey(values.date);
    if (savedMonth !== month) setMonth(savedMonth);
  };

  const handleConfirmDelete = () => {
    removeExpense(deletingId);
    setDeletingId(null);
    close();
  };

  const describe = (e) => {
    const category = categoriesById.get(e.categoryId);
    const tag = category?.tags.find((t) => t.id === e.tagId);
    return { category, tag, title: e.title || tag?.name || category?.name || 'Без категории' };
  };

  return (
    <div className="page">
      <PageHeader
        title={formatMonth(month)}
        start={
          <HeaderButton label="Предыдущий месяц" onClick={() => setMonth(addMonths(month, -1))}>
            ‹
          </HeaderButton>
        }
        end={
          <HeaderButton
            label="Следующий месяц"
            onClick={() => setMonth(addMonths(month, 1))}
            disabled={month >= currentMonth}
          >
            ›
          </HeaderButton>
        }
      >
        {month !== currentMonth && (
          <button type="button" className={`btn btn-ghost ${styles.toCurrent}`} onClick={() => setMonth(currentMonth)}>
            к текущему месяцу
          </button>
        )}
      </PageHeader>

      {count > 0 && (
        <MonthSummary
          rows={rows}
          slices={slices}
          total={total}
          count={count}
          comparison={comparison}
          selectedKey={selected?.key ?? null}
          onSelect={selectCategory}
          animationKey={month}
        />
      )}

      {selected && (
        <div className={styles.filter} role="status">
          <span className={styles.filterText}>
            {selected.icon && <span aria-hidden="true">{selected.icon}</span>}
            <span className={styles.filterName}>{selected.label}</span>
            <span className={styles.filterCount}>
              · {visibleCount} {pluralize(visibleCount, ['трата', 'траты', 'трат'])}
            </span>
          </span>
          <button
            type="button"
            className={`btn btn-ghost ${styles.filterReset}`}
            onClick={() => selectCategory(null)}
            aria-label="Показать все траты"
          >
            ✕
          </button>
        </div>
      )}

      {days.length === 0 ? (
        <p className="empty">
          {month === currentMonth
            ? 'В этом месяце трат пока нет — нажми «+», чтобы добавить.'
            : 'В этом месяце трат нет.'}
        </p>
      ) : (
        <div className={styles.days}>
          {visibleDays.map((group) => (
            <section key={group.day} className={styles.day} aria-label={formatDay(group.day)}>
              <header className={styles.dayHeader}>
                <h2 className={styles.dayTitle}>{formatDay(group.day)}</h2>
                <span className={styles.dayTotal}>{formatMoney(group.total)}</span>
              </header>
              <ul className={styles.list}>
                {group.items.map((e) => {
                  const { category, tag, title } = describe(e);
                  return (
                    <li key={e.id}>
                      <button
                        type="button"
                        className={styles.item}
                        onClick={() => setEditing({ id: e.id })}
                        aria-label={`${title}, ${formatMoney(e.amount)} — редактировать`}
                      >
                        <CategoryIcon icon={category?.icon} color={category?.color} size={36} />
                        <span className={styles.itemBody}>
                          <span className={styles.itemTitle}>{title}</span>
                          <span className={styles.itemMeta}>
                            <span className={styles.itemCategory}>{category?.name ?? 'Без категории'}</span>
                            {tag && <TagChip tag={{ ...tag, color: tagColor(category, tag.id) }} />}
                          </span>
                        </span>
                        <span className={styles.itemAmount}>{formatMoney(e.amount)}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      <Fab label="Добавить трату" onClick={() => setEditing({ id: null })} />

      <Modal open={editing !== null} onClose={close} title={editingExpense ? 'Редактировать трату' : 'Новая трата'}>
        <ExpenseForm
          expense={editingExpense}
          initialCategoryId={lastCategoryId}
          defaultDay={defaultDay}
          onSubmit={handleSubmit}
          onCancel={close}
          onDelete={editingExpense ? () => setDeletingId(editingExpense.id) : undefined}
        />
      </Modal>

      <ConfirmDialog
        open={deletingId !== null}
        title="Удалить трату?"
        message={deletingExpense && `«${describe(deletingExpense).title}» на ${formatMoney(deletingExpense.amount)} будет удалена.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
