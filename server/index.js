import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import settingsRoutes from './routes/settings.js';
import playlistRoutes from './routes/playlists.js';
import liveRoutes from './routes/live.js';
import vodRoutes from './routes/vod.js';
import seriesRoutes from './routes/series.js';
import proxyRoutes from './routes/proxy.js';
import epgRoutes from './routes/epg.js';
import searchRoutes from './routes/search.js';
import favoritesRoutes from './routes/favorites.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.use('/api/settings', settingsRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/live', liveRoutes);
app.use('/api/vod', vodRoutes);
app.use('/api/series', seriesRoutes);
app.use('/api/proxy', proxyRoutes);
app.use('/api/epg', epgRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/favorites', favoritesRoutes);

// Global error handler — catches unhandled errors in async route handlers
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`NightStream server running on http://localhost:${PORT}`);
});
