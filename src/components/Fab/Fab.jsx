import { Icon } from '../Icon/Icon.jsx';
import styles from './Fab.module.css';

/** Floating "+" action button, bottom-right above the tab bar. */
export function Fab({ label, onClick }) {
  return (
    <button type="button" className={styles.fab} onClick={onClick} aria-label={label} title={label}>
      <Icon name="plus" size={28} strokeWidth={2.5} />
    </button>
  );
}
