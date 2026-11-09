import { CategoryIcon } from '../../components/CategoryIcon/CategoryIcon.jsx';
import { paint } from '../../lib/palette.js';
import styles from './CategoryPicker.module.css';

/** Grid of category tiles with radio semantics. */
export function CategoryPicker({ categories, value, onChange, invalid }) {
  return (
    <fieldset className={styles.fieldset} aria-invalid={invalid || undefined}>
      <legend className="field-label">Категория</legend>
      <div className={styles.grid}>
        {categories.map((c) => (
          <label key={c.id} className={styles.tile} style={{ '--cat-color': paint(c.color) }}>
            <input
              type="radio"
              name="category"
              className="visually-hidden"
              checked={value === c.id}
              onChange={() => onChange(c.id)}
            />
            <span className={styles.face}>
              <CategoryIcon icon={c.icon} color={c.color} size={36} />
              <span className={styles.name}>{c.name}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
