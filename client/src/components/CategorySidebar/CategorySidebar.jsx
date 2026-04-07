import React from 'react';
import styles from './CategorySidebar.module.css';

export default function CategorySidebar({ categories, selected, onSelect }) {
  return (
    <div className={styles.sidebar}>
      <button className={`${styles.item} ${!selected ? styles.active : ''}`} onClick={() => onSelect(null)}>All</button>
      {categories.map(cat => (
        <button key={cat.id} className={`${styles.item} ${selected === cat.id ? styles.active : ''}`} onClick={() => onSelect(cat.id)}>{cat.name}</button>
      ))}
    </div>
  );
}
