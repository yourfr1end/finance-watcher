import { useEffect, useId, useRef } from 'react';
import styles from './Modal.module.css';

/**
 * Native <dialog>: focus trap, Esc to close and top-layer rendering for free.
 * Children are mounted only while open, so forms inside start fresh every time.
 */
export function Modal({ open, onClose, title, children }) {
  const ref = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog.open) {
      dialog.showModal();
      // showModal() moves focus to the first focusable element (the ✕ button);
      // React's autoFocus runs before that, so use a data attribute instead.
      dialog.querySelector('[data-autofocus]')?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={titleId}
      onClose={onClose}
      // click on the backdrop (the dialog element itself, outside the panel) closes it
      onClick={(e) => e.target === ref.current && onClose()}
    >
      {open && (
        <div className={styles.panel}>
          <header className={styles.header}>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            <button type="button" className="btn btn-ghost" onClick={onClose} aria-label="Закрыть">
              ✕
            </button>
          </header>
          {children}
        </div>
      )}
    </dialog>
  );
}
