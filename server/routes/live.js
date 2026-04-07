import { Router } from 'express';
import { getActivePlaylist, loadPlaylistData } from '../services/playlist-manager.js';

const router = Router();

router.get('/categories', async (req, res) => {
  const playlist = await getActivePlaylist();
  if (!playlist) return res.json([]);
  const data = await loadPlaylistData(playlist);
  res.json(data.liveCategories);
});

router.get('/channels', async (req, res) => {
  const playlist = await getActivePlaylist();
  if (!playlist) return res.json([]);
  const data = await loadPlaylistData(playlist);
  let channels = data.live;
  const { category } = req.query;
  if (category) {
    channels = channels.filter(c => String(c.group) === String(category));
  }
  res.json(channels);
});

export default router;
