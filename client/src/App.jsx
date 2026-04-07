import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout.jsx';
import Player from './components/Player/Player.jsx';
import Setup from './pages/Setup.jsx';
import { usePlayer } from './hooks/usePlayer.js';
import { getPlaylists } from './api/client.js';

function Placeholder({ name }) {
  return <div style={{ color: 'var(--text-secondary)', fontSize: 18 }}>{name} — coming soon</div>;
}

export const PlayerContext = React.createContext(null);

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
                  <Route path="/live" element={<Placeholder name="Live TV" />} />
                  <Route path="/movies" element={<Placeholder name="Movies" />} />
                  <Route path="/series" element={<Placeholder name="Series" />} />
                  <Route path="/series/:id" element={<Placeholder name="Series Detail" />} />
                  <Route path="/epg" element={<Placeholder name="EPG" />} />
                  <Route path="/favorites" element={<Placeholder name="Favorites" />} />
                  <Route path="/search" element={<Placeholder name="Search" />} />
                  <Route path="/settings" element={<Placeholder name="Settings" />} />
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
