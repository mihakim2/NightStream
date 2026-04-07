import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayerContext } from '../../App.jsx';
import styles from './Search.module.css';

export default function SearchResults({ results }) {
  const player = useContext(PlayerContext);
  const navigate = useNavigate();

  if (!results) return null;

  const { live, vod, series } = results;
  const hasResults = live.length > 0 || vod.length > 0 || series.length > 0;

  if (!hasResults) return <div className={styles.empty}>No results found</div>;

  return (
    <div className={styles.results}>
      {live.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Live TV ({live.length})</h3>
          <div className={styles.list}>
            {live.map(ch => (
              <div key={ch.id} className={styles.resultItem} onClick={() => player.play(ch)}>
                {ch.logo && <img src={ch.logo} alt="" className={styles.resultLogo} />}
                <div className={styles.resultName}>{ch.name}</div>
                <span className={styles.badge}>Live</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {vod.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Movies ({vod.length})</h3>
          <div className={styles.list}>
            {vod.map(m => (
              <div key={m.id} className={styles.resultItem} onClick={() => player.play(m)}>
                {m.logo && <img src={m.logo} alt="" className={styles.resultLogo} />}
                <div className={styles.resultName}>{m.name}</div>
                <span className={styles.badge}>Movie</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {series.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Series ({series.length})</h3>
          <div className={styles.list}>
            {series.map(s => (
              <div key={s.id} className={styles.resultItem} onClick={() => navigate(`/series/${s.id}`)}>
                {s.logo && <img src={s.logo} alt="" className={styles.resultLogo} />}
                <div className={styles.resultName}>{s.name}</div>
                <span className={styles.badge}>Series</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
