import styles from './PageHeader.module.css';

/**
 * Screen header: title always centered; optional side slots (e.g. month arrows)
 * and an optional line below (e.g. "к текущему").
 */
export function PageHeader({ title, start, end, children }) {
  return (
    <header className={styles.root}>
      <div className={styles.bar}>
        <div className={styles.side}>{start}</div>
        <h1 className={styles.title} aria-live="polite">
          {title}
        </h1>
        <div className={`${styles.side} ${styles.end}`}>{end}</div>
      </div>
      {children && <div className={styles.below}>{children}</div>}
    </header>
  );
}

/** Round icon button for header slots. */
export function HeaderButton({ label, children, ...props }) {
  return (
    <button type="button" className={styles.button} aria-label={label} {...props}>
      {children}
    </button>
  );
}
