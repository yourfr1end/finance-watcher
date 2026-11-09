import { useId, useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore.js';
import { shiftDay, toDayKey, withDay } from '../../lib/date.js';
import { currencySymbol } from '../../lib/format.js';
import { CategoryPicker } from './CategoryPicker.jsx';
import { TagPicker } from './TagPicker.jsx';
import styles from './ExpenseForm.module.css';

const MAX_AMOUNT = 1e9;
const MAX_NOTE_LENGTH = 80;

/** "1 250,5" / "1250.50" -> 1250.5; NaN when not a number. */
function parseAmount(raw) {
  const normalized = raw.replace(/\s/g, '').replace(',', '.');
  return normalized ? Number(normalized) : NaN;
}

/** 1250.5 -> "1250,5" for the input */
const formatAmountInput = (value) => String(value).replace('.', ',');

/**
 * Create or edit an expense: amount, category (required), tag of that category (optional), note (optional).
 * expense — when given, the form edits it; onDelete shows the delete button.
 * onSubmit receives { amount, categoryId, tagId, title }.
 */
export function ExpenseForm({ expense, initialCategoryId, defaultDay, onSubmit, onCancel, onDelete }) {
  const categories = useFinanceStore((s) => s.categories);
  const addCategoryTag = useFinanceStore((s) => s.addCategoryTag);

  const today = toDayKey(Date.now());
  const yesterday = shiftDay(today, -1);
  const [day, setDay] = useState(expense ? toDayKey(expense.date) : (defaultDay ?? today));
  const dateId = useId();
  const dayError = !day ? 'Укажите дату' : day > today ? 'Дата не может быть в будущем' : null;

  const startCategoryId = expense ? expense.categoryId : initialCategoryId;
  const [amount, setAmount] = useState(expense ? formatAmountInput(expense.amount) : '');
  const [categoryId, setCategoryId] = useState(
    categories.some((c) => c.id === startCategoryId) ? startCategoryId : null,
  );
  const [tagId, setTagId] = useState(expense?.tagId ?? null);
  const [note, setNote] = useState(expense?.title ?? '');
  const [submitted, setSubmitted] = useState(false);
  const amountId = useId();
  const noteId = useId();

  const category = categories.find((c) => c.id === categoryId);
  const value = parseAmount(amount);
  const amountError =
    !(value > 0) ? 'Введите сумму больше нуля' : value > MAX_AMOUNT ? 'Слишком большая сумма' : null;
  const categoryError = category ? null : 'Выберите категорию';

  const changeCategory = (id) => {
    setCategoryId(id);
    setTagId(null); // tags belong to a category
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (amountError || categoryError || dayError) return;
    // same day as before -> keep the exact timestamp; otherwise move it, keeping the time of day
    const date = expense && day === toDayKey(expense.date) ? expense.date : withDay(day, expense?.date);
    onSubmit({ amount: Math.round(value * 100) / 100, categoryId, tagId, title: note.trim(), date });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor={amountId} className="field-label">
          Сумма
        </label>
        <div className={styles.amountBox} aria-invalid={(submitted && Boolean(amountError)) || undefined}>
          <input
            id={amountId}
            className={styles.amount}
            inputMode="decimal"
            autoComplete="off"
            placeholder="0"
            value={amount}
            // allow digits, one separator and spaces only
            onChange={(e) => /^[\d\s]*[.,]?\d{0,2}$/.test(e.target.value) && setAmount(e.target.value)}
            aria-invalid={(submitted && Boolean(amountError)) || undefined}
            aria-describedby={submitted && amountError ? `${amountId}-error` : undefined}
            data-autofocus={!expense || undefined}
          />
          <span className={styles.currency}>{currencySymbol()}</span>
        </div>
        {submitted && amountError && (
          <span id={`${amountId}-error`} className="field-error">
            {amountError}
          </span>
        )}
      </div>

      <div className="field">
        <label htmlFor={dateId} className="field-label">
          Дата
        </label>
        <div className={styles.dateRow}>
          {[
            { key: today, label: 'Сегодня' },
            { key: yesterday, label: 'Вчера' },
          ].map((d) => (
            <button
              key={d.key}
              type="button"
              className={`${styles.dayChip} ${day === d.key ? styles.dayChipActive : ''}`}
              aria-pressed={day === d.key}
              onClick={() => setDay(d.key)}
            >
              {d.label}
            </button>
          ))}
          <input
            id={dateId}
            type="date"
            className={`input ${styles.dateInput}`}
            value={day}
            max={today}
            onChange={(e) => setDay(e.target.value)}
            aria-invalid={(submitted && Boolean(dayError)) || undefined}
          />
        </div>
        {submitted && dayError && <span className="field-error">{dayError}</span>}
      </div>

      {categories.length === 0 ? (
        <p className="field-error">Сначала создайте категорию на экране «Категории».</p>
      ) : (
        <>
          <CategoryPicker
            categories={categories}
            value={categoryId}
            onChange={changeCategory}
            invalid={submitted && Boolean(categoryError)}
          />
          {submitted && categoryError && <span className={`field-error ${styles.pull}`}>{categoryError}</span>}
        </>
      )}

      {category && (
        <div className="field">
          <span className="field-label">Тег — необязательно</span>
          <TagPicker
            category={category}
            value={tagId}
            onChange={setTagId}
            onCreate={(name) => addCategoryTag(category.id, name)}
          />
        </div>
      )}

      <div className="field">
        <label htmlFor={noteId} className="field-label">
          Комментарий — необязательно
        </label>
        <input
          id={noteId}
          className="input"
          value={note}
          maxLength={MAX_NOTE_LENGTH}
          placeholder="Например: бизнес-ланч с коллегами"
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <div className={styles.actions}>
        {onDelete && (
          <button type="button" className={`btn btn-danger ${styles.delete}`} onClick={onDelete}>
            Удалить
          </button>
        )}
        <button type="button" className="btn" onClick={onCancel}>
          Отмена
        </button>
        <button type="submit" className="btn btn-primary">
          {expense ? 'Сохранить' : 'Добавить'}
        </button>
      </div>
    </form>
  );
}
