import { useId } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore.js';
import { PageHeader } from '../../components/PageHeader/PageHeader.jsx';
import { CURRENCIES, currencyName, currencySymbol, formatMoney } from '../../lib/format.js';
import styles from './SettingsPage.module.css';

const THEMES = [
  { value: 'dark', label: 'Тёмная', icon: '🌙' },
  { value: 'light', label: 'Светлая', icon: '☀️' },
  { value: 'system', label: 'Системная', icon: '🖥️', hint: 'как в настройках устройства' },
];

export function SettingsPage() {
  const settings = useFinanceStore((s) => s.settings);
  const updateSettings = useFinanceStore((s) => s.updateSettings);
  const currencyId = useId();

  return (
    <div className="page">
      <PageHeader title="Настройки" />

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Тема</h2>
        <div className={styles.themes} role="radiogroup" aria-label="Тема">
          {THEMES.map((t) => (
            <label key={t.value} className={styles.theme}>
              <input
                type="radio"
                name="theme"
                className="visually-hidden"
                checked={settings.theme === t.value}
                onChange={() => updateSettings({ theme: t.value })}
              />
              <span className={styles.themeFace}>
                {/* mini preview painted with that theme's own tokens */}
                <span className={styles.preview} data-preview={t.value} aria-hidden="true">
                  <span className={styles.previewBar} />
                  <span className={styles.previewRing} />
                  <span className={styles.previewLine} />
                  <span className={styles.previewLine} />
                </span>
                <span className={styles.themeLabel}>
                  {t.icon} {t.label}
                </span>
                {t.hint && <span className={styles.themeHint}>{t.hint}</span>}
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <label htmlFor={currencyId}>Основная валюта</label>
        </h2>
        <select
          id={currencyId}
          className="input"
          value={settings.currency}
          onChange={(e) => updateSettings({ currency: e.target.value })}
        >
          {CURRENCIES.map((code) => (
            <option key={code} value={code}>
              {currencySymbol(code)} — {currencyName(code)} ({code})
            </option>
          ))}
        </select>
        <p className={styles.hint}>
          Так будут выглядеть суммы: <strong>{formatMoney(1234.5)}</strong>. Валюта меняет только отображение — уже
          внесённые суммы не пересчитываются по курсу.
        </p>
      </section>
    </div>
  );
}
