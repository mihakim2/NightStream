import React, { useEffect } from 'react';
import styles from './ContentModal.module.css';

export default function ContentModal({ item, onClose, onPlay, children }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!item) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>
        <div className={styles.content}>
          {item.logo && (
            <div className={styles.posterCol}>
              <img src={item.logo} alt="" className={styles.poster} />
            </div>
          )}
          <div className={styles.details}>
            <h2 className={styles.title}>{item.name}</h2>
            <div className={styles.meta}>
              {item.year && <span>{item.year}</span>}
              {item.rating && <span>⭐ {item.rating}</span>}
              {item.duration && <span>{item.duration}</span>}
            </div>
            {item.plot && <p className={styles.plot}>{item.plot}</p>}
            {onPlay && <button className={styles.playBtn} onClick={() => onPlay(item)}>▶ Play</button>}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
