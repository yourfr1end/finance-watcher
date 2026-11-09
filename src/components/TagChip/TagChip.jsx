import { paint } from '../../lib/palette.js';
import styles from './TagChip.module.css';

/**
 * Tag pill. Becomes a toggle button when onClick is given;
 * shows a remove "×" when onRemove is given.
 */
export function TagChip({ tag, selected, onClick, onRemove, children }) {
  const style = { '--tag-color': paint(tag?.color) ?? 'var(--muted)' };
  const content = children ?? `#${tag.name}`;

  if (onClick) {
    return (
      <button
        type="button"
        className={`${styles.chip} ${selected ? styles.selected : ''}`}
        style={style}
        aria-pressed={selected}
        onClick={onClick}
      >
        {content}
      </button>
    );
  }

  return (
    <span className={styles.chip} style={style}>
      {content}
      {onRemove && (
        <button type="button" className={styles.remove} onClick={onRemove} aria-label={`Убрать тег ${tag.name}`}>
          ×
        </button>
      )}
    </span>
  );
}
