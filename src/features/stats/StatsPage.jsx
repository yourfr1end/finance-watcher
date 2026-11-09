import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { useFinanceStore } from '../../store/useFinanceStore.js';
import { PageHeader } from '../../components/PageHeader/PageHeader.jsx';
import { TagChip } from '../../components/TagChip/TagChip.jsx';
import { StackedColumns } from '../../components/charts/StackedColumns.jsx';
import { currentMonthKey, formatMonth } from '../../lib/date.js';
import { formatMoneyRounded } from '../../lib/format.js';
import { NEUTRAL_COLOR } from '../../lib/palette.js';
import { CategoryRanking } from './CategoryRanking.jsx';
import { MonthCompare } from './MonthCompare.jsx';
import { PaceChart } from './PaceChart.jsx';
import { monthsEndingAt, NO_CATEGORY_KEY, useStatsData } from './useStatsData.js';
import styles from './StatsPage.module.css';

const PERIODS = [3, 6, 12];
const DEFAULT_PERIOD = 6;
const shortMonth = new Intl.DateTimeFormat('ru-RU', { month: 'short' });

/** Filters live in the URL (?period=6&cats=id1,id2) — shareable, back button works. */
function useStatsFilters(validKeys) {
  const [params, setParams] = useSearchParams();
  const period = PERIODS.includes(Number(params.get('period'))) ? Number(params.get('period')) : DEFAULT_PERIOD;
  const rawCats = params.get('cats');
  const selectedKeys = useMemo(() => {
    const keys = (rawCats ?? '').split(',').filter((k) => validKeys.has(k));
    return keys.length ? new Set(keys) : null;
  }, [rawCats, validKeys]);

  const update = (patch) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === '') next.delete(k);
      else next.set(k, String(v));
    }
    setParams(next, { replace: true });
  };

  return {
    period,
    selectedKeys,
    setPeriod: (p) => update({ period: p === DEFAULT_PERIOD ? null : p }),
    setSelectedKeys: (set) => update({ cats: set && set.size ? [...set].join(',') : null }),
  };
}

export function StatsPage() {
  const categories = useFinanceStore((s) => s.categories);
  const validKeys = useMemo(() => new Set([...categories.map((c) => c.id), NO_CATEGORY_KEY]), [categories]);
  const { period, selectedKeys, setPeriod, setSelectedKeys } = useStatsFilters(validKeys);

  const currentMonth = currentMonthKey();
  const months = useMemo(() => monthsEndingAt(currentMonth, period), [currentMonth, period]);
  const { total, ranking, columns, kpis } = useStatsData(months, selectedKeys);

  const toggleCategory = (key) => {
    const next = new Set(selectedKeys ?? []);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelectedKeys(next);
  };

  const filterChips = [
    ...categories.map((c) => ({ key: c.id, label: `${c.icon} ${c.name}`, color: c.color })),
    { key: NO_CATEGORY_KEY, label: '❔ Без категории', color: NEUTRAL_COLOR },
  ];

  return (
    <div className="page">
      <PageHeader title="Статистика" />

      {/* ---- filters: one row group above all charts ---- */}
      <div className={styles.filters}>
        <div className={styles.segmented} role="radiogroup" aria-label="Период">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={p === period}
              className={`${styles.segment} ${p === period ? styles.segmentActive : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p} мес
            </button>
          ))}
        </div>
        <div className={styles.chips} role="group" aria-label="Категории">
          <TagChip tag={{ name: 'Все', color: 'var(--accent)' }} selected={!selectedKeys} onClick={() => setSelectedKeys(null)}>
            Все категории
          </TagChip>
          {filterChips.map((c) => (
            <TagChip
              key={c.key}
              tag={{ name: c.label, color: c.color }}
              selected={selectedKeys?.has(c.key) ?? false}
              onClick={() => toggleCategory(c.key)}
            >
              {c.label}
            </TagChip>
          ))}
        </div>
      </div>

      {/* ---- KPI row ---- */}
      <div className={styles.kpis}>
        <div className={styles.kpi}>
          <span className={styles.kpiLabel}>За {period} мес</span>
          <strong className={styles.kpiValue}>{formatMoneyRounded(kpis.total)}</strong>
        </div>
        <div className={styles.kpi}>
          <span className={styles.kpiLabel}>В среднем в месяц</span>
          <strong className={styles.kpiValue}>{formatMoneyRounded(kpis.averagePerMonth)}</strong>
          {kpis.monthsWithData > 0 && kpis.monthsWithData < period && (
            <span className={styles.kpiHint}>по {kpis.monthsWithData} мес. с тратами</span>
          )}
        </div>
        <div className={styles.kpi}>
          <span className={styles.kpiLabel}>Больше всего</span>
          {kpis.top ? (
            <>
              <strong className={styles.kpiValue}>
                {kpis.top.icon} {kpis.top.label}
              </strong>
              <span className={styles.kpiHint}>
                {formatMoneyRounded(kpis.top.value)} · {Math.round((kpis.top.value / total) * 100)}%
              </span>
            </>
          ) : (
            <strong className={styles.kpiValue}>—</strong>
          )}
        </div>
      </div>

      {total === 0 ? (
        <p className="empty">За выбранный период трат нет.</p>
      ) : (
        <>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>По месяцам</h2>
            <StackedColumns
              columns={columns.map((c) => ({
                ...c,
                label: shortMonth.format(new Date(`${c.month}-15`)).replace('.', ''),
                tooltipTitle: formatMonth(c.month),
              }))}
              formatValue={formatMoneyRounded}
              ariaLabel={`Траты по месяцам: ${columns.map((c) => `${formatMonth(c.month)} ${formatMoneyRounded(c.total)}`).join(', ')}`}
            />
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Категории за {period} мес</h2>
            <CategoryRanking ranking={ranking} total={total} />
          </section>
        </>
      )}

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Темп трат</h2>
        <PaceChart currentMonth={currentMonth} selectedKeys={selectedKeys} />
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Сравнение месяцев</h2>
        <MonthCompare currentMonth={currentMonth} selectedKeys={selectedKeys} />
      </section>
    </div>
  );
}
