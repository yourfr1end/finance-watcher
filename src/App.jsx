import { Navigate, Route, Routes } from 'react-router';
import { Layout } from './components/Layout/Layout.jsx';
import { ExpensesPage } from './features/expenses/ExpensesPage.jsx';
import { CategoriesPage } from './features/categories/CategoriesPage.jsx';
import { StatsPage } from './features/stats/StatsPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/expenses" replace />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="stats" element={<StatsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="*" element={<Navigate to="/expenses" replace />} />
      </Route>
    </Routes>
  );
}
