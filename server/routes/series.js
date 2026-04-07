import { Router } from 'express';
import { getActivePlaylist, loadPlaylistData, getXtreamClient } from '../services/playlist-manager.js';

const router = Router();

router.get('/categories', async (req, res) => {
  const playlist = await getActivePlaylist();
  if (!playlist) return res.json([]);
  const data = await loadPlaylistData(playlist);
  res.json(data.seriesCategories);
});

router.get('/', async (req, res) => {
  const playlist = await getActivePlaylist();
  if (!playlist) return res.json([]);
  const data = await loadPlaylistData(playlist);
  let series = data.series;
  const { category } = req.query;
  if (category) {
    series = series.filter(s => String(s.group) === String(category));
  }
  // Return lightweight list (no seasons/episodes) for browse view
  res.json(series.map(s => ({
    id: s.id,
    name: s.name,
    logo: s.logo,
    group: s.group,
    plot: s.plot || '',
    rating: s.rating || '',
    year: s.year || '',
    seasonCount: s.seasons ? Object.keys(s.seasons).length : 0,
    episodeCount: s.seasons ? Object.values(s.seasons).reduce((a, b) => a + b.length, 0) : 0,
  })));
});

router.get('/:id', async (req, res) => {
  const playlist = await getActivePlaylist();
  if (!playlist) return res.json(null);

  if (playlist.type === 'xtream') {
    const client = getXtreamClient(playlist.id);
    if (!client) return res.status(400).json({ error: 'Playlist not loaded' });
    try {
      const info = await client.getSeriesInfo(req.params.id);
      const seasons = {};
      if (info.episodes) {
        for (const [seasonNum, episodes] of Object.entries(info.episodes)) {
          seasons[seasonNum] = episodes.map(ep => ({
            id: ep.id,
            episodeNum: ep.episode_num,
            title: ep.title || `Episode ${ep.episode_num}`,
            plot: ep.plot || '',
            duration: ep.duration || '',
            logo: ep.info?.movie_image || '',
            url: client.getSeriesStreamUrl(ep.id, ep.container_extension || 'mp4'),
          }));
        }
      }
      res.json({
        id: info.info?.series_id || req.params.id,
        name: info.info?.name || '',
        logo: info.info?.cover || '',
        plot: info.info?.plot || '',
        year: info.info?.year || '',
        rating: info.info?.rating || '',
        seasons,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    // M3U playlists: series are already grouped with seasons
    const data = await loadPlaylistData(playlist);
    const item = data.series.find(s => String(s.id) === req.params.id);
    if (!item) return res.json(null);
    res.json({
      id: item.id,
      name: item.name,
      logo: item.logo,
      plot: item.plot || '',
      year: item.year || '',
      rating: item.rating || '',
      seasons: item.seasons || {},
    });
  }
});

export default router;
