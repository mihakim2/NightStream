import React, { useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PlayerContext } from '../App.jsx';
import { useApi } from '../hooks/useApi.js';
import { getSeriesDetail } from '../api/client.js';
import styles from './SeriesDetail.module.css';

export default function SeriesDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const player = useContext(PlayerContext);
  const { data: series, loading } = useApi(() => getSeriesDetail(id), [id]);
  const [activeSeason, setActiveSeason] = useState(null);

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (!series) return <div className={styles.empty}>Series not found</div>;

  const seasons = series.seasons ? Object.keys(series.seasons).sort((a, b) => Number(a) - Number(b)) : [];
  const currentSeason = activeSeason || seasons[0];
  const episodes = series.seasons?.[currentSeason] || [];

  return (
    <div className={styles.page}>
      <button className={styles.backBtn} onClick={() => navigate('/series')}>← Back to Series</button>
      <div className={styles.hero}>
        {series.logo && <img src={series.logo} alt="" className={styles.poster} />}
        <div className={styles.info}>
          <h1 className={styles.title}>{series.name}</h1>
          <div className={styles.meta}>
            {series.year && <span>{series.year}</span>}
            {series.rating && <span>⭐ {series.rating}</span>}
            {seasons.length > 0 && <span>{seasons.length} Season{seasons.length !== 1 ? 's' : ''}</span>}
          </div>
          {series.plot && <p className={styles.plot}>{series.plot}</p>}
        </div>
      </div>
      {seasons.length > 0 && (
        <div className={styles.seasonTabs}>
          {seasons.map(s => (
            <button key={s} className={`${styles.seasonTab} ${currentSeason === s ? styles.activeTab : ''}`} onClick={() => setActiveSeason(s)}>Season {s}</button>
          ))}
        </div>
      )}
      <div className={styles.episodes}>
        {episodes.map((ep) => (
          <div key={ep.id} className={styles.episode} onClick={() => player.play({ ...ep, name: `${series.name} - S${currentSeason}E${ep.episodeNum}` })}>
            <div className={styles.epNumber}>{ep.episodeNum}</div>
            <div className={styles.epInfo}>
              <div className={styles.epTitle}>{ep.title}</div>
              {ep.plot && <div className={styles.epPlot}>{ep.plot}</div>}
            </div>
            {ep.duration && <div className={styles.epDuration}>{ep.duration}</div>}
            <button className={styles.epPlay}>▶</button>
          </div>
        ))}
      </div>
    </div>
  );
}
