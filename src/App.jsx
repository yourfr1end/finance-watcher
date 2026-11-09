import { Navigate, Route, Routes } from 'react-router';
import { Layout } from './components/Layout/Layout.jsx';
import { ThemeController } from './components/ThemeController.jsx';
import { ExpensesPage } from './features/expenses/ExpensesPage.jsx';
import { CategoriesPage } from './features/categories/CategoriesPage.jsx';
import { StatsPage } from './features/stats/StatsPage.jsx';
import { SettingsPage } from './features/settings/SettingsPage.jsx';
import { setCurrency } from './lib/format.js';
import { useFinanceStore } from './store/useFinanceStore.js';

export default function App() {
  const currency = useFinanceStore((s) => s.settings.currency);
  // module-level formatters must use the new currency before any child renders;
  // idempotent, so calling it during render is safe. key={currency} re-renders the tree.
  setCurrency(currency);

  return (
    <>
      <ThemeController />
      <Routes key={currency}>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/expenses" replace />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="stats" element={<StatsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/expenses" replace />} />
        </Route>
      </Routes>
    </>
  );
}
