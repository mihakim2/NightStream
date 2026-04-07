import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayerContext } from '../App.jsx';
import { useApi } from '../hooks/useApi.js';
import { getFavorites, toggleFavorite, getLiveChannels, getVodMovies, getSeriesList } from '../api/client.js';
import ChannelCard from '../components/ChannelCard/ChannelCard.jsx';
import ContentCard from '../components/ContentCard/ContentCard.jsx';
import styles from './Favorites.module.css';

export default function Favorites() {
  const player = useContext(PlayerContext);
  const navigate = useNavigate();
  const [tab, setTab] = useState('live');

  const { data: favorites, reload: reloadFavs } = useApi(() => getFavorites(), []);
  const { data: channels } = useApi(() => getLiveChannels(), []);
  const { data: movies } = useApi(() => getVodMovies(), []);
  const { data: series } = useApi(() => getSeriesList(), []);

  const favChannels = (channels || []).filter(c => (favorites?.live || []).includes(String(c.id)));
  const favMovies = (movies || []).filter(m => (favorites?.vod || []).includes(String(m.id)));
  const favSeries = (series || []).filter(s => (favorites?.series || []).includes(String(s.id)));

  const handleToggleFav = async (type, id) => {
    await toggleFavorite(type, id);
    reloadFavs();
  };

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Favorites</h2>
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'live' ? styles.activeTab : ''}`} onClick={() => setTab('live')}>Channels ({favChannels.length})</button>
        <button className={`${styles.tab} ${tab === 'vod' ? styles.activeTab : ''}`} onClick={() => setTab('vod')}>Movies ({favMovies.length})</button>
        <button className={`${styles.tab} ${tab === 'series' ? styles.activeTab : ''}`} onClick={() => setTab('series')}>Series ({favSeries.length})</button>
      </div>

      {tab === 'live' && (
        <div className={styles.channelGrid}>
          {favChannels.length === 0 ? <div className={styles.empty}>No favorite channels yet</div> : favChannels.map((ch, idx) => (
            <ChannelCard key={ch.id} channel={ch} isFavorite={true} onPlay={(item) => player.play(item)} onToggleFavorite={(id) => handleToggleFav('live', id)} index={idx} />
          ))}
        </div>
      )}

      {tab === 'vod' && (
        <div className={styles.contentGrid}>
          {favMovies.length === 0 ? <div className={styles.empty}>No favorite movies yet</div> : favMovies.map((movie, idx) => (
            <ContentCard key={movie.id} item={movie} isFavorite={true} onClick={() => player.play(movie)} onToggleFavorite={(id) => handleToggleFav('vod', id)} index={idx} />
          ))}
        </div>
      )}

      {tab === 'series' && (
        <div className={styles.contentGrid}>
          {favSeries.length === 0 ? <div className={styles.empty}>No favorite series yet</div> : favSeries.map((s, idx) => (
            <ContentCard key={s.id} item={s} isFavorite={true} onClick={() => navigate(`/series/${s.id}`)} onToggleFavorite={(id) => handleToggleFav('series', id)} index={idx} />
          ))}
        </div>
      )}
    </div>
  );
}
