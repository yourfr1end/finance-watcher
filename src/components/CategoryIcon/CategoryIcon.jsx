import { paint } from '../../lib/palette.js';
import styles from './CategoryIcon.module.css';

export function CategoryIcon({ icon, color, size = 40 }) {
  return (
    <span
      className={styles.icon}
      style={{ '--cat-color': paint(color) ?? 'var(--muted)', width: size, height: size, fontSize: size * 0.5 }}
      aria-hidden="true"
    >
      {icon ?? '❔'}
    </span>
  );
}
