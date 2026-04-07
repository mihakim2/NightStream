import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import styles from './Layout.module.css';

const NAV_ITEMS = [
  { path: '/live', label: 'Live TV', icon: '📡' },
  { path: '/movies', label: 'Movies', icon: '🎬' },
  { path: '/series', label: 'Series', icon: '📺' },
  { path: '/epg', label: 'EPG', icon: '📋' },
  { path: '/favorites', label: 'Favorites', icon: '❤️' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Layout({ children }) {
  const navigate = useNavigate();

  return (
    <div className={styles.layout}>
      <nav className={styles.nav}>
        <div className={styles.brand} onClick={() => navigate('/live')}>
          <span className={styles.logo}>▶</span>
          <span className={styles.brandName}>Astra</span>
        </div>
        <div className={styles.navItems}>
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
            </NavLink>
          ))}
        </div>
        <div className={styles.searchWrapper}>
          <input
            type="text"
            placeholder="Search... ( / )"
            className={styles.searchInput}
            onFocus={() => navigate('/search')}
          />
        </div>
      </nav>
      <main className={styles.content}>
        {children}
      </main>
    </div>
  );
}
