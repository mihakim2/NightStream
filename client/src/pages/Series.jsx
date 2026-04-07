import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi.js';
import { getSeriesCategories, getSeriesList, getFavorites, toggleFavorite } from '../api/client.js';
import ContentCard from '../components/ContentCard/ContentCard.jsx';
import { ContentCardSkeleton } from '../components/Skeleton/Skeleton.jsx';
import styles from './Series.module.css';

export default function SeriesPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('');

  const { data: categories } = useApi(() => getSeriesCategories(), []);
  const { data: series, loading } = useApi(() => getSeriesList(selectedCategory || undefined), [selectedCategory]);
  const { data: favorites, reload: reloadFavs } = useApi(() => getFavorites(), []);

  const favIds = favorites?.series || [];

  const handleToggleFav = async (id) => {
    await toggleFavorite('series', id);
    reloadFavs();
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>Series</h2>
        <select className={styles.categorySelect} value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
          <option value="">All Categories</option>
          {(categories || []).map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
        </select>
      </div>
      <div className={styles.grid}>
        {loading ? (
          Array.from({ length: 12 }).map((_, i) => <ContentCardSkeleton key={i} />)
        ) : (
          (series || []).map((s, idx) => (
            <ContentCard key={s.id} item={s} isFavorite={favIds.includes(String(s.id))} onClick={() => navigate(`/series/${s.id}`)} onToggleFavorite={handleToggleFav} index={idx} />
          ))
        )}
      </div>
      {!loading && series?.length === 0 && <div className={styles.empty}>No series found</div>}
    </div>
  );
}
