import React, { useState } from 'react';
import styles from './ContentCard.module.css';

export default function ContentCard({ item, isFavorite, onClick, onToggleFavorite, index }) {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <div className={styles.card} style={{ animationDelay: `${(index % 20) * 0.03}s` }} onClick={() => onClick(item)}>
      <div className={styles.posterWrapper}>
        {item.logo ? (
          <>
            <div className={styles.posterPlaceholder} style={imgLoaded ? { display: 'none' } : {}} />
            <img src={item.logo} alt="" className={styles.poster} loading="lazy" onLoad={() => setImgLoaded(true)} onError={(e) => { e.target.style.display = 'none'; }} style={imgLoaded ? {} : { opacity: 0 }} />
          </>
        ) : (
          <div className={styles.posterFallback}>{item.name.charAt(0).toUpperCase()}</div>
        )}
        {onToggleFavorite && (
          <button className={`${styles.favBtn} ${isFavorite ? styles.favActive : ''}`} onClick={(e) => { e.stopPropagation(); onToggleFavorite(item.id); }}>
            {isFavorite ? '❤️' : '🤍'}
          </button>
        )}
        {item.rating && <div className={styles.rating}>⭐ {item.rating}</div>}
      </div>
      <div className={styles.title}>{item.name}</div>
      {item.year && <div className={styles.year}>{item.year}</div>}
    </div>
  );
}
