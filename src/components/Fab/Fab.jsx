import styles from './Fab.module.css';

/** Floating "+" action button, bottom-right above the tab bar. */
export function Fab({ label, onClick }) {
  return (
    <button type="button" className={styles.fab} onClick={onClick} aria-label={label} title={label}>
      +
    </button>
  );
}
