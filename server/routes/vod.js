import { Router } from 'express';
import { getActivePlaylist, loadPlaylistData } from '../services/playlist-manager.js';

const router = Router();

router.get('/categories', async (req, res) => {
  const playlist = await getActivePlaylist();
  if (!playlist) return res.json([]);
  const data = await loadPlaylistData(playlist);
  res.json(data.vodCategories);
});

router.get('/movies', async (req, res) => {
  const playlist = await getActivePlaylist();
  if (!playlist) return res.json([]);
  const data = await loadPlaylistData(playlist);
  let movies = data.vod;
  const { category } = req.query;
  if (category) {
    movies = movies.filter(m => String(m.group) === String(category));
  }
  res.json(movies);
});

export default router;
