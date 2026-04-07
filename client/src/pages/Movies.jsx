import React, { useState, useContext } from 'react';
import { PlayerContext } from '../App.jsx';
import { useApi } from '../hooks/useApi.js';
import { getVodCategories, getVodMovies, getFavorites, toggleFavorite } from '../api/client.js';
import ContentCard from '../components/ContentCard/ContentCard.jsx';
import ContentModal from '../components/ContentModal/ContentModal.jsx';
import { ContentCardSkeleton } from '../components/Skeleton/Skeleton.jsx';
import styles from './Movies.module.css';

export default function Movies() {
  const player = useContext(PlayerContext);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedMovie, setSelectedMovie] = useState(null);

  const { data: categories } = useApi(() => getVodCategories(), []);
  const { data: movies, loading } = useApi(() => getVodMovies(selectedCategory || undefined), [selectedCategory]);
  const { data: favorites, reload: reloadFavs } = useApi(() => getFavorites(), []);

  const favIds = favorites?.vod || [];

  const handleToggleFav = async (id) => {
    await toggleFavorite('vod', id);
    reloadFavs();
  };

  const groupedByCategory = () => {
    if (selectedCategory || !movies || !categories) return null;
    const groups = {};
    for (const movie of movies) {
      const catId = String(movie.group);
      if (!groups[catId]) groups[catId] = [];
      if (groups[catId].length < 20) groups[catId].push(movie);
    }
    return categories.filter(c => groups[c.id]?.length > 0).map(c => ({ category: c, movies: groups[c.id] })).slice(0, 30);
  };

  const grouped = groupedByCategory();

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>Movies</h2>
        <select className={styles.categorySelect} value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
          <option value="">All Categories</option>
          {(categories || []).map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
        </select>
      </div>

      {loading ? (
        <div className={styles.grid}>{Array.from({ length: 12 }).map((_, i) => <ContentCardSkeleton key={i} />)}</div>
      ) : grouped ? (
        grouped.map(({ category, movies }) => (
          <div key={category.id} className={styles.row}>
            <h3 className={styles.rowTitle}>{category.name}</h3>
            <div className={styles.rowScroll}>
              {movies.map((movie, idx) => (
                <ContentCard key={movie.id} item={movie} isFavorite={favIds.includes(String(movie.id))} onClick={setSelectedMovie} onToggleFavorite={handleToggleFav} index={idx} />
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className={styles.grid}>
          {(movies || []).map((movie, idx) => (
            <ContentCard key={movie.id} item={movie} isFavorite={favIds.includes(String(movie.id))} onClick={setSelectedMovie} onToggleFavorite={handleToggleFav} index={idx} />
          ))}
        </div>
      )}

      {!loading && movies?.length === 0 && <div className={styles.empty}>No movies found</div>}

      <ContentModal item={selectedMovie} onClose={() => setSelectedMovie(null)} onPlay={(item) => { setSelectedMovie(null); player.play(item); }} />
    </div>
  );
}
