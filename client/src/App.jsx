import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout.jsx';
import Player from './components/Player/Player.jsx';
import Setup from './pages/Setup.jsx';
import LiveTV from './pages/LiveTV.jsx';
import Movies from './pages/Movies.jsx';
import SeriesPage from './pages/Series.jsx';
import SeriesDetail from './pages/SeriesDetail.jsx';
import EPGPage from './pages/EPG.jsx';
import Favorites from './pages/Favorites.jsx';
import Settings from './pages/Settings.jsx';
import SearchBar from './components/Search/SearchBar.jsx';
import SearchResults from './components/Search/SearchResults.jsx';
import { usePlayer } from './hooks/usePlayer.js';
import { getPlaylists, searchAll } from './api/client.js';

export const PlayerContext = React.createContext(null);

function SearchPage() {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState(null);

  React.useEffect(() => {
    if (query.length < 2) { setResults(null); return; }
    const timer = setTimeout(() => {
      searchAll(query).then(setResults).catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div>
      <SearchBar value={query} onChange={setQuery} />
      <SearchResults results={results} />
    </div>
  );
}

export default function App() {
  const player = usePlayer();
  const [hasPlaylist, setHasPlaylist] = useState(null);

  useEffect(() => {
    getPlaylists()
      .then(res => setHasPlaylist(res.playlists && res.playlists.length > 0))
      .catch(() => setHasPlaylist(false));
  }, []);

  if (hasPlaylist === null) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-secondary)' }}>Loading...</div>
      </div>
    );
  }

  return (
    <PlayerContext.Provider value={player}>
      <BrowserRouter>
        <Routes>
          <Route path="/setup" element={<Setup />} />
          <Route path="/*" element={
            hasPlaylist ? (
              <Layout>
                <Routes>
                  <Route path="/live" element={<LiveTV />} />
                  <Route path="/movies" element={<Movies />} />
                  <Route path="/series" element={<SeriesPage />} />
                  <Route path="/series/:id" element={<SeriesDetail />} />
                  <Route path="/epg" element={<EPGPage />} />
                  <Route path="/favorites" element={<Favorites />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/live" replace />} />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/setup" replace />
            )
          } />
        </Routes>
      </BrowserRouter>
      <Player />
    </PlayerContext.Provider>
  );
}
