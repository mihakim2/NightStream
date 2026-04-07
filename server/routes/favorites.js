import { Router } from 'express';
import { readStore, writeStore } from '../services/store.js';
import { getActivePlaylist } from '../services/playlist-manager.js';

const router = Router();

async function getFavoritesForPlaylist() {
  const playlist = await getActivePlaylist();
  const playlistId = playlist?.id || 'default';
  const allFavs = await readStore('favorites.json', {});
  return { playlistId, favorites: allFavs[playlistId] || { live: [], vod: [], series: [] } };
}

router.get('/', async (req, res) => {
  const { favorites } = await getFavoritesForPlaylist();
  res.json(favorites);
});

router.post('/', async (req, res) => {
  const { type, id } = req.body;
  if (!type || !id) return res.status(400).json({ error: 'type and id required' });

  const { playlistId, favorites } = await getFavoritesForPlaylist();
  if (!favorites[type]) favorites[type] = [];

  const idx = favorites[type].indexOf(String(id));
  if (idx === -1) {
    favorites[type].push(String(id));
  } else {
    favorites[type].splice(idx, 1);
  }

  const allFavs = await readStore('favorites.json', {});
  allFavs[playlistId] = favorites;
  await writeStore('favorites.json', allFavs);

  res.json(favorites);
});

export default router;
