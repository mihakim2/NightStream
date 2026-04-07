import React, { useState, useMemo } from 'react';
import styles from './CategorySidebar.module.css';

export default function CategorySidebar({ categories, selected, onSelect, restrictedIds }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.filter(cat => cat.name.toLowerCase().includes(q));
  }, [categories, search]);

  return (
    <div className={styles.sidebar}>
      <div className={styles.searchWrapper}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Filter categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <button
        className={`${styles.item} ${!selected ? styles.active : ''}`}
        onClick={() => onSelect(null)}
      >
        <span className={styles.itemName}>All</span>
        <span className={styles.badge}>{categories.length}</span>
      </button>
      {filtered.map(cat => {
        const isRestricted = restrictedIds && restrictedIds.has(cat.id);
        return (
          <button
            key={cat.id}
            className={`${styles.item} ${selected === cat.id ? styles.active : ''}`}
            onClick={() => onSelect(cat.id)}
          >
            <span className={styles.itemName}>{cat.name}</span>
            {isRestricted && <span className={styles.lockIcon}>🔒</span>}
          </button>
        );
      })}
    </div>
  );
}
