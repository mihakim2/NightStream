import React, { useRef, useEffect } from 'react';
import styles from './Search.module.css';

export default function SearchBar({ value, onChange }) {
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handleKey = (e) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return <input ref={inputRef} type="text" placeholder="Search channels, movies, series..." value={value} onChange={(e) => onChange(e.target.value)} className={styles.input} />;
}
