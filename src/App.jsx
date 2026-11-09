import { useEffect, useState } from 'react';
import './App.css';

const STORAGE_KEY = 'finance-watcher:expenses';

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
  } catch {
    return [];
  }
}

const money = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' });

export default function App() {
  const [expenses, setExpenses] = useState(load);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  }, [expenses]);

  function add(event) {
    event.preventDefault();
    const value = Number(amount);
    if (!title.trim() || !(value > 0)) return;
    const entry = { id: crypto.randomUUID(), title: title.trim(), amount: value, date: Date.now() };
    setExpenses((prev) => [entry, ...prev]);
    setTitle('');
    setAmount('');
  }

  function remove(id) {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <main>
      <h1>Finance Watcher</h1>

      <section className="total">
        <span>Всего потрачено</span>
        <strong>{money.format(total)}</strong>
      </section>

      <form onSubmit={add}>
        <input placeholder="На что" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input
          placeholder="Сумма"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button type="submit">Добавить</button>
      </form>

      {expenses.length === 0 ? (
        <p className="empty">Пока пусто — добавь первую трату.</p>
      ) : (
        <ul>
          {expenses.map((e) => (
            <li key={e.id}>
              <span className="title">{e.title}</span>
              <span className="amount">{money.format(e.amount)}</span>
              <button className="remove" onClick={() => remove(e.id)} aria-label="Удалить">
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
