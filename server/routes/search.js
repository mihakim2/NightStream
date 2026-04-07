import { Router } from 'express';
import { getActivePlaylist, loadPlaylistData } from '../services/playlist-manager.js';

const router = Router();

router.get('/', async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json({ live: [], vod: [], series: [] });

  const playlist = await getActivePlaylist();
  if (!playlist) return res.json({ live: [], vod: [], series: [] });

  const data = await loadPlaylistData(playlist);
  const query = q.toLowerCase();

  res.json({
    live: data.live.filter(c => c.name.toLowerCase().includes(query)).slice(0, 50),
    vod: data.vod.filter(m => m.name.toLowerCase().includes(query)).slice(0, 50),
    series: data.series.filter(s => s.name.toLowerCase().includes(query)).slice(0, 50),
  });
});

export default router;
