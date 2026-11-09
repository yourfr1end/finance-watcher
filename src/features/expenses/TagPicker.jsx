import { useState } from 'react';
import { tagColor } from '../../lib/palette.js';
import { TagChip } from '../../components/TagChip/TagChip.jsx';
import styles from './TagPicker.module.css';

const MAX_TAG_LENGTH = 24;

/**
 * Optional single tag of an expense, chosen from its category's tags.
 * Click a selected tag again to clear it. "+ тег" adds a new tag to the category.
 */
export function TagPicker({ category, value, onChange, onCreate }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  const finishAdding = () => {
    if (draft.trim()) onChange(onCreate(draft));
    setDraft('');
    setAdding(false);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // don't submit the expense form
      finishAdding();
    } else if (e.key === 'Escape') {
      setDraft('');
      setAdding(false);
    }
  };

  return (
    <div className={styles.root} role="group" aria-label="Тег (необязательно)">
      {category.tags.map((tag) => (
        <TagChip
          key={tag.id}
          tag={{ ...tag, color: tagColor(category, tag.id) }}
          selected={value === tag.id}
          onClick={() => onChange(value === tag.id ? null : tag.id)}
        />
      ))}

      {adding ? (
        <input
          className={styles.input}
          value={draft}
          maxLength={MAX_TAG_LENGTH}
          placeholder="новый тег"
          aria-label={`Новый тег для «${category.name}»`}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={finishAdding}
          autoFocus
        />
      ) : (
        <button type="button" className={styles.add} onClick={() => setAdding(true)}>
          + тег
        </button>
      )}
    </div>
  );
}
