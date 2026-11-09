import { Modal } from '../Modal/Modal.jsx';
import styles from './ConfirmDialog.module.css';

export function ConfirmDialog({ open, title, message, confirmLabel = 'Удалить', onConfirm, onCancel }) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className={styles.message}>{message}</p>
      <div className={styles.actions}>
        <button type="button" className="btn" onClick={onCancel}>
          Отмена
        </button>
        <button type="button" className="btn btn-danger" onClick={onConfirm} data-autofocus>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
