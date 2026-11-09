import { useId, useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore.js';
import { CATEGORY_ICONS, COLORS, nextColor } from '../../lib/palette.js';
import { CategoryIcon } from '../../components/CategoryIcon/CategoryIcon.jsx';
import { ColorDot, SwatchPicker } from '../../components/SwatchPicker/SwatchPicker.jsx';
import { describeRemovedUsage, TagsEditor } from './TagsEditor.jsx';
import styles from './Form.module.css';

const MAX_NAME_LENGTH = 40;

/** stats: { byTag } of this category — only to warn when a removed tag is used by expenses. */
export function CategoryForm({ category, stats, onSubmit, onCancel, onDelete }) {
  const isNameTaken = useFinanceStore((s) => s.isCategoryNameTaken);
  const categoriesCount = useFinanceStore((s) => s.categories.length);

  const [name, setName] = useState(category?.name ?? '');
  const [icon, setIcon] = useState(category?.icon ?? CATEGORY_ICONS[0]);
  const [color, setColor] = useState(category?.color ?? nextColor(categoriesCount));
  const [tags, setTags] = useState(category?.tags ?? []);
  const [submitted, setSubmitted] = useState(false);
  const nameId = useId();

  const error = !name.trim()
    ? 'Введите название'
    : isNameTaken(name, category?.id)
      ? 'Категория с таким названием уже есть'
      : null;
  const showError = submitted && error;
  const removedWarning = category && describeRemovedUsage(category.tags, tags, stats?.byTag);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (error) return;
    onSubmit({ name, icon, color, tags });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.preview}>
        <CategoryIcon icon={icon} color={color} size={48} />
        <span className={styles.previewName}>{name.trim() || 'Название'}</span>
      </div>

      <div className="field">
        <label htmlFor={nameId} className="field-label">
          Название
        </label>
        <input
          id={nameId}
          className="input"
          value={name}
          maxLength={MAX_NAME_LENGTH}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={Boolean(showError)}
          aria-describedby={showError ? `${nameId}-error` : undefined}
          data-autofocus={!category || undefined}
        />
        {showError && (
          <span id={`${nameId}-error`} className="field-error">
            {error}
          </span>
        )}
      </div>

      <TagsEditor tags={tags} onChange={setTags} />
      {removedWarning && <p className={styles.warning}>{removedWarning}</p>}

      <SwatchPicker
        label="Цвет"
        options={COLORS}
        value={color}
        onChange={setColor}
        renderOption={(c) => <ColorDot color={c} size={22} />}
      />

      <SwatchPicker
        label="Иконка"
        options={CATEGORY_ICONS}
        value={icon}
        onChange={setIcon}
        renderOption={(i) => i}
      />

      <div className={styles.actions}>
        {onDelete && (
          <button type="button" className={`btn btn-danger ${styles.delete}`} onClick={onDelete}>
            Удалить
          </button>
        )}
        <button type="button" className="btn" onClick={onCancel}>
          Отмена
        </button>
        <button type="submit" className="btn btn-primary">
          {category ? 'Сохранить' : 'Создать'}
        </button>
      </div>
    </form>
  );
}
