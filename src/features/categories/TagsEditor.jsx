import { useId, useState } from 'react';
import { normalize } from '../../store/useFinanceStore.js';
import { COLORS } from '../../lib/palette.js';
import { pluralize } from '../../lib/format.js';
import { TagChip } from '../../components/TagChip/TagChip.jsx';
import styles from './TagsEditor.module.css';

const MAX_TAG_LENGTH = 24;

/** Edits the list of tags of one category (local form state, saved with the form). */
export function TagsEditor({ tags, onChange }) {
  const [draft, setDraft] = useState('');
  const inputId = useId();

  const duplicate = tags.some((t) => normalize(t.name) === normalize(draft));
  const canAdd = draft.trim().length > 0 && !duplicate;

  const add = () => {
    if (!canAdd) return;
    onChange([...tags, { id: crypto.randomUUID(), name: draft.trim() }]);
    setDraft('');
  };

  const remove = (id) => onChange(tags.filter((t) => t.id !== id));

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // don't submit the surrounding form
      add();
    }
  };

  return (
    <div className="field">
      <label htmlFor={inputId} className="field-label">
        Теги <span className={styles.optional}>— необязательно, уточняют траты внутри категории</span>
      </label>

      {tags.length > 0 && (
        <div className={styles.chips}>
          {tags.map((tag, i) => (
            <TagChip key={tag.id} tag={{ ...tag, color: COLORS[i % COLORS.length] }} onRemove={() => remove(tag.id)} />
          ))}
        </div>
      )}

      <div className={styles.row}>
        <input
          id={inputId}
          className="input"
          value={draft}
          maxLength={MAX_TAG_LENGTH}
          placeholder="Например: обед, ужин, бар"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          autoComplete="off"
        />
        <button type="button" className="btn" onClick={add} disabled={!canAdd}>
          Добавить
        </button>
      </div>
      {duplicate && draft.trim() && <span className="field-error">Такой тег уже есть</span>}
    </div>
  );
}

/** "У 3 трат тег будет снят" for tags removed in the form. */
export function describeRemovedUsage(originalTags, currentTags, usage) {
  const kept = new Set(currentTags.map((t) => t.id));
  const affected = originalTags
    .filter((t) => !kept.has(t.id))
    .reduce((sum, t) => sum + (usage?.get(t.id)?.count ?? 0), 0);
  if (!affected) return null;
  return `У ${affected} ${pluralize(affected, ['траты', 'трат', 'трат'])} будет снят удалённый тег.`;
}
