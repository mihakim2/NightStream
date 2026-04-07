import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi.js';
import { getLiveChannels, getVodMovies, getSeriesList } from '../api/client.js';
import styles from './Home.module.css';

export default function Home() {
  const navigate = useNavigate();
  const { data: channels } = useApi(() => getLiveChannels(), []);
  const { data: movies } = useApi(() => getVodMovies(), []);
  const { data: series } = useApi(() => getSeriesList(), []);

  const tiles = [
    {
      title: 'Live TV',
      subtitle: `${channels?.length || 0} channels`,
      gradient: 'linear-gradient(135deg, #4f8eff 0%, #3b5ccc 100%)',
      icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>,
      path: '/live',
    },
    {
      title: 'Movies',
      subtitle: `${movies?.length || 0} titles`,
      gradient: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
      icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/><line x1="17" y1="17" x2="22" y2="17"/></svg>,
      path: '/movies',
    },
    {
      title: 'Series',
      subtitle: `${series?.length || 0} shows`,
      gradient: 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)',
      icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/></svg>,
      path: '/series',
    },
    {
      title: 'Program Guide',
      subtitle: 'Browse TV schedule',
      gradient: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
      icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
      path: '/epg',
    },
    {
      title: 'Favorites',
      subtitle: 'Your saved content',
      gradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
      icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
      path: '/favorites',
    },
    {
      title: 'Search',
      subtitle: 'Find anything',
      gradient: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
      icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
      path: '/search',
    },
  ];

  return (
    <div className={styles.page}>
      <h1 className={styles.greeting}>What would you like to watch?</h1>
      <div className={styles.grid}>
        {tiles.map(tile => (
          <div key={tile.path} className={styles.tile} style={{ background: tile.gradient }} onClick={() => navigate(tile.path)}>
            <div className={styles.tileIcon}>{tile.icon}</div>
            <div className={styles.tileInfo}>
              <div className={styles.tileTitle}>{tile.title}</div>
              <div className={styles.tileSubtitle}>{tile.subtitle}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
