import { useDeferredValue, useMemo, useState } from 'react';
import { normalize, useFinanceStore } from '../../store/useFinanceStore.js';
import { useCategoryStats } from '../../store/selectors.js';
import { Modal } from '../../components/Modal/Modal.jsx';
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog.jsx';
import { Fab } from '../../components/Fab/Fab.jsx';
import { PageHeader } from '../../components/PageHeader/PageHeader.jsx';
import { pluralize } from '../../lib/format.js';
import { CategoryCard } from './CategoryCard.jsx';
import { CategoryForm } from './CategoryForm.jsx';
import styles from './CategoriesPage.module.css';

export function CategoriesPage() {
  const categories = useFinanceStore((s) => s.categories);
  const addCategory = useFinanceStore((s) => s.addCategory);
  const updateCategory = useFinanceStore((s) => s.updateCategory);
  const deleteCategory = useFinanceStore((s) => s.deleteCategory);
  const stats = useCategoryStats();

  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  /** null — closed; { id: null } — create; { id } — edit */
  const [editing, setEditing] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const visible = useMemo(() => {
    const q = normalize(deferredSearch);
    return categories.filter((c) => normalize(c.name).includes(q) || c.tags.some((t) => normalize(t.name).includes(q)));
  }, [categories, deferredSearch]);

  const editingCategory = editing?.id ? categories.find((c) => c.id === editing.id) : null;
  const deletingCategory = categories.find((c) => c.id === deletingId);
  const deletingCount = stats.get(deletingId)?.count ?? 0;

  const handleSubmit = (values) => {
    if (editingCategory) updateCategory(editingCategory.id, values);
    else addCategory(values);
    setEditing(null);
  };

  const handleConfirmDelete = () => {
    deleteCategory(deletingId);
    setDeletingId(null);
    setEditing(null);
  };

  return (
    <div className="page">
      <PageHeader title="Категории" />

      {categories.length > 0 && (
        <input
          className={`input ${styles.search}`}
          type="search"
          placeholder="Поиск по категориям и тегам"
          aria-label="Поиск по категориям и тегам"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      )}

      {categories.length === 0 ? (
        <p className="empty">Категорий пока нет — нажми «+», чтобы создать первую.</p>
      ) : visible.length === 0 ? (
        <p className="empty">Ничего не найдено.</p>
      ) : (
        <ul className={styles.list}>
          {visible.map((category) => (
            <CategoryCard key={category.id} category={category} onOpen={() => setEditing({ id: category.id })} />
          ))}
        </ul>
      )}

      <Fab label="Добавить категорию" onClick={() => setEditing({ id: null })} />

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editingCategory ? 'Редактировать категорию' : 'Новая категория'}
      >
        <CategoryForm
          category={editingCategory}
          stats={editingCategory ? stats.get(editingCategory.id) : undefined}
          onSubmit={handleSubmit}
          onCancel={() => setEditing(null)}
          onDelete={editingCategory ? () => setDeletingId(editingCategory.id) : undefined}
        />
      </Modal>

      <ConfirmDialog
        open={deletingCategory != null}
        title="Удалить категорию?"
        message={
          deletingCategory &&
          `«${deletingCategory.name}» и её теги будут удалены.` +
            (deletingCount > 0
              ? ` ${deletingCount} ${pluralize(deletingCount, ['трата останется', 'траты останутся', 'трат останутся'])} без категории.`
              : '')
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
