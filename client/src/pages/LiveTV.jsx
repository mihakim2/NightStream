import React, { useState, useContext, useMemo } from 'react';
import { PlayerContext, ParentalContext } from '../App.jsx';
import { useApi } from '../hooks/useApi.js';
import { getLiveCategories, getLiveChannels, getFavorites, toggleFavorite } from '../api/client.js';
import CategorySidebar from '../components/CategorySidebar/CategorySidebar.jsx';
import ChannelCard from '../components/ChannelCard/ChannelCard.jsx';
import { ChannelCardSkeleton } from '../components/Skeleton/Skeleton.jsx';
import styles from './LiveTV.module.css';

export default function LiveTV() {
  const player = useContext(PlayerContext);
  const parental = useContext(ParentalContext);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

  const { data: categories } = useApi(() => getLiveCategories(), []);
  const { data: channels, loading: chLoading } = useApi(() => getLiveChannels(selectedCategory), [selectedCategory]);
  const { data: favorites, reload: reloadFavs } = useApi(() => getFavorites(), []);

  const favIds = favorites?.live || [];

  // Build set of restricted category IDs for the sidebar
  const restrictedIds = useMemo(() => {
    if (!categories || !parental) return new Set();
    const set = new Set();
    categories.forEach(cat => {
      if (parental.isRestricted(cat.name)) set.add(cat.id);
    });
    return set;
  }, [categories, parental]);

  // Determine if the currently selected category is restricted
  const selectedCat = categories?.find(c => c.id === selectedCategory);
  const currentCatRestricted = selectedCat ? parental?.isRestricted(selectedCat.name) : false;

  // Filter out restricted channels unless unlocked
  const visibleChannels = useMemo(() => {
    if (!channels) return [];
    if (!currentCatRestricted || parental?.isUnlocked) return channels;
    return [];
  }, [channels, currentCatRestricted, parental?.isUnlocked]);

  const handleToggleFav = async (id) => {
    await toggleFavorite('live', id);
    reloadFavs();
  };

  const handleCategorySelect = async (catId) => {
    if (catId === null) {
      setSelectedCategory(null);
      return;
    }
    const cat = categories?.find(c => c.id === catId);
    if (cat && parental?.isRestricted(cat.name)) {
      const allowed = await parental.requirePin();
      if (!allowed) return;
    }
    setSelectedCategory(catId);
  };

  const handlePlay = async (item) => {
    // Check if channel's category is restricted
    const catId = item.category_id || item.categoryId;
    const cat = categories?.find(c => String(c.id) === String(catId));
    if (cat && parental?.isRestricted(cat.name)) {
      const allowed = await parental.requirePin();
      if (!allowed) return;
    }
    player.play(item);
  };

  return (
    <div className={styles.page}>
      {/* Sidebar: hidden via CSS on mobile */}
      <CategorySidebar
        categories={categories || []}
        selected={selectedCategory}
        onSelect={handleCategorySelect}
        restrictedIds={restrictedIds}
      />
      <div className={styles.main}>
        {/* Mobile category select — shown only on small screens */}
        <select
          className={styles.mobileCategory}
          value={selectedCategory || ''}
          onChange={(e) => handleCategorySelect(e.target.value || null)}
        >
          <option value="">All Categories</option>
          {(categories || []).map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <div className={styles.header}>
          <h2 className={styles.title}>Live TV</h2>
          <div className={styles.viewToggle}>
            <button className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewActive : ''}`} onClick={() => setViewMode('grid')}>▦</button>
            <button className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewActive : ''}`} onClick={() => setViewMode('list')}>☰</button>
          </div>
          {channels && <span className={styles.count}>{channels.length} channels</span>}
        </div>

        {currentCatRestricted && !parental?.isUnlocked ? (
          <div className={styles.lockedState}>
            <div className={styles.lockBig}>🔒</div>
            <p className={styles.lockMsg}>This category is restricted</p>
            <button className={styles.unlockBtn} onClick={() => parental.requirePin()}>Enter PIN to unlock</button>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? styles.grid : styles.list}>
            {chLoading ? (
              Array.from({ length: 12 }).map((_, i) => <ChannelCardSkeleton key={i} />)
            ) : (
              visibleChannels.map((ch, idx) => (
                <ChannelCard key={ch.id} channel={ch} isFavorite={favIds.includes(String(ch.id))} onPlay={handlePlay} onToggleFavorite={handleToggleFav} index={idx} />
              ))
            )}
          </div>
        )}

        {!chLoading && !currentCatRestricted && visibleChannels.length === 0 && (
          <div className={styles.empty}>No channels found</div>
        )}
      </div>
    </div>
  );
}
