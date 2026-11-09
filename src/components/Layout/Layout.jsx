import { NavLink, Outlet } from 'react-router';
import styles from './Layout.module.css';

const TABS = [
  { to: '/expenses', label: 'Траты', icon: '🧾' },
  { to: '/categories', label: 'Категории', icon: '🗂️' },
];

export function Layout() {
  return (
    <div className={styles.shell}>
      <main className={styles.content}>
        <Outlet />
      </main>

      <nav className={styles.tabbar} aria-label="Разделы">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) => `${styles.tab} ${isActive ? styles.active : ''}`}
          >
            <span className={styles.tabIcon} aria-hidden="true">
              {tab.icon}
            </span>
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
