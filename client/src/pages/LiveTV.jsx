import React, { useState, useContext } from 'react';
import { PlayerContext } from '../App.jsx';
import { useApi } from '../hooks/useApi.js';
import { getLiveCategories, getLiveChannels, getFavorites, toggleFavorite } from '../api/client.js';
import CategorySidebar from '../components/CategorySidebar/CategorySidebar.jsx';
import ChannelCard from '../components/ChannelCard/ChannelCard.jsx';
import { ChannelCardSkeleton } from '../components/Skeleton/Skeleton.jsx';
import styles from './LiveTV.module.css';

export default function LiveTV() {
  const player = useContext(PlayerContext);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

  const { data: categories } = useApi(() => getLiveCategories(), []);
  const { data: channels, loading: chLoading } = useApi(() => getLiveChannels(selectedCategory), [selectedCategory]);
  const { data: favorites, reload: reloadFavs } = useApi(() => getFavorites(), []);

  const favIds = favorites?.live || [];

  const handleToggleFav = async (id) => {
    await toggleFavorite('live', id);
    reloadFavs();
  };

  return (
    <div className={styles.page}>
      <CategorySidebar categories={categories || []} selected={selectedCategory} onSelect={setSelectedCategory} />
      <div className={styles.main}>
        <div className={styles.header}>
          <h2 className={styles.title}>Live TV</h2>
          <div className={styles.viewToggle}>
            <button className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewActive : ''}`} onClick={() => setViewMode('grid')}>▦</button>
            <button className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewActive : ''}`} onClick={() => setViewMode('list')}>☰</button>
          </div>
          {channels && <span className={styles.count}>{channels.length} channels</span>}
        </div>
        <div className={viewMode === 'grid' ? styles.grid : styles.list}>
          {chLoading ? (
            Array.from({ length: 12 }).map((_, i) => <ChannelCardSkeleton key={i} />)
          ) : (
            (channels || []).map((ch, idx) => (
              <ChannelCard key={ch.id} channel={ch} isFavorite={favIds.includes(String(ch.id))} onPlay={(item) => player.play(item)} onToggleFavorite={handleToggleFav} index={idx} />
            ))
          )}
        </div>
        {!chLoading && channels?.length === 0 && <div className={styles.empty}>No channels found</div>}
      </div>
    </div>
  );
}
