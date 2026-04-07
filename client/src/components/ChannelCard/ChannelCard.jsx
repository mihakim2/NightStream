import React from 'react';
import styles from './ChannelCard.module.css';

export default function ChannelCard({ channel, epg, isFavorite, onPlay, onToggleFavorite, index }) {
  const progress = epg?.current ? getProgress(epg.current.start, epg.current.stop) : 0;

  return (
    <div className={styles.card} style={{ animationDelay: `${(index % 20) * 0.03}s` }} onClick={() => onPlay(channel)}>
      <div className={styles.logoWrapper}>
        {channel.logo ? (
          <img src={channel.logo} alt="" className={styles.logo} loading="lazy" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
        ) : null}
        <div className={styles.logoFallback} style={channel.logo ? { display: 'none' } : {}}>
          {channel.name.charAt(0).toUpperCase()}
        </div>
      </div>
      <div className={styles.info}>
        <div className={styles.name}>{channel.name}</div>
        {epg?.current && <div className={styles.program}>{epg.current.title}</div>}
        {progress > 0 && (
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
      <button className={`${styles.favBtn} ${isFavorite ? styles.favActive : ''}`} onClick={(e) => { e.stopPropagation(); onToggleFavorite(channel.id); }}>
        {isFavorite ? '❤️' : '🤍'}
      </button>
    </div>
  );
}

function getProgress(start, stop) {
  const now = Date.now();
  if (now < start || now > stop) return 0;
  return Math.round(((now - start) / (stop - start)) * 100);
}
