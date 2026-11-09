import { useState } from 'react';
import { CategoryIcon } from '../../components/CategoryIcon/CategoryIcon.jsx';
import { formatMoneyRounded } from '../../lib/format.js';
import styles from './StatsPage.module.css';

const percent = (v, total) => {
  const p = (v / total) * 100;
  return p > 0 && p < 1 ? '<1%' : `${Math.round(p)}%`;
};

/** Ranked horizontal bars; a row expands into the category's split by tag. */
export function CategoryRanking({ ranking, total }) {
  const [openKey, setOpenKey] = useState(null);
  const max = ranking[0]?.value ?? 0;

  return (
    <ul className={styles.rank}>
      {ranking.map((r) => {
        const open = openKey === r.key;
        const canExpand = r.tags.length > 1 || (r.tags.length === 1 && r.tags[0].key !== 'untagged');
        return (
          <li key={r.key}>
            <button
              type="button"
              className={styles.rankRow}
              onClick={() => canExpand && setOpenKey(open ? null : r.key)}
              aria-expanded={canExpand ? open : undefined}
              disabled={!canExpand}
            >
              <CategoryIcon icon={r.icon} color={r.color} size={32} />
              <span className={styles.rankMain}>
                <span className={styles.rankLine}>
                  <span className={styles.rankName}>{r.label}</span>
                  <span className={styles.rankValue}>{formatMoneyRounded(r.value)}</span>
                </span>
                <span className={styles.rankLine}>
                  <span className={styles.track}>
                    <span className={styles.bar} style={{ width: `${(r.value / max) * 100}%`, background: r.color }} />
                  </span>
                  <span className={styles.rankPercent}>{percent(r.value, total)}</span>
                </span>
              </span>
              <span className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`} aria-hidden="true">
                {canExpand ? '›' : ''}
              </span>
            </button>

            {open && (
              <ul className={styles.tagList}>
                {r.tags.map((t) => (
                  <li key={t.key} className={styles.tagRow}>
                    <span className={styles.tagName}>{t.key === 'untagged' ? t.label : `#${t.label}`}</span>
                    <span className={styles.track}>
                      <span
                        className={styles.bar}
                        style={{ width: `${(t.value / r.tags[0].value) * 100}%`, background: t.color }}
                      />
                    </span>
                    <span className={styles.tagValue}>
                      {formatMoneyRounded(t.value)} <span className={styles.muted}>{percent(t.value, r.value)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}
